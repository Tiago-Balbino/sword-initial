# Alvo: Banco Plata (banco_plata) — Prioridade MÉDIA (red flag de resolução)
- **Programa:** HackerOne · privado · Jan/2026 · OPEN SCOPE (4 listados) · https://hackerone.com/banco_plata · http://bancoplata.mx
- **⚠️ Red flag:** 1.313 reports/90d e só 1 resolvido na história; $5.978 total; bounty ~1 mês → triagem/pagamento parece travado.
- **Reward:** Low $100–200 · Med $250–750 · High $800–2.5k · Crit $3k–5k.

## ⛓️ Constraints pré-fixadas
1. Privado (sem disclosure). Alias h1username@wearehackerone.com; header X-HackerOne-Research.
2. Perguntar antes de subdomínio não listado. Só contas próprias; sem eng. social; 1 vuln/report; PoC; default ~5 req/s.
3. **⚠️ Cartão é MX** — você é BR; aplicar pode exigir dados/residência MX (confirmar).

## 🎯 Onde mirar
Aplicação de cartão (MX) + conta = lógica de negócio (limites, KYC/onboarding, IDOR de statement/conta).

## Achados
| Data | Severidade | Tipo | Endpoint | Status |
|------|-----------|------|----------|--------|
