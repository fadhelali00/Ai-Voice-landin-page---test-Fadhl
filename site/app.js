// Mithqal landing page behaviour. The page reads correctly without this file.
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Money formatting: decimal strings, halalas as integers (no float drift) ---------- */
const fmt = h => { // h = halalas (integer)
  const neg = h < 0; h = Math.abs(h);
  const s = (Math.floor(h / 100)).toLocaleString('en-US') + '.' + String(h % 100).padStart(2, '0');
  return neg ? '-' + s : s;
};
const vatOf = net => Math.round(net * 15 / 100); // half away from zero on positive amounts (BR-TAX-001)

/* ---------- Live invoice ---------- */
const PRICE = 20000, AVG_COST = 11750; // halalas
const st = { qty: 4, approved: false, cancelled: false, noStock: false };
const $ = id => document.getElementById(id);
const row = (code, name, dr, cr, tag = '') =>
  `<tr><td><span class="code">${code}</span> ${name}${tag}</td><td class="end num">${dr ? fmt(dr) : ''}</td><td class="end num">${cr ? fmt(cr) : ''}</td></tr>`;

function lines() {
  const net = st.qty * PRICE, vat = vatOf(net), gross = net + vat, cost = st.qty * AVG_COST;
  return { net, vat, gross, cost };
}

function render(flash) {
  const { net, vat, gross, cost } = lines();
  $('qty-out').textContent = st.qty;
  $('l-qty').textContent = st.qty;
  $('l-net').textContent = fmt(net);
  $('t-net').textContent = fmt(net);
  $('t-vat').textContent = fmt(vat);
  $('t-gross').textContent = fmt(gross);
  const prov = st.noStock ? '<span class="prov">تكلفة مؤقتة · تُسوّى عند الشراء</span>' : '';
  $('je-body').innerHTML =
    row('1103', 'العملاء', gross, 0) + row('4101', 'المبيعات', 0, net) + row('2201', 'ضريبة المخرجات', 0, vat) +
    row('5101', 'تكلفة المبيعات', cost, 0, prov) + row('1104', 'المخزون', 0, cost);
  $('je-dr').textContent = fmt(gross + cost);
  $('je-cr').textContent = fmt(net + vat + cost);
  if (flash && !reduce) $('je-body').querySelectorAll('tr').forEach(tr => { tr.classList.add('flash'); setTimeout(() => tr.classList.remove('flash'), 450); });
}

$('qty').addEventListener('input', e => { st.qty = +e.target.value; render(true); });

$('no-stock').addEventListener('change', e => {
  st.noStock = e.target.checked;
  if (st.approved) { // posted lines do not change; the flag only shows on the next invoice
    e.target.checked = st.noStock = false;
    extra('<span class="status status-amber"><i></i><span>القيد مرحّل ولا يتغير. التكلفة المؤقتة تظهر في الفاتورة التالية.</span></span>');
    return;
  }
  render(true);
});

function extra(html) { const x = $('je-extra'); x.hidden = false; x.innerHTML = html; x.classList.remove('pulse'); void x.offsetWidth; x.classList.add('pulse'); }

$('approve').addEventListener('click', () => {
  if (st.approved) return;
  st.approved = true;
  const t = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(',', '');
  $('inv-no').innerHTML = '<span class="num">INV-2026-000184</span>';
  $('inv-time').innerHTML = `<span class="num">${t}</span> بتوقيت الرياض`;
  $('inv-status').className = 'status status-emerald';
  $('inv-status').querySelector('span').textContent = 'معتمدة';
  $('je-title').textContent = 'القيد المرحّل';
  $('qty').disabled = true;
  $('qty-help').textContent = 'الفاتورة معتمدة: الكمية والسعر لا يتغيران بعد الآن.';
  $('approve').disabled = true; $('approve').textContent = 'اعتُمدت الفاتورة';
  $('try-edit').disabled = false; $('try-cn').disabled = false;
  $('invoice').classList.remove('pulse'); void $('invoice').offsetWidth; $('invoice').classList.add('pulse');
});

$('try-edit').addEventListener('click', () => {
  extra('<span class="status status-crimson"><i></i><span>لا يمكن تعديل فاتورة معتمدة. صحّحها بإشعار دائن مرتبط بها.</span></span>');
});

$('try-cn').addEventListener('click', () => {
  if (st.cancelled) return;
  st.cancelled = true;
  const { net, vat, gross, cost } = lines();
  $('inv-status').className = 'status status-neutral';
  $('inv-status').querySelector('span').textContent = 'ملغاة';
  extra(`<p><b>إشعار دائن <span class="num">CN-2026-000031</span></b> مرتبط بالفاتورة، وقيده العكسي:</p>
    <table class="je-table"><tbody>${row('4101', 'المبيعات', net, 0) + row('2201', 'ضريبة المخرجات', vat, 0) + row('1103', 'العملاء', 0, gross) + row('1104', 'المخزون', cost, 0) + row('5101', 'تكلفة المبيعات', 0, cost)}</tbody></table>
    <p style="margin-top:6px;color:var(--ink-soft)">الفاتورة الأصلية تبقى ظاهرة بحالة «ملغاة».</p>`);
  $('try-cn').setAttribute('aria-pressed', 'true');
  $('try-edit').disabled = true;
});

