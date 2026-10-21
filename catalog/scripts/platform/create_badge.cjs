// Create a product badge in admin > Badges.  Usage: node create_badge.cjs name label bg text border
const { chromium } = require('playwright');
(async () => {
  const [name, label, bg, text, border] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 1800 } });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/badges', { waitUntil: 'networkidle' });
  const token = await page.$eval('#badge-form input[name=_token]', i => i.value);
  const r = await ctx.request.post('https://admin.jarna.co/badges', {
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    multipart: { _token: token, name, label, bg_color: bg, text_color: text, border_color: border } });
  console.log(r.status(), (await r.text()).slice(0, 400));
  await browser.close();
})();
