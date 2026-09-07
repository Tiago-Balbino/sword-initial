# NBA — matriz do `formação tridente` 🔱

Alvo autorizado: nba-public (H1). `--rate 3`, manual-only. Compatível com `postura escudo` (fluxo legítimo = tráfego de usuário).
Engines: **Blink** (Chrome/Edge) · **Gecko** (Firefox) · **WebKit** (Safari). Ponta 0 = curl (sem-JS).

---

## Fluxo T1 — validação de `redirect_uri` do Entra (lead #1 / H9 · `S-OAUTH-REDIR-02`)

**Por que browser:** o `/authorize` do Entra virou uma página **"Redirecting"** com `window.location` em JS ofuscado — **curl não alcança a decisão** (provado 09/06: até `client_id` zerado não erra no curl; só `notaurl` dá 90102 server-side). Só um engine que roda JS mostra o `sErrorCode`/`AADSTS` real. **Não toca infra NBA** (bate em login.microsoftonline.com).

**Como rodar (cada engine, aba anônima, sem sessão Microsoft logada):** colar cada URL, deixar renderizar, anotar o **AADSTS####** / texto de erro exibido (ou se cai em tela de **login** = "passou o redirect").

Base: `https://login.microsoftonline.com/e898ff4a-4b69-45ee-a3ae-1cd6f239feb2/oauth2/v2.0/authorize?client_id=184b2132-fa57-418d-ae70-db4be50e5366&response_type=code&scope=api://671ab01d-c0dd-40fa-9aa2-fc7382c4a444/data.read&state=x&nonce=n&redirect_uri=<RU>`

| # | `redirect_uri` (<RU>, URL-encode) | Blink | Gecko | WebKit | curl(ponta0) |
|---|---|---|---|---|---|
| baseline | `teamone://oauth/` | | | | Redirecting(JS) |
| case-shift | `teamone://OAuth/` | | | | Redirecting(JS) |
| path-append | `teamone://oauth/x` | | | | Redirecting(JS) |
| sub-of | `teamone://oauth.evil/` | | | | Redirecting(JS) |
| **web control** | `https://evil.example/` | | | | Redirecting(JS) |
| malformed | `notaurl` | | | | **AADSTS90102** |
| client_id=0 | (RU=`teamone://oauth/`, client_id all-zeros) | | | | Redirecting(JS) |

**Leitura (o que eu interpreto do que você colar):**
- **web control `evil.example` → `AADSTS50011` (mismatch)** = Entra faz **exact-match** → hipótese frouxa **morre (FP)**; sobra só o risco de custom-scheme (outro app mobile registra `teamone://`).
- **web control → tela de login / `50058` igual à baseline** = **allowlist frouxa** → escalar (achado forte).
- **case-shift/path-append/sub-of aceitos** (viram login, não 50011) = matching não-exato → **lead `S-OAUTH-REDIR-02`**.
- **client_id=0 → 700016** confirma que o engine alcança a decisão (control de sanidade).
- **Divergência ENTRE engines** (ex.: WebKit parseia `teamone://oauth.evil/` diferente) = **P5 client-side** = lead próprio.

---

## Fluxo T2 — (pendente escopo) SSO web PingFederate/identity (`S-OAUTH-LEAK-01`)
Bloqueado: hosts `identity*`/`*-ping` **não confirmados no in-scope** (amostra 27/452) + superfície morta no recon (404/301). Só rodar após confirmar no CSV do programa. Aí: forçar erro no `/authorize` e ver se `code` sobra na error page + 3rd-party JS (chain com "sem CSP").
