# A caçada até aqui — Arkose Labs

Log de progresso da sessão. Atualize ao fim de cada sessão. A **ficha** (`README.md`) é o estado destilado; este arquivo é a **narrativa + próximos passos**.

---

## Sessão 2026-09-02 — `protocolo ladrão de bancos`

### O que aconteceu
1. Teste de comandos do Sword: `modo hunter` (portfólio estava semente → travou), `code 5` (sem `project_read` nesta sessão do Claude Code → não roda daqui).
2. Tiago inseriu no `CODES.md` o **`protocolo ladrão de bancos`** (recon massivo de 1 alvo) + populou `portfolio.md` com 7 alvos e criou as fichas em `targets/`.
3. Rodado `protocolo ladrão de bancos` → alvo escolhido: **#2 Arkose Labs**.
4. `code 0 arkoselabs.com` (`recon.py --all --rate 5`) + `cors_headers_scan.py`. Saídas cruas em `recon/`.
5. OSINT passivo (crt.sh 502; WebSearch). Síntese destilada na ficha `README.md`.

### Recon — resultado
- subfinder **466** subs → **129** resolvem → **83 vivos** (httpx).
- katana 2390 URLs (muito ruído de `developer.arkoselabs.com` + loop em `connect.../API/API/...`).
- `gau`/`waybackurls`: **timeout** → sem corpus histórico.
- `nuclei`: **0** (rodou em fallback de env `sonic/ast` — baixa confiança).
- `gf` / `gospider` / `amass`: **não instalados** → sem buckets, sem 2º crawler.
- `cors_headers_scan`: 0 ALTO · 282 MÉDIO · 18 BAIXO (o MÉDIO é quase tudo `ACAO:*` wildcard — descartado).

### Descoberta principal — multi-tenancy em 2 eixos
- **42× `<cliente>-api.arkoselabs.com`** (adobe, amazon, boa=Bank of America, chime, citizensbank, tiaa, blizzard, roblox, tinder, meta, linkedin, github, gitlab, dropbox, figma, docusign, epic-games, snap, bumble, badoo, match, coursera, expedia, hp, microsoft, rockstar, groupme, linktree, olo, rightmove, wbd, aircanada, asurion, att, abdata, bhn, ctm, lively, tlc + discovery, client). Mesmo edge CloudFront, path-routed por public key.
- **Réplica multi-cloud:** primário AWS CloudFront (`client-api`, `verify`) + secundário **Azure Front Door** (`client-api.azure`, `client-api-secondary.azure`, `verify.azure`, `verify-secondary.azure` — todos 403 no momento).

### Hosts-chave vivos
`portal.arkoselabs.com` 200 "Arkose Portal" (Core, dashboard multi-tenant) · `iframe.arkoselabs.com` 200 "Authentication" (Core) · `client-api.arkoselabs.com` 404 path-routed (`/api/rai/v1/*`, `/api/edge/v1/`, `/v2/<key>/api.js`) · `us.auth0.arkoselabs.com` 302 (Auth0 IdP) · `admin.arkoselabs.com` 403 edge · `customer-staging` 403 · `customer-sessions` 404 · `connect.arkoselabs.com` 302 CF+BotMgmt · `demo.arkoselabs.com` 200 (playground).

### OSINT
- crt.sh 502 (retentar).
- **GitLab issue #362394** — `gitlab-api.arkoselabs.com` teve XSS em chain de 1-click ATO (Google sign-in). Revalidar.
- Sem writeups públicos de `portal`/`client-api` indexados.

### Leads priorizados (detalhe na ficha)
1. Cross-tenant IDOR no `portal` ("obtenção de info de usuário" = pago). **P1/P3.**
2. Reuso de signing-key / authz divergente AWS↔Azure. **arsenal multi-região.**
3. `admin.arkoselabs.com` 403 → force-browse com variação de método/header/path. **P7/P8.**
4. Auth0 `redirect_uri` allowlist + signup/verificação por domínio. **Open Redirect OAuth / Identity Verification.**
5. Staging: sessão de prod válida em `customer-staging`?
6. `client-api/api/rai/v1/cohorts/{id}` — IDs de objeto → IDOR candidate.
7. `connect` register/logging — lógica de enrolamento (step skip, mass-assignment de tenant). **P2/P4.**
8. `gitlab-api` XSS histórico — revalidar.

### Já descartado
- CORS `Access-Control-Allow-Origin: *` nos 42 `-api` → **público por design**, sem `Allow-Credentials`. Não é achado.
- `info-leak:server` (CloudFront/Cloudflare) → Core Ineligible.
- Headers ausentes em API JSON → best-practice/Low, OOS.

### Estado do git
Nada commitado nesta sessão (Tiago não pediu; há muita coisa staged não relacionada de antes).

