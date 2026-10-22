// Read-only: minimum_order_quantity, quantity_step_size, total_allowed_quantity and status for every product id.
// Usage: node scan_qty.cjs ids.json out.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [inp, out] = process.argv.slice(2);
  const ids = JSON.parse(fs.readFileSync(inp));
  const b = await chromium.launch(); const c = await b.newContext({ storageState: 'seller-state.json' });
  const res = []; let i = 0;
  async function worker() {
    while (i < ids.length) {
      const id = ids[i++];
      try {
        const t = await (await c.request.get(`https://seller.jarna.co/products/${id}/edit`)).text();
        const g = k => { const m = t.match(new RegExp(`"${k}":"?(\\d+)`)); return m ? +m[1] : null; };
        res.push({ id, moq: g('minimum_order_quantity'), step: g('quantity_step_size'), max: g('total_allowed_quantity'),
          status: (t.match(/"status":"(\w+)","verification_status"/) || [])[1] });
      } catch (e) { res.push({ id, error: String(e).slice(0, 80) }); }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  fs.writeFileSync(out, JSON.stringify(res)); console.log('done', res.length); await b.close();
})();
