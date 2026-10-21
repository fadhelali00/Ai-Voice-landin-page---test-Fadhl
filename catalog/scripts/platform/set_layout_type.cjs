// Switch admin > Settings > System > Home Page Layout (featured_section | home_builder), submitting the page's own form.
const { chromium } = require('playwright');
(async () => {
  const val = process.argv[2];
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: 'admin-state.json', viewport: { width: 1400, height: 2400 } });
  const page = await ctx.newPage();
  await page.goto('https://admin.jarna.co/settings/system', { waitUntil: 'networkidle' });
  const radio = page.locator(`input[name=layoutType][value=${val}]`);
  const form = radio.locator('xpath=ancestor::form[1]');
  console.log('before', await page.$eval('input[name=layoutType]:checked', r => r.value), 'form', await form.getAttribute('action'));
  await radio.check({ force: true });
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/settings'), { timeout: 60000 }).catch(() => null),
    form.locator('button[type=submit]').last().click(),
  ]);
  console.log(resp ? resp.status() : '-', resp ? (await resp.text()).slice(0, 300) : 'no response');
  await page.goto('https://admin.jarna.co/settings/system', { waitUntil: 'networkidle' });
  console.log('after', await page.$eval('input[name=layoutType]:checked', r => r.value));
  await browser.close();
})();
