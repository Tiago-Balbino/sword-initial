# Alvo: NBA (nba-public) — Prioridade ALTA

- **Programa:** NBA Public Bug Bounty · HackerOne (público) · lançado Jul/2024 · Safe Harbor
- **Escopo:** closed scope, ~452 assets (`scope/in-scope.txt` = amostra de 27; completar com Download CSV). www.nba.com principal.
- **Reward:** Medium $300–500 · High $1.5k–3k · Critical $3k–6k. Total pago $46.450; top realizado ~$4.5k.
- **Link:** https://hackerone.com/nba-public · scope: https://hackerone.com/nba-public/policy_scopes
- ⚠️ Existe também `nba-vdp` (VDP, sem grana) — **confirmar que o ativo está no `nba-public`** antes de reportar.

## ⛓️ Constraints pré-fixadas (SEMPRE aplicar)
1. **`--rate 3`** (máx 3 req/s por host — acima = DoS).
2. **Manual-only** — scanner automatizado/aggressive scan/brute-force/password spraying = OOS. (IA-assistida OK.)
3. **Closed scope** — só ativos de policy_scopes. Enum passiva pega tudo; **probe ativo só no in-scope**.
4. PoC obrigatória; sem disclosure sem aprovação; apagar dados coletados após report.

## 🚫 Fora de escopo
DoS, Cache Poisoning, Request Smuggling, Client-Side Desync, ESI, status pages, SSL/TLS best-practice, scanner automatizado, eng. social, verbose error sem exploit, self-exploit, brute-force, banner grabbing, SPF/DMARC, credenciais NBA ID de fan. Core Ineligible (H1): clickjacking/CSRF não-sensível, CORS sem impacto, disclosure de versão/erro, CSV injection, open redirect (só com chain), SSL/cookie/CSP/DMARC, maioria de rate-limit, self-XSS, tabnabbing.

---

## Recon — `protocolo ladrão de bancos` (2026-09-02)
`recon.py nba.com --rate 3` (passivo) + httpx probe `--rate 3` **só nos in-scope-pattern** + fetches manuais. Cru em `recon/` (`subdomains.txt`, `probe.jsonl`, `probe-targets.txt`, `teamone/`).
- subfinder **1522** + crt.sh **669** → **449 resolvem DNS**. Probe de 111 hosts in-scope-pattern → **92 vivos**.
- **Sem nuclei, sem katana** (manual-only). `gau` travou (retentar isolado).
- Stack geral: **Akamai (+ Bot Manager) → Envoy** na frente de quase tudo. CMS = **WordPress/PHP**. Times G-League/WNBA = **Next.js** (app único multi-tenant por host).

### 🎯 Leads priorizados

#### ⭐ L1 — TeamOne / `bbops-memos.nba.com` → `apis.nba.com/v1/teamone` (basketball ops)
App **interno** de memos de operações de basquete (trades/scouting/disciplina). SPA React **pública**; `/config.json` **público** em PROD/DEV/QA vaza tudo:
- `TEAMONE_API_URL: https://apis.nba.com/v1/teamone` (dev: `apis-dev`, qa: `apis-test`) · `TEAMONE_API_PROXY_URL: https://apis.nba.com`
- Azure AD: `TENANT_ID e898ff4a-4b69-45ee-a3ae-1cd6f239feb2` · `CLIENT_ID` por env (PROD `184b2132-fa57-418d-ae70-db4be50e5366`) · `AD_SCOPES api://671ab01d-c0dd-40fa-9aa2-fc7382c4a444/data.read` · **`AD_LOGIN_APP_REDIRECT_URL = login.microsoftonline.com/common/oauth2/nativeclient`** (endpoint **`/common/` = multi-tenant** + nativeclient).
- Apps internos vazados junto: `isac.nba.com` (+dev/qa), `nbateamtech.nba.com` (+dev/qa).
- **~46 endpoints mapeados do JS** (`/v1/teamone/api/*`): `createOrUpdateUser` `deleteUser` `readUser` `lookupUser` `approveUsersAndContacts` · `readContent` `createContent` `deleteContent` `updateContent` `createContentReview` `authorizedForContentReview` `authorizedToViewAllSubmittedForm` · `createDistributionList` `resendEmailToDistributionList` · `formSubmission` `readAllSubmittedFormData` · `sendImmediateEventNotification` · `summarize` (LLM?) · `myProfile` `readUserNotifications` …
- **Vetores:**
  1. **`/common/` multi-tenant + `CLIENT_ID` público** → qualquer conta Azure AD / Microsoft pessoal completa o OAuth e pega token pra `api://671ab01d…/data.read`. Se o backend **não valida o `tid`/`iss`** do token → **acesso não-autorizado aos memos internos** (Critical-shape). **P5/P1.**
  2. **`authorizedForContentReview` / `authorizedToViewAllSubmittedForm` como endpoints separados** → authz provável client-side; chamar o `readContent`/`readAllSubmittedFormData` real direto = **BAC**. **P1.**
  3. **IDOR** em `readContent`/`readUser`/`readDiscussionThreadsByContentId` por id de conteúdo/usuário. **P3.**
  4. `apis-dev`/`apis-test` (DEV/QA) — mesma API, authz mais fraca? token de prod aceito? **reuso de env.**
  5. `summarize` → prompt injection / abuso de custo.
