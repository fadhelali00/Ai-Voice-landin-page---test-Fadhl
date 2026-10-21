// Prepend a banners section (images + category links) to the current builder layout and save it (multipart, same as the builder).
// Usage: node save_layout_with_banners.cjs <app|web> banners.json   (banners.json = [{file, category_id, title}])
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
  const bannerSec = { id: null, type: 'banners', title: null, style: 'peek', config: {}, is_active: true, start_at: null, end_at: null, zone_ids: [],
    items: banners.map(b => ({ id: null, purpose: 'display', itemable_type: 'category', itemable_id: b.category_id, title: b.title, link_url: null })) };
  const sections = [bannerSec, ...keep].map((s, i) => ({ ...s, sort_order: i, items: s.items.map((it, j) => ({ ...it, sort_order: j })) }));
  const fields = {};
  flat(fields, { platform, scope_type: 'global', scope_id: null, zone_id: null, is_active: true, excluded_global_section_ids: [], sections }, '');
  const multipart = { ...fields };
  banners.forEach((b, j) => { multipart[`item_media[0][${j}]`] = { name: b.file.split('/').pop(), mimeType: 'image/webp', buffer: fs.readFileSync(b.file) }; });
  const r = await ctx.request.post('https://admin.jarna.co/home-builder/save', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, multipart });
  const body = await r.text();
  console.log(platform, r.status(), body.slice(0, 160));
  await browser.close();
})();
