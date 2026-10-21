"""Match HungerStation products (Arabic names) to Ninja and Tamimi by normalized Arabic tokens + size.

Usage: python3 match_ar.py HS.json NINJA.json TAMIMI.json OUT.csv
For each HS product writes the best Ninja and best Tamimi candidate with scores, plus 2 runner-ups.
"""
import csv, json, re, sys

AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
UNITS = {"جرام": ("g", 1), "جم": ("g", 1), "غرام": ("g", 1), "غ": ("g", 1), "ج": ("g", 1), "جرامات": ("g", 1),
         "g": ("g", 1), "gm": ("g", 1), "gr": ("g", 1),
         "كيلو": ("g", 1000), "كجم": ("g", 1000), "كغ": ("g", 1000), "كيلوجرام": ("g", 1000), "kg": ("g", 1000),
         "مل": ("ml", 1), "ملل": ("ml", 1), "ملي": ("ml", 1), "ml": ("ml", 1),
         "لتر": ("ml", 1000), "ل": ("ml", 1000), "لترات": ("ml", 1000), "l": ("ml", 1000), "ltr": ("ml", 1000),
         "قطعة": ("pc", 1), "قطع": ("pc", 1), "حبة": ("pc", 1), "حبات": ("pc", 1), "بيضة": ("pc", 1), "pcs": ("pc", 1), "pc": ("pc", 1)}
STOP = {"و", "مع", "من", "في", "حزمة", "عبوة", "علبة", "كرتون", "طبق", "بحجم", "عبوات", "x", "pack"}


import functools
UNIT_KEYS = None


@functools.lru_cache(maxsize=None)
def norm(s):
    s = (s or "").lower().translate(AR_DIGITS)
    s = re.sub("[إأآا]", "ا", s)
    s = s.replace("ة", "ه").replace("ى", "ي").replace("ـ", "")
    s = re.sub(r"[ً-ْ]", "", s)               # diacritics
    s = s.replace("×", " x ").replace("*", " x ")
    s = re.sub(r"(\d)([^\d\s.,x])", r"\1 \2", s)          # 500جرام -> 500 جرام
    s = re.sub(r"([^\d\s.,])(\d)", r"\1 \2", s)
    return s


def unit_map():
    global UNIT_KEYS
    if UNIT_KEYS is None:
        UNIT_KEYS = {norm(k): v for k, v in UNITS.items()}
    return UNIT_KEYS


@functools.lru_cache(maxsize=None)
def size_of(name):
    t = norm(name)
    units = unit_map()
    m = re.search(r"(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*([^\s\d]+)", t) or None
    if m and units.get(m.group(3)):
        b, f = units[m.group(3)]
        return (int(m.group(1)), b, round(float(m.group(2)) * f, 1))
    m2 = re.search(r"(\d+(?:\.\d+)?)\s*([^\s\d]+)\s*x\s*(\d+)", t)   # 93 مل x 4
    if m2 and units.get(m2.group(2)):
        b, f = units[m2.group(2)]
        return (int(m2.group(3)), b, round(float(m2.group(1)) * f, 1))
    found = [(float(q), units[u]) for q, u in re.findall(r"(\d+(?:\.\d+)?)\s*([^\s\d]+)", t) if u in units]
    weight = [x for x in found if x[1][0] != "pc"]
    if weight:
        q, (b, f) = weight[-1]
        count = next((int(q2) for q2, (b2, _) in found if b2 == "pc"), 1)
        return (count, b, round(q * f, 1))
    if found:
        return (int(found[0][0]), "pc", 1)
    return None


@functools.lru_cache(maxsize=None)
def toks(name):
    t = norm(name)
    t = re.sub(r"[^\w\s]", " ", t)
    out = set()
    for w in t.split():
        if w.isdigit() or w in STOP or w in unit_map():
            continue
        if w.startswith("ال") and len(w) > 4:
            w = w[2:]
        out.add(w)
    return frozenset(out)


def score(a_name, b_name):
    A, B = toks(a_name), toks(b_name)
    if not A or not B:
        return 0.0, False
    contain = len(A & B) / len(A)
    jac = len(A & B) / len(A | B)
    sa, sb = size_of(a_name), size_of(b_name)
    size_eq = bool(sa and sb and sa == sb)
    return 0.55 * contain + 0.2 * jac + 0.25 * size_eq, size_eq


def best(hs, cands, key):
    scored = []
    for c in cands:
        s, eq = score(hs["name_ar"], c[key])
        scored.append((s, eq, c))
    scored.sort(key=lambda x: -x[0])
    return scored[:3]


def main():
    hs, nj, tm, out = sys.argv[1:]
    hs, nj, tm = json.load(open(hs)), json.load(open(nj)), json.load(open(tm))
    rows = []
    for h in hs:
        bn, bt = best(h, nj, "name_ar"), best(h, tm, "name_ar_full")
        n0, t0 = bn[0], bt[0]
        rows.append({
            "hs_id": h["hs_id"], "hs_sub": h["sub"], "hs_name": h["name_ar"], "hs_price": h["price"], "hs_special": h["special_price"],
            "hs_size": size_of(h["name_ar"]),
            "nj_score": round(n0[0], 3), "nj_size_eq": n0[1], "nj_margin": round(n0[0] - bn[1][0], 3),
            "nj_name_ar": n0[2]["name_ar"], "nj_name_en": n0[2]["name_en"], "nj_barcode": n0[2]["barcode_from_img"] or "",
            "nj_price": n0[2]["price"],
            "tm_score": round(t0[0], 3), "tm_size_eq": t0[1], "tm_margin": round(t0[0] - bt[1][0], 3),
            "tm_name_ar": t0[2]["name_ar"], "tm_name_en": t0[2]["name_en"], "tm_barcode": t0[2]["barcodes"].split("|")[0],
            "tm_price": t0[2]["price_sar"],
            "tm_alt": " || ".join(f'{c[2]["name_ar"]} {c[2]["barcodes"].split("|")[0]} {c[0]:.2f}' for c in bt[1:]),
        })
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
