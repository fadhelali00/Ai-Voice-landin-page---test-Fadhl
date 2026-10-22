#!/bin/bash
# Upload <tag>imgs/*.webp in ZIPs of ~8 MB (a product's images stay in one ZIP); the panel stalls on large ZIPs (45 MB hung).
# Usage: upload_images_chunked.sh <tag>
set -u
TAG=$1; export NODE_PATH=$(npm root -g)
rm -rf ${TAG}_chunks; mkdir ${TAG}_chunks
python3 -I - "$TAG" <<'PY'
import os,sys,zipfile,collections
tag=sys.argv[1]; d=f'{tag}imgs'; g=collections.defaultdict(list)
for f in sorted(os.listdir(d)): g[f.split('.')[0].split('-')[0]].append(f)
n,size,z=0,0,None
for pid,fs in g.items():
    s=sum(os.path.getsize(f'{d}/{f}') for f in fs)
    if z is None or size+s>8_000_000:
        if z: z.close()
        n+=1; size=0; z=zipfile.ZipFile(f'{tag}_chunks/{n:02d}.zip','w')
    for f in fs: z.write(f'{d}/{f}',f)
    size+=s
z.close(); print('chunks',n)
PY
for z in ${TAG}_chunks/*.zip; do node upload_images.cjs $z ${TAG}_$(basename $z .zip) 2>&1 | tail -1 | cut -c1-220; done
