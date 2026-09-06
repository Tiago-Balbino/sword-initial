# dojo-log.md — registro do `modo dojo` 🥋

O lado **entrada de conhecimento** do Sword. Cada sessão de estudo (2-3 write-ups) fecha aqui.
Definição do loop: `CODES.md` › Modos › `modo dojo`. Fundado em **recall ativo + aplicação + espaçamento**.

## O ganho (por que existe, não só o que faz)
Ler um write-up e "entender" a técnica não é o mesmo que **conseguir usá-la num alvo real semanas
depois** — a maioria do que se lê evapora (curva do esquecimento). O dojo ataca isso com 3
mecanismos que sabidamente fixam aprendizado (releitura passiva não fixa):
1. **Recall ativo** — depois de distilar, **fecha a fonte** e reconstrói o ataque de memória
   (request-chave · porquê · impacto, 3–5 linhas). Não conseguiu = não aprendeu → repete.
2. **Aplicação imediata** — o sinal novo é testado contra um alvo vivo **na mesma sessão**
   (vira lead `[UNTESTED]` na ficha). Conhecimento que toca a realidade gruda; o que fica só na
   cabeça, não.
3. **Espaçamento** — a técnica entra na fila abaixo com revisão em **1 dia → 1 semana → 1 mês**,
   forçando recall repetido nos intervalos certos (memória de longo prazo, não decoreba).

**Prova real (2026-09-05, Nexo):** 2 write-ups (race em saldo/saque + IDOR bancário) viraram
`S-RACE-01`/`S-FUND-01`/`C-08` no banco, recall feito sem a fonte, e **na mesma sessão** já eram
as hipóteses H1/H2/H3 na ficha do Nexo — o ciclo completo em menos de uma hora.

**O que não é:** não é "resumir mais write-ups" — guardrail de **2-3 por sessão**, qualidade > volume.
Um sinal recuperado de memória e aplicado vale mais que dez lidos e esquecidos.

**Conexão:** dojo = entrada de conhecimento; `modo hunter` = saída. Os dois alimentam os mesmos
arquivos (`arsenal.md`, `signals.md`, `patterns.md`) — toda técnica nova daqui entra no que o
`code 6` casa contra recon futuro.

---

## Fila de revisão espaçada (recall SEM a fonte)
Toda técnica distilada entra aqui com a próxima data de revisão (1 dia → 1 semana → 1 mês).
Revisar = reconstruir o ataque de memória; acertou → empurra pra próxima janela; falhou → volta pro início.

| Técnica (`S-*`/arquivo) | Classe | Distilada em | Próxima revisão | Estágio |
|---|---|---|---|---|
| `S-RACE-01` — check-then-act sobre saldo/limite (TOCTOU) | Business Logic | 2026-09-05 | 2026-09-13 | 1sem ✓ |
| `S-FUND-01` — IDOR de endpoint de dinheiro (read→write→transfer) | BAC/IDOR | 2026-09-05 | 2026-09-13 | 1sem ✓ |
| `C-08` — IDOR de saldo + race de saque → transação fraudulenta | Chain | 2026-09-05 | 2026-09-13 | 1sem ✓ |
| `S-BOLA-STALE-01` — authz stale após ciclo de vida (revogado ainda acessa) | BAC/IDOR | 2026-09-06 | 2026-09-07 | 1d |
| `S-LOGIC-THRESHOLD-01` — critério de elegibilidade revogável após aplicar | Business Logic | 2026-09-06 | 2026-09-07 | 1d |
| `S-CRYPTO-ORACLE-01` — gerador de ciphertext + consumidor que confia | Business Logic | 2026-09-06 | 2026-09-07 | 1d |

---

## Sessões

### Modelo (copiar por sessão)
```
### AAAA-MM-DD — sessão dojo
- **Write-ups distilados:** <url> (classe) · <url> (classe)
- **Técnicas novas:** S-XXX-NN "<1 linha>" → arsenal/signals
- **Recall (de memória, fonte fechada):** <o ataque em 3-5 linhas — request-chave · porquê · impacto>
- **Aplicado em alvo:** o sinal acendeu em <alvo>/<lead>? → <sim: virou lead / não>
- **Revisão agendada:** <técnica> em <data> (estágio 1d/1sem/1mês)
```

_(primeira sessão real entra abaixo)_

