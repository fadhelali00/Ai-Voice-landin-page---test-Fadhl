#!/bin/bash
# Fetch the seller product datatable in pages of 1000 (length=9999 now returns Server Error) and merge into <out>.
# Usage: get_all.sh <out.json>
OUT=$1; export NODE_PATH=$(npm root -g); rm -f _pg_*.json
for s in 0 1000 2000 3000 4000 5000 6000 7000 8000 9000; do
  PANEL=seller node get.cjs "/products/datatable?draw=1&start=$s&length=1000" _pg_$s.json >/dev/null 2>&1
  python3 -c "import json,sys;d=json.load(open('_pg_$s.json'));sys.exit(0 if len(d['data'])==1000 else 1)" 2>/dev/null || break
done
python3 - "$OUT" <<'PY'
import json,glob,sys
P=[json.load(open(f)) for f in glob.glob('_pg_*.json')]
if any('data' not in p for p in P): sys.exit('page error')
json.dump({'recordsTotal':P[0]['recordsTotal'],'data':[x for p in P for x in p['data']]},open(sys.argv[1],'w'))
PY
