# Nexo — Inventário de endpoints de API (mapeado por captura autenticada)
Host in-scope: `platform.nexo.com`. Descoberto navegando logado (conta2 `6a9cd30a…b75`). GET = read; falta capturar os POST/PATCH de escrita.

## Namespaces vistos
- `/api/1/…` — API legada (16 endpoints de dinheiro do escopo Tier 1 + `biometry_signin`, `check_session`).
- `/api/platform/…` — serviços da plataforma.
- `/api/cross/…` — serviços "cross" (account, identity, kyc). **Alguns setam `JSESSIONID` → microserviço Java.**
- `/api/trading/advanced/facade/…` — facade de trading (escopo Tier 1).

## Endpoints confirmados (método · path · nota)
| Método | Path | Estado | Nota |
|---|---|---|---|
| GET | /api/cross/account/ac/v1/journeys/current/summary | 422 | onboarding "journey"; **derivado da sessão** (`current`) → sem IDOR; erro vaza userId |
| GET | /api/platform/loyalty/v1/config | 200 | config do programa de fidelidade |
| GET | /api/platform/notification/v1/user_preferences | 200 | reflete `userId` no corpo; `policies:[]` |
| GET | /api/platform/crypto/v1/security-withdrawal | 200 | política de segurança de saque: `{userId,isEnabled:false,policies:[]}` — **relevante p/ H1** |
| GET | /api/cross/identity/ic/v1/my/credential-details | 200 | credenciais (email/phone/password) + `linkedAccounts`; usa `/my/` (self) |
| GET | /api/cross/kyc/vc/v1/verifications/basic/config | 200 | **config do KYC básico** (Java: JSESSIONID) — alvo H7 |
| GET | /api/cross/kyc/vc/v1/verifications/basic/progress | 200 | **progresso do KYC** (estado da verificação) — alvo H7; falta o corpo |

## Padrão de identidade observado (bom design até agora)
Todos self-derived: `current` / `/my/`. **Nenhum endpoint com id explícito ainda** → IDOR precisa achar um que aceite id de objeto/usuário no path/body. Continuar procurando.

## Notas
- `pub81f894744f4fee5185719cf716f4809d` (Datadog RUM `dd-api-key` no `browser-intake-datadoghq.eu`) = **client token PÚBLICO POR DESIGN** (prefixo `pub`, write-only p/ RUM intake) → NÃO é bug. [PÚBLICO POR DESIGN]
- `security-logging.nexo.com` (Express) recebe CSP-reports com `Origin: null` — OOS (host fora do escopo).
- Header de request visto: `x-conversion-experiment: variant_b` (flag de A/B server-side no cliente).

## KYC write-path descoberto (2026-09-06) — alvo H7
| Método | Path | Estado | Nota |
|---|---|---|---|
| POST | /api/cross/kyc/vc/v1/verifications/basic/input-validation | 200 | body 81B → resp `{"isValid":true}` — **valida campo** (formato? ou verdade?) |
| POST | /api/cross/kyc/vc/v1/verifications/basic/progress | **204** | body 125B → **AVANÇA o estado do KYC**. O write do H7. FALTA o body (o que carrega: step? status? data?) |
| POST | /api/platform/events/v1/authenticated | 202 | evento analytics autenticado; `ACAO:platform`+`ACA-Credentials:true` |

**Sequência observada:** input-validation (isValid:true) → progress (204). Cliente valida → POSTa progress p/ avançar.
**Hipótese de ataque:** POSTar `progress` direto pro passo final / repetir p/ pular etapas (Q4); se o body tiver `status`/`step`, setar "completed" (Q2); se `input-validation` só checa formato (não verdade), o `basic` é auto-declarado → completar com dado fake destrava tier (Q6).
**FALTA capturar:** os **bodies** de `input-validation` (81B) e `progress` (125B) + os corpos de `config`/`progress` (GET).

## KYC "basic" — modelo de dados (bodies capturados 2026-09-06; PII redigida)
- `POST input-validation` body: `{"countryIso3Code":"BRA","userInput":{"firstName":"<...>","lastName":"<...>"}}` → `{"isValid":true}` (valida **formato**, não verdade).
- `POST progress` body: `{"countryIso3Code":"<ISO3>","firstName":"<...>","lastName":"<...>","streetAddress":"<...>","city":"<...>","postalCode":"<...>"}` → **204**.
- **Conclusão:** basic KYC = **auto-declarado, sem doc/liveness/3rd-party**. Nenhum campo `status`/`step`/`level` no body → o servidor deriva a progressão. **Teste decisivo pendente:** injetar `status`/`verificationLevel`/`approved` no `POST progress` (mass-assignment no serviço Java) + ver o que o basic destrava.

## KYC basic — fluxo COMPLETO (2026-09-06)
- Multi-step, cada passo `POST .../vc/v1/verifications/basic/progress` (204) acumula: nome+país → +endereço → +occupation → +sourceOfCrypto/sourceOfFunds → +natureOfBusiness/totalWealth.
- **Submit final:** `POST /api/cross/kyc/vc/v2/verifications/basic` [200] (v2) com o dataset completo.
- Enums observados: `occupation:kyc-employed`, `sourceOfCrypto:kyc-mining`, `sourceOfFunds:kyc-employment-income`, `natureOfBusiness:kyc-construction`, `totalWealth:5000000+`.
- **State model (GET profile):** `{user:{profileType,verificationProcess:"identity",countryId:<ObjectId>,ssn,disabled,firstName,lastName,streetAddress,city,postalCode,streetNumber,stateOrProvince}}`.
- **Validação:** `input-validation` só checa `firstName/lastName` (nested `userInput`); `progress`/`v2 basic` aceitam o resto (streetAddress etc.) **sem re-validar** → free-text não sanitizado (candidato a stored XSS cego em painel de compliance).
- **Alvos de mass-assignment (nomes reais):** `verificationProcess`, `profileType`, `disabled`, `ssn`. Testar injetar valor que eleve o tier sem documento.

## Ajuste de entendimento (2026-09-06)
- `basic/config` = **schema do formulário** (campos/países/deps regulatórias: PEP, tax, MiCA, SoF, wealth). Não-sensível.
- **`journeys/current/summary` = 422 MESMO após completar o basic** → o "basic" é **questionário AML auto-declarado**, NÃO a verificação de identidade. O dinheiro é gated atrás do **journey "identity"** (documento/liveness), fluxo separado ainda não disparado.
- **Veredito parcial H7:** basic self-attested = **by-design** (não é bug isolado). O alvo de bypass verdadeiro é o **journey de identidade**. Mass-assignment no `v2 basic`: **resultado ainda não confirmado** (probe não retornado).
