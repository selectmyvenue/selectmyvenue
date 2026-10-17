import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';
const base = (process.env.SMV_SITE_BASE_URL || 'https://selectmyvenue.com').replace(/\/$/, '');
const paths = [
  '/',
  '/venues.html',
  '/venues-in-delhi.html',
  '/venues-in-gurgaon.html',
  '/venues-in-noida.html',
  '/venues-in-faridabad.html',
  '/banquet-halls-in-delhi.html',
  '/banquet-halls-in-gurgaon.html',
  '/wedding-venues-delhi-ncr.html',
  '/wedding-venues-in-delhi.html',
  '/wedding-venues-in-gurgaon.html',
  '/wedding-venues-in-noida.html',
  '/list-your-venue.html',
  '/venue.html',
  '/venue.html?id=072729f0-3813-4fc0-9dd9-12b93a772235',
];

const browser = await chromium.launch({ headless: true });
const failures = [];
async function testQuickEnquiryMock() {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.route('**/googletagmanager.com/**', route => route.abort());
    await page.setContent(`<!doctype html><html><head><title>Mock enquiry test</title></head><body>
      <form data-smv-quick-enquiry data-source="Website - Mock E2E">
        <input name="customer_name" value="SMV QA Customer">
        <input name="mobile" value="+91 98765 43210">
        <select name="occasion"><option value="Wedding" selected>Wedding</option></select>
        <select name="location"><option value="Delhi" selected>Delhi</option></select>
        <input name="event_date" type="date">
        <input name="guests" type="number" value="250">
        <input name="budget_per_person" type="number" value="1500">
        <textarea name="requirements">Mock-only QA. Do not create a real enquiry.</textarea>
        <button type="submit">Submit mock enquiry</button>
        <p data-quick-message aria-live="polite"></p>
      </form>
    </body></html>`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.__smvGoogleAdsTagInstalled = true;
      window.gtag = () => {};
      window.supabase = {
        createClient: () => ({
          from: table => ({
            insert: async payload => {
              window.__smvMockInsertCalls.push({ table, payload });
              return { error: null };
            },
          }),
        }),
      };
      window.__smvMockInsertCalls = [];
    });
    await page.addScriptTag({ path: 'quick-enquiry.js' });
    await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
    await page.locator('form[data-source="Website - Mock E2E"] [name="event_date"]').evaluate(el => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      el.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    });
    await page.locator('form[data-source="Website - Mock E2E"] button[type="submit"]').click();
    await page.waitForFunction(() => document.querySelector('[data-quick-message]')?.classList.contains('success'));
    const calls = await page.evaluate(() => window.__smvMockInsertCalls);
    assert.equal(calls.length, 1, 'one mocked insert should be issued');
    assert.equal(calls[0].table, 'customer_enquiries');
    const payload = calls[0].payload;
    assert.equal(payload.customer_name, 'SMV QA Customer');
    assert.equal(payload.mobile, '9876543210');
    assert.equal(payload.location, 'Delhi');
    assert.equal(payload.occasion, 'Wedding');
    assert.equal(payload.guests, 250);
    assert.equal(payload.budget_per_person, 1500);
    assert.equal(payload.source, 'Website - Mock E2E');
    assert.equal(payload.status, 'new');
    assert.equal(payload.assigned_to, null);
    assert.equal(payload.follow_up_at, null);
    assert.equal(payload.last_contacted_at, null);
    assert(payload.requirements.includes('Mock-only QA. Do not create a real enquiry.'));
    assert(payload.requirements.includes('Submitted page:'));
    assert.deepEqual(Object.keys(payload).sort(), [
      'assigned_to','budget_per_person','email','event_date','food_preference','follow_up_at',
      'guests','last_contacted_at','location','mobile','occasion','requirements','source',
      'status','customer_name'
    ].sort(), 'payload must use the existing customer_enquiries fields only');
    console.log('PASS mocked quick-enquiry submission: payload mapping, source, requirements and existing CRM fields; no real insert');
  } finally {
    await context.close();
  }
}

async function testMobileMenuOptionNavigation() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    assert(response && response.status() < 400, 'homepage should load for menu-option test');
    const menuButton = page.locator('#menuToggle');
    const mainNav = page.locator('#mainNav');
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();
    await page.waitForFunction(() => document.getElementById('mainNav')?.classList.contains('open'), undefined, { timeout: 5000 });
    const venuesLink = page.locator('#mainNav a[href="venues.html"]');
    assert(await venuesLink.isVisible(), 'Browse Venues menu option should be visible when menu opens');
    await venuesLink.click();
    await page.waitForFunction(() => location.pathname.endsWith('/venues.html'), undefined, { timeout: 5000 });
    assert(!(await mainNav.evaluate(el => el.classList.contains('open'))), 'menu should close after selecting a navigation option');
    console.log('PASS mobile hamburger option: Browse Venues is clickable, navigates, and closes menu');
  } finally {
    await context.close();
  }
}

