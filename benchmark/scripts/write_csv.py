import json,csv,re,difflib,collections,os,sys
B=os.path.dirname(os.path.abspath(__file__)); S=os.path.dirname(B)
OUT=sys.argv[1]
rows=json.load(open(B+'/top_missing.json')); e=json.load(open(B+'/jarna_enriched.json'))
nj={x['nj_id']:x for x in json.load(open(S+'/inventory/ninja_all.json'))}
def norm(s):
    s=(s or '').lower()
    s=re.sub(r'(\d)\s*(gm|grams|gram|gr|g)\b',r'\1g',s); s=re.sub(r'(\d)\s*(ml)\b',r'\1ml',s); s=re.sub(r'(\d)\s*(kg)\b',r'\1kg',s)
    s=re.sub(r'[^a-z0-9]+',' ',s); return ' '.join(s.split())
bt=collections.defaultdict(list)
for x in e['jl']: bt[x['cid']].append((norm(x['title']),x['title'],x['id']))
order=['الطازج','المقاضي','المشروبات','السناكات والحلى','المنزل والتنظيف','الجمال والعناية الشخصية','الأطفال والرضع','الصحة','القرطاسية','خارج الأقسام الحالية']
rows=[r for r in rows if r['section'] in order]
rows.sort(key=lambda r:(order.index(r['section']),r['rank_in_section']))
cols=list(rows[0].keys())+['possible_existing_jarna_match','match_similarity','note']
with open(OUT,'w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader()
    for r in rows:
        r['name_ar']=' '.join(r['name_ar'].split()); r['name_en']=' '.join((r['name_en'] or '').split())
        k=nj[r['ninja_id']]['jarna_tile_key']; nm=norm(r['name_en']); best=(0,'',None)
        for a,t,i in bt.get(k,[]):
            s=difflib.SequenceMatcher(None,nm,a).ratio()
            if s>best[0]: best=(s,t,i)
        ok=best[0]>=0.85
        r['possible_existing_jarna_match']=f"{best[2]} {best[1]}" if ok else ''
        r['match_similarity']=round(best[0],2) if ok else ''
        r['note']='out of current sections - needs Fadhl scope decision' if r['section']=='خارج الأقسام الحالية' else ('tile not created yet' if r['tile_exists'].startswith('no') else '')
        w.writerow(r)
print(len(rows))
