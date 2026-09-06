# Airbnb — arapuca (inventário vivo de peças fracas) 🪤

Inventário do `protocolo armar a arapuca` (ligado 2026-09-06, junto com o `modo hunter`).
Cada peça individualmente sub-crítica; o passo de combinação procura a cadeia que vira High/Crit.
**Regra:** peça só entra se **real e reproduzível**. Herda escopo Airbnb + header `X-HackerOne-Researcher: moldret`.

## Peças (Nível 0 — unauth, sem contas ainda)

| id | peça (1 linha) | acesso p/ usar | sev isolada | o que HABILITA |
|----|----------------|----------------|-------------|----------------|
| A1 | **Partner API docs (`developer.withairbnb.com`) = ReadMe.io 3rd-party + gated por OAuth de parceiro** (`oauth.readme.io/p/airbnb-group`). Leaks: 3 linhas de produto **homes** (reservations/listings/messages/support-cases), **activities**, **distribution** (embed widget, `stayssearch`) + host de integração `airbnb-group-rm-a1c858df267f.herokuapp.com` | unauth | Info | mapa de endpoints da Partner API (`api.airbnb.com`) quando tiver cred de parceiro; heroku host = recon 3rd-party (prob. OOS) |
| A2 | **`hostsuccess`/`cohostsuccess.withairbnb.com` = plataforma Disco (SaaS 3rd-party)** rodando em domínio in-scope; Rails, cookies `_base_session`/`tid`, centrifugo (WS), rota `/student/…`, `request_password_reset` viva (200) | unauth | Nenhuma | ⚠️ vuln interna do Disco = **provável OOS (3rd-party)**; só sobrevive **subdomain-takeover** (se o tenant Disco for desprovisionado) ou IDOR que exponha **dado de host Airbnb** (cinza). **Deprioritizar** |
| A3 | **`partners.hoteltonight.com` = portal Rails de agentes** (in-scope, Lower Impact); `/agents/sign_in` + `/agents/password/new` vivos (200); `/agents`→302 | unauth | Nenhuma | user-enum via diferencial do reset (Devise default) — **testar com cuidado, sem brute** (dispara e-mail se a conta existir); base pra `S-BOLA-STALE-01` se conseguir conta de agente |
| A4 | **`iframes.airbnbpayments.com`/`-dev` = S3+CloudFront**, 403 em `/ /health /robots.txt /version /static/` (precisa objeto/path assinado) | unauth | Nenhuma | semente da **H8 (`S-CRYPTO-ORACLE-01`)** SE achar o endpoint que gera a assinatura/param do iframe; hoje opaco |
| A5 | **`k8s-oidc-provider.musta.ch` (+staging)** — testado: `/.well-known/openid-configuration`, `/jwks.json`, `/`, `/healthz` todos **403**; staging cospe **`AccessDenied` XML de S3** = fronteado por S3/CloudFront, discovery/JWKS **não públicos** | unauth | Nenhuma | ❌ **FECHADO no Nível 0** — sem leak de metadata/chave; reabrir só se surgir path/objeto assinado |

## Peças (Nível 1 — 1 conta autenticada, capturada 2026-09-06)

