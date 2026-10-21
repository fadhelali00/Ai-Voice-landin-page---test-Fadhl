// Open a page with the saved session and log XHR/fetch requests (to discover JSON endpoints).
// Usage: PANEL=seller|admin node xhr.cjs /path
const { chromium } = require('playwright');
(async () => {
  const panel = process.env.PANEL, base = `https://${panel}.jarna.co`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: `${panel}-state.json` });
  const page = await ctx.newPage();
  page.on('request', r => { if (['xhr', 'fetch'].includes(r.resourceType())) console.log(r.method(), r.url(), (r.postData() || '').slice(0, 300)); });
  await page.goto(base + process.argv[2], { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await browser.close();
})();
