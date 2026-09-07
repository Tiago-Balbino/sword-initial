# recon-benchmarks — datasets de referência pra treinar o nosso recon

Cada pasta = um recon **externo** (de terceiro, mais completo) guardado como **gold standard**.
Uso: rodar o nosso `protocolo ladrão de bancos` no mesmo alvo e **diffar** contra o benchmark
(`comm`/`grep`) pra medir cobertura e caçar o que perdemos. Método padrão: `memory/recon-metodo-padrao.md`.

| Alvo | Data | Fonte | Destaque do gap que ensinou |
|------|------|-------|------------------------------|
| yahoo-2026-09-07-externo | 2026-09-07 | recon externo do Tiago | subfinder 53k (c/ keys) vs nosso 40; DoH mass-resolve; ecossistema payment/oauth/admin que perdemos |
