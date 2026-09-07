# signals.md — Índice de gatilhos (o *matcher* do motor de hipóteses)

**Inverte o arsenal.** Enquanto `arsenal.md` responde *"como testo a classe X"* e `patterns.md`
*"por que o padrão P importa"*, este arquivo responde: **"vi o sinal S no alvo → qual pattern acende,
qual hipótese concreta, qual o probe mais barato, qual o FP a antecipar."** É a camada de **matching**
entre o recon e o banco. Cada entrada é **greppável** (grep por `S-IDOR`, por `P1`, por `🟢`).

**Como usar:** `code 6 <alvo>` (motor de hipóteses) varre o corpus de recon do alvo contra os `Sinal:`
daqui e emite leads `[UNTESTED]` rankeados na ficha. Ver `CODES.md`.

**Disciplina de sincronia:** toda entrada nova no `arsenal.md` que tenha "Sinais" **também** ganha uma
linha aqui (como o `_ingested.md` faz pra URLs). Arsenal = o *como*; signals = o *quando dispara*.

## Convenções
- **Sinal** = observável concreto (token/regex no JS ou response, nome de param, header, tech, comportamento).
- **Probe** = a confirmação **mais barata**. `🟢` = silencioso (ok na `postura escudo`); `🔴` = faz barulho (requer autorização).
- **Pattern** = P1–P8 do `patterns.md`. **Arsenal** = seção do `arsenal.md`.
- `id` = `S-<classe>-NN` (sinal único) ou `C-NN` (gatilho de chain / composição).

---

# Sinais únicos (Pass 1)

### S-IDOR-01 — id de objeto no path/body/query
- **Sinal:** `\b(id|uuid|account|file|invoice|order|booking|memberId|userId|profileId)\b` em request que **retorna/edita** dado.
- **Pattern:** P1, P3 · **Arsenal:** IDOR/BOLA
- **Hipótese:** authz confia no id do request → objeto de outra conta lido/escrito.
- **Probe:** 🟢 mapear onde o id aparece e se é sequencial/opaco · 🔴 2 contas: A cria, B acessa pelo id de A.
- **FP:** authz pelo token noutra camada; id decorativo; 200 p/ qualquer id mas filtra por dono no backend.

### S-IDOR-02 — param de dono no body (mass-assignment)
- **Sinal:** `\b(userId|ownerId|memberId|accountId|createdBy|teamId|org(Id)?)\b` **aceito no body de escrita**.
- **Pattern:** P1, P4 · **Arsenal:** IDOR/BOLA (mass-assignment do dono)
- **Hipótese:** injetar o id de dono muda de quem o backend busca/escreve → escrita cross-account.
- **Probe:** 🔴 enviar com o próprio id (baseline) vs id de teste; ver se o alvo muda.
- **FP:** stack com JWT+gateway recarrega o dono do token antes de escrever (heurística do arsenal) → tende a FP.

### S-BAC-01 — endpoint barrado por método/rota/header/referer
- **Sinal:** `401/403` que depende do verbo, do path exato, de `Referer`, ou rota admin adivinhável (`/admin`, `/internal`).
- **Pattern:** P3, P8 · **Arsenal:** Broken Access Control — bypass por variação
- **Hipótese:** o controle casa só uma forma do request; variante passa.
- **Probe:** 🟢 `OPTIONS`/`HEAD` (só lê a política) · 🔴 trocar método, `X-Original-URL`/`X-Rewrite-URL`, `/ADMIN`, barra final, `%2e`.
- **FP:** best-practice sem impacto; rota que barra em todas as variantes.

### S-HDR-01 — erro verboso vaza header interno de confiança
- **Sinal:** `x-user-id`, `x-envoy-*`, `x-forwarded-*`, `whitelabel-token`, api-key de serviço num stack trace; tech Envoy/Istio/gateway.
- **Pattern:** P5, P1 · **Arsenal:** Header Injection / Trusted Internal Headers
- **Hipótese:** edge não strippa a versão client-supplied → forjar identidade/IP/role.
- **Probe:** 🟢 ler o erro e catalogar os nomes/valores · 🔴 reenviar o header forjado e ver se o comportamento muda.
- **FP:** edge bem configurado strippa tudo; api-key de serviço inútil se o gateway é interno (`*.cluster.local`).