| id | peça (1 linha) | acesso p/ usar | sev isolada | o que HABILITA |
|----|----------------|----------------|-------------|----------------|
| A6 | **API = GraphQL persisted-query (Viaduct)**, auth por cookie; `variables` (JSON) 100% client-controlled; API-key pública (não-segredo) | 1 conta | Info | toda IDOR/tampering vive em `variables`; base de A7–A9 |
| A7 | **Surface de objetos com id** no menu: `/wishlists` `/trips` `/guest/inbox` `/co-hosts/home` — cada um tem operação GraphQL que carrega id de objeto | 1 conta | Nenhuma | **BOLA (`S-IDOR-01`/Action-Level)**: trocar id do objeto próprio pelo de outra conta → ler/escrever alheio. Precisa capturar as ops + 2ª conta |
| A8 | **`/refer?r=67`** — referral com código `r=67`; **`/giftcards`** — saldo/resgate | 1–2 contas | Nenhuma | **lógica**: self-referral (indicar a 2ª conta), reward manipulável (`S-LOGIC-THRESHOLD-01`), race no crédito; gift-card redemption/threshold |
| A9 | **`/co-hosts/home`** — fluxo de co-anfitrião (adicionar/remover co-host) | 2 contas (papel) | Nenhuma | **H7 `S-BOLA-STALE-01`**: adicionar co-host (conta B) → capturar acesso de B → remover B → replay → 200-com-dado = stale authz |
| A10 | **Hash-enforcement testado (2026-09-06):** hash bogus → **`400 persisted_query_not_found`**. APQ com **allowlist server-side** — só ops registradas rodam; **sem query arbitrária/introspection** por hash desconhecido | 1 conta | Nenhuma | ❌ **FECHADO** — postura de segurança a favor deles. Consequência: pra chamar op preciso do **hash válido** (colher do JS/tráfego); **BOLA continua vivo** pois o hash só amarra o *texto* da query, não os `variables` |

## Peça (tridente — camada client, 2026-09-06)
| id | peça (1 linha) | acesso p/ usar | sev isolada | o que HABILITA |
|----|----------------|----------------|-------------|----------------|
| A11 | **CSP fraca** (`www.airbnb.com`, enforce): `script-src` tem bare **`https:`** + `'unsafe-eval'`; `frame-src *`; `default-src https:` — allowlist/nonces neutralizados | unauth | Info (isolada) | **habilitador de chain C-05**: qualquer XSS/injeção em `*.airbnb.com` carrega script https externo apesar da CSP → de reflexão fraca a XSS pleno. `S-CSP-01`. Só vale com uma injeção pra chainar |

## Passo de combinação (rodar a cada 3–4 peças)
Rodado 1× com A1–A5 (2026-09-06):
- **A1 + Partner API:** o valor real da Partner API (`api.airbnb.com`, in-scope) só destrava com **credencial de parceiro** — A1 sozinho é só o mapa. Sem conta = sem chain.
- **A3 (conta de agente) + `S-BOLA-STALE-01` (H7):** se conseguir 2 contas de agente no HotelTonight partners → testar authz stale (revogar agente, replay). Elo faltando: **contas**.
- **A4 + A1:** o iframe de payment assinado (A4) + doc da Partner API (A1) poderiam revelar o par gerador↔consumidor da H8 — mas ambos gated. Elo faltando: **acesso autenticado**.
- **Veredito do passo:** **todas as cadeias vivas travam no mesmo elo — CONTAS**. Nível 0 (unauth) já deu o que tinha a dar aqui; o valor está no Nível 1+ (1–2 contas).

## Passo de combinação #2 (2026-09-06, pós Nível 1 autenticado — A6–A12 + Himeji)
- **Padrão confirmado:** Himeji (`entityType=USER/entityPart=ALL|CONTEXTUAL_USER_OWNER`) protege a **maioria** das ops `node`-based com id de user (4 de 5 testadas: `UserResidenceCountryQuery`, `ProfileReintroductionQuery`, `HostRecommendedActionsCountQuery`, + `AccountSettingsVisibilityQuery` via viewer). **`HostPayoutHistoryQuery` é a única exceção observada** — não dispara o "Permission denied" padrão.
- **Por que isso é significativo:** numa arquitetura com um authz-framework central (Himeji) aplicado consistentemente, uma op que **não o usa** geralmente significa "endpoint mais antigo/legado" ou "resolver que delega authz pra outra camada que pode ter lacuna". `veniceProductTransactionsByUser` (namespace "venice" = serviço de payments) pode viver num subgraph federado que não herda o wrapper Himeji do subgraph User.
- **C-A (BOLA→PII) rebaixada:** as ops de objeto único-usuário estão bem protegidas por Himeji; o vetor de maior EV real é hoje **A12 (payout)**, não mais C-A genérica.
- **Elo que falta pra TODAS as pontas vivas:** uma 2ª entidade (conta host com payout, ou conta B qualquer) — sem isso, Nível 1 (1 conta) está **exaurido** nas ops descobertas até agora.

