// Add or remove one tag on a product via the seller edit page's own tag chips, then save like the panel does.
// Usage: node tag_test.cjs <productId> add|remove <tag>
const { chromium } = require('playwright');
(async () => {
  const [id, op, tag] = process.argv.slice(2);
  const b = await chromium.launch(); const c = await b.newContext({ storageState: 'seller-state.json', viewport: { width: 1400, height: 1600 } });
  const p = await c.newPage();
  await p.route('https://api.jarna.co/storage/**', async r => { const x = await r.fetch(); await r.fulfill({ response: x, headers: { ...x.headers(), 'access-control-allow-origin': 'https://seller.jarna.co' } }); });
  await p.goto(`https://seller.jarna.co/products/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForTimeout(6000);
  await p.waitForFunction(() => window.FilePond && [...document.querySelectorAll('.filepond--root')].every(el => { const q = FilePond.find(el); return !q || q.getFiles().every(f => f.status !== 7); }), null, { timeout: 30000 });
  const before = await p.$$eval('#product-tags-hidden-inputs input', e => e.map(x => x.name + '=' + x.value));
  if (op === 'add') await p.evaluate(t => { const i = document.querySelector('#product-tags-input'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#product-tags-add-btn').click(); }, tag);
  else await p.evaluate(t => { for (const i of document.querySelectorAll('#product-tags-hidden-inputs input')) if (i.value === t) i.remove();
    for (const ch of document.querySelectorAll('#product-tags-chips *')) if (ch.textContent.trim() === t) ch.remove(); }, tag);
  const after = await p.$$eval('#product-tags-hidden-inputs input', e => e.map(x => x.name + '=' + x.value));
  const res = await p.evaluate(async () => {
    const f = document.querySelector('#product-form-submit'); addVariantInputsToForm();
    const fd = restructureFormData(new FormData(f));
    try { const r = await axios.post(f.getAttribute('action'), fd, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } }); return r.status + ' ' + JSON.stringify(r.data).slice(0, 80); }
    catch (e) { return (e.response?.status || 0) + ' ' + JSON.stringify(e.response?.data).slice(0, 200); }
  });
  console.log(JSON.stringify({ before, after, res }));
  await b.close();
})();
