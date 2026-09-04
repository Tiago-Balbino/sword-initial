# Alvo: Wallet on Telegram (wallet_on_telegram) — Prioridade ALTA (manual)
- **Programa:** HackerOne · privado · Mai/2025 · Gold Standard Safe Harbor · https://hackerone.com/wallet_on_telegram · https://wallet.tg/
- **Reward:** High $500–3k (privesc + bypass access control/business logic = seu forte) · Crit $3k–30k · Extreme $30k–100k. Paga de verdade (21 resolvidos).

## ⛓️ Constraints pré-fixadas
1. **🚫 IA PROIBIDA na busca de vulns** — Sword/`modo hunter`/`code 0` NÃO podem ser usados aqui. **Caça 100% manual, você sozinho.** Claude fora do loop de descoberta (só política/organização/revisão de report). Regra do programa.
2. Privado (sem disclosure). Closed scope (7 assets).
3. Setup: conta via t.me/wallet; recovery email no TON Space com alias h1username@wearehackerone.com; header X-HackerOne-Research.
4. Só contas próprias; sem eng. social; 1 vuln/report; PoC obrigatória.

## 🎯 Onde mirar (MANUAL)
Privilege escalation entre usuários/roles + bypass de access control/lógica (transferência, exchange, TON Space, recovery/onboarding). Extreme/Critical (saque/RCE) = cripto-deep, fora da lane.

## Achados
| Data | Severidade | Tipo | Endpoint | Status |
|------|-----------|------|----------|--------|
