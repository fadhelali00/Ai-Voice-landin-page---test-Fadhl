// Place each banner as its own static single-image banners section, before the section whose title is `before` ("top" = first).
// Replaces any existing banners sections. Usage: node save_layout_banners_inline.cjs <app|web> banners.json  ([{file, category_id, title, before}])
const { chromium } = require('playwright');
const fs = require('fs');
function flat(out, data, parent) {
  if (data === null || data === undefined) return;
  if (Array.isArray(data)) data.forEach((v, i) => flat(out, v, `${parent}[${i}]`));
  else if (typeof data === 'object') Object.keys(data).forEach(k => flat(out, data[k], parent ? `${parent}[${k}]` : k));
  else out[parent] = data === true ? '1' : data === false ? '0' : String(data);
}
(async () => {
  const [platform, bfile] = process.argv.slice(2);
  const banners = JSON.parse(fs.readFileSync(bfile));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/home-builder', { waitUntil: 'networkidle' });
  const token = await page.$eval('meta[name=csrf-token]', m => m.content);
  const cur = (await (await ctx.request.get(`https://admin.jarna.co/home-builder/layout?platform=${platform}&scope_type=global`,
    { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } })).json()).data;
  const keep = cur.sections.filter(s => s.type !== 'banners').map(s => ({
    id: s.id, type: s.type, title: s.title, style: s.style, config: s.config || {}, is_active: s.is_active !== false,
    start_at: s.start_at || null, end_at: s.end_at || null, zone_ids: s.zone_ids || [],
    items: (s.items || []).map(it => ({ id: it.id, purpose: it.purpose || 'display', itemable_type: it.itemable_type, itemable_id: it.itemable_id, title: it.title, link_url: it.link_url })) }));
  const sections0 = [...keep];
  const placed = [];
  for (const bn of banners) {
    const sec = { id: null, type: 'banners', title: null, style: 'full', config: {}, is_active: true, start_at: null, end_at: null, zone_ids: [], _file: bn.file,
      items: [{ id: null, purpose: 'display', itemable_type: 'category', itemable_id: bn.category_id, title: bn.title, link_url: null }] };
    const idx = bn.before === 'top' ? 0 : sections0.findIndex(s => s.title === bn.before);
    if (idx < 0) throw new Error('no section titled ' + bn.before);
    sections0.splice(idx, 0, sec); placed.push(sec);
  }
  const sections = sections0.map((s, i) => ({ ...s, sort_order: i, items: s.items.map((it, j) => ({ ...it, sort_order: j })) }));
  const files = {}; sections.forEach((s, i) => { if (s._file) { files[i] = s._file; delete s._file; } });
  const fields = {};
  flat(fields, { platform, scope_type: 'global', scope_id: null, zone_id: null, is_active: true, excluded_global_section_ids: [], sections }, '');
  const multipart = { ...fields };
  Object.entries(files).forEach(([i, f]) => { multipart[`item_media[${i}][0]`] = { name: f.split('/').pop(), mimeType: 'image/webp', buffer: fs.readFileSync(f) }; });
  console.log('order:', sections.map(s => s.type === 'banners' ? '[' + s.items[0].title + ']' : s.title).join(' | '));
  const r = await ctx.request.post('https://admin.jarna.co/home-builder/save', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, multipart });
  const body = await r.text();
  console.log(platform, r.status(), body.slice(0, 160));
  await browser.close();
})();
