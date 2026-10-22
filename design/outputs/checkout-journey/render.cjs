// Renders the checkout-journey mockups to PNG @2x.
// Usage: NODE_PATH=$(npm root -g) node design/outputs/checkout-journey/render.cjs [id ...]
//   <id>.png            390x844 phone viewport (sticky header/footer as on device)
//   <id>-full.png       full scroll length (long screens only)
//   <id>-annotated.png  annotation board (phone + numbered boxes + table)
//   journey-overview.png (when no ids are given, or with "overview")
const path = require('path');
const { chromium } = require('playwright');

const DIR = __dirname;
const SCREENS = [
  { id: '01-listing-added' },
  { id: '02-cart', full: true },
  { id: '03-payment-options' },
  { id: '04-review', full: true, scroll: 'review-start' },
  { id: '05-pay-sheet' },
  { id: '06-order-placed' },
];

async function waitReady(page, needsFlag) {
  await page.evaluate(() => document.fonts.ready);
  if (needsFlag) await page.waitForSelector('body[data-ready="1"]', { timeout: 15000 });
  await page.waitForTimeout(150);
}

(async () => {
  const args = process.argv.slice(2);
  const only = args.filter((a) => a !== 'overview');
  const list = only.length ? SCREENS.filter((s) => only.includes(s.id)) : SCREENS;
  const browser = await chromium.launch();
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ar-SA' });
  const board = await browser.newPage({ viewport: { width: 1224, height: 900 }, deviceScaleFactor: 2, locale: 'ar-SA' });

  for (const s of list) {
    const url = 'file://' + path.join(DIR, s.id + '.html');
    await phone.goto(url + (s.scroll ? '?scroll=' + s.scroll : ''), { waitUntil: 'networkidle' });
    await waitReady(phone, !!s.scroll);
    await phone.screenshot({ path: path.join(DIR, s.id + '.png') });
    if (s.full) {
      await phone.goto(url + '?full', { waitUntil: 'networkidle' });
      await waitReady(phone, false);
      await phone.screenshot({ path: path.join(DIR, s.id + '-full.png'), fullPage: true });
    }
    await board.goto(url + '?annotate', { waitUntil: 'networkidle' });
    await waitReady(board, true);
    await board.screenshot({ path: path.join(DIR, s.id + '-annotated.png'), fullPage: true });
    console.log('ok', s.id);
  }

  if (!only.length || args.includes('overview')) {
    const ov = await browser.newPage({ viewport: { width: 2440, height: 900 }, deviceScaleFactor: 2, locale: 'ar-SA' });
    await ov.goto('file://' + path.join(DIR, 'journey-overview.html'), { waitUntil: 'networkidle' });
    await waitReady(ov, false);
    await ov.screenshot({ path: path.join(DIR, 'journey-overview.png'), fullPage: true });
    console.log('ok overview');
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
