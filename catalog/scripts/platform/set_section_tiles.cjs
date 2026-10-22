// Set which tiles (category ids, in order) a home "categories" section shows; every other section stays unchanged (ids kept).
// Usage: node set_section_tiles.cjs <app|web> tiles.json   (tiles.json = {"<section title>": [ids...]})
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [platform, file] = process.argv.slice(2);
  const want = JSON.parse(fs.readFileSync(file));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/home-builder', { waitUntil: 'networkidle' });
  const token = await page.$eval('meta[name=csrf-token]', m => m.content);
  const cur = (await (await ctx.request.get(`https://admin.jarna.co/home-builder/layout?platform=${platform}&scope_type=global`,
    { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } })).json()).data;
  fs.writeFileSync(`layout_backup_${platform}_tiles.json`, JSON.stringify(cur, null, 1));
  const sections = cur.sections.map((s, i) => {
    let items = (s.items || []).map(it => ({ id: it.id, purpose: it.purpose || 'display', itemable_type: it.itemable_type, itemable_id: it.itemable_id, title: it.title, link_url: it.link_url }));
    if (s.type === 'categories' && want[s.title]) {
      const keep = Object.fromEntries(items.map(it => [it.itemable_id, it]));
      items = want[s.title].map(cid => keep[cid] || { id: null, purpose: 'display', itemable_type: 'category', itemable_id: cid, title: null, link_url: null });
    }
    return { id: s.id, type: s.type, title: s.title, style: s.style, config: s.config || {}, sort_order: i, is_active: s.is_active !== false,
      start_at: s.start_at || null, end_at: s.end_at || null, zone_ids: s.zone_ids || [], items: items.map((it, j) => ({ ...it, sort_order: j })) };
  });
  const r = await ctx.request.post('https://admin.jarna.co/home-builder/save', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    data: { platform, scope_type: 'global', scope_id: null, zone_id: null, is_active: true, excluded_global_section_ids: [], sections } });
  console.log(platform, r.status(), (await r.text()).slice(0, 100));
  await browser.close();
})();
