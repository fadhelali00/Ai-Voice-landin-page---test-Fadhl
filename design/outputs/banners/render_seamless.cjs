const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext();
  for (const id of ['top_banner', 'top_header']) { const p = await ctx.newPage(); await p.setViewportSize({ width: 1600, height: 900 });
    await p.goto('file://' + __dirname + '/' + id + '.html', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400); await p.screenshot({ path: __dirname + '/' + id + '.png' }); await p.close(); }
  await b.close(); })();