- **Bloqueio:** precisa de token Azure AD (tentar via conta Microsoft pessoal no fluxo `/common/` — **teste-chave**).

#### L1 — RESULTADO (`modo hunter` + `seguir o rastro`, 2026-09-03)
- ❌ **Multi-tenant `/common/` = FP.** O MSAL do TeamOne usa `authEndpoint = login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize` — **endpoint do tenant NBA, não `/common/`**. Sem vetor cross-tenant.
- ❌ **"Auth bypass em `deleteUser`/`readUser`/`lookupUser`" = FP.** O `500 "X property required"` só acontece em POST vazio sem query (quirk de fault-handling do Apigee); **401 em qualquer request real** (GET+query ou POST+query). Não dá acesso a dado.
- ✅ **`[ACHADO — P4/P3]` `readTaxonomy` sem autenticação.** `GET`/`POST apis.nba.com/v1/teamone/api/readTaxonomy` **e** `/v1/isac/api/readTaxonomy` → **200 com dados** sem token. Vaza: inventário de ferramentas internas (League Ops, Team Tech, ISAC, **Locker Vision Acquisition**, **Ankle Support Data Collection**, NBA/WNBA Broadcasting Manuals), hosts internos (`leagueops.nba.com` — não resolve publicamente, `bbops-memos`, `nbateamtech`, `isac`), modelo de workflow de conteúdo (DRAFTED/REVIEWED/PUBLISHED, PUBLIC/PRIVATE), mapa de IDs de time. Endpoint deveria exigir auth (os "irmãos" `myProfile`/`readUser` dão 401). **Sistêmico** (2+ produtos do gateway).
- 🟡 **`[INCONCLUSIVO]` `readContent` sem auth** — `GET .../v1/teamone/api/readContent?appId=LEAGUE_OPS&type=MEMOS` → **200 (não 401)**, alcança execução, mas retorna `[]` pra todo param testado (MEMOS/NEWS/DIRECTORY/FORM/EVENT × status/isPublic/visibilityType). Provável scoping por identidade → sem sessão, sem resultado. **P1 se params craftados extraírem conteúdo — a NBA verifica internamente, ou follow-up cuidadoso.**
- 🟢 **`[P5/Info]` `apis.nba.com/v1/lockervision/*`** → `201 {"message":"Yay!! Backend Call Success"}` em qualquer path = **proxy Apigee mock/inacabado exposto**.
- 🟢 **`[Info]`** faults do gateway vazam o env interno **`secure-nba`**.
- **Report:** `readTaxonomy` unauth (P4/P3) + `lockervision` mock (P5) + `secure-nba` (Info). ⚠️ confirmar `apis.nba.com` no CSV in-scope (âncora: `wnbabroadcastmanuals.nba.com` in-scope é app TeamOne).

#### ⭐ L2 — G-League: app Next.js único, multi-tenant por host
`{austin,windycity,capitalcity,cleveland,cpskyhawks,grandrapids,greensboro,stockton,texas,coachellavalley,…}.gleague.nba.com` → **chunks `_next/static` byte-idênticos** entre todos = **um app só**. `buildId: yMjcRA_h0yAa7Vurx4rdf`. `__NEXT_DATA__` embute lista de `teamId` (`104`, e `1612709889`–`1612709925` = IDs do NBA Stats).
- **Vetores:** IDOR via `teamId` nas chamadas de API do app (ler dado/rascunho de outro time); `_next/data/{buildId}/{slug}.json` cross-team; rota admin/draft do template sem authz → **replica em todos os ~15 times + `-dev`/`-qa`**. **P3/P7.**
- `*.gleague-dev.nba.com` → `400 "Invalid URL" AkamaiGHost` (Akamai responde mas exige Host certo) → **vhost confusion**: mandar `Host: austin.gleague.nba.com` pro IP do `-dev`, ou dev servindo prod / com menos auth.
- Outliers de drift: `courtside.gleague.nba.com` = **Firebase** ("Site Not Found" → checar `/__/firebase/init.json`, Firestore/RTDB aberto).

