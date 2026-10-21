// Log in to a Jarna panel and dump links/menu for exploration.
// Usage: PANEL=seller|admin JUSER=.. JPASS=.. node explore.cjs [path ...]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const panel = process.env.PANEL;
  const base = `https://${panel}.jarna.co`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type=email], input[name=email]', process.env.JUSER);
  await page.fill('input[type=password]', process.env.JPASS);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.click('button[type=submit], input[type=submit]'),
  ]);
  await page.waitForURL(u => !String(u).includes('/login'), { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
  console.log('after login:', page.url());
  await ctx.storageState({ path: `${panel}-state.json` });
  const paths = process.argv.slice(2);
  for (const p of paths.length ? paths : ['']) {
    if (p) await page.goto(base + p, { waitUntil: 'networkidle' });
    const tag = (p || 'home').replace(/[^a-z0-9]+/gi, '_');
    await page.screenshot({ path: `${panel}-${tag}.png` });
    const links = await page.$$eval('a[href]', as => [...new Set(as.map(a => a.getAttribute('href') + ' | ' + a.innerText.trim().replace(/\s+/g, ' ').slice(0, 50)))]);
    fs.writeFileSync(`${panel}-${tag}-links.txt`, links.join('\n'));
    console.log(p || 'home', page.url(), links.length, 'links');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
