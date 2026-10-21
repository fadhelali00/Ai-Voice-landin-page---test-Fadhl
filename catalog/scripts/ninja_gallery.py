# Ninja product page: gallery image URLs (alt "<name> - view N") + barcodes from their file names (handles "_2" and " - 2" suffixes).
import html, json, re, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
IMG = re.compile(r'<img alt="([^"]+?) - view (\d+)"[^>]*?(?:srcSet|src)="([^"]+)"')
CODE = re.compile(r"/(\d{8,14})(?:_\d+|\s*-\s*\d+)?\.(?:png|jpe?g|webp)", re.I)
def parse(page):
    urls, codes = [], {}
    for alt, k, src in IMG.findall(page):
        u = html.unescape(src).split(",")[0].strip().split(" ")[0] if "srcSet" in page else html.unescape(src)
        first = html.unescape(src).split(",")[0].strip()
        u = re.sub(r"\s+\d+w$", "", first)
        u = u.split("?")[0]
        if u not in urls: urls.append(u)
        for c in CODE.findall(u):
            codes[c] = codes.get(c, 0) + 1
    return urls, sorted(codes, key=lambda c: -codes[c])
def one(n):
    pid = n["nj_id"].split("-", 1)[1]
    err = ""
    for t in range(2):
        try:
            req = urllib.request.Request(f"https://ananinja.com/sa/ar/product/x-{pid}", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=20) as r:
                page = r.read().decode("utf-8", "replace")
            time.sleep(0.8)
            urls, codes = parse(page)
            return {"nj_id": n["nj_id"], "gallery": urls, "page_barcodes": codes}
        except Exception as e:
            err = str(e)[:80]; time.sleep(3)
    return {"nj_id": n["nj_id"], "gallery": [], "page_barcodes": [], "error": err}
if __name__ == "__main__":
    items = json.load(open(sys.argv[1]))
    with ThreadPoolExecutor(3) as ex: out = list(ex.map(one, items))
    json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
    print("pages", len(out), "gallery", sum(1 for x in out if x["gallery"]), "barcode", sum(1 for x in out if x["page_barcodes"]), "errors", sum(1 for x in out if x.get("error")))
