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
