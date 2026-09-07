import json, concurrent.futures as cf
from curl_cffi import requests as cr
names=sorted({l.strip() for l in open('all_names.txt') if l.strip()})
S=cr.Session(impersonate="chrome")
def q(n):
    for url in (f"https://dns.google/resolve?name={n}&type=A",
                f"https://cloudflare-dns.com/dns-query?name={n}&type=A"):
        try:
            r=S.get(url, headers={"accept":"application/dns-json"}, timeout=15)
            d=r.json()
            if d.get("Status")==0:
                ips=[a["data"] for a in d.get("Answer",[]) if a.get("type")==1]
                cn=[a["data"] for a in d.get("Answer",[]) if a.get("type")==5]
                if ips or cn: return n,ips,cn
            if d.get("Status")==3: return n,[],[]
        except Exception: continue
    return n,None,None
ok=0
with open('resolved_doh.txt','w') as f, cf.ThreadPoolExecutor(max_workers=64) as ex:
    for i,(n,ips,cn) in enumerate(ex.map(q,names,chunksize=10)):
        if ips:
            ok+=1; f.write(f"{n}\t{','.join(ips)}\t{','.join(cn)}\n"); f.flush()
        if i%4000==0: print(i,ok,flush=True)
print("FIM",len(names),ok)