try {
  await testQuickEnquiryMock();
  await testMobileMenuOptionNavigation();
  for (const path of paths) {
    for (const viewport of [
      { name: 'mobile-320', viewport: { width: 320, height: 780 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
      { name: 'mobile-360', viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
      { name: 'mobile-390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
      { name: 'mobile-430', viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
      { name: 'tablet', viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: false, hasTouch: true },
      { name: 'desktop', viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    ]) {
      const context = await browser.newContext({
        viewport: viewport.viewport,
        deviceScaleFactor: viewport.deviceScaleFactor || 1,
        isMobile: Boolean(viewport.isMobile),
        hasTouch: Boolean(viewport.hasTouch),
      });
      const page = await context.newPage();
      const pageErrors = [];
      await page.addInitScript(() => {
        window.addEventListener('error', event => {
          if (event.message) window.__smvBrowserErrors = [...(window.__smvBrowserErrors || []), `${event.message} at ${event.filename || 'inline'}:${event.lineno || 0}:${event.colno || 0}`];
        });
      });
      page.on('pageerror', error => pageErrors.push(`${error.message} | ${error.stack || ''}`));
      if (path === '/' && viewport.name.startsWith('mobile-')) {
        // Stub the read-only public venue RPC so the current marketplace filter
        // UI is tested deterministically without relying on production venue data.
        await page.route('**/rest/v1/rpc/smv_public_venues*', route => route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]',
        }));

      }
      try {
        const response = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
        assert(response && response.status() < 400, `HTTP status for ${path}: ${response?.status()}`);
        await page.locator('body').waitFor({ state: 'visible' });
        assert((await page.title()).trim().length > 0, `missing document title at ${path}`);
        if (viewport.name.startsWith('mobile-')) {
          await page.waitForSelector('#menuToggle', { state: 'visible', timeout: 10000 });
          const menuButton = page.locator('#menuToggle');
          const mainNav = page.locator('#mainNav');
          assert.equal(await menuButton.count(), 1, `exactly one mobile menu button should exist at ${path}`);
          assert.equal(await mainNav.count(), 1, `exactly one main navigation should exist at ${path}`);
          await menuButton.click();
          await page.waitForFunction(() => document.getElementById('menuToggle')?.getAttribute('aria-expanded') === 'true' && document.getElementById('mainNav')?.classList.contains('open'), undefined, { timeout: 5000 }).catch(error => { throw new Error('MENU OPEN: ' + error.message); });
          assert(await mainNav.isVisible(), `mobile menu should open at ${path}`);
          await menuButton.click();
          await page.waitForFunction(() => document.getElementById('menuToggle')?.getAttribute('aria-expanded') === 'false' && !document.getElementById('mainNav')?.classList.contains('open'), undefined, { timeout: 5000 }).catch(error => { throw new Error('MENU CLOSE: ' + error.message); });
          if (path === '/') {
            // Regression: the active marketplace filter panel must open from its own
            // mobile toggle, despite the redesign stylesheet's display:none!important.
            // This test never submits an enquiry or writes to Supabase.
            await page.waitForSelector('#featuredVenues .smv-home-market-filter-toggle', { state: 'visible', timeout: 15000 });
            const filterToggle = page.locator('#featuredVenues .smv-home-market-filter-toggle');
            const filterPanel = page.locator('#featuredVenues .smv-home-filter-panel');
            await filterToggle.click();
            await page.waitForFunction(() => {
              const panel = document.querySelector('#featuredVenues .smv-home-filter-panel');
              return !!panel && panel.classList.contains('open') && getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().height > 0;
            }, undefined, { timeout: 3000 }).catch(error => { throw new Error('HOMEPAGE FILTER OPEN: ' + error.message); });
            assert(await page.locator('#featuredVenues .smv-filter-choice').first().isVisible(), 'current marketplace filter choices must be visible after tapping Filter Venues');
            await filterToggle.click();
            await page.waitForFunction(() => {
              const panel = document.querySelector('#featuredVenues .smv-home-filter-panel');
              return !!panel && !panel.classList.contains('open') && getComputedStyle(panel).display === 'none';
            }, undefined, { timeout: 3000 }).catch(error => { throw new Error('HOMEPAGE FILTER CLOSE: ' + error.message); });

            await page.waitForSelector('.smv-home-enquiry-edge', { state: 'visible', timeout: 10000 });
            const edge = page.locator('.smv-home-enquiry-edge');
            const tab = page.locator('#smvHomeEnquiryTab');
            const drawer = page.locator('#smvHomeEnquiryDrawer');
            assert.equal(await tab.count(), 1, 'exactly one Get Matched tab must exist on mobile homepage');
            const before = await edge.evaluate(el => el.getBoundingClientRect().top);
            const rect = await edge.boundingBox();
            assert(rect, 'Get Matched banner must have a hit area');
            assert(rect.x <= 2, `Get Matched banner must stay attached to the left edge on mobile (x=${rect.x})`);
            await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
            await page.mouse.down();
            await page.mouse.move(rect.x + rect.width / 2, Math.min(page.viewportSize().height - 12, rect.y + rect.height / 2 + 70), { steps: 8 });
            await page.mouse.up();
            await page.waitForTimeout(100);
            const after = await edge.evaluate(el => el.getBoundingClientRect().top);
            assert(Math.abs(after - before) > 25, 'Get Matched banner must move vertically after drag');
            assert(!(await drawer.evaluate(el => el.classList.contains('is-open'))), 'Dragging must not open the enquiry drawer');

            // Exercise the actual touch path as well as mouse input. Reset the
            // tab to a known central position first so the second drag has room
            // to move even after the mouse-drag test above.
            await edge.evaluate(el => {
              el.style.setProperty('top', '44%', 'important');
              el.style.setProperty('transform', 'translateY(-50%)', 'important');
            });
            await page.waitForTimeout(50);
            const touchSession = await context.newCDPSession(page);
            const touchStartBox = await edge.boundingBox();
            assert(touchStartBox, 'Get Matched banner must have a touch hit area');
            const touchX = Math.min(page.viewportSize().width - 8, touchStartBox.x + 28);
            const touchStartY = touchStartBox.y + touchStartBox.height / 2;
            const touchPoints = (y) => [{ id: 1, x: touchX, y }];
            const touchBefore = await edge.evaluate(el => el.getBoundingClientRect().top);
            await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touchPoints(touchStartY) });
            for (let i = 1; i <= 8; i++) {
              await touchSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touchPoints(touchStartY + 56 * i / 8) });
            }
            await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await page.waitForTimeout(100);
            const touchAfter = await edge.evaluate(el => el.getBoundingClientRect().top);
            assert(Math.abs(touchAfter - touchBefore) > 25, 'Get Matched banner must move vertically on a real touch drag');
            assert(!(await drawer.evaluate(el => el.classList.contains('is-open'))), 'Touch-dragging must not open the enquiry drawer');

            await page.waitForTimeout(550);
            // Verify a genuine touchscreen tap after the drag gesture.
            await tab.tap();
            await page.waitForFunction(() => document.getElementById('smvHomeEnquiryDrawer')?.classList.contains('is-open'), undefined, { timeout: 1500 }).catch(error => { throw new Error('GET MATCHED OPEN: ' + error.message); });
            assert(await drawer.isVisible(), 'Tapping Get Matched must open the enquiry drawer');
            await page.locator('#smvHomeEnquiryClose').click();
            await page.waitForFunction(() => !document.getElementById('smvHomeEnquiryDrawer')?.classList.contains('is-open'), undefined, { timeout: 5000 }).catch(error => { throw new Error('DRAWER CLOSE: ' + error.message); });
          }
        }
        const metrics = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          h1Count: document.querySelectorAll('h1').length,
          formCount: document.querySelectorAll('form').length,
          overflowElements: [...document.querySelectorAll('body *')]
            .map(el => ({tag: el.tagName, id: el.id, className: typeof el.className === 'string' ? el.className.slice(0, 120) : '', width: Math.round(el.getBoundingClientRect().width), right: Math.round(el.getBoundingClientRect().right), text: (el.innerText || '').trim().slice(0, 70)}))
            .filter(el => el.width > document.documentElement.clientWidth + 2 || el.right > document.documentElement.clientWidth + 2)
            .slice(0, 12),
        }));
        if (metrics.bodyWidth > metrics.viewport + 2 && metrics.documentWidth <= metrics.viewport + 2) {
          console.warn(`DIAGNOSTIC body-only overflow (often off-canvas fixed panels): ${path} (${viewport.name}) ${JSON.stringify(metrics.overflowElements)}`);
        }
        assert(
          metrics.documentWidth <= metrics.viewport + 2,
          `document horizontal overflow at ${path} (${viewport.name}): ${JSON.stringify(metrics)}`,
        );
        if (path !== '/venue.html') {
          assert(metrics.h1Count >= 1, `missing H1 at ${path}`);
        }
        const windowErrors = await page.evaluate(() => window.__smvBrowserErrors || []);
        assert.deepEqual([...pageErrors, ...windowErrors], [], `JavaScript runtime errors at ${path}: ${[...pageErrors, ...windowErrors].join('; ')}`);
        console.log(`PASS ${path} ${viewport.name} title="${(await page.title()).trim()}" forms=${metrics.formCount}`);
      } catch (error) {
        failures.push(`${path} ${viewport.name}: ${error.message}`);
        console.error(`FAIL ${path} ${viewport.name}: ${error.message}`);
      } finally {
        await context.close();
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
