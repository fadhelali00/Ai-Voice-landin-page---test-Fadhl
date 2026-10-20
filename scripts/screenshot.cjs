// يلتقط صورة PNG لنموذج HTML بمقاس جوال (390×844 @3x) بجانب الملف نفسه.
// الاستخدام: node scripts/screenshot.cjs design/outputs/screens/home.html [--full]
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node scripts/screenshot.cjs <file.html> [--full]');
    process.exit(1);
  }
  const fullPage = process.argv.includes('--full');
  const abs = path.resolve(file);
  const out = abs.replace(/\.html?$/i, '.png');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    locale: 'ar-SA',
  });
  // ?full lets mockups move fixed bottom bars below the content for full-page shots.
  await page.goto('file://' + abs + (fullPage ? '?full' : ''), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, fullPage });
  await browser.close();
  console.log(out);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
