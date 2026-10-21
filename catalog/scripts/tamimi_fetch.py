"""Fetch Tamimi category listings (EN + AR) and flatten to one row per variant.

Usage: python3 tamimi_fetch.py OUT_DIR slug|q:search [...]
Polite: one request every 1.5 s, stops on any non-200.
"""
import json, os, sys, time, urllib.parse, urllib.request

BASE = "https://shop.tamimimarkets.com/api/layout/category"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
DELAY = 1.5


SEARCH = "https://shop.tamimimarkets.com/api/layout/search"


def get(slug, page, lang):
    """slug 'q:<text>' runs a search instead of a category listing."""
    if slug.startswith("q:"):
        url = f"{SEARCH}?q={urllib.parse.quote(slug[2:])}&page={page}"
    else:
        url = f"{BASE}?url={slug}&page={page}"
    req = urllib.request.Request(url,
                                 headers={"User-Agent": UA, "Accept-Language": lang})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def find_listing(o):
    """Return the dict that holds 'product' list + 'count'."""
    if isinstance(o, dict):
        if isinstance(o.get("product"), list) and "count" in o:
            return o
        for v in o.values():
            r = find_listing(v)
            if r:
                return r
    elif isinstance(o, list):
        for v in o:
            r = find_listing(v)
            if r:
                return r


def fetch_slug(slug, lang, raw_dir):
    products, page = [], 1
    while True:
        data = get(slug, page, lang)
        json.dump(data, open(os.path.join(raw_dir, f"{slug.replace(':', '_').replace(' ', '-')}_{lang}_{page}.json"), "w"), ensure_ascii=False)
        lst = find_listing(data)
        if not lst or not lst["product"]:
            break
        products += lst["product"]
        print(f"  {slug} {lang} p{page}: {len(products)}/{lst['count']}", flush=True)
        if len(products) >= lst["count"]:
            break
        page += 1
        time.sleep(DELAY)
    return products


def cat_path(c):
    names = []
    while c:
        names.append(c.get("name", ""))
        c = c.get("parentCategory")
    return " > ".join(reversed(names))


def flatten(prod_en, prod_ar_by_id):
    rows = []
    for p in prod_en:
        par = prod_ar_by_id.get(p["id"], {})
        var_ar = {v["id"]: v for v in par.get("variants") or []}
        variants = p.get("variants") or [p]
        for v in variants:
            va = var_ar.get(v.get("id"), {})
            sd = (v.get("storeSpecificData") or [{}])[0]
            mrp = float(sd.get("mrp") or 0)
            disc = float(sd.get("discount") or 0)
            rows.append({
                "tm_product_id": p["id"],
                "tm_variant_id": v.get("id"),
                "tm_item": v.get("clientItemId"),
                "barcodes": "|".join(v.get("barcodes") or []),
                "name_en": v.get("fullName") or p.get("name"),
                "name_ar": va.get("fullName") or par.get("name", ""),
                "brand_en": (p.get("brand") or {}).get("name", ""),
                "brand_ar": (par.get("brand") or {}).get("name", ""),
                "category_en": cat_path(p.get("primaryCategory")),
                "category_ar": cat_path(par.get("primaryCategory")),
                "price_sar": mrp,
                "price_after_discount_sar": round(mrp - disc, 2),
                "stock": sd.get("stock"),
                "image_url": (v.get("images") or [""])[0],
                "slug": p.get("slug"),
            })
    return rows


if __name__ == "__main__":
    out, slugs = sys.argv[1], sys.argv[2:]
    raw = os.path.join(out, "raw")
    os.makedirs(raw, exist_ok=True)
    all_rows = []
    for slug in slugs:
        en = fetch_slug(slug, "en", raw)
        time.sleep(DELAY)
        ar = fetch_slug(slug, "ar", raw)
        rows = flatten(en, {p["id"]: p for p in ar})
        for r in rows:
            r["tm_slug_source"] = slug
        all_rows += rows
        time.sleep(DELAY)
    json.dump(all_rows, open(os.path.join(out, "tamimi_variants.json"), "w"), ensure_ascii=False, indent=0)
    print("variants:", len(all_rows), "with barcode:", sum(1 for r in all_rows if r["barcodes"]))
