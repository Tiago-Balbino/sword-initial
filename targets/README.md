# targets/ — Registro de alvos

Uma **pasta por alvo** (por domínio raiz). Cada alvo tem uma ficha `README.md`
(o que sabemos dele) e as saídas de recon.

## Convenção
```
targets/
├── _TEMPLATE.md            # modelo de ficha (copie ao abrir um alvo novo)
└── exemplo.com/
    ├── README.md           # ficha: escopo, stack, superfície, achados
    └── recon/
        ├── subdomains.txt
        ├── live-hosts.txt
        ├── recon.json
        └── cors.json
```

## Ao abrir um alvo novo
1. `mkdir -p targets/<dominio>/recon`
2. Copiar `_TEMPLATE.md` para `targets/<dominio>/README.md` e preencher o que já se sabe.
3. Rodar recon (`code 0` faz tudo isso automaticamente).

> Só registre e teste alvos **autorizados** por um programa de bug bounty/pentest.
