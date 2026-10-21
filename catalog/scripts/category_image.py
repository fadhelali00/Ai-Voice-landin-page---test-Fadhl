"""Compose a Jarna category image in the house style: cream background, soft mint oval,
2-3 real product cut-outs with soft shadows. Output 1024x1024 WebP.

Usage (as module): compose([cutout(fetch(url)), ...], out_path)
"""
import io, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 1024
BG = (253, 249, 243)
MINT = (222, 241, 234)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124"}


def fetch(url):
    return Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()))


def cutout(im, thr=236):
    """Remove the white studio background: flood-fill near-white pixels connected to the border."""
    im = im.convert("RGBA")
    a = np.array(im)
    if a[..., 3].min() < 250:                       # source already has transparency
        alpha = Image.fromarray(a[..., 3])
    else:
        white = (a[..., :3] >= thr).all(axis=2)
        mask = Image.fromarray(np.where(white, 255, 0).astype(np.uint8))
        framed = Image.new("L", (mask.width + 2, mask.height + 2), 255)
        framed.paste(mask, (1, 1))
        ImageDraw.floodfill(framed, (0, 0), 128, thresh=0)
        bg = np.array(framed.crop((1, 1, mask.width + 1, mask.height + 1))) == 128
        alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
        alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    im.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
    return im.crop(box) if box else im


def background():
    bg = Image.new("RGB", (S, S), BG)
    oval = Image.new("L", (S, S), 0)
    ImageDraw.Draw(oval).ellipse((92, 150, 932, 760), fill=255)
    bg.paste(Image.new("RGB", (S, S), MINT), (0, 0), oval.filter(ImageFilter.GaussianBlur(6)))
    return bg.convert("RGBA")


def shadow(canvas, x0, x1, base_y):
    sh = Image.new("L", (S, S), 0)
    w = x1 - x0
    ImageDraw.Draw(sh).ellipse((x0 + w * 0.06, base_y - 12, x1 - w * 0.06, base_y + 16), fill=95)
    layer = Image.new("RGBA", (S, S), (70, 60, 50, 0))
    layer.putalpha(sh.filter(ImageFilter.GaussianBlur(13)))
    canvas.alpha_composite(layer)


def place(canvas, im, cx, base_y, max_h, max_w):
    r = min(max_h / im.height, max_w / im.width)
    im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    x = int(cx - im.width / 2)
    shadow(canvas, x, x + im.width, base_y)
    canvas.alpha_composite(im, (x, int(base_y - im.height)))


def compose(items, out):
    """items: 1-3 cut-out RGBA images; the first is the hero (back), the others sit in front."""
    c = background()
    base = 900
    if len(items) == 1:
        place(c, items[0], 512, base, 700, 720)
    elif len(items) == 2:
        place(c, items[0], 410, base - 20, 690, 520)
        place(c, items[1], 670, base, 480, 440)
    else:
        place(c, items[0], 512, base - 40, 660, 440)
        place(c, items[1], 280, base, 460, 380)
        place(c, items[2], 750, base + 10, 430, 380)
    c.convert("RGB").save(out, "WEBP", quality=88, method=6)
