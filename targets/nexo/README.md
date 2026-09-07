# Nexo — ficha de alvo

- **Programa:** Nexo · **Intigriti** · público/open · cripto-lending / fintech · Safe Harbour aplicado
- **Link:** intigriti.com (Nexo public program) · plataforma: https://platform.nexo.com · site: https://nexo.com
- **Prioridade:** 🟢 **ALTA ⭐** (#5 no portfólio) — endpoints de API de dinheiro explicitamente in-scope + baixa saturação + self-serve. Único eixo fraco: reward modesto.
- **Data de abertura:** 2026-09-05
- **Reward table:** Tier 1 — Low $150 · Med $600 · High $1.800 · **Crit $3.000 · Except. $4.800**. Tier 2 — Low $125 · Med $500 · High $1.500 · Crit $2.500 · Except. $4.000. (+$25 se validar fora do SLA; +$50 verificar fix.)

## ⛓️ Constraints pré-fixadas (checar ANTES de tocar)
- **Header obrigatório:** `X-Intigriti-Username: {Username}` em todo tráfego.
- **Automated tooling: MÁX 5 requests/seg.** (respeitar em qualquer probe.)
- **ID check obrigatório** no programa.
- **Conta:** self-register na plataforma com e-mail **`@intigriti.me`** (2 contas p/ IDOR cross-account). Se país bloqueado → VPN pra registrar.
- **⚠️ PRODUÇÃO com dinheiro real** — sem "test money". **NUNCA** tocar conta/fundo de terceiro; race/tampering só na **própria** conta, valores mínimos, pare-e-confirme antes de saque/ação irreversível.
- **User-agent:** N/A. Não brute-force de rate-limit (OOS).

## 🎯 Escopo autorizado (ESTREITO — host-específico, NÃO wildcard)
- **Tier 1 (16 endpoints de API de dinheiro em `platform.nexo.com`):**
  `/api/1/create_recurring_payment` · `/api/1/exchange_order` · `/api/1/exchange_request_quote` · `/api/1/get_pay_to_card_fee` · `/api/1/request_bwc_quote` · `/api/1/request_capture_payment` · `/api/1/request_crypto_withdrawal` · `/api/1/request_pay_to_card` · `/api/1/term/deposits/user/create` · `/api/platform/exchange/v1/booster/quotes` · `/api/platform/exchange/v2/booster/orders` · `/api/platform/exchange/v2/exchange/orders` · `/api/trading/advanced/facade/api/v1/deposit` · `/api/trading/advanced/facade/api/v1/fees` · `/api/trading/advanced/facade/api/v1/order/futures` · `/api/trading/advanced/facade/api/v1/withdraw`
- **Tier 2 (hosts inteiros):** `https://nexo.com/` · `https://platform.nexo.com/`

## 🚫 Fora de escopo (não tocar)
- **`*.nexo.com` em geral NÃO é escopo** — só os 2 hosts acima. → **não fazer subdomain fan-out/probe** em subs não listados.
- Todos os apps mobile da Nexo · todas as integrações 3rd-party · o chat de help/suporte.
- OOS de classe: pre-auth ATO/OAuth squatting · self-XSS · CORS em endpoint não-sensível · missing headers/cookie flags · CSRF sem impacto · rate-limit (bypass ou ausência) · session-not-invalidated · email spoofing/SPF/DMARC · clickjacking sem impacto · blind SSRF sem impacto de negócio · host-header sem impacto · subdomain takeover sem tomar o sub · arbitrary upload sem prova · homograph · banner/version.
- Infra: AWS-based.

## O que sabemos
- **Stack:** AWS. Plataforma web `platform.nexo.com` (API REST `/api/...` versionada v1/v2). Site institucional `nexo.com`.
- **Autenticação:** self-register `@intigriti.me`; sessão autenticada opera a API de dinheiro.
- **Superfície interessante:** API de movimentação (withdraw, pay-to-card, exchange, futures, deposits, recurring payment) + **função nativa "Transfer money to another user"** (FAQ do programa) = playground de IDOR/lógica.
- **Worst-case declarado pelo programa:** breach de dado confidencial · ATO de conta · **transações fraudulentas**.

## Hipóteses (rodar contra o The Mind) — do `modo dojo` 2026-09-05, atualizadas 2026-09-06
- **H1 [UNTESTED — bloqueado] — `S-RACE-01` (P4, race/limit-overrun):** os endpoints de débito (`request_crypto_withdrawal`, `request_pay_to_card`, `exchange_order`, `booster/orders`, `trading/advanced/.../withdraw`, `term/deposits/user/create`) checam saldo/limite e **depois** debitam. N requests single-packet paralelas passam todas no check antes do commit → **double-spend / saldo negativo / resgate múltiplo**. Baseline serial primeiro. Só na própria conta, valor mínimo, pare-e-confirme. **Bloqueio:** as 2 contas de teste não passaram do journey "identity" → endpoints de dinheiro ainda não alcançados.
- **H2 [UNTESTED — bloqueado] — `S-FUND-01` (P1+P2, IDOR de fundo):** a função Transfer entre users e/ou os endpoints com `from_account`/`recipient_id`/`amount` confiam no id do request. Token da conta A + id/origem da conta B → **mover/ler fundo alheio**. Escala read→write: `GET` no objeto vizinho vaza saldo (200 c/ dado, não 403) → `POST` transfer executa. Testar com 2 contas **próprias**. **Bloqueio:** todo endpoint mapeado até agora é self-derived (`current`/`/my/`); `transactions/{id}` tem id opaco. Falta achar o endpoint que aceita id explícito de outro user (ex.: telas de Transfer, quando destravadas).
- **H3 [UNTESTED — bloqueado] — `C-08` (chain):** H2 (mirar/ler a conta) + H1 (duplicar o débito) = **transação fraudulenta** (worst-case), mesmo se cada elo isolado for Medium. Depende de H1+H2.
- **H4 [UNTESTED — bloqueado] — param/type tampering:** `amount` negativo/decimal, currency confusion no `exchange_order`/quote, precisão/rounding em `booster/quotes`→`orders`, step-skip quote→execute (`exchange_request_quote`→`exchange_order`). Params prováveis (por analogia c/ Nexo Pro API): `pair`, `quantity`, `side`, `amount`, `trigger_price`, `stop_loss_price`, `take_profit_price` nos `trading/advanced/facade/order/futures`. Fit `protocolo One Piece` nível 1. Mesmo bloqueio de H1.
- **H5 [UNTESTED — não explorado] — abuso de referral/afiliado (`nexo.com/ref/{code}`):** programa de referral existe. Lógica: self-referral (indicar a própria 2ª conta), reward/bônus manipulável, race no crédito de indicação, código de outro user reaproveitado. Fit lógica de negócio. **Não depende de KYC completo** — candidato pra retomar primeiro.
- **H6 [UNTESTED — não explorado] — authz no WebSocket (`wss://platform.nexo.com`):** CSP revela WS real-time. Verificar se a subscription a canais (saldo/ordens/preço) valida dono — subscrever a stream/canal de outra conta = vazamento de dado (worst-case: breach de confidencial). Requer sessão autenticada, mas **não depende de KYC completo** — outro candidato pra retomar primeiro.
- **H7 [INCONCLUSIVO] — mass-assignment no KYC "basic" (nova, 2026-09-06):** probe disparado (campos `verificationProcess`/`status`/`kycLevel`/`tier` injetados no `POST v2/verifications/basic`) mas **o resultado do POST nunca foi confirmado** (você colou o leitor de estado, não o retorno do probe). **Achado que rebaixa a prioridade deste ângulo:** `journeys/current/summary` seguiu `422` mesmo com o "basic" 100% preenchido → o "basic" é um **questionário AML auto-declarado**, não a verificação de identidade real. O gate de dinheiro está atrás de um journey "identity" separado (documento/liveness), que essas contas não iniciaram. Retomar só se decidirmos avançar no identity, ou se quiser fechar o resultado do probe por curiosidade (baixo valor esperado).
- **Nota de assinatura (afeta H1/H4):** a API Nexo usa **HMAC-SHA256 (API-Key+Secret) + nonce/timestamp** (modelo do Pro; confirmar no `platform`). Pro H1: um **nonce por request** não impede race single-packet se o *check-de-saldo→débito* não for atômico (cada request tem nonce válido distinto e passa no check). Pro replay: se o nonce **não** for enforçado server-side (`S-NONCE-01` falsy-guard) → replay de saque.
- **Nota de capacidade (2026-09-06):** testei rodar 1 GET autenticado sozinho via `curl` com cookies colados por você (`nsi`+`nx_token` frescos) — **passou sem bloqueio de challenge** (422 esperado, não um desafio Cloudflare). Ou seja, leituras autenticadas simples **podem** ser meu trabalho direto se você me passar cookies frescos (JWT expira ~1h); escrita/ações sensíveis continuam exigindo seu aval explícito antes de eu disparar.

## Recon
- **⚠️ Escopo estreito:** recon massivo de subdomínios **não se aplica** (só 2 hosts in-scope). Recon útil aqui = **mapear a superfície de API dos 2 hosts** (endpoints/params via JS/source-maps de `platform.nexo.com`, histórico wayback/gau **desses hosts**) + OSINT público da org (crt.sh p/ entender infra, GitHub secret search).
- Ver `recon/` (fase passiva abaixo).

## Achados
| Data | Severidade | Tipo | Endpoint | Status (rascunho/enviado/aceito) |
|------|-----------|------|----------|----------------------------------|
|      |           |      |          |                                  |

## Notas
- Próximo passo natural: **`protocolo One Piece`** (1 conta) nos endpoints de débito p/ H1/H4, depois 2ª conta p/ H2/H3. `modo hunter` conduz.

---

## 🏦 Recon COMPLETO — `protocolo ladrão de bancos` (2026-09-05)
Passivo (CT/Wayback/urlscan/OSINT — zero toque) **+** ativo não-autenticado nos 2 hosts in-scope (httpx/curl/katana, **≤5 req/s, header `X-Intigriti-Username: moldret`**). Cru em `recon/` (`probe.jsonl`, `cors_headers.txt`, `crt_nexo.txt`, `urlscan_inscope_paths.txt`, `_osint_summary.txt`, `nexo_home.html`).

**Fingerprint (httpx):**
- `nexo.com` [200] — Cloudflare + Bot Management + HSTS · **Next.js (turbopack)** · marketing.
- `platform.nexo.com` [200 httpx / **403 `cf-mitigated: challenge`** p/ browser-UA] — Cloudflare + **CloudFront** + **Apple Sign-in** + Google Sign-in + Bootstrap5 + **GeeTest** captcha + **Datadog RUM** + Segment + Salesforce.

**CORS / headers:** `nexo.com` **não reflete** Origin malicioso (sem `ACAO` em nenhum host = sem CORS bug trivial). CSP **report-only** no marketing (não enforça); enforce real no `platform` (challenge). HSTS preload, `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy` restritiva.

**Superfície conectada (vazada pelo CSP):**
- **`wss://platform.nexo.com`** — WebSocket API real-time (→ **H6**).
- `security-logging.nexo.com` (report-uri) · `sa.nexo.com` (analytics self-host) · `content.nexo.com` (CDN de assets).
- OOS: `miaw.nexo.com` + `*.salesforce-scrt.com`/`force.com`/`my.site.com` (chat/support Salesforce) · `*.geetest.com` · `browser-intake-datadoghq.eu`.

**Rotas reais achadas (urlscan, host in-scope):**
- **`platform.nexo.com/transactions/{id}`** — id **opaco** (`nxt`+22 chars, ex. `nxt4ff55ku6xlnavthvf8bii7`). Rota de objeto de transação existe → alvo do **H2/S-FUND-01** (mas id opaco ⇒ IDOR precisa de id **vazado/referenciado**, não brute).
- **`nexo.com/ref/{code}`** — referral/afiliado (→ **H5**).
- Wayback: `/api/1/biometry_signin`, `/api/1/check_session` (auth/sessão).

**OSINT de API (docs públicas; `pro.nexo.com` é OOS, lido só como referência):** Nexo Pro API = **HMAC-SHA256 (API-Key+Secret) + nonce/timestamp**; `POST /api/v1/orders` (`pair`,`quantity`,`side`), `/orders/trigger` (`trigger_price`,`amount`), `/orders/advanced` (`stop_loss_price`,`take_profit_price`), `/futures/order`. → os in-scope `trading/advanced/facade/...` provavelmente espelham esse modelo (**informa H1/H4**).

**Higiene de marca (OOS, só registro):** urlscan lista dezenas de **domínios de phishing** imitando Nexo (`xn--nex-una.com` homográfico, `nexofinance.ar`, `nexwealthmanagement.info`, `nexo-4ke.pages.dev`...). Não é bug do programa; contexto de abuso de marca.

### 🚧 Teto do recon automatizado (o achado estrutural)
`platform.nexo.com` — o host que **importa** — **barra cliente automatizado** (Cloudflare challenge, `cf-mitigated: challenge` até com browser-UA). O recon de superfície unauth **esgotou aqui**: fingerprint, CSP, "sem CORS", rotas via arquivo público. **O mapa real dos 16 endpoints de dinheiro (params, assinatura, nonce) só sai de dentro do login.**

### ⏭️ Próxima fase — ATIVA e AUTENTICADA (precisa de você)
1. **Você registra 2 contas `@intigriti.me`** (+ ID check obrigatório) — não é automatizável. Se país bloqueado → VPN.
2. Com sessão real (seu browser autenticado, ou `claude-in-chrome` logado): capturar as requests dos 16 endpoints no DevTools/proxy → **mapear params + esquema de assinatura/nonce reais**.
3. `modo hunter` + `protocolo One Piece` (1 conta) → **H1** (race em débito: baseline serial → single-packet, valor mínimo, pare-e-confirme) + **H4** (tampering) + **H5** (referral).
4. 2ª conta → **H2/H3** (IDOR de fundo + chain `C-08`) + **H6** (authz no WS). **Só contas próprias, nunca fundo de terceiro.**

---

## 🔐 Modelo de auth/identidade — CONFIRMADO (2026-09-06, 2 contas logadas)
Capturas reais de dentro do login (DevTools) das 2 contas de teste no endpoint `GET /api/cross/account/ac/v1/journeys/current/summary`. **Tokens/cookies vivos NÃO ficam no repo** (só o modelo + os ObjectIds de teste).

- **Sessão = 2 fatores casados:** cookie **`nsi`** (session id opaco) **+** cookie **`nx_token`** (JWT **RS256**, `kid=jurisdiction-v1`, `aud=platform`, `iss=platform.nexo.com`, exp≈1h, `jti`).
- **🔑 Binding provado:** o claim **`nsi_sha` do JWT == base64url(SHA256(`nsi`))** — verificado nas 2 contas (match exato). Ou seja, **o JWT é amarrado ao cookie de sessão**: roubar só o JWT (sem o `nsi`) ou só o `nsi` (sem JWT válido) não basta. RS256 ⇒ sem forjar. → **IDOR não virá de mexer no token; tem que vir de authz por-objeto faltando** (mandar id alheio e o servidor não checar dono).
- **User id = MongoDB ObjectId**, **vazado client-side** no cookie `ajs_user_id` (Segment) **e no corpo do erro 422**. Test material:
  - **conta1** = `6a9cd3d56f30244ae8831c7b` (criada 2026-09-06 02:45:41Z)
  - **conta2** = `6a9cd30a1a17613ccb534b75` (criada 2026-09-06 02:42:18Z)
  - ObjectId = 4B timestamp + 5B random + 3B counter → timestamp previsível, random **não** brute-trivial. Contas de teste próximas no tempo (prefixo `6a9cd3`).
- **Namespace novo in-scope (Tier 2):** **`/api/cross/account/ac/v1/…`** — API "cross/account" (onboarding/KYC = "journeys"). O `journeys/current/summary` é **derivado da sessão** ("current" ⇒ sem id no path ⇒ **sem superfície de IDOR aqui**). Enumerar o namespace por endpoints que aceitem id **explícito**.
- **Estado das contas:** fresh, **sem journey/KYC completo** → `422 "No active or undismissed completed journey for user <id>"`. ⇒ **os endpoints de dinheiro (16 in-scope) provavelmente estão atrás de uma journey/KYC concluída.** Pré-KYC ainda há superfície: **o próprio fluxo de journeys/onboarding** (step-skip / state-manip = `S-IDV-01`, P4) e endpoints de conta/perfil.
- **Outros headers de request:** `correlationId` (client-gen), `X-Nexo-Installation-Id`, `Platform-Name: Web`. Resp: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 0`, `Vary: Origin,...`.
- **Nota lateral (OOS):** o client faz `POST security-logging.nexo.com/` (Express, `x-powered-by`) com `Content-Type: application/csp-report`, `Origin: null` — encaminha o corpo do erro da API. Host OOS, mas anotado (sink de log em Node).

### 🎯 Próximas capturas necessárias (você navega, cola aqui)
Prioridade — pra cada fluxo, cole a(s) request(s) do DevTools (Network). Onde houver **id explícito**, capture **das 2 contas** pra eu montar o cross-test:
1. **Dashboard/Wallet** logado → endpoint(s) que listam **saldos/carteiras** (tem `accountId`?).
2. **Transactions** → a lista e **um `/transactions/{id}`** aberto (id opaco `nxt…`? o detail checa dono? → **H2**).
3. **Iniciar Transfer entre users** (feature do FAQ) → a request de transfer: params (`from`/`recipient`/`amount`/`currency`/nonce/assinatura?) → **H2/H3**.
4. **Iniciar saque** (`request_crypto_withdrawal`) e uma **exchange/quote→order** → params + **modelo de nonce/assinatura** (→ **H1** race, **H4** tampering).
5. **Fluxo de onboarding/journey** (os passos de KYC) → pré-KYC testável agora (**step-skip / marcar journey completa** = `S-IDV-01`).

---

## 🎯 Ataque em curso — Onboarding/Journey pré-KYC (H7, escolhido 2026-09-06)
**Postura:** `protocolo One Piece` nível 1 (self-state manipulation na própria conta). Classe: `S-IDV-01` (anti-abuse de onboarding) + P4 (ordem das etapas assumida) + P2/P6. **Alvo:** namespace `/api/cross/account/ac/v1/journeys/…`.

- **H7 [UNTESTED] — bypass de KYC/journey por manipulação de estado:** a journey de onboarding é multi-etapa (start → docs → verificação 3rd-party → complete). Suposições a atacar:
  - **Q4 (ordem):** dá pra **pular pro passo final / marcar `completed`** sem passar pela verificação? (POST direto do último step.)
  - **Q2 (cliente controla):** alguma request carrega `status`/`step`/`state`/`stage`/`completed`/`approved` que o cliente seta? → PATCH pra `completed` = **KYC bypass** → destrava dinheiro.
  - **Q6 (fail-open):** se o callback do provedor de KYC (Onfido/Sumsub/etc.) faltar/for forjado, a journey **fail-open** pra aprovada?
  - **Q1 (IDOR de journey):** se a journey tem id (`journeys/{id}`), a conta A lê/avança a journey da B?
  - **Impacto se vingar:** KYC bypass num fintech regulado = alto (destrava withdraw/transfer/exchange = caminho pro worst-case "transação fraudulenta").

### Roteiro de captura (você navega logado na conta1; cola as requests do Network)
1. **Iniciar a verificação/onboarding** no app → capturar a request que **cria a journey** (método·path·**body**) + a **response** (retorna `journeyId`? `status`? lista de steps?).
2. **Avançar 1 passo** → capturar a request de **transição de step** (tem campo `status`/`step`/`stepId`/`state`?) + response.
3. Anotar os **valores de `status`** que aparecem (ex.: `IN_PROGRESS`/`PENDING`/`COMPLETED`/`APPROVED`).
4. Se aparecer **`journeyId`**, iniciar também na **conta2** e capturar → monto o cross-test de IDOR (A avança/lê a journey da B?).
5. Qualquer request pra `/api/cross/account/ac/v1/…` que apareça no caminho — cola (mapeia o namespace).
