# Yahoo — arapuca 🪤 (inventário de peças fracas → chain)

Cada peça = achado **individualmente fraco** do recon. Passo de combinação busca a soma que vira High/Crit.
Formato: `id · peça · acesso p/ usar · sev. isolada · o que HABILITA`. Herda escopo (header `X-Bug-Bounty: Intigriti-moldret`, 50 req/s).

## Peças (do recon Nível 1-3 + comparativo externo)
| id | peça | acesso | sev. isolada | habilita |
|----|------|--------|--------------|----------|
| Y1 | **ATS em todo edge alcançável** (mail/finance/checkout…) | nenhum | Info | routing-SSRF (Y-L7); mesma classe do "Cracking the Lens" ($20k) |
| Y2 | **`origin.checkout.*.yahoo.com` em AWS ELB** (origens diretas atrás do CDN, 403) | nenhum | Info | direct-origin access / WAF bypass / host-confusion |
| Y3 | **`oidc.checkout.{yahoo,finance,mail}.com`** (OIDC no fluxo de pagamento) | nenhum→conta | Info | OAuth no checkout: `redirect_uri`/dirty-dancing + lógica de $ |
| Y4 | **split de infra ATS↔GCP↔AWS** (`authnapi`=GCP, `origin.checkout`=AWS) | nenhum | Info | confusão de fronteira de confiança (Q3/Q5): edge confia no origin? |
| Y5 | **`sapi.oauth2.yahoo.com` responde em HTTP** (sem TLS) | nenhum | Low | downgrade / interceptação de token |
| Y6 | **envs non-prod p/ login/checkout/payment** (dev/qa/stage/beta/gamma/trunk/canary) | nenhum→conta | Info | authz mais fraca / reuso de token/segredo prod↔non-prod |
| Y7 | **CDN-proxy embute origem externa** (`antivirus.google.com…cdn…omega.gq1`) | nenhum | Info | SSRF/host-confusion (interno, provável inalcançável) |
| Y8 | **`caldav.calendar.yahoo.com` 401** (CalDAV auth-gated) | conta | Info | IDOR de evento/calendário alheio |
| Y9 | **admin panels** `mario-admin.nevec`/`admin.nevec`/`hermes-admin.ec` (403) | ? | Info | interface admin exposta (CWE-306) se authz frouxa |
| Y10 | **`credstore-stage-staging…omega.corp`** (credential store, interno) | interno | Info(potencial Crit) | segredo se alcançável via SSRF (Y1!) |
| Y11 | **`cloudboot-auth-api-production…omega.corp`** (auth API, interno) | interno | Info | auth bypass se alcançável via SSRF (Y1!) |
| Y12 | **`payments.yahoo.com`/`token-service.payment`** (hub de $, 403) | conta | Info | superfície de pagamento (IDOR/lógica/token) |

## Passo de combinação (chains candidatas)
- **CHAIN-A (a mais forte): Y1 + Y10/Y11** → routing-SSRF alcança o `credstore`/`cloudboot-auth-api` **internos** (que não resolvem de fora, mas o edge alcança) → **segredo/credencial → Crit**. É a escalada natural do L7, e casa com o `S-SSRF-ROUTE-01` (metadata/serviço interno). **Melhor candidata agora.**
- **CHAIN-B: Y2 + Y4** → origem direta em AWS ELB + o edge ATS confia no origin → mandar request direto no `origin.checkout` (bypass do WAF ATS) e/ou forjar o header de confiança que o ATS injeta → **checkout sem o gate do edge**.
- **CHAIN-C: Y3 + Y6** → OIDC no checkout + env non-prod (`stage.oidc.checkout`) → `redirect_uri` frouxo / reuso de client entre prod e stage → roubo de `code` no fluxo de pagamento (casa dojo `S-OAUTH-LEAK-01`).
- **CHAIN-D: Y5 + Y3** → oauth2 em HTTP + OIDC → downgrade/intercept de token de auth.

**Melhor chain candidata agora:** **CHAIN-A (Y1+Y10/Y11)** → SSRF interno até o credstore = Crit. Falta: provar o SSRF (Y1, kit Burp) e confirmar que o edge alcança `*.omega.corp`.

## Seguir o rastro — árvore (abaixo, alimentada nesta sessão)

### Árvore (2026-09-07, seguir o rastro — sinal-raiz: OIDC no checkout de pagamento)
```
Sinal-raiz: oidc.checkout.*.yahoo.com (API viva) + checkout.yahoo.com → login?.done=
├─ R1 enum blind dos endpoints oidc.checkout → [INCONCLUSIVO] catch-all 404 JSON (NOT_FOUND
│      em todo path); real paths só do JS da SPA de checkout (auth) ou tráfego autenticado.
├─ R2 .done= open-redirect
│   ├─ checkout .done → [FP] server-set: ignora meu input, usa `subscriptions.payments.yahoo.com` fixo.
│   └─ login .done → [INCONCLUSIVO/borderline] 200 renderiza form; valida pós-auth (e .done é OOS-ish).
└─ R3 achar o SPA JS de checkout → [BLOQUEADO] payments/subscriptions redirecionam TODOS pro login (auth-gated).
    └─ 🌱 DESCOBERTA: login.yahoo.com = **Next.js** (`_next/static` em s.yimg.com) + carrega **3rd-party JS**
       (`consent.cmp.oath.com/cmp.js`, `opus.analytics.yahoo.com`). Dois ramos vivos:
       ├─ 🟢 RAMO VIVO B (unauth): **CVE surface do Next.js** no login (middleware bypass, cache) — testável já.
       └─ 🔴 RAMO VIVO A (precisa fluxo OAuth): **dirty-dancing `S-OAUTH-LEAK-01`** — se um `code` cair
              no login/error page (que carrega 3rd-party JS sem CSP forte) → exfil cross-origin. Casa CHAIN-C.
```
**Veredito do rastro:** os leads de dinheiro (L8/Y3/Y12) convergem em **"precisa conta"**; o rastro rendeu **1 ramo vivo unauth** (Next.js no login) e reforçou a **CHAIN-C** (OIDC no pagamento + 3rd-party JS no login = dirty-dancing).

## Peças novas (do rastro)
| id | peça | acesso | sev. isolada | habilita |
|----|------|--------|--------------|----------|
| Y13 | **login.yahoo.com = Next.js + carrega 3rd-party JS** (consent/opus) | nenhum | Info | (a) CVE Next.js (middleware/cache) unauth; (b) sink de exfil pro dirty-dancing (CHAIN-C) |
| Y14 | **oidc.checkout.* = API catch-all 404** (JSON) | conta | Info | endpoints OIDC de pagamento (paths do SPA JS quando autenticado) |
| Y15 | **`.done=` server-set no checkout** (não atacante-controlado) | — | FP | — (rebaixada) |
