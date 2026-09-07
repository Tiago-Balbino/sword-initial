# _ingested.md — Índice de ingestão (dedup)

Toda URL já distilada no banco fica listada aqui. A tarefa diária lê este arquivo e
**só ingere write-ups cuja URL não esteja nesta lista**. Ao distilar algo novo, adicione a URL aqui.

## Ingeridos

### Broken Access Control / IDOR
- https://balook.medium.com/idor-in-google-datastudio-google-com-f2fa51b763de
- https://r0ckinxj3.wordpress.com/2021/10/24/a-7500-google-sites-idor/
- https://feed.bugs.xdavidhu.me/bugs/0009
- https://medium.com/@ggilang1135/broken-access-control-can-create-asset-library-whereas-role-access-is-billing-idor-b1b632f2c281
- https://prakhar0x01.github.io/write-ups/2025/08/11/hacking-google/

### Lógica de negócio
- https://www.hackerone.com/blog/how-business-logic-vulnerability-led-unlimited-discount-redemption
- https://corneacristian.medium.com/top-25-race-condition-bug-bounty-reports-84f9073bf9e5
- https://github.com/reddelexc/hackerone-reports/blob/master/tops_by_bug_type/TOPBUSINESSLOGIC.md
- https://hackerone.com/reports/672487
- https://sm4rty.medium.com/hunting-for-bugs-in-shopping-billing-feature-79055d5f399b

### Recon & superfície
- https://github.com/Cyber-note/Full-Bug-Bounty-Hunting-Methodology-2026
- https://ahmdhalabi.medium.com/ultimate-reconnaissance-roadmap-for-bug-bounty-hunters-pentesters-507c9a5374d
- https://www.offensity.com/en/blog/just-another-recon-guide-pentesters-and-bug-bounty-hunters/
- https://sukhveersingh97997.medium.com/subdomain-takeover-beyond-basics-from-a-bug-bounty-hunters-perspective-8a7ec892ff14

### Fontes-curadoria (repos/academies — referência, já mapeados)
- https://github.com/xdavidhu/awesome-google-vrp-writeups
- https://portswigger.net/web-security/access-control
- https://portswigger.net/web-security/logic-flaws

## Sincronizados 2026-08-31 (do banco cloud)
- https://portswigger.net/research/the-fragile-lock
- https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-bypassing-access-controls-using-email-address-parsing-discrepancies
- https://jdsec.cloud/posts/2026-01-17-privilege-escalation-via-a-service-account-impersonation-chain/
- https://brutecat.com/articles/youtube-creator-emails
- https://www.elttam.com/blog/leaking-more-than-you-joined-for/
- https://portswigger.net/research/listen-to-the-whispers-web-timing-attacks-that-actually-work

## Sincronizados 2026-09-01 (do banco cloud)
- https://michaeldalton.au/posts/hacking-google-support
- https://zhero-web-sec.github.io/research-and-things/nextjs-and-the-corrupt-middleware
- https://bughunters.google.com/reports/vrp/7EhAw2hur
- https://www.yeswehack.com/learn-bug-bounty/ultimate-guide-race-condition-vulnerabilities

## Sincronizados 2026-09-04 (do banco cloud)
- https://github.com/advisories/GHSA-g38m-r43w-p2q7
- https://zhero-web-sec.github.io/research-and-things/eclipse-on-nextjs-conditioned-exploitation-of-an-intended-race-condition
- https://slcyber.io/research-center/novel-ssrf-technique-involving-http-redirect-loops/

## Dojo 2026-09-05 (recall + aplicação → Nexo)
- https://www.josipfranjkovic.com/blog/race-conditions-on-web
- https://www.webasha.com/blog/what-is-an-example-of-a-real-bug-bounty-report-where-idor-was-used-to-exploit-a-banking-application

## Dojo 2026-09-06 (recall + aplicação → Airbnb)
- https://arxiv.org/html/2605.25865  (taxonomia BOLA — 6 famílias, dojo 2026-09-06)
- https://portswigger.net/web-security/logic-flaws/examples  (5 famílias canônicas de lógica, dojo 2026-09-06)

## Dojo 2026-09-06 (2ª sessão — OAuth redirect_uri, recall + aplicação → NBA)
- https://portswigger.net/research/hidden-oauth-attack-vectors  (session poisoning no consent / SSRF request_uri — dojo)
- https://labs.detectify.com/writeups/account-hijacking-using-dirty-dancing-in-sign-in-oauth-flows/  (dirty dancing: leak de code no non-happy-path — dojo)

## Dojo 2026-09-07 (3ª sessão — SSRF routing + cache poisoning, aplicação → Yahoo L7)
- https://portswigger.net/research/cracking-the-lens-targeting-https-hidden-attack-surface  (routing-based SSRF via Host header; hit Yahoo ATS bf1 — dojo)
- https://portswigger.net/research/practical-web-cache-poisoning  (cache poisoning via unkeyed inputs — dojo)
