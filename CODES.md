# CODES, PROTOCOLOS & MODOS — comandos do Sword

Três tipos de comando. Todos são **gatilhos que o Claude executa** quando o Tiago os invoca.
Este arquivo é a **fonte da verdade**. **Tudo passa pelo `THE-MIND.md` (o cérebro)** — antes de caçar, o cérebro é consultado e roteia.

- **Códigos** (`code N`) — ações rápidas, numeradas, de uma tacada.
- **Protocolos** (`protocolo <nome>`) — fluxos nomeados, multi-etapa, com um objetivo (coletar, verificar, reportar).
- **Modos** (`modo <nome>`) — uma **postura** que fica ligada e muda como o Claude opera até você desligar.

> **Regra de ouro:** só recon/scan/PoC em alvos **autorizados** (escopo do programa). Na dúvida, perguntar antes de disparar. Humano sempre submete.

---

## Códigos

| Código | Nome | Resumo |
|-------|------|--------|
| `code 0` | Recon completo | recon + probe + crawl + gf + scan CORS/headers, e registra a ficha |
| `code 1` | Recon passivo | só enumeração passiva (subfinder/amass/crt.sh), sem tocar no alvo |
| `code 2` | Scan alvo único | audita CORS/headers de uma URL |
| `code 3` | Nova ficha de alvo | cria/atualiza `targets/<alvo>/README.md` (versão manual do casa-nova) |
| `code 4` | Registrar decisão | adiciona um bloco no `THE-MIND.md` |
| `code 5` | Sincronizar cloud→Mac | drena **memory + portfólio** dos docs cloud pro disco local |
| `code 6` | Gerar hipóteses | casa o recon do alvo contra `memory/signals.md` → leads `[UNTESTED]` rankeados na ficha |

### `code 0 <dominio>` — Recon completo
1. `python3 tools/recon.py <dominio> --all --out targets/<dominio>/recon`  (subfinder/amass/httpx/katana/gospider/gau/waybackurls + gf buckets; cai pra Python puro no que faltar)
2. `python3 tools/cors_headers_scan.py -f targets/<dominio>/recon/live-hosts.txt --json targets/<dominio>/recon/cors.json`
3. Criar/atualizar `targets/<dominio>/README.md` resumindo hosts vivos, buckets do gf e achados de destaque.
4. Reportar no chat um resumo curto.

### `code 1 <dominio>` — Recon passivo
- `python3 tools/recon.py <dominio> --out targets/<dominio>/recon` (sem `--probe`/crawl).

### `code 2 <url>` — Scan alvo único
- `python3 tools/cors_headers_scan.py <url> --json targets/<host>/cors.json`.

### `code 3 <dominio>` — Nova ficha de alvo
- Criar `targets/<dominio>/` e preencher `README.md` a partir de `targets/_TEMPLATE.md`. Versão manual/rápida do `protocolo casa-nova`.

### `code 4 "<decisão>"` — Registrar decisão
- Acrescentar bloco no `THE-MIND.md` (Data · Decisão · Por quê · Validação/Status).

### `code 5` — Sincronizar cloud → Mac (memory + portfólio)
_Só numa sessão com o Mac ligado._ Drena os **dois** feeds cloud pro disco local.

**A) Memory** (fonte: tarefa diária das 10h):
1. `project_read` em `claude/memory-banco.md`.
2. Mover cada entrada de "Novas entradas ingeridas" pro arquivo da classe certa em `memory/` + URL em `memory/_ingested.md`.
3. No doc, mover essas entradas pra "Já sincronizadas" (`project_write`).

**B) Portfólio** (fonte: `modo sábado à tarde` rodado fora do Mac):
4. `project_read` em `claude/portfolio-banco.md`.
5. Mesclar cada entrada da "Fila para merge" no `portfolio.md` (rankeando, sem duplicar).
6. No doc, mover essas entradas pra "Já sincronizadas" (`project_write`).

**C) Commit:**
7. `cd ~/Documents/Sword && rm -f .git/*.lock && git add -A && git commit -m "sync cloud->local (memory + portfolio)"`.

Se algum dos dois feeds estiver com a fila vazia, pular a parte dele e dizer isso.

### `code 6 <alvo>` — Gerar hipóteses (motor de hipóteses)
Casa o **corpus de recon** do alvo contra `memory/signals.md` e cospe leads `[UNTESTED]` **rankeados** na ficha. É a ponte automatizada entre o recon e o banco: transforma "tenho um monte de output" em "estas são as hipóteses concretas, nesta ordem".