## Melhor chain candidata agora
**A12 (`HostPayoutHistoryQuery` sem Himeji) — maior EV, menor esforço restante.** Só precisa: (1) qualquer conta host própria com ≥1 payout registrado (não precisa ser nova — se o Tiago tiver/puder virar host de teste), (2) 1 GET a mais trocando `userId` pela conta B. Se confirmar → **BOLA financeiro Crit**, reporta direto (sem precisar de escada de jacó, o teto já é alto). Se `Permission denied` → FP, mas explica a exceção observada (pode ser diferença de *serialização do erro*, não de authz).

## Bloqueio-mestre (pra retomar)
🔑 **Precisa de contas Airbnb.** Camadas:
- **Guest/Host comum:** self-signup grátis em `airbnb.com` → destrava H1/H3/H7 no app principal (papéis Guest↔Host, reserva, gift-card).
- **2ª conta:** pra IDOR/BAC cross-account real (Nível 2 do One Piece).
- **Partner/agente (HotelTonight/Partner API):** cadastro de parceiro (mais difícil; pode exigir aprovação) — destrava A1/A3.

---
# 🛞 descobrir a roda — 2026-09-06 (reconstrução do sistema → ideias de achado)

## 1. Modelo do sistema (hipótese explícita, não fato)
```
[cliente web/mobile] ──cookie+API-key pública+Airlock──▶ [Akamai CDN/edge]
      │                                                        │ cache (cachestatus/cdn-cache MISS)
      │                                                        ▼
      │                                                [nginx ingress] ─▶ [Envoy service mesh]
      │                                                        │
      │        ┌───────────────────────────────────────────────┼───────────────────────────┐
      ▼        ▼                         ▼                       ▼                            ▼
  /api/v2 (REST legacy)      /api/v3/{Op}/{hash} (APQ)   /api/v3/viaduct/external/   /legacy-psf/
  ex: /api/v2/logout          Viaduct GraphQL federado     entrypoint "external"      presentation legacy
                              (allowlist server-side)      (authz igual? — UNTESTED)
                                     │
                     ┌───────────────┼──────────────┬───────────────┬───────────────┐
                     ▼               ▼              ▼               ▼               ▼
                subgraph          subgraph       subgraph        subgraph        subgraph
                Reservations      Messaging      Listings/Host   Payments        User/Identity
                (/trips)          (/guest/inbox) (/co-hosts)     (airbnbpayments)(profile/roles)
                                                                    │
                                                        [Airbnb Payments Inc. — entidade separada]
                                                        iframes (S3) · payout · dispute · gift cards
Papéis (User flags): guest · host · experience-host · service-host · co-host · ProHost · SuperHost · Airbnb.org admin · HT agent · partner(OAuth)
Portas paralelas p/ o MESMO recurso (listing/reserva): (a) web UI como host · (b) Partner API OAuth (delegado) · (c) co-host
Anti-abuso: Airlock V2 + sureride/erf-bev (risco/bot) — camada que pode falhar aberto
```

