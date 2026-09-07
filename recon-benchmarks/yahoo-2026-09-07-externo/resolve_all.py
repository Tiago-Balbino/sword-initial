import socket, concurrent.futures as cf, sys
names=sorted({l.strip() for l in open('all_names.txt') if l.strip()})
def r(n):
    try:
        return n, sorted({i[4][0] for i in socket.getaddrinfo(n,None)})
    except Exception:
        return n, None
n_ok=0
with open('resolved_all.txt','w') as f, cf.ThreadPoolExecutor(max_workers=200) as ex:
    for i,(n,ips) in enumerate(ex.map(r,names,chunksize=20)):
        if ips:
            n_ok+=1; f.write(f"{n} {','.join(ips)}\n"); f.flush()
        if i%5000==0: print(i,n_ok,flush=True)
print("FIM",len(names),n_ok)
