# A caçada até aqui — Nexo

Log de progresso da sessão. Atualize ao fim de cada sessão. A **ficha** (`README.md`) é o estado destilado; este arquivo é a **narrativa + próximos passos**.

---

## Sessão 2026-09-05/06 — `modo sábado à tarde` → `modo dojo` → `protocolo ladrão de bancos` → `modo hunter` → `protocolo armar a arapuca`

### O que aconteceu
1. **`modo sábado à tarde`:** Nexo entrou no `portfolio.md` como **#5 Alta ⭐** — Intigriti público, 16 endpoints de API de dinheiro explicitamente in-scope + função de Transfer entre users, baixa saturação (148 subs/50 aceitas).
2. **`modo dojo`:** 2 write-ups distilados (race condition em saldo/saque — Josip Franjković; IDOR bancário em endpoint de fundo) → técnicas novas `S-RACE-01`, `S-FUND-01`, chain `C-08` no banco. Aplicadas como hipóteses H1–H3 na ficha recém-criada.
3. **`protocolo ladrão de bancos`:** recon passivo (crt.sh, Wayback/gau, urlscan, OSINT de API pública) + ativo não-autenticado (httpx/curl/katana, ≤5 req/s, header `X-Intigriti-Username: moldret`) nos 2 hosts in-scope. Achado estrutural: **`platform.nexo.com` barra cliente automatizado** (`cf-mitigated: challenge`) — a API real só é mapeável autenticado.
4. **`modo hunter`:** você registrou as 2 contas de teste (`@intigriti.me`) e navegou logado, colando as requests do DevTools. Mapeei o modelo de auth (JWT+nsi casados, RS256, binding via `nsi_sha=SHA256(nsi)` confirmado nas 2 contas) e o inventário de endpoints (`api_endpoints.md`).
5. **`protocolo armar a arapuca`:** 8 peças catalogadas; passo de combinação apontou **P1+P2 (userId exposto + previsível) → IDOR cross-user, faltando 1 elo (endpoint com id explícito)** como a chain mais promissora, e **P5+P6+P7 (KYC Java isolado + write-path + basic auto-declarado) → possível KYC bypass** como a segunda.
6. Você foi ao vivo no fluxo de **KYC "basic"** — capturei o fluxo completo (config → input-validation → progress×N → submit v2). Disparei um probe de mass-assignment (campos `verificationProcess`/`status`/`kycLevel` injetados) — **resultado do probe nunca confirmado** (você colou o leitor de estado, não o retorno do POST).
7. Descoberta que **muda o quadro:** `journeys/current/summary` continua `422` mesmo com o basic 100% preenchido → o "basic" é um **questionário AML auto-declarado**, não a verificação de identidade. O gate real de dinheiro está atrás de um journey "identity" separado (documento/liveness), ainda não iniciado.
8. Testei se eu consigo rodar sozinho requests autenticadas via `curl` com os cookies colados (sem depender do seu browser a cada passo): **1 GET com cookies válidos passou (422 esperado, sem bloqueio de challenge)** — indica que pelo menos leituras autenticadas *podem* ser meu trabalho, se você me passar cookies frescos; escrita/ações sensíveis continuam exigindo seu aval e execução por você ou confirmação explícita.

### Modelo de auth confirmado
- Sessão = `nsi` (opaco) + `nx_token` (JWT RS256, `aud:platform`, exp ~1h) **casados**: `nsi_sha` do JWT == `SHA256(nsi)` — verificado nas 2 contas.
- User id = MongoDB ObjectId, vazado em `ajs_user_id` e no corpo de erros 422.
- Serviço de KYC (`/api/cross/kyc/vc/*`) é **Java isolado** (`JSESSIONID` próprio, ≠ do resto).
- Todos os endpoints vistos até agora são **self-derived** (`current`, `/my/`) — nenhum aceita id explícito de outro usuário ainda.

### Leads no estado em que ficaram (ver ficha para detalhe/hipótese completa)
- **H1 (race em débito)** — `[UNTESTED]`, bloqueado: endpoints de dinheiro atrás do journey "identity" não iniciado.
- **H2/H3 (IDOR de fundo + chain)** — `[UNTESTED]`, bloqueado: nenhum endpoint com id explícito de outro user encontrado ainda; `transactions/{id}` tem id opaco.
- **H4 (tampering)** — `[UNTESTED]`, mesmo bloqueio de H1.
- **H5 (abuso de referral)** — `[UNTESTED]`, não explorado ainda (achado só via urlscan, não navegado ao vivo).
- **H6 (authz no WebSocket)** — `[UNTESTED]`, não explorado.
- **H7 (KYC bypass por mass-assignment)** — `[INCONCLUSIVO]`: probe disparado, resultado nunca confirmado; e a descoberta de que "basic" ≠ identity reduz a prioridade desse ângulo (não é o que destrava dinheiro).

### Já descartado / rebaixado
- **Mass-assignment no `basic` como caminho pro dinheiro** — rebaixado: mesmo que aceite os campos injetados, "basic" não é o gate (journeys/summary continua 422 depois dele). Se quiser reabrir, o alvo certo é o journey "identity", não o "basic".
- **KYC "basic" auto-declarado sozinho** — `[PADRÃO DA APLICAÇÃO]` provável (questionário AML self-attested é comum antes da verificação real); não vira achado isolado.
- **CORS em `nexo.com`** — sem reflexão de Origin malicioso; `[FP]`.
- **Datadog RUM key pública** — `[PÚBLICO POR DESIGN]`.

### Estado do git
Nada commitado nesta sessão (Tiago não pediu commit). Ver seção "Selo de saída" no chat pra lista de arquivos.

---

## Próximos passos (ordem sugerida)
1. **Decidir se avança no journey "identity"** (exige documento real/liveness — pausa deliberada nesta sessão) ou se pivota pro **H5 (referral)** e **H6 (WebSocket)**, que não dependem de KYC completo.
2. Se avançar no identity: capturar o fluxo completo (como fizemos pro basic) e procurar o mesmo padrão de mass-assignment / step-skip, agora no serviço que realmente decide o tier.
3. Continuar a caça pelo **elo que falta em P1+P2** — qualquer endpoint que aceite `userId`/id de objeto explícito (não `current`/`/my/`). Prioridade: telas de Transfer/histórico quando destravadas.
4. Explorar `nexo.com/ref/{code}` (H5) e a subscription do `wss://platform.nexo.com` (H6) — não dependem de KYC.
5. Achado real → `protocolo contra-prova` → `protocolo report`.

## Arquivos desta caçada
- `targets/nexo/README.md` — ficha (estado destilado + 7 hipóteses).
- `targets/nexo/arapuca.md` — inventário de peças + combinações (`protocolo armar a arapuca`).
- `targets/nexo/recon/` — `api_endpoints.md` (inventário de API mapeado autenticado), `_osint_summary.txt`, `probe.jsonl`, `cors_headers.txt`, `crt_nexo.txt`, `urlscan_inscope_paths.txt`, `wayback_platform_raw.txt`, `inscope_hosts.txt`, capturas HTML/headers.
- `targets/nexo/a-cacada-ate-aqui.md` — este log.
