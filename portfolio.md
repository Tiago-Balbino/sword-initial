# portfolio.md — Programas candidatos (análise escopo × reward)

**O que é:** ranking dos programas que você considera caçar, com a intel pra escolher. Porta de entrada do `modo hunter`.
**Alimentado por:** `modo sábado à tarde` (no Mac escreve aqui; fora do Mac enfileira em `claude/portfolio-banco.md` e o `code 5` traz).
**Como o `modo hunter` usa:** lê isto, lista os rankeados, pergunta "qual alvo?", puxa `targets/<alvo>/` e caça.

**📌 Estratégia atual (2026-09-01):** sem alvo único — foco **distribuído** em todos; o ranking é ordem de EV, não escolha exclusiva. Deixar o alvo "escolher" pelo 1º sinal quente.

## Como pontuar
Prioridade ≈ reward × amplitude × fit (BAC/IDOR + lógica) × (baixa) saturação × responsividade/pagamento real.

---

## Ranking (EV pro 1º bounty rápido)

| # | Programa | Plataforma | Prioridade | Reward (top) | Saturação | Fit / observação | Ficha |
|---|----------|-----------|-----------|--------------|-----------|------------------|-------|
| 1 | **CoinSpot** | H1 | **Alta ⭐** | Crit $50k · esp. $350k | **⭐ 54/90d (baixa)** | pisos altíssimos + fit direto (saldo/top-up/IDOR); 2 contas + API v2 | `targets/coinspot/` |
| 2 | **eToro** | Bugcrowd | **Alta ⭐** | P1 $6k–15k · P2 $1.5k–6k | 66 premiados (main já garimpado) | **wildcard `*.etoro.com` fintech**; BAC/IDOR/lógica (copy-trading/carteira); **triagem 2 dias**; contas self-serve | `targets/etoro/` |
| 3 | **Figma** | H1 | **Alta** | Crit $5k–50k | 287/90d | multi-tenant = seu ponto MAIS forte (BAC/IDOR cross-user); ⚠️ premium-bypass OOS | `targets/figma/` |
| 4 | **Matomo** | H1 | **Alta** | Crit $13k (RCE/SQLi) | 986/90d (saturado) | **white-box** open-source: lê PHP, valida local, sem risco/KYC | `targets/matomo/` |
| 5 | **Nexo** | Intigriti | **Alta ⭐** | Crit $3k · Except. $4.8k (T1) | **⭐ Baixa (148 subs/50 aceitas, novo)** | **16 endpoints de API de dinheiro in-scope** (withdrawal/pay_to_card/exchange/futures) + **transfer entre users** = IDOR/lógica; worst-case = **transações fraudulentas**; self-serve `@intigriti.me` | `targets/nexo/` (criar) |
| 6 | **NBA** | H1 público | **Alta** | Crit $3k–6k | Alta no www, **0 nos G-League novos** | BAC/ATO in-scope; mirar G-League 0-report; Sword ajuda | `targets/nba/` |
| 7 | **Arkose Labs** | H1 | **Alta** | Core Crit $5k–7k | **⭐ 67/90d (baixa)** | portal SaaS multi-tenant = BAC/IDOR; paga; Sword ajuda | `targets/arkose-labs/` |
| 8 | **Wallet on Telegram** | H1 privado | **Alta (manual)** | Extreme $30k–100k | Média (189/90d) | privesc/lógica High-tier = fit; **🚫 IA proibida na busca** | `targets/wallet-on-telegram/` |
| 9 | **Airbnb** | H1 público | **Média (fit Alta)** | Crit $18–25k · **Med $1–5k (avg $2k, 48%)** | **Muito alta (~1.700 resolv.)** | marketplace c/ **papéis (Guest/Host/ProHost/SuperHost)** + payments = BAC/IDOR+lógica; SLA elite (triagem 2d, >90%); ⚠️ `www` já lavado → mirar **papéis/payments/AI assistant** | `targets/airbnb/` (criar) |
| 10 | **PlayStation** | H1 (Sony) | **Média** | Web Crit $5k–10k | provável alta | só web PSN + mobile (conta/carteira/store); console = fora da lane | `targets/playstation/` |
| 11 | **Moovit** | Bugcrowd | **Média** | P1 $2k–3.5k | baixo vol (14 desde '24) | focus = Auth/Authz + API IDOR = seu forte; **mas mobile-only + cert pinning** | `targets/moovit/` |
| 12 | **Banco Plata** | H1 privado | **Média** ⚠️ | Crit $3k–5k | 1.313/90d × **1 resolvido** | fintech novo, mas resolução travada; cartão é MX | `targets/banco-plata/` |
| 13 | **Crypto.com** | H1 público | **Média** | até $1.000.000 | Muito alta (elite) | fit fintech, paga muito/rápido; alvo *depois* do 1º | `targets/crypto-com/` |
| 14 | **Chia Network** | H1 | **Baixa** | Crit/esp. $25k–50k | **⚠️ 1.406/90d (a MAIS saturada)** | $$$ em ChiaLisp/consenso = cripto profundo, fora da lane | `targets/rede-chia/` |
| 15 | **Wickr** | H1 (AWS) | **Baixa** | Crit $12k–25k | 244/90d, lento | "untrusted server" rebaixa BAC; $$$ em quebrar E2EE (fora da lane) | `targets/wickr/` |
| 16 | **ALSCO** | H1 | **Baixa/evitar** | $2.5k | baixa vol, quase não paga | lógica OOS + bypass=Informative — mismatch | `targets/alsco/` |
| 17 | **Altera** | Intigriti | **Evitar** | Crit $15k | — | FPGA hardware/firmware; **web infra OOS**; zero fit | `targets/altera/` |
| 18 | **Arbonia VDP** | Intigriti | **Evitar** | **$0 (VDP)** | 197 subs | sem credenciais/papéis, sem scanner, VDP sem grana | `targets/arbonia/` |
| – | Intigriti (próprio) | Intigriti | a definir | a preencher | ? | escopo/reward não compartilhados; ativo Zendesk provável OOS | `targets/intigriti-11359.zendesk.com/` |

**🏆 Top picks pro 1º bounty:** **CoinSpot** (baixa concorrência + maiores pisos), **eToro** (wildcard fintech + triagem 2 dias + paga lows), **Figma** (bate no seu forte IDOR/BAC), **NBA** (G-League 0-report). Todos BAC/lógica, todos pagam, Sword ajuda ponta a ponta.
**Melhor pro perfil de dev:** **Matomo** (white-box, valida no PHP local, sem risco).
**Alvo #2 (API mobile):** **Moovit** — fit direto no forte (API IDOR), mas exige setup de proxy + bypass de pinning.

---

## Notas por programa
As **constraints pré-fixadas** e "onde mirar" de cada um estão na ficha `targets/<alvo>/README.md`. Destaques:
- **CoinSpot:** 2 contas grátis + API v2; **atacar contas de clientes = PROIBIDO**; foco saldo/carteira/top-up/IDOR próprio.
- **eToro:** wildcard `*.etoro.com` — **o main já foi garimpado (37 known issues); mire os ativos secundários** (delta.app ReactJS, etorox.com, com.etoro.wallet, openbook) com poucos known issues. Fit = copy-trading/portfólio/carteira/social = IDOR/BAC/lógica. Header `X-Bug-Bounty:<user>`; contas self-serve; sem tooling de volume.
- **Figma:** foco = acesso não-autorizado a dado alheio (cross-user/team/file); **premium-bypass NÃO paga**; sem scanner.
- **Matomo:** instância **local própria**; IA-assistida OK mas exige exploit demonstrado; conferir known-issues antes.
- **Nexo:** o escopo Tier 1 são **16 endpoints de API de movimentação de dinheiro** — priorizar `request_crypto_withdrawal`, `request_pay_to_card`, `exchange_order`, `create_recurring_payment`, `term/deposits/user/create`, `trading/advanced/.../withdraw|order/futures`. **Angulo #1:** IDOR/BAC e lógica na função nativa **Transfer entre usuários** (2 contas self-serve `@intigriti.me`) → worst-case declarado = *transações fraudulentas*. **Regras duras:** `X-Intigriti-Username`, **max 5 req/s**, **ID check obrigatório**, **produção com dinheiro real** (NUNCA tocar conta/fundo de terceiro; usar só as próprias). OOS: rate-limit, pre-auth ATO/OAuth squatting, mobile apps, 3rd-party, support chat. Validação Crit/High rápida (2–5d), Med/Low lenta (15d). Se fora do país elegível → VPN pra registrar.
- **NBA:** `--rate 3`, manual-only, closed scope. Foco: G-League "New" 0 report + ambientes non-prod.
- **Arkose:** focar nos Core apps (portal), não infra de terceiros. portal = BAC/IDOR multi-tenant.
- **Wallet:** **IA proibida na busca** → caça manual sua; Sword fica fora do loop de descoberta.
- **Airbnb:** wildcards **Higher Impact** (`*.airbnb.com`, `*.airbnb.org`, `*.musta.ch`, `*.airbnbpayments.com`, apps iOS/Android) pagam cheio; **Lower Impact** (muscache/luxuryretreats/hoteltonight/atairbnb/…) Crit cai pra $5k. **Mirar o forte:** IDOR/BAC entre papéis (Guest↔Host↔ProHost↔SuperHost), lógica de reserva/payout, `*.airbnbpayments.com`, e a superfície **fresca do AI Customer Service Assistant** (Crit $18–25k, menos batida) — fugir do `www`/`*.airbnb.com` já lavado (~750 resolv. só neles). **Regras:** header `X-HackerOne-Researcher:<user>` + omitir cookies de sessão; **proibido mass-create de contas** e **brute-force de rate-limit**; só contas próprias; 3rd-party OOS. HotelTonight tem **ambiente de teste** dedicado (`*.hoteltonight-test.com`, cartão `4111...`). Android pode qualificar bônus no Google Play Security Rewards. Filler/AI denso = NA.
- **PlayStation:** só web PSN + mobile; console = ignorar; sem scanner/exploit tools.
- **Moovit:** **o alvo é a API atrás do app, não a UI.** Subir proxy + bypass de cert pinning (Frida) → IDOR/BAC de conta/locais salvos. Só mobile; web todo OOS; sem scanner; NDA.
- **Banco Plata:** red flag de resolução (1 resolvido); cartão MX pode exigir residência.
- **Crypto.com:** nunca tocar em fundos de terceiros; foco na lógica atrás do KYC; alvo pós-1º-bounty.
- **Chia / Wickr / ALSCO / Altera / Arbonia:** evitar por ora (mismatch/saturação/hardware/VDP). Detalhe na ficha.
- **Intigriti:** semente; falta escopo/reward oficiais.
