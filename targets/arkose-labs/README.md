# Alvo: Arkose Labs (arkose_labs) — Prioridade ALTA
- **Programa:** HackerOne · lançado Jan/2024 · Safe Harbor · https://hackerone.com/arkose_labs · docs: https://developer.arkoselabs.com
- **Por quê Alta:** MENOR concorrência do portfólio (67 reports/90d), paga de verdade (52 resolvidos), e o `portal.arkoselabs.com` é SaaS multi-tenant = BAC/IDOR/lógica (seu forte). Sword pode ajudar.
- **Reward Core:** Low $100–300 · Med $301–750 · High $2.5k–5k · Crit $5k–7k. Non-core (www) paga bem menos.

## ⛓️ Constraints pré-fixadas
1. Focar nos **Core apps**: portal, client-api, iframe, verify, cdn, client-sessions (pagam 5–10× o non-core).
2. Não testar infra de terceiros/vendor (OOS).
3. Brute em auth só conta se resultar em ATO; em não-auth = OOS.
4. Privado-ish: sem disclosure externo. Só contas próprias; sem eng. social; default ~5 req/s.

## 🎯 Onde mirar
`portal.arkoselabs.com` → BAC/IDOR multi-tenant, lógica, burla de auth entre contas de cliente. "Obtenção de info de usuário" = IDOR. client-api/client-sessions (tokens). Bypass do CAPTCHA = lane deles (secundário).

---

## Recon — `protocolo ladrão de bancos` (2026-09-02)
`code 0 arkoselabs.com` (`recon.py --all --rate 5`) + `cors_headers_scan.py`. Cru em `recon/`.
- subfinder **466** subs → **129** resolvem → **83 vivos**. `gau`/`wayback` timeout → sem corpus histórico. `nuclei` 0 (fallback de env, baixa confiança). `gf`/`gospider`/`amass` não instalados.
- `cors_headers_scan`: 0 ALTO · 282 MÉDIO · 18 BAIXO — o MÉDIO é quase tudo `ACAO:*` wildcard (**descartado**, ver abaixo).

### Superfície viva (Core + interessante)
| Host | Status | Nota |
|---|---|---|
| `portal.arkoselabs.com` | 200 "Arkose Portal" | **Core** — SPA estática (S3+CloudFront, webpack **module federation**, `@auth0/auth0-react`). |
| `portal-account-mgmt.arkoselabs.com` | 200 | **Módulo federado remoto** (`moduleEntry.js`, 142 KB). Único `portal-*` que resolve (testei ~13 nomes). |
| `portal-prod.arkoselabs.com` | **não resolve / recusa** (000) | Citado no CSP `connect-src` do portal — provável **origin interno** da API do portal. |
| `arkoselabs.us.auth0.com` | (Auth0) | Tenant Auth0 **canônico**; `us.auth0.arkoselabs.com` é o custom domain (CNAME). |
| `*.execute-api.us-east-2.amazonaws.com/demo/verify` | (API GW) | Citado no CSP — API Gateway do fluxo demo/verify (us-east-2). |
| `iframe.arkoselabs.com` | 200 "Authentication" | **Core** — iframe de challenge. |
| `client-api.arkoselabs.com` | 404 root; **`/api/rai/v1/*` VIVO** | **Core**. Backend Go. `/api/rai/v1/{sessions,cohorts,cohorts/{id}}` → **401 `rai.unauthorized`** ("Missing or invalid bearer token", JSON+`request_id`). `/api/edge/v1/` → 404. |
| `client-api.azure` · `client-api-secondary.azure` | 403 (Azure Front Door) | Réplica secundária multi-cloud (primário AWS). `/api/rai/v1/sessions` → 403 HTML Azure (não serve a API agora). |
| `verify.azure` · `verify-secondary.azure` | 403 (Azure Front Door) | idem, do `verify`. |
| `us.auth0.arkoselabs.com` | 302 | Custom domain do Auth0. OIDC discovery aberto (ver Iteração 1). |
| `admin.arkoselabs.com` | 403 (CloudFront edge) | **Sem bypass** — ver Iteração 2. Bloqueio pré-origin. |
| `customer-staging.arkoselabs.com` | 403 | Staging exposto. |
| `customer-sessions.arkoselabs.com` | 404 (CloudFront) | Existe; path-routed. (~= "client-sessions" do escopo Core.) |
| `connect.arkoselabs.com` | 302 (Cloudflare + Bot Mgmt) | Endpoints `register`/`logging` na doc. |
| `demo.arkoselabs.com` | 200 "Arkose Labs Demo" | Playground. |
| **42× `<cliente>-api.arkoselabs.com`** | 404 (CloudFront) | **Multi-tenant por subdomínio** — path-routed por public key. |

