// Annotation board for the checkout-journey mockups.
//   ?full      -> footer in normal flow (full-page captures)
//   ?annotate  -> phone + numbered boxes + arrows + table built from window.ANN
//   ?scroll=ID -> scroll so that #ID sits under the sticky header (viewport captures)
// window.ANN = [{n, sel, kind:'new'|'v65'|'issue', what, owner, cls:'now'|'next'|'dec', clsText, src}]
(function () {
  var q = location.search;
  var body = document.body;
  if (q.indexOf('full') > -1 || q.indexOf('annotate') > -1) body.classList.add('full');
  var m = q.match(/scroll=([\w-]+)/);
  if (m) {
    document.fonts.ready.then(function () {
      var el = document.getElementById(m[1]);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 112);
      body.setAttribute('data-ready', '1');
    });
  }
  if (q.indexOf('annotate') < 0) return;

  var KIND = { 'new': 'var(--jarna-link)', v65: 'var(--jarna-secondary)', issue: 'var(--jarna-warning)' };

  function esc(s) { return s == null ? '' : String(s); }

  function build() {
    body.classList.add('annot');
    var app = document.querySelector('.app');
    var meta = document.querySelector('meta[name=description]');
    var board = document.createElement('div');
    board.className = 'board';
    board.innerHTML =
      '<div class="board-head"><h1>' + esc(document.title) + '</h1><span class="sub">' + esc(meta && meta.content) + '</span></div>' +
      '<div class="legend"><span><i></i>جديد أو متغيّر</span><span><i class="v65"></i>موجود في v65 (لون فقط أو مصدر بيانات)</span>' +
      '<span><i class="issue"></i>تعارض أو قرار مفتوح</span><span>ألوان من <code>design/outputs/system/tokens.css</code> فقط</span></div>' +
      '<div class="board-row"><div class="phone"></div><div class="gutter"></div><div class="panel"></div></div>';
    body.insertBefore(board, body.firstChild.nextSibling);
    var row = board.querySelector('.board-row');
    board.querySelector('.phone').appendChild(app);

    var ann = window.ANN || [];
    var rowsHtml = ann.map(function (a) {
      return '<tr><td class="n"><span class="' + (a.kind || 'new') + '">' + a.n + '</span></td>' +
        '<td>' + a.what + '</td><td class="own">' + a.owner + '</td>' +
        '<td><span class="cls ' + a.cls + '">' + (a.clsText || ({ now: 'MVP Now', next: 'Next', dec: 'قرار فضل' })[a.cls]) + '</span></td>' +
        '<td>' + a.src + '</td></tr>';
    }).join('');
    board.querySelector('.panel').innerHTML =
      '<table><thead><tr><th>#</th><th>ما يتغيّر</th><th>المسؤول</th><th>التصنيف</th><th>مصدر البيانات</th></tr></thead><tbody>' +
      rowsHtml + '</tbody></table>' + (window.ANN_FOOT ? '<div class="foot">' + window.ANN_FOOT + '</div>' : '');

    // boxes + arrows
    var rr = row.getBoundingClientRect();
    var phoneR = board.querySelector('.phone').getBoundingClientRect();
    var gx = phoneR.left - rr.left - 30; // badge centre in the gutter (RTL: gutter is left of the phone)
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'ann-svg');
    svg.setAttribute('width', rr.width); svg.setAttribute('height', rr.height);
    var items = [];
    ann.forEach(function (a) {
      if (!a.sel) return;
      var el = document.querySelector(a.sel);
      if (!el) { console.warn('missing', a.sel); return; }
      var r = el.getBoundingClientRect();
      items.push({ a: a, x: r.left - rr.left - 3, y: r.top - rr.top - 3, w: r.width + 6, h: r.height + 6 });
    });
    items.sort(function (p, q2) { return (p.y + p.h / 2) - (q2.y + q2.h / 2); });
    var last = -1e9;
    items.forEach(function (it) {
      var col = KIND[it.a.kind || 'new'];
      var rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', it.x); rect.setAttribute('y', it.y);
      rect.setAttribute('width', it.w); rect.setAttribute('height', it.h);
      rect.setAttribute('rx', 8);
      rect.setAttribute('style', 'fill:none;stroke:' + col + ';stroke-width:2.2;stroke-dasharray:6 4');
      svg.appendChild(rect);
      var cy = it.y + Math.min(it.h / 2, 22);
      var by = Math.max(cy, last + 30); last = by;
      var path = document.createElementNS(svgNS, 'path');
      var x0 = it.x, xm = gx + 18;
      path.setAttribute('d', 'M' + x0 + ' ' + cy + ' L' + (xm + 14) + ' ' + cy + ' L' + xm + ' ' + by + ' L' + (gx + 13) + ' ' + by);
      path.setAttribute('style', 'fill:none;stroke:' + col + ';stroke-width:1.6');
      svg.appendChild(path);
      var head = document.createElementNS(svgNS, 'path'); // arrow head pointing at the box
      head.setAttribute('d', 'M' + x0 + ' ' + cy + ' l-8 -4.5 v9 z');
      head.setAttribute('style', 'fill:' + col);
      svg.appendChild(head);
      // corner badge on the box
      [[it.x + it.w, it.y, 10, 11], [gx, by, 13, 12.5]].forEach(function (b) {
        var c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', b[0]); c.setAttribute('cy', b[1]); c.setAttribute('r', b[2]);
        c.setAttribute('style', 'fill:' + (it.a.kind === 'v65' ? 'var(--jarna-secondary)' : it.a.kind === 'issue' ? 'var(--jarna-warning)' : 'var(--jarna-ink)') + ';stroke:var(--jarna-white);stroke-width:1.5');
        svg.appendChild(c);
        var t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', b[0]); t.setAttribute('y', b[1] + b[3] * 0.36);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('style', 'fill:var(--jarna-white);font:700 ' + b[3] + 'px Readex Pro,system-ui,sans-serif');
        t.textContent = it.a.n;
        svg.appendChild(t);
      });
    });
    row.appendChild(svg);
    body.setAttribute('data-ready', '1');
  }
  document.fonts.ready.then(function () { setTimeout(build, 50); });
})();
