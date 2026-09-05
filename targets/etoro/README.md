# eToro — ficha de alvo

- **Programa:** eToro Managed BBP · **Bugcrowd** · fintech / social trading (multi-asset) · Safe Harbor · **triagem expedita**
- **Link:** Bugcrowd (eToro Managed Bug Bounty Engagement) · docs: https://help.etoro.com
- **Prioridade:** 🟢 **ALTA ⭐** — top pick pro 1º bounty (wildcard fintech + triagem rápida + paga lows)
- **Escopo (3/4, amplo):**
  - **`*.etoro.com`** (wildcard — 37 known issues, main já garimpado)
  - delta.app (ReactJS) · etorox.com (.NET/IIS) · etoropartners.com (.NET/IIS)
  - Mobile: com.etoro.wallet · com.etoro.openbook · io.getdelta (iOS/Android)
- **Reward:** P1 $6k–15k · P2 $1.5k–6k · P3 $500–1000 · P4 $100–500. Avg $618/3mo (⇒ **paga muitos lows** = 1º bounty acessível).
- **Stats:** 66 vulns premiadas · **validação em 2 dias** (75% decididos em 2d) · triagem expedita Bugcrowd.

## ⛓️ Constraints pré-fixadas
- Conta self-provisioned com e-mail `@bugcrowdninja.com` (pode registrar várias).
- **Header obrigatório:** `X-Bug-Bounty:<bugcrowdusername>` em todo tráfego HTTP.
- Registrar antes de testar: IP, user-agent, usernames usados (podem pedir).
- **🚫 Sem tooling de volume / stress / DoS / rate-limit bypass / email bombing.** Upload: máx ~75 arquivos.
- **🚫 Não tocar em contas de terceiros** sem consentimento escrito; não acessar dado de usuário/empresa.
- N-day: só in-scope após 30 dias do patch público.
- Fora de escopo notável: Clickjacking/CORS (usam Cordova), Facebook SDK mobile, enumeração, self-XSS, rate-limit.
- **OOS com bônus discricionário:** ativos da eToro fora da lista podem ser aceitos se impacto claro (reward ~50% menor + bônus se alto impacto).

## 🎯 Onde mirar (fit BAC/lógica) — INSIGHT PRINCIPAL
- **O main `etoro.com` já tem 37 known issues → está garimpado.** Mire os **ativos secundários** com 0–2 known issues:
  - **delta.app (ReactJS SPA)** → client-side + API = IDOR/BAC com menos gente olhando.
  - **etorox.com / com.etoro.wallet / openbook** → superfícies mais novas.
- Lógica de fintech social = ouro pro seu perfil:
  - **Copy-trading** (copiar carteira de outro): quem autoriza o quê? acesso a portfólio/posições alheias?
  - **Carteira / saldo / ordens**: IDOR de posição, manipulação de valor/fee, lógica de execução.
  - **Social features** (feed, perfis, seguir): acesso não-autorizado a dado de outro trader.
- Rodar as 6 perguntas do The Mind em cada endpoint de API.

## Recon
- `code 0` no wildcard `*.etoro.com` pra enumerar subdomínios (aqui o recon rende — wildcard grande). Depois focar manual nos secundários.
- Sempre com o header `X-Bug-Bounty`. Sem scanners de volume.

---

## 🏦 Recon massivo — `protocolo ladrão de bancos` (2026-09-05, fase PASSIVA)
Fontes: subfinder (passivo) + crt.sh nos 4 domínios in-scope. **574 subdomínios únicos** (etoro.com/etorox.com/etoropartners.com/delta.app). Distribuição: `.int.` 40 · `.stg.` 34 · `.dev.` 43 · `.preprod.` 12 · prod/outros ~445. Cru em `recon/subdomains.txt`.
⚠️ **NADA foi probado ainda** — todo host abaixo está `[não-probado]`; a fase ativa (httpx/katana) precisa do header `X-Bug-Bounty:<username>` (pendente). `gau` falhou (0 urls); waybackurls retentando.

