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
