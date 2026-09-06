# The Mind — o cérebro do Sword

**Tudo que a gente caça passa por aqui primeiro.** Este arquivo é (1) o **método** de raciocínio e
(2) o **roteador** que decide qual comando usar e quando. Antes de qualquer caçada, o cérebro é
carregado e consultado.

Dois "The Mind", complementares:
- **Este arquivo** (`THE-MIND.md`) — método + roteamento + log de decisões (o cérebro operacional).
- **The Mind online** (artifact) — a versão didática/expandida da metodologia com casos reais:
  https://claude.ai/code/artifact/aeb6b9c3-62d8-43c4-85ae-58d8183c9fb2

---

# PARTE 1 — O cérebro

## 1.1. As 6 perguntas universais (rode em qualquer feature/endpoint)
Toda vulnerabilidade é uma **suposição do dev que deixou de ser verdade**. Para achá-la, ataque a suposição:

1. **Quem verifica o quê?** Onde se confirma *identidade* (quem você é) e onde se confirma *permissão* (o que você pode)? O vão entre as duas é BAC/IDOR.
2. **O que o cliente controla?** Todo campo que o cliente manda (id, preço, papel, flag) e o servidor confia é candidato a abuso.
3. **Existe caminho alternativo pro mesmo efeito?** Rota/método/host/serviço secundário que faz a mesma ação sem o mesmo controle.
4. **A ordem das etapas é garantida ou assumida?** Pular, repetir, reordenar, race — se o passo N confia que N-1 aconteceu.
5. **O dado muda de formato entre camadas?** Parser A ≠ parser B (e-mail, URL, unicode, XML, encoding) → discrepância explorável.
6. **Fail-open ou fail-closed?** Quando um controle falha/timeout, ele libera ou bloqueia? Fail-open é ouro.

Ligam direto aos 8 padrões meta em `memory/patterns.md` e às classes do `memory/arsenal.md`.

## 1.2. Mapa de roteamento — qual comando, quando
(Definições completas em `CODES.md`. O cérebro escolhe; no `modo bicicleta` ele sugere em voz alta.)

| Situação | Comando |
|---|---|
| Quero operar **sem disparar flag** (stealth) / alvo novo / escopo dúbio | `postura escudo` (só o silencioso + vitrine `[REQUER AUTORIZAÇÃO]`; **baixa a lança** e rebaixa o hunter ao subconjunto quieto) |
| Escolher **qual programa** caçar | `modo hunter` lista o `portfolio.md` e você escolhe; alimente o portfólio no `modo sábado à tarde` |
| Alvo novo, **fora de casa** (qualquer navegador) | Coletor **casa-nova** (artefato) → em casa, `protocolo casa-nova` |
| Alvo novo, **no Mac** | `protocolo casa-nova` (com pacote) ou `code 3` (manual) |
| Mapear superfície do alvo | `code 0` (completo) ou `code 1` (passivo, sem tocar) |
| Recon chegou, quero **hipóteses concretas** dele | `code 6 <alvo>` (casa o recon contra `memory/signals.md` → leads `[UNTESTED]` rankeados) |
| Recon chegou, hora de caçar | `modo hunter` (carrega arsenal + patterns + ficha; roda as 6 perguntas) |
| Achei um candidato a bug | `protocolo contra-prova` (dupla verificação pessimista) |
| Passou no contra-prova como ACHADO | `protocolo report` (rascunho + checklist; humano submete) |
| Mudança de rumo/estratégia | `code 4` (registrar decisão aqui no The Mind) |
| Docs cloud têm entradas novas (memory e/ou portfólio) | `code 5` (drena os dois pro local: `memory/` + `portfolio.md`) |
| Montar portfólio **fora do Mac** | `modo sábado à tarde` enfileira no doc cloud → `code 5` no Mac puxa |
| Aprendi técnica nova numa caçada | `modo hunter` persiste em `memory/arsenal.md` |
| Quero **estudar/aprender** (distilar write-ups no banco, com retenção) | `modo dojo` (recall ativo + aplicação + espaçamento; log em `memory/dojo-log.md`) |
| Quero ser guiado passo a passo | `modo bicicleta com rodinhas` |
| Quero que o Claude conduza os ataques (constrói + executa + simula + cruza com o banco) | `formação de lança` (dentro do `modo hunter`) |
| Quero comparar o mesmo fluxo entre **navegadores** (diferencial de engine = P5 client-side) | `formação tridente` (Blink/Gecko/WebKit; **compatível com o escudo**; matriz em `tridente.md`) |
| Caçar por camadas de acesso (unauth → 1 conta → 2 contas) | nível 0 = recon/APIs públicas · nível 1 = `protocolo One Piece` · nível 2 = cross-account |
| Achei um sinal e quero ramificar em profundidade | `seguir o rastro` (árvore de ramificações a partir do sinal) |
| Estou juntando achados fracos que talvez chainem | `protocolo armar a arapuca` (inventário `targets/<alvo>/arapuca.md` + passo de combinação) |
| A caçada empacou e a arapuca tem muitas peças | `protocolo descobrir a roda` (reconstrói o sistema → mapa do não-testado → cadeias narrativas) |
| Tenho um `[ACHADO]` confirmado e quero reportá-lo no teto (não no piso) | `protocolo escada de jacó` (sobe o achado degrau a degrau rumo ao pior caso) — **antes do `report`** |
| Encerrar o `modo hunter` | dispara o **Selo de saída** (§1.5) — ficha + log 100% atualizados **antes** de desligar |

