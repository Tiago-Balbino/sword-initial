# Sword — operação de caçada (bug bounty)

Projeto de caçada real: encontrar, provar e reportar vulnerabilidades em programas autorizados.

## Regra do cérebro
`THE-MIND.md` é o **cérebro** do projeto: método (6 perguntas) + roteamento (qual comando, quando) + log de decisões. **Antes de qualquer caçada, leia-o** — tudo passa por ele.

## Arquivos-chave (leia sempre)
- `THE-MIND.md` — o cérebro (ler primeiro ao caçar).
- `CODES.md` — comandos, em 3 tipos: `code N` (ação rápida), `protocolo <nome>` (fluxo: `casa-nova`, `contra-prova`, `report`) e `modo <nome>` (postura ligada: `hunter`, `bicicleta com rodinhas`). Execute o que está definido lá.
- `memory/` — banco de conhecimento: `patterns.md` (padrões meta), `arsenal.md` (como testar por classe), write-ups por classe. Carregue no início de toda caçada; alimente ao aprender algo novo.
- `portfolio.md` — programas candidatos rankeados (escopo × reward). Porta de entrada do `modo hunter`: ele lista daqui e você escolhe o alvo. Alimentado pelo `modo sábado à tarde`.
- `targets/<dominio>/` — ficha do alvo + saídas de recon.
- `README.md` — ferramentas e uso.

## Prioridades
1. Broken Access Control / IDOR (máxima)
2. Lógica de negócio (máxima)
3. Recon & low-hanging fruit (headers/CORS, takeover, secrets)
4. Injeção · auth/sessão · SSRF/XXE/upload — conforme a superfície.

## Regra de escopo (inegociável)
Só recon/scan/PoC em alvos **autorizados** por programa com escopo definido. Na dúvida, pergunte antes de disparar.

## Estrutura
```
Sword/
├── CLAUDE.md · CODES.md · THE-MIND.md · README.md
├── tools/     # recon.py, cors_headers_scan.py
├── targets/   # um por alvo (ficha + recon/)
└── memory/    # write-ups + padrões, por classe de bug
```

## Ambiente
macOS nativo (rede + git ok). `pip install requests`. Ligado ao projeto **Sword** no claude.ai.
