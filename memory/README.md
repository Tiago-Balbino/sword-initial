# memory/ — Banco de conhecimento de padrões

Corpus de write-ups **distilados** (não copiados) para identificar padrões recorrentes de
vulnerabilidade. A ideia: quando você olhar um alvo novo, consultar aqui os padrões que já
pagaram bounty em situações parecidas — e alimentar de volta quando aprender algo.

## Organização
- `patterns.md` — **o coração**: padrões meta que se repetem em muitos write-ups, ligados às 6 perguntas do *The Mind*. Leia isto primeiro.
- `arsenal.md` — **o *como testar*** por classe de vuln (sinais · confirmação · escalada · bypasses · FP · fontes). Carregar no início de toda caçada; o `modo hunter` alimenta aqui.
- `broken-access-control.md` — BAC / IDOR / escalada de privilégio (prioridade #1).
- `business-logic.md` — falhas de lógica de negócio (prioridade #1).
- `recon-surface.md` — recon, superfície, subdomain takeover.
- `metodo-persistir-nos-pontos-de-desistencia.md` — **metodologia**: os 3 pontos onde a caçada tende a parar e como atravessar (re-enquadrar, matriz completa, probe não-destrutivo, `descobrir a roda`). Ligado ao `THE-MIND` §1.6.
- `sources.md` — feeds/repositórios pra continuar minerando (awesome-lists, academies).

## Esquema de cada entrada (mantenha consistente pra padrões emergirem)
```
### <título curto>
- **Alvo · Classe · Bounty · Data** — [link]
- **Padrão:** a mecânica em 1–2 frases (o que o dev assumiu que deixou de ser verdade).
- **Como acharam:** o passo concreto que revelou o bug.
- **Gatilho:** o sinal que, num alvo novo, deve fazer você suspeitar do mesmo.
```

## Como alimentar (`code 4` registra decisão; aqui é conhecimento)
1. Achou um write-up bom? Distile no arquivo da classe certa usando o esquema acima. **Nunca cole o texto original** — resuma + linke (respeita direito autoral e força o aprendizado).
2. Se a mecânica for um padrão novo e transversal, adicione também em `patterns.md`.
3. Se for de uma classe sem arquivo, crie `memory/<classe>.md`.

> Curadoria > volume. Uma entrada bem distilada vale mais que dez links soltos.
