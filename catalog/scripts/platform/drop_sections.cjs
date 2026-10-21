// Remove all sections of one type (e.g. hero) from the builder layout and save the rest unchanged (ids kept).
// Usage: node drop_sections.cjs <app|web> <type>
const { chromium } = require('playwright');
(async () => {
  const [platform, type] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/home-builder', { waitUntil: 'networkidle' });
  const token = await page.$eval('meta[name=csrf-token]', m => m.content);
  const cur = (await (await ctx.request.get(`https://admin.jarna.co/home-builder/layout?platform=${platform}&scope_type=global`,
    { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } })).json()).data;
  const sections = cur.sections.filter(s => s.type !== type).map((s, i) => ({
    id: s.id, type: s.type, title: s.title, style: s.style, config: s.config || {}, sort_order: i, is_active: s.is_active !== false,
    start_at: s.start_at || null, end_at: s.end_at || null, zone_ids: s.zone_ids || [],
    items: (s.items || []).map((it, j) => ({ id: it.id, purpose: it.purpose || 'display', itemable_type: it.itemable_type, itemable_id: it.itemable_id, title: it.title, link_url: it.link_url, sort_order: j })) }));
  const r = await ctx.request.post('https://admin.jarna.co/home-builder/save', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    data: { platform, scope_type: 'global', scope_id: null, zone_id: null, is_active: true, excluded_global_section_ids: [], sections } });
  console.log(platform, r.status(), (await r.text()).slice(0, 100), '| kept', sections.map(s => s.type === 'banners' ? '[BANNER]' : s.title).slice(0, 4).join(' | '), '...', sections.length);
  await browser.close();
})();
