# A caçada até aqui — CoinSpot

Log de progresso. A **ficha** (`README.md`) é o estado destilado; aqui é a narrativa + próximos passos.

---

## Sessão 2026-09-02 — `protocolo ladrão de bancos`

### O que rodou
- Alvo escolhido no `protocolo ladrão de bancos` (portfólio #1). `recon.py --all --rate 5` contra `coinspot.com.au` + `cors_headers_scan` + OSINT (doc da API v2, gau/wayback, JS do site, `.well-known/*`).

### Resultado
- **Superfície minúscula:** 10 subs → 5 resolvem → **2 vivos** (`coinspot.com.au`, `www`). Confirma "closed scope, superfície pequena".
- **gau: 119k URLs** = o corpus principal (katana deu timeout, nuclei 0, sem gf → garimpo manual).
- CORS/headers limpos (nada perseguível).
- **API v2** documentada: 3 superfícies (`/pubapi/v2` GET público · `/api/v2` POST full · `/api/v2/ro` POST read-only), auth **HMAC-SHA512** (`key`+`sign`) + `nonce` monotônico, rate 1000/min. Catálogo de endpoints na ficha.
- **Web `/my/*`** (de gau): `buycomplete/{ObjectId}`, `deposit/pending/{paypal,card}/{uuid}`, `orders/eofy/{ano}`, `my/api` (API keys), `my/bank`, `messagecenter/*`, cadeia `/accountrecovery/{enablewithdrawals,geolockdisable,unlockaccount,2fa}`.
- **Mobile:** Android `com.coinspot.app`, iOS `5Q5H52GDRT.com.coinspot.app` (provável 2 dos 4 assets). Universal links revelam `/withdrawalfiat/confirmed?processed=true`.

### 10 leads mapeados (ficha)
Quentes: #1 IDOR order edit/cancel · #2 quote→execute tampering · #3 race no nonce · #4 withdrawal multi-passo · #5 IDOR buycomplete/deposit-pending · #7 authz divergente entre as 3 APIs. Já dá sem conta: #9 ler `brhash.min.js` (hash de senha client-side?), #10 baixar APK, GitHub code search.

### Bloqueio
Leads quentes precisam de **2 contas + API keys**. Handoff: criar as contas, gerar key read-only em `/my/api`, passar chaves.

## Sessão 2026-09-02 (cont.) — camada UNAUTH, `seguir o rastro` + `formação de lança` + `armar a arapuca`

### Comandos novos criados (CODES.md)
`protocolo One Piece` (caça com 1 conta) · `seguir o rastro` (ramificar de um sinal) · `protocolo armar a arapuca` (inventário de peças → chain).

### Pesquisa externa
- Hack nov/2023: $2.4M hot wallet, **vazamento de chave privada**, "sem detecção em tempo real". Infra, não app.
- **Contradição:** Termos = "2FA p/ todo saque"; doc da API = **zero param de 2FA**, `emailconfirm` default NO.
- **V1 API viva** (`/api`, `/pubapi`, `/api/ro`); `/api/my/coin/deposit` v1 = DEPRECATED mas roteável.

### Caça unauth — `brhash.min.js` NÃO é hash de senha
É lib de **fingerprint de browser** (canvas/fontes/murmurhash3). Lead antigo #9 morto; virou P12 (fingerprint de risco client-controlado).

### `seguir o rastro` — árvore do sinal "erro de nonce antes do erro de key"
- **P1 [forte]:** parser de formato do `nonce` = `parseInt(x,10)` + falsy-guard (fingerprint fechado: `1e30`/`"1e9"`/`-1`/`[1]` passam; `0`/`-0`/`".5"`/`"Infinity"` falham).
- **P2 [forte]:** JSON body = **LAST-KEY-WINS** em chave duplicada (confirmado unauth).
- **P3:** body só parseado com CT `application/json` (match frouxo) ou `x-www-form-urlencoded` — 2 encodings.
- **P4:** método não enforçado na auth; `GET` parseia body JSON; CF só barra PUT/PATCH.
- **P5:** ordem da pipeline mapeada (oráculo de erro).
- **FP:** delay de auth-fail (jitter); "traversal" no pubapi (curl normaliza `../`).

### `armar a arapuca` — `arapuca.md` criado, 12 peças
Chain candidata ⭐ **C1 = P2+P3+P5 → dup-key smuggling no `/my/coin/withdraw/send`** (mandar `amount`/`address` duplicados; se o `sign` cobre bytes crus e a validação lê a 1ª mas o handler a última → saque de valor/destino não-assinado = **Critical**). Elo faltando: 1 API key full+withdraw + saber se o `sign` é canônico.
Outras: C2 (replay nonce cross-versão v1/v2), C3 (key vazada = drain sem OOB).

### Iteração 4 — esgotando o nível 0 (sem conta)
- **GitHub code search:** bloqueado (exige login; grep.app 429). Mas os **wrappers de referência** deram o `sign` = HMAC dos **bytes crus** de `json.dumps` compacto (P13) e `nonce = int(time()*1e6)` (P14) → **C1 fica concreto**.
- **`pages_main.js` → `/ua` e `/ua/event`** (P17): beacon unauth, **sem CSRF, sem throttle**; `fp: fp.get()` enviado sem auth (P12 concreto); `userAgentOverride` = UA que o servidor grava; `path`/`referrer`/`label` sem escape → **blind XSS em dashboard interno** (precisa callback OOB).
- **V1 API doc completa** (P19): menos guardas, path-suffix + assinatura idênticos à V2 → reforça **C2**.
- **Fechados:** `csutm` (sem reflexão server-side) · cache poisoning (nada dinâmico cacheável) · subdomínios (0/~90) · `/withdrawalfiat/confirmed` (cosmética — `?token/id/hash` ignorados) · ALTCHA `?maxnumber=` (server-fixed) · rota que pula middleware (nenhuma).
- **Fora de escopo:** `coinspot.com`/`.co`/`.io` (redirects/parking — H1 só `coinspot.com.au`).

### Bloqueio
**Nível 0 ESGOTADO.** Nível 1 inteiro precisa de **API key**. Restos sem conta: (a) blind XSS `/ua` — precisa dominio de callback (XSS Hunter) teu; (b) APK — baixar `com.coinspot.app` ou instalar `jadx`/`apktool`.

### Encerramento (Selo de saída — 2026-09-02)
- **`modo hunter` + `formação de lança` + `seguir o rastro` + `armar a arapuca` DESLIGADOS.** Pivot pro `protocolo ladrão de bancos` na NBA.
- **Onde parou:** nível 0 esgotado; 19 peças na `arapuca.md`; chain ⭐ **C1** (dup-key smuggling no saque, shape Critical) montada e à espera de 1 API key full+withdraw.
- **Próximo passo:** quando o Tiago tiver conta → `protocolo One Piece` + `formação de lança`, ordem **B → D → C1**. Sem conta: blind XSS `/ua` (precisa OOB) e APK.
- **Aprendizado persistido:** `memory/arsenal.md` ganhou *falsy-guard anti-replay*, *oráculo de pipeline por diferencial de erro*, *beacon de analytics como vetor*.
- **Git:** mudanças não commitadas (Tiago não pediu commit).

## Próximos passos
1. **Handoff:** 1–2 contas em `www.coinspot.com.au` (1 com alias `<h1username>@wearehackerone.com`); API key em `/my/api` — **1 read-only** primeiro (leads B, D), depois **1 full+withdraw** (A/C1, C, F). Passar `key`+`secret`.
2. Ligar `protocolo One Piece` + `formação de lança`; ordem: **B → D → A (C1)** → E/F/G.
3. Sem conta: GitHub/GitLab code search `coinspot` (keys vazadas — chain C3); baixar APK `com.coinspot.app`.

## Arquivos
- `README.md` · `arapuca.md` (peças + chains) · `recon/` · este log.

## Arquivos
- `README.md` — ficha (10 leads, catálogo da API, status).
- `recon/` — `subdomains.txt`, `live-hosts.txt`, `urls.txt` (119k), `recon.json`, `cors.json`, `webjs/`, logs.
- `a-cacada-ate-aqui.md` — este log.
