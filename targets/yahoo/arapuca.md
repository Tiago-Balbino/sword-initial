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
| Y16 | **`x-amzn-mtls-clientcert-*` vazado em TODA resposta** (200 e 404) de `subscriptions.payments.yahoo.com` — cert **rotaciona por request** (edge node muda: e8→e10 `.ycpi.bra.yahoo.com`); SANs decodificados vazam `spiffe://athenz.cloud/ns/default/sa/ycpi.egress.ycpi-remap`, `athenz://instanceid/sys.openstack.provider-ybiip/<id>`, `athenz://hostname/e{N}.ycpi.bra.yahoo.com`, DNS `ycpi-remap.ycpi-egress.ybiip.oath.cloud`, IPs de edge | conta (não testado unauth) | Info (cert é público) | recon de topologia interna (pool de edge nodes por PoP, convenção Athenz/SPIFFE); **abre C-03**: header aceito como identidade sem re-checar mTLS real? **Confirmado LOCAL à stack de pagamento (AWS)** — `login.yahoo.com`/`mail.yahoo.com` NÃO vazam isso (testado 09/07) |
| Y17 | **`getSubscriptionsList`/`balances`/`getFlags` = 404 idêntico (Next.js catch-all) em GET e POST, same-origin** | conta | — | confirma que a API real **não é same-origin** nesse host — mata a hipótese de path direto; próximo elo exige capturar a chamada real (DevTools) |
| Y18 | **`finance.yahoo.com` CSP fraca**: `script-src 'self' blob: 'unsafe-inline' 'unsafe-eval' ...` **sem nonce** (≠ subscriptions/login, que usam nonce) | nenhum | Info | qualquer XSS achado em `finance.yahoo.com` roda **sem freio de CSP** — sobe o valor de reflexão/DOM-XSS ali |
| Y19 | **`x-envoy-decorator-operation: finance-nimbus--mtls-production-bf1.finance-k8s:4080/*`** em `finance.yahoo.com` | nenhum | Info | vaza nome de cluster/rota Envoy interno (`finance-nimbus`, `finance-k8s`, porta 4080) — liga com `finance-k8s.omega.yahoo.com` do Nível 1; confirma mTLS interno (Envoy) também no cluster finance, mecanismo diferente do Y16 (AWS API GW) |
| Y20 | **`subscriptions.payments.yahoo.com` CSP: `frame-src ... *`** (wildcard — QUALQUER origem pode ser framed) | nenhum | Info | amplifica ataque tipo postMessage/dirty-dancing (`S-OAUTH-LEAK-01`) SE houver listener sem origin-check na página; script-src é forte (nonce), então o vetor de entrada não é injeção direta |
| Y21 | **`cm-ui.staging.yahoo.com`/`cm-ui.yahoo.com`** (hosts novos, achados no `frame-ancestors` da CSP do finance) | ? | Info | superfície não mapeada — "Content Management UI"? checar in-scope + probar |

### Sessão 2 do rastro (09/07) — dissecção completa de headers, não só Location/Content-Type
- **Lição registrada:** o probe inicial só olhava `Location`/`Content-Type`/corpo — isso quase escondeu o Y16. Doravante, **todo probe autenticado usa headers completos por padrão** (o script `tools/yahoo_auth_probe.py` mudou o default) e dissecta a resposta inteira, mesmo em 404/erro genérico. Certificado mTLS agora é **decodificado automaticamente** (SANs) pelo script — ver `memory/recon-metodo-padrao.md`.
- **Y17 fecha o ramo de path-guessing** (GET+POST, ambos catch-all idêntico) → a API real do checkout/subscriptions **não vive em `subscriptions.payments.yahoo.com/subscriptions/v1/*` diretamente**; precisa da chamada XHR real capturada via DevTools (pendente — pedido ao Tiago).
- **⚠️ Correção de hipótese (09/07):** a nota anterior de que `login.yahoo.com` "carrega 3rd-party JS sem CSP forte" (base do `H9`/CHAIN-C) estava **errada** — a CSP real do happy-path de login usa **nonce** e é razoavelmente forte (script-src sem unsafe-inline/eval efetivo). O dirty-dancing (`S-OAUTH-LEAK-01`) só sobrevive se a **página de ERRO** (não a de login normal) tiver CSP diferente/ausente — isso **não foi testado** ainda. `CHAIN-C` rebaixada pra `[UNTESTED — hipótese enfraquecida]` até checar a error page especificamente.
- **Universalidade do Y16 testada:** `subscriptions.payments.yahoo.com` (200 e 404) = sim, sempre; `login.yahoo.com`, `mail.yahoo.com` = não. **Confirma Y2/Y4**: a stack de pagamento roda numa fronteira arquitetural distinta (AWS API GW/ALB com mTLS pass-through) do resto do Yahoo (ATS clássico) — é aí que a suposição "debug header não escapa" quebra.
- **Próximo elo de Y16 (🔴 não-destrutivo):** replay do valor exato de `x-amzn-mtls-clientcert-subject` capturado como header numa request pros hosts internos-suspeitos da arapuca (`Y10` `credstore-stage-staging...omega.corp`, `Y11` `cloudboot-auth-api-production...omega.corp`) — ver se muda o 404/403 padrão. Casa com `CHAIN-A` (SSRF + credstore): mesmo sem o SSRF confirmado, testar se a *identidade* sozinha (sem o transporte SSRF) já destrava algo é um ramo independente e barato.

