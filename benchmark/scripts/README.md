# أدوات القياس (readiness-benchmark)

تُشغَّل من مجلد scratchpad للجلسة. القراءة فقط، ولا تغيّر شيئاً في المنصة.

1. لقطة منتجات البائع (قراءة فقط):
   `cd $SCRATCH/jarna && NODE_PATH=$(npm root -g) PANEL=seller node <repo>/catalog/scripts/platform/get.cjs "/products/datatable?draw=1&start=0&length=9999" ../bench/seller_now.json`
2. `python3 -I parse_seller.py $SCRATCH/bench/seller_now.json $SCRATCH/bench/seller_now_parsed.json`
3. `SCRATCH=$SCRATCH python3 -I analyze.py` يكتب `indicators.json` و`tiles.json` و`top_missing.json` و`price_above.csv` في `$SCRATCH/bench/`.
4. انسخ `analyze.py` و`write_csv.py` إلى `$SCRATCH/bench/` ثم: `python3 -I write_csv.py <repo>/benchmark/gaps-top-missing.csv`.

مصادر المقارنة: `$SCRATCH/inventory/ninja_all.json` و`hs_all.json`، والمطابقة بمعرّف نينجا ثم الباركود ثم الاسم الإنجليزي المطبّع. مؤشر "الأكثر طلباً" تقريبي: العروض الأسبوعية، وعدد مواضع ظهور المنتج في نينجا، والخصم 10% فأكثر، وترتيبه في صفحة فئته.
