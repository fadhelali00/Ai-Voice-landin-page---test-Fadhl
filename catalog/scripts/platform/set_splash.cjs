// Replace the app splash image (admin > Settings > System > Mobile Splash Image). Other fields are submitted as already filled.
// Usage: node set_splash.cjs image.png
const { chromium } = require('playwright');
(async () => {
  const img = process.argv[2];
  const b = await chromium.launch(); const c = await b.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 2400 } });
  const p = await c.newPage(); const log = [];
  p.on('response', async r => { if (r.url().includes('/settings/store')) log.push(r.status() + ' ' + (await r.text().catch(() => '')).slice(0, 160)); });
  await p.goto('https://admin.jarna.co/settings/system', { waitUntil: 'networkidle' });
  await p.setInputFiles('input[name=mobileSplashImage]', img);
  await p.locator('form.form-submit button[type=submit]').last().click();
  await p.waitForTimeout(6000);
  console.log(log.join('\n') || 'no response captured');
  await b.close();
})();
