# PlayStation — ficha de alvo

- **Programa:** PlayStation (playstation) · HackerOne · Sony · Safe Harbor forte
- **Link:** https://hackerone.com/playstation · VDP: https://hackerone.com/sony
- **Prioridade:** 🟡 **MÉDIA** (só a parte web/mobile entra na sua lane)
- **Reward (mín):** Web: Low $250–500 · Med $800–1.600 · High $3k–5k · Crit $5k–10k. Console: Crit $50.000.

## ⛓️ Constraints pré-fixadas
- Só ativos listados; **sem scanner / exploit tools**.
- Sem DoS/spam/social eng/defacement; não acessar dado além do mínimo; só contas próprias.
- Residência não-sancionada (BR OK).

## 🎯 Onde mirar (fit BAC/lógica)
- **SÓ web PSN + apps mobile:** conta, carteira, store → BAC/IDOR/ATO.
- **🚫 Console/OS = ignorar** (hardware/exploit-dev, fora da lane).
- Ressalva: marca gigante → provável saturado; paga menos que CoinSpot/Figma.

## Recon
- `code 0` só nos hosts web listados. Foco em fluxos de conta/loja.