### S-RL-01 — endpoint de OTP/login/reset/exists
- **Sinal:** `/login`, `/otp`, `/verify`, `/reset`, `/exists`, `/2fa`, código de verificação.
- **Pattern:** P6 · **Arsenal:** Rate-limit / OTP / Brute-force
- **Hipótese:** trava só client-side ou por-IP → brute/race.
- **Probe:** 🟢 **nunca** rajada aqui — só ler a resposta de 1 request p/ ver vocabulário de contador · 🔴 (com autorização + escudo baixado) N requests, XFF rotation, race.
- **FP:** `pollingLimit/retriesLeft` = polling assíncrono (FP) vs `lockout/attemptsLeft` = trava real. Enum de e-mail = Low/OOS.

### S-REDIR-01 — param de redirect
- **Sinal:** `\b(redirect|return|next|url|callbackUrl|continue|dest|redirect_uri|returnUrl)\b` (esp. login/OAuth).
- **Pattern:** P5 · **Arsenal:** Open Redirect
- **Hipótese:** allowlist fraca → redirect pra domínio do atacante (e, em OAuth, leak de code/token).
- **Probe:** 🟢 ver se responde `200 sem Location` (redirect client-side → curl não confirma, precisa browser) vs `3xx+Location`.
- **FP:** página ignora o param; destino server-supplied; extrator só de analytics.

### S-INFO-01 — vazamento de infra / source map / versão
- **Sinal:** stack trace, `*.svc.cluster.local`, `.js.map`, comentários, headers de versão, hostnames internos.
- **Pattern:** P7 · **Arsenal:** Information Disclosure
- **Hipótese:** sozinho = Low; vale se o segredo/host habilita SSRF/IDOR/header-forge.
- **Probe:** 🟢 puxar `.js.map` público, ler comentários, catalogar hosts/segredos.
- **FP:** público por design (versão, robots). **Sempre tentar chainar antes de cravar Low** (→ ver chains C-02/C-03).

### S-GQL-01 — endpoint GraphQL
- **Sinal:** `/graphql`, `POST {"query":...}`, tipos `__schema`.
- **Pattern:** P1, P7 · **Arsenal:** GraphQL
- **Hipótese:** introspection ON → mapa completo; BOLA via id no INPUT_OBJECT; batching burla rate/authz.
- **Probe:** 🟢 1 query de introspection (`{__schema{queryType{name}}}`); se 400, tentar header de contexto (`ag-language-id`) e repetir.
- **FP:** introspection off sem field-suggestion; resolver que ignora o id do input.

### S-IDV-01 — onboarding multi-etapa anti-abuso
- **Sinal:** fluxo `email→phone→cartão→captcha/Arkose` pra liberar recurso caro (CI free, trial); flags + checagem lazy.
- **Pattern:** P2, P6 · **Arsenal:** Identity Verification / Anti-abuse Bypass
- **Hipótese:** fail-open do provedor, ordem só na UI, token reuse, exemption por contexto.
- **Probe:** 🟢 mapear as etapas e as chamadas de cada uma · 🔴 chamar a etapa final fora de ordem.
- **FP:** `/exists` público por design; auto-confirm por domínio verificado = documentado.

### S-PAY-01 — checkout / pagamento / voucher
- **Sinal:** `amount`, `price`, `quantity`, `currency`, `voucher/coupon/gift-card apply`, `order/place`, `refund`.
- **Pattern:** P4, P2, P6 · **Arsenal:** E-commerce Checkout / Payment Business Logic
- **Hipótese:** cliente controla valor/moeda; multi-redemption; step-skip; refund IDOR.
- **Probe:** 🟢 mapear os campos e a ordem dos passos · 🔴 (pare-e-confirme) valor absurdo, currency swap, race no apply.
- **FP:** desconto que o programa permite empilhar; recurso OOS.