### 2026-09-05 — sessão dojo (foco: camada financeira do Nexo)
- **Write-ups distilados:** josipfranjkovic.com/blog/race-conditions-on-web (business logic / race) · webasha.com/…/idor-banking-application (BAC/IDOR fundo)
- **Técnicas novas:** `S-RACE-01` "N requests paralelas passam todas no check de saldo antes do commit → double-spend/saldo negativo" · `S-FUND-01` "token válido ≠ dono da conta de origem → transfer de fundo alheio (read→write)" · `C-08` "IDOR de saldo + race de saque → transação fraudulenta" → arsenal/signals/business-logic/broken-access-control.
- **Recall (de memória, fonte fechada):**
  - *Race/limit-overrun:* saldo 1000, mando 5× "saque 900" em single-packet (mesma conexão H2, last-byte sync). Cada request lê 1000 e aprova antes de qualquer débito commitar → saco 4500. Baseline serial (1 req = 1 débito) primeiro pra medir o delta. FP: débito atômico deixa só 1 passar; rate-limit não conta como defesa.
  - *IDOR de fundo:* token da conta A + `GET /transactions/{id de B}` → 200 com o dado da B (não 403) = authz ausente por objeto. Escalo pro `POST transfer` com `from_account` da B → move fundo alheio. Régua: testar sempre com id **válido de outra conta minha**, olhar conteúdo (não status/timing).
- **Aplicado em alvo:** **Nexo** — os sinais acendem direto nos endpoints in-scope (`request_crypto_withdrawal`, `request_pay_to_card`, `exchange_order`, `term/deposits/user/create` = `S-RACE-01`; função Transfer entre users = `S-FUND-01`). Viraram hipóteses `[UNTESTED]` na ficha `targets/nexo/` (H1/H2/H3).
- **Revisão agendada:** as 3 técnicas em **2026-09-06** (estágio 1d) → 1 semana → 1 mês.

### 2026-09-06 — sessão dojo (foco: BAC entre papéis + lógica de marketplace pro Airbnb)
- **Revisão espaçada (recall SEM fonte, vencida hoje):** `S-RACE-01`, `S-FUND-01`, `C-08` reconstruídos limpos → empurrados p/ estágio **1 semana** (2026-09-13).
- **Write-ups distilados:** arxiv.org/html/2605.25865 (taxonomia BOLA — 6 famílias por mecânica, com prevalência) · portswigger.net/web-security/logic-flaws/examples (5 famílias canônicas de lógica).
- **Técnicas novas:**
  - `S-BOLA-STALE-01` "authz checada no estado ativo, não re-checada após arquivar/revogar/deprovisionar → principal removido ainda acessa" → signals + broken-access-control.
  - `S-LOGIC-THRESHOLD-01` "critério de elegibilidade satisfeito e revogado antes do commit (desconto por limiar → aplica → remove itens → fica)" → signals + business-logic.
  - `S-CRYPTO-ORACLE-01` "mesma função cifra input do atacante; ciphertext aceito noutra função sensível que confia em 'veio cifrado'" → signals + business-logic.
  - +arsenal: **gid GraphQL = base64('Type:int') → decode/increment/re-encode** (9.6% dos BOLA de API); +regra de priorização **Action-Level (verbo mutante cross-owner) é 41.7% → mirar POST/PATCH/DELETE alheio antes da leitura**.
- **Recall (de memória, fonte fechada):**
  - *BOLA taxonomy:* 6 famílias — Direct-ref (troca id, 37%), **Action-level (verbo mutante em objeto alheio, 42% — a maior)**, Tenant (troca org_id), **Workflow/stale (authz não re-checada após ciclo de vida)**, Chained-disclosure (colhe id em A, usa em B sem check), Object-rebinding (owner_id no body). Heurística-chave: base64-decode todo gid; priorizar escrita cross-owner.
  - *Lógica PortSwigger:* client-trust (tamper no cru) · input não-convencional (**negativo inverte fluxo**) · suposições de comportamento (user confiável / **remover o param abre code-path** / pular etapa) · **domain-specific (critério revogável)** · **oráculo de cifra**.
- **Aplicado em alvo:** **Airbnb** — os 3 sinais acenderam direto na ficha `targets/airbnb/`: `S-BOLA-STALE-01`→**H7** (co-host removido/reserva cancelada/agente deprovisionado ainda acessam — superfícies `cohostsuccess`/`partners.hoteltonight` do recon), `S-CRYPTO-ORACLE-01`→**H8** (URLs assinadas `muscache`/imgix + iframe de payment), `S-LOGIC-THRESHOLD-01`→reforço **H3** (`business.giftcards.withairbnb.com` achado no recon), taxonomia→regra de priorização na Partner API (`developer.withairbnb.com`). Ciclo completo: distilar → recall → aplicar, na mesma sessão.
- **Revisão agendada:** as 3 técnicas novas em **2026-09-07** (estágio 1d) → 1sem → 1mês.
