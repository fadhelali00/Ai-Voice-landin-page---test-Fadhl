// Replace all banners/hero sections with ONE hero section at the top: a large image (hero_media) + a row of small
// card items (each its own uploaded image, linking to a category). Same multipart payload as the builder's Save.
// Usage: node save_layout_hero.cjs <app|web> hero.json   (hero.json = {image, cards:[{file, category_id, title}]})
const { chromium } = require('playwright');
const fs = require('fs');
function flat(out, data, parent) {
  if (data === null || data === undefined) return;
  if (Array.isArray(data)) data.forEach((v, i) => flat(out, v, `${parent}[${i}]`));
  else if (typeof data === 'object') Object.keys(data).forEach(k => flat(out, data[k], parent ? `${parent}[${k}]` : k));
  else out[parent] = data === true ? '1' : data === false ? '0' : String(data);
}
(async () => {
  const [platform, hfile] = process.argv.slice(2);
  const hero = JSON.parse(fs.readFileSync(hfile));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/home-builder', { waitUntil: 'networkidle' });
  const token = await page.$eval('meta[name=csrf-token]', m => m.content);
  const cur = (await (await ctx.request.get(`https://admin.jarna.co/home-builder/layout?platform=${platform}&scope_type=global`,
    { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } })).json()).data;
  const keep = cur.sections.filter(s => s.type !== 'banners' && s.type !== 'hero').map(s => ({
    id: s.id, type: s.type, title: s.title, style: s.style, config: s.config || {}, is_active: s.is_active !== false,
    start_at: s.start_at || null, end_at: s.end_at || null, zone_ids: s.zone_ids || [],
    items: (s.items || []).map(it => ({ id: it.id, purpose: it.purpose || 'display', itemable_type: it.itemable_type, itemable_id: it.itemable_id, title: it.title, link_url: it.link_url })) }));
  const heroSec = { id: null, type: 'hero', title: null, style: 'full', is_active: true, start_at: null, end_at: null, zone_ids: [],
    config: { media_type: 'image', layout: 'items', item_source: 'categories', card_bg_type: 'color', card_bg_color: '#FFFFFF', card_title_color: '#172D2B' },
    items: hero.cards.map(c => ({ id: null, purpose: 'display', itemable_type: 'category', itemable_id: c.category_id, title: c.title, link_url: null })) };
  const sections = [heroSec, ...keep].map((s, i) => ({ ...s, sort_order: i, items: s.items.map((it, j) => ({ ...it, sort_order: j })) }));
  const multipart = {};
  flat(multipart, { platform, scope_type: 'global', scope_id: null, zone_id: null, is_active: true, excluded_global_section_ids: [], sections }, '');
  const file = f => ({ name: f.split('/').pop(), mimeType: 'image/webp', buffer: fs.readFileSync(f) });
  multipart['media[0][hero_media]'] = file(hero.image);
  hero.cards.forEach((c, j) => { multipart[`item_media[0][${j}]`] = file(c.file); });
  const r = await ctx.request.post('https://admin.jarna.co/home-builder/save', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, multipart });
  console.log(platform, r.status(), (await r.text()).slice(0, 140));
  console.log('order:', sections.map(s => s.type === 'hero' ? '[HERO+' + s.items.length + ' cards]' : s.title).join(' | '));
  await browser.close();
})();
