# Alvo: intigriti-11359.zendesk.com

> 🚫 **FORA DE ESCOPO / NÃO TESTAR (confirmado 2026-09-03).** O programa correto pra `*.zendesk.com` é a **Zendesk Managed Bug Bounty Engagement (Bugcrowd)** — e ela exige testar **só na tua própria instância trial** (`bb-<bugcrowd-username>.zendesk.com`, e-mail `@bugcrowdninja.com`). `intigriti-11359.zendesk.com` é a conta da **Intigriti**, não tua → testá-la é proibido ("no accessing data in any other Account"). Este arquivo fica só como **referência OSINT do Help Center Zendesk**. Ver `portfolio.md` › Zendesk.

---


- **Programa / plataforma:** intigriti · Intigriti — **CONFIRMAR** se este Zendesk está no escopo
- **Link do programa:** https://app.intigriti.com/programs/intigriti/intigriti
- **Escopo autorizado:** (a confirmar — `*.zendesk.com` é SaaS de terceiro; ver política do programa)
- **Fora de escopo:** (a confirmar — Zendesk tem programa próprio)
- **Data de abertura:** 2026-08-31
- **Reward table:** (a confirmar no programa)

## O que sabemos
- **Stack/tecnologias:** Zendesk Help Center (Guide) + Comunidade (Gather); tema Copenhagen padrão; infra Zendesk/Cloudflare.
- **App principal:** https://intigriti-11359.zendesk.com/hc/pt-br
- **Autenticação:** login "Entrar" + **registro aberto** (`/registration` existe). Login: https://intigriti-11359.zendesk.com/hc/signin
- **Papéis:** visitante anônimo; end-user registrado; (agente/admin no backend Zendesk).
- **Superfície interessante:**
  - HC API pública p/ leitura: `/api/v2/help_center/pt-br/articles.json` (JSON sem auth).
  - `robots.txt` expõe `/requests`, `/tickets`, `/access/sso_bypass`, `/auth/`, `/api/v2/help_center/*`.
  - Envio de solicitação (ticketing) e comunidade com posts/comentários.

## Hipóteses (rodar contra o The Mind)
- **Acesso quebrado/IDOR:** `/requests` e `/tickets` — acessar solicitações de outro usuário por ID; artigos restritos por *user segment* — ler artigo interno sem estar no segmento; investigar `/access/sso_bypass`.
- **Lógica de negócio:** classe "hackear helpdesk" (Inti De Ceukelaire) — helpdesks confiam no **domínio do e-mail**; com registro aberto, testar auto-cadastro/verificação p/ virar usuário "interno" e liberar conteúdo restrito. Ref: https://medium.com/intigriti/how-i-hacked-hundreds-of-companies-through-their-helpdesk-b7680ddc2d4c
- **Outros:** GraphQL não observado; verificar se o form de solicitação aceita anexos (upload).

## Recon
- **Subdomínios:** n/a (tenant Zendesk único; enum de subdomínio não se aplica).
- **Hosts vivos:** intigriti-11359.zendesk.com
- **OSINT:** GitHub code search `intigriti-11359` = 0 resultados (sem vazamentos indexados); crt.sh/Wayback bloqueados no ambiente de coleta; `security.txt` ausente (404).
- **Sinal:** instância parece recém-criada (~3 dias, tema padrão) = possível sandbox.

## Achados
| Data | Severidade | Tipo | Endpoint | Status |
|------|-----------|------|----------|--------|
|      |           |      |          |        |

## Notas
- ⚠️ **Confirmar escopo ANTES de qualquer teste ativo.** `*.zendesk.com` costuma ser fora de escopo (SaaS de terceiro).
- Coletado via **Protocolo Casa-Nova** em 2026-08-31 (recon passivo + OSINT).
