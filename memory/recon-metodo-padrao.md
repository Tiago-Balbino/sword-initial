# recon-metodo-padrao.md — como o nosso recon captura TUDO (padrão)

**Origem:** benchmark `recon-benchmarks/yahoo-2026-09-07-externo/` — recon externo achou **53.627 subs** e o ecossistema **payment/oauth/admin** da Yahoo; o nosso pegou 40 e perdeu tudo isso. Este doc codifica o porquê pra não repetir.

## As 3 causas do gap (e o fix)
1. **subfinder SEM API keys = quase inútil em alvo grande** (40 vs 53k).
   - **Fix:** configurar `~/.config/subfinder/provider-config.yaml` com keys (VirusTotal, SecurityTrails, Censys, Shodan, GitHub, Chaos, BeVigil…). Sem keys, subfinder só bate nas fontes free e satura. **É o item #1.**
   - Compensar parcialmente sempre com **crt.sh + certspotter** (já no fluxo; crt.sh dá 502 — ter retry).
2. **Resolver local (dnsx/socket) perde muito e satura.**
   - **Fix:** `tools/resolve_doh.py` — resolução em massa via **DNS-over-HTTPS** (dns.google + cloudflare, `curl_cffi` impersonando Chrome). Pega CNAME/A que o resolver local nega e fura rate-limit. (externo: 41k resolvidos via DoH.)
   - `pip install curl_cffi` (senão roda degradado com requests).
3. **Faltava o passo de SÍNTESE por token de alto valor** — a gente parava no host, não garimpava o corpus.
   - **Fix:** grep obrigatório do corpus por padrões que revelam superfície de dinheiro/auth/admin (abaixo).

## Pipeline padrão (ladrão de bancos — Nível 1→3)
```
# 1. Passivo amplo (várias fontes)
subfinder -d <alvo> -all -silent            # COM keys!
crt.sh (%25.<alvo> + tokens) + certspotter  # via curl+jq (retry no 502)
#   → all_subs.txt (dedup)

# 2. Resolução em massa (local + DoH)
dnsx -l all_subs.txt -silent -o resolved_dnsx.txt
python3 tools/resolve_doh.py -i all_subs.txt -o resolved_doh.txt -t 64
#   → união dos dois = resolved.txt

# 3. Probe vivo (com header do programa!)
cat resolved.txt | httpx -H "<header do programa>" -sc -title -server -tech-detect -location -json > probe.jsonl

# 4. SÍNTESE por token (o passo que a gente pulava)
grep -iE '<tokens abaixo>' all_subs.txt      # superfície
# + categorizar probe.jsonl por status/title/tech
```

## Tokens de alto valor (grep SEMPRE no corpus)
- **Dinheiro:** `payment` `payments` `checkout` `token-service` `wallet` `billing` `subscriptions` `carta` `invoice` `order` `refund` `payout` `charge`
- **Auth/OAuth:** `oauth` `oauth2` `authnapi` `acctapi` `umapi` `login` `sso` `oidc` `token` `identity` `session` `partner.login`
- **Admin/interno:** `admin` `internal` `corp` `dashboard` `console` `jenkins` `kibana` `grafana` `credstore` `cloudboot` `kubeingress`
- **Origens diretas (bypass de CDN/WAF):** `origin` `direct` `backend` `-lb` `edge` `.vip.` — **`origin.*` atrás de AWS ELB = direct-origin/host-confusion**
- **Ambientes fracos:** `dev` `qa` `stage` `staging` `beta` `gamma` `canary` `trunk` `perf` `sandbox` `pr-` `test` `mock`

## Split de infra = costura pra testar
Capturar o `tech`/`server` do httpx e agrupar: onde o stack MUDA entre hosts irmãos (ATS ↔ Google Cloud CDN ↔ AWS ELB/CloudFront) mora a quebra de suposição de confiança (Q3/Q5 do The Mind). Ex. Yahoo: edge ATS, `authnapi`=GCP, `origin.checkout`=AWS ELB.

## 4ª causa de gap (aprendida no Yahoo 09/07): dissecar TODOS os headers, não só Location/Content-Type
Um probe autenticado ficou 5 rodadas checando só `status`/`Location`/`Content-Type` de um 404 e quase deixou passar `x-amzn-mtls-clientcert-*` (certificado mTLS interno + identidade Athenz do serviço vazando na resposta). **Regra:** todo probe relevante (autenticado, ou qualquer resposta "estranha" — mesmo um 404 comum) precisa imprimir **o header dump completo**, não só os 3-4 campos óbvios. Custa nada e às vezes é o achado. Ferramenta: `tools/yahoo_auth_probe.py --headers` (ou `httpx -include-response-header` / `curl -i` em geral). Ver `targets/yahoo/arapuca.md` peça Y16.

## Como treinar contra benchmark
`recon-benchmarks/<alvo>/` = gold standard. Rodar o nosso e diffar:
```
comm -23 <(sort ext_inscope.txt) <(sort nosso_inscope.txt)   # o que perdemos
```
Meta: gap → 0. Todo alvo novo com benchmark alimenta este doc.

## Checklist rápido (não esquecer)
- [ ] subfinder com keys · [ ] crt.sh+certspotter+retry · [ ] DoH resolve · [ ] httpx COM header do programa · [ ] grep dos tokens · [ ] split de infra · [ ] **dissecar TODOS os headers de toda resposta relevante (não só status/Location/Content-Type)** · [ ] diff vs benchmark se houver.
