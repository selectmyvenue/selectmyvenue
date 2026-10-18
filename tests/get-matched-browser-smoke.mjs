import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = (process.env.SMV_SITE_BASE_URL || 'https://selectmyvenue.com').replace(/\/$/, '');
const targets = [
  { label: 'homepage', path: '/' },
  { label: 'venue directory', path: '/venues.html' },
  { label: 'venue profile', path: '/venue.html?id=072729f0-3813-4fc0-9dd9-12b93a772235' },
  { label: 'SEO landing page', path: '/wedding-venues-delhi-ncr.html' },
];

async function checkPage(browser, target, device) {
  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: 1,
    isMobile: device.isMobile,
    hasTouch: device.isMobile,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  try {
    const response = await page.goto(base + target.path, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    assert(response && response.status() < 400,
      `${target.label}: expected successful page response, got ${response?.status()}`);

    const tab = page.locator('#smvHomeEnquiryTab');
    const edge = page.locator('.smv-home-enquiry-edge');
    const drawer = page.locator('#smvHomeEnquiryDrawer');
    const backdrop = page.locator('#smvHomeEnquiryBackdrop');
    assert.equal(await tab.count(), 1, `${target.label}: exactly one Get Matched button`);
    assert.equal(await drawer.count(), 1, `${target.label}: exactly one shared enquiry drawer`);
    assert.equal(await backdrop.count(), 1, `${target.label}: exactly one shared backdrop`);
    await tab.waitFor({ state: 'visible', timeout: 10000 });

    // Prove which script URL and response the actual page uses; version-only
    // cache-busting is not treated as proof that the expected source arrived.
    const scriptUrl = await page.locator('script[src*="quick-enquiry.js"]').last().getAttribute('src');
    assert(scriptUrl, `${target.label}: quick-enquiry.js script reference exists`);
    assert(scriptUrl.includes('v=20261018-desktop-drawer-fix-4'),
      `${target.label}: page is not referencing the current quick-enquiry asset revision: ${scriptUrl}`);
    const assetResponse = await page.evaluate(async src => {
      const response = await fetch(src, { cache: 'no-store' });
      const body = await response.text();
      return {
        status: response.status,
        hasDesktopVisibilityFallback: body.includes('100390') && body.includes('translateX(0)'),
        hasDelegatedClickHandler: body.includes('smvHomeEnquiryTab') && body.includes('addEventListener("click"'),
      };
    }, new URL(scriptUrl, base).href);
    assert.equal(assetResponse.status, 200,
      `${target.label}: quick-enquiry.js must be HTTP 200, got ${assetResponse.status} (${scriptUrl})`);
    assert(assetResponse.hasDesktopVisibilityFallback,
      `${target.label}: served quick-enquiry.js is missing the current desktop visibility fallback (${scriptUrl})`);
    assert(assetResponse.hasDelegatedClickHandler,
      `${target.label}: served quick-enquiry.js is missing delegated Get Matched click handling (${scriptUrl})`);

    if (target.label === 'venue directory') {
      const directoryScriptUrl = await page.locator('script[src*="venues.js"]').last().getAttribute('src');
      assert(directoryScriptUrl && directoryScriptUrl.includes('v=20261018-search-header-fallback-1'),
        `venue directory: page must request the current search-initialization asset: ${directoryScriptUrl}`);
      const directoryAsset = await page.evaluate(async src => {
        const response = await fetch(src, { cache: 'no-store' });
        return { status: response.status, body: await response.text() };
      }, new URL(directoryScriptUrl, base).href);
      assert.equal(directoryAsset.status, 200, 'venue directory: venues.js must be served successfully');
      assert(directoryAsset.body.includes('The public directory uses .site-header rather than .page-header'),
        'venue directory: served venues.js does not contain the search-anchor fallback');
    }

    const click = async () => {
      if (device.isMobile) await tab.tap();
      else await tab.click();
      await page.waitForFunction(() => {
        const drawer = document.getElementById('smvHomeEnquiryDrawer');
        const backdrop = document.getElementById('smvHomeEnquiryBackdrop');
        if (!drawer || !backdrop || backdrop.hidden) return false;
        const style = getComputedStyle(drawer);
        const rect = drawer.getBoundingClientRect();
        return drawer.classList.contains('is-open') &&
          drawer.getAttribute('aria-hidden') === 'false' &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity) > 0 &&
          rect.width > 0 && rect.height > 0 &&
          rect.left >= -1 && rect.left < window.innerWidth;
      }, undefined, { timeout: 4000 }).catch(async error => {
        const diagnostic = await page.evaluate(() => {
          const tab = document.getElementById('smvHomeEnquiryTab');
          const edge = document.querySelector('.smv-home-enquiry-edge');
          const drawer = document.getElementById('smvHomeEnquiryDrawer');
          const backdrop = document.getElementById('smvHomeEnquiryBackdrop');
          const snapshot = el => {
            if (!el) return null;
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              id: el.id,
              className: el.className,
              hidden: el.hidden,
              ariaHidden: el.getAttribute('aria-hidden'),
              inlineStyle: el.getAttribute('style'),
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              transform: style.transform,
              zIndex: style.zIndex,
              rect: { left: rect.left, top: rect.top, right: rect.right, width: rect.width, height: rect.height },
            };
          };
          return { tab: snapshot(tab), edge: snapshot(edge), drawer: snapshot(drawer), backdrop: snapshot(backdrop), bodyClass: document.body.className };
        });
        throw new Error(`click did not produce a visible drawer state: ${JSON.stringify(diagnostic)}; ${error.message}`);
      });
    };
    const assertClosed = async action => {
      await action();
      await page.waitForFunction(() => {
        const drawer = document.getElementById('smvHomeEnquiryDrawer');
        return !!drawer && !drawer.classList.contains('is-open') &&
          drawer.getAttribute('aria-hidden') === 'true';
      }, undefined, { timeout: 4000 });
      await page.waitForTimeout(350);
      assert(await backdrop.evaluate(el => el.hidden),
        `${target.label}: backdrop should be hidden after closing`);
      const closedVisual = await drawer.evaluate(el => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          ariaHidden: el.getAttribute('aria-hidden'),
          display: style.display,
          visibility: style.visibility,
          opacity: Number(style.opacity),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      });
      const visuallyClosed = closedVisual.display === 'none' ||
        closedVisual.visibility === 'hidden' || closedVisual.opacity === 0 ||
        closedVisual.right <= 1 ||
        await drawer.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.bottom <= 0 || rect.top >= window.innerHeight;
        });
      assert(visuallyClosed,
        `${target.label}: drawer state says closed but it remains visible: ${JSON.stringify(closedVisual)}`);
    };

    const initialErrors = runtimeErrors.length;
    const initialConsoleErrors = consoleErrors.length;
    await click();
    assert(await drawer.isVisible(), `${target.label}: Get Matched should visibly open the drawer`);
    const opened = await drawer.evaluate(el => ({
      left: Math.round(el.getBoundingClientRect().left),
      display: getComputedStyle(el).display,
      visibility: getComputedStyle(el).visibility,
      transform: getComputedStyle(el).transform,
      ariaHidden: el.getAttribute('aria-hidden'),
      zIndex: getComputedStyle(el).zIndex,
    }));
    assert.equal(opened.ariaHidden, 'false');
    assert(opened.left >= -1 && opened.left < 2,
      `${target.label}: drawer must slide into view; got ${JSON.stringify(opened)}`);
    await assertClosed(() => page.locator('#smvHomeEnquiryClose').click());

    await click();
    if (!device.isMobile) {
      // On phones the drawer intentionally fills the viewport, covering its
      // backdrop; desktop can directly exercise the visible backdrop surface.
      await assertClosed(() => backdrop.click({ position: { x: 900, y: 450 } }));
    } else {
      await assertClosed(() => page.keyboard.press('Escape'));
    }

    await click();
    await assertClosed(() => page.keyboard.press('Escape'));

    if (!device.isMobile) {
      const before = await edge.boundingBox();
      assert(before, `${target.label}: draggable banner has a desktop bounding box`);
      const startX = before.x + before.width / 2;
      const startY = before.y + before.height / 2;
      const targetY = Math.min(device.viewport.height - 20, startY + 90);
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, targetY, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(100);
      const dragState = await page.evaluate(() => {
        const drawer = document.getElementById('smvHomeEnquiryDrawer');
        const backdrop = document.getElementById('smvHomeEnquiryBackdrop');
        return { drawerOpen: drawer?.classList.contains('is-open'), ariaHidden: drawer?.getAttribute('aria-hidden'), backdropHidden: backdrop?.hidden };
      });
      assert.equal(dragState.drawerOpen, false, `${target.label}: dragging the floating banner must not open the enquiry drawer: ${JSON.stringify(dragState)}`);
      assert.equal(dragState.ariaHidden, 'true');
      assert.equal(dragState.backdropHidden, true);
      const after = await edge.boundingBox();
      assert(after && Math.abs(after.y - before.y) > 25, `${target.label}: desktop drag should move the banner; before=${JSON.stringify(before)}, after=${JSON.stringify(after)}`);
      await page.waitForTimeout(450);
      assert.equal(await drawer.getAttribute('aria-hidden'), 'true', `${target.label}: delayed drag click must not open the enquiry drawer`);
      console.log(`PASS desktop banner drag ${target.label}: moved by ${Math.round(Math.abs(after.y - before.y))}px without opening the drawer`);
    }

    assert.equal(runtimeErrors.length, initialErrors,
      `${target.label}: runtime JavaScript errors were raised during interactions: ${runtimeErrors.slice(initialErrors).join('; ')}`);
    assert.equal(consoleErrors.length, initialConsoleErrors,
      `${target.label}: console errors were raised during interactions: ${consoleErrors.slice(initialConsoleErrors).join('; ')}`);
    console.log(`PASS Get Matched ${target.label} ${device.name}: asset=${scriptUrl}; opened=${JSON.stringify(opened)}; closed by button, ${device.isMobile ? 'Escape' : 'backdrop'}, and Escape`);
  } finally {
    await context.close();
  }
}


