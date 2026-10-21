"""Build upload images from HungerStation sources: square 1000x1000, white pad, WebP q75.

Usage: python3 images.py MASTER.xlsx SKU_LIST_FILE OUT_DIR [MAX_PER_SKU]
Keeps the main image plus up to MAX_PER_SKU-1 additional images (default 3 total).
"""
import io, os, sys, time, urllib.request
import openpyxl
from PIL import Image

CDN = "https://hungerstation.dhmedia.io/image/product-information-management/{}?width=1200&quality=90"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124"}
SIZE, QUALITY, FILL = 1000, 75, 0.85   # product covers ~85% of the frame (Listing Policy §5)


def square(im):
    im = im.convert("RGBA")
    bg = Image.new("RGBA", im.size, "white")
    im = Image.alpha_composite(bg, im).convert("RGB")
    # trim near-white border so every product is centred at the same scale
    gray = im.convert("L").point(lambda p: 255 if p < 245 else 0)
    box = gray.getbbox() or (0, 0, *im.size)
    im = im.crop(box)
    scale = SIZE * FILL / max(im.size)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGB", (SIZE, SIZE), "white")
    canvas.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2))
    return canvas


def main():
    master, sku_file, out = sys.argv[1:4]
    limit = int(sys.argv[4]) if len(sys.argv) > 4 else 3
    skus = set(open(sku_file).read().split())
    os.makedirs(out, exist_ok=True)
    wb = openpyxl.load_workbook(master, read_only=True)
    mm = list(wb["Media Map"].iter_rows(values_only=True))
    h = mm[0]
    rows = sorted((r for r in mm[1:] if r[0] in skus), key=lambda r: (r[0], int(r[h.index("Sequence")])))
    count, total = {}, 0
    for r in rows:
        sku, seq = r[0], int(r[h.index("Sequence")])
        if count.get(sku, 0) >= limit:
            continue
        name = f"{sku}-main.webp" if seq == 1 else f"{sku}-{count[sku] + 1:02d}.webp"
        data = urllib.request.urlopen(urllib.request.Request(CDN.format(r[h.index("Source Image (HS)")]), headers=UA), timeout=40).read()
        square(Image.open(io.BytesIO(data))).save(os.path.join(out, name), "WEBP", quality=QUALITY, method=6)
        count[sku] = count.get(sku, 0) + 1
        total += os.path.getsize(os.path.join(out, name))
        time.sleep(0.5)
    n = sum(count.values())
    print(f"{n} images for {len(count)} products, avg {total // max(n, 1) // 1024} KB")
    missing = skus - set(count)
    if missing:
        print("no images:", sorted(missing))


if __name__ == "__main__":
    main()
