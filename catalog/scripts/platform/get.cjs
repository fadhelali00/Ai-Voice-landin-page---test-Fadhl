// GET a panel URL with the saved session and print the body (JSON pretty-printed when possible).
// Usage: PANEL=seller|admin node get.cjs "/path?query" [outfile]
const { request } = require('playwright');
const fs = require('fs');
(async () => {
  const panel = process.env.PANEL;
  const ctx = await request.newContext({ baseURL: `https://${panel}.jarna.co`, storageState: `${panel}-state.json`,
    extraHTTPHeaders: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json, text/plain, */*' } });
  const r = await ctx.get(process.argv[2]);
  let body = await r.text();
  try { body = JSON.stringify(JSON.parse(body), null, 1); } catch (e) {}
  if (process.argv[3]) fs.writeFileSync(process.argv[3], body); else console.log(body.slice(0, 4000));
  console.error('status', r.status(), 'bytes', body.length);
  await ctx.dispose();
})();
