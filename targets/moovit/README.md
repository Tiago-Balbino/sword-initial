# Moovit — ficha de alvo

- **Programa:** Moovit Managed BBP · **Bugcrowd** · app de mobilidade urbana (MaaS) · Safe Harbor + NDA
- **Link:** Bugcrowd (Moovit) · apps: Android `com.tranzmate` · iOS id498477945
- **Prioridade:** 🟡 **MÉDIA** — fit real no forte (API BAC/IDOR), mas barreira de mobile + reward modesto
- **Escopo (1/4, estreito):** SÓ 3 apps mobile — Moovit Android · Moovit iOS · WayFinder (AR, iPhone).
  - **🚫 OOS:** todo web app, moovitapp.com, todos os subdomínios, WebViews dentro do app, moovit.com (WordPress à parte).
- **Reward (normal):** P1 $2k–3.5k · P2 $1k–2k · P3 $250–750 · P4 $100–250. Avg $725/3mo. (promo dobro jul/2025 expirou.)
- **Stats:** 14 vulns premiadas (desde jan/2024) · validação 6 dias · 75% decididos em 6d.

## ⛓️ Constraints pré-fixadas
- Conta self-provisioned com e-mail `@bugcrowdninja.com`; **só a sua conta** (não tocar em contas alheias).
- **🚫 Sem scanner / automated testing.** Impacto real e reproduzível obrigatório.
- Não criar contas em massa (se precisar, falar com o time). Sem DoS/spam/social eng/MITM.
- **NDA:** não divulgar findings sem aprovação escrita.

## 🎯 Onde mirar (fit BAC/lógica) — INSIGHT PRINCIPAL
- **O alvo é a API, não a UI do app.** Suba proxy (Burp/mitmproxy) na frente do app → capture o tráfego → cace a API.
- Focus oficial = **Auth/Authz + Unrestricted API access + Privacy/data protection** = IDOR/BAC puro.
- Alvos de IDOR: conta de usuário, locais/rotas salvos, favoritos, dados de perfil, features de acessibilidade, dados de outro usuário.
- Aplicar as 6 perguntas do The Mind em cada endpoint da API.

## ⚙️ Setup necessário (a rampa)
- Device Android rooteado ou emulador + **bypass de cert pinning** (Frida/objection).
- Sem isso, o tráfego da API fica cego. Essa é a fricção que segura a prioridade.

## Posicionamento no funil
- Bom **"alvo #2"**: depois de fechar o 1º bounty num alvo web/API puro (CoinSpot/Figma/NBA), diversificar pra API mobile aqui.
