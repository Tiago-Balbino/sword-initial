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

### 2026-09-06 — sessão dojo (2ª do dia · foco: OAuth redirect_uri pro lead #1 da NBA)
- **Write-ups distilados:** portswigger.net/research/hidden-oauth-attack-vectors (Stepankin — session poisoning no consent + SSRF via request_uri/DCR) · labs.detectify.com "dirty dancing in sign-in OAuth flows" (Frans Rosén — leak de code no non-happy-path).
- **Técnicas novas:**
  - `S-OAUTH-REDIR-02` "redirect_uri com matching frouxo (não-exato) → matriz de quirks: case-shift / path-append / param-injection / subdomain-www / @-trick" → signals + arsenal.
  - `S-OAUTH-LEAK-01` "code/token vaza na error page (non-happy-path) que carrega 3rd-party JS / postMessage sem origin → exfil cross-origin; vale MESMO com allowlist estrita; `response_type=code,id_token` move pro fragment; PKCE não protege" → signals + arsenal.
  - `S-OAUTH-CARRYOVER-01` "redirect_uri revalidado/sobrescrito no passo de consent (Spring @ModelAttribute mass-assignment) = session poisoning (passo N confia no N-1)" → signals + arsenal.
- **Recall (de memória, fonte fechada):**
  - *Dirty dancing:* a allowlist estrita não basta. Quebro a dança (state ruim ou `response_type=code,id_token`) → o `code` cai numa página de erro que não limpa a URL. Se essa página tem 3rd-party JS ou `postMessage('*')` sem check de origin, monto gadget (popup+opener / iframe sandbox com XSS / storage-event de analytics) que lê `location.href`/`window.name` cross-origin e exfiltra o code. Troco por token com meu próprio `code_verifier` (PKCE não salva). FP: error page limpa a URL ou não tem sink.
  - *Hidden OAuth (consent poisoning):* redirect_uri validado no `/authorize` mas o `/confirm_access` re-lê `redirectUri` do cliente (mass-assignment) → sessão envenenada emite code pro atacante. Régua: procurar OAuth multi-etapa onde o consent aceita params crus.
- **Aplicado em alvo:** **NBA** — (1) `S-OAUTH-LEAK-01` acendeu **L4/H9 novo** (dirty-dancing nos SSO **web**: `identity.nba.com`, PingFederate `identity-server-ping-*`, `login-uat`) — chain direto com o achado próprio "sem CSP nas properties" = error page sem backstop de script; (2) `S-OAUTH-REDIR-02` virou matriz de quirks a rodar no lead #1 (`teamone://oauth/`, Entra provável exact-match mas probe barato). Ambos gravados em `targets/nba/README.md`.
- **Revisão agendada:** `S-OAUTH-REDIR-02` · `S-OAUTH-LEAK-01` · `S-OAUTH-CARRYOVER-01` em **2026-09-07** (estágio 1d) → 2026-09-13 (1sem) → 2026-10-06 (1mês).

### 2026-09-07 — sessão dojo (foco: SSRF routing + cache poisoning pro Yahoo L7)
- **Write-ups distilados:** portswigger.net "Cracking the Lens" (Kettle — routing-based SSRF via Host header, explorou Yahoo ATS `ats-vm.lorax.bf1.yahoo.com` por $20k) · portswigger.net "Practical Web Cache Poisoning" (Kettle — unkeyed inputs).
- **Técnicas novas:**
  - `S-SSRF-ROUTE-01` "reverse-proxy/CDN que roteia por Host → fetch a backend arbitrário. Primitivas: Host inválido→callback, absolute-URI na request line, @-notation, porta/host ambíguo. Prova via SSRF testbed" → signals + arsenal.
  - `S-WCP-01` "cache poisoning via unkeyed input (X-Forwarded-Host/Scheme/Original-URL) refletido → resposta envenenada servida a todos; cache-buster obrigatório" → signals + arsenal (≠ WCD).
- **Recall (fonte fechada):**
  - *Routing-SSRF:* o edge/CDN confia no Host/URL do cliente pra escolher backend. Mando `Host: id.collab` (ou `GET http://interno/ HTTP/1.1`, ou `GET @collab/`) → se pinga meu Collaborator, o proxy roteia p/ destino arbitrário. Aponto pro metadata 169.254.169.254 ou, na Yahoo, pro bananastand (prova paga). Sinal: callback OOB, latência anômala, banner ATS.
  - *Cache poisoning:* input fora da cache-key (X-Forwarded-Host) reflete no corpo e é cacheado sob a key normal → todos recebem. Confirmo: `?cb` + header canário → reflete? reenvio sem header, mesmo `?cb` → persistiu = poison. Cache-buster sempre, senão contamino usuário real.