### S-WH-01 — webhook/callback de pagamento
- **Sinal:** `/payment/*/complete`, `/checkout/*/complete`, `/api/*/webhook`; múltiplos gateways.
- **Pattern:** P1, P8 · **Arsenal:** Payment Webhook / Callback bypass
- **Hipótese:** `complete` confia no `status:success` do client sem verificar assinatura → forja "pago".
- **Probe:** 🟢 catalogar os paths de callback no JS · 🔴 (pare-e-confirme) status forjado, replay, trocar `orderReference`.
- **FP:** provider assina (Klarna HMAC-SHA512); IP-allowlist server-side.

### S-HTMX-01 — app htmx
- **Sinal:** atributos `hx-get/post/target/swap/on`, headers `HX-Redirect/HX-Trigger`.
- **Pattern:** P5 · **Arsenal:** htmx
- **Hipótese:** swap de HTML cru → toda reflexão vira XSS; `hx-on` usa eval; sem CSRF token por padrão.
- **Probe:** 🟢 ler o HTML/headers por reflexão e checar CSP (`unsafe-eval`? nonce?).
- **FP:** CSP com nonce e sem `unsafe-eval` + `object-src none` derruba o eval-XSS.

### S-OAUTH-01 — OAuth2 / OIDC / Auth0
- **Sinal:** `@auth0/*`, `oidc-client`, `login.alvo.com`, `us.auth0.alvo.com`, `/.well-known/openid-configuration` responde.
- **Pattern:** P5, P3 · **Arsenal:** OAuth2 / OIDC
- **Hipótese:** allowlist fraca de `redirect_uri` → leak de code/token = ATO; implicit ligado; `state` ausente.
- **Probe:** 🟢 puxar o discovery e anotar endpoints/`response_types`/`code_challenge_methods` (barato, público).
- **FP (testado Arkose):** `registration_endpoint` listado ≠ DCR ligado (`400 disabled`); `plain` é só capability anunciada. Precisa do `client_id` real.
- **Sonda `redirect_uri` unauth (Azure AD, NBA 09/2026):** ler `sErrorCode` do `/authorize` — `50011`=mismatch (seguro), `90102`=formato, `50058`=passou-o-redirect. Allowlist frouxa = não-registrada dá `50058` igual à registrada. **FP:** `50058` pode mascarar (match adiado pro pós-login) → só `[INCONCLUSIVO — FORTE]` sem conta. Detalhe no `arsenal.md`.

### S-CSP-01 — CSP larga por wildcard de organização
- **Sinal:** `script-src *.alvo.com` ou `frame-src *.alvo.com` na app sensível.
- **Pattern:** P7 · **Arsenal:** CSP larga por wildcard
- **Hipótese:** XSS em **qualquer** subdomínio `*.alvo.com` executa no origin sensível → eleva XSS isolado.
- **Probe:** 🟢 ler o header CSP + varrer o parque de subdomínios por reflexão.
- **FP:** —

### S-CORS-01 — CORS montado dinamicamente / permissivo
- **Sinal:** resposta com `Access-Control-Allow-Origin` que **reflete o `Origin`** enviado (ou vazio/curinga), esp. junto de `Access-Control-Allow-Credentials: true`; `ACAH: *`, `ACAM: GET,POST`.
- **Pattern:** P1, P5 · **Arsenal:** (semente CORS)
- **Hipótese:** reflete `Origin` arbitrário + `credentials:true` → página do atacante lê resposta autenticada da vítima cross-origin.
- **Probe:** 🟢 reenviar com `Origin: https://evil.example` e ver se **reflete** no `ACAO` + se `ACAC:true` (1 request, silencioso).
- **FP:** `credentials:false` (sem cookie/token → sem dado sensível vazado); ACAO reflete mas endpoint é público; `null`/scheme inválido = inofensivo. **Muitos programas marcam "CORS sem impacto" como OOS/Core Ineligible** — só vale com credentials + dado sensível.
- **Fonte:** NBA `windycity.gleague`/`wings.wnba` (09/2026, captura na `postura escudo`).

