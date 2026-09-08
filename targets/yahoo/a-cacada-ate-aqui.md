# Yahoo — a caçada até aqui (log datado)

## 2026-09-07 (sessão hunter — L7 morto in-band, nova superfície: Lightyear CMS / Creators)

### Rodou
- **L7 routing-SSRF (Y1 / CHAIN-A — a "joia da coroa") — via socket TLS cru (= Burp Repeater):**
  - Primitivas contra edge ATS `apis.mail.yahoo.com`: baseline `404 Not Found`; **Host-override → `404 Not Found on Accelerator`** (Host não-remapeado, NÃO roteado); absolute-URI / @-notation / port-confusion → **`400 Invalid HTTP Request`** (parser estrito).
  - **Oráculo de remap por Host** (bananastand gq1/bf1/bf2/ne1/sg3/tw1/corp + credstore interno + localhost + 169.254.169.254): **TODOS** `404 Not Found on Accelerator`. Só o Host próprio remapeia.
  - **Sistêmico:** repetido em `data.mail`, `proddata.xobni`, `s.yimg`, `finance`, `checkout.fantasysports` → todos `Not Found on Accelerator` p/ Host bananastand. `onepush.query.yahoo.com` **não resolve** (NXDOMAIN).
  - **VEREDITO L7 = [NEGATIVO in-band]:** ATS roda `remap_required=1` **Yahoo-wide** — nenhum edge proxeia Host não-allowlistado. Absolute-URI/@/porta morrem no parser. Resíduo único = **detecção cega via Collaborator OOB** (tarefa manual Burp; improvável com remap_required). **CHAIN-A cai** (perdeu o caminho de prova in-band).
- **CVE-2025-29927 (Next.js middleware bypass via `x-middleware-subrequest`):** testado em `cm-ui/your-content` (já 200 unauth, sem diff) e `subscriptions.payments` (307 no edge/Envoy, não middleware) → **[NEGATIVO]** (gates não são middleware Next.js).

