# Airbnb — 🔱 formação tridente (teste diferencial multi-navegador)

Rodar cada fluxo por **3 engines** e diffar. **Divergência entre engines = bug P5 na camada do cliente**
(CSP, SameSite, redirect/URL parsing, DOM/mutation-XSS, charset, WCD cache-key).
Compatível com o silencioso (fluxo legítimo = tráfego de usuário). Header do programa em todos: `X-HackerOne-Researcher: moldret`.

- **Blink** = Chrome (posso dirigir via `claude-in-chrome`).
- **Gecko** = Firefox (Tiago roda; passos abaixo).
- **WebKit** = Safari (Tiago já usa; é o da captura original).

## Por que estes fluxos (as costuras client-side do modelo — de `descobrir a roda`)
O maior potencial de divergência está onde **URL/redirect é parseado** e onde **cookie/CSP é imposto** —
é aí que engines discordam e um bug de auth aparece em UM só.

## Matriz (preencher por engine)

### Fluxo T1 — Handoff SSO cross-locale (`.com` → `.com.br`) — RODADO unauth 2026-09-06 (Playwright)
Hipótese: eTLD+1 diferentes → cookie não cruza → handoff com token na URL. **Resultado unauth: sem handoff com token** (navegação simples; cada domínio seta seus próprios cookies). MAS achou divergência de SameSite.
| Item | Blink (Chromium) | Gecko (Firefox) | WebKit (Safari) |
|---|---|---|---|
| final URL | `www.airbnb.com.br` | igual | igual |
| token/JWT na URL | nenhum | nenhum | nenhum |
| redirects | 0 | 0 | 0 |
| **SameSite de cookies SEM atributo** (`bev`/`_user_attributes`/`everest_cookie`/`country`) | **`Lax`** (default Blink) | **`None`** | **`None`** |
| CSP capturada | sim (.com) | sim (.com) | vazia (artefato de captura) |
| **divergência** | ⚠️ **SameSite-default: Blink=Lax vs Gecko/WebKit=None** — em cookie de tracking = baixo valor; **confirmar no cookie de SESSÃO autenticado = potencial CSRF só em Safari/Firefox (P5)** | | |

**T1 autenticado — RODADO 2026-09-06 (sessão real via cookies):** confirmado — `_aat`/`_airbed_session_id`/`_aaj` (session cookies) vêm **sem atributo SameSite**: Blink trata como `Lax` (default moderno), WebKit/Gecko tratam como `None`. Divergência real confirmada nos 3 engines.

**Teste de explorabilidade (csrf_probe.js, não-destrutivo):** a API exige `X-Airbnb-API-Key` em toda request — sem ele, `400` mesmo com cookie válido. Header custom **não é setável em request cross-site simples** (dispara CORS preflight, que a Airbnb não libera pra origem arbitrária) → **CSRF via SameSite-gap NÃO é explorável nesta API**.

**Veredito final T1: `[FP — Informative/Low]`.** A divergência de engine é real (bug de higiene: deveriam declarar `SameSite=Lax` explícito), mas o `X-Airbnb-API-Key` já barra o cross-site independente do SameSite — defense-in-depth funcionando. Sem PoC de impacto. Não vale report como está; só relevante se aparecer uma rota que aceite state-changing **sem** o header custom (não encontrada até agora).

### Fluxo T2 — OAuth login (Sign in with Google/Apple) — parsing de `redirect_uri`/`state`
Hipótese: normalização de `redirect_uri` (barra, `@`, `#`, encoding, `\`) difere por engine → redirect_uri bypass só em um.
| Item | Blink | Gecko | WebKit |
|---|---|---|---|
| `redirect_uri` + `state` na URL de autorização | | | |
| aceita `redirect_uri` malformado? (teste manual, sem enviar cred) | | | |
| divergência observada? | | | |

### Fluxo T3 — CSP + assets assinados (`muscache`/iframe payment)
Hipótese: `Content-Security-Policy` imposta diferente (report-only vs enforce; `frame-src`/`img-src`) → carrega em um, bloqueia em outro.
| Item | Blink | Gecko | WebKit |
|---|---|---|---|
| CSP header presente/enforce? | | | |
| iframe/img de origem cruzada carrega? | | | |
| console CSP violations | | | |
| divergência observada? | | | |

### Fluxo T4 — SameSite da sessão (navegação cross-site → POST)
Hipótese: default SameSite (Lax) e o timing de "Lax-allow-2min" divergem Blink↔WebKit → cookie de sessão enviado num contexto cross-site só em um (CSRF/logout-CSRF P5).
| Item | Blink | Gecko | WebKit |
|---|---|---|---|
| SameSite dos cookies de sessão | | | |
| cookie enviado em navegação top-level cross-site? | | | |
| divergência observada? | | | |

## Recon servidor (igual p/ 3 engines — capturado 2026-09-06)
- **T1 unauth:** `airbnb.com.br` → 301 → `www.airbnb.com.br` (só canonical www; o **handoff de sessão .com↔.com.br só aparece logado** — precisa teste no browser, Tiago).
- **T3 CSP (`www.airbnb.com`, enforce, report_only=false):** ⚠️ **CSP fraca** —
  - `script-src` contém o token **bare `https:`** (+ `'unsafe-eval'`) → **qualquer script https é permitido**, neutraliza allowlist+nonces+hashes. Sinal `S-CSP-01`.
  - `frame-src *` → emoldura qualquer origem. `default-src 'self' https: blob:` e `img-src ... https:` também largos.
  - **Consequência:** CSP não mitiga XSS de script externo — vira **habilitador de chain** (C-05: CSP larga + XSS em subdomínio `*.airbnb.com` → teu script https carrega). Isolada = Informative/prob. conhecida; só vale com uma injeção pra chainar.
- **Anti-abuso empilhado:** **Airlock V2** + **DataDome** (`datadome` cookie, SameSite=Lax) + **Arkose Labs** (`*.arkoselabs.com` na CSP) — 3 camadas; relevante p/ qualquer teste de força/automação (não brutar).
- **Cookies (T4):** `bev`/`everest_cookie`/`country`/`_user_attributes` setados **sem atributo SameSite** (Domain=.airbnb.com) → default por-engine. Os de **sessão** (logado) é que importam — capturar no browser e comparar SameSite Blink×WebKit.

## Achados de divergência
_(nenhum ainda — preencher quando um engine diverge dos outros; recon servidor acima é a baseline)_

## Próximo
Começar por **T1** (handoff cross-locale) — maior EV, e o Tiago já viu o comportamento (logado nos dois).
