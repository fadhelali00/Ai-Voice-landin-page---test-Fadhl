// Change named fields on an admin settings page and save through the page's own Submit (form-submit -> POST /settings/store).
// Saves the previous values to settings_backup_<page>_<time>.json first.
// Usage: node set_settings.cjs <page e.g. delivery_boy> values.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [pg, file] = process.argv.slice(2); const vals = JSON.parse(fs.readFileSync(file));
  const b = await chromium.launch(); const c = await b.newContext({ storageState: 'admin-state.json' }); const p = await c.newPage();
  await p.goto(`https://admin.jarna.co/settings/${pg}`, { waitUntil: 'networkidle' });
  const old = await p.evaluate(names => Object.fromEntries(names.map(n => [n, document.querySelector(`[name="${n}"]`)?.value ?? null])), Object.keys(vals));
  fs.writeFileSync(`settings_backup_${pg}_${Date.now()}.json`, JSON.stringify(old, null, 1));
  const miss = await p.evaluate(v => {
    const miss = [];
    for (const [n, val] of Object.entries(v)) {
      const e = document.querySelector(`[name="${n}"]`); if (!e) { miss.push(n); continue; }
      // array value = TomSelect multi-select (e.g. allowedCountries[]): wait for its options, then select them
      if (Array.isArray(val)) { for (const x of val) { if (!e.tomselect.options[x]) e.tomselect.addOption({ value: x, text: x }); e.tomselect.addItem(x, true); } continue; }
      e.value = val; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
      // rich-text editors keep their own copy of textarea content
      for (const ed of [window.tinymce, window.hugerte]) if (ed && ed.get(e.id)) { ed.get(e.id).setContent(val); ed.get(e.id).save(); }
    }
    return miss;
  }, vals);
  if (miss.length) { console.log('missing fields', miss); await b.close(); process.exit(1); }
  const [resp] = await Promise.all([
    p.waitForResponse(r => r.url().includes('/settings/store') && r.request().method() === 'POST', { timeout: 30000 }),
    p.click('form.form-submit button[type=submit]'),
  ]);
  console.log(resp.status(), (await resp.text()).slice(0, 200));
  await p.goto(`https://admin.jarna.co/settings/${pg}`, { waitUntil: 'networkidle' });
  const now = await p.evaluate(names => Object.fromEntries(names.map(n => [n, (document.querySelector(`[name="${n}"]`)?.value ?? '').slice(0, 60)])), Object.keys(vals));
  console.log('after', JSON.stringify(now));
  await b.close();
})();
