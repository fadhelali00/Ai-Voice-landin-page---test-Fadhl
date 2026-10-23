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


# ---------------------------------------------------------------------------------------------
# Flat style (2026-10-23, Fadhl via spec "category tiles v2"): flat mint-white background, no
# oval, no text, 1-2 large products (3 only for small items) filling the tile, shared baseline.
#   compose_flat([cutout_clean(fetch(url)), ...], out_path)  ->  measurements dict
# Spec: group bbox >= 75% of tile height and >= 70% of width, opaque product pixels >= 40% of
# area, baseline ~92% height, soft consistent contact shadow, WebP quality 90.
# ---------------------------------------------------------------------------------------------
FLAT_BG = (240, 248, 246)          # #F0F8F6 = brand mint #E0F1EC mixed 50% with white (derived)
INK = (23, 45, 43)                 # #172D2B, tint for the contact shadow
BASE_Y = int(S * 0.92)             # shared baseline
TOP_Y = int(S * 0.045)             # highest point a product may reach
SIDE = int(S * 0.035)              # side margin


def cutout_clean(im, thr=238, band=4):
    """Cut-out without white halos.

    Transparent sources keep their alpha; white-studio sources are flood-filled from the border.
    In a thin band along the edge, alpha is re-estimated from how far the pixel is from white and
    the colour is un-mixed from the white matte, so no light fringe shows on a tinted background.
    Small detached specks (stray stickers, dust) are dropped.
    """
    im = im.convert("RGBA")
    a = np.array(im).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    h, w = al.shape
    edge = np.concatenate([al[0], al[-1], al[:, 0], al[:, -1]])
    if (edge < 16).mean() > 0.5:                      # real transparency around the product
        alpha = al / 255.0
    else:
        white = (rgb >= thr).all(axis=2)
        mask = Image.fromarray(np.where(white, 255, 0).astype(np.uint8))
        framed = Image.new("L", (w + 2, h + 2), 255)
        framed.paste(mask, (1, 1))
        ImageDraw.floodfill(framed, (0, 0), 128, thresh=0)
        bg = np.array(framed.crop((1, 1, w + 1, h + 1))) == 128
        alpha = np.where(bg, 0.0, 1.0)
        near = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(band * 2 + 1))) > 0
        soft = np.clip((255.0 - rgb.min(axis=2)) / 48.0, 0, 1)
        alpha = np.where(near & ~bg, np.minimum(alpha, soft), alpha)
    # drop detached specks smaller than 0.4% of the main body
    solid = alpha > 0.5
    lab = _label(solid)
    if lab.max() > 1:
        sizes = np.bincount(lab.ravel())
        sizes[0] = 0
        keep = sizes >= sizes.max() * 0.004
        alpha = np.where(keep[lab] | (lab == 0), alpha, 0)
        alpha = np.where((lab == 0) & (alpha > 0) & ~_grow(keep[lab], 3), 0, alpha)
    # un-mix the white matte from semi-transparent edge pixels
    am = np.clip(alpha, 1e-3, 1)[..., None]
    rgb = np.where(am < 0.999, np.clip((rgb - 255.0 * (1 - am)) / am, 0, 255), rgb)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    box = Image.fromarray((alpha > 0.08).astype(np.uint8) * 255).getbbox()
    return im.crop(box) if box else im


def _grow(mask, r):
    return np.array(Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(r * 2 + 1))) > 0


def _label(mask):
    """4-connected component labelling (small, dependency-free)."""
    try:
        from scipy.ndimage import label
        return label(mask)[0]
    except ImportError:
        im = Image.fromarray(mask.astype(np.uint8) * 255).convert("L")
        lab = np.zeros(mask.shape, np.int32)
        n = 0
        ys, xs = np.nonzero(mask)
        for y, x in zip(ys, xs):
            if lab[y, x]:
                continue
            n += 1
            ImageDraw.floodfill(im, (int(x), int(y)), n % 254 + 1, thresh=0)
            region = (np.array(im) == n % 254 + 1) & mask & (lab == 0)
            lab[region] = n
            im = Image.fromarray(mask.astype(np.uint8) * 255).convert("L")
        return lab