### S-NONCE-01 — falsy-guard num controle de segurança
- **Sinal:** valor que deveria ser int positivo crescente (nonce/sequence/counter/version) e o servidor rejeita `0/null/""/false` mas aceita `-1/1.5/"1"/[1]`.
- **Pattern:** P5 · **Arsenal:** Falsy-guard num controle de segurança
- **Hipótese:** `if(!x)` disfarçado de validação → array-wrap/float-slice/coerção desincroniza o anti-replay.
- **Probe:** 🔴 fuzzar o campo com `0 / -1 / 1.5 / "1" / [1] / {} / null / 1e30 / chave dup` e ler o diferencial de erro.
- **FP:** todas as camadas coagem pro mesmo int canônico antes do uso = feio, não explorável.

### S-ERRORACLE-01 — diferencial de erro como oráculo da pipeline de auth
- **Sinal:** endpoints autenticados devolvem erros **diferentes** conforme o campo que falta (`invalid nonce` vs `no key` vs `invalid sign`).
- **Pattern:** P5, P8 · **Arsenal:** Diferencial de mensagem de erro
- **Hipótese:** ordenar as mensagens revela a ordem da pipeline; estágios antes do segredo são fuzzáveis unauth.
- **Probe:** 🟢 mandar requests faltando 1 campo de cada vez e ordenar as respostas (baixo volume, serial).
- **FP:** pipeline com erro genérico único (`unauthorized`) não vaza ordem.

### S-TAKEOVER-01 — DNS dangling
- **Sinal:** CNAME/A aponta pra serviço de terceiro com página de erro ("Site Not Found", "no such app").
- **Pattern:** P7 · **Arsenal:** Subdomain takeover
- **Hipótese:** subdomínio órfão claimable → takeover → (com CSP larga) XSS no origin.
- **Probe:** 🟢 checar o status no `can-i-take-over-xyz` **e** casar o padrão exato do serviço.
- **FP:** serviço exige verificação de domínio (Firebase, Netlify, Vercel, Zendesk-TXT) → **não** claimable. Dangling sem claim = Informative.

### S-BEACON-01 — beacon de analytics com campos do cliente
- **Sinal:** `POST /ua|/track|/collect|/event` em todo load, com `title/path/referrer/userAgentOverride/fp/deviceId`; sem auth/CSRF.
- **Pattern:** P4, P7 · **Arsenal:** Beacon de analytics como vetor
- **Hipótese:** campo vira linha em BI/admin interno → blind/stored XSS; `userAgentOverride`/`fp` spoofa sinal de risco.
- **Probe:** 🟢 mandar marcador benigno e ver 200 · 🔴 payload com callback OOB (é cego, precisa de webhook).
- **FP:** log append-only nunca renderizado; campo truncado/sanitizado no ingest.

### S-MT-01 — multi-tenant / multi-região
- **Sinal:** mesma app em `app-us/eu/au`, APIs regionais, subaccounts/teams; id = base64/hash.
- **Pattern:** P1, P3 · **Arsenal:** COMPLEXAS › Multi-tenant
- **Hipótese:** signing-key compartilhada entre réplicas; authz divergente por região; cross-subaccount.
- **Probe:** 🟢 mapear os hosts regionais e o formato do id · 🔴 2 contas, A tenta objeto de B em CADA região.
- **FP:** paridade real; id opaco de verdade (uuid v4).

### S-CSPT-01 — path de fetch montado de param de rota
- **Sinal:** no JS, `fetch()/axios()` com path **concatenado** de um param de rota/query sem sanitizar.
- **Pattern:** P5 · **Arsenal:** COMPLEXAS › WCD+CSPT
- **Hipótese:** `../../../` muda **qual** endpoint é chamado, levando o header de auth da vítima.
- **Probe:** 🟢 ler o JS e isolar a concatenação (offline, silencioso).
- **FP:** path sanitizado/allowlisted; fetch com base fixa.

