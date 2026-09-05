# Falhas de lógica de negócio (prioridade #1)

Scanners não acham isso — é onde a bagagem de dev vira vantagem. O bug mora nas
**suposições** do dev sobre como o sistema seria usado.

## Padrões canônicos (base: PortSwigger)
Fonte: https://portswigger.net/web-security/logic-flaws

1. **Confiança excessiva em controles client-side** — validação só no JS/HTML. *Sinal:* intercepte e mande o request cru sem passar pelo front.
2. **Não tratar input não-convencional** — valores fora da faixa, tipo errado, negativo. *Sinal:* teste limites, negativos, zero, strings gigantes, tipos trocados.
3. **Suposições falhas sobre comportamento do usuário** — assume fluxo sequencial. *Sinal:* pule/reordene/repita etapas.
4. **Falhas específicas do domínio** — regra que só faz sentido naquele negócio. *Sinal:* entenda o negócio e ache a regra quebrável.
5. **Oráculo de cripto** — feature que cifra/decifra dado arbitrário do usuário. *Sinal:* ache onde dado do usuário é processado cripto e abuse.
6. **Discrepância de parser de e-mail** — sistemas leem e-mail diferente. *Sinal:* formatos exóticos, múltiplos endereços, caracteres especiais (liga com P5).

## Write-ups reais
- **Desconto redimível infinitamente** (HackerOne) — https://www.hackerone.com/blog/how-business-logic-vulnerability-led-unlimited-discount-redemption
  - **Padrão:** cupom sem checagem de uso único / sem atomicidade (P4, e às vezes P6 race).
  - **Gatilho:** todo cupom/crédito/gift card — testar reuso e aplicação em paralelo.
- **Top 25 race conditions (curadoria de reports)** — https://corneacristian.medium.com/top-25-race-condition-bug-bounty-reports-84f9073bf9e5
  - **Padrão:** checar-e-usar não atômico em ações de uso único (P6).
- **Top Business Logic reports (HackerOne, curado)** — https://github.com/reddelexc/hackerone-reports/blob/master/tops_by_bug_type/TOPBUSINESSLOGIC.md
  - Repositório pra minerar padrões por volume.
- **Curve — não-premium acessando função premium (disclosed)** — https://hackerone.com/reports/672487
  - **Padrão:** flag de tier confiada do lado errado (P4).
- **Bugs em fluxo de compra/billing (Sm4rty)** — https://sm4rty.medium.com/hunting-for-bugs-in-shopping-billing-feature-79055d5f399b
  - Checklist prático de e-commerce: preço, quantidade, moeda, cupom, frete.

## Checklist rápido de lógica num alvo
1. **Dinheiro:** altere `price`, `quantity` (negativo/zero), `currency`, aplique cupom N vezes, cupons empilhados.
2. **Uso único:** dispare em paralelo (race) tudo que "só pode uma vez".
3. **Fluxo:** pule pagamento, confirme sem completar pré-requisito, volte etapas.
4. **Tier/role:** acesse função premium/admin com conta grátis/comum (flag confiada).
5. **Input absurdo:** datas no passado/futuro, quantidades gigantes, unicode, e-mail exótico.
6. **Reembolso/estorno:** cancele após consumir; peça reembolso duplicado.

---
## Ingeridos automaticamente — 2026-09-01

### Race conditions: sincronização de última-byte e single-packet
- **Alvo · Classe · Bounty · Data** — guia técnico (YesWeHack) · race condition · 2026 — [link](https://www.yeswehack.com/learn-bug-bounty/ultimate-guide-race-condition-vulnerabilities)
- **Padrão:** checar-e-alterar estado em 2 etapas não atômicas (cupom, saldo, gift card, verificação de e-mail). Assume-se que uma request termina antes da próxima começar — falso sob concorrência. Casos: GitLab e-mail verificado via OAuth (CVE-2022-4037), gift card duplicado no nopCommerce (CVE-2024-58248).
- **Como acharam:** anular jitter — HTTP/1.1 segurando o último byte e soltando junto; HTTP/2 empacotando várias requests num pacote TCP (single-packet). Demo: mesmo cupom repetido derruba item de €1.337 → €37,62.
- **Gatilho:** endpoint que consome algo de uso único/limitado (cupom, convite, voucher, tentativa, crédito, token de verificação) e responde rápido. Scanner não pega — mapear fluxo multi-etapa e disparar o passo consumidor em paralelo.

---
## Ingeridos automaticamente — 2026-09-04

### Eclipse on Next.js — race condition "intencional" no batcher
- **Alvo · Classe · Bounty · Data** — Next.js <14.2.24 e 15.0.0–15.1.6 · race condition / cache poisoning (CVE-2025-32421) · via programas de BB · mai/2025 — [link](https://zhero-web-sec.github.io/research-and-things/eclipse-on-nextjs-conditioned-exploitation-of-an-intended-race-condition)
- **Padrão:** o patch do CVE-2024-46982 assumiu que validar o header `x-now-route-matches` fechava o caso; mas a deduplicação de promises do batcher continua compartilhando chave de cache. Combinando aquele header com `__nextDataReq`, duas requests simultâneas colidem na mesma chave (`/_error-0`) e uma sequestra a promise da outra — a resposta de um usuário vaza/envenena a do outro.
- **Como acharam:** ao procurar alvos ainda vulneráveis ao CVE antigo, acharam um app já patchado com comportamento estranho; ao depurar, viram a função interna sendo disparada várias vezes sobre a mesma chave de cache.
- **Gatilho:** alvo Next.js cujas páginas de erro carregam `pageProps` enriquecidos (típico com Sentry) atrás de CDN que sobrescreve o `cache-control` da origem. Lição transferível: **um patch que só valida entrada não elimina a race** — vale re-testar CVEs "corrigidos" com concorrência.
