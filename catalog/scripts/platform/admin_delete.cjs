// Delete admin records through the panel's own handleDelete route: DELETE <base_url>/<panel>/<kind>/<id>.
// Usage: node admin_delete.cjs <products|categories> id1 id2 ...
const { chromium } = require('playwright');
(async () => {
  const [kind, ...ids] = process.argv.slice(2);
  const b = await chromium.launch(); const c = await b.newContext({ storageState: 'admin-state.json' });
  const p = await c.newPage(); await p.goto('https://admin.jarna.co/' + kind, { waitUntil: 'networkidle' });
  for (const id of ids) {
    const r = await p.evaluate(async ([kind, id]) => {
      const panel = document.querySelector('input[name=panel]')?.value ?? '';
      const url = `${base_url}/${panel ? panel + '/' : ''}${kind}/${id}`;
      try { const res = await axios.delete(url); return res.status + ' ' + JSON.stringify(res.data).slice(0, 150); }
      catch (e) { return (e.response?.status || 0) + ' ' + JSON.stringify(e.response?.data || String(e)).slice(0, 150); }
    }, [kind, id]);
    console.log(kind, id, r);
  }
  await b.close();
})();