### S-WCD-01 — endpoint autenticado cacheável
- **Sinal:** endpoint sensível (`/v1/token`, `/account`) vira `Cache-Control: public` ao anexar `.css/.js` ou via path confusion.
- **Pattern:** P5, P7 · **Arsenal:** COMPLEXAS › WCD+CSPT
- **Hipótese:** response da vítima cacheada na CDN → atacante lê sem auth.
- **Probe:** 🟢 anexar sufixo estático e ler o `Cache-Control` (1 request, baixo volume).
- **FP:** origin marca `private/no-store`; CDN respeita.

### S-CSPP-01 — prototype pollution client-side
- **Sinal:** merge/extend recursivo de query/JSON (`?a[__proto__][x]=`), libs antigas (jQuery 1.x, lodash old).
- **Pattern:** P5 · **Arsenal:** COMPLEXAS › CSPP
- **Hipótese:** fonte (poluir proto) + gadget (fetch opts, script src) → DOM XSS.
- **Probe:** 🟢 DOM Invader / ler as libs e os merges no JS (offline).
- **FP:** sem gadget alcançável; libs já corrigidas.

### S-SMUGGLE-01 — cadeia edge→origin (request smuggling)
- **Sinal:** CDN + backend HTTP/1.1 legado; downgrade H2→H1.
- **Pattern:** P5 · **Arsenal:** COMPLEXAS › HTTP Request Smuggling
- **Hipótese:** CL.0/H2.CL/TE.0/browser-powered desync → envenenar request de outro user.
- **Probe:** ⚠️ 🔴 **pare-e-confirme sempre** — afeta terceiros; ambiente/rate controlado, nunca em massa.
- **FP:** front normaliza; origin H2 puro.

### S-RACE-01 — check-then-act sobre saldo/limite/quota (TOCTOU)
- **Sinal:** endpoint que **lê um contador e depois escreve** — saque, transfer, resgate de cupom/voucher, "convite restante", compra com débito de saldo, cancel-after-fill de ordem. Verbos: `withdraw`, `transfer`, `redeem`, `capture`, `order`, `booster`, `deposit`. (Nexo: `request_crypto_withdrawal`, `request_pay_to_card`, `exchange_order`, `term/deposits/user/create`.)
- **Pattern:** P4 (ordem das etapas assumida) · **Arsenal:** Business Logic › Race / limit-overrun
- **Hipótese:** N requests paralelas passam **todas** no check de saldo/limite antes de qualquer débito commitar → saque/resgate múltiplo do mesmo saldo (double-spend), saldo negativo, cupom N× (fonte: Josip Franjković — Cobalt BTC withdraw, Mega saldo negativo, FB coupon/invite).
- **Probe:** 🔴 (**pare-e-confirme; só na própria conta, valores mínimos**) disparar 5–20 requests idênticas **single-packet / last-byte-sync** (mesma conexão H2, ou Turbo Intruder `race-single-packet`); comparar saldo esperado vs real. Baseline serial primeiro (1 request = 1 débito).
- **FP:** lock/transação atômica no banco (débito condicional) → só 1 passa; idempotency-key real; "sucesso random após 5000 tentativas" que não muda estado global = ruído (isolar o gatilho antes de reportar). Rate-limit ≠ defesa contra race (não confundir).

