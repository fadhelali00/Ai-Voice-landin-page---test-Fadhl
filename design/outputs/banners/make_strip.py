"""Build Jarna home banners (1600x900, 16:9) as HTML pages; render.cjs screenshots them to PNG/WebP."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PETROL, PETROL_DK, MINT, CORAL, INK, WHITE = "#006B63", "#004F49", "#E0F1EC", "#FF745E", "#172D2B", "#FFFFFF"

BANNERS = [
    {"id": "s1_welcome", "bg": PETROL, "blob": "rgba(255,255,255,.10)", "fg": WHITE, "sub": "rgba(255,255,255,.88)",
     "title": "وش تحتاج اليوم؟", "text": "الطازج والمقاضي في طلب واحد", "cta": "ابدأ التسوق",
     "items": [("laban", 470, 520, 120, 2), ("oil", 500, 300, 100, 3), ("tomato", 220, 640, 380, 4), ("orange", 190, 290, 420, 5)]},
    {"id": "s2_produce", "bg": MINT, "blob": "rgba(0,107,99,.08)", "fg": INK, "sub": "#3F524E",
     "title": "عروض الخضار والفواكه", "text": "أسعار مخفّضة على أصناف مختارة", "cta": "تسوّق العروض",
     "items": [("guava", 340, 560, 90, 2), ("tomato", 280, 290, 130, 3), ("orange", 230, 650, 380, 4), ("cucumber", 170, 300, 420, 5)]},
    {"id": "s3_dairy", "bg": WHITE, "blob": MINT, "fg": PETROL, "sub": "#3F524E",
     "title": "الألبان والبيض", "text": "لبن، زبادي، بيض وقشطة", "cta": "اطلب الآن",
     "items": [("laban", 500, 560, 90, 2), ("yogurt", 350, 290, 250, 3), ("eggs", 210, 520, 430, 4)]},
    {"id": "s4_pantry", "bg": PETROL_DK, "blob": "rgba(224,241,236,.10)", "fg": WHITE, "sub": "rgba(255,255,255,.88)",
     "title": "مقاضي البيت", "text": "رز، زيوت، صلصات وبهارات", "cta": "تسوّق المقاضي",
     "items": [("rice", 500, 470, 110, 2), ("oil", 460, 280, 170, 3), ("ketchup", 300, 790, 340, 4), ("spice", 240, 520, 400, 5)]},
]

TPL = """<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=block" rel="stylesheet">
<style>
html,body{{margin:0;width:1680px;height:700px;overflow:hidden;font-family:'IBM Plex Sans Arabic',sans-serif}}
.b{{position:relative;width:1680px;height:700px;background:{bg};overflow:hidden}}
.blob{{position:absolute;left:200px;top:40px;width:820px;height:640px;border-radius:50%;background:{blob}}}
.txt{{position:absolute;right:270px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;gap:34px}}
h1{{margin:0;font-size:84px;line-height:1.15;font-weight:700;color:{fg}}}
p{{margin:0;font-size:40px;line-height:1.45;font-weight:500;color:{sub}}}
.cta{{align-self:flex-start;margin-top:6px;background:{coral};color:{ink};font-size:38px;font-weight:700;padding:16px 44px;border-radius:999px}}
.it{{position:absolute;filter:drop-shadow(0 22px 22px rgba(23,45,43,.22))}}
</style></head><body><div class="b"><div class="blob"></div>
<div class="txt"><h1>{title}</h1><p>{text}</p><div class="cta">{cta}</div></div>
{items}</div></body></html>"""

for b in BANNERS:
    items = "".join(
        f'<img class="it" src="cut/{k}.png" style="height:{h}px;left:{x}px;top:{y}px;z-index:{z}">'
        for k, h, x, y, z in b["items"])
    html = TPL.format(bg=b["bg"], blob=b["blob"], fg=b["fg"], sub=b["sub"], coral=CORAL, ink=INK,
                      title=b["title"], text=b["text"], cta=b["cta"], items=items)
    open(os.path.join(HERE, b["id"] + ".html"), "w").write(html)
json.dump([b["id"] for b in BANNERS], open(os.path.join(HERE, "ids.json"), "w"))
print("ok")