def _footprint(im):
    """Horizontal extent of the bottom 6% of an item's opaque pixels (where it touches the ground)."""
    al = np.array(im.getchannel("A")) > 100
    rows = np.nonzero(al.any(axis=1))[0]
    y0 = rows[-1] - max(2, int(im.height * 0.06))
    cols = np.nonzero(al[y0:].any(axis=0))[0]
    return cols[0], cols[-1]


def _arrange(items, layout):
    """Positions in an unscaled frame. items: list of (img, rel_height). Returns [(img, x, y_bottom)]."""
    hero_h = items[0][0].height
    placed = []
    sized = []
    for im, rel in items:
        r = hero_h * rel / im.height
        sized.append(im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS))
    ov = layout.get("overlap", 0.18)
    if len(sized) == 1:
        placed = [(sized[0], 0)]
    elif len(sized) == 2:
        a, b = sized
        side = layout.get("side", "right")             # where the front item sits
        if side == "right":
            placed = [(a, 0), (b, int(a.width - b.width * ov))]
        else:
            placed = [(a, 0), (b, int(-b.width + b.width * ov))]
    else:
        a, b, c = sized
        placed = [(a, 0), (b, int(-b.width + b.width * ov)), (c, int(a.width - c.width * ov))]
    return placed


def compose_flat(items, out=None, rel=None, layout=None, quality=90):
    """items: 1-3 cut-out RGBA images, hero first (drawn at the back).
    rel: height of each item relative to the hero (default 1, 0.78, 0.78).
    layout: {"overlap": fraction of a front item's width that overlaps the hero, "side": right|left,
             "lift": [px per item], "fill": target}.
    Returns the measurements and (if out) saves WebP."""
    layout = layout or {}
    rel = rel or [1.0, 0.78, 0.78][:len(items)]
    placed = _arrange(list(zip(items, rel)), layout)
    lift = layout.get("lift", [0] * len(placed))
    x0 = min(x for _, x in placed)
    x1 = max(x + im.width for im, x in placed)
    top = min(-im.height - l for (im, _), l in zip(placed, lift))
    gw, gh = x1 - x0, -top
    k = min((BASE_Y - TOP_Y) / gh, (S - 2 * SIDE) / gw) * layout.get("scale", 1.0)
    ox = (S - gw * k) / 2 - x0 * k
    canvas = Image.new("RGBA", (S, S), FLAT_BG + (255,))
    mask = Image.new("L", (S, S), 0)
    final = []
    for (im, x), l in zip(placed, lift):
        w, h = max(1, int(round(im.width * k))), max(1, int(round(im.height * k)))
        im2 = im.resize((w, h), Image.LANCZOS)
        px, py = int(round(ox + x * k)), int(round(BASE_Y - l * k - h))
        final.append((im2, px, py))
    _contact_shadow(canvas, final)
    for im2, px, py in final:
        canvas.alpha_composite(im2, (px, py))
        mask.paste(255, (px, py), im2.getchannel("A").point(lambda v: 255 if v >= 128 else 0))
    m = np.array(mask) > 0
    ys, xs = np.nonzero(m)
    meas = dict(area=round(m.mean() * 100, 1), height=round((ys.max() - ys.min() + 1) / S * 100, 1),
                width=round((xs.max() - xs.min() + 1) / S * 100, 1), baseline=round((ys.max() + 1) / S * 100, 1),
                scale_max=round(max(im2.width / it.width for (im2, _, _), it in zip(final, items)), 3))
    if out:
        canvas.convert("RGB").save(out, "WEBP", quality=quality, method=6)
    return meas, canvas


def _contact_shadow(canvas, final):
    """One soft ink-tinted ellipse under each item's footprint, same strength on every tile."""
    sh = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(sh)
    for im2, px, py in final:
        f0, f1 = _footprint(im2)
        fw = f1 - f0
        cx = px + (f0 + f1) / 2
        by = py + im2.height
        d.ellipse((cx - fw * 0.55, by - 10, cx + fw * 0.55, by + 14), fill=70)
        d.ellipse((cx - fw * 0.40, by - 5, cx + fw * 0.40, by + 6), fill=120)
    layer = Image.new("RGBA", (S, S), INK + (0,))
    layer.putalpha(sh.filter(ImageFilter.GaussianBlur(11)).point(lambda v: int(v * 0.55)))
    canvas.alpha_composite(layer)
