#!/usr/bin/env python3
"""
Sword — Recon passivo de subdomínios + probe HTTP
=================================================
1. Enumera subdomínios via Certificate Transparency (crt.sh) — passivo, sem tocar no alvo.
2. Resolve DNS de cada um.
3. Faz probe HTTP/HTTPS: status, título, server, redirect.
4. Gera 'live-hosts.txt' pronto pra alimentar o cors_headers_scan.py (-f).

Uso:
    python3 recon.py alvo.com
    python3 recon.py alvo.com --out recon_alvo --probe
    python3 recon.py alvo.com -w extra_words.txt   # + brute-force DNS de subdomínios

Se subfinder estiver instalado, é usado junto com crt.sh (mais cobertura).
Só use em domínios que você está AUTORIZADO a testar.
Dependências: requests
"""
import argparse
import concurrent.futures
import json
import os
import re
import shutil
import socket
import subprocess
import sys
from datetime import datetime, timezone

try:
    import requests
    from requests.packages.urllib3.exceptions import InsecureRequestWarning
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
except ImportError:
    sys.exit("Falta a lib 'requests'. Instale com: pip install requests")

class C:
    R="\033[31m"; Y="\033[33m"; G="\033[32m"; B="\033[36m"; DIM="\033[2m"; BOLD="\033[1m"; X="\033[0m"

def log(msg): print(f"{C.DIM}[*]{C.X} {msg}", file=sys.stderr)

# ---------- fontes passivas ----------
def from_crtsh(domain, timeout):
    subs = set()
    try:
        r = requests.get(f"https://crt.sh/?q=%25.{domain}&output=json",
                         timeout=timeout, headers={"User-Agent": "Sword-Recon/1.0"})
        if r.status_code == 200:
            for entry in r.json():
                for name in entry.get("name_value", "").split("\n"):
                    name = name.strip().lstrip("*.").lower()
                    if name.endswith(domain) and re.match(r"^[a-z0-9._-]+$", name):
                        subs.add(name)
    except Exception as e:
        log(f"crt.sh falhou: {e}")
    log(f"crt.sh: {len(subs)} subdomínios")
    return subs

def from_subfinder(domain):
    if not shutil.which("subfinder"):
        return set()
    try:
        out = subprocess.run(["subfinder", "-silent", "-d", domain],
                             capture_output=True, text=True, timeout=180)
        subs = {l.strip().lower() for l in out.stdout.splitlines() if l.strip()}
        log(f"subfinder: {len(subs)} subdomínios")
        return subs
    except Exception as e:
        log(f"subfinder falhou: {e}")
        return set()

def from_bruteforce(domain, wordlist):
    subs = set()
    try:
        with open(wordlist) as fh:
            words = [w.strip() for w in fh if w.strip() and not w.startswith("#")]
    except OSError as e:
        log(f"wordlist não lida: {e}")
        return subs
    for w in words:
        subs.add(f"{w}.{domain}")
    log(f"brute: {len(subs)} candidatos gerados de {wordlist}")
    return subs

# ---------- resolução DNS ----------
def resolve(host):
    try:
        return host, socket.gethostbyname(host)
    except socket.gaierror:
        return host, None

# ---------- probe HTTP ----------
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)

def probe(host, timeout):
    for scheme in ("https", "http"):
        url = f"{scheme}://{host}"
        try:
            r = requests.get(url, timeout=timeout, verify=False, allow_redirects=True,
                             headers={"User-Agent": "Sword-Recon/1.0"})
        except requests.RequestException:
            continue
        m = TITLE_RE.search(r.text or "")
        title = re.sub(r"\s+", " ", m.group(1)).strip()[:80] if m else ""
        return {"host": host, "url": r.url, "status": r.status_code,
                "server": r.headers.get("Server", ""), "title": title,
                "final_scheme": urlscheme(r.url)}
    return None

def urlscheme(u):
    return u.split("://", 1)[0] if "://" in u else ""

# ---------- pipeline ----------
def run(domain, args):
    log(f"alvo: {domain}")
    subs = set()
    subs |= from_crtsh(domain, args.timeout)
    subs |= from_subfinder(domain)
    if args.wordlist:
        subs |= from_bruteforce(domain, args.wordlist)
    subs.add(domain)
    subs = sorted(subs)
    log(f"total único de candidatos: {len(subs)}")

    # resolver DNS em paralelo
    resolved = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for host, ip in ex.map(resolve, subs):
            if ip:
                resolved[host] = ip
    log(f"resolvem DNS: {len(resolved)}")

    live = []
    if args.probe:
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {ex.submit(probe, h, args.timeout): h for h in resolved}
            for fut in concurrent.futures.as_completed(futs):
                res = fut.result()
                if res:
                    live.append(res)
                    color = C.G if res["status"] < 400 else C.Y
                    print(f"  {color}{res['status']}{C.X} {C.BOLD}{res['url']}{C.X} "
                          f"{C.DIM}{res['server']} | {res['title']}{C.X}")
        live.sort(key=lambda x: x["status"])
    return {"domain": domain, "candidates": subs, "resolved": resolved, "live": live}

def save(result, outdir):
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "subdomains.txt"), "w") as fh:
        fh.write("\n".join(sorted(result["resolved"])) + "\n")
    if result["live"]:
        with open(os.path.join(outdir, "live-hosts.txt"), "w") as fh:
            fh.write("\n".join(sorted(l["url"] for l in result["live"])) + "\n")
    with open(os.path.join(outdir, "recon.json"), "w") as fh:
        json.dump({"scanned_at": datetime.now(timezone.utc).isoformat(), **result},
                  fh, indent=2, ensure_ascii=False)
    print(f"\n{C.G}Salvo em {outdir}/{C.X} "
          f"(subdomains.txt, live-hosts.txt, recon.json)")
    if result["live"]:
        print(f"{C.DIM}Próximo passo: python3 cors_headers_scan.py -f {outdir}/live-hosts.txt --json {outdir}/cors.json{C.X}")

def main():
    ap = argparse.ArgumentParser(description="Sword — Recon passivo + probe HTTP")
    ap.add_argument("domain", help="domínio raiz, ex: alvo.com")
    ap.add_argument("--probe", action="store_true", help="fazer probe HTTP dos que resolvem")
    ap.add_argument("-w", "--wordlist", help="wordlist p/ brute-force de subdomínios (opcional)")
    ap.add_argument("--out", help="pasta de saída (default: recon_<domain>)")
    ap.add_argument("-t", "--timeout", type=float, default=12)
    ap.add_argument("--workers", type=int, default=30)
    args = ap.parse_args()
    domain = args.domain.lower().strip().replace("https://", "").replace("http://", "").strip("/")
    outdir = args.out or f"recon_{domain}"
    result = run(domain, args)
    save(result, outdir)

if __name__ == "__main__":
    main()
