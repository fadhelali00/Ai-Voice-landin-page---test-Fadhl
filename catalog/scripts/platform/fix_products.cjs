// For each product: set VAT tax group (1) + tax-inclusive pricing, and optionally move category.
// Usage: node fix_products.cjs fixes.json   (fixes.json = [{id, category_id?}])  -> fix_results.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const fixes = JSON.parse(fs.readFileSync(process.argv[2]));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'seller-state.json', viewport: { width: 1400, height: 1600 } });
  const page = await ctx.newPage();
  const results = [];
  for (const f of fixes) {
    await page.goto(`https://seller.jarna.co/products/${f.id}/edit`, { waitUntil: 'networkidle' });
    await page.evaluate(({ cat }) => {
      const setSel = (sel, vals, label) => {
        const s = document.querySelector(sel);
        for (const v of vals) if (![...s.options].some(o => o.value === v)) s.add(new Option(label || v, v));
        [...s.options].forEach(o => { o.selected = vals.includes(o.value); });
        s.dispatchEvent(new Event('change', { bubbles: true }));
      };
      setSel('select[name="tax_groups[]"]', ['1'], 'ضريبة القيمة المضافة');
      document.querySelector('input[name=is_inclusive_tax]').value = '1';
      if (cat) setSel('select[name=category_id]', [String(cat)]);
    }, { cat: f.category_id });
    // submit via the form's own request so every other field is sent unchanged
    const form = await page.$('form[action$="/products/' + f.id + '"]');
    const data = await form.evaluate(el => [...new FormData(el).entries()].filter(([k, v]) => typeof v === 'string'));
    const token = data.find(([k]) => k === '_token')[1];
    const r = await ctx.request.post(`https://seller.jarna.co/products/${f.id}`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json', 'X-CSRF-TOKEN': token },
      form: Object.fromEntries([]), multipart: undefined,
      data: data.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&'),
    }).catch(e => ({ status: () => 0, text: async () => String(e) }));
    const body = await r.text();
    results.push({ ...f, status: r.status(), body: body.slice(0, 400) });
    console.log(f.id, r.status(), body.slice(0, 200));
  }
  fs.writeFileSync('fix_results.json', JSON.stringify(results, null, 1));
  await browser.close();
})();
