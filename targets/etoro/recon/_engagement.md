# eToro — registro de engagement (Bugcrowd)

O programa exige `X-Bug-Bounty:<username>` em todo tráfego + registro de IP/UA/username (podem pedir).

- **Username Bugcrowd:** `moldret`
- **Header enviado em todo tráfego:** `X-Bug-Bounty: moldret`
- **IP de saída:** `177.40.95.165`
- **User-Agent (probe):** `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36`
- **Início da fase ativa:** 2026-09-05 00:42 -03
- **Ferramentas:** httpx (probe de hosts vivos, rate baixo), katana (crawl leve) — **sem tooling de volume/stress/DoS**.
- **Escopo tocado:** `*.etoro.com`, `etorox.com`, `etoropartners.com`, `delta.app` (in-scope).

## Log de sessões ativas
| Data | Ação | Hosts | Rate | Obs |
|------|------|-------|------|-----|
| 2026-09-05 | httpx probe dos 574 subdomínios | 574 | ~10 req/s | fase 1 (descoberta de vivos) |