## 2. Engenharia reversa das suposições (as 6 perguntas em cada costura)
- **Costura edge→origin (Akamai→Envoy):** *Q5/Q6* — a chave de cache confia em quê? op GraphQL GET cacheável + no-store só em alguns → **WCD** (cachear response autenticada de outro). Header vem `no-store`, mas nem toda op vem.
- **Costura APQ→resolver:** *Q2* — o hash trava o **texto**, o resolver confia nos **`variables`** → **BOLA** (id de objeto trocável). É a costura mais frágil e mais barata de testar.
- **Costura federação Viaduct (subgraph A stitcha campo de B):** *Q1* — a query autorizada pelo subgraph pai devolve **campo filho** de outro subgraph **sem authz por-campo** → `reservation.guest.paymentMethods`, `thread.participant.email/phone` (**field-level BOLA**).
- **Costura `/viaduct/external/` vs named-op:** *Q3* — caminho alternativo pro mesmo grafo; o entrypoint "external" impõe a MESMA authz que a op nomeada? (caminho secundário = clássico bypass.)
- **Costura web-session ↔ Partner-OAuth ↔ co-host (3 portas pro mesmo listing):** *Q3/Q1* — a UI web barra a ação X num listing, mas a Partner API (delegada) ou o fluxo co-host aceita X em **qualquer** listing id (authz mais grosseira). Padrão "duas portas pro mesmo recurso" (= caso Google Apps Script no banco BAC).
- **Costura papel/estado (guest→host→co-host, add/remove):** *Q4* — authz checada no add, **não re-checada** após remove → **co-host removido ainda gerencia** (H7 / `S-BOLA-STALE-01`).
- **Costura locale/moeda (.com ↔ .com.br ↔ N mercados):** *Q3/Q5* — mesma app, N hosts; sessão de um vale no outro? objeto de um mercado acessível noutro? `currency`/`locale` nos `variables` mudam **preço/lógica** entre quote e pay.
- **Costura Airbnb↔Airbnb Payments (entidade separada):** *Q5* — o handoff booking→payment→payout cruza fronteira; params/token assinados entre os dois (**H8 oráculo de cifra**).
- **Costura Airlock (anti-abuso):** *Q6* — se o check de risco expira/falha, libera ou bloqueia? **fail-open** em ação sensível.

## 3. Mapa do não-testado (ranqueado por fragilidade do modelo)
1. **BOLA em op com id de objeto** (`variables` tampering: inbox thread, wishlist, reserva, user) — **alta** · barato · falta: hashes das ops + 2ª conta.
2. **Field-level BOLA na federação Viaduct** (campo filho sensível sem authz: email/phone/paymentMethods) — **alta** · falta: capturar ops "gordas".
3. **Divergência Partner-API vs web** (mesmo listing, portas diferentes) — **alta** · falta: cred de parceiro.
4. **`/api/v3/viaduct/external/{op}`** impõe authz igual? — **média-alta** · falta: um hash de op p/ testar nos 2 caminhos.
5. **Co-host add/remove stale authz (H7)** — **média-alta** · falta: 2 contas + 1 listing.
6. **Cross-locale sessão/objeto** (.com↔.com.br) — **média** · **barato** (testável já com 1 conta).
7. **Tampering de `currency`/`amount`/`locale`** em op de preço/quote — **média** · falta: op de booking/quote.
8. **Referral self-abuse + race** (`/refer?r=67`) — **média** · falta: 2 contas.
9. **Gift-card threshold/redemption** (`/giftcards`) — **média** · falta: fluxo de compra/resgate.
10. **WCD em op GraphQL cacheável** — **baixa-média** · testável com 1 conta (achar op sem no-store).
11. **CSRF-via-GET em mutation** (persisted GET que muta estado) — **baixa-média**.
12. **Airlock fail-open** em ação sensível — **baixa** (difícil testar sem barulho).

## 4. Cadeias narrativas (multi-passo, "se o modelo estiver certo")
- **C-A — BOLA → PII → ATO (a de maior EV):** colher hash de op de reserva/thread no JS → chamar com id da 2ª conta (ou enumerado) → se 200-com-dado → ler PII/mensagens do outro guest → **escalar field-level**: a thread expõe email/phone da contraparte → vetor de account-recovery → ATO. *Alimenta:* A6/A7. *Falta:* hashes + authz por-campo.
- **C-B — Duas portas (Partner-API bypass):** como host, a UI barra ação X no listing; a Partner API delegada aceita X em **qualquer** listing id (authz grosseira) → controle de listing de outro host. *Alimenta:* A1. *Falta:* cred de parceiro. (padrão Apps Script.)
- **C-C — Co-host stale → controle persistente (a mais fresca):** convido co-host B → B captura as ops de gestão → dono remove B → B replaya → ainda gerencia reservas/payout do listing → **acesso não-autorizado persistente**. *Alimenta:* A9/H7. *Falta:* 2 contas + listing.
- **C-D — Lógica de moeda/preço:** op de quote com `currency`/`amount`/`locale` adulterado entre quote→pay → pagar em moeda mais barata / mismatch de payout. *Alimenta:* A8. *Usa:* `S-LOGIC-THRESHOLD-01` + input não-convencional.
- **C-E — Oráculo do handoff de payment:** achar o signer que gera os params do iframe `airbnbpayments` (H8) → forjar blob de preço/identidade aceito pela entidade de payment. *Alimenta:* A4. *Difícil.*
- **C-F — Referral race → farming de crédito:** self-refer a 2ª conta → race no endpoint de crédito (`S-RACE-01`) → multiplicar crédito → aplicar em booking/gift-card. *Alimenta:* A8.

