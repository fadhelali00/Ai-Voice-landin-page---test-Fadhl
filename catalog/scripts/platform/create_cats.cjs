// Create subcategories in the admin panel (skips titles that already exist under the same parent).
// Usage: node create_cats.cjs cats_to_create.json   ->  writes created_cats.json
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const wanted = JSON.parse(fs.readFileSync(process.argv[2]));
  const existing = JSON.parse(fs.readFileSync('cats.json')).data.map(r => ({
    id: r.id, title: r.title.replace(/<[^>]+>/g, '').trim(), parent: r.parent.replace(/<[^>]+>/g, '').trim() }));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  const out = [];
  for (const c of wanted) {
    if (existing.find(e => e.title === c.title_en && e.parent === c.parent_title)) { out.push({ ...c, status: 'exists' }); continue; }
    await page.goto('https://admin.jarna.co/categories/create', { waitUntil: 'networkidle' });
    const token = await page.$eval('input[name=_token]', i => i.value);
    const img = fs.readFileSync(c.image_file);
    const r = await ctx.request.post('https://admin.jarna.co/categories', {
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      multipart: {
        _token: token, title: c.title_ar, title_en: c.title_en, description: '', description_en: '',
        parent_id: String(c.parent_id), store_type_id: '1', commission: '0', status: 'active',
        font_color: '#000000', background_color_web: '#ffffff', background_color_app: '#006b63',
        image: { name: c.image_file.split('/').pop(), mimeType: 'image/webp', buffer: img },
      },
    });
    const body = await r.text();
    console.log(c.title_en, r.status(), body.slice(0, 300));
    out.push({ ...c, status: r.status(), response: body.slice(0, 500) });
  }
  fs.writeFileSync('created_cats.json', JSON.stringify(out, null, 1));
  await browser.close();
})();
