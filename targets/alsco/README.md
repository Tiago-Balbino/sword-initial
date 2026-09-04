# Alvo: ALSCO (alsco) — Prioridade BAIXA / EVITAR
- **Programa:** HackerOne · Set/2022 · 2 assets · https://hackerone.com/alsco · http://alscotoday.com
- **Por quê evitar (pro seu perfil):** (1) **lógica de negócio é OOS explícito** (mata seu forte); (2) bypass do Secure Gateway = Informative (não paga); (3) histórico fraco (5 resolvidos, <$10k, top $1k) + exige vídeo de "full hack".

## ⛓️ Constraints
Vídeo PoC de "full hack" obrigatório; disclosure travada; ban permanente (DoS/brute/shells/eng.social/atacar clientes/PII de 3º); pode pedir conta de teste; bypass Secure Gateway → checksw.com mas = Informative.

## 🚫 OOS (destaques)
business logic + misconfig, clickjacking/CSRF não-sensível, open redirect sem ataque, SSL/CSP/cookie, DoS, libs sem PoC, takeover em *.checksw.com, apps de 3º no marketplace.

## Achados
| Data | Severidade | Tipo | Endpoint | Status |
|------|-----------|------|----------|--------|