1. **Carregar o banco:** `memory/signals.md` + `patterns.md` + `arsenal.md`.
2. **Reunir o corpus do alvo:** `targets/<alvo>/recon/*` (JS, endpoints, params, headers, hosts vivos, `gf/*`), a ficha `README.md`, e qualquer output que o Tiago colar.
3. **Pass 1 — sinais únicos:** varrer o corpus contra cada `Sinal:` de `signals.md`. Cada hit vira **hipótese candidata** carregando: sinal que disparou · pattern (P#) · hipótese · **probe** (🟢/🔴) · FP a antecipar.
4. **Pass 2 — composição:** dos sinais que acenderam, checar quais **pares/trios** casam um gatilho de chain (`C-*`). Cada casamento vira **hipótese de chain** (o valor alto de programa maduro).
5. **Rankear** por `(impacto × plausibilidade × probe barato)`. **Probe 🟢 sobe** (dá pra confirmar já, inclusive na `postura escudo`); 🔴/pare-e-confirme desce.
6. **Escrever** os top-N como leads `[UNTESTED]` na ficha (`targets/<alvo>/README.md`), cada um no formato: `[UNTESTED] hipótese · sinal(is) → pattern · probe (🟢/🔴) · FP · próximo elo`.
7. **Resumo no chat:** quantos sinais acenderam, top-3 hipóteses, e qual dá pra testar em silêncio.

**Guardrail:** `code 6` **só faz matching e leitura** — nunca dispara o probe sozinho. Executar o probe é `formação de lança` (com pare-e-confirma) ou teste manual. Herda a regra de escopo; se a `postura escudo` estiver ligada, marca cada probe 🔴 como `[REQUER AUTORIZAÇÃO]`.

---

## Protocolos

| Protocolo | Objetivo |
|-----------|----------|
| `protocolo casa-nova` | Pacote do coletor web → ficha de alvo em `targets/` |
| `protocolo contra-prova` | Dupla verificação pessimista de um achado — matar falso positivo |
| `protocolo report` | Rascunhar o report de um achado confirmado + rodar o checklist de submissão |
| `protocolo ladrão de bancos` | Lista alvos → você escolhe → `code 0` recon massivo + OSINT → sintetiza/filtra/registra |
| `protocolo One Piece` | Caçada da **camada de 1 conta só** — tudo que dá pra provar sem vítima (self-state, tampering, race, escopo, step-skip) |

### `protocolo casa-nova` — do coletor web à ficha de alvo
Artefato coletor: https://claude.ai/code/artifact/f08ec610-0c40-44ce-81ca-1a19738e22ae
Gatilho: o Tiago cola um pacote que começa com `PROTOCOLO CASA-NOVA` (ou o nome + dados).
1. Ler o pacote/JSON com os dados passivos do alvo.
2. Criar `targets/<dominio>/README.md` no esquema do `_TEMPLATE.md`; criar `recon/`.
3. Registrar; oferecer `code 0 <dominio>` pra enriquecer.
4. Commitar.

### `protocolo contra-prova` — dupla verificação pessimista (anti-falso-positivo)
Objetivo: **matar falso positivo antes de reportar.** O Claude vira triador hostil e tenta **derrubar** o achado. O ônus é do achado provar que sobrevive.

Gatilho: o Tiago aponta um achado (endpoint + request/response + impacto alegado), de `targets/<alvo>/` ou colado.

1. **Reafirmar** o achado em 1-2 linhas: o que, onde, como reproduz, impacto alegado.
2. **Escopo:** o ativo/endpoint está mesmo no escopo? (ler `targets/<alvo>/README.md` + política). SaaS/terceiro fora de escopo → provável inválido; dizer na cara.
3. **Filtro de triagem sênior — as 5 perguntas** (herdado da cacada; qualquer "não" mata ou rebaixa):
   1. **É comportamento padrão da aplicação?** (o app funcionando como projetado; authz noutra camada; header que todo mundo expõe).
   2. **Essa informação deveria mesmo estar protegida?** (e-mail público, versão no header, `/robots.txt`, id sequencial sem impacto de acesso = **público por design**, não vazamento).
   3. **Existe impacto real e demonstrável?** (diferenciar impacto **demonstrado** de **hipotético**; "consigo ver X" só vale se X é sensível E eu não deveria ver).
   4. **É reproduzível sem o meu estado de sessão?** (se só "funciona" porque eu estava logado no meu próprio contexto, não é achado — testar em conta/sessão limpa e separada).
   5. **Já é conhecido/duplicado?** (known-issues do programa, disclosures recentes, exclusões).
4. **Contra-argumentar a mecânica** (pessimista): o ID é adivinhável (IDOR) ou é token de capacidade não-enumerável? self-XSS? endpoint público de propósito? só best-practice (headers, clickjacking em página não sensível, rate limit, CSRF em ação não sensível)? Puxar os FP comuns do `memory/arsenal.md` da classe.
5. **Antes de descartar como Low/nada: escalou?** Se ainda não tentou chainar/escalar (ver `modo hunter` §escala), o veredito não é final — pesquisar técnicas e tentar o próximo elo primeiro.
6. **Veredito** (vocabulário fixo): `ACHADO` · `FALSO POSITIVO` · `PADRÃO DA APLICAÇÃO` · `PÚBLICO POR DESIGN` · `INCONCLUSIVO (revisitar)` · `FORA DE ESCOPO`.
   - Se `ACHADO`: dizer por que cada contra-argumento falhou + severidade calibrada à rubrica do programa.
   - Se descartado: motivo exato, e registrar em `memory/arsenal.md` (FP da classe) pra não retestar.
7. Registrar o veredito na tabela de **Achados** do `targets/<alvo>/README.md`.

Postura: **pessimista por padrão.** Melhor derrubar 3 achados fracos aqui do que queimar credibilidade com o triador.

### `protocolo report` — rascunho de report + checklist
Só para achado que já passou no `contra-prova` como `ACHADO`.
1. Montar o report: título específico, resumo (2-3 linhas, sem jargão), severidade justificada pela rubrica, passos numerados de repro, PoC mínima (request+response redigidos, sem PII/token real), impacto (demonstrado vs pior caso), mitigação sugerida.
2. Rodar o checklist antes de "pronto": escopo ok · repro sem meu estado de sessão · conta de teste minha · PII/token redigidos · request+response do passo-chave · PoC mínima · severidade calibrada · duplicata verificada.
3. Salvar em `targets/<alvo>/` (ex.: `report-<slug>.md`). **Humano revisa e submete — o Claude nunca submete.**

---

### `protocolo ladrão de bancos` — recon massivo de um alvo
Objetivo: escolher um alvo do funil e fazer **recon massivo**, depois **sintetizar, filtrar e registrar** — deixando a ficha pronta pra caçada.

1. **Listar alvos.** Ler `targets/*/README.md` e mostrar uma tabela: alvo · prioridade · constraints-chave · já tem `recon/`?
2. **Tiago escolhe um.**
3. **Checar as constraints pré-fixadas da ficha ANTES de tocar** (rate limit, manual-only, closed scope, escopo).
   - ⚠️ **Se a ficha diz "IA proibida na busca" (ex.: Wallet on Telegram): PARAR.** Não rodar `code 0`/recon automatizado — avisar que o alvo é manual-only e encerrar o protocolo pra esse alvo.
4. **`code 0 <alvo>` — recon massivo dos ativos** (recon.py `--all`: subfinder/amass/httpx/katana/gospider/gau/waybackurls + gf; usar o `--rate` da ficha, ex. NBA `--rate 3`) + `cors_headers_scan.py` nos hosts vivos.
5. **Camada "todos os sites e fóruns" — OSINT passivo agregado.** Varrer fontes **públicas** por dados/menções/vazamentos do alvo: crt.sh, Wayback, **GitHub/GitLab code search** (segredos/refs), Google dorks, Shodan, índices públicos de paste/leak. **Só OSINT público e legal** — nunca comprar/baixar dumps roubados, nunca dados de indivíduos privados; foco em segredos/superfície da **organização in-scope**.
6. **Sintetizar · filtrar · registrar.** Salvar o cru em `targets/<alvo>/recon/` e destilar um resumo na ficha (`README.md`): hosts vivos, buckets do gf (idor/redirect/ssrf…), subdomínios interessantes, segredos/vazamentos achados, e **leads priorizados** (o que cheira a bug) ligados ao `memory/arsenal.md` e `patterns.md`. Descartar ruído.
7. **Atualizar as hipóteses `[UNTESTED]`** da ficha com os leads. Fim → pronto pro `modo hunter`.

Guardrails: só alvos **autorizados**; respeitar SEMPRE escopo + constraints da ficha; OSINT só de fontes públicas/legais; alvos que proíbem IA na busca → não rodar (passo 3).

---

### `protocolo One Piece` — a caçada com UMA conta só
Objetivo: exaurir tudo que dá pra **provar com uma única conta autenticada**, antes de precisar de uma 2ª pra IDOR cross-account. É a camada intermediária de uma **progressão em 3 níveis**:

| Nível | O que testa | Precisa |
|---|---|---|
| **0 — unauth** | recon ativo, APIs públicas, login/registro/recovery (enum, rate, fluxo), CF/origin, JS/source maps, e-mails transacionais | nada |
| **1 — `protocolo One Piece`** | **self-state manipulation** · param/type tampering (`rate`, `amount`, `amounttype`, precisão/rounding) · **race** na própria conta (nonce, cancel-after-fill, saque duplo) · **bypass de escopo** (RO key → write; V1 vs V2) · **step-skip** em fluxo multi-etapa (`senddetails`→`send`, quote→execute) · controles client-side (fingerprint, `emailconfirm`) · "o check de dono existe?" (testar com os próprios ids) | 1 conta (+ chaves/API key) |
| **2 — cross-account** | IDOR/BOLA de verdade: objeto da conta B lido/escrito com a credencial da conta A; quote/token reuse entre contas; isolamento de sessão/ambiente | 2 contas |

**Gatilho:** `protocolo One Piece` (ou "modo one piece"), dentro do `modo hunter`, quando você já tem 1 conta no alvo.

**Loop (por endpoint/fluxo da conta):**
1. **6 perguntas do The Mind** — com foco em Q2 (o que o cliente controla), Q4 (ordem das etapas), Q6 (fail-open/race). BAC cross-user (Q1) fica pro nível 2.
2. **`formação de lança`** constrói + executa a request assinada; variações malformadas-mas-válidas; diffa respostas.
3. **Triagem cética (5 perguntas)** — atenção redobrada à #4 ("reproduzível sem o meu estado de sessão?"): muita coisa de 1 conta é self-* e morre aqui. Se só funciona no meu contexto e não muda estado global/valor → não é achado.
4. **Escala** — todo tampering/race que "funcionou" tenta o próximo elo (rate errado → lucro real sacável; race → saldo negativo → crédito).
5. **Registrar** na ficha com status; técnica nova → `memory/arsenal.md`.

**Saída por item:** `[VEREDITO] endpoint · param/variação · request → resposta · muda estado/valor global? · casa com patterns/arsenal · próximo elo`.
Guardrails: herda `modo hunter` + escopo. **Nunca** rajada em login/reset/MFA; race só na própria conta e com valores mínimos; para-e-confirma antes de saque real / ação irreversível.

## Modos

### `postura escudo` — postura silenciosa (não disparar flag) 🛡️
Ativação: **"postura escudo"** / **"escudo"** / **"levanta o escudo"**. Desliga: **"baixa o escudo"** / **"postura escudo off"**.
Postura de **stealth defensivo**: enquanto ligado, o Claude **pode tocar a rede do alvo — mas SÓ com o que não dispara flag** (tráfego que parece legítimo, volume baixíssimo, serial). Não é offline: é ativo-porém-silencioso. Pra cada superfície, **mostra também o que seria possível com autorização** sem tocar nisso. Escudo levantado: observa e sonda de leve, não faz barulho.

**A régua (o teste de cada ação):** *"um WAF/rate-limit/blue team distinguiria isto de um usuário/navegador normal?"* Se sim → não faz, vira vitrine `[REQUER AUTORIZAÇÃO]`. Ex. **passa**: `GET`/`HEAD` único pra ler headers (CSP/cache), puxar `/.well-known/*` público, `.js.map`, 1 request bem-formada pra ver um comportamento. Ex. **não passa**: fuzz, wordlist, rajada, payload de injeção, brute em login/reset/MFA, scanner.

> **Regra escudo↔lança (automática):** **levantar o escudo BAIXA a lança** (`formação de lança` é desativada na hora — não dá pra atacar ativamente atrás do escudo). São opostos: escudo = só o silencioso; lança = execução ativa. Pra voltar a atacar, `baixa o escudo` primeiro, depois `forma a lança`.

**Princípio:** cada request que sai daqui tem que **parecer tráfego legítimo** e ser **de baixíssimo volume**. Na dúvida se algo faz barulho → não faz, marca como `[REQUER AUTORIZAÇÃO]`.

**Permitido (silencioso):**
- OSINT 100% passivo: crt.sh, Wayback/gau, DNS, `subfinder` passivo, GitHub/GitLab code search, Google dorks, Shodan (consulta, não scan).
- Leitura de JS/source maps **já servidos** publicamente + análise offline de qualquer output que o Tiago colar.
- `code 1` (recon passivo, sem tocar) — nunca `code 0`.
- No máximo **1 request manual legítima** por endpoint quando indispensável (ex.: ver um header) — serial, rate mínimo, sem repetição.

**Proibido enquanto ligado (faz barulho / dispara flag):**
- Scan ativo automatizado (nuclei, katana/gospider agressivo, `code 0`), fuzzing, enumeração em massa, brute/spray.
- Qualquer toque em login/reset/MFA/pagamento; WAF probing; payloads de injeção.
- Paralelismo alto; qualquer rajada.

**A vitrine (OBRIGATÓRIO):** por superfície, além de fazer só o silencioso, **listar o teto** — o que renderia **com autorização**, marcado `[REQUER AUTORIZAÇÃO]`, com 1 linha do que provaria e por que faz barulho. Assim o Tiago vê a oportunidade inteira sem disparar nada, e libera item a item quando conseguir o OK do programa.

**Relação com os outros modos:** é **prioritário**. **Baixa a lança** (`formação de lança` off, automático — ver regra acima). Pode conviver com o `modo hunter`, mas **rebaixa o hunter ao subconjunto silencioso** (o resto vira vitrine `[REQUER AUTORIZAÇÃO]`). É a postura-padrão segura para alvo novo, escopo dúbio, ou quando o Tiago pede "quieto".

Saída por superfície: `[SILENCIOSO] o que fiz · achado · | [REQUER AUTORIZAÇÃO] o que renderia, por que faz barulho`.

### `modo hunter` — postura de caçador sênior (o motor da cacada, na estrutura do Sword)
Ativação: **"modo hunter on"** / **"tá na hora da caçada"**. Desliga: **"modo hunter off"**.
Foco: **impacto real, zero falso positivo.** Nunca inflar trivial/público como grande achado.

**Ao ligar (start) — o cérebro conduz:**
1. **Escolher o alvo pelo portfólio.** Ler `portfolio.md`, listar os programas **rankeados** (prioridade primeiro — programa · reward · escopo · tem ficha em `targets/`?) e **perguntar: "qual alvo vamos atacar?"**. Se `portfolio.md` estiver vazio, pedir pra alimentar com o `modo sábado à tarde` antes.
2. **Puxar o que já temos do alvo escolhido.** Carregar a ficha + o recon de `targets/<alvo>/`. Se não existir, oferecer `protocolo casa-nova` (pacote do coletor) ou `code 0 <alvo>` antes de caçar.
3. **Carregar o cérebro:** `THE-MIND.md`, `memory/arsenal.md`, `memory/patterns.md`.

**Loop de caçada:**
1. **Rodar as 6 perguntas do The Mind** em cada feature/endpoint interessante (o cérebro decide onde cavar).
2. **Triagem cética** (as 5 perguntas do `protocolo contra-prova`) em cada candidato — mostrar o raciocínio, não só o veredito.
3. **Escala obrigatória:** nenhum veredito de severidade é final sem tentar chainar. Pesquisar as melhores técnicas (WebSearch/WebFetch: HackerOne, PortSwigger, HackTricks, writeups), tentar o próximo elo (info→IDOR→ATO), aplicar bypasses do `arsenal.md`. Só então cravar.
4. **Tenacidade honesta:** "não achei" = "ainda não achei" — reler JS linha a linha, cada response, exaurir o `arsenal.md` e o catálogo COMPLEXO (multi-tenant, WCD+CSPT, prototype pollution, smuggling) antes de soltar o domínio. **Incansável na busca, brutalmente honesto no veredito** (FP testado é vitória).
5. **Persistir conhecimento:** toda técnica nova pesquisada vira entrada no `memory/arsenal.md` (com fonte). O banco cresce a cada caçada.
6. **Dois sub-modos de execução:**
   - **Análise** (sem rede ao alvo — ex.: claude.ai): o Tiago cola output (httpx/gau/nuclei/uma request); o Claude tria e devolve veredito + porquê. Não roda ferramentas.
   - **Orquestração** (Claude Code no Mac, com rede): o Claude pode rodar o recon (`code 0`) respeitando rate limits (5 req/s; nunca scanner em login/reset/MFA), propondo → confirmando → executando → documentando.
7. **Achado real → `protocolo contra-prova` → `protocolo report`.**

Formato de saída enxuto por item: `[VEREDITO] título · o que é · por que (não) é achado · severidade (só se real) · próximo passo`.

**Ao desligar (`modo hunter off`) — o Selo de saída (OBRIGATÓRIO, nunca pular):**
A caçada não acaba até `targets/<alvo>/` ser um retrato **100% atual**. Antes de confirmar "OFF", em ordem:
1. **Flush pra ficha (`README.md`):** cada lead tocado na sessão com status atualizado (`[ACHADO]` · `[FP]` · `[PADRÃO DA APLICAÇÃO]` · `[PÚBLICO POR DESIGN]` · `[INCONCLUSIVO]` · `[SIMULADO — falta X]` · `[UNTESTED]`), toda superfície/host/endpoint novo, e o veredito com o porquê de cada contra-argumento. Tabela **Achados** preenchida se houver.
2. **Bloqueios explícitos** por lead quente (ex.: "precisa conta no portal") — pra retomar sem redescobrir.
3. **Append no log `a-cacada-ate-aqui.md`:** bloco datado da sessão — o que rodou · o que achou · decisões · **"Próximo passo"** concreto. Criar o arquivo (esqueleto do `targets/_TEMPLATE.md`) se não existir.
4. **Persistir aprendizado:** técnica/bypass/FP novo → `memory/arsenal.md` (com fonte); padrão transversal → `memory/patterns.md`; decisão de rumo → `code 4`.
5. **Estado do git:** `git status` — dizer o que está sem commit. Commitar só se o Tiago pedir.
6. **Resumo de 3 linhas no chat** (alvo · onde parou · próximo passo) — e só então **"modo hunter OFF"**.
Se faltar dado pra fechar um item do Selo, **dizer qual** — nunca desligar no seco.
Vale também pra sub-modos ligados (`formação de lança`): desligam junto com o hunter, e o que produziram entra no Selo.

### `modo sábado à tarde` — curadoria do portfólio
Ativação: **"modo sábado à tarde"** / **"modo sábado"**. Desliga: **"modo sábado off"** / **"acabou o sábado"**.
É o modo de **montar e curar o `portfolio.md`** — a sessão relaxada de garimpar programas. **Você fornece a intel; eu populo e rankeio.** Não caça aqui — só organiza o funil.

Enquanto ligado, a cada programa que você colar (escopo + reward do HackerOne/Bugcrowd/Intigriti/YesWeHack):
1. **Extrair:** nome, plataforma, escopo (in/out), reward table/valores, tipos de ativo, link. **Não inventar** — só o que você trouxe.
2. **Analisar atratividade:** reward × amplitude do escopo × fit com suas forças (BAC/IDOR + lógica) × baixa saturação → **prioridade** (Alta/Média/Baixa) com 1 linha de porquê.
3. **Arquivar:** adicionar/atualizar a linha no `portfolio.md` (+ nota por programa), sem duplicar, reordenando o ranking.
4. Se o programa já tem ficha em `targets/`, linkar na coluna.

**Onde eu salvo (importante):**
- **No Mac** (device conectado) → escrevo direto no `portfolio.md`.
- **Fora do Mac** (outro computador, sem Mac) → **enfileiro no doc cloud** `claude/portfolio-banco.md`. Aí, quando você chegar no Mac, roda **`code 5`** e eu puxo a fila pro `portfolio.md`. É assim que você monta o funil de qualquer lugar.

Iterativo: você vai colando, eu vou populando, até **"acabou o sábado"** — aí fecho com um resumo do ranking. Depois é só ligar o `modo hunter`, que já lê esse portfólio e te oferece o topo pra caçar.

### `modo bicicleta com rodinhas` — o cérebro como copiloto explícito
Ativação: **"modo bicicleta"** / **"põe as rodinhas"**. Desliga: **"tira as rodinhas"**.
Enquanto ligado, o **`THE-MIND` sugere proativamente, a cada passo, QUAL comando ativar e QUANDO** — e explica o porquê — antes de você pedir. Ex.: "acabou o recon → sugiro `protocolo contra-prova` no lead de IDOR do `gf/idor.txt`, porque…". É pra aprender o fluxo do Sword.
Como o `THE-MIND` é o cérebro, **mesmo sem as rodinhas tudo já passa por ele** — as rodinhas só tornam a sugestão explícita e passo-a-passo, em vez de silenciosa.

### `protocolo armar a arapuca` — juntar peças pequenas até virar chain
Ativação: **"armar a arapuca"** / **"arma a arapuca"**. É um **inventário vivo** por alvo, não um loop.
Serve pra: catalogar cada achado **individualmente fraco** (info leak Low, validação frouxa, redirect, race que não drena sozinha, fingerprint controlável, erro que vaza ordem, id semi-previsível) e **procurar ativamente a combinação** que vira High/Crit.

Como opera:
1. **Arquivo `targets/<alvo>/arapuca.md`** (criar se não existe): tabela de **peças** — `id · peça (1 linha) · nível de acesso p/ usar · severidade isolada · o que ela HABILITA`.
2. Toda vez que o `modo hunter`/`seguir o rastro`/`formação de lança` produz algo sub-crítico → **entra como peça**, não é descartado.
3. **Passo de combinação** (rodar a cada 3–4 peças novas, ou quando pedido): pegar todas as peças e perguntar, par a par e em trios — *"peça A dá o pré-requisito da peça B? A saída de A é a entrada de B? juntas passam de Low pra High?"*. Casar com as **chains do `memory/arsenal.md`** (ex.: WCD+CSPT→ATO, info→IDOR→ATO, redirect+XSS).
4. **Candidata a chain** → vira lead `[UNTESTED]` na ficha com os elos nomeados, e sai da arapuca pro fluxo normal (`contra-prova` → `report`).
5. Peça que envelhece sem nunca combinar com nada por muito tempo → marcar `[dormant]`, não apagar (alvo muda).

Saída do passo de combinação: `arapuca.md` atualizado + "melhor chain candidata agora: A+C+F → [impacto], falta [elo]".
Guardrail: peça só entra se for **real e reproduzível** (nada de "acho que"). Herda escopo do `modo hunter`.

### `protocolo descobrir a roda` — reconstruir a máquina a partir das peças
Ativação: **"descobrir a roda"** / **"descobre a roda"**. **Pré-requisito: existir `targets/<alvo>/arapuca.md`** com peças.
Diferença dos irmãos: `armar a arapuca` **combina** peças duas a duas; `seguir o rastro` **aprofunda** um sinal; `descobrir a roda` **sintetiza** — dá um passo atrás, reconstrói o sistema inteiro a partir dos fragmentos, faz engenharia reversa da mecânica, e daí deriva o que testar e quais cadeias montar. Roda quando a caçada "empacou" ou a arapuca tem 8+ peças.

Passos:
1. **Reconstruir o sistema (o modelo).** De TUDO que foi descoberto (recon, fichas, JS, `config.json`, mensagens de erro, DNS, headers, stack, códigos de status, ordem de validação) → desenhar como a arquitetura do alvo **precisa** funcionar: componentes, quem chama quem, fronteiras de confiança, camadas de auth, onde o estado vive, o que é edge vs origin vs backend vs serviço. Escrever como diagrama/lista em `targets/<alvo>/arapuca.md` › seção **"Modelo do sistema"**.
2. **Engenharia reversa das suposições.** Pra cada componente e cada **fronteira** do modelo, rodar as 6 perguntas do The Mind mirando a costura: o que o dev assume aqui que pode ser mentira? (gateway confia no backend? origin confia no edge? serviço A confia no header que B injeta? o estado do passo N assume o N-1?).
3. **Mapa do não-testado.** Lista explícita: todo endpoint / parâmetro / método / verbo / fluxo / host / transição de estado que **apareceu no recon mas nunca foi realmente sondado**. Ranquear por "o que o modelo diz ser mais frágil".
4. **Cadeias de eventos (narrativas).** Não é par-a-par como a arapuca — é multi-passo com história: *"atacante faz A (peça X) → sistema entra no estado B → isso habilita C (item não-testado nº k) → se C se comporta como o modelo prevê → impacto D"*. Cada cadeia nomeia: os passos, as peças que a alimentam, os itens não-testados de que depende, e o impacto **se o modelo estiver certo**.
5. **Priorizar e devolver pro fluxo.** A cadeia com melhor (impacto × plausibilidade × poucos elos faltando) vira o próximo alvo do `modo hunter`/`formação de lança`; o mapa do não-testado vira checklist.

Saída: `arapuca.md` ganha 3 seções — **"Modelo do sistema"**, **"Não-testado (ranqueado)"**, **"Cadeias narrativas"** — + 1 linha: "próxima a executar: cadeia N (impacto, elos faltando)".
Guardrail: o modelo é **hipótese explícita**, não fato — marcar cada inferência como tal. Nada de sair testando sem passar pelo `modo hunter`/escopo.

### `protocolo escada de jacó` — subir um achado real até o teto
Ativação: **"escada de jacó"** / **"sobe a escada"**. **Pré-requisito: um `[ACHADO]` confirmado** (real, reproduzido — não um sinal, não uma peça). Roda **antes do `protocolo report`**, pra reportar o bug no seu **teto real**, não no piso onde foi observado.
Diferença dos irmãos: `seguir o rastro` ramifica de um *sinal*; `armar a arapuca` combina *peças fracas*; `descobrir a roda` sintetiza o *sistema todo*; **`escada de jacó` pega UM achado confirmado e o escala degrau a degrau rumo ao pior caso.**

Passos:
1. **Ancorar.** O achado em 1-2 linhas: o quê, onde, impacto **verificado**, severidade atual. Esse é o degrau em que você está.
2. **Desenhar a escada** da classe do achado — degraus do menos pro mais grave. Ex.:
   - *broken-auth / BAC:* info leak → ler dado alheio → **escrever** dado alheio → privesc de papel → ATO → RCE/infra
   - *price/lógica:* valor errado → item grátis → saldo negativo → crédito sacável
   - *IDOR de leitura:* 1 objeto → enumeração em massa → objeto sensível (PII/segredo) → chave/token → ATO
   - *XSS refletido:* self → sem interação → em página autenticada → rouba sessão/CSRF-token → ATO admin
   - *SSRF:* fetch cego → resposta refletida → metadata cloud (169.254.169.254) → credencial IAM → conta cloud
3. **Pra cada degrau ACIMA do atual, formular a hipótese concreta** que, **se verdadeira**, coloca o achado nesse degrau. ("Se `markContentRead` aceita `userId` → marco 'lido' no nome de outro = degrau *escrever como terceiro*." / "Se o id do body vira o alvo do saque → degrau *fundos alheios*.")
4. **Puxar elos** — o degrau pode precisar de uma peça da `arapuca.md` ou de uma chain do `memory/arsenal.md` (info→IDOR→ATO, WCD+CSPT→ATO, redirect+OAuth→token). Nomear o elo.
5. **Testar bottom-up** (via `formação de lança`, guardrails de escopo/rate, para-e-confirma em ação mutante): o degrau **imediatamente acima** primeiro. Subiu → repete do passo 3 no novo degrau.
6. **Parar quando:** a hipótese do próximo degrau é **falsificada** (→ o achado está no teto **confirmado**; reportar nesse nível) OU o próximo degrau exige acesso/ação que não temos/não podemos (→ documentar como **"pior caso plausível, não confirmado"** com a hipótese explícita).
7. **Devolver pro `report`:** severidade calibrada ao **degrau mais alto CONFIRMADO** + seção **"Impacto: demonstrado vs pior caso"** (os degraus não-confirmados, cada um com sua hipótese e o elo que falta).

Saída: escada desenhada na ficha/`arapuca.md` (degrau atual marcado, hipóteses por degrau, ✓/✗/[não-testável]) + 1 linha: "teto confirmado: degrau N (sev X) · pior caso: degrau M (falta Y)".
Guardrail: subir só **na mecânica**, dentro do escopo. Hipótese de degrau superior que só se testa com ação destrutiva/irreversível → **não testar**, vai pro report como pior caso.

### `seguir o rastro` — ramificar a partir de um sinal
Ativação: **"seguir o rastro"** / **"segue o rastro"**. Desliga: **"perdi o rastro"** / **"chega de rastro"**.
Postura de **tenacidade dirigida**: quando um sinal aparece (parser esquisito, diferencial de erro, campo que vaza, ordem de validação observável, timing), **não parar na observação** — expandir em profundidade cada ramificação que ele abre.

Loop, a cada sinal:
1. **Nomear o sinal** em 1 linha: o que exatamente foi observado (ex.: "erro de nonce vem antes do erro de key").
2. **"O que isso me deixa testar agora?"** — listar 3–8 ramificações concretas (novos inputs, nova ordem, novo encoding, novo método/verbo, novo caminho) que só fazem sentido *por causa* do sinal.
3. **Executar** as ramificações (via `formação de lança` se ligada), dentro dos guardrails de escopo/rate.
4. **Cada ramificação que responde diferente vira um novo sinal** → volta ao passo 1. Cada uma que fecha → registrar como `[FP]`/`[PADRÃO]` com o porquê.
5. **Parar** quando: a árvore de ramificações se esgota, ou uma ramificação vira `[ACHADO]`/`[SIMULADO]` que precisa de mais acesso (então documentar o ponto de retomada).
6. **Cruzar cada nível** com `memory/patterns.md` + `memory/arsenal.md` — o rastro costuma casar com P5/P7/P8.

Saída: uma **árvore** — sinal-raiz → ramos testados → veredito de cada folha → o ramo vivo mais promissor. Registrar a árvore na ficha.
Guardrails: herda `modo hunter`. O rastro não justifica sair do escopo nem furar rate limit; se um ramo pede ação mutante/irreversível, para-e-confirma.

### `formação de lança` — execução ativa assistida (só dentro do `modo hunter`)
Ativação: **"formação de lança"** / **"forma a lança"**. Desliga: **"desfaz a lança"** / **"baixa a lança"**.
Pré-requisito: `modo hunter` ligado + alvo **autorizado** com ficha. Sub-modo de execução = **Orquestração** (com rede).
> **Incompatível com `postura escudo`:** levantar o escudo baixa a lança automaticamente. Não dá pra ter os dois ligados — escudo = só silencioso, lança = ataque ativo.
Postura: em vez de só propor, o Claude **conduz o ataque de ponta a ponta** em cada lead — construindo, executando (dentro dos guardrails) e **simulando** o resto, sempre cruzando com o banco de memória.

**Por lead `[UNTESTED]` da ficha:**
1. **Constrói o teste.** Monta a request/PoC concreta (curl/script) mirando o sinal exato: IDOR = 2 contextos/contas · bypass = matriz de variações (método/header/path) · lógica = sequência de passos fora de ordem.
2. **Executa** dentro dos limites: só escopo autorizado · `--rate` da ficha · nunca rajada em login/reset/MFA/pagamento · **sem exploit armado** (PoC = evidência mínima).
3. **Simula o que não pode tocar.** O que exige sessão/2ª conta/ação mutante/destrutiva/host de terceiro: o Claude **descreve a execução passo a passo** (request + response esperado + pré-condições + resultado provável) e marca **`[SIMULADO]`**. Não fabrica evidência real; deixa explícito o que falta pra confirmar ("preciso de conta no portal").
4. **Compara com o banco.** Cada resultado é cruzado com `memory/patterns.md` (P1–P8) e `memory/arsenal.md` (sinais · FP comuns · escalada da classe): "casa com Pn / técnica X do arsenal · FP comum é Y · próximo elo é Z".
5. **Triagem + escala** iguais ao `modo hunter` (5 perguntas céticas → escala obrigatória) antes de qualquer veredito.
6. **Registra** cada tentativa na ficha e persiste técnica nova no `arsenal.md`.

**Limites (herda `modo hunter` + regra de escopo):** **para-e-confirma** antes de qualquer request que crie/altere/apague dado, toque terceiro ou saia do escopo claro. `[SIMULADO]` nunca vira `[ACHADO]` sem execução real. Humano sempre submete.

Saída por lead: `[VEREDITO|SIMULADO] lead · request enviada (ou simulada) · resposta · casa com patterns/arsenal? · próximo passo`.

### `formação tridente` — teste diferencial em 3 navegadores (o irmão observacional da lança) 🔱
Ativação: **"formação tridente"** / **"forma o tridente"** / **"tridente"**. Desliga: **"recolhe o tridente"** / **"baixa o tridente"**.
Pré-requisito: alvo **autorizado** com ficha. **Compatível com a `postura escudo`** (roda junto — ≠ da lança) e com o `modo hunter`.
Postura: rodar **todos os fluxos** interessantes através de **3 engines de navegador** em paralelo e **diffar o comportamento**. Onde os navegadores discordam, mora o bug — é **P5 (parser A ≠ parser B) na camada do cliente**.

**As 3 pontas (engines — não marcas):**
1. **Blink** (Chrome/Edge/Brave · V8) — dirigível de verdade pela skill `claude-in-chrome`.
2. **Gecko** (Firefox · SpiderMonkey).
3. **WebKit** (Safari · JavaScriptCore).
- *Ponta 0 opcional:* cliente **sem-JS** (curl) como baseline "o que o servidor manda cru".

**Por que convive com o escudo:** dirigir navegadores reais por fluxos **legítimos** = tráfego de usuário normal, baixo volume, serial → **não dispara flag**. É observação, não ataque. O que sair do comportamento de usuário (fuzz, payload de injeção) continua 🔴 vitrine `[REQUER AUTORIZAÇÃO]` no escudo.

**O catálogo de divergências (onde 3-navegadores-vira-bug):**
- **CSP** — um engine bloqueia, outro não (`unsafe-eval`, nonce, `strict-dynamic`, `script-src` variam) → XSS que só executa num.
- **Cookies / SameSite** — default SameSite, `__Host-`/`__Secure-`, partitioning (CHIPS) diferem → CSRF/vazamento de sessão.
- **Redirect & parsing de URL** — `\`↔`/`, unicode, `javascript:`/`data:` handling, `@`/`//` → open redirect / XSS num engine só.
- **Normalização de path** — `%2e`, `..`, encoding duplo → traversal / **WCD cache-key differential**.
- **DOM / sanitização** — parsing de HTML, `innerHTML`, mutation-XSS variam por engine.
- **Charset/encoding** — sniffing, UTF-7 legado → XSS.
- **Service Worker · storage · CORS preflight · autofill** — comportamento por engine.

**Registro (múltiplas informações — o coração do tridente):** por fluxo, uma **matriz** em `targets/<alvo>/tridente.md` (criar se não existe): `fluxo · engine · status · headers-chave (CSP/Set-Cookie/Location) · cadeia de redirect · cookies setados · resultado no DOM · erros de console · storage`. **Cada linha divergente entre engines = lead** → entra no fluxo normal (`contra-prova`/`arapuca`). Casar com [[patterns]] P5 e `arsenal.md` (WCD+CSPT, browser-powered desync, CSP bypass).

**Como opero:** ponta **Blink** eu conduzo via `claude-in-chrome` (executo o fluxo, capturo headers/console/DOM). Pontas **Gecko/WebKit**: te oriento o mesmo fluxo (passos exatos + o que capturar) e você cola o resultado; eu consolido a matriz e aponto as divergências.

**Guardrails:** herda escopo + (se ligada) a `postura escudo`. **Se o programa exige header** (ex.: eToro `X-Bug-Bounty:<user>`), o header vai em **todos** os navegadores (extensão tipo ModHeader / proxy) — sem isso, não roda o fluxo naquele engine. Sem tooling de volume; um fluxo por vez.

Saída por fluxo: `[TRIDENTE] fluxo · Blink=X · Gecko=Y · WebKit=Z · divergência? → lead + pattern`.

---
_Novos comandos: copie o formato acima. Mantenha números (códigos) e nomes (protocolos/modos) estáveis — o Tiago decora._
