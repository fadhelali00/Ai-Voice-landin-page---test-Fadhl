// Link existing Jarna products to the test sellers' stores (admin product edit: add sellers, add their stores to pricing,
// copy store 3's price/special/stock, save). Nothing else on the product changes.
// Usage: node link_test_stores.cjs ids.json 1,10,12   -> link_results.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const ids = JSON.parse(fs.readFileSync(process.argv[2]));
  const sellers = process.argv[3].split(',');
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 2400 } });
  const page = await ctx.newPage();
  // api.jarna.co/storage has no CORS header; without this FilePond can't load the images and the save fails
  await page.route('https://api.jarna.co/storage/**', async route => {
    const r = await route.fetch();
    await route.fulfill({ response: r, headers: { ...r.headers(), 'access-control-allow-origin': 'https://admin.jarna.co' } });
  });
  const results = [];
  for (const id of ids) {
    let status = 0, body = '';
    try {
      await page.goto(`https://admin.jarna.co/products/${id}/edit`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => window.FilePond && [...document.querySelectorAll('.filepond--root')]
        .every(el => { const p = FilePond.find(el); return !p || p.getFiles().every(f => f.status !== 7); }), null, { timeout: 30000 });
      await page.evaluate((sellers) => { const ts = document.querySelector('#adminSellerPicker').tomselect;
        for (const v of sellers) { if (!ts.options[v]) ts.addOption({ value: v, text: 's' + v }); ts.addItem(v); } }, sellers);
      // the sellers' stores load asynchronously; wait until all 7 stores are either priced or offered
      await page.waitForFunction(() => new Set([...document.querySelectorAll('.store-pricing-card, .add-store-pricing-item')]
        .map(e => e.dataset.storeId || e.getAttribute('data-store-id'))).size >= 7, null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(500);
      await page.evaluate(async () => {
        for (let k = 0; k < 12; k++) {
          const have = new Set([...document.querySelectorAll('.store-pricing-card')].map(c => c.dataset.storeId));
          const it = [...document.querySelectorAll('.add-store-pricing-item')].find(e => !have.has(e.dataset.storeId || e.getAttribute('data-store-id')));
          if (!it) break; it.click(); await new Promise(r => setTimeout(r, 500));
        }
      });
      await page.waitForTimeout(800);
      const res = await page.evaluate(async () => {
        const g = n => document.querySelector(`[name="store_pricing[3][${n}]"]`)?.value;
        const price = g('price'), special = g('special_price'), sku = g('sku');
        const stores = [...new Set([...document.querySelectorAll('[name^="store_pricing["]')].map(e => e.name.match(/\[(\d+)\]/)[1]))];
        for (const s of stores) {
          if (s === '3' || s === '7') continue;
          const set = (n, v) => { const e = document.querySelector(`[name="store_pricing[${s}][${n}]"]`); if (e) e.value = v; };
          set('price', price); set('special_price', special || ''); set('stock', '10'); set('sku', sku); set('cost', '0');
        }
        const f = document.querySelector('#product-form-submit');
        if (typeof addVariantInputsToForm === 'function') addVariantInputsToForm();
        const fd = typeof restructureFormData === 'function' ? restructureFormData(new FormData(f)) : new FormData(f);
        try {
          const r = await axios.post(f.getAttribute('action'), fd, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
          return { status: r.status, body: JSON.stringify(r.data).slice(0, 120), stores: stores.join(',') };
        } catch (e) { return { status: e.response?.status || 0, body: JSON.stringify(e.response?.data || String(e)).slice(0, 200), stores: stores.join(',') }; }
      });
      status = res.status; body = res.stores + ' ' + res.body;
    } catch (e) { body = String(e).slice(0, 160); }
    results.push({ id, status, body }); console.log(id, status, body.slice(0, 160));
  }
  fs.writeFileSync('link_results.json', JSON.stringify(results, null, 1));
  await b.close();
})();
