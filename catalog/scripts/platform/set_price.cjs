// For each product: VAT tax group (1) + "price includes tax", stock = 10 in every store row and, when given, the price
// (and special price) in every store row. Nothing else changes.
// Submits through the page's own handler steps (product.js), like move_products.cjs.
// Usage: node set_price.cjs items.json -> fix_results.json   (items.json = [{id, price, special?}])
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const items = JSON.parse(fs.readFileSync(process.argv[2]));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'seller-state.json', viewport: { width: 1400, height: 1600 } });
  const page = await ctx.newPage();
  // api.jarna.co/storage sends no CORS header, so the editor's FilePond cannot load existing images and the save fails
  // with "Main image is required". Serve those image requests with an Allow-Origin header so the images load unchanged.
  await page.route('https://api.jarna.co/storage/**', async route => {
    const r = await route.fetch();
    await route.fulfill({ response: r, headers: { ...r.headers(), 'access-control-allow-origin': 'https://seller.jarna.co' } });
  });
  const results = [];
  for (const it of items) {
    const id = it.id;
    let status = 0, body = '';
    try {
      await page.goto(`https://seller.jarna.co/products/${id}/edit`, { waitUntil: 'networkidle', timeout: 60000 });
      // wait until every FilePond file finished loading (status 7 = LOADING, 8 = LOAD_ERROR)
      await page.waitForFunction(() => window.FilePond && [...document.querySelectorAll('.filepond--root')]
        .every(el => { const p = FilePond.find(el); return !p || p.getFiles().every(f => f.status !== 7); }), null, { timeout: 30000 });
      const loadErr = await page.evaluate(() => [...document.querySelectorAll('.filepond--root')].some(el => { const p = FilePond.find(el); return p && p.getFiles().some(f => f.status === 8); }));
      if (loadErr) throw new Error('image load error');
      const res = await page.evaluate(async (it) => {
        const f = document.querySelector('#product-form-submit');
        document.querySelector('#is-inclusive-tax-input').value = '1';
        const tax = document.querySelector('#select-tax-group');
        if (tax.tomselect) { tax.tomselect.addOption({ value: '1', text: 'ضريبة القيمة المضافة' }); tax.tomselect.setValue(['1'], true); }
        if (![...tax.options].some(o => o.value === '1')) tax.add(new Option('ضريبة القيمة المضافة', '1'));
        [...tax.options].forEach(o => { o.selected = o.value === '1'; });
        f.querySelectorAll('input[name^="store_pricing["][name$="[stock]"]').forEach(i => { i.value = '10'; });
        if (it.price) {
          f.querySelectorAll('input[name^="store_pricing["][name$="[price]"]').forEach(i => { i.value = String(it.price); });
          f.querySelectorAll('input[name^="store_pricing["][name$="[special_price]"]').forEach(i => { i.value = String(it.special || it.price); });
        }
        addVariantInputsToForm();
        const fd = restructureFormData(new FormData(f));
        try {
          const r = await axios.post(f.getAttribute('action'), fd, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
          return { status: r.status, body: JSON.stringify(r.data) };
        } catch (e) { return { status: e.response?.status || 0, body: JSON.stringify(e.response?.data || String(e)) }; }
      }, it);
      status = res.status; body = res.body.slice(0, 200);
    } catch (e) { body = String(e).slice(0, 200); }
    results.push({ id, status, body });
    console.log(id, status, body.slice(0, 90));
  }
  fs.writeFileSync('fix_results.json', JSON.stringify(results, null, 1));
  await browser.close();
})();
