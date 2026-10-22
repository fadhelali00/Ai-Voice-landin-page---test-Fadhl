import json,re,sys,collections
d=json.load(open(sys.argv[1]))['data']
out=[]
for r in d:
    pd=re.sub(r'\s+',' ',r['product_details'])
    g=lambda p:(re.search(p,pd) or [None,None])[1]
    img=g(r'<img src="([^"]+)"')
    st=re.findall(r'bg-\w+-lt text-uppercase">(\w+)<',pd)
    appr=re.sub('<[^>]+>','',r['admin_approval_status']).strip()
    out.append(dict(id=int(r['id']),title=g(r"Title: (.*?)</p>"),cat=g(r"Category: (.*?)</p>"),brand=g(r"Brand: (.*?)</p>"),
      featured=g(r"Featured: (.*?)</p>"),status=st[-1] if st else None,approval=appr,has_img=('placeholder' not in (img or 'placeholder')),created=r['created_at']))
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
print(len(out))
print(collections.Counter(o['status'] for o in out))
print(collections.Counter(o['approval'] for o in out))
print('img',collections.Counter(o['has_img'] for o in out))
print(collections.Counter(o['created'] for o in out))
c=collections.Counter(o['cat'] for o in out if o['status']=='active')
for k,v in sorted(c.items(),key=lambda x:-x[1]): print(v,k)