## 1.3. O fluxo de caçada (hunter) — visão do cérebro
```
portfolio (escolher programa) → casa-nova (ficha) + code 0 (recon/superfície) → modo hunter:
   lista alvos do portfolio → você escolhe → puxa targets/<alvo>/ (ficha + recon)
   carrega cérebro (this) + arsenal + patterns
   → roda as 6 perguntas por feature
   → triagem cética (5 perguntas) em cada candidato
   → ESCALA obrigatória (pesquisa técnica + chain) antes de cravar severidade
   → tenacidade (relê JS/responses; exaure arsenal + catálogo complexo)
   → persiste técnica nova no arsenal
achado → protocolo contra-prova → (se ACHADO) protocolo report → humano submete
```
Regra de escopo acima de tudo: só alvo autorizado; humano submete; sem exploit armado (PoC mínima).

## 1.4. Modo bicicleta com rodinhas — como o cérebro guia
Quando ligado, a cada passo o cérebro **sugere o próximo comando e explica o porquê** antes de você pedir
(ex.: "recon fechou e o `gf/idor.txt` tem 2 leads → sugiro `modo hunter` e depois `contra-prova` no 1º").
Sem as rodinhas, o roteamento continua acontecendo — só que silencioso. As rodinhas o tornam explícito.

## 1.5. Selo de saída — encerrar o `modo hunter` sem perder nada
**Padrão fixo:** todo `modo hunter off` dispara o **Selo** (passo-a-passo completo em `CODES.md` › `modo hunter` › "Ao desligar").
**Objetivo:** `targets/<alvo>/` é sempre um retrato **100% atual** da caçada — qualquer sessão futura (ou outra pessoa) retoma lendo **só a ficha + o log**, sem redescobrir nada.
**Sub-processo, em ordem:** (1) flush dos leads/superfície/vereditos → `README.md`; (2) bloqueios explícitos por lead; (3) bloco datado em `a-cacada-ate-aqui.md` com "Próximo passo"; (4) aprendizado → `arsenal.md` / `patterns.md` / `code 4`; (5) estado do git; (6) resumo de 3 linhas no chat. **Só então desliga.**
Sub-modos (`formação de lança`) desligam junto e o que produziram entra no Selo. Nunca desligar "no seco" — se o Selo não fechar um item, dizer qual falta.

## 1.6. Os pontos de desistência — e por que atravessar
Detalhe + o caso que gerou isso: `memory/metodo-persistir-nos-pontos-de-desistencia.md`. A caçada tem 4 pontos onde é natural parar; nomeá-los ajuda a não parar cedo demais:

1. **"Sem impacto demonstrado"** → quase sempre = "ainda não achei o **param / verbo / método / contexto** certo", não "não há vuln". Antes de largar: rodei a **matriz completa** (verbo × endpoint × param × tenant/appId × status)? tentei os nomes de header/param do `arsenal` (identidade forjada, `createdBy`, `teams`, filtros de escopo)?
2. **Contra-prova deu `PADRÃO` / `PÚBLICO POR DESIGN`** → morreu o **enquadramento**, não necessariamente a **mecânica**. Re-enquadrar: disclosure → *é broken-auth?* · broken-auth de leitura → *se estende a escrita/estado?* · endpoint vazio → *vazio por falta de dado ou de principal? há endpoint irmão?* · há **oráculo** de existência/autorização?
3. **O teste óbvio é destrutivo ou o harness bloqueia** → existe quase sempre um **probe não-destrutivo** pra mesma pergunta. A pergunta raramente é "a ação acontece?" — é "**o controle de auth foi pulado?**", e isso responde com `GET` sem params (`401` vs `500-validação`), `OPTIONS`/`HEAD`, ou `id` = marcador que não casa nada real.
4. **"Já cacei isso a fundo"** → rode `descobrir a roda`: reconstruir o modelo do sistema revela o não-testado que a caçada linear não viu.