### S-FUND-01 — endpoint de movimentação de dinheiro com id/campo de origem no request
- **Sinal:** request de **transfer/withdraw/deposit/pay** que carrega `from_account`/`accountId`/`recipient_id`/`amount`/`sourceWallet` e **o cliente controla a origem**. id sequencial/numérico no path (`/transactions/9876543`) = agravante.
- **Pattern:** P1 (identidade≠permissão) + P2 (cliente controla) · **Arsenal:** IDOR/BOLA + Business Logic
- **Hipótese:** authz confirma **quem você é** (token/JWT válido) mas não **que você é dono da conta de origem** → trocar `from_account`/`recipient_id` move fundo alheio (worst-case do Nexo: *transação fraudulenta*). Escala **read→write**: GET no id vizinho vaza saldo/transação (200 idêntico, sem máscara) → POST de transfer com aquele id executa.
- **Probe:** 🔴 (**pare-e-confirme**) 2 contas próprias: GET `/…/{id+1}` (dado da B com token da A?) → depois POST transfer com `from_account` da B. **Nunca** tocar conta que não seja sua.
- **FP:** 403 só p/ id inválido (não p/ id de outro dono) mascara authz — testar sempre com id **válido de outra conta sua**, esperar 200-com-dado, não 403; backend recarrega dono do token antes de escrever (mass-assignment morre); timing/latência não indica authz — olhar **conteúdo** da response.

### S-BOLA-STALE-01 — authz checada no estado ativo, não re-checada após mudança de ciclo de vida
- **Sinal:** objeto com **transição de estado** (reserva cancelada/expirada, listing desativado, convite revogado, co-host/agente/membro **removido**, assinatura cancelada, conta deprovisionada) + endpoint que ainda o serve. Verbos de ciclo: `cancel/archive/deactivate/revoke/remove/expire/offboard`.
- **Pattern:** P1 + P4 (a ordem/estado é assumida) · **Arsenal:** IDOR/BOLA (família *Workflow-Context*, 6% dos casos)
- **Hipótese:** o dono **perdeu** o acesso pela UI, mas a authz do backend só foi imposta no momento *ativo* e **não re-valida** após o estado mudar → o principal removido/revogado ainda lê/escreve o objeto (token/sessão/URL antiga continua válida).
- **Probe:** 🔴 2 contas: A dá acesso a B (co-host/convidado/membro) → captura request de B → A **revoga** B → **replaya** o request de B. 200-com-dado após revogação = achado. Variante 🟢: só mapear onde a UI some mas a rota/token persiste.
- **FP:** backend invalida sessão/token no offboarding; re-checa dono a cada request (estado atual, não cacheado). Público-por-design (objeto arquivado que é público mesmo).

### S-LOGIC-THRESHOLD-01 — critério de elegibilidade checado uma vez e revogável depois
- **Sinal:** benefício condicionado a um **limiar/critério** (desconto por valor mínimo de carrinho, frete grátis acima de X, tier por volume, cashback por quantidade, cupom "1 item específico") aplicado num passo e **não re-validado no commit**.
- **Pattern:** P4 (ordem/estado assumido) + P2 (cliente controla) · **Arsenal:** Business Logic (domain-specific)
- **Hipótese:** satisfazer o critério → disparar o benefício → **reverter o critério** antes de finalizar (adicionar itens p/ cruzar o limite → aplicar desconto → remover itens → checkout mantém o desconto). O sistema confia que a condição do passo N-1 ainda vale no passo N.
- **Probe:** 🔴 aplicar benefício com o critério satisfeito → editar o carrinho/pedido/estado p/ desfazer o critério → finalizar → conferir se o benefício sobreviveu. Baseline: fluxo honesto primeiro.
- **FP:** re-validação atômica no commit (recalcula elegibilidade no submit final); benefício travado ao snapshot do pedido. Diferenciar de cupom-reuso puro (`S-PAY-01`).

