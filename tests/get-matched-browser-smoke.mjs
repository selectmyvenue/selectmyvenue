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
  page.on('pageerror', error => runtimeErrors.push(error.message));
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
      }, undefined, { timeout: 4000 });
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
        closedVisual.right <= 1;
      assert(visuallyClosed,
        `${target.label}: drawer state says closed but it remains visible: ${JSON.stringify(closedVisual)}`);
    };

    const initialErrors = runtimeErrors.length;
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

    assert.equal(runtimeErrors.length, initialErrors,
      `${target.label}: runtime errors were raised during Get Matched interactions: ${runtimeErrors.slice(initialErrors).join('; ')}`);
    console.log(`PASS Get Matched ${target.label} ${device.name}: asset=${scriptUrl}; opened=${JSON.stringify(opened)}; closed by button, ${device.isMobile ? 'Escape' : 'backdrop'}, and Escape`);
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
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
