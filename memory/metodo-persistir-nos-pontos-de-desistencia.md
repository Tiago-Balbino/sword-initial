# Método — persistir nos pontos de desistência

**Classe:** metodologia de caçada (não é classe de vuln). Ligado à "Tenacidade honesta" do `modo hunter` e ao `THE-MIND` §1.6.

## O caso que gerou isso — NBA `apis.nba.com` (TeamOne), set/2026

Um **Broken Access Control real** (escrita não-autenticada: `markContentRead` / `updateContentReadCount` sem auth) foi encontrado **3 pontos de desistência depois** de onde uma caçada normal teria parado.

| # | Ponto de desistência | O que faria parar | O que fizemos em vez disso | Resultado |
|---|----------------------|-------------------|----------------------------|-----------|
| A | `readContent` unauth devolvia `[]` nas primeiras tentativas | "user-scoped, sem impacto, morto" | trusted-header injection (20 variantes do arsenal) → `descobrir a roda` → R1 (params de filtro de identidade: `teams`, `createdBy`, `visibilityType=PRIVATE`, …) | R1 **falsificada de vez** — mas o processo de exaurir estava certo; sem ele não teríamos o modelo |
| B | contra-prova cravou `readTaxonomy` = **`PADRÃO DA APLICAÇÃO`** e eu disse "NBA = zero achado reportável" | veredito da contra-prova | o Tiago rebateu: *"você está me dizendo que não há nenhum bug?"* → re-enquadrar: **disclosure → é broken-auth? o broken-auth se estende a ESCRITA?** | nasceu o R2 (hipótese "a policy do gateway é por-verbo") |
| C | R2 exigia mandar `PUT`/`DELETE` em `deleteFile`/`deleteUser` → **harness bloqueou** + guardrail `formação de lança` | "não dá pra testar sem request destrutivo" | achamos o **probe não-destrutivo**: `GET` sem params → `401` (auth ok) vs `500 "x required"` (auth bypassada), sem tocar em nada; depois `?id=<UUID marcador>` que não casa nada real | **200 unauth confirmado** em `markContentRead`; `500 "Content not found"` (lookup real sem auth) em `updateContentReadCount` |

## As regras (o que aprender)

1. **"Sem impacto demonstrado" ≠ "não há vuln".** Quase sempre = "ainda não achei o **parâmetro / verbo / método / contexto** certo". Antes de largar:
   - Rodei a **matriz completa**? (verbo × endpoint × param × appId/tenant × status/visibility). "Tentei uns 3 e deu `[]`" não é exaurir.
   - Tentei os **nomes de header/param do `arsenal`** (identidade forjada, filtros de escopo, `X-*-User`, `createdBy`, `teams`)?
2. **Contra-prova `PADRÃO`/`PÚBLICO POR DESIGN` mata o *enquadramento*, não necessariamente a *mecânica*.** Re-enquadrar antes de arquivar:
   - disclosure → *é broken-auth?*
   - broken-auth de leitura → *se estende a escrita/estado?*
   - endpoint sem auth que devolve vazio → *devolve vazio porque não tem dado, ou porque falta o principal? há um endpoint irmão que devolve algo?*
   - há **oráculo** (erro que diferencia existe/não-existe, autorizado/não)?
3. **Teste óbvio destrutivo ou bloqueado → existe quase sempre um probe não-destrutivo pra mesma pergunta.**
   - `GET` sem params: `401` vs `500-validação` já te diz se há bypass de auth — sem executar ação.
   - `id` = **UUID/valor marcador que não casa nada real** → chega no handler sem alterar dado.
   - `OPTIONS`/`HEAD` pra mapear verbos roteados.
   - A pergunta quase nunca é "a ação acontece?" — é "**o controle de auth foi pulado?**". Essa dá pra responder sem a ação.
4. **"Já cacei isso a fundo" → rode `descobrir a roda`.** Reconstruir o modelo do sistema revela o não-testado que a caçada linear não viu. Ressuscitou o NBA.
5. **Registrar cada desistência como hipótese explícita** `[NÃO TESTADO: X — por quê]`, nunca como veredito. Só vira veredito depois de exaurir.

## Contra-regra (pra não virar teimosia cega)
- Persistir **na mecânica**, não no **enquadramento** nem na **esperança**. Se 3 re-enquadramentos + a matriz completa + `descobrir a roda` deram em nada demonstrável → aí sim é `FALSO POSITIVO`/`PADRÃO`, e isso é **vitória** (FP testado é vitória).
- Persistir **dentro do escopo e dos guardrails**. O ponto C atravessou a barreira do *método* (achou probe seguro), não a do *escopo* (nunca mandamos o request destrutivo).