#### L3 — `cms-dev.nba.com` / `cms-qa.nba.com` — WordPress non-prod exposto
`/` 200 · `/wp-login.php` **200** (dev e qa) · `/xmlrpc.php` 403 · `/wp-json` 404 (REST off) · `/wp-content/plugins/` 200 (len 0) · `/feed/` 200 · `/readme.html` 403.
- Manual: enum de plugin/tema/versão (`/wp-content/.../readme.txt`, `?ver=`), `?author=N` / `/feed/` p/ enum de autor, `/wp-admin`, reset de senha, `wp-cron`. Non-prod = menos hardening. **P7.**

#### L4 — Identidade / SSO
`identity.nba.com` + `identity-{dev,qa,uat}` + `identity-server-{dev,qa,uat}` + **`identity-server-ping-{dev,qa,uat}`** (PingFederate) → 404 no root (precisa de path: `/.well-known/openid-configuration`, `/idp/`, `/as/authorization.oauth2`). `auth-identity-{dev,qa,uat}` → 301/302. `login-uat.nba.com` 301. + Azure AD (TeamOne).
- **Vetores:** SSO cross-property (login NBA válido em wnba/gleague), `redirect_uri` allowlist em OIDC, PingFederate CVEs, ambientes non-prod de identidade.
- **🆕 [dojo 09/06] non-happy-path code leak (`S-OAUTH-LEAK-01`):** forçar erro no `/authorize` do PingFederate/`identity.nba.com` e ver se `code`/`token` sobrevive na URL da error page + se ela carrega script terceiro / tem `postMessage` sem origin-check. Chain com o `S-CSP-01` (sem CSP nas properties) = sem backstop. Probe 🟢 (forçar erro + inspecionar página, browser real, `--rate 3`) → 🔴 montar gadget de exfil.

#### L5 — APIs & tooling
- `api.nba.com` → **401** (auth-gated). `apis.nba.com` / `apis-dev` / `apis-test` → 404 root (path-routed; base do TeamOne).
- `api-hub.nba.com` / `-uat` → **461** "Content Unavailable" (Envoy+HTTP/3, código custom). `content-api-prod` / `content-api-nextgen-prod` → **418** (Varnish; teapot = negado). `core-api.nba.com` → 403.
- **`gql-federation-tool-dev.nba.com`** → 403 "Azure Static Web Apps" — **gateway GraphQL federation**; se acessível (IP allowlist?) → introspection + BOLA cross-serviço.
- `botapi.nba.com` → 502 Azure Front Door (quebrado/misconfig).

#### L6 — Storage / legado
- `bracketchallenge.nba.com` (+dev/qa) e `picks-dev.nba.com` → **S3/CloudFront** (não Akamai). `picks-dev` → 403 do `AmazonS3` → bucket listing / object enum.
- **`shock.wnba.com`** → 301 → `wings.wnba.com`, servido por **Apache/2.4.37 (RHEL) direto em EC2 `54.84.45.2`** — **sem Akamai/WAF/Bot Manager**. Origin legado (Tulsa Shock, time extinto) → vulns antigas, possível origin de outros sites WNBA.
- `bbops-memos` HTML tem snippet `document.domain='…'` → **same-origin relaxado entre subdomínios nba.com** (amplia qualquer XSS).

---