### S-CRYPTO-ORACLE-01 — mesma função cifra input do atacante e o ciphertext é aceito em contexto sensível
- **Sinal:** valor **cifrado/assinado** que circula no cliente (param de iframe assinado, URL de imagem/asset assinada, token opaco reversível, cookie cifrado, `state`/`data` blob) **e** um endpoint que **gera** esse ciphertext a partir de input controlável (preview, "criptografar isto", export, share-link).
- **Pattern:** P5 (dado muda de formato entre camadas) + P2 · **Arsenal:** Business Logic (encryption oracle) / cripto
- **Hipótese:** usar a função pública de cifra pra **cifrar dado arbitrário** → passar o ciphertext resultante numa função sensível que assume "veio cifrado ⇒ confiável/íntegro" (ex.: forjar um blob de preço/identidade/permissão que o backend decifra e confia).
- **Probe:** 🔴 achar o par (gerador de ciphertext ↔ consumidor de ciphertext); cifrar um payload escolhido no gerador; injetar no consumidor; ver se o backend confia. 🟢: mapear onde os dois lados existem.
- **FP:** cifra com contexto/AAD amarrado (o ciphertext de um contexto não vale noutro); assinatura por-usuário; MAC que cobre o campo. Raro, mas altíssimo impacto quando existe.

---

### S-OAUTH-REDIR-02 — redirect_uri com matching frouxo (não-exato)
- **Sinal:** provider OAuth/OIDC cujo `redirect_uri` aceita variações da URI registrada (não faz exact-match).
- **Pattern:** P5, P3 · **Arsenal:** OAuth2 / OIDC
- **Hipótese:** allowlist casa por prefixo/substring/normalização → atacante desvia o `code` pro seu domínio.
- **Probe (matriz de quirks — Detectify "dirty dancing"):** contra o registrado `.../callback`, testar 🟢 **case-shift** (`/CaLlBaCk`) · **path-append** (`/callbackxxx`, `/callback/..`) · **param-injection** (`/callback%3fcode=x%26`) · **subdomain/www** (`www.` vs apex) · **@-trick/backslash**. Qualquer um que **não** seja rejeitado = matching frouxo. FP: exact-match rejeita tudo (Entra padrão faz exact-match).

### S-OAUTH-LEAK-01 — code/token vaza no non-happy-path (dirty dancing)
- **Sinal:** fluxo OAuth cujo `code`/`token` sobrevive na URL de uma **página de erro** que carrega 3rd-party JS / tem listener `postMessage` sem check de origin / expõe `window.name`.
- **Pattern:** P5, P3 · **Arsenal:** OAuth2 / OIDC (+ Open Redirect)
- **Hipótese:** mesmo com allowlist **estrita**, quebrar a dança (state inválido, `response_type=code,id_token` → move pro fragment, redirect_uri malformado) faz o `code` parar numa error page com sink → exfil cross-origin = **ATO**.
- **Probe:** 🟢 forçar erro no `/authorize` e ver se `code`/`token` fica na URL da landing + se a página carrega script terceiro / responde a `postMessage('*')` / seta `window.name`. 🔴 montar o gadget de exfil (browser real). FP: error page limpa a URL antes de renderizar / sem sink.

### S-OAUTH-CARRYOVER-01 — redirect_uri revalidado no passo de consent (session poisoning)
- **Sinal:** OAuth multi-etapa (`/authorize` → `/confirm_access`/consent) onde o passo de consent re-lê params do cliente (Spring `@ModelAttribute`, mass-assignment).
- **Pattern:** P5, P4 · **Arsenal:** OAuth2 / OIDC (+ mass-assignment)
- **Hipótese:** `redirect_uri` checado no `/authorize` mas **sobrescrito** por param no consent → sessão envenenada emite o `code` pro atacante (o check do passo N confia no N-1 — Q4 do The Mind).
- **Probe:** 🔴 (autenticado) mandar `redirect_uri`/`redirectUri` no POST do consent e ver se o `Location` final honra o valor injetado. FP: consent ignora params do cliente / re-valida contra o registrado.

# Gatilhos de chain (Pass 2 — composição)

Quando **dois ou mais** sinais únicos acendem no mesmo alvo, checar se casam um gatilho de chain.
É aqui que hipótese de programa maduro nasce (nenhum elo sozinho é crítico; juntos, sim).

