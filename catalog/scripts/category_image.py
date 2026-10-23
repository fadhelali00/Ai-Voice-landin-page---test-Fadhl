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
SIDE = int(S * 0.025)              # side margin (rounded tile corners clip < 4px here)


def cutout_clean(im, thr=238, band=4, shadow=True, shadow_min=196, shadow_chroma=12, floor_chroma=48, floor_min=None, floor_sat=None, speck=0.015):
    """Cut-out without white halos.

    Transparent sources keep their alpha; white-studio sources are flood-filled from the border.
    shadow=True also removes the source's own grey floor shadow / reflection (bright, colourless
    pixels connected to the background; in the bottom 30% of the object a tinted reflection up to
    floor_chroma is also removed, and with floor_sat any pale desaturated mirror image); turn it off
    for white or silver products.
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
        if shadow:                                     # semi-transparent grey shadows baked in the alpha
            grey = (rgb.max(axis=2) - rgb.min(axis=2) <= shadow_chroma) & (rgb.min(axis=2) < 140) & (al < 200)
            alpha = np.where(grey, 0, alpha)
    else:
        white = (rgb >= thr).all(axis=2)
        if shadow:
            chroma = rgb.max(axis=2) - rgb.min(axis=2)
            bright = rgb.min(axis=2) >= shadow_min
            white |= bright & (chroma <= shadow_chroma)
            rows = np.nonzero((~white).any(axis=1))[0]
            if len(rows):
                y0 = int(rows[0] + (rows[-1] - rows[0]) * 0.7)
                floor = np.zeros_like(white)
                floor[y0:] = True
                fbright = rgb.min(axis=2) >= (floor_min if floor_min is not None else shadow_min)
                white |= floor & fbright & (chroma <= floor_chroma)
                if floor_sat is not None:                  # pale, desaturated mirror image under the item
                    mx = rgb.max(axis=2)
                    sat = chroma / np.maximum(mx, 1)
                    white |= floor & (sat <= floor_sat) & (mx >= 175)
        mask = Image.fromarray(np.where(white, 255, 0).astype(np.uint8))
        framed = Image.new("L", (w + 2, h + 2), 255)
        framed.paste(mask, (1, 1))
        ImageDraw.floodfill(framed, (0, 0), 128, thresh=0)
        bg = np.array(framed.crop((1, 1, w + 1, h + 1))) == 128
        hard = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))
        alpha = np.array(hard.filter(ImageFilter.GaussianBlur(1.0))) / 255.0
        near = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(band * 2 + 1))) > 0
        soft = np.clip((255.0 - rgb.min(axis=2)) / 48.0, 0, 1)
        alpha = np.where(near & ~bg, np.minimum(alpha, soft), alpha)
    # drop detached specks (stray stickers, badges, dust) smaller than `speck` of the main body
    solid = alpha > 0.5
    lab = _label(solid)
    if lab.max() > 1:
        sizes = np.bincount(lab.ravel())
        sizes[0] = 0
        keep = sizes >= sizes.max() * speck
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
    """Connected-component labels; without scipy the speck filter is skipped (one component)."""
    try:
        from scipy.ndimage import label
        return label(mask)[0]
    except ImportError:
        return mask.astype(np.int32)


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
    ta = (S - 2 * SIDE) / (BASE_Y - TOP_Y)            # tile frame aspect: aim the group at it
    ov = layout.get("overlap", "auto")
    if len(sized) == 1:
        placed = [(sized[0], 0)]
    elif len(sized) == 2:
        a, b = sized
        if ov == "auto":                                # overlap so the pair is about as wide as the frame
            ov = float(np.clip(1 - (ta * hero_h - a.width) / b.width, 0.2, 0.9))
        side = layout.get("side", "right")             # where the front item sits
        if side == "right":
            placed = [(a, 0), (b, int(a.width - b.width * ov))]
        else:
            placed = [(a, 0), (b, int(-b.width + b.width * ov))]
    else:
        a, b, c = sized
        if ov == "auto":
            ov = float(np.clip(1 - (ta * hero_h - a.width) / (b.width + c.width), 0.2, 0.85))
        placed = [(a, 0), (b, int(-b.width + b.width * ov)), (c, int(a.width - c.width * ov))]
    return placed


def compose_flat(items, out=None, rel=None, layout=None, quality=90, quiet=False, no_upscale=True, max_scale=None,
                 sharpen=False, side=None):
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
    sd = SIDE if side is None else side                # wide groups may use a narrower side margin
    k = min((BASE_Y - TOP_Y) / gh, (S - 2 * sd) / gw) * layout.get("scale", 1.0)
    if no_upscale or max_scale:                        # cap enlargement: 1.0 by default, or max_scale
        cap = max_scale or 1.0
        k = min([k] + [cap * it.width / im.width for (im, _), it in zip(placed, items)])
    ox = (S - gw * k) / 2 - x0 * k
    canvas = Image.new("RGBA", (S, S), FLAT_BG + (255,))
    mask = Image.new("L", (S, S), 0)
    final = []
    for (im, x), l, it in zip(placed, lift, items):
        w, h = max(1, int(round(im.width * k))), max(1, int(round(im.height * k)))
        im2 = it.resize((w, h), Image.LANCZOS)             # one resample, straight from the source cut-out
        if sharpen and w > it.width * 1.05:                # mild unsharp mask on enlarged items only
            rgb = im2.convert("RGB").filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
            rgb.putalpha(im2.getchannel("A"))
            im2 = rgb
        px, py = int(round(ox + x * k)), int(round(BASE_Y - l * k - h))
        final.append((im2, px, py))
    if not quiet:
        _contact_shadow(canvas, final)
    hero = Image.new("L", (S, S), 0)
    hero.paste(255, final[0][1:], final[0][0].getchannel("A").point(lambda v: 255 if v >= 128 else 0))
    for im2, px, py in final:
        if not quiet:
            canvas.alpha_composite(im2, (px, py))
        mask.paste(255, (px, py), im2.getchannel("A").point(lambda v: 255 if v >= 128 else 0))
    m = np.array(mask) > 0
    hm = np.array(hero) > 0
    front = Image.new("L", (S, S), 0)
    for im2, px, py in final[1:]:
        front.paste(255, (px, py), im2.getchannel("A").point(lambda v: 255 if v >= 128 else 0))
    hidden = (hm & (np.array(front) > 0)).sum() / max(1, hm.sum())
    ys, xs = np.nonzero(m)
    meas = dict(area=round(float(m.mean()) * 100, 1), height=round((ys.max() - ys.min() + 1) / S * 100, 1),
                width=round((xs.max() - xs.min() + 1) / S * 100, 1), baseline=round((ys.max() + 1) / S * 100, 1),
                scale_max=round(max(im2.width / it.width for (im2, _, _), it in zip(final, items)), 3),
                hero_hidden=round(float(hidden) * 100, 1))
    meas = {k: float(v) for k, v in meas.items()}
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


def auto_layout(items, rels=(0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5), overlaps=None, max_hidden=35.0):
    """Search the size of the front item(s) and their overlap with the hero for the largest fill that
    meets the spec (height >= 77%, width >= 72%, area >= 42%, hero at most max_hidden% covered).
    Works on quarter-size copies, so it is fast. Returns (rel, layout, measurements)."""
    if len(items) == 1:
        return [1.0], {}, None
    small = []
    for im in items:
        t = im.copy()
        t.thumbnail((max(8, im.width // 4), max(8, im.height // 4)))
        small.append(t)
    overlaps = overlaps or [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.05]
    best = None
    for r in rels:
        rel = [1.0] + [r] * (len(items) - 1)
        for ov in overlaps:
            m, _ = compose_flat(small, None, rel=rel, layout={"overlap": ov}, quiet=True, no_upscale=False)
            ok = m["height"] >= 77 and m["width"] >= 72 and m["area"] >= 42 and m["hero_hidden"] <= max_hidden
            score = m["area"] + 0.2 * m["height"] + 3 * r - 0.4 * max(0, m["hero_hidden"] - 12) + (100 if ok else 0)
            if not best or score > best[0]:
                best = (score, rel, {"overlap": ov}, m)
    return best[1], best[2], best[3]
