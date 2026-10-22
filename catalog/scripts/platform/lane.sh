#!/bin/bash
# Upload lane: process tags listed in <queue file> one by one (append tags any time). For each tag wait until
# <tag>_rest.csv, <tag>_meta.json and <tag>_images.dir exist, then run run_batch.sh with minid = current max product id.
# Usage: lane.sh lane_b.txt
Q=$1; export NODE_PATH=$(npm root -g); done_list=${Q%.txt}.done; touch $done_list
while true; do
  tag=$(grep -vxF -f $done_list $Q | head -1)
  if [ -z "$tag" ]; then sleep 60; continue; fi
  until [ -f ${tag}_rest.csv ] && [ -f ${tag}_meta.json ] && [ -f ${tag}_images.dir ]; do sleep 60; done
  PANEL=seller node get.cjs "/products/datatable?draw=1&start=0&length=9999" lane_max.json >/dev/null 2>&1
  M=$(python3 -c "import json;print(max(int(x['id']) for x in json.load(open('lane_max.json'))['data']))" 2>/dev/null)
  # session expired or panel down: wait and retry, never skip a batch
  if [ -z "$M" ]; then echo "$(date -u +%H:%M) seller session not valid, waiting"; sleep 300; continue; fi
  echo "$(date -u +%H:%M) start $tag minid $M"
  bash run_batch.sh $tag $(cat ${tag}_images.dir) $M > ${tag}_run.log 2>&1
  echo "$(date -u +%H:%M) end $tag: $(grep -E 'mapped|fixed|AUDIT' ${tag}_run.log | tr '\n' ' ' | cut -c1-300)"
  grep -q AUDIT ${tag}_run.log && echo $tag >> $done_list || { echo "$(date -u +%H:%M) $tag incomplete, retry later"; sleep 300; }
done
