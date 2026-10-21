"""Build Jarna home banners (1600x900, 16:9) as HTML pages; render.cjs screenshots them to PNG/WebP."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PETROL, PETROL_DK, MINT, CORAL, INK, WHITE = "#006B63", "#004F49", "#E0F1EC", "#FF745E", "#172D2B", "#FFFFFF"

BANNERS = [
    {"id": "b1_welcome", "bg": PETROL, "blob": "rgba(255,255,255,.10)", "fg": WHITE, "sub": "rgba(255,255,255,.88)",
     "title": "وش تحتاج اليوم؟", "text": "الطازج والمقاضي والمشروبات<br>في طلب واحد", "cta": "ابدأ التسوق",
     "items": [("laban", 540, 350, 110, 2), ("oil", 580, 90, 100, 3), ("tomato", 280, 480, 540, 4), ("orange", 250, 60, 590, 5)]},
    {"id": "b2_produce", "bg": MINT, "blob": "rgba(0,107,99,.08)", "fg": INK, "sub": "#3F524E",
     "title": "عروض الخضار والفواكه", "text": "أسعار مخفّضة على أصناف مختارة", "cta": "تسوّق العروض",
     "items": [("guava", 400, 330, 130, 2), ("tomato", 330, 40, 190, 3), ("orange", 290, 480, 520, 4), ("cucumber", 220, 110, 590, 5)]},
    {"id": "b3_dairy", "bg": WHITE, "blob": MINT, "fg": PETROL, "sub": "#3F524E",
     "title": "الألبان والبيض", "text": "لبن، زبادي، بيض وقشطة", "cta": "اطلب الآن",
     "items": [("laban", 560, 380, 80, 2), ("yogurt", 400, 60, 250, 3), ("eggs", 260, 300, 560, 4)]},
    {"id": "b4_pantry", "bg": PETROL_DK, "blob": "rgba(224,241,236,.10)", "fg": WHITE, "sub": "rgba(255,255,255,.88)",
     "title": "مقاضي البيت", "text": "رز، زيوت، صلصات وبهارات", "cta": "تسوّق المقاضي",
     "items": [("rice", 560, 280, 110, 2), ("oil", 520, 50, 200, 3), ("ketchup", 340, 640, 470, 4), ("spice", 280, 330, 560, 5)]},
]

TPL = """<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=block" rel="stylesheet">
<style>
html,body{{margin:0;width:1600px;height:900px;overflow:hidden;font-family:'IBM Plex Sans Arabic',sans-serif}}
.b{{position:relative;width:1600px;height:900px;background:{bg};overflow:hidden}}
.blob{{position:absolute;left:-60px;top:70px;width:900px;height:760px;border-radius:50%;background:{blob}}}
.txt{{position:absolute;right:110px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center;gap:34px}}
h1{{margin:0;font-size:104px;line-height:1.15;font-weight:700;color:{fg}}}
p{{margin:0;font-size:48px;line-height:1.45;font-weight:500;color:{sub}}}
.cta{{align-self:flex-start;margin-top:14px;background:{coral};color:{ink};font-size:46px;font-weight:700;padding:22px 56px;border-radius:999px}}
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