**Regra:** toda desistência entra como hipótese explícita `[NÃO TESTADO: X — por quê]`, nunca como veredito. Só vira veredito depois de exaurir.
**Contra-regra (pra não virar teimosia):** persistir **na mecânica**, dentro do escopo e dos guardrails — não no enquadramento nem na esperança. 3 re-enquadramentos + matriz completa + `descobrir a roda` sem nada demonstrável = `FALSO POSITIVO` legítimo, e isso é vitória.

---

# PARTE 2 — Log de decisões

Cada decisão: **Data · Decisão · Por quê · Validação/Status**. Não apagar — registrar reversões abaixo.

### 2026-08-31 — Pivot: estudo → caçada real
- Sword deixou de ser roadmap de estudo e virou operação de caçada real. `roadmap-estudo.md` aposentado; `projeto-cacada.md` criado.

### 2026-08-31 — Ferramentas em Python puro + orquestração
- `recon.py` orquestra subfinder/amass/httpx/katana/gospider/gau/waybackurls/gf/nuclei com fallback Python; `setup.sh` instala tudo no Mac. Rodar no Claude Code nativo (rede + git).

### 2026-08-31 — Banco de memória (padrões) + ingestão diária cloud
- `memory/` com `patterns.md`, arquivos por classe e `arsenal.md`. Tarefa diária (10h) ingere write-ups no doc cloud; `code 5` sincroniza pro local.

### 2026-08-31 — code 5 sincroniza memory + portfólio; sábado à tarde alimenta cloud fora do Mac
- **Decisão:** o `code 5` passa a drenar **dois** feeds cloud — `claude/memory-banco.md` (→ `memory/`) e `claude/portfolio-banco.md` (→ `portfolio.md`). O `modo sábado à tarde` fora do Mac enfileira programas no doc cloud do portfólio; no Mac, escreve direto.
- **Por quê:** montar o funil de programas de qualquer computador e puxar tudo ao chegar no Mac, igual já era com o memory.

### 2026-08-31 — Fusão com a skill `cacada`
- **Decisão:** adotar os benefícios da skill `cacada` dentro do Sword, com os comandos do Sword — sem virar dois sistemas paralelos.
- **O quê:** arsenal da cacada fundido em `memory/arsenal.md`; filtro de triagem de 5 perguntas embutido no `protocolo contra-prova`; ferramentas que faltavam (amass/gospider/gf) integradas ao `setup.sh` e `code 0`; criados `modo hunter` (postura de caçador sênior) e `modo bicicleta com rodinhas` (cérebro copiloto); `protocolo report` adicionado.
- **Por quê:** ter o motor de triagem/escala/tenacidade da cacada, mas na estrutura e nos comandos do Sword, com o The Mind como cérebro central.
- **Validação:** `recon.py` novo testado com stubs (amass/gospider/gf ok). Falta rodar `setup.sh` de verdade no Mac e uma caçada real ponta a ponta.

---

## Perguntas em aberto (a validar)
- Conciliar a pasta `~/Downloads/cacada` (skill original) com o Sword: manter só como referência dissecada, ou empacotar o Sword como skill própria depois?
- Rodar `modo hunter` de verdade no alvo da Intigriti (ficha em `targets/intigriti-11359.zendesk.com/`) e ver o fluxo fechar.

### 2026-09-01 — Estratégia: foco distribuído (sem alvo único)
- **Decisão:** por enquanto, não focar num alvo único — explorar em paralelo todos os programas do portfólio; o ranking é ordem de EV, não escolha exclusiva.
- **Por quê:** ainda sem bug em mãos; deixar o alvo "escolher" pelo primeiro sinal quente. Registrado via `modo sábado à tarde` + `code 5`.

