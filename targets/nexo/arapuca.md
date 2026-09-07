# Nexo — 🪤 arapuca (inventário de peças sub-críticas → caça à chain)
`protocolo armar a arapuca` (CODES.md). Regra: **só peça real e reproduzível**. Hipóteses UNTESTED ficam na ficha (H1–H7); aqui entra o que foi **observado**. Passo de combinação a cada 3–4 peças novas.

## Peças
| id | peça (1 linha) | acesso p/ usar | sev. isolada | o que HABILITA |
|----|----------------|----------------|--------------|----------------|
| P1 | **userId (Mongo ObjectId) exposto client-side** — cookie `ajs_user_id` + **corpo do erro 422** + campo `userId` em várias responses | própria conta (unauth-ish: o id é do próprio user, mas fica no cliente) | Info | pré-requisito de **IDOR por id explícito** — se algum endpoint aceitar `userId`, já temos o valor. Vaza o id de QUALQUER user cujo erro/response a gente provoque |
| P2 | **ObjectId é timestamp-prefixado** (4B ts + 5B random + 3B counter) — hora de criação legível no próprio id | — | Info | estreita enumeração: com P1, se houver endpoint id-explícito, o ts reduz o espaço de busca (random ainda barra brute puro) |
| P3 | **CSP do `nexo.com` é report-only** (não enforça); só `frame-ancestors` é enforçado | unauth | Info/Low | um XSS refletido no marketing `nexo.com` **não seria bloqueado** pela CSP → amplifica qualquer reflexão achada ali |
| P4 | **`security-withdrawal` default = `isEnabled:false, policies:[]`** em conta nova | própria conta | Info | conta fresh **sem política anti-fraude de saque** → menos guardrail no caminho de withdrawal (liga com H1 race / H4 tampering) |
| P5 | **KYC é microserviço Java isolado** — `/api/cross/kyc/vc/v1/*` emite `JSESSIONID` próprio (≠ do `nx_token`/`nsi` do resto) | própria conta | Info | fronteira de **sessão/authz entre 2 stacks** — se o serviço Java confiar num header/campo que o front seta (ou vice-versa), abre bypass (liga com H7 KYC-bypass) |
| P6 | **KYC write = `POST .../basic/progress` (204)** avança o estado; serviço Java | própria conta | Info | superfície de escrita do H7 — se o body tiver `step`/`status` client-controlado → step-skip/mark-complete = KYC bypass |
| P7 | **KYC basic é auto-declarado** (nome+endereço, sem doc/liveness/3rd-party; validação só de formato) | própria conta | Info/Low | se completar o basic destrava movimento de dinheiro → base de **KYC/AML bypass**; superfície p/ **mass-assignment de tier** no serviço Java |
| P8 | **`streetAddress`/`city` free-text não re-validados** no `progress`/`v2 basic` (input-validation só cobre nome) | própria conta | Low | **stored XSS cego** se painel de compliance renderizar → e injeção de dado em registro KYC |

## Passo de combinação — passada #1 (2026-09-06)
Cruzando par a par / trios contra as chains do `arsenal.md`:

- **P1 + P2 + [elo faltando: endpoint com id explícito]** → **IDOR de leitura cross-user**. Temos o id (P1) e a previsibilidade parcial (P2); **falta um endpoint que aceite `userId`/objectId no path/body** em vez de `current`/`/my/`. → **elo é o próximo alvo de captura.** Casa com `S-FUND-01`/`C-02` (info→IDOR).
- **P4 + H1 (race de saque)** → saque sem política de segurança + race no débito = **double-spend mais fácil** (menos checagem no caminho). Falta: chegar no endpoint de withdrawal (gated por KYC).
- **P5 + H7 (KYC bypass)** → se o serviço Java de KYC valida estado por um campo/sessão que o cliente influencia, marcar `basic` como completo destrava dinheiro. Falta: capturar a request de **escrita** do KYC (submit de step).
- **P3** → dormant por ora (precisa de uma reflexão XSS em `nexo.com`, ainda não achada).

### 🎯 Melhor chain candidata agora
**P1+P2 → IDOR cross-user**, faltando **1 elo**: um endpoint que aceite id explícito (não `current`/`/my/`). É o que a caça de captura deve procurar a seguir. Segunda mais promissora: **P5+H7** (KYC-bypass no serviço Java) — depende da request de escrita do KYC.

## Peças dormentes
- P3 (CSP report-only) — reativar se surgir reflexão em `nexo.com`.
