// Assign a badge to products (admin > Products > bulk badge).  Usage: node assign_badge.cjs badge_id id,id,...
const { chromium } = require('playwright');
(async () => {
  const [badge, ids] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/products', { waitUntil: 'networkidle' });
  const token = await page.$eval('meta[name=csrf-token]', m => m.content);
  const r = await ctx.request.post('https://admin.jarna.co/badges/products/bulk-assign', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    data: { product_ids: ids.split(',').map(Number), badge_id: badge } });
  console.log(r.status(), (await r.text()).slice(0, 300));
  await browser.close();
})();
