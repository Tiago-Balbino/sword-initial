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

## Dojo — 2026-09-05

### Race na camada financeira (check-then-act / limit-overrun) — Josip Franjković
- **Fonte:** https://www.josipfranjkovic.com/blog/race-conditions-on-web (casos: Cobalt BTC withdraw, Mega saldo negativo, FB coupon/invite, FB email-confirm).
- **Suposição do dev que caiu (P4):** "o processamento é serial dentro da sessão do user" — cada request lê o saldo/limite/quota e **depois** escreve o débito, assumindo que o débito anterior já commitou.
- **Mecânica reusável:** N requests **simultâneas** ao MESMO endpoint de dinheiro passam TODAS no check antes de qualquer commit → saque múltiplo do mesmo saldo (Cobalt: 1 bounty sacado N×), saldo negativo aceito como estado válido (Mega), cupom/convite N× (FB). Sinal observável: a operação **só falha em serial**; em paralelo "passa" e o estado global diverge do esperado.
- **Como disparar:** rajada single-packet / last-byte-sync (mesma conexão H2 ou Turbo Intruder `race-single-packet`), 5–20 requests idênticas. **Baseline serial primeiro** (1 req = 1 débito) pra ter o delta.
- **FP a antecipar:** débito atômico/condicional no banco (só 1 passa) · idempotency-key real · "sucesso random após 5000 tentativas" que NÃO muda estado global = ruído (isolar o gatilho antes de reportar — no caso FB email-confirm levou meses pra achar que era a *alternância de param* entre 2 e-mails). **Rate-limit não é defesa contra race.**
- **Sinal no banco:** `S-RACE-01`. Chain com IDOR de fundo: `C-08`.

## Dojo — 2026-09-06

### As 5 famílias canônicas de lógica (PortSwigger) — o mapa de suposições
- **Fonte:** https://portswigger.net/web-security/logic-flaws/examples
- **Suposição-mãe (P2/P4):** o servidor confia que o cliente joga pelas regras do negócio. Cinco quebras reusáveis:
  1. **Confiança excessiva no client-side** — validação só no browser; tamper via proxy contorna. Testar toda regra "bloqueada na UI" no request cru.
  2. **Input não-convencional** — negativo/gigante/decimal/tipo inesperado. `amount = -1000` num transfer → "-1000 < saldo" passa e **inverte o fluxo** (recebo da vítima). Sempre testar valor negativo, 0, overflow, string onde espera número.
  3. **Suposições sobre comportamento do user** — 3 subtipos: (A) *"user validado continua confiável"* → controles relaxam depois do 1º check; (B) *"campo obrigatório sempre vem"* → **remover o param inteiro** (não esvaziar) abre code-path fora de alcance / pula 2FA; (C) *"a sequência é seguida"* → forced-browsing pula/repete/reordena etapa (acessar passo 3 sem o 2). (= reforça `S-IDV-01`/step-skip.)
  4. **Domain-specific / critério revogável** — satisfazer a condição no momento do check e **reverter depois**: adicionar itens p/ cruzar o limite de desconto de $1000 → aplicar desconto → **remover itens** → fica com o desconto. → **sinal novo `S-LOGIC-THRESHOLD-01`**.
  5. **Oráculo de cifra** — a mesma função que cifra input do user pode ser usada pra **cifrar dado arbitrário**, e o ciphertext é aceito noutra função sensível que espera "input cifrado (⇒ confiável)". → **sinal novo `S-CRYPTO-ORACLE-01`**.
- **Aplicação Sword:** 1/2/3 já vivem nos probes de tampering/step-skip; a **4 (critério revogável)** e a **5 (oráculo de cifra)** são sinais novos. A 3B ("remover o param") vira lembrete fixo: *deletar o nome do param ≠ mandar vazio* — abrem caminhos diferentes.