## ▶️ Próxima a executar
**C-A (BOLA em op com id de objeto)** — maior EV × menor barreira: só precisa de **(1) capturar 1 op com id** (inbox/wishlist/trips) e **(2) a 2ª conta**. Paralela de baixo custo agora, com 1 conta só: **não-testado #6 (cross-locale)**. Fresca e diferenciada: **C-C (co-host stale, H7)**.

## 🎯 LEAD QUENTE — HostPayoutHistoryQuery (Nível 1 autenticado, 2026-09-06)
| id | peça | acesso | sev isolada | o que HABILITA |
|----|------|--------|-------------|----------------|
| A12 | **`HostPayoutHistoryQuery` → `payments.veniceProductTransactionsByUser(userId)`** — histórico financeiro por `userId` numérico cru. **Evidência:** (a) o campo É parseado/usado (`9999999999999999999`→ValidationError overflow int64; `0`→200 vazio; meu id→200 meus dados); (b) id não-meu **NÃO** recebe o `Permission denied` do **Himeji** que as ops irmãs (`UserResidenceCountryQuery`/`ProfileReintroductionQuery`) recebem | 1 conta | **potencial Crit** (não confirmado) | **BOLA financeiro** se um `userId` de host com payout retornar dados. **Bloqueio:** meu id tem payout vazio → não distingo "sem check + user vazio" de "deny-como-vazio". Confirmar = 2ª conta minha feita **host com payout**, NUNCA id de terceiro |

**Próximo elo (seguro):** conta B própria que seja host e tenha ao menos 1 payout → do contexto da conta A, chamar `HostPayoutHistoryQuery` com `userId` da B → 200-com-transações = BOLA Crit; `Permission denied` = FP (Himeji cobre, só estilo de erro difere).

**Mais 2 ops caracterizadas (2ª passada de captura, hosting/messages):**
- `HostRecommendedActionsCountQuery` (`userId` gid) → **FP** (Himeji `entityType=USER, entityPart=ALL, accessLevel=READ` nega id não-meu — reforça que Himeji é a norma; `HostPayoutHistoryQuery` é a exceção).
- `UserDirectMessageQuery` (`userId`+`destinationUserId`, ambos gid) → resposta **idêntica** pra qualquer `destinationUserId` (0/big/próprio) — o `node` resolvido é sempre `userId` (eu); `destinationUserId` só alimenta um booleano `canDmUser` de elegibilidade. **Baixo valor mesmo sem authz explícita** (checagem de "posso mandar DM" é esperada ser pública/por-design pra permitir contato pré-reserva). Não perseguir mais.

## Vereditos dos probes (2026-09-06, sessão do Tiago)
- **Não-testado #4 (`/viaduct/external/Header/{hash}`):** → **404**. Entrypoint "external" não roteia essa op nomeada; rebaixado (o path existe no regex mas não é bypass trivial pra op persisted). Reabrir só se surgir uma op que use `/viaduct/external/` no tráfego real.
- **inject-`userId` no Header:** viewer **idêntico** → resolver ignora, usa id do token. Sem mass-assignment no Header (testar `S-IDOR-02` por-op nas ops de **escrita**).
- **locale/currency swap:** aceito (200) → base do tampering de moeda (C-D), mas só rende em op de **preço/quote**.
- **JS-harvest de hashes:** os hashes de persisted-query **não estão nos common bundles** (`niobe` usa build-time id; chunks lazy por-rota). → **capturar a op ao abrir a rota** é o caminho eficiente pra obter `operationName+hash+variables`.
