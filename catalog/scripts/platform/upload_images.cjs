// Upload a product-images ZIP through seller > Products > Bulk Upload Images and wait until processing ends.
// Usage: node upload_images.cjs images.zip tag   -> img-<tag>.json (all panel responses) + img-<tag>.png
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [zip, tag] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'seller-state.json', viewport: { width: 1400, height: 2000 } });
  const page = await ctx.newPage();
  const log = [];
  page.on('response', async r => {
    if (!r.url().includes('/products/images-upload')) return;
    let t = ''; try { t = await r.text(); } catch (e) {}
    log.push({ u: r.url(), s: r.status(), t: t.slice(0, 3000) });
  });
  await page.goto('https://seller.jarna.co/products/images-upload', { waitUntil: 'networkidle' });
  await page.setInputFiles('#images-upload-form input[type=file]', zip);
  await page.locator('#images-upload-form button[type=submit]').last().click();
  // wait for the progress text to reach 100% or a final status in the responses (max 30 min)
  const end = Date.now() + 30 * 60 * 1000;
  let last = '';
  while (Date.now() < end) {
    await page.waitForTimeout(5000);
    const body = await page.locator('body').innerText();
    const m = body.match(/Processing images\.\.\.\s*(\d+)%/);
    const pct = m ? m[1] : '?';
    if (pct !== last) { console.log('progress', pct + '%'); last = pct; }
    const done = log.some(l => /"status":"(completed|finished|failed|done)"/.test(l.t));
    if (pct === '100' || done) { await page.waitForTimeout(4000); break; }
  }
  fs.writeFileSync(`img-${tag}.json`, JSON.stringify(log, null, 1));
  await page.screenshot({ path: `img-${tag}.png`, fullPage: true });
  console.log('responses', log.length, 'last', log.length ? log[log.length - 1].t.slice(0, 400) : '');
  await browser.close();
})();