---

## Sessão 2026-09-02 (cont.) — `modo hunter` + `formação de lança` no Arkose

### Modo novo criado
`formação de lança` (CODES.md › Modos + rota no THE-MIND). Dentro do `modo hunter`: Claude constrói → executa (guardrails) → simula o resto → cruza com `patterns.md`/`arsenal.md`. Para-e-confirma antes de request que altere dado/toque terceiro/saia do escopo. `[SIMULADO]` ≠ `[ACHADO]`.

### Iteração 1–2 (não-autenticada) — executado
- **Auth0 OIDC discovery aberto** (`us.auth0.arkoselabs.com`): `/oidc/register` (DCR) exposto, `auth_method: none`, PKCE `plain`, implicit ligado. → P6 fail-open. Lead #4 quente.
- **`portal` = shell de micro-frontends** (`@auth0/auth0-react`, module federation). CSP revelou hosts novos: `portal-prod.arkoselabs.com` (não resolve — origin interno?), `portal-account-mgmt.arkoselabs.com` (módulo federado, 200), `arkoselabs.us.auth0.com` (Auth0 canônico), `*.execute-api.us-east-2.amazonaws.com/demo/verify`. CSP `script-src *.arkoselabs.com` = larga → XSS em qualquer sub executa no portal.
- **`client-api/api/rai/v1/{sessions,cohorts,cohorts/{id}}` VIVO + auth-gated** — 401 `rai.unauthorized` (bearer). Backend Go. Alvo IDOR #1 com token.
- **`admin.arkoselabs.com`** — matriz de bypass (método/header/path) toda 403; bloqueio CloudFront pré-origin. `[INCONCLUSIVO → provável PADRÃO]`. FP "edge bem configurado".
- **`client-api.azure`** `/api/rai/v1/sessions` → 403 HTML Azure (failover não serve a API agora).
- `client_id`/`audience`/base de API NÃO estão no shell JS — em chunks lazy/runtime. Precisa browser ou sessão.

### Iteração 3 — `formação de lança` ativa (executado)
- **Lead #4 Auth0 DCR:** `POST /oidc/register` (autorizado pelo Tiago) nos dois domínios → **400 `"dynamic client registration is disabled"`**. Nada criado. Sub-ângulo DCR = **`[FP]`** (Auth0 lista o endpoint no discovery mesmo desabilitado). Registrado em `memory/arsenal.md` › *OAuth2/OIDC*.
- **Signup:** confirmado que **Arkose NÃO tem auto-registro** — `portal/login` é SPA Auth0; `www.../demo` → `/book-a-demo` (vendas); sem `/signup`/`/pricing`/`/free-trial`; `developer/docs` gated por contrato.
- **Aprendizado persistido:** `memory/arsenal.md` ganhou blocos *OAuth2/OIDC/Auth0-as-IdP* e *CSP larga por wildcard de organização* (a CSP `script-src *.arkoselabs.com` amplifica qualquer XSS de subdomínio).

### Encerramento (Selo de saída — 2026-09-02)
- **`modo hunter` + `formação de lança` DESLIGADOS.**
- **Onde parou:** superfície não-autenticada raspada (admin=FP, DCR=FP, CORS=by design). 4 leads quentes (#1 cross-tenant, #2 AWS↔Azure, #5 staging, #6 RAI IDOR) travados em `[SIMULADO]` — **precisam de bearer token e Arkose não tem self-signup**.
- **Próximo passo:** pedir conta de teste ao programa H1; OU pivotar pra CoinSpot/Figma (contas grátis, mesmo skillset). Ficha selada 100% atual.
- **Git:** mudanças não commitadas (Tiago não pediu commit).

## Próximos passos (ordem sugerida)
1. **Fechar gaps de recon:** rodar `setup.sh` (instala `gf`/`gospider`/`amass`); `gau arkoselabs.com` isolado com timeout maior (ou `waymore`); rerodar `katana` só nos hosts Core (`portal`, `iframe`, `client-api`, `verify`, `-d 2`); retentar crt.sh.
2. **`modo hunter` no Arkose:**
   - Criar conta no `portal` (e/ou usar `demo`) → mapear features rodando as **6 perguntas do The Mind**.
   - Lead #1 (cross-tenant no portal) e #3 (`admin` bypass) primeiro.
3. Achado → `protocolo contra-prova` → `protocolo report`.

## Arquivos desta caçada
- `targets/arkose-labs/README.md` — ficha (estado destilado + hipóteses).
- `targets/arkose-labs/recon/` — `subdomains.txt`, `live-hosts.txt`, `urls.txt`, `recon.json`, `cors.json`, logs `_run.log`/`_cors.log`.
- `targets/arkose-labs/a-cacada-ate-aqui.md` — este log.
