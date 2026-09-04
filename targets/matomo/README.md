# Matomo — ficha de alvo

- **Programa:** Matomo (matomo) · HackerOne · analytics open-source (PHP/MySQL)
- **Link:** https://hackerone.com/matomo · https://matomo.org
- **Prioridade:** 🟢 **ALTA — a melhor pro perfil de dev (white-box)**
- **Escopo:** closed, 11 assets.
- **Reward:** $333 · $777 · High $1.777 (auth bypass/XSS/CSRF/privesc) · Crit $13.000 (RCE/SQLi)

## ⛓️ Constraints pré-fixadas
- Testar em **instância PRÓPRIA local** (baixa o código, sobe local).
- **IA-assistida OK**, MAS report sem exploit demonstrado = OOS.
- Não abrir issue no GitHub sobre o bug.
- **⚠️ Known issues (NÃO pagam):** e-mail nunca verificado · OAuth2 scope→role · invitation link · password-reset forwarded host.

## 🎯 Onde mirar (fit dev/white-box)
- **Ler o PHP** → auth bypass, privesc, IDOR, SQLi, stored XSS.
- Vantagem: valida local, sem KYC, sem rate-limit, sem risco de safe-harbor.
- Ressalva: saturado (986/90d) e payout modesto — mas é onde seu skill de dev rende mais.

## Recon
- Clonar repo, subir instância local, `code 0` contra `localhost`. Leitura de código > scan.