## Hipóteses [UNTESTED] — atualizadas
1. **[L1] TeamOne `/common/` multi-tenant** → token de conta Microsoft externa aceito pela API de memos internos. ← **começar por aqui**
2. **[L1] TeamOne authz client-side** (`authorizedFor*` como endpoint) → chamar `readContent`/`readAllSubmittedFormData` direto = BAC.
3. **[L2] IDOR de `teamId`** no app G-League → replica nos ~15 times + non-prod.
4. **[L4] SSO cross-property** — conta de um valendo no outro; `redirect_uri` OIDC.
5. **[L2] vhost confusion** `*.gleague-dev` (Akamai "Invalid URL") + reuso de sessão prod↔dev/qa.
6. **[L3] WordPress non-prod** — plugin/versão vuln, enum de autor, reset.
7. **[L5] GraphQL federation** (`gql-federation-tool-dev`) — introspection se acessível.
8. **[L6] `shock.wnba.com`** direct-origin Apache antigo (sem WAF).
9. **[L4/L1 · dirty dancing — dojo 09/06] leak de `code` no non-happy-path do SSO web.** `S-OAUTH-LEAK-01`: quebrar a dança OAuth (state inválido, `redirect_uri` malformado, `response_type=code,id_token` → move pro fragment) faz o `code` parar numa **error page** que não limpa a URL. **Amplificado pelo achado próprio:** as properties NBA **não têm CSP** e a do TeamOne tem `unsafe-inline`/`unsafe-eval` → error page carrega 3rd-party JS sem backstop = gadget de exfil viável. **Vale mesmo se a allowlist for estrita.** Alvos **web** (≠ custom-scheme do TeamOne): `identity.nba.com`, PingFederate (`identity-server-ping-{dev,qa,uat}`), `auth-identity-*` (301/302), `login-uat.nba.com`. **🚧 [NÃO TESTADO — bloqueado 09/07: escopo não-confirmado + superfície morta 404/301; ver log].**

**Foco inicial:** L1 (TeamOne — tentar o fluxo OAuth `/common/` com conta Microsoft pessoal) e L2 (IDOR do template G-League). `--rate 3`, manual.

---

## 🧠 Motor de hipóteses — `code 6` (2026-09-04)
Corpus varrido: `recon/teamone/{config.json,app.js}`, `recon/gleague/*`, `probe.jsonl`, `subdomains.txt`, ficha. Casado contra `memory/signals.md`. Ranking por `impacto × plausibilidade × probe barato` (🟢 dá pra testar na `postura escudo`).

**Sinais que acenderam (Pass 1):** `S-OAUTH-01` (Azure AD + PingFederate) · `S-REDIR-01` (`redirect_uri`, `teamone://oauth/`) · `S-IDOR-01/02` (`teamId`×35, `userId`×21, `contentId`×8) · `S-MT-01` (G-League 1-app-N-hosts) · `S-BAC-01` (Apigee policy por-rota/verbo — o ACHADO) · `S-INFO-01` (config.json público) · `S-HDR-01` (Envoy/Apigee no edge) · `S-TAKEOVER-01` (Firebase courtside — já FP) · `S-BEACON-01` (`/v2/track` = App Insights, fraco).

**Hipóteses rankeadas (chains do Pass 2 no topo):**
1. **[INCONCLUSIVO — FORTE · `C-04` = S-REDIR-01 + S-OAUTH-01] `redirect_uri` allowlist do client público Azure AD.** O TeamOne é **client público** (`CLIENT_ID 184b2132…`, sem secret) com **redirect de custom-scheme `teamone://oauth/`**. Se a app registration aceita `redirect_uri` frouxo → roubo de `code` → token pra `api://671ab01d…/data.read` = **ATO dos memos internos (Critical-shape)**.
   - **TESTADO na `postura escudo` (2026-09-04, probe unauth no `/authorize` do tenant — bate no Microsoft, não na NBA):**

     | `redirect_uri` | `sErrorCode` | leitura |
     |---|---|---|
     | `teamone://oauth/` (registrada) | **50058** | sem-sessão (passou o redirect) |
     | `https://evil.example/` (atacante) | **50058** | **idêntico à baseline** |
     | `notaurl` (malformada) | **90102** `'redirect_uri' must be a valid absolute URI` | redirect É parseado |
     | client_id `000…0` (control) | 700038 | client_id É avaliado |
   - **Lógica:** o `90102` prova que o redirect é validado **antes** do check de sessão (50058); logo uma URI bem-formada não-registrada deveria dar **`AADSTS50011`** (mismatch) aí — mas `evil.example` chega no `50058` igual à registrada. **Nenhum input produziu 50011.** → cheira a **allowlist frouxa**.
   - **Por que NÃO é ACHADO ainda:** não consegui *produzir* um 50011 (só o 90102 de formato). Hipótese-FP viva: o Azure pode adiar o match-de-registro pro **pós-login** neste app → o 50058 mascararia e seria FP. **Prova decisiva pendente:** completar o fluxo com **conta Microsoft** (bloqueio já anotado) e ver se o `code` é entregue em `evil.example`; OU rodar a mesma sonda contra um app Azure sabidamente estrito (control de método) e ver se ele dá 50011 onde o TeamOne dá 50058.
   - **🆕 [dojo 09/06] matriz de quirks do `redirect_uri` a rodar (`S-OAUTH-REDIR-02`):** contra `teamone://oauth/` (registrado), testar case-shift (`teamone://oauth/`↔`teamone://OAuth/`), path-append (`teamone://oauth/x`), param-injection. Expectativa baixa (Entra padrão faz **exact-match** → provável `50011`), mas é 🟢 barato e fecha a hipótese frouxa por outro ângulo. Custom-scheme já é o ponto fraco real (outro app registra o mesmo scheme). **🚧 [09/07: curl MORTO pra este teste — Entra difere veredito pro pós-JS. Só via navegador (tridente T1, precisa extensão Chrome) OU conta MS real].**
   - **Escopo:** o teste não tocou infra NBA. Pra reportar, confirmar que a app registration NBA (tenant `e898ff4a…`, âncora in-scope `wnbabroadcastmanuals.nba.com`) está no CSV. ← **segue como top lead.**
