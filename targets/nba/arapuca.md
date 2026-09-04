# arapuca.md — NBA · peças pra chain

`protocolo armar a arapuca`. Cada peça é individualmente fraca. Valor = combinação. Não apagar — `[dormant]` se envelhecer.

## Peças

| id | peça (1 linha) | acesso | sev isolada | o que HABILITA |
|----|----------------|--------|-------------|-----------------|
| **P1** | **`readTaxonomy` sem auth** — `GET/POST apis.nba.com/v1/{teamone,isac}/api/readTaxonomy` → 200 c/ dados. Vaza inventário de ferramentas internas (League Ops, Team Tech, ISAC, Locker Vision Acquisition, Ankle Support Data Collection, NBA/WNBA Broadcasting Manuals), hosts, workflow (DRAFTED/PRIVATE), IDs de time. **Sistêmico** (2+ produtos). | unauth | **P4/P3** (info disclosure) | recon interno; descoberta de `leagueops.nba.com` |
| **P2** | **`readContent` sem auth** — `GET .../v1/teamone/api/readContent?appId=LEAGUE_OPS&type=MEMOS` → **200 (não 401)**, alcança execução, retorna `[]` pra todo param testado. **Trusted-header injection (20 variantes do arsenal) → nada muda o `[]`.** `X-NBA-KEY` guessing → "Invalid ApiKey". Nenhuma chave estática no bundle. → provável guarda hard no data layer que exige principal validado. | unauth | **rebaixada** — controle furado mas **sem impacto demonstrável**; P1 só se a NBA confirmar internamente que params craftados extraem conteúdo | — (trilha esgotada) |
| **P3** | **`apis.nba.com/v1/lockervision/*`** → `201 {"message":"Yay!! Backend Call Success"}` em qualquer path = proxy Apigee **mock/inacabado** exposto. | unauth | P5 | sinal de higiene ruim do gateway |
| **P4** | Faults do gateway vazam env interno **`secure-nba`** (`"Unable to identify proxy for host: secure-nba"`). | unauth | Info | naming interno |
| **P5** | **`leagueops.nba.com`** — host interno (não resolve publicamente; `curl` → 000). Vazado no taxonomy do ISAC. | — | Info | alvo se ficar acessível (ver P10) |
| **P6** | **`bbops-memos.nba.com/config.json` público** (PROD/DEV/QA) — vaza Azure AD `TENANT_ID e898ff4a-…`, `CLIENT_ID` por env, `AD_SCOPES api://671ab01d-…/data.read`, URLs internas `isac.nba.com` / `nbateamtech.nba.com`, `AD_LOGIN_APP_REDIRECT_URL=login.microsoftonline.com/common/oauth2/nativeclient` (dev/qa). | unauth | Low | params pro ataque OIDC; mapa de apps internos |
| **P7** | `apis.nba.com` = **Apigee gateway**. Produtos: `teamone`, `isac`, `asdc` (app Vite/Express separado), `lockervision`, `filestore(streaming)`. `filestorestreaming/files/{id}` read → 401. | unauth | Info | superfície multi-produto |
| ~~**P8**~~ | ~~`courtside.gleague.nba.com` → "Site Not Found" do Firebase~~ | — | **`FALSO POSITIVO`** (contra-prova 09/03) | Firebase exige TXT em `nba.com` → **não takeover-able** (`can-i-take-over-xyz` #128). Dangling DNS = só higiene/Info. **Peça morta.** |
| **P9** | **`{austin,bakersfield,canton,grandrapids,greensboro}.dleague.nba.com`** (nome antigo "D-League") → CNAME pra AWS ELB `vpc-lb-1679823851.us-east-1.elb.amazonaws.com` que **não responde (HTTP 000)**. ELB dangling? | unauth | **P2/P3** se confirmado | takeover de 5 subs `*.dleague.nba.com` |
| **P10** | **`*.gleague-dev.nba.com` vhost confusion** — `Host: austin.gleague-dev.nba.com` → **400** (Akamai sem property); **`Host: austin.gleague.nba.com`** → **200, 129 KB conteúdo PROD** via o edge dev. | unauth | Low sozinho | bypass de WAF/bot-manager se o edge dev for mais fraco; acesso a comportamento de edge dev |
| **P11** | G-League = **1 app Next.js**, multi-tenant por hostname, `buildId yMjcRA_h0yAa7Vurx4rdf`, SSG estático. `pageProps` = só `page`/`analytics`/`messages`. | unauth | — | superfície de IDOR mínima (fechado) |
| **P12** | **`cms-dev.nba.com` / `cms-qa.nba.com`** = WordPress/PHP/MySQL, **`/wp-login.php` 200** (dev e qa), `xmlrpc.php` 403, `wp-json` 404, `/wp-content/plugins/` 200 (len 0), `/feed/` 200. | unauth | Low sozinho | enum plugin/tema/versão, `?author=N`, reset, `/wp-admin`; superfície de auth non-prod |
| **P13** | **Identity:** `identity-server-ping-{dev,qa,uat}.nba.com` = **PingFederate**; `identity.nba.com` 404 root; `auth-identity-{dev,qa,uat}` 301/302; `login-uat` 301. + Azure AD (TeamOne). | unauth | Info | SSO cross-property; `redirect_uri` OIDC; CVEs PingFederate |
| ~~**P14**~~ | ~~`gql-federation-tool-dev.nba.com` — GraphQL federation~~ | — | **MORTO (L5, 09/03)** | 403 em tudo (IP-allowlist edge Azure, sem bypass). `api.nba.com/graphql` = catch-all 401. Nenhum endpoint GraphQL alcançável em `core-api`/`content-api`/`api-hub`/`cms-api`. Sem introspection. |
| **P15** | **`picks-dev.nba.com`** → 403 do `AmazonS3`. `bracketchallenge.nba.com` (+dev/qa) em CloudFront/S3. | unauth | Info | bucket listing / object enum |
| ~~**P16**~~ | ~~`shock.wnba.com` → Apache 2.4.37 direct-origin~~ | — | **MORTO (L6, 09/03)** | Apache pelado que só faz 301 pro `http://wings.wnba.com/` (host hardcoded). Sem open redirect (`@`/`//` não quebram), sem CRLF (encodado), sem `/server-status`, sem HTTPS, sem conteúdo. Só version disclosure + HTTP-redirect = Core Ineligible. `wings.wnba.com` em si está atrás de Akamai. |
| **P17** | `bbops-memos` HTML contém snippet `document.domain='…'` → **relaxamento de same-origin entre subdomínios `*.nba.com`**. | unauth | Info | qualquer XSS num sub `.nba.com` → scriptável em `nba.com` |
| **P18** | Dois programas H1: **`nba-public`** (bounty) e **`nba-vdp`** (sem grana) — escopos podem diferir. NBA teve data breach de PII de fãs (via terceiro). | — | — | confirmar cada ativo no `nba-public` antes de reportar |
| **P20** | **`cms-dev`/`cms-qa.nba.com`** = **WordPress 6.2.11** (branch patchado) + plugin **`video-embed-thumbnail-generator` (Videopack) v4.8.11** (< 4.10.4 → **CVE-2025-7341 XSS**, Medium) + tema custom **`nba-generic` v17.11.5**. Multisite. Registro **desabilitado**. Hardening OK: author enum bloqueado, REST off, xmlrpc 403, sem dir listing, sem backup/vcs exposto. `/wp-content/backup-db/` → 500 (plugin de backup?). | unauth | Low | **se** houver PoC pro CVE-2025-7341 (vetor provavelmente admin-auth) ou vuln no tema custom `nba-generic` → XSS no CMS da NBA. Sem PoC = "known vuln version" ≈ OOS |
| **P21** | **`redirect_uri` allowlist do client público TeamOne (`CLIENT_ID 184b2132…`) possivelmente frouxa** — sonda unauth no `/authorize` Azure AD (`postura escudo`, 09/04): `https://evil.example/` bem-formada dá **`AADSTS50058`** (passou o redirect) **igual** à registrada `teamone://oauth/`; só `notaurl` malformada dá `90102`; **nenhum input produz `50011`** (mismatch). `[INCONCLUSIVO — FORTE]`. | unauth | **precondição de ATO** se confirmar | **preenche o elo faltante da C5**; code interception → token `api://671ab01d…/data.read` = memos internos |
| **P22** | **`nba-hq.com`** = apex NOVO da NBA (NS Akamai `akam.net`), vazou no `frame-src *.njvdwebfarm1.nba-hq.com` da CSP do TeamOne (`wnbabroadcastmanuals`). crt.sh só expõe `*.nba-hq.com` (wildcard). **`njvdwebfarm1.nba-hq.com` NÃO resolve** (sem A). | unauth | Info | `frame-src` apontando pra host morto (higiene); nova superfície `*.nba-hq.com` a enumerar quando ativo |

## Chains candidatas (passo de combinação)

### C1 — [REBAIXADA] Subdomain takeover → ataque de sessão em `nba.com`  =  P9 + P17 (+ cookie `.nba.com`)
~~P8 (courtside/Firebase)~~ **morto na contra-prova** (Firebase não é takeover-able). Sobra só **P9** (`*.dleague.nba.com` → ELB `vpc-lb-1679823851...` que resolve mas não responde) — e P9 era o candidato **mais fraco** (ELB que resolve provavelmente ainda existe na conta AWS = não claimable). Cookie `.nba.com` confirmado (`_abck`/`bm_sz`) mas sem takeover não há vetor.
- **Estado:** chain quase morta. Só revive se o ELB do P9 estiver comprovadamente deletado E o nome for reassignável (raro no naming atual da AWS).

### C2 — [FALSO POSITIVO] vhost confusion → bypass de WAF
Verificado 2026-09-03: `austin.gleague-dev.nba.com` + `Host: austin.gleague.nba.com` = **mesma property Akamai de prod** — headers idênticos, `<script>`/SQLi/`../`/`;cat` → 403 em ambos, bot-manager idêntico (curl/sqlmap/no-UA → 403 nos dois). Só um hostname de edge redundante. **Sem bypass, sem impacto.** P10 rebaixada a `[PADRÃO]`.
- ✅ **Sub-achado:** cookies `_abck`/`bm_sz` com `Domain=.nba.com` → **confirma escopo de cookie `.nba.com`** → reforça o elo da **C1**.

### C3 — mapa interno → alcançar apps internos  =  P1 + P6 + P5 (+ P10)
`readTaxonomy` (P1) + `config.json` (P6) montam o ecossistema League-Ops interno da NBA (`leagueops.nba.com`, `isac.nba.com`, `nbateamtech.nba.com`, tenant/client IDs). Se qualquer host interno vira acessível (VPN split, ou vhost confusion tipo P10 no domínio certo) → acesso a tooling interno.
- **Elo faltando:** um host interno acessível OU o `readContent` (P2) devolvendo dado.

### C4 — WordPress dev → RCE/pivot  =  P12 + (plugin vuln / cred fraca) + P17
`cms-dev`/`cms-qa` WordPress com `wp-login` aberto → default cred / plugin CVE → admin → upload PHP → **RCE em `cms-dev.nba.com`**. É `*.nba.com` → P17 aplica.
- **Elo faltando:** uma cred default ou CVE de plugin com PoC (brute é OOS).

### C5 — OAuth/SSO  =  P13 + P6 + **P21** (redirect_uri fraco)
Cliente OIDC da NBA (PingFederate ou Azure AD) com allowlist de `redirect_uri` frouxa → roubo de code/token. Config dev do TeamOne usa `/common/oauth2/nativeclient`.
- **Elo faltando → agora candidato P21** (`[INCONCLUSIVO — FORTE]`): o client público TeamOne aceitou `evil.example` sem `50011`. Falta só a **prova** pra virar chain viva: (a) **control de método** — sonda num app Azure sabidamente estrito; se der `50011` onde o TeamOne dá `50058`, confirma; OU (b) completar o fluxo com **conta Microsoft** e ver o `code` entregue no host do atacante. **Parqueado pra retomar** (usuário pediu 09/04).
- Se confirmar: **C5 vira a melhor chain da NBA** (P6 deu os params + P21 dá o redirect frouxo → ATO dos memos internos, Critical-shape).

**Melhor chain agora:** **C1** (takeover + escopo de cookie) — maior impacto, peças concretas. Depois **C2** (P10 já é comportamento confirmado, só falta provar o edge dev fraco).

## Reportável já (fora da arapuca)
`readTaxonomy` unauth (P1 — **P4/P3**) + `lockervision` mock (P3 — **P5**) + `secure-nba` leak (P4 — Info). ⚠️ confirmar `apis.nba.com` no CSV `nba-public` (âncora: `wnbabroadcastmanuals.nba.com` in-scope = app TeamOne).

---

# `descobrir a roda` — 2026-09-03

## Modelo do sistema (hipótese)

```
FÃS / CONSUMIDORES                          EMPREGADOS / INTERNO
   PingFederate (identity-server-ping-*)       Azure AD (tenant e898ff4a-…)
   "NBA ID"                                    scope api://671ab01d-…/data.read
        |                                             |
        v                                             v
 ============ EDGE (inconsistente) ==================================
  Akamai (+Bot Manager, cookies _abck/bm_sz Domain=.nba.com)  → maioria
  AWS CloudFront → bracketchallenge, picks-dev (S3)
  Fastly → Firebase (courtside, órfão)
  Azure Front Door → botapi(502), gql-federation-tool-dev(IP-lock)
  EC2 direto → shock.wnba.com (Apache 2.4.37, só 301)
 ===================================================================
        |
        v
  ENVOY (Server: envoy em api.nba.com, content-api-*, api-hub, apps gleague)
        |
        v
  APIGEE  (org/env interno: "secure-nba")
   produtos: teamone | isac | asdc(Vite/Express) | lockervision(MOCK) | filestore(streaming)
   auth POR (rota, método) — INCONSISTENTE:
     /v1/<p>            → exige X-NBA-KEY (verify-api-key)
     /v1/<p>/api/*      → exige bearer Azure AD  ... EXCETO:
        readTaxonomy    → SEM AUTH (200 c/ dados)   [P1 arapuca]
        readContent     → SEM AUTH (200, mas [])    [P2 arapuca]
     filestorestreaming/files/{id} → 401 (GET)
        |
        v
  BACKENDS
   TeamOne  = plataforma interna de ops de basquete (memos/news/files/forms/threads/notif)
              apps: bbops-memos, leagueops(interno), isac, nbateamtech
              data model: content{DRAFTED→REVIEWED→PUBLISHED, PUBLIC/PRIVATE}, users{tags,teams}, distlists
              → data layer FILTRA por identidade (readContent sem token = [])
   WordPress = cms-dev/cms-qa (WP 6.2.11 multisite, tema nba-generic 17.11.5, Videopack 4.8.11)
              → lado WRITE; content-api-*/cms-api = lado READ (Varnish, 418 p/ não-allowlisted)
   G-League/WNBA sites = 1 app Next.js SSG multi-tenant por host, buildId, teamId
              → conteúdo provável buildado do CMS/content-api
   api.nba.com = blanket 401 (dados scores/stats atrás de key)
```

**Fronteiras de confiança (as costuras):**
| # | Fronteira | O dev assume… | Testado? |
|---|-----------|---------------|----------|
| B1 | Akamai → Envoy | Envoy confia no IP/geo/verdict-de-bot que a Akamai injeta | ❌ (origin Envoy raw não achado) |
| B3 | Apigee → TeamOne | **toda** rota `/api/*` tem a policy OAuth | ❌ FALSO (readTaxonomy/readContent). **Matrix de verbos incompleto** |
| B4 | TeamOne → data store | identidade p/ scoping SEMPRE vem de token validado | ❌ — e se um **filtro do request** (`userId`/`teams`/`createdBy`) for usado no lugar? |
| B5 | PingFederate ↔ Azure AD | os dois mundos de identidade nunca se cruzam | ❌ (redirect_uri PingFed não testado) |
| B6/B7 | CMS → content-api → sites | conteúdo do dev-CMS não vaza pra prod; build SSG confia no CMS | ❌ (sem cred no CMS) |

## Não-testado (ranqueado)

1. **`readContent` + filtros de identidade/escopo** (`userId`, `createdBy`, `author`, `assignedTo`, `teams=<ID real>`, `tags`, `visibilityType=PRIVATE`, `status=PUBLISHED`) — unauth, `readContent` já bypassa auth. **Se o data layer usa um filtro do request → vira P1.** Barato.
2. **Matrix completo de verbos** (PUT/PATCH/DELETE/HEAD) × os ~46 endpoints TeamOne, foco nos **mutantes** (`updateContent`, `deleteFile`, `sendImmediateEventNotification`, `createOrUpdateUser`, `formSubmission`). Verbo sem policy = escrita/notificação unauth = P1. **Cuidado: marker values, esperar validation-fail antes de qualquer coisa real.**
3. `readContent`/`readTaxonomy` × TODOS os appIds (`NBA_BROADCASTING_MANUALS`, `WNBA_BROADCASTING_MANUALS`, `ISAC`, `TEAM_TECH`, `LOCKER_VISION_ACQUISITION`, `ASDC`) × 9 content types × `visibilityType=PRIVATE`.
4. `filestorestreaming/files/{id}` via POST/PUT (GET=401; verbo pode bypassar como o `readContent`).
5. PingFederate `identity-server-ping-{dev,qa,uat}` — OIDC discovery, `/as/authorization.oauth2`, allowlist de `redirect_uri`.
6. WordPress `cms-dev` — Videopack CVE-2025-7341 (vetor?), tema `nba-generic`, `/wp-content/backup-db/` (500), URLs de draft/preview, `wp-cron.php`.
7. Origin discovery da Akamai (Envoy raw reachable? censys/gau IPs históricos).

## Cadeias narrativas

### ⭐ R1 — "o filtro de identidade é um parâmetro"
Atacante → `GET apis.nba.com/v1/teamone/api/readContent?appId=NBA_BROADCASTING_MANUALS&type=FILE&status=PUBLISHED&visibilityType=PUBLIC` (peça P2: readContent unauth) → **se** o scoping do data layer aceita filtro do request (`teams=<ID de readTaxonomy>`, `createdBy=`, `visibilityType=PRIVATE`) em vez de só o `oid` do token → **retorna documentos internos** → **P1** (mass unauth access a dados internos de ops da NBA).
- Alimenta: P2. Depende de: não-testado nº1, nº3.
- Elos faltando: só rodar as combinações (unauth, barato). **É a próxima a executar.**

### R2 — "algum verbo escreve"
`PUT`/`PATCH`/`DELETE` (verbos que o SPA não usa) nos endpoints mutantes do TeamOne → **se** a policy OAuth do Apigee é por-verbo (como readContent provou) e não cobre esses → **escrita/`sendImmediateEventNotification` não-autenticada** → P1 (state change; ou push/email spam pra staff = phishing interno com remetente legítimo).
- Alimenta: P1, P2 (padrão auth-por-verbo). Depende de: não-testado nº2.
- Elos faltando: matrix de verbos. **Cuidado máximo** — não disparar verbo mutante com valor real; marker + para-e-confirma.

### R3 — "CMS → build → XSS em todo team site" (fraca)
Videopack CVE / tema `nba-generic` no `cms-dev` → conteúdo malicioso no CMS → build SSG dos ~30 sites de time puxa do CMS → stored XSS propagado. P2.
- Depende de: PoC do CVE (vetor + cred no CMS — não temos) + confirmar dev-CMS → prod-content (provável que NÃO). **Morta sem cred.**

### R4 — "fan token vira employee token" (especulativa)
`redirect_uri` frouxo no PingFederate + host `*.nba.com` controlável → roubo de token → ferramenta interna. Depende de host controlável (takeovers morreram) + teste OIDC PingFed.

### R1 — [FALSIFICADO 2026-09-03]
`readContent` unauth testado exaustivamente: 9 types × 6 appIds × `contentStatus`/`contentVisibilityType=PRIVATE`/`teams=<ID real>`/`tags`/`createdBy`/`userId`/`author`/`skip/get`/`id` → **`200 []` em TODOS**. Único não-`[]`: 500 "type/appId required" (validação, auth ainda pulada).
**Conclusão:** o `[]` NÃO é param faltando — o data layer exige **principal validado** (objeto, não header/param). `readContent` unauth = gap de controle (200 ≠ 401) **sem impacto de dado extraível**. R1 morta.

### R2 — "algum verbo escreve" — ✅ CONFIRMADA (parcial), 2026-09-03
Rota: Tiago autorizou request-a-request, probes não-destrutivos (`GET` sem params → `401` vs `500`; depois `?id=<UUID marcador>`).
**Achado:** o gap de auth por-verbo do Apigee **se estende a 2 endpoints de ESCRITA**:
- **`GET apis.nba.com/v1/teamone/api/markContentRead?id=<qualquer>` → `200` sem auth** — executa a marcação de "lido", **sem validar se o conteúdo existe**. → falsifica read-receipts em conteúdo interno de basketball ops.
- **`GET .../updateContentReadCount?id=<real>` → executa sem auth** (bump do contador de views). `id=<falso>` → `500 "Content not found for the id: X"` = **oráculo de existência de content-ID não-autenticado**.
- `bookmark` (sem params → 500 quirk; com params → 401). Os destrutivos de verdade (`deleteContent`/`deleteFile`/`deleteUser`/`updateContent`/`createContent`/`updateContentDisplayOrder`/`deleteDiscussionThread`/`deleteDistributionList`/`createOrUpdateUser`/`sendImmediateEventNotification`) → **401** (auth enforçada).
**Causa-raiz:** policy OAuth do Apigee aplicada por-(rota, verbo), faltando no `GET` dessas rotas — `readTaxonomy`/`readContent` são instâncias de menor impacto.
**Veredito contra-prova (09/03): `ACHADO`** — Broken Access Control, escrita não-autenticada, impacto demonstrável (baixo). Severidade honesta **Low→Medium (P4, talvez P3)**. → `protocolo report` (aguardando OK do Tiago).
**Teto do gap:** confirmado — só esses 2 furam; sem escalada adicional sem acesso autenticado ou teste destrutivo.

#### `escada de jacó` no achado (2026-09-03)
```
D5 privesc/ATO/RCE ............... (não alcançado)
D4 oráculo→enum→PII ............. 🟡 oráculo de content-ID existe, mas IDs = UUID v4 (não-enum). "quem-leu-o-quê" via contentReadReceiptUsers = FECHADA (401).
D3 injeção via o write ......... ✗ FALSIFICADO — updateContentReadCount ecoa o id cru no erro JSON; ${7*7} literal, <img> em string JSON (não executa). Sem SQLi/NoSQLi/SSTI.
D2 alterar valor sem auth ...... 🟡 PIOR CASO não-confirmado — markContentRead?userId= → 200 (sem corpo, sem verificação); updateContentReadCount?count=999999 → precisa de content ID real. Sem ID vazado (gau/wayback vazios p/ hosts internos).
D1 ler dado alheio sem auth .... ✗ FALSIFICADO — TODOS os read* (contentReadReceiptUsers, readDistributionList, readAllSubmittedFormData, readDiscussionThreadsByContentId, readContentReviewBySubmissionId, readMyPendingReviewFormData, readUserManageNotification) → 401 via GET+params. O bypass não alcança endpoint que retorna dado.
D0 escrita não-auth campo baixo valor ... ✅ TETO CONFIRMADO
```
**Reportar em: D0 · Low (P4).** Seção "pior caso" do report = D2 (→ Medium/P3 se o programa confirmar internamente que `count`/`userId` são client-controlled — não testável externo sem content ID).
