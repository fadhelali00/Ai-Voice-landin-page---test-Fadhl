// Make a category top-level by clearing its parent in the admin edit form.
// Usage: node set_parent_none.cjs <id>
const { chromium } = require('playwright');
(async () => {
  const id = process.argv[2];
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 1800 } });
  const page = await ctx.newPage();
  await page.goto(`https://admin.jarna.co/categories/${id}/edit`, { waitUntil: 'networkidle' });
  const before = await page.$eval('#select-parent-category', s => s.value);
  await page.$eval('#select-parent-category', s => {
    if (s.tomselect) s.tomselect.clear(); 
    [...s.options].forEach(o => o.selected = false); s.value = '';
  });
  console.log('parent before', before, 'after', await page.$eval('#select-parent-category', s => s.value));
  const form = `form[action$="/categories/${id}"]`;
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/categories/' + id), { timeout: 60000 }).catch(() => null),
    page.locator(`${form} button[type=submit]`).last().click(),
  ]);
  console.log(resp ? resp.status() : '-', resp ? (await resp.text()).slice(0, 300) : 'no response');
  await browser.close();
})();