2. **[UNTESTED · `S-MT-01`] IDOR de `teamId` no app G-League (replica ~15 times + dev/qa).** `teamId` aparece 35× no `__NEXT_DATA__`; app único por host. Probe: 🟢 `_next/data/{buildId}/{slug}.json` cross-team (fetch estático, baixo ruído) → 🔴 chamadas de API com `teamId` de outro time. FP: API valida dono server-side.
3. **[UNTESTED · `C-02` = S-INFO-01 + S-IDOR-01] oráculo de `contentId` → conteúdo de memo.** O `updateContentReadCount` já é **oráculo de content-ID** (500 "Content not found" vs 200); o config.json vazou a estrutura. Chain: enumerar `contentId` válido via oráculo → `readContent` com params craftados. **Escala o ACHADO e a hipótese `[INCONCLUSIVO]` do `readContent`.** Probe: 🟢 GET craftado (já alcança execução, retorna `[]`).
4. **[RESOLVIDO · captura de headers na `postura escudo`, 2026-09-04] — CSP/cache lidos em 4 hosts in-scope:**
   - `www.nba.com`, `windycity.gleague.nba.com`, `wings.wnba.com` → **SEM CSP nenhuma** (só `x-frame-options` + HSTS). `wnbabroadcastmanuals.nba.com` (TeamOne) → tem CSP mas **fraca**: `script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google.com *.googleapis.com …`.
   - **`S-CSP-01` veredito:** **não** há `*.nba.com` largo → **chain `C-05` NÃO acende.** MAS a CSP não protege: sem CSP nas properties principais + `unsafe-inline`/`unsafe-eval` no TeamOne → **qualquer XSS achado aqui é praticamente irrestrito** (a CSP não é backstop). Reclassifica: não é amplificador de chain, é **ausência de defesa** — sobe o valor de qualquer reflexão/DOM-XSS que aparecer.
   - **`S-WCD-01` veredito:** todos os roots = `cache-control: no-cache, no-store` + `x-cache-ability: uncacheable` → **WCD negativo no nível de página.** Só sobraria testar endpoint de API cacheável (em `apis.nba.com`, escopo dúbio) → `[REQUER confirmação de escopo]`.
   - **🆕 Superfície nova (do `frame-src` do TeamOne):** `frame-src *.njvdwebfarm1.nba-hq.com` → **`nba-hq.com` é um apex NOVO** que não estava no enum de subdomínios. Recon passivo de `nba-hq.com` (in-scope? nova superfície de ataque?) = próximo 🟢. → **lead L7 abaixo.**
   - **🆕 `S-CORS-01` → `seguir o rastro` (2026-09-04, `postura escudo`):** testado com `Origin` forjado.
     - `windycity.gleague.nba.com` → **reflete QUALQUER Origin** (`ACAO: https://evil.example`) mas **`ACAC: false`**.
     - `wings.wnba.com` → reflete só família `nba/wnba.com` (não `evil.example`), `ACAC: false`.
     - **Veredito `[PÚBLICO POR DESIGN / Low — provável OOS]`:** reflexão arbitrária **sem credencial** num app estático público = atacante lê conteúdo já público → **sem impacto**. NBA marca CORS-sem-impacto como Core Ineligible.
     - **Ramificação viva (🔴 vitrine `[REQUER AUTORIZAÇÃO]`):** achar endpoint que use **cookie/credencial** E reflita `Origin` arbitrário com `ACAC:true` → aí vira exfil cross-origin. Candidato: subpaths de API em `apis.nba.com` (escopo dúbio). **Rastro fechado no silencioso.**

