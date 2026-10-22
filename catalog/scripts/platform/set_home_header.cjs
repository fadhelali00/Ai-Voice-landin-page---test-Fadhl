// Home "All" header background (admin > Settings > Home General Settings): type color|image, plus the image for app and web.
// Usage: node set_home_header.cjs color            -> back to the solid colour (#006b63 kept in the form)
//        node set_home_header.cjs image file.webp  -> image background for app and web
const { chromium } = require('playwright');
(async () => {
  const [type, img] = process.argv.slice(2);
  const b = await chromium.launch(); const c = await b.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 2400 } });
  const p = await c.newPage(); const log = [];
  p.on('response', async r => { if (r.url().includes('/settings/store')) log.push(r.status() + ' ' + (await r.text().catch(() => '')).slice(0, 200)); });
  await p.goto('https://admin.jarna.co/settings/home_general_settings', { waitUntil: 'networkidle' });
  await p.selectOption('#background-type-select', type);
  if (type === 'image') { await p.setInputFiles('input[name=backgroundImageApp]', img); await p.setInputFiles('input[name=backgroundImageWeb]', img); }
  await p.locator('form.form-submit button[type=submit]').click();
  await p.waitForTimeout(6000);
  console.log(log.join('\n') || 'no response captured');
  await b.close();
})();
