// Move products to another category through the seller edit form (only category_id changes).
// Usage: node move_products.cjs moves.json   (moves.json = [{id, category_id}])  -> move_results.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const moves = JSON.parse(fs.readFileSync(process.argv[2]));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'seller-state.json', viewport: { width: 1400, height: 1600 } });
  const page = await ctx.newPage();
  const results = [];
  for (const m of moves) {
    let status = 0, body = '';
    try {
      await page.goto(`https://seller.jarna.co/products/${m.id}/edit`, { waitUntil: 'networkidle', timeout: 60000 });
      const before = await page.$eval('#selected_category', s => s.value);
      await page.$eval('#selected_category', (s, cat) => { s.value = cat; s.dispatchEvent(new Event('change', { bubbles: true })); }, String(m.category_id));
      // same steps as the page's own submit handler (product.js), without the button UI
      const res = await page.evaluate(async () => {
        const f = document.querySelector('#product-form-submit');
        addVariantInputsToForm();
        const fd = restructureFormData(new FormData(f));
        try {
          const r = await axios.post(f.getAttribute('action'), fd, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
          return { status: r.status, body: JSON.stringify(r.data) };
        } catch (e) { return { status: e.response?.status || 0, body: JSON.stringify(e.response?.data || String(e)) }; }
      });
      status = res.status; body = res.body.slice(0, 300);
      console.log(m.id, before, '->', m.category_id, status, body.slice(0, 120));
    } catch (e) { body = String(e).slice(0, 200); console.log(m.id, 'ERR', body); }
    results.push({ ...m, status, body });
  }
  fs.writeFileSync('move_results.json', JSON.stringify(results, null, 1));
  await browser.close();
})();
