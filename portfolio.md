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
| 2 | **Figma** | H1 | **Alta** | Crit $5k–50k | 287/90d | multi-tenant = seu ponto MAIS forte (BAC/IDOR cross-user); ⚠️ premium-bypass OOS | `targets/figma/` |
| 3 | **Matomo** | H1 | **Alta** | Crit $13k (RCE/SQLi) | 986/90d (saturado) | **white-box** open-source: lê PHP, valida local, sem risco/KYC | `targets/matomo/` |
| 4 | **NBA** | H1 público | **Alta** | Crit $3k–6k | Alta no www, **0 nos G-League novos** | BAC/ATO in-scope; mirar G-League 0-report; Sword ajuda | `targets/nba/` |
| 5 | **Arkose Labs** | H1 | **Alta** | Core Crit $5k–7k | **⭐ 67/90d (baixa)** | portal SaaS multi-tenant = BAC/IDOR; paga; Sword ajuda | `targets/arkose-labs/` |
| 6 | **Wallet on Telegram** | H1 privado | **Alta (manual)** | Extreme $30k–100k | Média (189/90d) | privesc/lógica High-tier = fit; **🚫 IA proibida na busca** | `targets/wallet-on-telegram/` |
| 7 | **PlayStation** | H1 (Sony) | **Média** | Web Crit $5k–10k | provável alta | só web PSN + mobile (conta/carteira/store); console = fora da lane | `targets/playstation/` |
| 8 | **Moovit** | Bugcrowd | **Média** | P1 $2k–3.5k | baixo vol (14 desde '24) | focus = Auth/Authz + API IDOR = seu forte; **mas mobile-only + cert pinning** | `targets/moovit/` |
| 9 | **Banco Plata** | H1 privado | **Média** ⚠️ | Crit $3k–5k | 1.313/90d × **1 resolvido** | fintech novo, mas resolução travada; cartão é MX | `targets/banco-plata/` |
| 10 | **Crypto.com** | H1 público | **Média** | até $1.000.000 | Muito alta (elite) | fit fintech, paga muito/rápido; alvo *depois* do 1º | `targets/crypto-com/` |
| 11 | **Chia Network** | H1 | **Baixa** | Crit/esp. $25k–50k | **⚠️ 1.406/90d (a MAIS saturada)** | $$$ em ChiaLisp/consenso = cripto profundo, fora da lane | `targets/rede-chia/` |
| 12 | **Wickr** | H1 (AWS) | **Baixa** | Crit $12k–25k | 244/90d, lento | "untrusted server" rebaixa BAC; $$$ em quebrar E2EE (fora da lane) | `targets/wickr/` |
| 13 | **ALSCO** | H1 | **Baixa/evitar** | $2.5k | baixa vol, quase não paga | lógica OOS + bypass=Informative — mismatch | `targets/alsco/` |
| 14 | **Altera** | Intigriti | **Evitar** | Crit $15k | — | FPGA hardware/firmware; **web infra OOS**; zero fit | `targets/altera/` |
| 15 | **Arbonia VDP** | Intigriti | **Evitar** | **$0 (VDP)** | 197 subs | sem credenciais/papéis, sem scanner, VDP sem grana | `targets/arbonia/` |
| – | Intigriti (próprio) | Intigriti | a definir | a preencher | ? | escopo/reward não compartilhados; ativo Zendesk provável OOS | `targets/intigriti-11359.zendesk.com/` |

**🏆 Top 3 honesto pro 1º bounty:** **CoinSpot** (baixa concorrência + maiores pisos), **Figma** (bate no seu forte IDOR/BAC), **NBA** (G-League 0-report). Todos pagam, todos BAC/lógica, Sword ajuda ponta a ponta.
**Melhor pro perfil de dev:** **Matomo** (white-box, valida no PHP local, sem risco).
**Alvo #2 (API mobile):** **Moovit** — fit direto no forte (API IDOR), mas exige setup de proxy + bypass de pinning; pegar depois do 1º web.

---

## Notas por programa
As **constraints pré-fixadas** e "onde mirar" de cada um estão na ficha `targets/<alvo>/README.md`. Destaques:
- **CoinSpot:** 2 contas grátis + API v2; **atacar contas de clientes = PROIBIDO**; foco saldo/carteira/top-up/IDOR próprio.
- **Figma:** foco = acesso não-autorizado a dado alheio (cross-user/team/file); **premium-bypass NÃO paga**; sem scanner.
- **Matomo:** instância **local própria**; IA-assistida OK mas exige exploit demonstrado; conferir known-issues antes.
- **NBA:** `--rate 3`, manual-only, closed scope. Foco: G-League "New" 0 report + ambientes non-prod.
- **Arkose:** focar nos Core apps (portal), não infra de terceiros. portal = BAC/IDOR multi-tenant.
- **Wallet:** **IA proibida na busca** → caça manual sua; Sword fica fora do loop de descoberta.
- **PlayStation:** só web PSN + mobile; console = ignorar; sem scanner/exploit tools.
- **Moovit:** **o alvo é a API atrás do app, não a UI.** Subir proxy + bypass de cert pinning (Frida) → IDOR/BAC de conta/locais salvos. Só mobile; web todo OOS; sem scanner; NDA.
- **Banco Plata:** red flag de resolução (1 resolvido); cartão MX pode exigir residência.
- **Crypto.com:** nunca tocar em fundos de terceiros; foco na lógica atrás do KYC; alvo pós-1º-bounty.
- **Chia / Wickr / ALSCO / Altera / Arbonia:** evitar por ora (mismatch/saturação/hardware/VDP). Detalhe na ficha.
- **Intigriti:** semente; falta escopo/reward oficiais.