## Atualização 2026-09-07 (sessão hunter pt2) — CHAIN-A morta, nova máquina: Lightyear CMS

**⛔ CHAIN-A (Y1+Y10/Y11 routing-SSRF → credstore) = MORTA in-band.** ATS roda `remap_required=1` Yahoo-wide: todo edge devolve `404 Not Found on Accelerator` p/ Host não-allowlistado (bananastand incluso), e absolute-URI/@/porta morrem no parser (`400 Invalid HTTP Request`). Resíduo só via Collaborator OOB (manual, improvável). Y1 rebaixado a Info sem caminho de escalada in-band.

### Peças novas (Lightyear CMS / Yahoo Creators — `cm-ui.yahoo.com`)
| id | peça | acesso | sev. isolada | habilita |
|----|------|--------|--------------|----------|
| Y22 | **`cm-ui.yahoo.com` = "Lightyear CMS"** (Next.js, 200 unauth shell, **sem CSP**) + staging gêmeo | nenhum | Info | superfície CMS multi-tenant inteira; bundle JS vaza backend/authz |
| Y23 | **auth = `Bearer` JWT do `localStorage.access_token`** (não cookie) | conta CMS | Info | precisa capturar token do DevTools p/ testar; refresh on 401 |
| Y24 | **`getActiveTeamLS` — time ativo vem do localStorage (cliente controla)** | conta CMS | Info→**potencial High** | **BOLA/cross-tenant**: trocar `activeTeam`/team-id → dados de outro time se backend não checa membership |
| Y25 | **3 backends distintos** — `cm-auth-service`(FastAPI) · `content-service`(AWS API GW) · `api.creators`(Spring OAuth2) · `api.yahoo.com`(DNS interno) | nenhum | Info | costura de authz: mesma ação por caminhos diferentes (Pergunta #3); enforcement inconsistente? |
| Y26 | **`/assignments/me/team/{id}` · `/admin/user/{id}` · `/admin/teams` · `/earnings`** (rotas do bundle) | conta CMS | Info→**High** | IDs em path = alvos BOLA diretos; `/earnings` = money |
| Y27 | **OAuth client Creators `ASWQMYXpYIZlSogi`** redirect_uri estrito (testado: evil/subdomain/@ → error) | nenhum | FP | redirect_uri hardened (PKCE+state+nonce); não é o vetor |

### Chain nova candidata
- **CHAIN-E (a nova mais forte): Y22+Y23+Y24+Y26** → onboard/login em Yahoo Creators (self-serve? `activity=creator-onboarding`) → capturar `access_token` → **trocar `activeTeam`/team-id/user-id** pra ler/editar conteúdo/earnings de outro time = **BOLA multi-tenant (fit #1, High+)**. **Bloqueio:** access_token de conta provisionada (passo do Tiago). É o próximo alvo do hunter.

---
# 🛞 descobrir a roda (2026-09-07) — reconstrução da máquina

## Modelo do sistema (reconstruído dos fragmentos)
> Marcado `[F]`=fato observado · `[H]`=hipótese inferida (não testada).

**Camada EDGE**
- `[F]` Quase todo host público = **Apache Traffic Server (ATS)** com `remap_required=1` (Host+path allowlistados; senão `404 Not Found on Accelerator`). Envoy atrás (`x-envoy-decorator-operation` no finance → cluster `finance-nimbus`/`finance-k8s:4080`, mTLS).
- `[F]` Exceções de stack: `authnapi.login`=**Google Cloud CDN**; `billing/edit.finance`=**AWS CloudFront**; stack de pagamento (`subscriptions.payments`, `origin.checkout.*`)=**AWS API GW/ALB** com **mTLS pass-through** (vaza `x-amzn-mtls-clientcert-*`, identidade Athenz/SPIFFE — Y16).
- `[F]` Bot-mgmt/rate-limit no edge (finance 429, login 429 rápido).

**Camada IDENTIDADE (IdP central)**
- `[F]` `login.yahoo.com` (Next.js) + `api.login.yahoo.com/oauth2/request_auth` = **provedor OAuth2/OIDC** do Yahoo. Authorization Code + PKCE + state + nonce; **redirect_uri validado estrito** por client. Seta cookie `AS`.
- `[H]` Todo produto que precisa de auth delega pro IdP via `.done=`/OAuth. O `access_token` (JWT c/ `aud`) é emitido por-produto.

**Subsistema LIGHTYEAR CMS / YAHOO CREATORS (a máquina nova)**
- `[F]` Frontend `cm-ui.yahoo.com` (Next.js App Router, "Lightyear CMS"), via ATS, **200 unauth (shell), sem CSP**. Staging: `cm-ui.staging.yahoo.com`.
- `[F]` Login do CMS: `api.creators.yahoo.com` = **Spring Security OAuth2 client** (`/oauth2/authorization/yahoo` → IdP, client `ASWQMYXpYIZlSogi`, callback `/auth/callback`, `activity=creator-onboarding`).
- `[F]` Authz do CMS: `cm-auth-service.yahoo.com` = **FastAPI/Python**. Valida `Bearer` JWT (de `localStorage.access_token`), serve `/assignments/me/resources`, modelo de time/permissão (`manage:authors`,`read:user`,`CONTENT.PUBLISH`,`SECURE_PREVIEW`).
- `[F]` Dados: `content-service.yahoo.com` = **AWS API Gateway** (`Missing Authentication Token`); `feed-api.yahoo.com`; `api.yahoo.com/{content-management,partner-portal-management,yahoo-creator-management}` = **DNS INTERNO** (as APIs de gestão "reais", server-side only).
- `[F]` **Estado do "time ativo" mora no CLIENTE** (`getActiveTeamLS`/`setActiveTeamLS` → localStorage: `activeTeam`/`activeTeamPropertyIds`/`activeTeamProviderIds`) e é enviado ao backend.

**Onde o estado vive**
- Identidade: cookies do IdP + **JWT no localStorage** (client-held, não server-session).
- Contexto de time/tenant: **localStorage do cliente** (não server-session) ⚠️.
- Conteúdo: `content-service` (AWS API GW) + `api.yahoo.com` interno.

## Engenharia reversa das suposições (6 perguntas nas FRONTEIRAS)
- **B3 — Frontend(Bearer+activeTeam) ↔ cm-auth-service:** `[H]` *o dev assume que o `activeTeam` que o cliente manda é um time do qual ele é membro.* Se o FastAPI não re-checa membership por request → **BOLA/cross-tenant** (P#2: cliente controla o tenant). **Costura #1.**
- **B4 — cm-auth-service(decisão authz) ↔ content-service(AWS API GW) ↔ api.yahoo.com(interno):** `[H]` *content-service confia que o cm-auth-service já autorizou e só valida o token (não a posse do recurso).* Bater direto no `content-service` com token válido + id de conteúdo de OUTRO time → **BOLA** (P#3: caminho alternativo pro mesmo efeito, sem o mesmo controle). **Costura #2.**
- **B5 — aud do JWT entre serviços:** `[H]` *o `access_token` emitido pro CMS/creators é aceito por `content-service`/`feed-api` sem checar `aud` estrito* → **token carryover cross-service** (P#5: mesmo dado/credencial atravessa camadas com validação diferente).
- **B2 — ATS(edge) ↔ origin(AWS ELB):** `[F/H]` `origin.checkout.*`=ELB direto atrás do CDN → `[H]` bater no origin **pula o WAF/gate do ATS** (P#3). Y16 mostra que o origin de pagamento **confia e reflete** headers mTLS injetados → `[H]` o origin trata `x-amzn-mtls-clientcert-*` como **identidade sem re-verificar o mTLS real** (C-03).
- **B6 — prod ↔ non-prod:** `[H]` token/segredo de `cm-ui.staging`/`beta.login`/`stage.checkout` **reusável em prod** (authz mais fraca em non-prod) — P#6 fail-open de ambiente.
- **B-Next — Next.js server-side do cm-ui:** `[H]` *o app Next.js do `cm-ui` tem route handlers `/api/*` que rodam server-side e proxeiam pro `api.yahoo.com` INTERNO* — se existirem e não re-autorizarem, alcanço a API interna de fora (`/api/log` apareceu no bundle). **Testável unauth já.**

## Não-testado (ranqueado por fragilidade do modelo)
1. **[precisa token] `activeTeam`/team-id swap** em `cm-auth-service /assignments/me/team/{id}`, `/assignments/me/teams/*` — costura #1 (B3). **Mais frágil.**
2. **[precisa token] `content-service` direto** com id de recurso alheio (B4) + **replay do MESMO token em `content-service`/`feed-api`/`cm-auth-service`** (B5, aud).
3. **[unauth JÁ] `cm-ui.yahoo.com/api/*`** route handlers Next.js (`/api/log`, +enum) — proxy pro interno? (B-Next).
4. **[unauth JÁ] `cm-auth-service` FastAPI enum:** `/docs`,`/openapi.json`,`/redoc` (deram? checar direto no host FastAPI, não no Spring), `/assignments/*`, verbos (POST/PUT/DELETE) sem token → posture.
5. **[precisa token] `/admin/user/{id}`, `/admin/teams`, `/admin/brands`, `/earnings`** — privesc/BOLA + money.
6. **[unauth] `origin.checkout.*` AWS ELB** direto (Y2, B2) — resolve? aceita conexão direta? WAF bypass.
7. **[unauth] Y16 replay** do `x-amzn-mtls-clientcert-subject` capturado como header p/ endpoints (C-03).
8. **[unauth] WCP** fuzz de headers unkeyed além de X-Forwarded-Host, em endpoints não-front-page.
9. **[unauth] prod↔staging** — `cm-ui.staging` difere? token cross-env.
10. **[unauth] OAuth `activity=`** outros valores além de `creator-onboarding` (fluxos diferentes → scopes/telas diferentes).

## Cadeias narrativas (multi-passo)
- **CHAIN-E [top, precisa token]:** onboard creator (self-serve? `activity=creator-onboarding`) → JWT → **trocar `activeTeam`** pro time de outro → `cm-auth-service` serve recursos alheios (não checa membership) → **ler/editar conteúdo+earnings cross-tenant** = High+. Elos faltando: 1 (o token).
- **CHAIN-G [precisa token]:** token válido (qualquer) → bater **direto** no `content-service`(AWS API GW) com content-id de outro time → se o GW só valida token, não posse → **BOLA**. Elos: token + 1 id alheio. Testa B4 — barato uma vez com token.
- **CHAIN-F [precisa token]:** token do creators → replay em `feed-api`/`content-service` → se `aud` frouxo → **carryover cross-service**. Elos: token.
- **CHAIN-H [unauth-parcial]:** `cm-ui/api/*` server handler → proxeia `api.yahoo.com` interno sem re-authz → **alcança a API de gestão interna de fora**. Elos: existir o handler (enum agora).
- **CHAIN-I [unauth]:** origin.checkout ELB direto (B2) → pula WAF; + Y16 (header mTLS como identidade) → **request de checkout sem o gate do edge**. Elos: origin alcançável + origin confiar no header.

**➡️ Próxima a executar:** ~~CHAIN-H~~ **[SUPERADA — testada NEGATIVA abaixo]**. Veredito definitivo mais abaixo: **CHAIN-E** (precisa token).

## Execução pós-síntese (2026-09-07) — chains unauth exauridas
- **CHAIN-H = [NEGATIVA]:** único route handler Next.js do `cm-ui` é `/api/log` (POST telemetria, GET→405). Os `api.yahoo.com/*` do bundle são **chaves de mapa de permissão**, não alvos de fetch → **não há proxy server-side pro interno**. Premissa refutada.
- **CHAIN-I = [NEGATIVA/bloqueada]:** origins de pagamento resolvem direto pra AWS ELB (`{dev,qa,stage,prod}.origin.checkout` + `token-service.payment` = `payments-aws-**cde**-prod`, PCI CDE), MAS conexão direta → **403 `awselb/2.0`** (todo Host). O ELB exige o **cert mTLS do edge** (flip do Y16) → direct-origin/WAF-bypass **bloqueado**. Peça nova: **Y28 = origins PCI-CDE alcançáveis mas ELB-gated por mTLS**.
- **Consequência:** costuras frágeis B3(`activeTeam`)/B4(content-service direto)/B5(aud carryover) estão **TODAS atrás do muro do JWT**. Nenhuma chain unauth restante.

**➡️ Próxima a executar (definitivo):** **CHAIN-E** (activeTeam swap) → depois **CHAIN-G** (content-service direto) e **CHAIN-F** (aud carryover) — as 3 destravam com **1 elo: o `access_token` de conta CMS/creator**. Sem o token, o alvo Yahoo está em **espera** (todas as frentes unauth = negativas testadas).

---
# 🗺️ Mapa da API Lightyear CMS (engenharia reversa unauth, 2026-09-07) — "quanto mais conhecimento melhor"

## Método: oráculo de existência de 3 estados (sem token) — NOVO no arsenal
Bater GET unauth e classificar a resposta:
- **JSON `403 {"detail":"Not authenticated"}`** (FastAPI) ou **`307`** trailing-slash = **endpoint REAL existe**.
- **JSON `404 {"detail":"Not Found"}`** = chegou no FastAPI, rota não existe.
- **HTML 404 (página Yahoo)** = ATS nem roteou (path fora do remap daquele host).
- ⚠️ `feed-api.yahoo.com` = **401 pra TUDO** (auth-first, inclusive lixo) → **não é oráculo**, lista dele não confiável.
- ⚠️ `content-service.staging`/`.dev` = **`Access Denied` HTML no edge** (gate de rede non-prod) → inalcançável unauth.

## Serviços e endpoints CONFIRMADOS existindo (403/307 = real)
**`cm-auth-service.yahoo.com` (FastAPI — authz/times/usuários):**
- `/assignments/me/resources` · `/assignments/filter` · `/assignments/me/teams/providers` · `/assignments/me/teams/resources/grouped` · `/assignments/me/team/{id}` (prefixo)
- `/teams/me` · `/teams` (307) · `/users/list` · `/users` (307) · `/roles/list`
- `/validate-token` · `/applications/users/me/configuration` · `/logout` (307)

**`content-service.yahoo.com` (AWS API Gateway — conteúdo):**
- `/ncc/audience-estimate` · `/ncc/get_all` · `/ncc/publish` · `/ncc` (307)
- `/property/all` · `/property` (307) · `/announcement/latest` · `/announcement` (307)
- `/author` (307) · `/content_item` (307)

**`api.creators.yahoo.com` (Spring OAuth2):** `/content-performance/top-content` · `/studio` · `/auth/callback` · `/oauth2/authorization/yahoo` (login init) · `/health` (200 vazio)

**`feed-api.yahoo.com`:** blanket-401 — rotas do bundle (não confirmadas): `/earnings`, `/all-content`, `/holding-pen`, `/image-library`, `/programming/*`, `/news-enrichments/*`, `/notification/*`, `/stories`, `/videos`, `/team-content`, `/no-team-access`.

## Modelo RBAC completo (37 scopes extraídos do bundle)
`create|read|update|delete` × `content·team·user·property·provider·list·media·holdingpen` + `manage:authors` · `publish:content` · `read:{reports,settings,topics,notification}` · `write:{notification,topics}` · `update:settings`.
→ **privesc alvo:** virar de `read:*` (viewer) p/ `create/update/delete/publish` de outro time; `manage:authors`/`delete:user` = topo.

## Estado do tenant (a costura #1, B3)
`activeTeam` vem do **`useAuth()` hook → localStorage** (`getActiveTeamLS`/`setActiveTeamLS`), campos `activeTeam`/`activeTeamPropertyIds`/`activeTeamProviderIds`/`activeTeamResources`. **Ainda não capturei o NOME do header/param** que carrega isso pro backend (minificado; precisa do request real no DevTools OU do token pra observar o XHR). Hipótese: query param `?team=`/`?providerId=` ou header custom; o backend `/assignments/me/*` resolve "me" pelo JWT mas o **filtro de time provável vem do cliente**.

## 🎯 Plano de ataque PRONTO (dispara no segundo que o token chegar)
1. **CHAIN-E (BOLA tenant, B3):** GET `/assignments/me/resources` + `/assignments/me/team/{X}` variando team-id/`activeTeam`; comparar recursos do meu time vs time alheio. Ferramenta: `tools/yahoo_auth_probe.py <tokenfile> <url>`.
2. **CHAIN-G (content-service direto, B4):** GET `/content_item/{id}`, `/property/{id}`, `/author/{id}` com id de outro time — o AWS API GW valida token mas checa posse? (P#3).
3. **CHAIN-F (aud carryover, B5):** replay do MESMO Bearer nos 3 serviços (cm-auth/content/feed) — `aud` estrito? `/validate-token` diz o que o token carrega.
4. **Privesc (RBAC):** `/users/list` (lista usuários de outros times?), `/roles/list`, `/admin/user/{id}`, `/teams/me` vs `/teams/{outro}`.
5. **B6 (cross-env):** o token prod funciona em `cm-auth-service.staging`? (mesma auth, testável com token).
6. **`/ncc/publish`** (content-service): publicar conteúdo — testar se aceita property/team alheio (lógica de publicação cross-tenant).

## Negativos autônomos confirmados (não gastar tempo de novo)
Source maps não enviados (404) · sem proxy Next.js pro interno (só `/api/log`) · direct-origin ELB → 403 (mTLS) · staging sem fraqueza unauth · OAuth redirect_uri estrito.

## Fechamento de gaps unauth (2026-09-07, pós-revisão "não deixar nada pra trás")
- **C-03 / Y16 replay = [NEGATIVO]:** forjar `x-amzn-mtls-clientcert-subject` (identidade Athenz `ycpi.egress.ycpi-remap`), `x-forwarded-client-cert` (SPIFFE), `x-user-id`/`x-yahoo-guid`/`x-authenticated-user`, `x-forwarded-user`, `Athenz-Role-Auth`/`x-athenz-principal` → `cm-auth-service` e `content-service` devolvem **403 idêntico**. Os serviços ignoram/strippam identidade client-supplied. A hipótese "backend confia no header sem re-checar mTLS" **cai** nesses 2 edges.
- **WCP = [NEGATIVO]:** 7 headers unkeyed (X-Forwarded-Host/Scheme/Server/Port, X-Host, X-Original-URL, X-Rewrite-URL) c/ cache-buster em `cm-ui/your-content` (dinâmico, `age=0`, sem cache) e `s.yimg` (404) → **sem reflexão**. Já era negativo no finance/mail (Nível 2); confirmado no CMS.

## Itens DEFERIDOS (não fechados — motivo explícito, retomar depois)
- **OAuth `activity=` outros valores** (além de `creator-onboarding`) → login/`api.login` deu **429** nesta sessão; retomar com volume mínimo/mais tarde. Baixa prio.
- **CHAIN-C dirty-dancing** (CSP da página de ERRO do login, não a de sucesso) → mesmo bloqueio de 429; precisa do fluxo OAuth real. `[UNTESTED — hipótese enfraquecida]` mantido.
- **Fantasy Wallet / Mail / Calendar (CalDAV 401) IDOR** → precisam conta+fluxo autenticado (leads antigos da ficha, fora do foco CMS desta sessão).

## Refinamento do plano de ataque (dojo 2026-09-07 — sinais novos)
- **CHAIN-F ⇒ `S-JWT-01`:** ao ter o token — decodar header/payload (aud/iss/scope/**team**?/exp); replay do MESMO Bearer em cm-auth/content/feed (aud confusion); `alg:none` + RS256→HS256 no cm-auth-service; `/validate-token` = oráculo do conteúdo do token. **Se `team` NÃO for claim** → confirma S-BOLA-TENANT-CLIENT-01 (CHAIN-E).
- **CHAIN-G ⇒ `S-APIGW-01`:** content-service (AWS API GW) — testar method-mismatch (rota GET-auth via POST/OPTIONS), path-variant (slash/case), e se checa posse vs só token; caçar o `*.execute-api.<region>.amazonaws.com` cru (bypass WAF/custom-domain).
- **CHAIN-E ⇒ `S-BOLA-TENANT-CLIENT-01`:** o `activeTeam` (localStorage) é o caso-escola — trocar pro time alheio e ver `/assignments/me/team/{Y}` retornar dado do Y.
- **Next.js (`S-NEXT-01`) — vivo restante:** `_next/image` SSRF = **NEGATIVO** (allowlist estrita); middleware-bypass = NEGATIVO (auth no edge). **Sobra: Server Actions** (`Next-Action: <id>` POST) — untested, precisa conta + cuidado (mutação).
