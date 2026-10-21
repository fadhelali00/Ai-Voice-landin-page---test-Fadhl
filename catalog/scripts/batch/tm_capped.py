# Tamimi search with a page cap; saves raw pages like tamimi_fetch.py (1.5 s between requests, retries on reset).
import json, os, sys, time
sys.path.insert(0, "/home/user/Ai-Voice-landin-page---test-Fadhl/catalog/scripts")
from tamimi_fetch import get, find_listing
raw, cap = sys.argv[1], int(sys.argv[2])
os.makedirs(raw, exist_ok=True)
for q in sys.argv[3:]:
    slug = "q:" + q
    for lang in ("en", "ar"):
        for page in range(1, cap + 1):
            fn = os.path.join(raw, f"{slug.replace(':', '_').replace(' ', '-')}_{lang}_{page}.json")
            for t in range(3):
                try:
                    data = get(slug, page, lang); break
                except Exception as e:
                    print("retry", q, lang, page, e, flush=True); time.sleep(15)
            else:
                break
            json.dump(data, open(fn, "w"), ensure_ascii=False)
            lst = find_listing(data)
            time.sleep(1.5)
            if not lst or not lst["product"] or page * 20 >= lst["count"]:
                break
        print(q, lang, "done", lst["count"] if lst else 0, flush=True)
