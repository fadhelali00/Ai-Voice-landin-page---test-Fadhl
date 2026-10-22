"""Seamless home top (original-app style): header background image + hero banner sharing one petrol colour.
The banner's top band and the header image's edges are exactly #006B63 (the header colour), so the two read as one surface."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
PETROL, PETROL_DK, MINT, CORAL, INK, WHITE = "#006B63", "#004F49", "#E0F1EC", "#FF745E", "#172D2B", "#FFFFFF"
FONT = '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=block" rel="stylesheet">'
SHADOW = "filter:drop-shadow(0 18px 18px rgba(0,30,28,.35))"
def img(k, h, x, y, z): return f'<img src="cut/{k}.png" style="position:absolute;height:{h}px;left:{x}px;top:{y}px;z-index:{z};{SHADOW}">'

BANNER = f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">{FONT}<style>
html,body{{margin:0;width:1600px;height:900px;overflow:hidden;font-family:'IBM Plex Sans Arabic',sans-serif}}
.b{{position:relative;width:1600px;height:900px;background:{PETROL};overflow:hidden}}
/* light only below the top band, so the join with the header stays flat #006B63 */
.glow{{position:absolute;left:-200px;right:-200px;top:160px;bottom:-200px;background:radial-gradient(60% 70% at 30% 75%,rgba(255,255,255,.13),rgba(255,255,255,0) 70%)}}
.ring{{position:absolute;border-radius:50%;border:2px solid rgba(224,241,236,.12)}}
.shelf{{position:absolute;left:0;right:0;bottom:0;height:150px;background:{PETROL_DK};opacity:.55;border-top-left-radius:50% 50px;border-top-right-radius:50% 50px}}
.txt{{position:absolute;right:130px;top:200px;width:620px;color:{WHITE}}}
h1{{margin:0;font-size:100px;line-height:1.1;font-weight:700}}
p{{margin:24px 0 0;font-size:42px;line-height:1.45;font-weight:500;color:rgba(255,255,255,.88)}}
.cta{{display:inline-block;margin-top:38px;background:{CORAL};color:{INK};font-size:42px;font-weight:700;padding:16px 54px;border-radius:999px}}
</style></head><body><div class="b"><div class="glow"></div>
<div class="ring" style="width:760px;height:760px;left:60px;top:230px"></div>
<div class="ring" style="width:1040px;height:1040px;left:-80px;top:300px"></div>
<div class="shelf"></div>
<div class="txt"><h1>وش تحتاج اليوم؟</h1><p>الطازج والمقاضي والمشروبات<br>في طلب واحد</p><div class="cta">اطلب الحين</div></div>
{img('rice', 470, 330, 250, 2)}{img('oil', 440, 170, 300, 3)}{img('laban', 400, 560, 330, 3)}
{img('water', 230, 60, 560, 4)}{img('eggs', 190, 560, 670, 5)}{img('tomato', 200, 770, 620, 5)}
{img('orange', 170, 320, 690, 6)}{img('chips', 230, 930, 600, 4)}
</div></body></html>"""

# Header background: flat petrol with the same faint rings, edges stay exact #006B63
HEADER = f"""<!doctype html><html><head><meta charset="utf-8"><style>
html,body{{margin:0;width:1600px;height:900px;overflow:hidden}}
.b{{position:relative;width:1600px;height:900px;background:{PETROL};overflow:hidden}}
.ring{{position:absolute;border-radius:50%;border:2px solid rgba(224,241,236,.08)}}
</style></head><body><div class="b">
<div class="ring" style="width:900px;height:900px;left:-300px;top:-420px"></div>
<div class="ring" style="width:600px;height:600px;right:-160px;top:-260px"></div>
</div></body></html>"""
open(os.path.join(HERE, "top_banner.html"), "w").write(BANNER)
open(os.path.join(HERE, "top_header.html"), "w").write(HEADER)
print("ok")
