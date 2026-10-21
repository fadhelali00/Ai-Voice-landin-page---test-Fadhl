// Upload a file through a seller-panel upload form and save the server responses + result page.
// Usage: node upload.cjs /products/bulk-upload file.csv tag
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [path, file, tag] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'seller-state.json', viewport: { width: 1400, height: 1800 } });
  const page = await ctx.newPage();
  const log = [];
  page.on('response', async r => {
    const req = r.request();
    if (req.method() === 'POST') {
      let body = ''; try { body = await r.text(); } catch (e) {}
      log.push({ url: r.url(), status: r.status(), body });
    }
  });
  await page.goto('https://seller.jarna.co' + path, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', file);
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Upload")');
  // the page imports products one by one via /process; wait until every product has a result
  const t0 = Date.now();
  for (;;) {
    await page.waitForTimeout(3000);
    const acc = log.find(l => l.body.includes('File accepted'));
    const total = acc ? JSON.parse(acc.body).data.total : null;
    const done = log.filter(l => l.url.endsWith('/process')).length;
    if (total !== null && done >= total) break;
    if (Date.now() - t0 > 1500000) { console.log('timeout', done, '/', total); break; }
  }
  fs.writeFileSync(`upload-${tag}.json`, JSON.stringify(log, null, 1));
  await page.screenshot({ path: `upload-${tag}.png`, fullPage: true });
  for (const l of log) console.log(l.status, l.url, l.body.slice(0, 1500));
  await browser.close();
})();
