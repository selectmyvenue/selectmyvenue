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
try {
  await testQuickEnquiryMock();
  for (const path of paths) {
    for (const viewport of [
      { name: 'mobile-android', ...devices['Pixel 7'] },
      { name: 'desktop', viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 },
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
      try {
        const response = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
        assert(response && response.status() < 400, `HTTP status for ${path}: ${response?.status()}`);
        await page.locator('body').waitFor({ state: 'visible' });
        assert((await page.title()).trim().length > 0, `missing document title at ${path}`);
        if (viewport.name === "mobile-android" && path === "/") {
          const matchedEdge = page.locator(".smv-home-enquiry-edge");
          const matchedTab = page.locator("#smvHomeEnquiryTab");
          const drawer = page.locator("#smvHomeEnquiryDrawer");
          assert(await matchedEdge.isVisible(), "Get Matched banner should be visible on mobile homepage");
          const beforeTop = await matchedEdge.evaluate(el => el.getBoundingClientRect().top);
          await matchedEdge.evaluate(el => {
            const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
            el.dispatchEvent(new PointerEvent("pointerdown", { bubbles:true, pointerId:77, pointerType:"touch", isPrimary:true, button:0, clientX:x, clientY:y }));
            el.dispatchEvent(new PointerEvent("pointermove", { bubbles:true, cancelable:true, pointerId:77, pointerType:"touch", isPrimary:true, buttons:1, clientX:x, clientY:y+70 }));
            el.dispatchEvent(new PointerEvent("pointerup", { bubbles:true, pointerId:77, pointerType:"touch", isPrimary:true, button:0, clientX:x, clientY:y+70 }));
          });
          const afterTop = await matchedEdge.evaluate(el => el.getBoundingClientRect().top);
          assert(Math.abs(afterTop-beforeTop) > 25, "Get Matched banner should move vertically after a drag");
          assert(!(await drawer.evaluate(el => el.classList.contains("is-open"))), "Dragging should not open the enquiry drawer");
          await matchedTab.click();
          await page.waitForFunction(() => document.getElementById("smvHomeEnquiryDrawer")?.classList.contains("is-open"));
          assert(await drawer.isVisible(), "Get Matched tap should open the enquiry drawer");
          await page.locator("#smvHomeEnquiryClose").click();
          await page.waitForFunction(() => !document.getElementById("smvHomeEnquiryDrawer")?.classList.contains("is-open"));
        }
        if (viewport.name === "mobile-android") {
          const menuButton = page.locator("#menuToggle");
          const mainNav = page.locator("#mainNav");
          if (await menuButton.count()) {
            await menuButton.click();
            await page.waitForFunction(() => document.getElementById("menuToggle")?.getAttribute("aria-expanded") === "true" && document.getElementById("mainNav")?.classList.contains("open"));
            assert(await mainNav.isVisible(), `mobile menu should be visible after opening at ${path}`);
            await menuButton.click();
            await page.waitForFunction(() => document.getElementById("menuToggle")?.getAttribute("aria-expanded") === "false" && !document.getElementById("mainNav")?.classList.contains("open"));
            const moreButton = page.locator(".smv-nav-more");
            if (await moreButton.count()) {
              await moreButton.click();
              await page.waitForFunction(() => document.getElementById("menuToggle")?.getAttribute("aria-expanded") === "true" && document.getElementById("mainNav")?.classList.contains("open"));
              assert(await mainNav.isVisible(), `bottom More control should open navigation at ${path}`);
              await moreButton.click();
              await page.waitForFunction(() => document.getElementById("menuToggle")?.getAttribute("aria-expanded") === "false" && !document.getElementById("mainNav")?.classList.contains("open"));
            }
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
