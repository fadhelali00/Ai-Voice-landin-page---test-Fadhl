const { chromium } = require('playwright'); const cards = require('./cards.json');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext();
  const shot = async (id, w, h) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h });
    await p.goto('file://' + __dirname + '/' + id + '.html', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400); await p.screenshot({ path: __dirname + '/' + id + '.png' }); await p.close(); };
  await shot('hero', 1500, 800);
  for (const c of cards) await shot(c.id, 600, 640);
  await b.close();
})();