### Tenants por subdomínio (42)
`adobe airbnb amazon aircanada asurion att abdata badoo bhn blizzard boa(=Bank of America) bumble chime citizensbank coursera ctm docusign dropbox epic-games expedia figma github gitlab groupme hp linkedin linktree lively match meta microsoft olo rightmove roblox rockstar snap tiaa tinder tlc wbd` (+ `discovery`, `client`). Também `boa-verify.arkoselabs.com`.

### OSINT
- crt.sh 502 (retentar). GitLab issue **#362394**: `gitlab-api.arkoselabs.com` teve XSS em chain de 1-click ATO (Google sign-in). Sem writeups públicos de `portal`/`client-api` indexados; H1 hacktivity auth-walled.

---

## Iteração 1 — `modo hunter` + `formação de lança`, superfície não-autenticada (2026-09-02)

### [INFO / DCR = FP] Auth0 OIDC discovery — `us.auth0.arkoselabs.com/.well-known/openid-configuration`
- Discovery anuncia `registration_endpoint: /oidc/register`, `token_endpoint_auth_methods` inclui `"none"`, `code_challenge_methods` inclui `"plain"`, implicit ligado.
- **`POST /oidc/register` testado (autorizado)** nos dois domínios → **400 `"dynamic client registration is disabled"`**. Nada criado. **Sub-ângulo DCR = `[FALSO POSITIVO]`** (Auth0 lista o endpoint no discovery mesmo desabilitado).
- **Ainda de pé (precisam de `client_id` real):** allowlist de `redirect_uri` no `/authorize` (open redirect → leak de code/token = ATO); PKCE `plain` aceito de fato. Casa com arsenal *Open Redirect OAuth* + **P5/P6**.

### [BLOQUEIO] Não há auto-registro no `portal`
- `portal.arkoselabs.com/login` = SPA client-side (Auth0 React, sem redirect server-side). `www.arkoselabs.com/demo` → `/book-a-demo` (vendas). Sem `/signup`, `/pricing`, `/free-trial`. `developer.arkoselabs.com/docs` → tudo gated por contrato/vendas.
- **Arkose não tem signup self-service.** Pra autenticar nos leads quentes: pedir conta de teste/sandbox **via programa H1** (`hackerone.com/arkose_labs`, aba policy) — comum em B2B — ou pivotar de alvo.

