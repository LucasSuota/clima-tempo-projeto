# ClimaFácil · Controle de orçamentos

Sistema para acompanhar os orçamentos enviados pela ClimaFácil, empresa de instalação e manutenção de ar-condicionado. A ideia é que nenhum orçamento fique sem retorno: todos num só lugar, com o status de cada um, o responsável e o histórico de contatos com o cliente.

O que o sistema faz:

- cadastra responsáveis, clientes e orçamentos (clientes e orçamentos também podem ser editados e excluídos) e muda o status de cada orçamento seguindo as transições permitidas;
- pagina as listas de orçamentos, clientes e responsáveis (`limit` e `offset` opcionais na API);
- registra follow-ups (contatos com o cliente) e mostra o histórico;
- marca como **parado** o orçamento sem contato há `STALE_DAYS` dias (padrão 7) ou mais, e o status `no_response` aparece sozinho para um `sent` parado;
- no painel inicial, mostra os indicadores (total em aberto, valor parado, taxa de conversão) e a fila "quem contatar hoje", do orçamento mais antigo sem contato para o mais recente.

Sumário: [Stack](#stack) · [Como rodar](#como-rodar) · [Estrutura](#estrutura-do-repositório) · [Estado do projeto](#estado-do-projeto) · [Decisões tomadas](#decisões-tomadas) · [O que ficou de fora](#o-que-ficou-de-fora) · [Como usei IA](#como-usei-ia) · [Próximos passos](#próximos-passos)

## Stack

| Camada | Tecnologia |
|---|---|
| Banco | PostgreSQL 16 (Docker) |
| Server | Node + Express 5 + TypeScript, `pg` com SQL puro (sem ORM) |
| Validação | `zod` |
| Testes | Vitest + supertest |
| Web | Vite + React + TypeScript + Tailwind CSS v4 |
| Infra | Docker Compose (banco, server e web com nginx) |

## Como rodar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) com Docker Compose v2 (`docker compose version`)
- [Node.js](https://nodejs.org/) 22.13 ou mais novo, com npm. Só é necessário para desenvolver o server e a web fora do Docker (a imagem usa Node 24).

### Opção A: tudo com Docker (o caminho mais curto)

Não precisa instalar Node. O Compose sobe o banco, a API e o front.

```bash
git clone <url-do-repositorio>
cd clima-facil-projeto
cp .env.example .env
docker compose up --build        # -d para segundo plano
```

Quando os três serviços estiverem de pé, abra **http://localhost:8080**. Para conferir pela linha de comando:

```bash
docker compose ps                         # db, server e web "healthy"
curl http://localhost:8080/api/health     # {"ok":true}
```

- O banco nasce com dados fictícios (o seed de [db/init/](db/init/)).
- O front (nginx) serve as telas e encaminha `/api` para a API. A API não é publicada no host: só o front (`WEB_PORT`) e o banco (`DB_PORT`).
- A porta do front muda com `WEB_PORT` no `.env`; o Compose ajusta o `CORS_ORIGIN` da API sozinho.
- `docker compose logs -f server` mostra os logs de um serviço. `docker compose down` para tudo mantendo os dados.

### Opção B: desenvolvimento local (banco no Docker, server e web com Node)

```bash
cp .env.example .env
docker compose up -d db          # aguarde "healthy" em `docker compose ps`

npm --prefix server install
npm --prefix server run dev      # API em http://localhost:3333

npm --prefix web install         # em outro terminal
npm --prefix web run dev         # front em http://localhost:5173
```

- O `.env` da raiz é lido pelo server (`--env-file=../.env`) e pelo Vite. Os valores do `.env.example` já funcionam em desenvolvimento.
- O Vite encaminha `/api` para o server (porta `PORT` do `.env`), então suba o server antes de abrir o front. Não há CORS em dev.
- O Vite exige a porta 5173 (`strictPort`): é a origem que o `CORS_ORIGIN` do server espera. Se ela estiver ocupada, o `npm run dev` falha em vez de usar outra.
- Se a porta 5432 estiver ocupada por outro Postgres, troque `DB_PORT` no `.env` e a porta nas variáveis `DATABASE_URL` e `DATABASE_URL_TEST`.
- Teste rápido: `curl http://localhost:3333/api/health`.

Variáveis do `.env` (todas com valor de desenvolvimento, nada sensível):

| Variável | Para quê |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciais e nome do banco criado pelo container |
| `DB_PORT` | Porta do banco no host (padrão 5432) |
| `WEB_PORT` | Porta do front no `docker compose up` (padrão 8080) |
| `DATABASE_URL` | Conexão do server em dev local (no Compose ela é substituída pelo host `db`) |
| `DATABASE_URL_TEST` | Banco `climafacil_test`, usado só pelos testes de API |
| `PORT` | Porta da API em dev local (padrão 3333) |
| `CORS_ORIGIN` | Única origem que o navegador pode usar para chamar a API em dev (`http://localhost:5173`) |
| `STALE_DAYS` | Dias sem contato para um orçamento ser considerado parado (padrão 7) |

### Validar o código

```bash
npm --prefix server run check    # typecheck + lint + format + testes
npm --prefix web run check       # typecheck + lint + format + testes
```

Os testes de API usam o banco `climafacil_test`, então o banco precisa estar no ar (`docker compose up -d db`) e o `.env` criado. Cada pacote também expõe `dev`, `build`, `typecheck`, `lint`, `format` e `test`. Detalhes em [server/README.md](server/README.md) e [web/README.md](web/README.md).

### Banco de dados

Para abrir um terminal SQL:

```bash
docker compose exec db psql -U climafacil -d climafacil
```

Os scripts de `db/init/` só rodam quando o volume é criado. Depois de mudar o esquema, ou para voltar aos dados iniciais, recrie o banco:

```bash
docker compose down -v
docker compose up -d db          # ou `docker compose up --build`, para subir tudo
```

> Isso apaga todos os dados locais. Como o projeto usa só dados fictícios, o seed recria tudo.

## Estrutura do repositório

```
.
├── AGENTS.md            # regras do projeto: escopo, arquitetura, convenções
├── DECISIONS.md         # registro datado das decisões de modelagem do banco
├── docker-compose.yml   # banco, server e web
├── .env.example         # variáveis de ambiente de desenvolvimento
├── agents/              # agentes do fluxo de desenvolvimento
├── db/                  # esquema e seed em SQL
├── server/              # API (Express + TS)
└── web/                 # front (React + Tailwind)
```

Resumos por pasta: [db/](db/README.md) · [server/](server/README.md) · [server/src/domain/](server/src/domain/README.md) · [web/](web/README.md) · [agents/](agents/README.md).

## Estado do projeto

| Etapa | Entrega | Estado |
|---|---|---|
| 0 | Setup: regras, agentes, Docker Compose do banco | ✅ |
| 1 | Esquema do banco e dados fictícios | ✅ |
| 2 | API com testes | ✅ |
| 3 | Levantamento de requisitos da parte livre | ✅ |
| 4 | Interface web | ✅ |
| 5 | Tudo no Docker Compose | ✅ |
| 6 | Documentação final | ✅ |

Todas as etapas estão concluídas e integradas na `main`. O mesmo quadro está no [AGENTS.md §1](AGENTS.md).

## Como o desenvolvimento é organizado

O trabalho segue um fluxo por issues, com papéis definidos em [agents/](agents/README.md): triagem → issue → plano → implementação → revisão → documentação → PR. As regras que todo mundo segue (camadas do server, contrato da API, convenções do banco, nomes, testes e segurança) estão no [AGENTS.md](AGENTS.md). O uso de IA nesse fluxo está em [Como usei IA](#como-usei-ia).

## Decisões tomadas

As decisões de escopo e de regra de negócio estão no [AGENTS.md](AGENTS.md) (§2 e §7); as de modelagem do banco, com contexto e data, no [DECISIONS.md](DECISIONS.md). Aqui fica o resumo das que mais moldam o código.

### Arquitetura

| Decisão | Por quê |
|---|---|
| Server por recurso e em camadas: `routes → services → domain` e `repositories → db` (AGENTS.md §5.2) | Cada arquivo tem um papel e uma direção de dependência; achar onde mexer é rápido. Só `repositories/` tem SQL e só `routes/` traduz HTTP. |
| SQL puro com `pg`, sem ORM | Cada consulta fica visível e explicável; o modelo de dados é pequeno e não justifica a camada extra. |
| `zod` na borda da API | Toda entrada do cliente é não confiável. Os schemas ficam no router que os usa, e o erro 422 sai num formato único (`detail` + `errors`), com mensagens em português. |
| Domínio puro (`server/src/domain/`) com a data de "hoje" injetada | Dá para testar sem banco e com data fixa, o que importa para regras baseadas em dias. Datas de calendário são strings `'YYYY-MM-DD'`; o fuso de referência é `America/Sao_Paulo`. |
| `no_response` derivado na leitura, sem job agendado | O status gravado continua `sent`; o domínio calcula o **status efetivo** (um `sent` parado aparece como `no_response`) a cada leitura. Nada para agendar, e o resultado nunca fica defasado. |
| Parado e indicadores calculados no server | O front só exibe o que a API manda (`isStale`, `daysWithoutContact`, status efetivo, indicadores). A regra existe num só lugar. |
| Transição de status parte do status efetivo | Um `sent` parado só vai para `negotiating`, `won` ou `lost`, igual ao que o usuário vê na tela. |
| Listagens devolvem `{ items, total }` desde o início | A paginação (`limit` e `offset`, opcionais) entrou sem mudança incompatível de contrato. |
| CORS próprio, sem o pacote `cors` | São poucas linhas, restritas a `CORS_ORIGIN` com comparação exata (nunca `*`), e não adiciona dependência (AGENTS.md §3.2). |

### Dados

| Decisão | Por quê |
|---|---|
| Dinheiro em `NUMERIC(12,2)` no banco e `number` no JSON | Decimal exato no banco, somas com `SUM` no SQL; o repositório converte a string do `pg` em `number` (até 2 casas) e o front formata com `Intl`. Nunca `float` no banco. |
| Responsáveis (`owners`) como cadastro simples | Quem acompanha um orçamento precisa existir para a fila fazer sentido, mas login e permissões estão fora do escopo (ver abaixo). `role` é texto livre, e `quotes.owner_id` é obrigatório. |
| Normalização de e-mail e telefone na API | `clients.email` e `clients.phone` são `UNIQUE` e o Postgres compara o texto exato. Gravar e-mail em minúsculas e telefone só com dígitos faz a duplicidade valer de verdade. A duplicidade vem da constraint, sem checagem prévia, para não haver corrida. |
| Scripts em `db/init/` em vez de migrações | Mais simples para um projeto só com dados fictícios. Custo: mudar o esquema exige recriar o volume. |
| Status como `text` + `CHECK`, sem `ENUM` | Mais fácil de alterar no Postgres. |
| Banco de teste separado (`climafacil_test`) | Os testes de API rodam contra um Postgres de verdade sem tocar nos dados de dev. |

### Web e infraestrutura

| Decisão | Por quê |
|---|---|
| Tailwind v4 e componentes próprios | Sem biblioteca de componentes pesada (AGENTS.md §3.2); layout mobile-first, sem largura fixa. |
| Navegação por hash (`#/orcamentos/3`), sem biblioteca de router | São poucas telas; `parseRoute` é uma função pura testada e evita dependência. |
| `useState` + hooks próprios (`useAsync`, `useSubmit`) | Nenhuma biblioteca de estado global foi necessária. |
| nginx serve o front e faz proxy de `/api` | O navegador fala com uma única origem (como o proxy do Vite em dev), sem CORS no caminho. A API não é publicada no host. |

### Processo

| Decisão | Por quê |
|---|---|
| Sem TDD: só os testes estritamente necessários (AGENTS.md §8) | O esforço de teste vai para as regras críticas de `domain/` (feliz, erro e limites de data) e para o mínimo de API (um caminho feliz e um erro por rota relevante). Front: só lógica não trivial (formatação, rotas, formulários, cliente HTTP). |
| Ordem de construção: banco → domínio → API → telas → Docker | Uma camada de cima só começa quando a de baixo está pronta (AGENTS.md §1). |

## O que ficou de fora

### Fora do escopo desde o início (AGENTS.md §3.1)

- **Autenticação e múltiplos usuários:** uso interno; o responsável é só um cadastro, e login pediria perfis e sessão.
- **Envio real de e-mail/WhatsApp:** depende de provedores e credenciais; o sistema só registra o contato.
- **Anexos e PDF de orçamento:** exigem armazenamento e geração de documento.
- **Relatórios exportáveis:** os indicadores cobrem a visão necessária.
- **Multi-moeda:** o sistema opera em reais (`NUMERIC(12,2)`, BRL).
- **Notificações automáticas:** exigem agendador e canal; a fila "quem contatar hoje" cumpre o papel.

Também ficaram de fora, por tecnologia (AGENTS.md §3.2): ORM, biblioteca de estado global e biblioteca de componentes pesada.

## Como usei IA

O desenvolvimento usou assistentes de IA, organizados como agentes definidos em [agents/](agents/README.md), cada um com um papel e com o [AGENTS.md](AGENTS.md) como contexto comum:

- um **orquestrador** é o ponto de entrada de toda tarefa: faz a triagem, confere o escopo e chama os demais na ordem;
- **issue-creator**, **issue-planner**, **issue-coder** e **issue-reviewer** transformam um pedido em issue, plano, código e revisão;
- **doc-writer** mantém os resumos de pasta e **git-manager** cuida de branches, commits e PRs.

Quem decide é o autor. As decisões de escopo (o que entra, o que fica de fora, o que é p0, p1 ou p2) foram dele, e ele aprova issues, planos, PRs e merges nos pontos de parada definidos em [agents/orchestrator.md](agents/orchestrator.md). A regra do projeto (AGENTS.md §10) é que todo código entregue precisa ser entendido e explicável pelo autor, e que, em dúvida de escopo ou de regra, o agente pergunta em vez de adivinhar.

Dois registros para ser transparente:

- **Aprovação delegada na etapa final.** Nas últimas etapas (Docker Compose e este README), parte da aprovação dos planos foi delegada pelo autor às recomendações dos próprios agentes. As decisões de escopo e os merges continuaram com o autor.
- **Sem marcação nos commits.** Por regra do projeto (AGENTS.md §13), commits, branches e PRs não levam marca de IA. Por isso o uso fica registrado aqui, e não no histórico do git.

Onde a IA errou: o primeiro esquema do banco gerado por IA exigia contato do cliente e usava nomes de campo inconsistentes (`description` numa tabela e `note` na outra); a correção está registrada no [DECISIONS.md](DECISIONS.md). O histórico também traz commits `fix` que corrigiram falhas encontradas depois da primeira versão do código, por exemplo o campo de valor que aceitava separador de milhar ambíguo e o cabeçalho `Vary: Origin` do CORS.

## Próximos passos

- **Transições de status mais claras:** o server passaria a devolver as transições permitidas de cada orçamento (`allowedTransitions`), para o front oferecer só as válidas em vez de listar todos os status e depender do 422. As mensagens de transição inválida também deveriam sair em português, com o nome do status exibido na tela (hoje o erro cita `sent`, `won` etc.).
- **Acessibilidade dos formulários:** levar o foco ao primeiro campo com erro e ligar as mensagens aos campos com `aria-describedby`/`aria-invalid`.
- **Imagens Docker reproduzíveis:** fixar o digest das imagens (`postgres:16`, `node:24-alpine`, `nginxinc/nginx-unprivileged`) em vez de só a tag.
- **Deploy:** hoje o Compose serve o ambiente local. Para produção faltam HTTPS, segredos fora do `.env.example`, backup do volume do banco e migrações no lugar dos scripts de `db/init/`.

### Se eu tivesse mais uma semana de desenvolvimento

- **Reforçar os testes:** ampliar a cobertura além do mínimo estritamente necessário, com mais casos de borda no domínio, mais cenários de erro nas rotas e testes dos fluxos principais do front.
- **Sistema de autenticação:** login e sessão, com perfis e permissões (RBAC), revendo o papel de "responsável" (hoje só um cadastro, por ser de uso interno).
- **Automação de mensagens:** avaliar a viabilidade de enviar lembretes e mensagens de follow-up (e-mail ou WhatsApp) a partir da fila "quem contatar hoje", o que exigiria provedor, credenciais e um agendador.
