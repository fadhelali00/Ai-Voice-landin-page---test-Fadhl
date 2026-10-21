"""Match held Jarna products (HS source) to Tamimi variants by brand + size + name.

Usage: python3 match.py MASTER.xlsx TAMIMI_JSON [TAMIMI_JSON ...] OUT.csv
"""
import csv, json, re, sys, difflib
import openpyxl

AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
UNIT = {"kg": ("g", 1000), "kilo": ("g", 1000), "كجم": ("g", 1000), "كيلو": ("g", 1000), "كغ": ("g", 1000),
        "g": ("g", 1), "gm": ("g", 1), "gr": ("g", 1), "grams": ("g", 1), "جم": ("g", 1), "غرام": ("g", 1), "جرام": ("g", 1), "غ": ("g", 1),
        "l": ("ml", 1000), "ltr": ("ml", 1000), "لتر": ("ml", 1000), "ml": ("ml", 1), "مل": ("ml", 1)}
STOP = {"rice", "pasta", "the", "and", "with", "of", "pack", "kg", "g", "gm", "ml", "x", "pcs", "piece"}


def size_of(text):
    """Return (pack_count, unit, total_per_unit) e.g. '3X180 G' -> (3,'g',180)."""
    t = (text or "").lower().translate(AR_DIGITS).replace("×", "x")
    m = re.search(r"(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*([a-z؀-ۿ]+)", t)
    if m:
        n, q, u = int(m.group(1)), float(m.group(2)), m.group(3)
    else:
        ms = re.findall(r"(\d+(?:\.\d+)?)\s*([a-z؀-ۿ]+)", t)
        ms = [x for x in ms if x[1] in UNIT]
        if not ms:
            return None
        n, (q, u) = 1, (float(ms[-1][0]), ms[-1][1])
    if u not in UNIT:
        return None
    base, f = UNIT[u]
    return (n, base, round(q * f, 1))


def toks(s):
    s = (s or "").lower().translate(AR_DIGITS)
    s = re.sub(r"[^a-z0-9؀-ۿ ]+", " ", s)
    return {w for w in s.split() if w not in STOP and not w.isdigit() and len(w) > 1}


SYN = {"flavour": "flavor", "macaroni": "pasta", "spaghetti": "spaghetti", "noodle": "noodles", "ramyun": "ramen", "big": "big", "cups": "cup"}


def ntoks(s, brand):
    bt = toks(brand)
    return {SYN.get(w, w) for w in toks(s) if w not in bt}


def sim(a, b, brand=""):
    """Share of the HS product's distinctive words found in the candidate (containment), blended with Jaccard."""
    A, B = ntoks(a, brand), ntoks(b, brand)
    if not A or not B:
        return 0.0
    return 0.7 * len(A & B) / len(A) + 0.3 * len(A & B) / len(A | B)


def brand_sim(a, b):
    a = re.sub(r"[^a-z]", "", (a or "").lower())
    b = re.sub(r"[^a-z]", "", (b or "").lower())
    if not a or not b:
        return 0.0
    if a in b or b in a:
        return 1.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def norm_gtin(code):
    """Tamimi drops leading zeros on UPC-A; restore to 12 digits when that makes a valid code."""
    if code.isdigit() and len(code) == 11 and gtin_ok("0" + code):
        return "0" + code
    return code


def gtin_ok(code):
    if not code.isdigit() or len(code) not in (8, 12, 13, 14):
        return False
    d = [int(c) for c in code]
    s = sum(x * (3 if i % 2 == 0 else 1) for i, x in enumerate(reversed(d[:-1])))
    return (10 - s % 10) % 10 == d[-1]


def main():
    master, *tjs, out = sys.argv[1:]
    tm = []
    for p in tjs:
        tm += json.load(open(p))
    wb = openpyxl.load_workbook(master, read_only=True)
    pm = list(wb["Product Master"].iter_rows(values_only=True))
    h = pm[0]
    I = lambda k: h.index(k)
    held = [r for r in pm[1:] if str(r[I("Product Status")]).startswith("Hold")]
    rows = []
    for r in held:
        en, ar = r[I("English Title")], r[I("Arabic Title")]
        brand = r[I("Brand EN")]
        sz = size_of(r[I("Net Content (EN)")]) or size_of(en)
        cands = []
        for t in tm:
            tsz = size_of(t["name_en"]) or size_of(t["name_ar"])
            size_eq = bool(sz and tsz and sz == tsz)
            b = brand_sim(brand, t["brand_en"])
            n = max(sim(en, t["name_en"], brand), sim(ar, t["name_ar"], r[I("Brand AR")]))
            score = 0.30 * b + 0.45 * n + 0.25 * size_eq
            cands.append((score, b, n, size_eq, t))
        cands.sort(key=lambda c: -c[0])
        score, b, n, size_eq, t = cands[0]
        second = cands[1][0] if len(cands) > 1 else 0
        if b >= 0.85 and size_eq and n >= 0.6 and score - second >= 0.03:
            tier = "strong"
        elif b >= 0.7 and (size_eq or n >= 0.5):
            tier = "possible"
        else:
            tier = "none"
        code = norm_gtin(t["barcodes"].split("|")[0]) if t["barcodes"] else ""
        rows.append({
            "sku": r[I("Internal SKU")], "hs_status": r[I("Product Status")],
            "hs_en": en, "hs_ar": ar, "hs_brand": brand, "hs_size": r[I("Net Content (EN)")],
            "hs_price": r[I("Regular Price SAR")], "hs_sub": r[I("HS Subcategory")],
            "hs_printed_code": r[I("Barcode")] or "",
            "tier": tier, "score": round(score, 3), "brand_sim": round(b, 2), "name_sim": round(n, 2),
            "size_equal": size_eq, "margin": round(score - second, 3),
            "tm_barcode": code, "gtin_valid": gtin_ok(code) if code else "",
            "in_store_code": code.startswith("2") if code else "",
            "tm_name_en": t["name_en"], "tm_name_ar": t["name_ar"], "tm_brand": t["brand_en"],
            "tm_price": t["price_sar"], "tm_price_after_discount": t["price_after_discount_sar"],
            "tm_category": t["category_en"], "tm_image": t["image_url"], "tm_item": t["tm_item"],
            "alt2": " || ".join(f'{c[4]["name_en"]} [{c[4]["brand_en"]}] {norm_gtin(c[4]["barcodes"].split("|")[0])} s={c[0]:.2f}' for c in cands[1:3]),
        })
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    from collections import Counter
    print(Counter(x["tier"] for x in rows))


if __name__ == "__main__":
    main()
