#!/bin/bash
# Finish a batch whose run stopped after mapping+images: re-run tax/stock for ids without a success line, then audit.
# Usage: finish.sh <tag>
TAG=$1; export NODE_PATH=$(npm root -g)
python3 - "$TAG" <<'PY'
import json,re,sys
t=sys.argv[1]; ids=json.load(open(f'{t}_ids.json'))
ok=set()
try:
    for l in open(f'{t}_fix.log'):
        m=re.match(r'(\d+) 200 \{"success":true',l)
        if m: ok.add(int(m.group(1)))
except FileNotFoundError: pass
json.dump([i for i in ids if i not in ok],open(f'{t}_todo.json','w')); print(t,'todo',len(ids)-len(ok))
PY
node fix_tax_stock.cjs ${TAG}_todo.json > ${TAG}_fix_b.log 2>&1; cat ${TAG}_fix_b.log >> ${TAG}_fix.log
node audit_products.cjs ${TAG}_ids.json ${TAG}_audit.json >/dev/null
python3 - "$TAG" <<'PY'
import json,sys
tag=sys.argv[1]
A=json.load(open(f'{tag}_audit.json')); M={m['id']:m for m in json.load(open(f'{tag}_meta.json')) if m.get('id')}
bad=[a['id'] for a in A if a['inclusive']!='1' or 1 not in (a['tax_ids'] or []) or any(v['stock']!=10 for v in a['variants']) or 'placeholder' in (a['main_image'] or 'placeholder') or str(M[a['id']]['cat'])!=a['category_id'] or a['barcode']!=M[a['id']]['barcode']]
print(tag,'AUDIT',len(A),'issues',bad)
PY
