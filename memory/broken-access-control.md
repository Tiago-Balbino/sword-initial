# Broken Access Control / IDOR (prioridade #1)

## Padrões canônicos (base: PortSwigger Web Security Academy)
Fonte: https://portswigger.net/web-security/access-control · https://portswigger.net/web-security/access-control/idor

**Eixos:**
- **Escalada vertical** — acessar função de papel mais alto (não-admin faz coisa de admin).
- **Escalada horizontal** — acessar recurso de outro usuário do mesmo nível.
- **Horizontal → vertical** — tomar uma conta admin via falha horizontal vira escalada vertical.

**Técnicas de exploração e sinais:**
| Técnica | Padrão | Sinal |
|---|---|---|
| Função desprotegida | URL sensível existe sem enforcement | `/admin` achável em robots.txt/JS/wordlist |
| Controle por parâmetro | direito de acesso em cookie/hidden/query | `?admin=true`, `?role=1` mudam o acesso |
| IDOR | ref. direta a objeto por ID previsível | `?id=123`→`124` retorna dado alheio |
| Misconfig de plataforma | regra do framework contornável | `X-Original-URL`/`X-Rewrite-URL`; `GET` passa onde `POST` barra |
| Discrepância de URL | controle falha em variantes | `/ADMIN`, barra final, extensão arbitrária, normalização de path |
| Fluxo multi-etapa | authz inconsistente entre passos | pular passos 1-2, mandar o 3 direto com os params |
| Baseado em Referer | authz depende do header Referer | forjar `Referer: /admin` |
| Baseado em localização | geo via client-side | VPN/proxy contorna |

**Sinal de ausência de defesa (= risco):** sem modelo default-deny, sem enforcement único app-wide, obscuridade no lugar de controle.

---

## Write-ups reais (Google VRP + outros)
Fonte-mãe: https://github.com/xdavidhu/awesome-google-vrp-writeups

### IDOR no Google DataStudio
- **Alvo:** datastudio.google.com · **Classe:** IDOR · **Bounty:** $5.000 · 2020 — https://balook.medium.com/idor-in-google-datastudio-google-com-f2fa51b763de
- **Padrão:** referência direta a recurso de relatório sem checar dono (P3).
- **Gatilho:** produto de "compartilhar/relatório" com ID no request → testar acesso cross-account.

### $7.500 Google Sites IDOR
- **Alvo:** Google Sites · **Classe:** IDOR · **Bounty:** $7.500 · 2021 — https://r0ckinxj3.wordpress.com/2021/10/24/a-7500-google-sites-idor/
- **Padrão:** editor colaborativo aceitando ID de site alheio (P1+P3).
- **Gatilho:** features de colaboração/permissão são minas de IDOR — mapear todos os endpoints de "share".

### IDOR remove membros de qualquer Google Chat Space
- **Alvo:** Google Chat · **Classe:** IDOR/BAC · **Bounty:** $3.133,7 · 2022
- **Padrão:** ação administrativa (remover membro) sem verificar se o requester é admin do space (P1).
- **Gatilho:** ações de "gerenciar membros/roles" — testar como membro comum.

### IDOR em clientauthconfig.googleapis.com (David Schütz)
- **Alvo:** API interna Google · **Classe:** IDOR · 2021 — https://feed.bugs.xdavidhu.me/bugs/0009
- **Padrão:** API de configuração aceitando IDs de projetos/clients de terceiros (P3).
- **Gatilho:** APIs `*.googleapis.com`-style com IDs de projeto — enumerar.

### Broken Access Control no Google Ads Asset Library
- **Alvo:** Google Ads · **Classe:** BAC · 2023 — https://medium.com/@ggilang1135/broken-access-control-can-create-asset-library-whereas-role-access-is-billing-idor-b1b632f2c281
- **Padrão:** papel "billing" conseguindo ação que exigiria papel maior (escalada vertical via role mal-checado, P1).
- **Gatilho:** produtos com múltiplos papéis (billing/viewer/editor) — testar cada ação com o papel mais baixo.

### Privilege escalation no modelo de permissões do YouTube
- **Alvo:** YouTube · **Classe:** escalada de privilégio · **Bounty:** $500 · 2025 — https://prakhar0x01.github.io/write-ups/2025/08/11/hacking-google/
- **Padrão:** modelo de permissão de canal/colaborador com brecha entre papéis (P1).
- **Gatilho:** convites/colaboradores com níveis — mapear o que cada nível *deveria* poder e testar o excedente.

