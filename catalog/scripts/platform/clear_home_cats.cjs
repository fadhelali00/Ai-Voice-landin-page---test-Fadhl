// Empty admin > Categories > Sort > Home Parent Categories (hides the top category bar on the app home).
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/categories/sort', { waitUntil: 'networkidle' });
  const token = await page.$eval('input[name=_token]', i => i.value);
  const r = await page.request.post('https://admin.jarna.co/categories/home-categories', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    data: new URLSearchParams({ _token: token }).toString() });
  console.log(r.status(), (await r.text()).slice(0, 300));
  await browser.close();
})();
