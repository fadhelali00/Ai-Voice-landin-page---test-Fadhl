// Swap the image of the top banner (first banners section, first item) and keep every section unchanged (ids kept).
// Saves the current layout to layout_backup_<platform>.json first. Usage: node set_banner_image.cjs <app|web> image.webp
const { chromium } = require('playwright');
const fs = require('fs');
function flat(out, data, parent) {
  if (data === null || data === undefined) return;
  if (Array.isArray(data)) data.forEach((v, i) => flat(out, v, `${parent}[${i}]`));
  else if (typeof data === 'object') Object.keys(data).forEach(k => flat(out, data[k], parent ? `${parent}[${k}]` : k));
  else out[parent] = data === true ? '1' : data === false ? '0' : String(data);
}
(async () => {
  const [platform, img] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/home-builder', { waitUntil: 'networkidle' });
  const token = await page.$eval('meta[name=csrf-token]', m => m.content);
  const cur = (await (await ctx.request.get(`https://admin.jarna.co/home-builder/layout?platform=${platform}&scope_type=global`,
    { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } })).json()).data;
  fs.writeFileSync(`layout_backup_${platform}.json`, JSON.stringify(cur, null, 1));
  const sections = cur.sections.map((s, i) => ({
    id: s.id, type: s.type, title: s.title, style: s.style, config: s.config || {}, sort_order: i, is_active: s.is_active !== false,
    start_at: s.start_at || null, end_at: s.end_at || null, zone_ids: s.zone_ids || [],
    items: (s.items || []).map((it, j) => ({ id: it.id, purpose: it.purpose || 'display', itemable_type: it.itemable_type, itemable_id: it.itemable_id, title: it.title, link_url: it.link_url, sort_order: j })) }));
  const bi = sections.findIndex(s => s.type === 'banners');
  if (bi < 0) throw new Error('no banners section');
  const multipart = {};
  flat(multipart, { platform, scope_type: 'global', scope_id: null, zone_id: null, is_active: true, excluded_global_section_ids: [], sections }, '');
  multipart[`item_media[${bi}][0]`] = { name: img.split('/').pop(), mimeType: 'image/webp', buffer: fs.readFileSync(img) };
  const r = await ctx.request.post('https://admin.jarna.co/home-builder/save', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, multipart });
  console.log(platform, 'banner section', bi, r.status(), (await r.text()).slice(0, 140));
  await browser.close();
})();
