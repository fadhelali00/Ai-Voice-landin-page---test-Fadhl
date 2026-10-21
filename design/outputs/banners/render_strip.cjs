const { chromium } = require('playwright'); const ids = require('./ids.json');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1680, height: 700 } })).newPage();
  for (const id of ids) {
    await p.goto('file://' + __dirname + '/' + id + '.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    await p.screenshot({ path: __dirname + '/' + id + '.png' });
  }
  await b.close();
})();