- **Aplicado em alvo:** **Yahoo L7** (achado do Nível 1 hoje) — os hosts `*.cdn.production.omega.gq1.yahoo.com` são a família exata do "Cracking the Lens". L7 ganhou Probe A (routing-SSRF apontando pro bananastand = prova paga) + Probe B (cache poisoning com cache-buster). Ciclo distilar→recall→aplicar fechado no mesmo dia do recon.
- **Revisão agendada:** `S-SSRF-ROUTE-01` + `S-WCP-01` em **2026-09-08** (1d) → 09-14 (1sem) → 10-07 (1mês).

### 2026-09-07 — sessão dojo (2ª · foco: a stack do Yahoo Lightyear CMS — JWT + Next.js + AWS API GW)
- **Material:** o próprio alvo (caçada de hoje mapeou a stack); 3 técnicas que **encaixam no CMS e faltavam no banco**, cada uma armando uma CHAIN pendente.
- **Leitura ativa (3 perguntas) → técnicas novas:** `S-JWT-01` (Bearer aud/alg/kid) · `S-NEXT-01` (Next.js App Router: middleware/image/server-actions) · `S-APIGW-01` (AWS API GW authorizer/method mismatch) · `S-BOLA-TENANT-CLIENT-01` (tenant no cliente).
- **Recall (de memória, fonte fechada):**
  - *JWT:* base64-decodo os 3 campos; a suposição frágil é "a lib valida tudo". Ataco na ordem: **aud/iss confusion** (o token do serviço A vale no B? = carryover) → `alg:none` → **RS256→HS256** (assino com a pubkey virando segredo HMAC quando o verify não pina alg) → `kid`/`jku` (aponto JWKS meu = forjo qualquer token, ou SSRF). Se papel/time for claim, forjar exige quebrar assinatura; se for valor solto do cliente, nem precisa (vira S-BOLA-TENANT-CLIENT-01). FP: alg+aud+exp+sig estritos.
  - *Next.js App Router:* 4 superfícies de framework. `x-middleware-subrequest` pula o middleware (CVE-2025-29927) — **só vale se a auth estiver NO middleware**; se for no edge, não aplica. `/_next/image?url=` fetcha server-side = SSRF se `remotePatterns` frouxo. **Server Actions** (`Next-Action: <id>` POST) = função server invocável por id, menos batida = SSRF/IDOR/deser. Maps `.js.map` vazam fonte.
  - *AWS API GW:* "Missing Authentication Token" = rota não-mapeada (oráculo). O authorizer é por-rota/método → tento **verbo alternativo** (GET-auth → POST/OPTIONS), path-variant (slash/case), greedy `{proxy+}`, e se só valida token vs **posse**. Endpoint cru `*.execute-api.<region>.amazonaws.com` pula custom-domain/WAF.
- **Aplicado em alvo vivo — Yahoo (passo 5):**
  - **`_next/image` SSRF (S-NEXT-01) TESTADO ao vivo no cm-ui → NEGATIVO** (`"url" parameter is not allowed`; allowlist estrita, nem s.yimg passa). Middleware-bypass já era negativo (auth no edge). → **Next.js: sobra só Server Actions como vetor vivo** (untested, precisa cuidado/mutação).
  - `S-JWT-01` → arma **CHAIN-F**: no momento do token, decodar aud/iss/scope/team + replay cross-service + `/validate-token` como oráculo.
  - `S-APIGW-01` → arma **CHAIN-G**: content-service (API GW) = testar method-mismatch + posse vs token; procurar o execute-api cru.
  - `S-BOLA-TENANT-CLIENT-01` → **formaliza CHAIN-E** (activeTeam no localStorage = o caso-escola dessa família).
- **Revisão agendada:** `S-JWT-01` · `S-NEXT-01` · `S-APIGW-01` · `S-BOLA-TENANT-CLIENT-01` em **2026-09-08** (1d) → 2026-09-14 (1sem) → 2026-10-07 (1mês).
- **Revisão espaçada vencida hoje (recall SEM fonte):** `S-SSRF-ROUTE-01` (ontem, 1d) — reconstruído: edge roteia por Host/URL → Collaborator/bananastand; **NOTA de campo:** testei hoje e o ATS do Yahoo tem `remap_required` → primitiva Host-based morre in-band (ver FP no arsenal). Empurrado p/ 1 semana (2026-09-14).