#### 🆕 L7 — `nba-hq.com` (apex novo, do CSP `frame-src` do TeamOne)
Apareceu em `frame-src *.njvdwebfarm1.nba-hq.com` da CSP do `wnbabroadcastmanuals`. Domínio **não visto** no recon anterior. "webfarm" no nome cheira a infra legada.
- **`seguir o rastro` (2026-09-04, `postura escudo`) — RASTRO FECHADO:** apex real (NS Akamai `akam.net`) e wildcard cert `*.nba-hq.com`, **mas nenhuma superfície viva alcançável em silêncio**: `nba-hq.com`/`www.nba-hq.com` não respondem HTTP nem TLS; crt.sh só expõe o wildcard (esconde os subs); `njvdwebfarm1` + 11 palpites DNS → **nada resolve**. → **`[INCONCLUSIVO — dormant]`**. Ramificações vivas (🔴 vitrine): brute-DNS de `*.nba-hq.com` (ativo/ruidoso) **ou** obter o CSV de escopo e ver se `nba-hq.com` está listado. Sem isso, trilha estéril.
5. **[UNTESTED · `S-HDR-01`] forjar header de identidade no edge Envoy/Apigee.** O gateway faz policy por-(rota,verbo) (provado pelo `readTaxonomy`/`markContentRead`). Pergunta: strippa `x-user-id`/identidade client-supplied? Se não → transforma a escrita unauth num BAC autenticado. **É o degrau de escalada do ACHADO** (ver `escada de jacó`). Probe: 🔴 enviar header forjado e ver mudança de comportamento.

**Rebaixados:** `S-BEACON-01` (`/v2/track` é App Insights/Azure Monitor → telemetria, sem dashboard alcançável = Low) · `S-CSPT-01` (os `fetch()` do `app.js` são runtime do Next.js/prefetch, não concatenação de param do app → sem CSPT óbvio; reler manual se sobrar tempo).

**Próximo passo sugerido:** lead #1 (`redirect_uri` do client público — 🟢, alto impacto, sob-testado) e #4 (capturar headers — 🟢, destrava 2 chains). Ambos testáveis na `postura escudo`.

## Achados
| Data | Severidade | Tipo | Endpoint | Status |
|------|-----------|------|----------|--------|
| 2026-09-03 | Info (não bounty) | Dangling DNS / Firebase "Site Not Found" | `courtside.gleague.nba.com` | **`FALSO POSITIVO`** (contra-prova) — Firebase exige TXT em `nba.com` p/ takeover = não explorável (`can-i-take-over-xyz` #128). Report `report-courtside-subdomain-takeover.*` = **NÃO SUBMETER**. |
| 2026-09-03 | — | Broken auth / info disclosure | `apis.nba.com/v1/{teamone,isac}/api/readTaxonomy` | **`PADRÃO DA APLICAÇÃO`** (contra-prova 09/03) — 200 sem auth mas retorna só **taxonomia/enum não-sensível** (content types, status, nomes de módulo, hosts já acháveis via DNS, IDs de time públicos). Impacto demonstrável = **nulo**. NÃO reportar standalone (Informative/N-A garantido). |
| 2026-09-03 | P5/Info | Misconfig / mock proxy | `apis.nba.com/v1/lockervision/*` | `[INCONCLUSIVO]` — proxy Apigee mock ("Yay!! Backend Call Success") exposto. Misconfig real mas sem impacto. Informative-tier. |
| 2026-09-03 | **Low→Medium (P4/P3)** | **Broken Access Control — escrita não-autenticada** | `apis.nba.com/v1/teamone/api/{markContentRead,updateContentReadCount}` | **`[ACHADO]`** (contra-prova 09/03 = `ACHADO`) — `GET ...?id=<x>` sem auth → `markContentRead` retorna 200 (marca "lido", nem valida existência); `updateContentReadCount` executa bump de contador + `500 "Content not found"` = **oráculo de content-ID**. Causa-raiz: policy OAuth do Apigee por-(rota,verbo). Destrutivos (`delete*`/`create*`/`update*`/`sendNotification`) → 401 (ok). → **`protocolo report`** (aguardando OK). |
