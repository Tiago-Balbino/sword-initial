# Recon & superfície (prioridade #3 — habilita as #1 e #2)

Recon não é o bug — é achar *onde* os bugs de acesso/lógica vão estar. Mais superfície
mapeada = mais endpoints pra rodar os padrões de `patterns.md`.

## Metodologia (base: guias de referência)
- Full Bug Bounty Methodology 2026 — https://github.com/Cyber-note/Full-Bug-Bounty-Hunting-Methodology-2026
- Ultimate Reconnaissance Roadmap (Ahmad Halabi) — https://ahmdhalabi.medium.com/ultimate-reconnaissance-roadmap-for-bug-bounty-hunters-pentesters-507c9a5374d
- Recon guide (Offensity) — https://www.offensity.com/en/blog/just-another-recon-guide-pentesters-and-bug-bounty-hunters/

**Fases:**
1. **Passivo** — CT logs (crt.sh), fontes OSINT, sem tocar no alvo. (nosso `recon.py` faz isto)
2. **Enumeração ativa** — resolver DNS, brute de subdomínios, probe HTTP (status/título/server).
3. **Superfície por host** — ler JS (endpoints/segredos), force-browse rotas, mapear APIs e params.
4. **Origin discovery** — achar IP de origem por trás de CDN/WAF (bypass de proteção).

## Subdomain takeover (P7)
- Beyond Basics (Sukhveer Singh) — https://sukhveersingh97997.medium.com/subdomain-takeover-beyond-basics-from-a-bug-bounty-hunters-perspective-8a7ec892ff14
- **Padrão:** subdomínio com CNAME apontando pra serviço (S3, Heroku, GitHub Pages...) não mais provisionado → você reivindica o serviço e serve conteúdo no domínio da vítima.
- **Gatilho:** CNAME órfão + página de erro "no such bucket/app". Cheque com nuclei (templates de takeover) ou manualmente o CNAME.

## O que caçar durante o recon (liga com os padrões)
- **Endpoints em JS** → IDOR/BAC escondidos (P1/P3). Baixe todo `.js`, extraia rotas/params.
- **Subdomínios órfãos** → takeover (P7).
- **APIs antigas/versões** (`/v1`, `/api/internal`) → authz esquecida (P7/P1).
- **Headers/CORS** → nosso `cors_headers_scan.py` (reflexão de Origin, credenciais).
- **Secrets** → chaves em JS, `.env`, repositórios, respostas de erro.

## Fluxo prático (nossos tools)
```
python3 tools/recon.py <dominio> --probe --out targets/<dominio>/recon
python3 tools/cors_headers_scan.py -f targets/<dominio>/recon/live-hosts.txt --json targets/<dominio>/recon/cors.json
```
(ou só `code 0 <dominio>`). Instale subfinder/nuclei no Mac pra ampliar cobertura.

---
## Ingeridos automaticamente — 2026-08-31

### Listen to the whispers — timing attacks p/ revelar superfície oculta (James Kettle)
- **Alvo · Classe · Bounty · Data** — Técnica geral (milhares de sites) · Recon / descoberta de superfície · Black Hat USA / PortSwigger · 2025 — [link](https://portswigger.net/research/listen-to-the-whispers-web-timing-attacks-that-actually-work)
- **Padrão:** medir tempo do request ao 1º byte diferencia params ocultos, injeção server-side e proxies mal configurados de forma confiável em produção — timing detecta "algo", mas precisa interpretação (WAF, log, cache).
- **Como acharam:** "response time" como atributo no Param Miner; comparação do quartil inferior de ~30 medições; classificação da origem do atraso (DNS/rede/disco/RAM/CPU); amplificação com ReDoS/entidades XML aninhadas.
- **Gatilho:** cache dependente de parâmetro (10x+ de diferença); atraso de parse (JSON inválido); DNS lookup (1º lento, 2º rápido); input inválido MAIS rápido que válido (short-circuit). Use quando descoberta de param/endpoint satura.
