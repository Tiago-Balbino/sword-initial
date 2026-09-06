# sources.md — Feeds pra continuar minerando

Onde buscar write-ups novos de qualidade pra distilar no banco. (Curadoria, não dump.)

## Repositórios-curadoria (ouro)
- **Google VRP writeups** — https://github.com/xdavidhu/awesome-google-vrp-writeups (CSV com centenas, filtrável por classe)
- **HackerOne top reports por tipo** — https://github.com/reddelexc/hackerone-reports (top por classe: BAC, business logic, IDOR, SSRF...)
- **Full Bug Bounty Methodology 2026** — https://github.com/Cyber-note/Full-Bug-Bounty-Hunting-Methodology-2026

## Estudo estruturado (padrões canônicos)
- **PortSwigger Web Security Academy** — https://portswigger.net/web-security (labs grátis; a referência pra BAC e lógica)
  - Access control — https://portswigger.net/web-security/access-control
  - Business logic — https://portswigger.net/web-security/logic-flaws
  - Race conditions — https://portswigger.net/web-security/race-conditions
- **YesWeHack learn** — https://www.yeswehack.com/learn-bug-bounty (ex.: guia de race condition)

## Disclosure ao vivo
- **HackerOne Hacktivity** — reports divulgados (filtrar por bounty/classe).
- **Google Bug Hunters** — https://bughunters.google.com (leaderboard + write-ups oficiais).
- **Critical Thinking podcast / blog** — write-ups avançados (ex.: RCEs em Google).

## Programas novos / pouco saturados
Ver os logs do projeto: `radar-plataformas-log.md` e `radar-noticias-log.md` (radares diários).

---
**Rotina sugerida:** ligue o **`modo dojo`** (CODES.md) e pegue 2–3 write-ups da classe que está caçando. O dojo não deixa parar na leitura: distila a mecânica no arquivo certo (+ `signals.md` + `_ingested.md`), força **recall** (reconstruir de memória), **aplica** o sinal novo nas fichas vivas, e **agenda revisão espaçada** no `dojo-log.md`. Promova a `patterns.md` se for transversal.