async function checkMobileVenueFilters(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  try {
    // Keep the drawer regression deterministic and read-only: fixture two public
    // venue records instead of depending on live Supabase availability or data.
    await page.route('**/rest/v1/rpc/smv_public_venues*', async route => {
      const corsHeaders = {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'apikey, authorization, content-type, x-client-info, accept-profile, content-profile, prefer',
        'access-control-max-age': '86400',
      };
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders, body: '' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify([
          {
            id: 'qa-venue-banquet', venue_name: 'QA Banquet Hall', venue_type: 'Banquet Hall',
            description: 'Browser-test fixture only', city: 'Delhi', area: 'Janakpuri',
            capacity_min: 50, capacity_max: 250, price_min_per_person: 1200,
            price_max_per_person: 1800, food_veg: true, food_non_veg: true,
            parking_available: true, rooms_available: false, catering_available: true,
            decoration_available: true, cover_image_url: '', featured: false,
            event_types: ['Wedding', 'Reception'], venue_status: 'approved',
            verification_status: 'verified', public_listing_enabled: true,
          },
          {
            id: 'qa-venue-farmhouse', venue_name: 'QA Farmhouse', venue_type: 'Farmhouse',
            description: 'Browser-test fixture only', city: 'Gurgaon', area: 'Sector 57',
            capacity_min: 100, capacity_max: 500, price_min_per_person: 1800,
            price_max_per_person: 3000, food_veg: true, food_non_veg: false,
            parking_available: true, rooms_available: true, catering_available: true,
            decoration_available: false, cover_image_url: '', featured: false,
            event_types: ['Wedding', 'Birthday'], venue_status: 'approved',
            verification_status: 'verified', public_listing_enabled: true,
          },
        ]),
      });
    });
    const response = await page.goto(base + '/venues.html', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    assert(response && response.status() < 400,
      `mobile venue filters ${width}px: expected successful page response, got ${response?.status()}`);

    const toggle = page.locator('#smvMobileFilterToggle');
    const shell = page.locator('.venue-filter-shell');
    const backdrop = page.locator('#smvMobileFilterBackdrop');
    await toggle.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(() => {
      const shell = document.querySelector('.venue-filter-shell');
      return !!shell && !/Loading filters/i.test(shell.textContent || '');
    }, undefined, { timeout: 10000 });

    const toggleBox = await toggle.boundingBox();
    assert(toggleBox && toggleBox.width > 0 && toggleBox.height > 0,
      `mobile venue filters ${width}px: filter toggle has no tappable bounds`);
    await toggle.tap({ timeout: 4000 }).catch(error => { throw new Error('filter toggle tap failed: ' + error.message); });
    await page.waitForFunction(() => document.body.classList.contains('smv-mobile-filter-open'),
      undefined, { timeout: 4000 });

    const opened = await page.evaluate(() => {
      const shell = document.querySelector('.venue-filter-shell');
      const backdrop = document.querySelector('#smvMobileFilterBackdrop');
      const toggle = document.querySelector('#smvMobileFilterToggle');
      if (!shell || !backdrop || !toggle) return null;
      const style = getComputedStyle(shell);
      const rect = shell.getBoundingClientRect();
      return {
        display: style.display,
        position: style.position,
        visibility: style.visibility,
        zIndex: style.zIndex,
        left: style.left,
        right: style.right,
        top: style.top,
        bottom: style.bottom,
        selectorMatches: shell.matches('html body.smv-mobile-filter-open .venue-filter-shell'),
        mainContainsShell: !!shell.closest('main.venue-directory-main'),
        overrideRulePresent: (document.getElementById('smv-browse-layout-fix-v2')?.textContent || '').includes('html body.smv-mobile-filter-open .venue-filter-shell'),
        rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
        backdropHidden: backdrop.hidden,
        expanded: toggle.getAttribute('aria-expanded'),
      };
    });
    assert(opened, `mobile venue filters ${width}px: drawer elements missing`);
    assert.notEqual(opened.display, 'none',
      `mobile venue filters ${width}px: drawer is still display:none: ${JSON.stringify(opened)}`);
    assert.notEqual(opened.visibility, 'hidden',
      `mobile venue filters ${width}px: drawer is hidden: ${JSON.stringify(opened)}`);
    assert.equal(opened.position, 'fixed',
      `mobile venue filters ${width}px: drawer should be fixed to viewport: ${JSON.stringify(opened)}`);
    assert(opened.rect.width >= width - 2 && opened.rect.height >= 780 &&
      opened.rect.left <= 1 && opened.rect.right >= width - 1 &&
      opened.rect.top >= 59 && opened.rect.top <= 61 && opened.rect.bottom >= 843,
      `mobile venue filters ${width}px: drawer does not cover the usable viewport from the expected 60px header offset: ${JSON.stringify(opened)}`);
    assert.equal(opened.backdropHidden, false,
      `mobile venue filters ${width}px: backdrop should be visible while open`);
    assert.equal(opened.expanded, 'true',
      `mobile venue filters ${width}px: toggle aria-expanded should be true`);

    // Ensure the drawer has real filter controls, not just an empty overlay.
    assert(await shell.locator('.smv-filter-choice').count() > 0,
      `mobile venue filters ${width}px: filter choices did not render`);
    const typeChoice = shell.locator('[data-list="type"] .smv-filter-choice').nth(1);
    if (await typeChoice.count()) {
      const before = await page.locator('#smvMobileFilterCount').textContent();
      await typeChoice.tap({ timeout: 4000 }).catch(error => { throw new Error('filter choice tap failed: ' + error.message); });
      await page.waitForFunction(() => {
        const count = document.getElementById('smvMobileFilterCount');
        const results = document.getElementById('smvMobileResultCount');
        return !!count && /[1-9]\d* active/.test(count.textContent || '') &&
          !!results && results.textContent === '1 venue';
      }, undefined, { timeout: 5000 });
      assert.notEqual(await page.locator('#smvMobileFilterCount').textContent(), before,
        `mobile venue filters ${width}px: choosing a filter did not update the active count`);
      assert.equal(await page.locator('#smvMobileResultCount').textContent(), '1 venue',
        `mobile venue filters ${width}px: filtering did not update the venue result count`);
    }

    const done = shell.locator('#smvMobileFilterDone');
    const doneBox = await done.boundingBox();
    assert(doneBox && doneBox.width > 0 && doneBox.height > 0,
      `mobile venue filters ${width}px: Done button has no tappable bounds`);
    const doneHit = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return { tag: el?.tagName, id: el?.id, className: typeof el?.className === 'string' ? el.className : '', insideDone: !!el?.closest('#smvMobileFilterDone') };
    }, { x: doneBox.x + doneBox.width / 2, y: doneBox.y + doneBox.height / 2 });
    assert(doneHit.insideDone,
      `mobile venue filters ${width}px: Done button is covered by another element: ${JSON.stringify(doneHit)}`);
    await done.tap({ timeout: 4000 });
    await page.waitForFunction(() => !document.body.classList.contains('smv-mobile-filter-open'), undefined, { timeout: 4000 });
    assert(await backdrop.evaluate(el => el.hidden),
      `mobile venue filters ${width}px: Done should hide the backdrop`);

    await toggle.tap({ timeout: 4000 }).catch(error => { throw new Error('filter toggle tap failed: ' + error.message); });
    await page.waitForFunction(() => document.body.classList.contains('smv-mobile-filter-open'), undefined, { timeout: 4000 });
    await backdrop.tap({ position: { x: Math.max(5, width - 5), y: 20 }, timeout: 4000 }).catch(error => { throw new Error('backdrop tap failed: ' + error.message); });
    await page.waitForFunction(() => !document.body.classList.contains('smv-mobile-filter-open'), undefined, { timeout: 4000 });
    assert(await backdrop.evaluate(el => el.hidden),
      `mobile venue filters ${width}px: backdrop tap should close the drawer`);

    await toggle.tap({ timeout: 4000 }).catch(error => { throw new Error('filter toggle tap failed: ' + error.message); });
    await page.waitForFunction(() => document.body.classList.contains('smv-mobile-filter-open'), undefined, { timeout: 4000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.body.classList.contains('smv-mobile-filter-open'), undefined, { timeout: 4000 });
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false',
      `mobile venue filters ${width}px: Escape should reset aria-expanded`);
    assert.deepEqual(runtimeErrors, [],
      `mobile venue filters ${width}px: runtime errors: ${runtimeErrors.join('; ')}`);
    assert.deepEqual(consoleErrors, [],
      `mobile venue filters ${width}px: console errors: ${consoleErrors.join('; ')}`);
    console.log(`PASS mobile venue filters ${width}px: open, viewport geometry, choices, Done, backdrop and Escape`);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const target of targets) {
    for (const device of [
      { name: 'desktop', viewport: { width: 1365, height: 900 }, isMobile: false },
      { name: 'mobile-390', viewport: { width: 390, height: 844 }, isMobile: true },
    ]) {
      try {
        await checkPage(browser, target, device);
      } catch (error) {
        failures.push(`${target.label} ${device.name}: ${error.message}`);
        console.error(`FAIL Get Matched ${target.label} ${device.name}: ${error.message}`);
      }
    }
  }

  for (const width of [320, 360, 390, 430, 767]) {
    try {
      await checkMobileVenueFilters(browser, width);
    } catch (error) {
      failures.push(`mobile venue filters ${width}px: ${error.message}`);
      console.error(`FAIL mobile venue filters ${width}px: ${error.message}`);
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
