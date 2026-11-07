# ClimaFácil · Controle de orçamentos

Sistema para acompanhar os orçamentos enviados pela ClimaFácil, empresa de instalação e manutenção de ar-condicionado. A ideia é que nenhum orçamento fique sem retorno: todos num só lugar, com o status de cada um, o responsável e o histórico de contatos com o cliente.

> **Estado atual:** setup do repositório. O banco já sobe com Docker e o esqueleto do server responde `GET /api/health`. O restante do server e a web estão em desenvolvimento (veja o [Roadmap](#roadmap)).

## Stack

| Camada | Tecnologia |
|---|---|
| Banco | PostgreSQL 16 (Docker) |
| Server | Node + Express + TypeScript, `pg` com SQL puro (sem ORM) |
| Validação | `zod` |
| Testes | Vitest + supertest |
| Web | Vite + React + TypeScript + Tailwind CSS |
| Infra | Docker Compose |

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) com Docker Compose v2 (`docker compose version`)
- [Node.js](https://nodejs.org/) 22.13 ou mais novo, com npm (para o server)

## Como rodar

### 1. Configurar o ambiente

```bash
git clone <url-do-repositorio>
cd clima-facil-projeto
cp .env.example .env
```

Os valores do `.env.example` já funcionam em desenvolvimento. Se a porta 5432 estiver ocupada por outro Postgres, troque `DB_PORT` no `.env` e a porta nas variáveis `DATABASE_URL*`.

### 2. Subir o banco

```bash
docker compose up -d db
docker compose ps        # aguarde o status "healthy"
```

Na primeira vez, o container roda os scripts de [db/init/](db/init/) e cria os bancos `climafacil` (dev) e `climafacil_test` (testes).

Para abrir um terminal SQL:

```bash
docker compose exec db psql -U climafacil -d climafacil
```

### 3. Server

```bash
npm --prefix server install
npm --prefix server run dev      # API em http://localhost:3333
curl http://localhost:3333/api/health
npm --prefix server run check    # typecheck + lint + format + testes
```

Os testes de API usam o banco `climafacil_test`, então o banco precisa estar no ar. Detalhes em [server/README.md](server/README.md).

### 4. Web

Em breve. Depois dela, um único `docker compose up` para tudo.

### Recriar o banco do zero

Os scripts de `db/init/` só rodam quando o volume é criado. Depois de mudar o esquema, ou para voltar aos dados iniciais:

```bash
docker compose down -v
docker compose up -d db
```

> Isso apaga todos os dados locais. Como o projeto usa só dados fictícios, o seed recria tudo.

## Estrutura do repositório

```
.
├── AGENTS.md            # regras do projeto: escopo, arquitetura, convenções
├── docker-compose.yml   # banco (server e web entram depois)
├── .env.example         # variáveis de ambiente de desenvolvimento
├── agents/              # agentes do fluxo de desenvolvimento
├── db/                  # esquema e seed em SQL
├── server/              # API (Express + TS)
└── web/                 # front (React + Tailwind)
```

Resumos por pasta: [db/](db/README.md) · [server/](server/README.md) · [web/](web/README.md) · [agents/](agents/README.md).

## Roadmap

| Etapa | Entrega | Estado |
|---|---|---|
| 0 | Setup: regras, agentes, Docker Compose do banco | ✅ |
| 1 | Esquema do banco e dados fictícios | ⏳ |
| 2 | API com testes | ⏳ |
| 3 | Levantamento de requisitos da parte livre | ⬜ |
| 4 | Interface web | ⬜ |
| 5 | Tudo no Docker Compose | ⬜ |
| 6 | Documentação final | ⬜ |

## Como o desenvolvimento é organizado

O trabalho segue um fluxo por issues, com papéis definidos em [agents/](agents/README.md): triagem → issue → plano em TDD → implementação → revisão → documentação → PR. As regras que todo mundo segue (camadas do server, contrato da API, convenções do banco, nomes, testes e segurança) estão no [AGENTS.md](AGENTS.md).

## Decisões técnicas

| Decisão | Por quê |
|---|---|
| SQL puro com `pg`, sem ORM | Cada consulta fica visível e explicável; o modelo de dados é pequeno e não justifica a camada extra. |
| Regras de negócio em funções puras (`server/src/domain/`) | Dá para testar sem banco e com a data de "hoje" fixa, o que importa para regras baseadas em dias. |
| Valores em `NUMERIC(12,2)` | Decimal exato no banco; `float` erra arredondamento com dinheiro. |
| Scripts em `db/init/` em vez de migrações | Mais simples para um projeto só com dados fictícios. Custo: mudar o esquema exige recriar o volume. |
| Banco de teste separado (`climafacil_test`) | Os testes de API rodam contra um Postgres de verdade sem tocar nos dados de dev. |

_Esta seção cresce durante o desenvolvimento._

### O que ficou de fora

_A preencher depois do levantamento de requisitos._

## Como usei IA

_A preencher ao final: onde ajudou, onde errou e como percebi._

## Com mais uma semana

_A preencher ao final._