### 2026-09-02 — `formação de lança` (sub-modo do hunter)
- **Decisão:** novo sub-modo dentro do `modo hunter` — o Claude constrói + executa (dentro dos guardrails) + **simula** o que não pode tocar + cruza todo resultado com `patterns.md`/`arsenal.md`. `[SIMULADO]` nunca vira `[ACHADO]` sem execução real.
- **Por quê:** tirar o Claude do "só propor" e pôr pra conduzir o ataque, sem quebrar escopo/rate/PoC-mínima. Definido em `CODES.md` › Modos.

### 2026-09-02 — Caçada por camadas + `seguir o rastro` + `armar a arapuca`
- **Decisão:** 3 comandos novos, nascidos na caçada do CoinSpot:
  - **`protocolo One Piece`** — a camada de caça com 1 conta só (self-state, tampering, race própria, escopo, step-skip), entre unauth (nível 0) e cross-account (nível 2).
  - **`seguir o rastro`** — postura de tenacidade dirigida: de um sinal, ramificar em profundidade (árvore) em vez de parar na observação.
  - **`protocolo armar a arapuca`** — inventário vivo (`targets/<alvo>/arapuca.md`) de achados fracos + passo de combinação pra montar chain.
  - **`protocolo descobrir a roda`** — síntese: reconstrói a máquina inteira a partir das peças da arapuca, faz eng. reversa da mecânica, lista o não-testado, monta cadeias narrativas multi-passo. Roda quando a caçada empaca.
- **Por quê:** o Tiago apontou (com razão) que os leads estavam genéricos ("vai bater em IDOR que já bateram?"). Esses 3 forçam profundidade, camadas e composição — que é onde valor sobrevive em programa maduro.
- **Status:** definidos em `CODES.md`. Exercitados no CoinSpot: `seguir o rastro` do parser de nonce rendeu P1 (parseInt+falsy) e P2 (last-key-wins) → chain candidata C1 (dup-key smuggling no saque). `arapuca.md` criado com 12 peças.

### 2026-09-03 — §1.6 "pontos de desistência" + `descobrir a roda` + o caso NBA
- **Decisão:** adicionado `THE-MIND` §1.6 (os 4 pontos onde a caçada tende a parar cedo e como atravessar) + `memory/metodo-persistir-nos-pontos-de-desistencia.md`. Novo `protocolo descobrir a roda` (síntese: reconstrói o sistema → não-testado → cadeias narrativas).
- **Por quê:** na NBA, um BAC real (escrita unauth `markContentRead`/`updateContentReadCount`) foi achado **3 pontos de desistência** depois de onde a caçada normal para: (A) `readContent []` = "morto"; (B) contra-prova `PADRÃO` + eu disse "NBA zero achado"; (C) R2 destrutivo/bloqueado. Cada um foi atravessado por re-enquadrar / probe não-destrutivo / `descobrir a roda`.
- **Status:** registrado. R2 = `ACHADO` (Low→Medium), aguardando `protocolo report`.

### 2026-09-05 — `postura escudo` ganha a regra de delegação ao operador
- **Decisão:** a `postura escudo` passa a ter uma regra fixa de **"nunca só não posso"**: toda ação evitada (🔴 do escudo OU bloqueio do classifier de segurança do runtime) vem sempre com (1) o porquê em 1 linha, (2) o comando pronto pro Tiago rodar com a autorização/sessão dele, (3) o que o Claude vai interpretar no resultado. Execução volta pro operador; desenho do teste + interpretação ficam com o Claude.
- **Por quê:** já era a prática de fato na caçada do eToro (sondas OAuth Azure AD, replay de bearer de sessão bloqueado pelo classifier) — formalizado como regra permanente pra não depender de eu lembrar caso a caso.
- **Status:** `CODES.md` › `postura escudo` › "Delegação ao operador". Escudo levantado nesta sessão (lança baixa automático).

### 2026-09-05 — `modo dojo` (sistema de estudo com retenção)
- **Decisão:** novo **`modo dojo`** — o lado *entrada de conhecimento* do Sword (o `modo hunter` é a saída). Estudo **ativo**: cada write-up passa por leitura ativa (3 perguntas) → distilar a mecânica no banco (`arsenal`/`signals`/`patterns`/`_ingested`) → **recall** (reconstruir de memória, fonte fechada) → **aplicar** o sinal novo nas fichas vivas (`code 6` mental) → **agendar revisão espaçada** (1d→1sem→1mês). Log em `memory/dojo-log.md`.
- **Por quê:** o Tiago pediu um sistema de estudo que se auto-alimenta em vez de depender de disciplina. Fundado nos 3 mecanismos que fixam aprendizado (recall ativo, aplicação, espaçamento), não em releitura. Fecha o ciclo: dojo (entrada) → hunter (saída) → dojo revisita.
- **Status:** definido em `CODES.md` › Modos + roteado no §1.2 + `dojo-log.md` criado. Guardrail: 2-3 write-ups/sessão (qualidade > volume).

