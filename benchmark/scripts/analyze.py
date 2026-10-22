import json,re,glob,os,collections,csv
import os
S=os.environ['SCRATCH']  # session scratchpad: inventory/, jarna/, bench/
J=S+'/jarna'; B=S+'/bench'
sel=json.load(open(B+'/seller_now_parsed.json'))
cats=json.load(open(J+'/cats_new.json'))['data']
cat_by_title={}; cat_parent={}; cat_title={}
for c in cats:
    t=c['title']; cat_by_title[t]=c['id']; cat_title[c['id']]=t
    cat_parent[c['id']]=re.sub('<[^>]+>','',str(c['parent'])).strip()
pid={v:k for k,v in cat_title.items()}
for k in list(cat_parent): cat_parent[k]=pid.get(cat_parent[k])
AR={1:'الطازج',8:'المقاضي',20:'المشروبات',28:'السناكات والحلى',36:'المنزل والتنظيف',45:'الجمال والعناية الشخصية',55:'الأطفال والرضع',61:'الصحة',67:'القرطاسية'}
SECTIONS=[1,8,20,28,36,45,55,61,67]
DEAD=set([2,74])|set(range(77,101))
tiles=[c for c in cat_title if cat_parent.get(c) in SECTIONS and c not in DEAD]
# --- audits: latest per id
aud={}
for f in sorted(glob.glob(J+'/*audit*.json'),key=os.path.getmtime):
    try: d=json.load(open(f))
    except: continue
    if isinstance(d,list):
        for x in d:
            if isinstance(x,dict) and 'id' in x and 'variants' in x: aud[int(x['id'])]=x
# --- metas
metas={}
for f in glob.glob(J+'/b*_meta.json')+[os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))+'/catalog/batches/2026-10-22_batch13/b13_meta.json']:
    name=os.path.basename(f).split('_meta')[0]
    try: d=json.load(open(f))
    except: continue
    if isinstance(d,list): metas[name]=d
def norm(s):
    s=(s or '').lower()
    s=re.sub(r'(\d)\s*(gm|grams|gram|gr|g)\b',r'\1g',s)
    s=re.sub(r'(\d)\s*(ml)\b',r'\1ml',s); s=re.sub(r'(\d)\s*(kg)\b',r'\1kg',s)
    s=re.sub(r'(\d)\s*(l|ltr|liter|litre)\b',r'\1l',s)
    s=re.sub(r'[^a-z0-9]+',' ',s); return ' '.join(s.split())
live=[p for p in sel if p['status']=='active']
title_meta={}
for name,d in metas.items():
    for x in d: title_meta.setdefault(norm(x.get('en')),x)
id_meta={}
for name,d in metas.items():
    for x in d:
        if x.get('id'): id_meta[int(x['id'])]=x
# Jarna live enrichment
jl=[]
for p in live:
    cid=cat_by_title.get(p['cat'])
    m=id_meta.get(p['id']) or title_meta.get(norm(p['title']))
    a=aud.get(p['id'])
    bc=(a or {}).get('barcode') or (m or {}).get('barcode')
    price=special=None; stock=None
    if a and a.get('variants'):
        v=a['variants'][0]; price=v['price']; special=v['special']; stock=[w['stock'] for w in a['variants']]
    elif m: price=m.get('price'); special=m.get('special')
    jl.append(dict(id=p['id'],title=p['title'],cid=cid,bc=bc,ninja_id=(m or {}).get('ninja_id'),has_img=p['has_img'],price=price,special=special,stock=stock,ar=bool((a or {}).get('title')) or bool((m or {}).get('ar'))))
# pipeline
PIPE=['b08b','b09','b11r','b12','b14','b13']
on_titles=set(norm(p['title']) for p in sel)
pipe=[]
for name in PIPE:
    for x in metas.get(name,[]):
        if norm(x.get('en')) in on_titles and name!='b08b': continue
        if name=='b08b' and norm(x.get('en')) in on_titles: continue
        pipe.append(dict(batch=name,cid=x['cat'],bc=x.get('barcode'),ninja_id=x.get('ninja_id'),en=x.get('en')))
# competitors
nj=json.load(open(S+'/inventory/ninja_all.json')); hs=json.load(open(S+'/inventory/hs_all.json'))
# rank within category listing
rows=json.load(open(S+'/inventory/raw/nj_rows.json'))
pos={}; cnt=collections.Counter()
for r in rows:
    k=(r['category_slug'],r.get('subcategory_id'))
    cnt[k]+=1; i=cnt[k]
    pos[r['nj_id']]=min(pos.get(r['nj_id'],999),i)
