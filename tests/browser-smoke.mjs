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
  // Remaining public URLs from sitemap.xml; exercise every static SEO/legal page.
  '/delhi-ncr-venues.html',
  '/seo-searches.html',
  '/party-halls-delhi-ncr.html',
  '/corporate-event-venues-delhi-ncr.html',
  '/banquet-halls-in-noida.html',
  '/party-halls-in-delhi.html',
  '/party-halls-in-gurgaon.html',
  '/party-halls-in-noida.html',
  '/engagement-venues-delhi-ncr.html',
  '/birthday-party-venues-delhi-ncr.html',
  '/reception-venues-delhi-ncr.html',
  '/wedding-lawns-delhi-ncr.html',
  '/wedding-farmhouses-delhi-ncr.html',
  '/affordable-wedding-venues-delhi-ncr.html',
  '/luxury-wedding-venues-delhi-ncr.html',
  '/wedding-venues-with-rooms-delhi-ncr.html',
  '/wedding-venues-with-parking-delhi-ncr.html',
  '/pure-veg-wedding-venues-delhi-ncr.html',
  '/privacy.html',
  '/terms.html',
  '/wedding-venues-in-chhatarpur.html',
  '/wedding-venues-gt-karnal-road.html',
  '/wedding-venues-in-kapashera.html',
  '/venues-for-every-event-delhi-ncr.html',
  // Every remaining venue profile URL currently listed in sitemap.xml.
  '/venue.html?id=2ca7f0d4-2b46-473f-a733-1a703ce78aa2',
  '/venue.html?id=2e50fb82-d85f-4c14-8640-ab6a92641404',
  '/venue.html?id=32fa6096-14ce-48c6-909b-a8836d4a5c3f',
  '/venue.html?id=35594267-72ef-4f97-9c44-e7ab2838d786',
  '/venue.html?id=3bb9f522-156a-4417-bfa2-5dfb3915d2d2',
  '/venue.html?id=416d7571-1b79-4723-bc99-8b236826699d',
  '/venue.html?id=548b548b-7bbf-4e48-97e2-e0003d791c5e',
  '/venue.html?id=6bc42744-dd8e-4e72-a7f8-01dd57f902c1',
  '/venue.html?id=7d47f088-ceea-43fa-9c44-e7ab2838d786',
  '/venue.html?id=7e66f4eb-436b-4906-8f1c-a28a05a0d0d1',
  '/venue.html?id=8318c273-ab5e-4c50-b562-1e52de3ae560',
  '/venue.html?id=838f92f0-91c6-4143-8442-be4d46094283',
  '/venue.html?id=83cabb7d-196d-4181-bfc6-49cf4988035a',
  '/venue.html?id=8b1f25a1-367d-4473-b213-06dc19196e11',
  '/venue.html?id=8d364f9e-c67a-4205-b2fa-3126a6c50071',
  '/venue.html?id=9134c560-9111-4113-a76c-5b0d961e4fae',
  '/venue.html?id=a8684463-d451-429c-bcf8-7df02ae85e17',
  '/venue.html?id=a8cff04f-129b-4b96-ad81-76124a3e4c67',
  '/venue.html?id=b9b4fab8-91ef-4932-90f6-0c6517a7facb',
  '/venue.html?id=be0988e8-5e9c-4668-ae25-4d2ecf5dc7dd',
  '/venue.html?id=c8f97946-6bb2-4f3b-8ae9-0341cb720eb2',
  '/venue.html?id=d9da72b3-8a44-4c9c-9448-432032f45add',
  '/venue.html?id=fd910df3-a01b-40bf-969a-9f0ee5bfc92c',
  '/wedding-venues-in-delhi.html',
  '/wedding-venues-in-gurgaon.html',
  '/wedding-venues-in-noida.html',
  '/list-your-venue.html',
  '/venue.html',
  '/venue.html?id=072729f0-3813-4fc0-9dd9-12b93a772235',
];
const fullViewportPaths = new Set(paths.slice(0, 15));
const allViewports = [
  { name: 'mobile-320', viewport: { width: 320, height: 780 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  { name: 'mobile-360', viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  { name: 'mobile-390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  { name: 'mobile-430', viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  { name: 'tablet', viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: false, hasTouch: true },
  { name: 'desktop', viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];
const sitemapViewports = allViewports.filter(viewport => ['mobile-390', 'desktop'].includes(viewport.name));

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
    for (const viewport of (fullViewportPaths.has(path) ? allViewports : sitemapViewports)) {
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