### C-01 — WCD + CSPT → ATO
- **Composição:** `S-WCD-01` + `S-CSPT-01`
- **Hipótese:** CSPT aponta o fetch pra endpoint cacheável (`../../../v1/token.css`) → CDN cacheia o token da vítima → atacante lê = **ATO**.
- **Probe:** 🟢 ambos os probes componentes (ler JS + testar sufixo estático) já bastam pra montar a hipótese.
- **Arsenal:** COMPLEXAS › WCD+CSPT.

### C-02 — info → IDOR → ATO
- **Composição:** (`S-INFO-01` ou `S-HDR-01`) + `S-IDOR-01`
- **Hipótese:** o vazamento entrega o id/host/segredo que torna o IDOR enumerável ou o objeto sensível alcançável → escala a leitura pra ATO.
- **Probe:** 🟢 casar o que o info-leak entregou com os ids que o endpoint IDOR aceita.
- **Arsenal:** Information Disclosure + IDOR/BOLA.

### C-03 — header vazado → identidade forjada
- **Composição:** `S-HDR-01` (vaza nome/valor do header) + `S-BAC-01`/`S-IDOR-01`
- **Hipótese:** com o nome do header de confiança em mãos, forjar `x-user-id` = BOLA/ATO; `x-forwarded-for` = bypass de allowlist/rate.
- **Probe:** 🔴 reenviar com o header forjado (requer autorização — faz barulho).
- **Arsenal:** Header Injection.

### C-04 — open redirect + OAuth → roubo de token
- **Composição:** `S-REDIR-01` + `S-OAUTH-01`
- **Hipótese:** `redirect_uri` laxo no `/authorize` → `code`/`token` vaza pro domínio do atacante = **ATO**.
- **Probe:** 🟢 confirmar allowlist fraca no discovery/`/authorize` (precisa do `client_id` real do bundle).
- **Arsenal:** OAuth2/OIDC + Open Redirect.

### C-05 — CSP larga + XSS em subdomínio esquecido
- **Composição:** `S-CSP-01` + qualquer reflexão XSS em `*.alvo.com`
- **Hipótese:** XSS num subdomínio legado/staging executa no origin da app sensível (a CSP larga o autoriza).
- **Probe:** 🟢 varrer o parque de subdomínios por reflexão depois de ver a CSP.
- **Arsenal:** CSP larga por wildcard.

### C-06 — beacon → stored XSS no dashboard interno
- **Composição:** `S-BEACON-01` + destino de BI/admin que renderiza o campo
- **Hipótese:** `referrer`/`path`/`label` do beacon vira linha num painel que staff abre → blind XSS → exfil de sessão interna.
- **Probe:** 🔴 payload com callback OOB (cego — precisa de webhook próprio; requer autorização).
- **Arsenal:** Beacon de analytics como vetor.

### C-07 — invoice IDOR → payment-token → ação de pagamento
- **Composição:** `S-IDOR-01` (em invoice/`invoiceId` sequencial) + `S-PAY-01`
- **Hipótese:** ler fatura alheia → extrair payment-token → executar pagamento/postpone alheio. Info → High/Critical.
- **Probe:** 🔴 (pare-e-confirme) confirmar que o token da fatura A opera na conta A a partir da B.
- **Arsenal:** E-commerce Checkout / BNPL/Invoice.

### C-08 — IDOR de saldo + race de saque → transação fraudulenta
- **Composição:** `S-FUND-01` + `S-RACE-01` (a arapuca de fintech)
- **Hipótese:** o `S-FUND-01` prova que dá pra ler/mirar a conta/saldo; o `S-RACE-01` transforma um débito legítimo em N débitos do mesmo saldo. Juntos: mover/duplicar fundo = **worst-case do Nexo (transação fraudulenta)**, mesmo que cada elo isolado seja Medium.
- **Probe:** 🔴 (**pare-e-confirme sempre; só contas próprias, valores mínimos**) provar os dois componentes separados primeiro; só então a composição, com baseline serial.
- **Arsenal:** IDOR/BOLA + Business Logic › Race.

---
_Manter em sincronia com `arsenal.md` (toda entrada com "Sinais" espelha aqui). Liga com [[patterns]] e alimenta o `code 6`._