### Clusters de alto valor (fintech) → mapeados aos sinais do `memory/signals.md`
| Cluster | Hosts-chave | Sinal | Por que |
|---|---|---|---|
| 💳 **Webhooks de custódia** | `bitgowebhook.wallet`, `prod-cfireblockswebhook.wallet`, `simplex.wallet`, `billing-pci`, `int/stg-bitgowebhook` | **S-WH-01 / S-PAY-01** | webhook de BitGo/Fireblocks/Simplex sem verificação de assinatura → forjar confirmação de depósito/transfer = $$$. **Topo.** |
| 🪙 **Wallet / signing** | `sign.goodwallet`, `iam.sign.goodwallet`, `relay.sign.goodwallet`, `wallet.etoro.com`, `money-front-public.wallet` | S-IDOR-01 / S-WH-01 | infra de assinatura de tx cripto; IDOR de saldo/posição; relay abusável |
| 🔐 **OAuth sprawl** | `oauth-back/front/ob.wallet`, `oauthob`, `oboauth`, `stg-walletoauth.dev`, `login.api`, `auth.stg` | **S-OAUTH-01 / S-REDIR-01** | 6+ hosts OAuth no wallet → `redirect_uri` frouxo/token leak = ATO (ver técnica nova no arsenal) |
| 🚪 **Gateways / BFF** | `apigw-bff.dev/int`, `apigw.dev/int`, `public-api.int/stg`, `gateway.cloud` | **S-IDOR-02 / S-HDR-01** | BFF é ninho de BOLA/IDOR; gateway pode não stripar headers internos de confiança |
| 🛠️ **Back-office / admin** | `bo.prod/int/stg`, `admin.connect`, `mail.bo.int` | **S-BAC-01 / P7** | painel admin/BO force-browsável; authz por rota |
| 🤖 **MCP server** | `mcp.public-api.etoro.com`, `mcp.public-api.stg` | (novo — LLM) | servidor MCP exposto → prompt injection, abuso de tool, auth do MCP |
| ⚙️ **Infra CI/monitor** | `jenkins.candle`, `jenkins.go`, `grafana.connect` | S-INFO-01 / P7 | Jenkins/Grafana no DNS público → se unauth = RCE/dashboard interno |

### Hipóteses [UNTESTED] priorizadas (fit BAC/lógica + fintech)
1. **[UNTESTED · S-WH-01] Webhook de custódia sem verificação de assinatura** — `bitgowebhook`/`cfireblockswebhook`/`simplex.wallet`: POST forjado com `status:success`/payload de depósito → crédito sem pagar. **Maior EV.** Probe (ativo): mapear o path do webhook, testar payload sem assinatura/replay. ⚠️ pare-e-confirme (mutante).
2. **[UNTESTED · S-OAUTH-01/S-REDIR-01] `redirect_uri` no OAuth do wallet** — os 6+ hosts oauth: allowlist frouxa → roubo de code/token = ATO. Probe: puxar `/.well-known/*`, variar `redirect_uri` (unauth, lê o erro).
3. **[UNTESTED · S-IDOR-02] BOLA no `apigw-bff` / `public-api`** — BFF concentra chamadas por-usuário; `userId/accountId` no body → dado alheio. **Bate no seu ponto forte.** Precisa 2 contas `@bugcrowdninja.com`.
4. **[UNTESTED · S-BAC-01] Back-office force-browse** — `bo.*`, `admin.connect`: authz só na UI? chamar rota interna direto.
5. **[UNTESTED · lógica copy-trading]** (do insight da ficha) — copiar carteira: acesso a portfólio/posições alheias; manipular fee/valor.
6. **[UNTESTED · MCP] `mcp.public-api`** — enumerar tools do MCP, testar auth e injeção.
7. **[UNTESTED · P7] Jenkins/Grafana** — checar se `jenkins.*`/`grafana.connect` respondem unauth.

8. **[UNTESTED · S-REDIR-01] Open redirect** — Wayback (6000 urls, `recon/urls.txt`) mostra params `TargetURL=` (9×), `url=` (28×), `redirect=` no `etoro.com`. Testar allowlist (`//evil`, `@`, etc.). ⚠️ eToro lista open-redirect isolado como low; vale por chain (OAuth do wallet).
9. **[UNTESTED · lógica/KYC] ações sensíveis via query** — `?action=autokyc&deepLink=uploadutilitybill`, `?action=copytrader`, `?action=get_pi_list&client_request_id=<uuid>`. O `autokyc` (KYC deep-link) e `copytrader` cheiram a lógica abusável; `client_request_id` = candidato a IDOR.

**Próximo passo:** fase ativa (probe httpx dos ~574 com `X-Bug-Bounty`) pra ver quais estão vivos e o que servem → afunilar os 9 leads. **Bloqueio: username do Bugcrowd.**
