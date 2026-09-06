# Airbnb — ficha de alvo

- **Programa:** Airbnb · **HackerOne** · público/open · marketplace de hospedagem + payments · bounties ativos
- **Link:** https://hackerone.com/airbnb
- **Prioridade:** 🟡 **Média (fit Alta)** (#9 no portfólio) — marketplace com papéis (Guest/Host/ProHost/SuperHost) + payments = fit BAC/IDOR+lógica; SLA elite. Eixo fraco: **saturação brutal** (~1.700 resolvidos) rebaixa o EV → mirar superfície fresca (payments / AI assistant / papéis), fugir do `www` já lavado.
- **Data de abertura da ficha:** 2026-09-06
- **Métricas H1 (via bounty-targets-data):** `offers_bounties=true` · `submission_state=open` · **resp. efficiency 100%** · **1ª resposta ~7 dias** · tempo até resolver ~2.885 dias (métrica agregada distorcida por casos antigos; portfólio anota triagem ~2d).
- **Reward (portfólio):** Crit $18k–25k (Higher Impact) · Crit cai p/ $5k (Lower Impact) · **Med $1k–5k (avg $2k, 48% dos casos)**.

## ⛓️ Constraints pré-fixadas (checar ANTES de tocar)
- **Header obrigatório:** `X-HackerOne-Researcher: {username}` em todo tráfego + **omitir cookies de sessão** quando não fizer parte do teste.
- **PROIBIDO:** mass-create de contas · brute-force de rate-limit. Só **contas próprias**.
- **3rd-party OOS.** Filler/AI-denso automático = NA (não reportar output de scanner sem exploit).
- **HotelTonight tem ambiente de teste dedicado** (`*.hoteltonight-test.com`, cartão de teste `4111 1111 1111 1111`) — usar pra lógica de payment sem tocar dinheiro real.
- **Android** pode qualificar bônus no Google Play Security Rewards.
- **Regra de escopo:** só recon/probe/PoC em host in-scope (lista abaixo). `www`/`*.airbnb.com` já MUITO lavado (~750 resolv.) → priorizar os cantos menos batidos.

## 🎯 Escopo autorizado (WILDCARD amplo — 27 assets in-scope, todos max Crit)
**Higher Impact (paga cheio, Crit $18–25k):**
- `*.airbnb.com` (WILDCARD/URL) · `*.airbnb.org` (WILDCARD) · `*.musta.ch` (WILDCARD) · **`*.airbnbpayments.com` (WILDCARD)** · `*.airbnb-aws.com` · `*.atairbnb.com` · `*.byairbnb.com` · `*.withairbnb.com` · `*.airbnbcitizen.com`
- Hosts nomeados: `api.airbnb.com` · `www.airbnb.com` · `m.airbnb.com` · `next.airbnb.com` · `one.airbnb.com` · `open.airbnb.com` · `assets.airbnb.com` · `callbacks.airbnb.com` · **`support-api.airbnb.com`**
- Apps: `com.airbnb.android` (Google Play) · `com.airbnb.app` (Apple) · `com.luxuryretreats.ios` (Apple)
- "Localized airbnb sites" (lista linkada na policy)

**Lower Impact (Crit cai p/ ~$5k):**
- `*.muscache.com` (CDN/assets) · `*.hoteltonight.com` (WILDCARD) + `www.hoteltonight.com` · `*.hoteltonight-test.com` (ambiente de teste) · `*.luxuryretreats.com` + `com.luxuryretreats.ios`

## 🚫 Fora de escopo (não tocar)
- `admin.demo.urbandoor.com` · `demo.urbandoor.com` · `provider.demo.urbandoor.com`
- `luckey.app` · `luckey.fr` · `luckey.in` · `luckey.partners` · `luckeyhomes.com`
- 3rd-party em geral · qualquer coisa fora dos 27 assets.

## O que sabemos
- **Modelo de negócio:** marketplace de 2 lados com **papéis distintos** — Guest, Host, Co-Host, ProHost (property manager), SuperHost + admin de Airbnb.org (non-profit). Cada papel = conjunto de permissões diferente sobre listings/reservas/payouts → **superfície natural de BAC entre papéis**.
- **Payments:** `*.airbnbpayments.com` é entidade de payment separada (Airbnb Payments Inc.) — payout pro host, cobrança do guest, split, resolução de disputa, moedas/FX. Fit lógica de negócio + IDOR de objeto de payment.
- **Superfície fresca (menos lavada):** AI Customer Service Assistant (Crit $18–25k, novo) · fluxos de payout/disputa · APIs de papel ProHost/co-host · HotelTonight (test env) · musta.ch (encurtador/interno).
- **Stack:** monorepo React/`Airbnb` frontend; `api.airbnb.com` REST/GraphQL; muscache = CDN.

## Hipóteses (rodar contra o The Mind) — seed 2026-09-06, a preencher com o recon
- **H1 [UNTESTED] — BAC entre papéis (Q1: quem verifica permissão):** ação de papel superior (ProHost/Co-Host editar listing, ver payout, gerenciar reserva) executável por papel inferior (Guest/Host) trocando só um id de listing/reservation/account no request. Fit `[máxima]` BAC. Precisa 2 contas próprias em papéis diferentes.
- **H2 [UNTESTED] — IDOR em objeto de payment (`*.airbnbpayments.com`):** payout_id / payment_instrument_id / dispute_id / reservation_id previsível ou trocável → ler/alterar instrumento de pagamento ou payout de outro user. Escala read→write. Usar HotelTonight test env (`4111...`) pra provar sem dinheiro real.
- **H3 [UNTESTED] — lógica de reserva/payout:** manipular preço/moeda/desconto/split entre quote e checkout; cancelamento que reembolsa guest **e** mantém payout do host; coupon/credit reaproveitável; race no crédito de referral. Fit `[máxima]` lógica.
- **H4 [UNTESTED] — AI Customer Service Assistant:** prompt-injection que faça o assistant executar ação privilegiada (acessar reserva/PII de outro user, mudar estado de conta) ou vazar dado de outro tenant. Superfície fresca, Crit alto. Verificar se é in-scope como classe (checar policy antes do PoC).
- **H5 [UNTESTED] — subdomínio órfão / takeover:** wildcard amplo (`*.airbnb.com` + 8 outros TLDs de marca) → CNAME dangling pra serviço desprovisionado. Recon Nível 1/3 alimenta isto. (⚠️ "sem tomar o sub" pode ser OOS-sem-impacto — só reportar com prova de controle.)
- **H6 [UNTESTED] — musta.ch (encurtador de marca):** se `musta.ch` gera short-links de convite/reserva, open-redirect ou enumeração de link de convite (IDOR de token). Superfície pequena e provavelmente menos olhada.
- **H7 [UNTESTED] — `S-BOLA-STALE-01` (authz stale após ciclo de vida — dojo 2026-09-06):** o marketplace tem N transições de estado onde o acesso *deveria* sumir mas o backend pode só ter checado no estado ativo → **co-host removido que ainda lê/gerencia o listing** (superfície `cohostsuccess`/`protools`), **reserva cancelada/expirada ainda acessível**, **agente deprovisionado no `partners.hoteltonight.com` cuja sessão persiste**, listing desativado ainda editável. Probe: A concede acesso a B → captura request de B → A **revoga** → replaya request de B → 200-com-dado = achado. Fit `[máxima]` BAC, family *Workflow-Context*. Não depende de valor — só de 2 papéis próprios + revogação.
- **H8 [UNTESTED] — `S-CRYPTO-ORACLE-01` (oráculo de cifra — dojo 2026-09-06):** procurar o par (gerador de ciphertext ↔ consumidor que confia). Candidatos: **URLs de imagem assinadas do `muscache.com`/`imagery.hoteltonight.com` (imgix)** — se a assinatura cobre um path/param manipulável e há endpoint que gera assinatura de input arbitrário → forjar URL/param; **params de iframe de payment assinados (`iframes.airbnbpayments.com`)** — blob cifrado de preço/identidade reusável entre contextos. Raro mas alto impacto. 🟢 primeiro: mapear onde os dois lados existem.
- **H3 reforço (`S-LOGIC-THRESHOLD-01` — critério revogável):** o recon achou `business.giftcards.withairbnb.com` + `ca.business.giftcards.withairbnb.com` (403, vivos). Angulo concreto pra H3: benefício condicionado a limiar (gift-card por valor mínimo, desconto por threshold de reserva, tier ProHost por volume) aplicado e **revertido antes do commit** (satisfaz critério → aplica → desfaz → finaliza). Testar no HotelTonight test env (cartão 4111...).
- **Regra de priorização (taxonomia BOLA, dojo 2026-09-06):** a família **Action-Level** (verbo mutante sobre objeto alheio) é a MAIOR (41.7%) — quando eu tiver conta, mirar **POST/PATCH/DELETE cross-owner na Partner API** (`reservations-api`/`messages-api` do `developer.withairbnb.com`) **antes** da leitura. E todo `gid`/id "opaco" da API: base64-decode → tentar incrementar o int do backend antes de dar por não-enumerável.

## Recon
- **Escopo WILDCARD amplo** → recon massivo (Nível 3) **se aplica**, ao contrário do Nexo. Mas `*.airbnb.com` retorna milhares e já foi lavado → estratégia: enumerar **tudo** passivamente, mas **priorizar leads nos cantos menos batidos**.
- **Nível 1 (passivo) — FEITO 2026-09-06** (subfinder -all + crt.sh, só terceiros, zero-toque): **7712 subs únicos**. Cru em `recon/subs_all.txt`; leads curados em `recon/LEADS.md`.
- **Leads que batem nas hipóteses (nada probado ainda — Nível 1 é passivo):**
  - **Payments (H2):** `login.` / `gateway.` / `iframes.` / `chat.` / `vpn.airbnbpayments.com` — iframe PCI/postMessage + gateway de payout + login separado.
  - **Host/Co-Host/ProHost (H1):** `host.` / `hostadvance.` / `hosting.` / `cohostsuccess.` / **`protools.`** / `multifamily-backend.` / `affiliate.withairbnb.com` — ferramentas de papel elevado.
  - **HotelTonight partners (H1/H3):** `partners.` / `beta-partners.hoteltonight.com` + `*.hoteltonight-test.com` (test env, cartão 4111...).
  - **Infra marketing/WP (low-hanging Tier B):** `cpanel.multifamily.` / `whm.` / `wpadmin.` / `webmail.multifamily.withairbnb.com` — cPanel/WP expostos em marca in-scope.
  - **Infra interna `*.musta.ch` (Tier C, in-scope mas prob. atrás de VPN):** `argocd.prod.` / `artifactory.` / `auth.` / `console.prod.galileo.musta.ch` — ArgoCD/Artifactory; Nível 2 confirma alcançabilidade em 1 GET.
- **Nível 2 (médio) — FEITO 2026-09-06** (httpx+CORS+katana nos 37 leads curados; header `X-HackerOne-Researcher: moldret`, rate 5): 11 resolvem, 9 respondem. CORS **limpo** (sem win de header). Apps de papel vivas: `hostsuccess`/`cohostsuccess` (Rails LMS "student", centrifugo+axios), `partners.hoteltonight.com` (`/agents/sign_in`), `developer.withairbnb.com` (**Partner API docs** + sandbox), `wpadmin` (WordPress VIP), `iframes.airbnbpayments.com` (403 S3). Cru: `n2_probe.jsonl`, `n2_cors.json`, `n2_endpoints.txt`.
- **Nível 3 (completo) — FEITO 2026-09-06** (amass+dnsx+httpx em massa nos 7712, rate 20): **406 resolvem, 322 respondem**. Novos: `api-docs.hoteltonight.com`, `k8s-oidc-provider.musta.ch` (403 alcançável — OIDC interno), auth-gated 401 (`community-staging`, `ice.hoteltonight`, `impact-assets`), `imagery.hoteltonight.com` (imgix). Painéis internos (argocd/artifactory/login.payments/gateway.payments) **sem DNS público** → não-alcançáveis. Cru: `probe_all.jsonl`, `resolved_all.txt`.

## Caça — Nível 0 (unauth), sessão 2026-09-06 (`modo hunter` + `armar a arapuca`)
Inventário de peças em `arapuca.md`. Vereditos do Nível 0:
- **Partner API (`developer.withairbnb.com`):** ReadMe.io 3rd-party + gated por OAuth de parceiro (`oauth.readme.io/p/airbnb-group`). 3 linhas: homes/activities/distribution. `[UNTESTED — bloqueado: cred de parceiro]`.
- **`hostsuccess`/`cohostsuccess`:** plataforma **Disco (SaaS 3rd-party)** em domínio in-scope → vuln interna prob. **OOS**. `[DEPRIORITIZADO]` (só takeover/dado-Airbnb sobrevive).
- **`partners.hoteltonight.com`:** portal Rails de agentes, sign_in/reset vivos. `[UNTESTED — bloqueado: conta de agente]` (user-enum testável com cuidado).
- **`iframes.airbnbpayments.com`:** S3+CloudFront, 403 em tudo (precisa objeto assinado). Semente da H8. `[UNTESTED — opaco]`.
- **`k8s-oidc-provider.musta.ch`:** S3-fronted, discovery/JWKS 403 não-públicos. `[FP — FECHADO no Nível 0]`.
- **Veredito da sessão:** Nível 0 exaurido; **todas as chains vivas travam no mesmo elo = CONTAS**. Próxima camada precisa self-signup (Guest/Host em `airbnb.com`) e, pra Partner API/agentes, cadastro de parceiro.

## 🔑 Modelo de auth da API (capturado 2026-09-06, sessão logada do Tiago)
- **GraphQL persisted-query (Viaduct):** `GET/POST /api/v3/{OperationName}/{sha256Hash}?operationName=&locale=&currency=&variables={json}&extensions={persistedQuery:{version:1,sha256Hash}}`. Endereçado por **nome+hash**.
- **`X-Airbnb-API-Key: d306zoyjsyarp7ifhu67rjxn52tv0t20`** = **chave pública web conhecida** (NÃO é segredo — reportar = NA/dupe). Auth real = **cookie de sessão**.
- **`variables` (JSON) 100% client-controlled** = superfície de IDOR/tampering. `currency`/`locale` também.
- **Routing leak** (`x-server-canonical-path`): existem `/api/v3/viaduct/external/{op}/{64hex}` e `/legacy-psf/` além do v3 normal.
- **CSRF:** `X-CSRF-Without-Token: 1` (checar se GET-persisted-query consegue mutar → CSRF-via-GET).
- **Host:** `www.airbnb.com.br` (localized site — ⚠️ confirmar que `.com.br` está na lista "Localized airbnb sites" da policy antes de reportar; o app/API é o mesmo do `.com`).
- **Viewer capturado:** guest (`isExperienceHostV2:false, isServiceHost:false`). Surface-map do menu → alvos: `/wishlists` `/trips` `/guest/inbox` `/account-settings` `/refer?r=67` `/co-hosts/home` `/giftcards`.

## Caça — Nível 1 autenticado (sessão do Tiago via Playwright, 2026-09-06)
Setup: Playwright dirige Chromium/Firefox/WebKit com a sessão do Tiago (cookies fora do git). 31 ops `/api/v3` capturadas autonomamente (`recon/hunt/ops_capturadas.json`). user id do Tiago = `1768931195641399446` (gid `VXNlcjox...` = base64 `User:<id>` — confirma lição dojo).

**Modelo de authz descoberto: "Himeji"** — sistema de autorização por-objeto do Airbnb. Ops `node`-based checam `HimejiMetadata(entityType=USER, entityPart=CONTEXTUAL_USER_OWNER)` → acesso cross-user retorna `Permission denied for id <gid>`.

**Vereditos (caracterização segura: meu id vs ids inexistentes):**
- `UserResidenceCountryQuery` (`id` gid) → **FP** (Himeji nega id alheio).
- `ProfileReintroductionQuery` (`userId` gid) → **FP** (Himeji nega).
- `AccountSettingsVisibilityQuery` (`userId` gid) → **FP** (usa `viewer`; param decorativo).
- 🎯 **`HostPayoutHistoryQuery` (`userId` numérico cru) → LEAD [UNTESTED — bloqueado: precisa host com payout]:** mapeia `payments.veniceProductTransactionsByUser(userId)` = **histórico financeiro**. **NÃO** retornou o "Permission denied" do Himeji pra id não-meu (id=0 → 200 estrutura vazia, ≠ das irmãs). Sugere ausência do check CONTEXTUAL_USER_OWNER nessa op. Prova = chamar com `userId` de host que tenha payout → se retornar = **BOLA financeiro (Crit)**. Bloqueado: meu id tem payout vazio (não sou host) → não distingo "ignora param" de "lê user alheio vazio"; confirmar exige 2ª conta minha feita host, NUNCA id de terceiro real.

**T1 (`formação tridente`) fechado — SameSite `[FP — Informative/Low]`:** cookies de sessão sem SameSite (Blink=Lax vs WebKit/Gecko=None, divergência real confirmada nos 3 engines) — mas `csrf_probe.js` provou que `X-Airbnb-API-Key` é **obrigatório** em toda request (400 sem ele) e não é setável em request cross-site (CORS preflight não liberado) → CSRF via SameSite-gap **não-explorável**. Defense-in-depth funcionando. Detalhe em `tridente.md`.

## Achados
| Data | Severidade | Tipo | Endpoint | Status (rascunho/enviado/aceito) |
|------|-----------|------|----------|----------------------------------|
| — | — | — | — | nenhum confirmado; 1 lead quente (`HostPayoutHistoryQuery`) bloqueado em conta-host |

## Nível de recon atingido
- **2026-09-06:** ✅ **Níveis 1+2+3 COMPLETOS** ("rodar tudo"). Passivo (7712 subs) → médio (37 leads probados) → completo (322 hosts vivos). Superfície mapeada, leads em `recon/LEADS.md`. **Pronto pro `modo hunter`** nos leads Tier A (payments/host/partner-API).