### [INFO] `portal` é shell de micro-frontends — hosts novos no CSP
- `connect-src`: `'self' *.arkoselabs.com/ https://portal-prod.arkoselabs.com/ https://arkoselabs.us.auth0.com/oauth/token https://*.execute-api.us-east-2.amazonaws.com/demo/verify`.
- `script-src *.arkoselabs.com` + `frame-src *.arkoselabs.com` → **CSP larga**: XSS em qualquer sub `.arkoselabs.com` (ex.: lead `gitlab-api` #8) executa no origin do `portal`. Amplifica qualquer XSS refletido do parque.
- `client_id`/`audience`/`redirect_uri`/base de API **não estão no shell** — ficam em chunks lazy do webpack ou em config de runtime. **Precisa de browser** (claude-in-chrome) ou sessão pra extrair.

### [INCONCLUSIVO → provável PADRÃO] Lead #3 — `admin.arkoselabs.com` bypass
- Matriz testada: métodos (GET/POST/HEAD/OPTIONS/PUT/TRACE), header overrides (`X-Original-URL`, `X-Rewrite-URL`, `X-Forwarded-For 127.0.0.1/10.x`, `X-Custom-IP-Authorization`, `X-Originating-IP`, `Client-IP`), paths (`/.`, `//`, `/%2e/`, `/login`, `/admin`, `/api`, `/robots.txt`, `/;/`, …). **Tudo 403** idêntico (página de erro CloudFront `len=919`; TRACE→405 default).
- **Veredito:** bloqueio no **edge CloudFront, pré-origin** — header overrides não passam. Casa com arsenal *BAC bypass por variação de request* → **FP comum: "edge bem configurado"**. Não é achado.
- **Revisitar só se:** achar o domínio de origin real, ou testar confusão de `Host` p/ outra distribution, ou PoP CloudFront diferente. Prioridade baixa.

### [DESCARTADO] CORS `Access-Control-Allow-Origin: *` nos 42 `-api`
- **PÚBLICO POR DESIGN:** client API feita pra ser chamada de qualquer origem; **sem `Allow-Credentials: true`** → sem impacto. Também `info-leak:server` (CloudFront/Cloudflare) e headers ausentes em API JSON = best-practice/Low, Core Ineligible.

---

## Hipóteses / leads (status)
| # | Lead | Status | Bloqueio |
|---|------|--------|----------|
| 1 | **Cross-tenant IDOR no `portal`** (`?customerId=`, IDs em listagens; RAI `sessions`/`cohorts/{id}`) — "obtenção de info de usuário" = pago. **P1/P3.** | `[UNTESTED]` — **quente** | precisa conta no `portal` (bearer token) |
| 2 | **Reuso de signing-key / authz divergente AWS↔Azure** — token do primário aceito em `*.azure`? controle que barra no AWS abre no Azure? **arsenal multi-região.** | `[UNTESTED]` | Azure Front Door 403 agora; precisa token + retry quando ativo |
| 3 | `admin.arkoselabs.com` 403 → force-browse | `[INCONCLUSIVO → provável PADRÃO]` | edge block pré-origin |
| 4 | **Auth0** — `/oidc/register` (DCR) sem auth? `redirect_uri` allowlist fraca no `/authorize` (→ leak de code/token = ATO)? PKCE `plain`? signup/verificação por domínio. **arsenal Open Redirect OAuth / Identity Verification.** | `[UNTESTED]` — **quente** | precisa `client_id` real (do browser) + `POST /oidc/register` é write (para-e-confirma) |
| 5 | **Staging** (`customer-staging` / `customer-sessions`) — token/sessão de prod aceito no staging? authz mais fraca? **arsenal multi-tenant.** | `[UNTESTED]` | precisa token |
| 6 | **`client-api/api/rai/v1/cohorts/{id}` / `sessions`** — confirmado vivo + auth-gated (bearer). O resolver checa **dono** do cohort/session ou só validade do token? **P3.** | `[UNTESTED]` — **quente** | precisa bearer token (2 tenants) |
| 7 | **`connect.arkoselabs.com` register/logging** — pular etapa, forjar campo de tenant, mass-assignment `ownerId/customerId`. **P2/P4.** | `[UNTESTED]` | mapear request real (browser/doc) |
| 8 | **`gitlab-api` XSS histórico** (#362394) — revalidar reflexão/variantes; se vivo, com a CSP larga do portal → chain forte. | `[UNTESTED]` | testar payloads de reflexão (para-e-confirma) |

## Próximo passo
**Status: caçada PAUSADA em 2026-09-02 (`modo hunter` encerrado com Selo de saída).** Motivo: os 4 leads quentes precisam de bearer token e **Arkose não tem self-signup** (B2B, contrato/vendas).
- **Pra retomar:** conseguir conta de teste/sandbox **via programa H1** (`hackerone.com/arkose_labs`, aba policy — pedir ao programa). Com sessão: capturar via browser o `client_id`/`audience`/base de API + **bearer token de 2 tenants** → rodar leads #1/#2/#5/#6.
- **Sem conta, ainda dá (baixo EV):** revalidar `gitlab-api` XSS (#8); `setup.sh` + rerodar `gau`/`katana` nos Core; retentar crt.sh; testar `redirect_uri` no `/authorize` assim que tiver um `client_id`.
- **Decisão de rumo:** pivotar pra **CoinSpot** (#1 portfólio, 2 contas grátis) ou **Figma** (#2, contas de teste livres) — mesmo skillset BAC/IDOR, sem gate. Arkose fica selado aqui pra retomar.

## Achados
| Data | Severidade | Tipo | Endpoint | Status |
|------|-----------|------|----------|--------|
|      |           |      |          |        |
