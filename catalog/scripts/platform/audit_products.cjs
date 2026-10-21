// Read-only audit of every product's edit page: tax classes, inclusive tax, status, category, image, variants per store.
// Usage: node audit_products.cjs ids.json out.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [idsFile, out] = process.argv.slice(2);
  const ids = JSON.parse(fs.readFileSync(idsFile));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'seller-state.json' });
  const res = [];
  for (const [n, id] of ids.entries()) {
    try {
      const r = await ctx.request.get(`https://seller.jarna.co/products/${id}/edit`);
      const t = await r.text();
      const g = (re) => { const m = t.match(re); return m ? m[1] : null; };
      const taxStart = t.indexOf('"tax_classes":');
      const tax = taxStart > 0 ? t.slice(taxStart + 14, t.indexOf(']', taxStart) + 1) : null;
      const variants = [...t.matchAll(/"store_id":(\d+),"sku":"([^"]*)","price":([\d.]+),"special_price":([\d.]+|null),"cost":"?([\d.]+)"?,"stock":(-?\d+)/g)]
        .map(m => ({ store: +m[1], sku: m[2], price: +m[3], special: m[4] === 'null' ? null : +m[4], stock: +m[6] }));
      res.push({ id, http: r.status(), inclusive: g(/"is_inclusive_tax":"(\d)"/), tax_ids: tax ? [...tax.matchAll(/"id":(\d+)/g)].map(m => +m[1]) : null,
        status: g(/"status":"(\w+)","verification_status"/), category_id: g(/"category_id":(\d+)/), main_image: g(/"main_image":"([^"]*)"/),
        barcode: g(/"barcode":"(\d*)"/), title: g(/"title_ar":"([^"]*)"/), variants });
    } catch (e) { res.push({ id, error: String(e).slice(0, 120) }); }
    if (n % 50 === 0) console.log(n, id);
  }
  fs.writeFileSync(out, JSON.stringify(res));
  console.log('done', res.length);
  await browser.close();
})();
