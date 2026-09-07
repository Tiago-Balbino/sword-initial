# A caçada até aqui — NBA

Log de progresso. `README.md` = estado destilado; aqui = narrativa + próximos passos.

---

## Sessão 2026-09-02 — `protocolo ladrão de bancos`

### O que rodou
- `recon.py nba.com --rate 3` (passivo — subfinder + crt.sh + resolve). **Sem nuclei/katana** (NBA = manual-only).
- httpx probe `--rate 3` em 111 hosts in-scope-pattern (G-League/WNBA teams + infra de auth/api/cms) → 92 vivos.
- Fetches manuais: `bbops-memos` config+JS, G-League `__NEXT_DATA__`, `cms-dev` WordPress paths.

### Números
1522 subfinder + 669 crt.sh → **449 resolvem**. Stack: Akamai(+Bot Manager)→Envoy quase everywhere. CMS = WordPress. Teams = Next.js (app único multi-tenant).

### Achado de recon principal — TeamOne (`bbops-memos.nba.com`)
App **interno** de memos de basketball ops. SPA pública + `/config.json` público (PROD/DEV/QA) vaza:
- API: `apis.nba.com/v1/teamone` (dev `apis-dev`, qa `apis-test`).
- Azure AD tenant `e898ff4a-...`, CLIENT_IDs por env, scope `api://671ab01d-.../data.read`, **redirect via `login.microsoftonline.com/common/`** (multi-tenant!).
- **~46 endpoints `/v1/teamone/api/*` mapeados do JS** (createOrUpdateUser, deleteUser, readContent, authorizedForContentReview, readAllSubmittedFormData, sendImmediateEventNotification, summarize…).
- Apps internos vazados: `isac.nba.com`, `nbateamtech.nba.com` (+ dev/qa).

### 6 leads ranqueados (ficha)
L1 **TeamOne** (`/common/` multi-tenant + CLIENT_ID público → token externo aceito? / authz client-side / IDOR) · L2 **G-League Next.js multi-tenant** (IDOR de `teamId`, vhost confusion no `-dev`, Firebase em `courtside`) · L3 **WordPress `cms-dev`/`cms-qa`** (`wp-login.php` aberto) · L4 **SSO/Identity** (PingFederate + Azure AD) · L5 **GraphQL federation** `gql-federation-tool-dev` · L6 **S3/legado** (`picks-dev` bucket, `shock.wnba.com` Apache direto sem WAF).

### Bloqueio / próximo passo
- **L1 é o mais promissor** e o teste-chave é **unauth-ish**: tentar o fluxo OAuth `/common/` do TeamOne com uma **conta Microsoft pessoal** → se pegar token e a API `apis.nba.com/v1/teamone` aceitar → acesso a memos internos = Critical. Precisa: Tiago logar com conta MS pessoal e capturar o token, OU eu mapeio o fluxo `/authorize` (só bate no login.microsoftonline.com).
- L2/L3 dão pra avançar manual sem conta (mapear as chamadas de API do bundle Next.js; WP recon).
- `gau` travou — rerodar isolado.
- Completar o `scope/in-scope.txt` com o CSV do programa (confirmar que os hosts estão no `nba-public`).

## Arquivos
- `README.md` — ficha (6 leads, TeamOne detalhado). `recon/` — `subdomains.txt`, `probe.jsonl`, `probe-targets.txt`, `teamone/{config.json,app.js}`. Este log.

---

## 2026-09-07 — dojo (OAuth) + hunter H9 + tridente T1 (bloqueado em JS/escopo)
**Postura:** `modo dojo` + `modo hunter` + `formação tridente` (todos selados nesta saída).

**Dojo (entrada):** 2 write-ups OAuth distilados (PortSwigger "hidden OAuth" + Detectify "dirty dancing"). 3 sinais novos no banco: `S-OAUTH-REDIR-02` (matriz de quirks do redirect_uri), `S-OAUTH-LEAK-01` (leak de code no non-happy-path — vale mesmo com allowlist estrita), `S-OAUTH-CARRYOVER-01` (session poisoning no consent). Revisão espaçada agendada (09-07→09-13→10-06). Detalhe em `memory/dojo-log.md`.

**Aplicado na NBA (saída):**
- 🆕 **H9** na ficha — `S-OAUTH-LEAK-01` no **SSO web** (`identity.nba.com`/PingFederate `*-ping`/`login-uat`), chain com o achado próprio "sem CSP nas properties" (error page carrega 3rd-party JS sem backstop).
- Lead #1 (client público Azure AD) ganhou a **matriz de quirks** como probe (`S-OAUTH-REDIR-02`).
- `targets/nba/tridente.md` criado (matriz T1 do redirect_uri + T2 pendente).

**Bloqueios (explícitos):**
- **T1 / lead #1 (Entra redirect_uri):** `[NÃO TESTADO — bloqueado: veredito atrás de JS]`. curl exaurido 09/07 (4 ângulos: -L, sem-L, prompt=none, cookie-replay+$Config) → método curl **morto** (ver aviso no arsenal). Só fecha com **navegador** (tridente Blink, precisa da extensão Claude-in-Chrome conectada) OU conta MS real. Nuance: redirect é **custom-scheme nativo** `teamone://` → o leak web (`S-OAUTH-LEAK-01`) **não se aplica** a ele + Entra tende a exact-match → sub-ângulo **baixa probabilidade**.
- **H9-web (PingFederate/identity):** `[NÃO TESTADO — bloqueado: escopo + superfície morta]`. Hosts `identity*`/`*-ping` **não** na amostra in-scope (27/452) e os probados dão 404/301. Não probar ativo sem confirmar no CSV do programa.

**Próximo passo:** (a) conectar a extensão Claude-in-Chrome → eu dirijo o Blink e fecho T1 sozinho; OU (b) pivô HTTP igual Airbnb — Tiago cola cookies/sessão NBA → eu rodo o **L2 IDOR `teamId`** e o `readContent` autenticado do TeamOne (puro request/response, `--rate 3`). (c) obter o CSV de escopo pra destravar H9-web e confirmar `apis.nba.com`.
