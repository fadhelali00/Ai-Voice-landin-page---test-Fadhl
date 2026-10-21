// Save a Home Page Builder layout (same payload as the builder's own Save).  Usage: node save_home_layout.cjs layout.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const layout = JSON.parse(fs.readFileSync(process.argv[2]));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/home-builder', { waitUntil: 'networkidle' });
  const token = await page.$eval('meta[name=csrf-token]', m => m.content);
  const r = await ctx.request.post('https://admin.jarna.co/home-builder/save', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, data: layout });
  console.log(r.status(), (await r.text()).slice(0, 500));
  await browser.close();
})();