def disc(x): return x['original_price'] and x['price']<=0.9*x['original_price']
def score(x):
    s=0
    pl=[a for a in x['also_in']]
    if any('weekly-offers' in a for a in pl) or x['category_slug']=='sa-weekly-offers-v2': s+=3
    s+=len(pl)
    if disc(x): s+=2
    r=pos.get(x['nj_id'],999)
    s+= 2 if r<=10 else (1 if r<=30 else 0)
    return s
nj_t=collections.Counter(x['jarna_tile_key'] for x in nj)
hs_t=collections.Counter(x['jarna_tile_key'] for x in hs)
jl_t=collections.Counter(x['cid'] for x in jl)
pp_t=collections.Counter(x['cid'] for x in pipe)
# matching sets
jbc=set(x['bc'] for x in jl if x['bc']); jnid=set(x['ninja_id'] for x in jl if x['ninja_id']); jnm=set(norm(x['title']) for x in jl)
pbc=set(x['bc'] for x in pipe if x['bc']); pnid=set(x['ninja_id'] for x in pipe if x['ninja_id']); pnm=set(norm(x['en']) for x in pipe)
def where(x):
    ids=[x['nj_id']]+x.get('dup_ids',[])
    if any(i in jnid for i in ids) or (x['barcode_from_img'] and x['barcode_from_img'] in jbc) or norm(x['name_en']) in jnm: return 'live'
    if any(i in pnid for i in ids) or (x['barcode_from_img'] and x['barcode_from_img'] in pbc) or norm(x['name_en']) in pnm: return 'pipeline'
    return 'missing'
for x in nj: x['_w']=where(x); x['_s']=score(x); x['_r']=pos.get(x['nj_id'],999)
json.dump(dict(jl=jl,pipe=pipe),open(B+'/jarna_enriched.json','w'),ensure_ascii=False)
# ---------- tile table
tile_rows=[]
for s in SECTIONS:
    for t in sorted([t for t in tiles if cat_parent[t]==s]):
        n=nj_t.get(t,0); h=hs_t.get(t,0); L=jl_t.get(t,0); P=pp_t.get(t,0)
        base=n if n else h
        cov=round(100*min(L,base)/base,1) if base else None
        covp=round(100*min(L+P,base)/base,1) if base else None
        tile_rows.append(dict(section=AR[s],sid=s,tile=t,name=cat_title[t],live=L,pipe=P,nj=n,hs=h,cov=cov,covp=covp))
new_tiles=collections.Counter(x['jarna_tile_key'] for x in nj if isinstance(x['jarna_tile_key'],str))
json.dump(dict(tiles=tile_rows,new_tiles=new_tiles.most_common(),hs_new=collections.Counter(x['jarna_tile_key'] for x in hs if isinstance(x['jarna_tile_key'],str)).most_common()),open(B+'/tiles.json','w'),ensure_ascii=False,indent=0)
# ---------- indicators
existing=set(tiles)
nj_in=[x for x in nj if x['jarna_tile_key'] in existing]
non_empty=sum(1 for t in tiles if jl_t.get(t,0)>0)
tot_base=sum((r['nj'] or r['hs']) for r in tile_rows)
tot_cov=sum(min(r['live'],(r['nj'] or r['hs'])) for r in tile_rows)
tot_covp=sum(min(r['live']+r['pipe'],(r['nj'] or r['hs'])) for r in tile_rows)
top=sorted(nj_in,key=lambda x:(-x['_s'],x['_r']))[:500]
topc=collections.Counter(x['_w'] for x in top)
comp=[ (x['has_img'] and bool(x['bc']) and x['ar']) for x in jl]
img=sum(x['has_img'] for x in jl); bcn=sum(bool(x['bc']) for x in jl); arn=sum(x['ar'] for x in jl)
# price vs ninja: match by barcode/ninja_id
njb={}
for x in nj:
    if x['barcode_from_img']: njb.setdefault(x['barcode_from_img'],x)
njid={}
for x in nj:
    for i in [x['nj_id']]+x.get('dup_ids',[]): njid[i]=x
pairs=[]
for x in jl:
    m=(njid.get(x['ninja_id']) if x['ninja_id'] else None) or (njb.get(x['bc']) if x['bc'] else None)
    if m and x['price']:
        ours=x['special'] if x['special'] and x['special']<x['price'] else x['price']
        pairs.append((ours,m['price'],x,m))
