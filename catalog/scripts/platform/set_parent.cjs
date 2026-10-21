// Set a category's parent (and optionally rename it) through the admin edit form.
// Usage: node set_parent.cjs <id> <parent_id|none> [title_ar] [title_en]
const { chromium } = require('playwright');
(async () => {
  const [id, parent, titleAr, titleEn] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 1800 } });
  const page = await ctx.newPage();
  await page.goto(`https://admin.jarna.co/categories/${id}/edit`, { waitUntil: 'networkidle' });
  const before = await page.$eval('#select-parent-category', s => s.value);
  await page.$eval('#select-parent-category', (s, p) => {
    const v = p === 'none' ? '' : p;
    if (v && ![...s.options].some(o => o.value === v)) s.add(new Option(v, v));
    if (s.tomselect) { if (v) { s.tomselect.addOption({ value: v, text: v }); s.tomselect.setValue(v, true); } else s.tomselect.clear(true); }
    [...s.options].forEach(o => { o.selected = o.value === v; });
    s.value = v;
  }, parent);
  if (titleAr) await page.fill('input[name=title]', titleAr);
  if (titleEn) await page.fill('input[name=title_en]', titleEn);
  const form = `form[action$="/categories/${id}"]`;
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/categories/' + id), { timeout: 60000 }).catch(() => null),
    page.locator(`${form} button[type=submit]`).last().click(),
  ]);
  const body = resp ? await resp.text() : 'no response';
  const m = body.match(/"parent_id":(null|\d+)/);
  console.log(id, 'parent', before || 'none', '->', m ? m[1] : '?', resp ? resp.status() : '-', body.slice(0, 80));
  await browser.close();
})();
