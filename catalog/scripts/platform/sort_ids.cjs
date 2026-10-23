// POST an ordered list of category ids to admin /categories/sort (sets their sort order).
// Usage: node sort_ids.cjs 75,76,5,... [parent_id]   (subcategories need their parent_id, as the panel's sort page sends it)
const { chromium } = require('playwright');
(async () => {
  const ids = process.argv[2].split(','); const parentId = process.argv[3] ? +process.argv[3] : null;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/categories/sort', { waitUntil: 'networkidle' });
  const token = await page.$eval('input[name=_token]', i => i.value);
  const r = await page.request.post('https://admin.jarna.co/categories/sort', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, data: { categories: ids, parent_id: parentId } });
  console.log('sort', ids.join(','), r.status(), (await r.text()).slice(0, 150));
  await browser.close();
})();
