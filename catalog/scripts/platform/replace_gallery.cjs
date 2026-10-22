// Replace a product's additional (gallery) images with given local files: the panel keeps old gallery images when the
// list is submitted empty, so the wrong image is swapped for a correct one instead. Usage: node replace_gallery.cjs id file...
const { chromium } = require('playwright');
(async () => {
  const [id, ...files] = process.argv.slice(2);
  const b = await chromium.launch(); const c = await b.newContext({ storageState: 'seller-state.json', viewport: { width: 1400, height: 1600 } });
  const p = await c.newPage();
  await p.route('https://api.jarna.co/storage/**', async route => { const r = await route.fetch(); await route.fulfill({ response: r, headers: { ...r.headers(), 'access-control-allow-origin': 'https://seller.jarna.co' } }); });
  await p.goto(`https://seller.jarna.co/products/${id}/edit`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.FilePond && [...document.querySelectorAll('.filepond--root')].every(el => { const q = FilePond.find(el); return !q || q.getFiles().every(f => f.status !== 7); }), null, { timeout: 30000 });
  const fs = require('fs');
  const payload = files.map(f => ({ name: require('path').basename(f), b64: fs.readFileSync(f).toString('base64') }));
  const res = await p.evaluate(async (payload) => {
    const q = FilePond.find(document.querySelector('[name="additional_images[]"]').closest('.filepond--root'));
    q.removeFiles();
    for (const f of payload) { const bin = Uint8Array.from(atob(f.b64), ch => ch.charCodeAt(0)); await q.addFile(new File([bin], f.name, { type: 'image/webp' })); }
    await new Promise(r => setTimeout(r, 1500));
    const f = document.querySelector('#product-form-submit');
    addVariantInputsToForm();
    const fd = restructureFormData(new FormData(f));
    try { const r = await axios.post(f.getAttribute('action'), fd, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } }); return r.status + ' ' + JSON.stringify(r.data).slice(0, 80); }
    catch (e) { return (e.response?.status || 0) + ' ' + JSON.stringify(e.response?.data).slice(0, 200); }
  }, payload);
  console.log(id, res);
  await b.close();
})();
