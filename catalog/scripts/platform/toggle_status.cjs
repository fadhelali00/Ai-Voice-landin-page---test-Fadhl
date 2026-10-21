// Toggle a product's active/inactive status (seller panel's own status button endpoint). Usage: node toggle_status.cjs id
const { chromium } = require('playwright');
(async () => {
  const id = process.argv[2];
  const b = await chromium.launch(); const ctx = await b.newContext({ storageState: 'seller-state.json' });
  const p = await ctx.newPage(); await p.goto('https://seller.jarna.co/products', { waitUntil: 'networkidle' });
  const token = await p.$eval('meta[name=csrf-token]', m => m.content);
  const r = await ctx.request.post(`https://seller.jarna.co/products/${id}/update-status`, { headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
  console.log(id, r.status(), (await r.text()).slice(0, 200)); await b.close();
})();
