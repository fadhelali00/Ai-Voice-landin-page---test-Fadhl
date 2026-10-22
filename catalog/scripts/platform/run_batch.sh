#!/bin/bash
# Upload the rest of a prepared batch, map product ids, upload images, fix tax/stock, audit.
# Usage: run_batch.sh <tag> <images_dir> <min_existing_id>
set -u
TAG=$1; IMGS=$2; MINID=$3
export NODE_PATH=$(npm root -g)
# the CSV has no tax columns and imported products are live at once: import with stock 0 so nothing sells untaxed;
# fix_tax_stock.cjs then sets VAT + inclusive and stock 10 in one save
# products are mapped back to their new ids by English title: two rows with the same title get the same id
# (b22: Celia scrub, Bubble brush), so stop before importing anything
python3 -I -c "import json,sys,collections;c=collections.Counter(m['en'] for m in json.load(open(sys.argv[1])));d=[t for t,n in c.items() if n>1];print('DUPLICATE TITLES',d) if d else None;sys.exit(1 if d else 0)" ${TAG}_meta.json || exit 1
python3 -I - "$TAG" <<'PY0'
import csv,sys
t=sys.argv[1]; R=list(csv.reader(open(f'{t}_rest.csv',newline='',encoding='utf-8'))); i=R[0].index('variant_stock')
for r in R[1:]:
    if len(r)>i and r[i]!='': r[i]='0'
csv.writer(open(f'{t}_rest0.csv','w',newline='',encoding='utf-8')).writerows(R)
PY0
node upload.cjs /products/bulk-upload ${TAG}_rest0.csv ${TAG}rest 2>&1 | grep -oE '"message":"[^"]+"' | sort | uniq -c
bash get_all.sh t_${TAG}.json
python3 -I - "$TAG" "$IMGS" "$MINID" <<'PY'
import json,re,os,shutil,glob,sys
tag,imgs,minid=sys.argv[1],sys.argv[2],int(sys.argv[3])
d=json.load(open(f't_{tag}.json')); print('total',d['recordsTotal'])
ids={}
for x in d['data']:
    if int(x['id'])>minid:
        t=re.search(r'Title: (.*?) \|',re.sub(r'\s+',' ',re.sub('<[^>]+>',' | ',x['product_details']))).group(1).strip(); ids[t]=int(x['id'])
meta=json.load(open(f'{tag}_meta.json'))
for m in meta: m['id']=ids.get(m['en'])
miss=[m['en'] for m in meta if not m['id']]; print('mapped',len(meta)-len(miss),'missing',miss[:5])
json.dump(meta,open(f'{tag}_meta.json','w'),ensure_ascii=False,indent=0)
os.makedirs(f'{tag}imgs',exist_ok=True); [os.remove(f) for f in glob.glob(f'{tag}imgs/*')]
for m in meta:
    if not m['id']: continue
    for f in glob.glob(f"{imgs}/{m['barcode']}*.webp"): shutil.copy(f,f"{tag}imgs/{m['id']}{os.path.basename(f)[len(m['barcode']):]}")
json.dump([m['id'] for m in meta if m['id']],open(f'{tag}_ids.json','w'))
print('images',len(os.listdir(f'{tag}imgs')))
PY
bash upload_images_chunked.sh $TAG
node fix_tax_stock.cjs ${TAG}_ids.json > ${TAG}_fix.log 2>&1; echo "fixed $(grep -c '200 {"success":true' ${TAG}_fix.log) / $(wc -l < ${TAG}_fix.log)"
node audit_products.cjs ${TAG}_ids.json ${TAG}_audit.json >/dev/null
python3 -I - "$TAG" <<'PY'
import json,sys
tag=sys.argv[1]
A=json.load(open(f'{tag}_audit.json')); M={m['id']:m for m in json.load(open(f'{tag}_meta.json'))}
bad=[a['id'] for a in A if a['inclusive']!='1' or 1 not in (a['tax_ids'] or []) or any(v['stock']!=10 for v in a['variants']) or 'placeholder' in (a['main_image'] or 'placeholder') or str(M[a['id']]['cat'])!=a['category_id'] or a['barcode']!=M[a['id']]['barcode']]
print('AUDIT',len(A),'issues',bad)
PY