### 🆕 ACHADO DE SUPERFÍCIE (novo top lead) — Lightyear CMS / Yahoo Creators
- `cm-ui.yahoo.com` (308 → `/your-content`) = **"Lightyear CMS"**, Next.js App Router, **200 unauth (shell), SEM CSP**. Staging gêmeo: `cm-ui.staging.yahoo.com`.
- **Bundle JS (público) vaza o backend + modelo de authz** (chunks em `/_next/static/chunks/`):
  - APIs: `cm-auth-service.yahoo.com` (**FastAPI/Python** — `{"detail":"Not authenticated"}`) · `content-service.yahoo.com` (**AWS API Gateway** — `{"message":"Missing Authentication Token"}`) · `feed-api.yahoo.com` · `api.creators.yahoo.com` (**Spring Security OAuth2** — RFC-7807) · `api.yahoo.com/{content-management,partner-portal-management,yahoo-creator-management}` (**DNS INTERNO — inalcançável de fora**).
  - **Auth = `Authorization: Bearer <access_token>`** com token de **`localStorage.getItem("access_token")`** (JWT, claim `aud`); refresh on 401.
  - **🔑 `getActiveTeamLS` / `setActiveTeamLS`** = time ativo vem do **localStorage (cliente controla)** → `activeTeam`/`activeTeamPropertyIds`/`activeTeamProviderIds`. **= candidato BOLA/cross-tenant** se o backend confia no team id sem checar membership (Pergunta #2 do The Mind).
  - Permissões: `manage:authors`, `read:user`, `CONTENT.PUBLISH`, `SECURE_PREVIEW`; mapa por API base.
  - Rotas admin (frontend): `/admin/{user,teams,brands,authors,providers,sources,properties,holding-pen}` · `/assignments/me/team/{id}` · `/assignments/filter` · `/earnings` ($) · `/content-performance/*`.
- **OAuth2 client dos Creators (capturado, unauth):** `client_id=ASWQMYXpYIZlSogi`, `redirect_uri=https://api.creators.yahoo.com/auth/callback`, scope `openid profile email`, **PKCE(S256)+state+nonce** (hardened), `activity=creator-onboarding` → **onboarding provavelmente self-serve**.
- Unauth: `cm-auth-service/assignments/me/resources` → **403 "Not authenticated"**; `content-service` → **403** (AWS API GW); `api.creators/` → **302 `/oauth2/authorization/yahoo`**.

### Decisões
- Joia antiga (L7 SSRF) morta honestamente in-band; joia nova (CMS multi-tenant) é **fit máximo BAC/IDOR** — bloqueada só por um **access_token de conta CMS/creator provisionada**.
- Split de infra (FastAPI ↔ AWS API GW ↔ Spring) entre os 3 serviços do CMS = costura de authz p/ testar (mesma ação por caminhos diferentes — Pergunta #3).

### ⛔ Bloqueio p/ retomar
**Preciso de um `access_token` (JWT) válido do Lightyear CMS / Yahoo Creators.** Passo do Tiago: logar/onboard a conta `moldret_intigriti@yahoo.com` em `cm-ui.yahoo.com` (ou o dashboard de creators) → abrir DevTools → `localStorage.getItem("access_token")` → colar num cookie/tokenfile. Aí rodo os testes autenticados de BOLA (trocar `activeTeam`/team-id/user-id entre contexto próprio e alheio) via `tools/yahoo_auth_probe.py`.

### Próximo passo (concreto)
1. **[precisa Tiago]** Onboard/login em Yahoo Creators c/ a conta de teste → extrair `access_token` → testar **BOLA no `activeTeam`/`/assignments/me/team/{id}`/`/admin/user/{id}`** (2 contas ou 1 conta + IDs incrementais). Fit #1.
2. **[unauth, executável já]** Testar validação de `redirect_uri` do client `ASWQMYXpYIZlSogi` no `api.login.yahoo.com/oauth2/request_auth` (troca de redirect_uri/subdomínio) — lead OAuth secundário.
3. **[unauth]** Enumerar rotas do `cm-auth-service` (FastAPI → tentar `/docs`,`/openapi.json`) e `content-service` (AWS API GW → paths do bundle).

### Adendo (mesma sessão) — protocolo `descobrir a roda` executado
- Reconstruído o modelo do sistema (edge ATS/remap · IdP OAuth central · subsistema Lightyear CMS com 3 backends: FastAPI/AWS-API-GW/Spring) + 6 fronteiras de confiança (B1–B6 + B-Next) em `arapuca.md`.
- Derivadas 5 cadeias narrativas (E/F/G/H/I) + mapa do não-testado ranqueado.
- **Chains unauth executadas e MORTAS:** CHAIN-H (sem proxy interno; só `/api/log`) e CHAIN-I (origins PCI-CDE alcançáveis mas ELB→403 sem mTLS do edge; peça Y28).
- **Desfecho:** as 3 chains de maior impacto (E activeTeam-swap / G content-service-direto / F aud-carryover) dependem **só do access_token JWT**. Yahoo em espera do token (frente unauth exaurida).

### Verificação final "não deixar nada pra trás" (mesma sessão)
- Fechei 2 gaps unauth que estavam marcados-mas-não-executados: **C-03/Y16 header-replay = NEGATIVO** (serviços ignoram identidade forjada) e **WCP unkeyed-fuzz = NEGATIVO** (CMS não-cacheado).
- **Frente unauth do Yahoo agora 100% exaurida.** Tudo restante = atrás do token (CHAIN-E/G/F + privesc) ou deferido por rate-limit (OAuth `activity=`, dirty-dancing) — registrado na arapuca.
- Superfície autenticada pré-mapeada e pronta (mapa de endpoints + RBAC + plano de 6 provas). Retomada = colar `access_token` → disparar.

## 2026-09-08 — Selo de saída (encerramento hunter+dojo)

### Relatório sincero: o que dá pra fazer ANTES do token (destravar)
**Frente unauth do CMS: EXAURIDA — tudo negativo/bloqueado testado:**
routing-SSRF (remap_required) · direct-origin ELB (403 mTLS) · header-forge de identidade (ignorado) · WCP (não-cacheado) · middleware-bypass CVE-2025-29927 (auth no edge) · `_next/image` SSRF (allowlist estrita) · docs/actuator (gated) · OAuth redirect_uri (estrito). **A borda/auth do Yahoo está bem-configurada contra os truques unauth — o risco residual está na LÓGICA de authz atrás de credencial válida.**

**Ainda dá pra fazer sozinho (EV honesto, NÃO feito ainda):**
1. **[EV alto] Replicar o método `bundle-harvest → oráculo de API` nos OUTROS apps Yahoo vivos** do recon (admin panels `mario-admin.nevec`/`admin.nevec`/`hermes-admin.ec`/`hk.admin.deals`; fantasy `football.`/`beacon.`; ~51 hosts vivos do Nível 3). Acabou de render forte no cm-ui — outro SPA pode ter auth mais fraca ou endpoint aberto. **Melhor uso do tempo sem o Tiago.**
2. **[EV médio] OSINT passivo** (GitHub code search / gau / wayback) por token/segredo/endpoint vazado — `client_id ASWQMYXpYIZlSogi`, `cm-auth-service`, `lightyear`, `content-service.yahoo.com`. Um token vazado destrava TUDO.
3. **[EV baixo] Server Actions** do cm-ui (`Next-Action: <id>` POST) — último vetor app-level vivo; mutante + baixa prob + cm-ui em 429 agora.

**Limite honesto:** o achado de verdade (BOLA/privesc/lógica no CMS) está **atrás do token**. Nenhuma esperteza unauth substitui a credencial — testei os bypasses e todos seguraram. Sem token ou credencial vazada, eu **mapeio** (armo a fase autenticada) e **compro bilhete de loteria** (leak OSINT / endpoint aberto em outro app), mas não produzo o BOLA.

### Estado ao encerrar
- **Alvo:** Yahoo (Intigriti). **Onde parou:** superfície unauth exaurida; joia = Lightyear CMS multi-tenant, 100% mapeada, travada no `access_token` JWT.
- **Próximo passo (2 caminhos):** (a) Tiago cola o `access_token` → disparo CHAIN-E/F/G (probes prontas na arapuca); (b) autônomo: método bundle→oráculo nos outros apps Yahoo (item 1 acima).
- **Aprendizado persistido:** `S-ORACLE-01` (arsenal) + `S-JWT-01`/`S-NEXT-01`/`S-APIGW-01`/`S-BOLA-TENANT-CLIENT-01` (dojo) + FP `remap_required` + método de headers.
- Dojo fechado; revisões espaçadas agendadas (08/09 → 14/09 → 07/10).
