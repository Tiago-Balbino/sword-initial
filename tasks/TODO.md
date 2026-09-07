# TODO — Sword (lista de tarefas)

Atualizado: 2026-09-07. Ordem = prioridade. `[x]` feito · `[ ]` pendente · `[~]` em andamento/bloqueado.

---

## 0. ⚙️ TERMINAR DE CONFIGURAR O RECON (PRIMEIRO — destrava tudo)
> Sem isso, nosso recon perde ~99% da superfície (Yahoo: 40 subs vs 53k do externo). Método: `memory/recon-metodo-padrao.md`.

- [x] **`pip install curl_cffi`** — feito 2026-09-07 (v0.16.3). `tools/resolve_doh.py` roda com impersonation Chrome.
- [ ] **API keys do subfinder** (ação do Tiago) — o item #1 do gap. Configurar `~/.config/subfinder/provider-config.yaml` com: VirusTotal, SecurityTrails, Censys, Shodan, GitHub, Chaos, BeVigil. (grátis dá pra pegar quase todas.)
- [ ] **Validar o método completo** — re-rodar o Yahoo com keys + DoH e diffar contra `recon-benchmarks/yahoo-2026-09-07-externo/`. Meta: gap → 0.

## 1. 🎯 YAHOO — caçada recomendada (maior EV)
- [ ] **Re-rodar recon com keys+DoH** → alcançar os hosts de payment/oauth (hoje 403, mas mapeados).
- [~] **L7 — routing-SSRF (Burp)** — kit pronto em `targets/yahoo/l7-burp-kit.md`. Tiago dispara B→C→D→E (começa `apis.mail.yahoo.com`), aponta o fetch pro bananastand; Claude interpreta. **Yahoo paga SSRF + testbed; precedente $20k×2.**
- [ ] **L8 — `oidc.checkout.*` (OAuth+pagamento)** — casa com o dojo (redirect_uri/dirty-dancing) + lógica de checkout. Precisa conta `+x@intigriti.me`.
- [ ] **L9 — OAuth API** (`api.oauth.yahoo.com`/`sapi.oauth2` HTTP) + **L10 admin** (`mario-admin.nevec`).

## 2. 🏀 NBA — banca rápido (achado em mãos)
- [ ] **`escada de jacó`** no `[ACHADO]` `markContentRead`/`updateContentReadCount` (BAC unauth, Low→Medium) — tentar subir a severidade.
- [ ] **`protocolo report`** do achado (o trabalho já feito vira submissão).
- [~] L1 `redirect_uri` Azure AD — bloqueado (veredito atrás de JS; precisa extensão Chrome ou conta MS). `tridente.md` T1 pronto.

## 3. Backlog (quando destravar)
- [ ] **eToro** — MCP servers / `oauth.wallet` OpenBanking; atrás do WAF CF → `formação tridente` (navegador real).
- [~] **Nexo** — H1 (race) / H2 (IDOR de fundo); **travado** no journey de identidade (doc/liveness real).
- [~] **CoinSpot** — chain nonce-parser (arapuca 19 peças); precisa 2 contas + `jadx`/`apktool` pro APK.
- [~] **Arkose** — IDOR cross-tenant no portal; sem self-register (sem conta).

## 4. Infra / manutenção
- [ ] Commitar o avanço acumulado (ficha Yahoo + método padrão + benchmark + banco/dojo).
- [ ] (opcional) `pip install --upgrade pip` (25.3→26.2).
