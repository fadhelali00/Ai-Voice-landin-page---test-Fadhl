"""Fetch Ninja product pages and read barcodes from the product's own gallery image file names.

Usage: python3 ninja_pages.py IN.json OUT.json   (IN = list of Ninja items with nj_id like "5-1235")
Only images whose alt text is "<product name> - view N" count, so banners and suggestions are ignored.
"""
import html, json, re, sys, time, urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
IMG = re.compile(r'<img alt="([^"]+?) - view \d+"[^>]*?(?:srcSet|src)="([^"]+)"')
CODE = re.compile(r"/(\d{8,14})(?:_\d+|\s*-\s*\d+)?\.(?:png|jpe?g|webp)", re.I)


def gallery_barcodes(page):
    codes = {}
    for alt, src in IMG.findall(page):
        for c in CODE.findall(html.unescape(src)):
            codes[c] = codes.get(c, 0) + 1
    return sorted(codes, key=lambda c: -codes[c])


if __name__ == "__main__":
    items = json.load(open(sys.argv[1]))
    out = []
    for i, n in enumerate(items):
        pid = n["nj_id"].split("-", 1)[1]
        req = urllib.request.Request(f"https://ananinja.com/sa/ar/product/x-{pid}", headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                page = r.read().decode("utf-8", "replace")
            n = dict(n, page_barcodes=gallery_barcodes(page))
        except Exception as e:
            n = dict(n, page_barcodes=[], error=str(e)[:80])
        out.append(n)
        if i % 20 == 0:
            print(i, n["name_ar"][:40], n.get("page_barcodes"), flush=True)
        time.sleep(1.2)
    json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
    print("pages", len(out), "with barcode", sum(1 for x in out if x["page_barcodes"]))