### 2026-09-05 — `formação tridente` (teste diferencial multi-navegador)
- **Decisão:** nova formação **`formação tridente`** — roda todos os fluxos por **3 engines** (Blink/Gecko/WebKit) e diffa o comportamento; divergência entre navegadores = bug **P5 na camada do cliente** (CSP, SameSite, redirect/URL parsing, DOM/mutation-XSS, charset, WCD cache-key). **Compatível com a `postura escudo`** (dirigir navegador real por fluxo legítimo = tráfego de usuário, não dispara flag → ≠ da `formação de lança`, que o escudo baixa). Registra uma **matriz** por fluxo×engine em `targets/<alvo>/tridente.md` (múltiplas informações: status, headers, redirect chain, cookies, DOM, console, storage).
- **Por quê:** faltava um vetor observacional de diferencial de navegador — muita vuln client-side (CSP bypass, mutation-XSS, WCD, cookie/SameSite) só aparece em UM engine. O tridente institucionaliza rodar tudo nos 3 e comparar, sem sair do silencioso.
- **Como:** ponta Blink via `claude-in-chrome`; Gecko/WebKit orientados ao Tiago (passos + captura) e consolidados. Header obrigatório do programa (ex.: eToro `X-Bug-Bounty`) vai em todos os engines.
- **Status:** definido em `CODES.md` › Modos + roteado no §1.2. Falta exercitar num fluxo real (candidato: OAuth do wallet eToro, onde CSP/redirect por-engine importam).

### 2026-09-04 — `postura escudo` + motor de hipóteses (`signals.md` + `code 6`)
- **Decisão:** dois acréscimos.
  - **`postura escudo`** (renomeada de "modo guarita" no mesmo dia) — postura stealth prioritária: só executa o silencioso (não dispara flag) e, por superfície, mostra o teto marcado `[REQUER AUTORIZAÇÃO]` (a "vitrine"). **Levantar o escudo baixa a lança** (`formação de lança` off automático — são opostos) e rebaixa o `hunter` ao subconjunto quieto.
  - **Motor de hipóteses** — novo `memory/signals.md` (índice de gatilhos que **inverte** o arsenal: `sinal → pattern → hipótese → probe 🟢/🔴 → FP`) + `code 6 <alvo>` que casa o corpus de recon contra ele em 2 passadas (sinais únicos + composição/chain) e cospe leads `[UNTESTED]` rankeados na ficha.
- **Por quê:** (1) faltava um botão explícito de "quieto"; (2) o matching recon→banco era ad-hoc/na cabeça — inconsistente, perdia sinal em corpus grande, e não cruzava padrões pra gerar hipótese de chain (onde valor sobrevive em programa maduro). `signals.md` torna o matching greppável e determinístico; o Pass 2 gera as chains.
- **Status:** `postura escudo` e `code 6` em `CODES.md`; `signals.md` seedado a partir do `arsenal.md` (24 sinais + 7 chains). Disciplina: toda entrada nova do arsenal com "Sinais" espelha uma linha em `signals.md`. **Falta:** rodar `code 6` num alvo real (ex.: CoinSpot/NBA, que já têm recon) pra validar o ranking. Camada opcional futura: `tools/hypothesize.py` (grep mecânico dos tokens sobre o recon dir).

### 2026-09-02 — Selo de saída ao encerrar o `modo hunter`
- **Decisão:** `modo hunter off` passa a ser um sub-processo obrigatório ("o Selo", §1.5): flush de leads/superfície/vereditos pra ficha, bloqueios explícitos, bloco datado no log com próximo passo, aprendizado pro `memory/`, estado do git, resumo no chat. `targets/<alvo>/` fica sempre 100% atual.
- **Por quê:** retomar a caçada (dias depois ou por outra pessoa) sem redescobrir — ficha + log bastam. Nasceu ao encerrar a 1ª caçada real (Arkose), que travou por falta de conta no portal (B2B, sem self-signup).
- **Status:** definido em `CODES.md` (`modo hunter` › "Ao desligar") + `THE-MIND.md` §1.5. Executado no Arkose nesta sessão.
