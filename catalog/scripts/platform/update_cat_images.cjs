// Replace category images through the admin edit form (the same form a person uses).
// Usage: node update_cat_images.cjs DIR id [id ...]   (expects DIR/cat<id>.webp)
const { chromium } = require('playwright');
(async () => {
  const [dir, ...ids] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 1800 } });
  const page = await ctx.newPage();
  for (const id of ids) {
    for (let t = 0; t < 3; t++) {
      try { await page.goto(`https://admin.jarna.co/categories/${id}/edit`, { waitUntil: 'networkidle' }); break; }
      catch (e) { await page.waitForTimeout(3000); }
    }
    const input = page.locator('form[action$="/categories/' + id + '"] input[type=file][name=image]').first();
    await input.setInputFiles(`${dir}/cat${id}.webp`);
    await page.waitForTimeout(800);
    const [resp] = await Promise.all([
      page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/categories/' + id), { timeout: 60000 }).catch(() => null),
      page.locator('form[action$="/categories/' + id + '"] button[type=submit]').last().click(),
    ]);
    const body = resp ? (await resp.text()).slice(0, 200) : 'no response';
    console.log(id, resp ? resp.status() : '-', body);
    await page.waitForTimeout(1500);
  }
  await browser.close();
})();
