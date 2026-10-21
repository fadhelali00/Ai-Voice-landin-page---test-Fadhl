// Set the home-page parent categories and their order (admin > Categories > Sort).
// Usage: node home_cats.cjs 8,1,3,20,...
const { chromium } = require('playwright');
(async () => {
  const ids = process.argv[2].split(',');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/categories/sort', { waitUntil: 'networkidle' });
  const token = await page.$eval('input[name=_token]', i => i.value);
  const form = new URLSearchParams({ _token: token });
  ids.forEach(id => form.append('home_category_ids[]', id));
  let r = await page.request.post('https://admin.jarna.co/categories/home-categories', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    data: form.toString() });
  console.log('home', r.status(), (await r.text()).slice(0, 200));
  await page.goto('https://admin.jarna.co/categories/sort', { waitUntil: 'networkidle' });
  console.log('sortable now', await page.$$eval('#categories-sortable-list .sortable-item', e => e.map(x => x.dataset.id).join(',')));
  r = await page.request.post('https://admin.jarna.co/categories/sort', {
    headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    data: { categories: ids } });
  console.log('sort', r.status(), (await r.text()).slice(0, 200));
  await browser.close();
})();