le=sum(1 for o,n,_,_ in pairs if o<=n+0.005)
diffs=[(o-n)/n*100 for o,n,_,_ in pairs if n]
over=[ (round((o-n)/n*100,1),x['id'],x['title'],o,n) for o,n,x,m in pairs if o>n+0.005]
priced=[x for x in jl if x['price']]
offers=sum(1 for x in priced if x['special'] and x['special']<=0.9*x['price'])
nj_off=sum(1 for x in nj if disc(x)); 
stock_known=[x for x in jl if x['stock']]
stock10=sum(1 for x in stock_known if all(s==10 for s in x['stock']))
stock0=sum(1 for x in stock_known if any(s<=0 for s in x['stock']))
ind=dict(
 tiles_total=len(tiles),tiles_nonempty=non_empty,
 cov_live=round(100*tot_cov/tot_base,1),cov_pipe=round(100*tot_covp/tot_base,1),tot_base=tot_base,
 top500=dict(topc),
 live=len(jl),pipe=len(pipe),pipe_by=dict(collections.Counter(x['batch'] for x in pipe)),
 img=img,bc=bcn,ar=arn,complete=sum(comp),
 price_pairs=len(pairs),price_le=le,avg_diff=round(sum(diffs)/len(diffs),2) if diffs else None,
 median_diff=sorted(diffs)[len(diffs)//2] if diffs else None,
 over_top=sorted(over,reverse=True)[:15],over_n=len(over),
 offers=offers,priced=len(priced),offer_share=round(100*offers/len(priced),1),nj_off=nj_off,nj_total=len(nj),nj_off_share=round(100*nj_off/len(nj),1),
 stock_known=len(stock_known),stock10=stock10,stock0=stock0,
 drafts=sum(1 for p in sel if p['status']=='draft'),
 nj_store=dict(collections.Counter(x['store_id'] for x in nj)),
)
json.dump(ind,open(B+'/indicators.json','w'),ensure_ascii=False,indent=1)
print(json.dumps(ind,ensure_ascii=False,indent=1))
# top missing per section (all Ninja incl. new tiles) -> csv
out=[]
by=collections.defaultdict(list)
for x in nj:
    if x['_w']=='missing': by[x['jarna_section']].append(x)
for sec,lst in by.items():
    lst.sort(key=lambda x:(-x['_s'],x['_r']))
    for i,x in enumerate(lst[:50],1):
        out.append(dict(section=sec,rank_in_section=i,jarna_tile=x['jarna_tile'],tile_exists='yes' if isinstance(x['jarna_tile_key'],int) else 'no (new tile)',
          ninja_id=x['nj_id'],name_ar=x['name_ar'],name_en=x['name_en'],ninja_price=x['price'],ninja_original_price=x['original_price'],
          discount_pct=round(100*(1-x['price']/x['original_price']),1) if x['original_price'] and x['price']<x['original_price'] else 0,
          in_weekly_offers='yes' if (x['category_slug']=='sa-weekly-offers-v2' or any('weekly-offers' in a for a in x['also_in'])) else 'no',
          ninja_placements=1+len(x['also_in']),ninja_listing_rank=x['_r'] if x['_r']<999 else '',
          popularity_score=x['_s'],barcode_from_ninja_image=x['barcode_from_img'] or '',on_hungerstation='yes' if x.get('hs_match') else 'no'))
json.dump(out,open(B+'/top_missing.json','w'),ensure_ascii=False)
print('missing rows',len(out), collections.Counter(o['section'] for o in out))
# top500 per tile
t500=collections.Counter((x['jarna_tile_key'],x['_w']) for x in top)
per={}
for (k,w),v in t500.items(): per.setdefault(k,{})[w]=v
json.dump({str(k):v for k,v in per.items()},open(B+'/top500_tiles.json','w'),ensure_ascii=False)
for k,v in sorted(per.items(),key=lambda kv:-kv[1].get('missing',0))[:20]: print(k,cat_title.get(k),v)
# price above ninja csv
with open(B+'/price_above.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['jarna_id','title','jarna_effective_price','ninja_price','diff_pct','ninja_id','source_of_jarna_price'])
    for o,n,x,m in sorted(pairs,key=lambda p:-(p[0]-p[1])/p[1]):
        if o>n+0.005: w.writerow([x['id'],x['title'],o,n,round((o-n)/n*100,1),m['nj_id'],'audit' if x['stock'] else 'batch_meta'])
import difflib
bytile=collections.defaultdict(list)
for x in jl: bytile[x['cid']].append(norm(x['title']))
fuzzy=[]
for x in top:
    if x['_w']!='missing': continue
    nm=norm(x['name_en']); best=0;bt=''
    for t in bytile.get(x['jarna_tile_key'],[]):
        r=difflib.SequenceMatcher(None,nm,t).ratio()
        if r>best: best,bt=r,t
    if best>=0.85: fuzzy.append((round(best,2),x['name_en'],bt)); x['_w']='live_fuzzy'
print('fuzzy live',len(fuzzy)); [print(f) for f in fuzzy[:25]]
print('top500 final',collections.Counter(x['_w'] for x in top))
json.dump(dict(collections.Counter(x['_w'] for x in top)),open(B+'/top500_final.json','w'))
