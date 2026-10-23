// Set a category's active status through the admin edit form (reversible; nothing is deleted).
// Usage: node set_cat_status.cjs <on|off> id [id ...]
const { chromium } = require('playwright');
(async () => {
  const [state, ...ids] = process.argv.slice(2);
  const b = await chromium.launch(); const c = await b.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 1800 } });
  const p = await c.newPage();
  for (const id of ids) {
    await p.goto(`https://admin.jarna.co/categories/${id}/edit`, { waitUntil: 'networkidle' });
    const box = p.locator(`form[action$="/categories/${id}"] input[name=status]`);
    if ((await box.isChecked()) !== (state === 'on')) await box.evaluate(e => e.click());
    const [resp] = await Promise.all([
      p.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/categories/' + id), { timeout: 60000 }).catch(() => null),
      p.locator(`form[action$="/categories/${id}"] button[type=submit]`).last().click(),
    ]);
    const body = resp ? await resp.text() : 'no response';
    console.log(id, state, resp ? resp.status() : '-', (body.match(/"status":"?(\w+)"?/) || [])[1], body.slice(0, 60));
  }
  await b.close();
})();
