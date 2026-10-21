# Rebuild Tamimi variant rows from saved raw page JSON files (all *_en_N / *_ar_N in given raw dirs).
import glob, json, os, re, sys
sys.path.insert(0, "/home/user/Ai-Voice-landin-page---test-Fadhl/catalog/scripts")
from tamimi_fetch import find_listing, flatten
out = sys.argv[1]
groups = {}
for d in sys.argv[2:]:
    for f in glob.glob(d + "/*.json"):
        m = re.match(r"(.+)_(en|ar)_(\d+)\.json$", os.path.basename(f))
        if not m: continue
        lst = find_listing(json.load(open(f)))
        if lst and lst["product"]:
            groups.setdefault(m.group(1), {"en": [], "ar": []})[m.group(2)] += lst["product"]
rows = []
for slug, g in groups.items():
    for r in flatten(g["en"], {p["id"]: p for p in g["ar"]}):
        r["tm_slug_source"] = slug; rows.append(r)
seen, uniq = set(), []
for r in rows:
    if r["tm_variant_id"] in seen: continue
    seen.add(r["tm_variant_id"]); uniq.append(r)
json.dump(uniq, open(out, "w"), ensure_ascii=False, indent=0)
print("slugs", len(groups), "rows", len(rows), "unique", len(uniq))
