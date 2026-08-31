# Sword — Ferramentas de Caçada (Bug Bounty)

Ferramentas próprias de recon e auditoria. Python puro, sem binários externos obrigatórios.

> ⚠️ **Escopo:** use apenas em alvos que você está **autorizado** a testar (programa de bug bounty/pentest com escopo definido). Recon passivo e scan de headers são de baixo impacto, mas ainda assim: respeite o escopo do programa.

## Setup (uma vez)

```bash
cd ~/Documents/Sword
python3 -m venv .venv && source .venv/bin/activate
pip install requests
```

(ou só `pip install requests` no seu Python global)

## Ferramentas

### `tools/recon.py` — recon passivo + probe
Enumera subdomínios (crt.sh + subfinder se instalado), resolve DNS e faz probe HTTP.

```bash
python3 tools/recon.py alvo.com --probe --out recon_alvo
```
Gera em `recon_alvo/`: `subdomains.txt`, `live-hosts.txt`, `recon.json`.

Opções:
- `--probe` — faz probe HTTP dos hosts que resolvem (status, título, server).
- `-w wordlist.txt` — brute-force de subdomínios além das fontes passivas.
- `--workers 30` — paralelismo (default 30).

### `tools/cors_headers_scan.py` — CORS + security headers
Audita headers de segurança e testa CORS mal configurado.

```bash
python3 tools/cors_headers_scan.py https://alvo.com --json cors.json
```
Detecta: HSTS/CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy ausentes,
flags de cookie (Secure/HttpOnly/SameSite), info leak (Server/X-Powered-By), e CORS:
reflexão de Origin, `null` origin, wildcard, bypass de prefixo/sufixo/subdomínio, combinado com
`Allow-Credentials: true` (crítico).

Opções: `-f urls.txt` (lista), `--insecure` (ignora TLS), `--json` (relatório).

## Workflow encadeado

```bash
python3 tools/recon.py alvo.com --probe --out recon_alvo
python3 tools/cors_headers_scan.py -f recon_alvo/live-hosts.txt --json recon_alvo/cors.json
```

## Roadmap das ferramentas
- [x] recon passivo + probe
- [x] scanner CORS/headers
- [ ] parser de saída do nuclei
- [ ] wrapper de fuzzing (ffuf/dirsearch)
- [ ] dashboard de achados

Ligado ao projeto **Sword** (framework de raciocínio: *The Mind*).
