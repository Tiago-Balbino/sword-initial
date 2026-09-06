# Airbnb — leads do recon Nível 1 (passivo) — 2026-09-06

Fonte: subfinder -all + crt.sh (só terceiros, zero-toque). 7712 subs únicos.
⚠️ Nenhum host foi probado ainda (Nível 1 = passivo). Vivência/painel exposto = **hipótese**, confirmar só em Nível 2+.

## 🔴 Tier A — cantos frescos que batem nas hipóteses (prioridade máxima)

### Payments (`*.airbnbpayments.com` — Higher Impact, Crit $18–25k) → H2
- `login.airbnbpayments.com` · `gateway.airbnbpayments.com` · `iframes.airbnbpayments.com` (+ `iframes-dev`, `int.iframes`, `data.iframes`, `monitor.iframes`) · `chat.airbnbpayments.com` · `vpn.airbnbpayments.com`
- Angulo: iframe de payment (PCI/postMessage), gateway de payout, login separado da conta Airbnb → IDOR de instrumento/payout + lógica de split.

### Host / Co-Host / ProHost (`*.withairbnb.com` — Higher Impact) → H1
- `host.withairbnb.com` · `hostadvance.withairbnb.com` (+ `app.hostadvance`, `-reg`) · `hosting.withairbnb.com` · `hostsuccess.withairbnb.com` · `cohostsuccess.withairbnb.com` · **`protools.withairbnb.com`** · `multifamily-backend.withairbnb.com` · `affiliate.withairbnb.com` · `emart.withairbnb.com`
- Angulo: ferramentas de papel Host/ProHost/property-manager → BAC entre papéis (guest↔host↔cohost), multifamily = property manager (papel elevado).

### HotelTonight partners (Lower Impact, mas test env dedicado) → H1/H3
- `partners.hoteltonight.com` · `beta-partners.hoteltonight.com` · `partners-desktop`/`partners-dev` · `*.hoteltonight-test.com` (ambiente de teste, cartão 4111...)
- Angulo: portal de parceiro (hotel) = papel B2B; provar lógica de payment no test env sem dinheiro real.

## 🟠 Tier B — infra marketing/WordPress (menos-lavado, low-hanging clássico)
- `cpanel.multifamily.withairbnb.com` · `whm.withairbnb.com` · `wpadmin.withairbnb.com` · `webmail.multifamily.withairbnb.com` · `webdisk.multifamily.withairbnb.com` · `github.withairbnb.com` · `jenkins.withairbnb.com`
- Angulo: cPanel/WHM/wp-admin expostos em domínio de marca in-scope = superfície clássica (WP plugin CVE, painel exposto, takeover). ⚠️ confirmar vivência+controle antes de reportar (painel só-exposto pode ser NA).

## 🟡 Tier C — infra interna `*.musta.ch` (in-scope Higher Impact, se alcançável)
- `argocd.prod.musta.ch` / `argocd.prod.galileo.musta.ch` / `argocd.braintrust.musta.ch` (+ dev/test/agent) · `artifactory.musta.ch` (+ cneng/cnprod/dev) · `auth.musta.ch` / `auth.us-east-1.prod.musta.ch` · `bouncer.musta.ch` · `console.prod.galileo.musta.ch` · koko gateway (`*.aws.us-east-1.koko.musta.ch`)
- Angulo: ArgoCD/Artifactory/console de deploy expostos = RCE/supply-chain se sem auth. ⚠️ ALTÍSSIMO risco de já estar atrás de VPN/mTLS (não-alcançável) — Nível 2 dirá em 1 GET. Provável 403/timeout.

## Contagem por raiz in-scope
airbnb.com 1860 · luxuryretreats.com 4539 (Lower) · musta.ch 471 · muscache.com 201 · airbnbcitizen.com 175 · withairbnb.com 133 · hoteltonight.com 118 · airbnb.org 72 · atairbnb.com 63 · byairbnb.com 41 · airbnb-aws.com 24 · airbnbpayments.com 15

---
## Nível 3 (completo) — 2026-09-06
dnsx: 406/7712 resolvem · httpx: **322 respondem** (98×200, 103×301, 70×302, 14×403, 7×401, 4×429).
Cru: `resolved_all.txt`, `probe_all.jsonl`.

### Novos leads N3 (além dos Tier A/B/C do N1/N2)
- **`api-docs.hoteltonight.com`** (200, "HotelTonight API Documentation") — mapa de endpoints HT p/ H1/H3.
- **`k8s-oidc-provider.musta.ch` / `-staging`** (403, alcançável!) — provider **OIDC** de auth interno in-scope → angulo auth/token (raro estar público).
- **Auth-gated (401 = superfície de BAC quando tiver conta):** `community-staging.withairbnb.com` · `ice.hoteltonight.com` · `impact.next.airbnb.com` · `impact-assets.{next,sb}.withairbnb.com` · `careers.sb.withairbnb.com`.
- **`imagery.hoteltonight.com`** (imgix) — CDN de imagem on-demand → angulo param/SSRF-via-image-proxy (imgix URL API).
- **`brand.withairbnb.com`** (Google Frontend, "Airbnb Brand Hub"), **`developer.withairbnb.com`** (Partner API docs) — mapas.
- `*.airbnb.org` = ~30 subs de locale (mesmo app "Airbnb.org", non-profit) — 1 app, N idiomas; testar 1 serve por todos.

### O que NÃO resolveu / não alcançável (fechado)
- Painéis internos `argocd.prod`/`artifactory`/`login.airbnbpayments`/`gateway.airbnbpayments` — **sem DNS público** (atrás de DNS privado/VPN). Tier C morre aqui, exceto o `k8s-oidc-provider` e `auth.*` que respondem.
