# Figma — ficha de alvo

- **Programa:** Figma (figma) · HackerOne · SaaS de design colaborativo (multi-user/teams/arquivos)
- **Link:** https://hackerone.com/figma · https://figma.com
- **Prioridade:** 🟢 **ALTA — bate no seu ponto MAIS forte (IDOR/BAC)**
- **Escopo:** closed, 8 assets. figma.com.
- **Reward:** Low $1–300 · Med $300–2k · High $2k–5k · Crit $5k–50k (+bônus até 100%). Avg High $5.136, Crit $22.650.

## ⛓️ Constraints pré-fixadas
- Foco premiado = **acesso não-autorizado a dado (BAC/IDOR)**; priorizam high/critical.
- **🚫 Bypass de premium/free-tier = INELEGÍVEL (OOS)** — não perca tempo nisso.
- **Sem scanner** (spam de forms = OOS); só contas próprias/de teste.
- Topou com dado de user real → purgar + reportar. Sem DoS/social eng/payment fraud.

## 🎯 Onde mirar (fit BAC/lógica)
- IDOR/BAC **cross-user / cross-team**: arquivos, projetos, teams, comentários.
- Escalada de papel dentro de uma org (viewer→editor→admin).
- ATO. → `memory/arsenal.md` (BOLA + multi-tenant).
- **NÃO:** premium-bypass, moderação.

## Recon
- `code 0` sem nuclei agressivo (sem scanner). Mapear a app autenticada manualmente.