---

## Checklist rápido de BAC/IDOR num alvo
1. Crie 2 contas (A e B). Toda ação em A, replique trocando o ID/token pelo recurso de B.
2. Todo papel: teste ação de papel superior com papel inferior.
3. Enumere IDs sequenciais; cace UUIDs vazados pra reusar.
4. Endpoint barrado → varie método, headers de override, path.
5. Fluxo multi-etapa → pule/reordene passos.
6. Use a extensão **Autorize** (Burp) pra automatizar o replay com sessão de baixo privilégio.

---
## Ingeridos automaticamente — 2026-08-31

### The Fragile Lock — bypasses de autenticação SAML por discrepância entre parsers
- **Alvo · Classe · Bounty · Data** — Ruby-SAML / PHP-SAML (libraries, impacto amplo) · Auth bypass / BAC · n/d (pesquisa PortSwigger) · 2025-12-10 — [link](https://portswigger.net/research/the-fragile-lock)
- **Padrão:** separar *verificação da assinatura* e *processamento da assertion* em módulos com parsers XML diferentes (REXML vs Nokogiri) faz cada parser resolver atributos duplicados/namespaces/canonicalização diferente — o que valida a assinatura "vê" um XML e o que consome a assertion "vê" outro.
- **Como acharam:** casos de borda dos parsers — atributos com prefixo de namespace duplicados cuja ordem muda o valor; redefinição de atributos reservados que escondem a assinatura de um parser; canonicalização que retorna string vazia em URI relativa não resolvida (forja digest da string vazia).
- **Gatilho:** login que aceita SAML (SSO corporativo); Ruby-SAML < 1.18.0 ou PHP-SAML sobre libxml2; sempre que assinatura e assertion pareçam processadas por libs distintas.

### Bypass de access control por discrepância de parsing de e-mail (UTF-7 / encoded-word)
- **Alvo · Classe · Bounty · Data** — PortSwigger Web Security Academy (técnica) · BAC via parsing · n/d · atual — [link](https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-bypassing-access-controls-using-email-address-parsing-discrepancies)
- **Padrão:** o parser que **valida** o domínio (só `@empresa.com` vira staff) interpreta o endereço diferente do sistema que **envia** o e-mail; validador vê o sufixo legítimo, MTA decodifica encoded-word/UTF-7 e entrega ao atacante.
- **Como acharam:** endereço tipo `attacker@servidor ?=@empresa.com` com `@` e espaço em UTF-7; validação aprova pelo sufixo, entrega manda a verificação pro servidor do atacante.
- **Gatilho:** registro que concede papel pelo domínio do e-mail; validação e entrega de e-mail em libs diferentes; teste UTF-7/ISO-8859-1 encoded-word quando o domínio for fronteira de authz.

### Privilege escalation por cadeia de impersonation de service accounts (GCP / SecOps SOAR)
- **Alvo · Classe · Bounty · Data** — Google Cloud (Google SecOps SOAR) · BAC / privesc · "most creative" bugSWAT 2025 · 2026-01-17 — [link](https://jdsec.cloud/posts/2026-01-17-privilege-escalation-via-a-service-account-impersonation-chain/)
- **Padrão:** dar "Service Account Token Creator" no escopo do projeto ao SA do pod parecia restrito, mas ele podia impersonar o SA emissor de JWT (`secops-auth`), fechando cadeia SA→SA→JWT admin.
- **Como acharam:** burlaram validação do IDE com `__import__()`; `oauth2.googleapis.com/tokeninfo` p/ achar o SA do pod; enumeraram impersonation; impersonaram o emissor p/ forjar JWT admin.
- **Gatilho:** GCP/multi-tenant com SAs com Token Creator no projeto; microserviço com impersonation entre serviços; emissor de JWT alcançável; sandbox que roda código do usuário — teste `tokeninfo` e enumeração de impersonation.

### Vazamento de e-mail de criadores do YouTube por parâmetro oculto + Content ID API (brutecat)
- **Alvo · Classe · Bounty · Data** — YouTube / Google · BAC / info disclosure encadeado · US$20.000 · 2025-03-13 — [link](https://brutecat.com/articles/youtube-creator-emails)
- **Padrão:** assumiram que parâmetros ocultos não seriam achados e que a Content ID API barraria não-managers; um Content Owner ID (IVP) achado via parâmetro oculto atravessou a fronteira e devolveu o e-mail real do criador.
- **Como acharam:** ProtoJson com requests malformados p/ vazar params ocultos via erro; `get_creator_channels` com `includeSuspended=true` revelou o IVP; Content ID API com esse ID leu o e-mail.
- **Gatilho:** APIs ProtoJson/gRPC que devolvem params em erros; IDs de "content owner"/tenant que cruzam produtos; flags não documentadas (`includeSuspended`) — force erros p/ enumerar campos ocultos.

### ORM Leak — exfiltração de campos sensíveis via filtros do ORM (elttam)
- **Alvo · Classe · Bounty · Data** — Técnica geral (Django, Prisma, Beego) · BAC / data exfiltration · top-10 PortSwigger 2025 #2 · 2025 — [link](https://www.elttam.com/blog/leaking-more-than-you-joined-for/)
- **Padrão:** prevenir SQLi mas expor o filtro do ORM ao usuário não é seguro: sem allowlist de campos, filtra por atributos nunca consultáveis (hash, token, API key) atravessando relações, usando a resposta como oráculo.
- **Como acharam:** endpoints com `q`/`filter`/`where`; mapearam campos por metadata/erros; payloads com lookups aninhados (`email__password__startswith` no Django, `{not:'value'}` no Prisma); extração char-a-char por tamanho/timing/erro.
- **Gatilho:** APIs com `q`/`filter`/`search`/`where` que caem no ORM; sem allow/deny-list de campos; docs prometendo "robust filtering" — teste lookups atravessando p/ tabelas de credenciais.

---
## Ingeridos automaticamente — 2026-09-01

### API de suporte do Google exposta pelo discovery document
- **Alvo · Classe · Bounty · Data** — Google Real-time Support · BAC · $14.337 · mar/2026 — [link](https://michaeldalton.au/posts/hacking-google-support)
- **Padrão:** o widget de chat falava com uma API cujo discovery document listava ~93 métodos, mas a UI só usava ~14. Os órfãos eram "internos" e só checavam se havia conta Google logada, não se ela tinha relação com o caso.
- **Como acharam:** extraiu a API key do JS do widget, puxou o discovery document, comparou métodos existentes × usados pela UI, testou os órfãos até `changes.list` devolver estado sem filtro (e-mails @google.com, logs, telefones de clientes).
- **Gatilho:** front que fala com `*.clients6.google.com`/gateway gerado, chave no bundle. Procurar `$discovery/rest`/OpenAPI e diferenciar "métodos que existem" de "métodos que a UI usa" — o delta é superfície não testada.

### Bypass de middleware do Next.js via header interno (CVE-2025-29927)
- **Alvo · Classe · Bounty · Data** — Next.js (11.1.4–15.2.2) · BAC · CVSS 9.1 · mar/2025 — [link](https://zhero-web-sec.github.io/research-and-things/nextjs-and-the-corrupt-middleware)
- **Padrão:** o header `x-middleware-subrequest` sinalizava internamente "já passei pelo middleware". Como vem do cliente, mandá-lo com o caminho do arquivo de middleware faz o framework **pular o middleware inteiro** — e com ele auth/authz/CSP/rewrites.
- **Como acharam:** leitura do fonte do framework; o valor era quebrado por `:` e comparado com o nome (=caminho `middleware`/`src/middleware`). Nas 15.x virou contador → repetir o caminho 5+ vezes.
- **Gatilho:** authz numa camada de borda (middleware/proxy/gateway) que fala com o backend por header. Testar headers `x-*` internos do framework, de fora e via smuggling — e **ler o fonte do framework**, não só o app.

### Metadados de editores vazando em docs "sem acesso"
- **Alvo · Classe · Bounty · Data** — Google Docs / Apps Script · BAC (info disclosure) · $15.000 · VRP — [link](https://bughunters.google.com/reports/vrp/7EhAw2hur)
- **Padrão:** só com o file ID dava pra listar editores (e-mails/identidades) mesmo sem compartilhamento. O controle protegia o *conteúdo*, não a *metadata*. Mesma família do `getFormUrl()` ($7.5k).
- **Como acharam:** partir do file ID que vaza em links e chamar métodos de metadata da camada de **automação (Apps Script)** em vez da UI — API e UI aplicavam checagens diferentes sobre o mesmo objeto.
- **Gatilho:** produto com duas portas pro mesmo recurso (UI + API/SDK/automação/GraphQL) + ID que circula. Enumerar o que a porta secundária devolve *além* do conteúdo: donos, editores, histórico, timestamps.
