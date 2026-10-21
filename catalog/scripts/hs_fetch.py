"""Fetch HungerStation Market (dark store) products for given subcategory ids, Arabic + English.

Usage: python3 hs_fetch.py VENDOR_ID OUT.json "<group>|<sub_id>|<sub_name>" ...
Polite: one request per second.
"""
import json, sys, time, urllib.request

API = "https://hungerstation.com/cw-api/category-products?vendorId={v}&isDarkstore=true&locale={loc}&page={p}&perPage=100&categoryId={c}"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"


def fetch(vendor, cat, loc):
    items, page = [], 1
    while True:
        req = urllib.request.Request(API.format(v=vendor, loc=loc, p=page, c=cat), headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=40) as r:
            d = json.load(r)
        items += d.get("items", [])
        time.sleep(1)
        if d.get("meta", {}).get("isLastPage", True) or not d.get("items"):
            return items
        page += 1


if __name__ == "__main__":
    vendor, out, *subs = sys.argv[1:]
    rows = []
    for s in subs:
        group, cid, name = s.split("|")
        ar = fetch(vendor, cid, "ar-SA")
        en = {x["id"]: x for x in fetch(vendor, cid, "en-US")}
        for x in ar:
            e = en.get(x["id"], {})
            rows.append({
                "hs_id": x["id"], "hs_sku": x.get("sku"), "group": group, "sub": name,
                "name_ar": x.get("name"), "name_en": e.get("name", ""),
                "price": x.get("originalPrice"), "special_price": x.get("price") if x.get("price") != x.get("originalPrice") else None,
                "images": [i["url"].split("/")[-1].split("?")[0] for i in x.get("images") or []],
            })
        print(f"{group} / {name}: {len(ar)}", flush=True)
    json.dump(rows, open(out, "w"), ensure_ascii=False, indent=0)
    print("total", len(rows), "unique", len({r['hs_id'] for r in rows}))
