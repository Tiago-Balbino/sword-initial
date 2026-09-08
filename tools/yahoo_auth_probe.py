#!/usr/bin/env python3
"""
yahoo_auth_probe.py — GETs autenticados read-only pra caçada de bug bounty AUTORIZADA no Yahoo (Intigriti).
Replaya cookies de sessão que o operador (Tiago) forneceu, com o header X-Bug-Bounty do programa.
NUNCA muda estado (só GET). Escopo: assets Yahoo in-scope.

Uso:  python3 tools/yahoo_auth_probe.py <cookiefile> <url> [url2 ...] [--raw] [--save DIR] [--post] [--brief]
  <cookiefile> = arquivo de 1 linha com o header Cookie inteiro.
  --raw        = imprime os primeiros 1200 chars do corpo (senão só resumo/refs).
  --save DIR   = salva cada corpo em DIR/<md5>.txt
  --post       = usa POST com corpo JSON vazio {} em vez de GET
  --brief      = imprime só status/location/content-type (por padrão, TODOS os response headers são
                 mostrados — lição do 09/07: um header dump completo já revelou x-amzn-mtls-clientcert-*
                 vazado num 404 comum. "Nada passa batido" é o padrão, não a exceção.)
"""
import sys, re, subprocess, tempfile, urllib.parse, shutil

try:
    from curl_cffi import requests as cr
    S = cr.Session(impersonate="chrome")
except Exception:
    import requests as _r
    S = _r.Session()

def main():
    savedir = None
    if "--save" in sys.argv:
        i = sys.argv.index("--save"); savedir = sys.argv[i + 1]
    args = [a for a in sys.argv[1:] if a not in ("--raw", "--save", savedir, "--post", "--brief")]
    raw = "--raw" in sys.argv
    use_post = "--post" in sys.argv
    show_headers = "--brief" not in sys.argv  # default ON — ver nota no docstring
    if len(args) < 2:
        print(__doc__); sys.exit(1)
    ck = open(args[0]).read().strip()
    urls = args[1:]
    H = {"X-Bug-Bounty": "Intigriti-moldret", "Cookie": ck}
    if use_post:
        H["Content-Type"] = "application/json"
    for u in urls:
        try:
            if use_post:
                r = S.post(u, headers=H, json={}, timeout=15, allow_redirects=False)
            else:
                r = S.get(u, headers=H, timeout=15, allow_redirects=False)
        except Exception as e:
            print(f"\n== {u} -> ERR {e}"); continue
        loc = r.headers.get("location", "")
        method = "POST" if use_post else "GET"
        print(f"\n== [{method}] {u} -> {r.status_code}  loc={loc[:90]}")
        ctype = r.headers.get("content-type", "")
        print(f"   content-type: {ctype[:50]} | len={len(r.text)}")
        if show_headers:
            for k, v in r.headers.items():
                flag = " 🚩" if re.search(
                    r"mtls|clientcert|x-amzn|x-internal|x-debug|athenz|x-user-id|x-forwarded-for|"
                    r"x-real-ip|authorization|x-api-key|secret|private", k, re.I) else ""
                # não truncar headers longos importantes (CSP, mTLS cert, cookies) — truncamento
                # foi o que escondeu o CSP completo em 09/07.
                nolimit = re.search(r"content-security-policy|clientcert|mtls|set-cookie|permissions-policy", k, re.I)
                val = v if nolimit else v[:100]
                print(f"   H: {k}: {val}{flag}")
                # decodificar automaticamente cert mTLS leak e mostrar SANs (lição 09/07: não deixar
                # segredo/hostname escondido em base64/PEM sem decodificar).
                if re.search(r"clientcert-leaf", k, re.I) and shutil.which("openssl"):
                    try:
                        pem = urllib.parse.unquote(v)
                        with tempfile.NamedTemporaryFile(mode="w", suffix=".pem", delete=False) as f:
                            f.write(pem); path = f.name
                        out = subprocess.run(
                            ["openssl", "x509", "-in", path, "-noout", "-text"],
                            capture_output=True, text=True, timeout=5).stdout
                        m = re.search(r"X509v3 Subject Alternative Name:\s*\n\s*(.+)", out)
                        if m:
                            print("      🚩 SANs decodificados:", m.group(1).strip())
                        m2 = re.search(r"Not Before\s*:\s*(.+)\n\s*Not After\s*:\s*(.+)", out)
                        if m2:
                            print(f"      validity: {m2.group(1).strip()} -> {m2.group(2).strip()}")
                    except Exception as e:
                        print("      (falha ao decodificar cert:", e, ")")
        body = r.text
        logged = set(re.findall(r'moldret_intigriti|VB5ITZUU3ECKLUBZ7OFA4BZPLM|"guid"\s*:', body))
        if logged:
            print("   login: OK", logged)
        # endpoints de API interessantes
        apis = sorted(set(re.findall(r'https?://[a-z0-9.\-]+\.yahoo\.com/[a-zA-Z0-9/_\-]{2,60}', body)))
        hot = [a for a in apis if any(k in a for k in
               ('oidc', 'checkout', 'payment', 'subscription', '/v1', '/v2', '/api', 'oauth', 'order', 'graphql', 'wallet'))]
        for a in hot[:30]:
            print("   api:", a)
        # ids candidatos a IDOR
        ids = set(re.findall(
            r'(?:subscriptionId|orderId|subscription_id|order_id|accountId|customerId|planId)["\']?\s*[:=]\s*["\']?([A-Za-z0-9\-]{6,})',
            body))
        if ids:
            print("   IDs (candidato IDOR):", list(ids)[:12])
        if savedir:
            import os, hashlib
            fn = os.path.join(savedir, hashlib.md5(u.encode()).hexdigest()[:10] + ".txt")
            open(fn, "w").write(body)
            print("   saved:", fn)
        if raw:
            print("   --- body[:1200] ---")
            print(body[:1200])

if __name__ == "__main__":
    main()
