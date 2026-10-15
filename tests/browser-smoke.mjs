import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fixedMobileScript = readFileSync(new URL('./fixtures/website-mobile-app-20261002.js', import.meta.url), 'utf8');

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
];

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
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
      // Validate the rest of the live pages with the reviewed fix locally substituted;
      // the production asset remains untouched until its separate PR is approved.
      await page.route('**/website-mobile-app-20261002.js*', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: fixedMobileScript }));
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
