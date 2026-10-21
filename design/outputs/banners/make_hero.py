"""Keeta-style home top: one large hero banner + small cards row. Writes HTML pages; render_hero.cjs screenshots them."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PETROL, PETROL_DK, MINT, CORAL, INK, WHITE = "#006B63", "#004F49", "#E0F1EC", "#FF745E", "#172D2B", "#FFFFFF"
FONT = '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=block" rel="stylesheet">'
SHADOW = "filter:drop-shadow(0 18px 18px rgba(23,45,43,.25))"


def img(k, h, x, y, z):
    return f'<img src="cut/{k}.png" style="position:absolute;height:{h}px;left:{x}px;top:{y}px;z-index:{z};{SHADOW}">'


HERO = f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">{FONT}<style>
html,body{{margin:0;width:1600px;height:900px;overflow:hidden;font-family:'IBM Plex Sans Arabic',sans-serif}}
.b{{position:relative;width:1600px;height:900px;background:radial-gradient(120% 90% at 85% 10%,#0A8378 0%,{PETROL} 45%,{PETROL_DK} 100%);overflow:hidden}}
.ring{{position:absolute;border-radius:50%;border:2px solid rgba(224,241,236,.14)}}
.shelf{{position:absolute;left:0;right:0;bottom:0;height:210px;background:{MINT};border-top-left-radius:60% 40px;border-top-right-radius:60% 40px}}
.txt{{position:absolute;right:100px;top:120px;width:640px;color:{WHITE}}}
h1{{margin:0;font-size:96px;line-height:1.1;font-weight:700}}
p{{margin:22px 0 0;font-size:40px;line-height:1.45;font-weight:500;color:rgba(255,255,255,.9)}}
.cta{{display:inline-block;margin-top:34px;background:{CORAL};color:{INK};font-size:40px;font-weight:700;padding:16px 50px;border-radius:999px}}
</style></head><body><div class="b">
<div class="ring" style="width:900px;height:900px;left:-250px;top:-300px"></div>
<div class="ring" style="width:620px;height:620px;left:-110px;top:-160px"></div>
<div class="shelf"></div>
<div class="txt"><h1>وش تحتاج اليوم؟</h1><p>الطازج والمقاضي والمشروبات<br>في طلب واحد</p><div class="cta">اطلب الحين</div></div>
{img('rice', 520, 350, 200, 2)}{img('oil', 490, 170, 250, 3)}{img('laban', 440, 600, 290, 3)}
{img('water', 250, 30, 540, 4)}{img('eggs', 210, 580, 650, 5)}{img('tomato', 220, 810, 600, 5)}
{img('orange', 190, 320, 680, 6)}{img('ketchup', 300, 960, 540, 4)}{img('chips', 250, 1080, 600, 4)}
</div></body></html>"""

CARDS = [
    {"id": "c1_produce", "bg": CORAL, "fg": INK, "title": "عروض الخضار<br>والفواكه", "cat": 75,
     "items": [("guava", 250, 300, 300, 2), ("tomato", 220, 60, 330, 3), ("orange", 190, 200, 430, 4)]},
    {"id": "c2_dairy", "bg": MINT, "fg": PETROL, "title": "الألبان<br>والبيض", "cat": 3,
     "items": [("laban", 330, 330, 250, 2), ("yogurt", 240, 70, 330, 3), ("eggs", 160, 220, 460, 4)]},
    {"id": "c3_pantry", "bg": PETROL, "fg": WHITE, "title": "مقاضي<br>البيت", "cat": 8,
     "items": [("rice", 330, 280, 260, 2), ("oil", 310, 70, 280, 3), ("ketchup", 210, 230, 380, 4)]},
    {"id": "c4_drinks", "bg": PETROL_DK, "fg": WHITE, "title": "المشروبات", "cat": 20,
     "items": [("water", 250, 250, 330, 2), ("juice", 300, 110, 290, 3), ("nectar", 290, 20, 300, 2), ("soda", 160, 280, 460, 4)]},
    {"id": "c5_snacks", "bg": MINT, "fg": INK, "title": "السناكات<br>والحلى", "cat": 28,
     "items": [("haribo", 280, 320, 290, 2), ("digestive", 270, 60, 300, 3), ("nuts", 230, 230, 380, 4)]},
    {"id": "c6_icecream", "bg": PETROL, "fg": WHITE, "title": "الآيس<br>كريم", "cat": 34,
     "items": [("icecream", 230, 60, 330, 2)]},
]

CARD = """<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">{font}<style>
html,body{{margin:0;width:600px;height:640px;overflow:hidden;font-family:'IBM Plex Sans Arabic',sans-serif}}
.c{{position:relative;width:600px;height:640px;background:{bg};overflow:hidden}}
.glow{{position:absolute;left:40px;right:40px;bottom:-60px;height:330px;border-radius:50%;background:rgba(255,255,255,.22)}}
h2{{position:absolute;right:46px;top:40px;margin:0;font-size:64px;line-height:1.12;font-weight:700;color:{fg}}}
</style></head><body><div class="c"><div class="glow"></div><h2>{title}</h2>{items}</div></body></html>"""

open(os.path.join(HERE, "hero.html"), "w").write(HERO)
for c in CARDS:
    def big(k, h, x, y, z):  # enlarge products ~35%, keep them below the title (y >= 215) and on the card bottom
        h2 = min(int(h * 1.35), 640 + 30 - 215); top = max(215, min(640 - h2 + 30, int(y - (h2 - h) * 0.9)))
        return img(k, h2, int(x * 0.92) - 10, top, z)
    items = "".join(big(*it) for it in c["items"])
    open(os.path.join(HERE, c["id"] + ".html"), "w").write(
        CARD.format(font=FONT, bg=c["bg"], fg=c["fg"], title=c["title"], items=items))
json.dump([{"id": c["id"], "cat": c["cat"], "title": c["title"].replace("<br>", " ")} for c in CARDS],
          open(os.path.join(HERE, "cards.json"), "w"), ensure_ascii=False)
print("ok")