$('try-other').addEventListener('click', () => {
  extra('<span class="status status-neutral"><i></i><span>لا توجد فاتورة بهذا الرقم في منشأتك.</span></span><p style="margin-top:6px;color:var(--ink-soft)">النظام لا يكشف حتى وجود سجلات منشأة أخرى.</p>');
});

/* ---------- AI draft: approval stays human ---------- */
$('ai-approve').addEventListener('click', () => {
  const f = $('ai-foot');
  f.classList.add('warn');
  f.textContent = 'هذا مثال: عند الإطلاق، الاعتماد يتطلب مستخدماً بصلاحية الترحيل، ويُسجَّل باسمه في سجل التدقيق.';
});

/* ---------- IFRS 18 classification ---------- */
$('cls').addEventListener('change', e => {
  const v = e.target.value, B = 620000; // halalas
  const op = 27620000 - (v === 'op' ? B : 0);
  const bf = op + 1840000;
  const pbt = bf - 2270000 - (v === 'fin' ? B : 0);
  $('pl-bank-op').hidden = v !== 'op';
  $('pl-bank-fin').hidden = v !== 'fin';
  [['pl-op', op], ['pl-bf', bf], ['pl-pbt', pbt]].forEach(([id, h]) => { const el = $(id); el.textContent = fmt(h); el.classList.toggle('changed', !!v); });
  $('pl-warn').hidden = !!v;
});

/* ---------- Pricing: monthly / annual ---------- */
const periodBtns = document.querySelectorAll('.period button');
periodBtns.forEach(b => b.addEventListener('click', () => {
  const p = b.dataset.period;
  periodBtns.forEach(x => x.setAttribute('aria-checked', String(x === b)));
  document.querySelectorAll('[data-y][data-m]').forEach(el => {
    el.classList.add('swap', 'out');
    setTimeout(() => { el.textContent = el.dataset[p]; el.classList.remove('out'); }, reduce ? 0 : 160);
  });
}));
document.querySelector('.period').addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const btns = [...periodBtns], i = btns.findIndex(b => b.getAttribute('aria-checked') === 'true');
  const n = btns[(i + 1) % btns.length]; n.click(); n.focus();
});

/* Phone: the comparison table becomes one block per plan */
(function planBlocks() {
  const table = document.querySelector('.ptable');
  const heads = [...table.querySelectorAll('thead th')];
  const rows = [...table.querySelectorAll('tbody tr:not(.pcta)')];
  const ctas = [...table.querySelectorAll('.pcta td')].slice(1);
  const wrap = document.createElement('div');
  wrap.className = 'pblocks';
  heads.forEach((h, i) => {
    const b = document.createElement('div');
    b.className = 'pblock' + (h.classList.contains('rec') ? ' rec' : '');
    b.innerHTML = h.innerHTML + ctas[i].innerHTML + '<dl>' + rows.map(r => `<div><dt>${r.querySelector('th').textContent}</dt><dd>${r.children[i + 1].outerHTML.replace(/^<td/, '<span').replace(/td>$/, 'span>')}</dd></div>`).join('') + '</dl>';
    wrap.appendChild(b);
  });
  table.closest('.ptable-wrap').after(wrap);
})();

/* ---------- Subdomain field (format only; availability is checked at sign-up) ---------- */
const RESERVED = ['admin', 'app', 'api', 'www', 'mail', 'help', 'support', 'status', 'billing', 'mithqal', 'evexa', 'root', 'staff'];
const sub = $('sub'), msg = $('sub-msg');
function checkSub() {
  const v = sub.value.trim();
  sub.value = v.toLowerCase();
  const s = sub.value;
  msg.className = 'sub-msg';
  if (!s) { msg.textContent = ''; return false; }
  if (!/^[a-z0-9-]+$/.test(s)) { msg.textContent = 'استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطة فقط.'; msg.classList.add('bad'); return false; }
  if (s.length < 3 || s.length > 30) { msg.textContent = 'العنوان من 3 إلى 30 حرفاً.'; msg.classList.add('bad'); return false; }
  if (s.startsWith('-') || s.endsWith('-')) { msg.textContent = 'لا يبدأ العنوان بشرطة ولا ينتهي بها.'; msg.classList.add('bad'); return false; }
  if (RESERVED.includes(s)) { msg.textContent = 'هذا العنوان محجوز. اختر اسماً آخر.'; msg.classList.add('bad'); return false; }
  msg.textContent = `عنوانك: ${s}.mithqal.sa · نتحقق من توفره عند التسجيل.`;
  msg.classList.add('ok');
  return true;
}
sub.addEventListener('input', checkSub);
$('signup').addEventListener('submit', e => {
  e.preventDefault();
  if (!checkSub()) { if (!sub.value) { msg.textContent = 'اكتب العنوان الذي تريده لمنشأتك.'; msg.className = 'sub-msg bad'; } sub.focus(); return; }
  msg.textContent = `نموذج أولي: هنا ينتقل التسجيل إلى ${sub.value}.mithqal.sa بعد إدخال البريد وكلمة المرور.`;
});

/* ---------- Entrances: per section, in reading order ---------- */
document.querySelectorAll('section').forEach(sec => {
  sec.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 4) * 70 + 'ms'));
});
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }));
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  // Safety net: anything the reader has already scrolled past is shown, even if an observer callback was missed.
  let tick = 0;
  addEventListener('scroll', () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0;
    document.querySelectorAll('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); });
  }); }, { passive: true });
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('loaded')));
