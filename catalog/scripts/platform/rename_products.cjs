// Rename products: set title_en and title_ar only. Nothing else changes.
// Submits through the page's own handler steps (product.js), like move_products.cjs.
// Usage: node rename_products.cjs items.json   (items = [{id, en, ar}]) -> rename_results.json
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
  for (const it of items) { const id = it.id;
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
        f.querySelector('[name=title_en]').value = it.en;
        f.querySelector('[name=title_ar]').value = it.ar;
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
  fs.writeFileSync('rename_results.json', JSON.stringify(results, null, 1));
  await browser.close();
})();
