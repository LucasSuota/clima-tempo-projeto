---
name: issue-creator
description: Cria issues bem estruturadas no GitHub para o ClimaFácil (controle de orçamentos; Node/Express/TS + PostgreSQL + React). Use para registrar bugs, funcionalidades, refatorações, testes e mudanças de contrato, sempre dentro do escopo definido no AGENTS.md. As issues são escritas em português.
---

# issue-creator

Você cria issues para o **ClimaFácil**, um sistema de controle e acompanhamento de orçamentos: API em Node/Express/TypeScript com SQL puro sobre PostgreSQL, e front em React consumindo essa API.

## Contexto técnico mínimo

- **Repositório**: o do `origin` deste checkout (`gh` usa o remoto atual).
- **Stack**: PostgreSQL 16 · Node + Express + TypeScript · `pg` sem ORM · `zod` · Vitest + supertest · Vite + React + Tailwind · Docker Compose.
- **Pastas**: `db/init/` (esquema e seed), `server/src/` (`domain/`, `repositories/`, `services/`, `routes/`), `web/src/` (`api/`, `components/`, `pages/`, `hooks/`).
- **Idioma** (AGENTS.md §6): título e corpo da issue em **português**. Nomes de código citados na issue (arquivos, funções, rotas, campos, tabelas) e as labels continuam em inglês, como estão no código.
- **Contexto canônico**: ler [AGENTS.md](../AGENTS.md) antes de redigir qualquer issue. É a única fonte de verdade de escopo e arquitetura.

## Como criar uma issue

1. Colete informações sobre o problema ou melhoria e identifique a área afetada (veja as labels `area/*`).
2. Classifique o tipo: **bug**, **feature**, **refactor**, **test**, **docs**, **chore**, **security**, **contract**.
3. **Confira o escopo** no AGENTS.md: §2 (será feito) e §3 (não será feito). Se a funcionalidade ainda não está no §2, avise que falta o levantamento de requisitos. Se o pedido cai em §3, avise o autor e sugira registrar como "próximo passo" no README ou rediscutir o escopo.
4. Cheque a ordem de construção (§1). Se a issue depende de outra ainda aberta, cite-a em "Depende de".
5. Se precisar entender o código, explore `server/`, `web/` e `db/` e cite trechos concretos com `caminho:linha`.
6. Monte a issue com o template apropriado.
7. **Confirme o conteúdo com o autor** antes de criar.
8. Crie via `gh issue create --title "..." --body "..." --label "..."`.

## Templates

### Bug

```
**Descrição**
[O problema em uma ou duas frases]

**Onde acontece**
[Tela, endpoint ou função. Ex.: `POST /api/quotes`, `server/src/domain/<arquivo>.ts`, página de listagem]

**Passos para reproduzir**
1. ...
2. ...

Inclua o corpo da requisição ou os dados mínimos (sempre fictícios).

**Comportamento esperado**
[Resultado, mensagem ou status HTTP esperado]

**Comportamento atual**
[O que acontece: resposta da API, erro no console, valor errado na tela]

**Contexto**
- Camada: [banco / domínio / serviço / repositório / rota / web]
- Reproduzível com teste? [sim: sugerir o caso que falha / não; só se o teste for estritamente necessário]
```

### Funcionalidade / melhoria

```
**Problema**
[Que necessidade do dia a dia isto resolve]

**Escopo (AGENTS.md)**
[Seção do §2 que a cobre]

**Solução proposta**
[Comportamento esperado, regras, exemplos de entrada e saída]

**Camadas prováveis**
- [ ] Banco (`db/init/`)
- [ ] Domínio (`server/src/domain/`)
- [ ] Repositório / serviço / rota
- [ ] Web (`web/src/`)

**Impacto no contrato da API**
- [ ] Nenhum
- [ ] Compatível (campo opcional, endpoint novo)
- [ ] ⚠️ Incompatível: descrever o impacto no `web/` (o ajuste entra no mesmo PR)

**Depende de**
[#n ou "nada"]

**Critérios de aceite**
- [ ] ...
- [ ] ...

**Testes esperados** (só os estritamente necessários; omita se não houver regra crítica de `domain/`)
- [ ] Caso feliz
- [ ] Caso de erro (entrada inválida → 422, inexistente → 404)
- [ ] Caso de borda (limite de dias, valor zero, campo vazio...)
```

### Refatoração / técnico

```
**Motivação**
[Débito técnico, clareza, aderência ao AGENTS.md]

**Escopo**
[Arquivos e funções afetados]

**Abordagem**
[Como será feito sem mudar comportamento]

**Impacto em testes**
- Testes que garantem o comportamento atual: [...]
- Testes a criar/atualizar: [...]

**Contrato**
- [ ] Sem mudança na API
```

### Segurança

```
**Risco**
[Ex.: SQL interpolado, entrada sem validação, erro 500 vazando stack, CORS aberto]

**Prova de conceito**
[Entrada mínima que demonstra o problema, com dados fictícios]

**Correção proposta**
[...]

**Critérios de aceite**
- [ ] Teste de regressão cobrindo a entrada maliciosa (se necessário)
- [ ] SQL parametrizado; entrada validada com zod
```

### Contrato (API)

```
**Mudança**
[Endpoint ou campo novo/alterado]

**Compatibilidade**
[Compatível ou incompatível; se incompatível, o que quebra no `web/`]

**Detalhes**
- Request: [método, rota, corpo]
- Response: [corpo e status]
- Erros: [status e formato `{"detail": ..., "errors": [{"field": ..., "message": ...}]}`]

**Critérios de aceite**
- [ ] Teste de API (supertest) apenas se estritamente necessário
- [ ] `web/src/api/types.ts` atualizado no mesmo PR
```

### Teste

```
**Objetivo da cobertura** (apenas o estritamente necessário)
[Qual comportamento precisa ser coberto e por quê]

**Cenários**
- [ ] Caso feliz: ...
- [ ] Erro esperado: ...
- [ ] Borda: ...

**Arquivos**
- Novos: [`server/test/<arquivo>.test.ts`]
- Atualizados: [...]
```

## Regras

- **Títulos** em português, curtos e descritivos. Ex.: `Calcular dias sem contato de um orçamento`.
- **Corpo** em português.
- **Labels**: no mínimo uma `type/*`, uma `area/*` e uma `priority/*`.

| Grupo | Valores | Como escolher |
| --- | --- | --- |
| `type/*` **(1)** | `bug`, `feature`, `refactor`, `test`, `docs`, `chore`, `security`, `contract` | O que a issue é. Use `contract` quando mexer no formato da API |
| `area/*` **(1+)** | `domain`, `api`, `db`, `web`, `infra`, `docs`, `agents` | Onde mexe. Pode ter mais de uma |
| `priority/*` **(1)** | `p0` (mínimo obrigatório), `p1` (parte livre escolhida), `p2` (só se sobrar tempo) | Segue a linha de corte do AGENTS.md §11 |

  Se uma label não existir no repositório, crie antes: `gh label create "type/bug"`.

- **Sempre** confirme o conteúdo com o autor antes de criar.
- **Não invente** arquivos, funções ou endpoints que não existem. Verifique no código.
- Nunca inclua dados reais, segredos ou conteúdo de `.env` em issues.
- Uma issue = uma entrega revisável. Se a descrição pede banco + API + tela de uma vez e fica grande, quebre em issues encadeadas ("Depende de").
- Sem menção a IA, modelo ou co-autoria automática no título, corpo ou labels.
