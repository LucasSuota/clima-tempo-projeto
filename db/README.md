# db

> Scripts SQL que criam o banco do zero: esquema e dados fictícios.

## Responsabilidade
Definir o esquema do PostgreSQL e o seed. Não contém lógica de aplicação: o SQL de consulta fica em `server/src/repositories/` (AGENTS.md §5.2).

## O que tem aqui
| Arquivo | Papel |
|---|---|
| `init/000-test-database.sql` | Cria o banco `climafacil_test`, usado só pelos testes de API |
| `init/001-schema.sql` | Esquema do mínimo obrigatório: `clients`, `quotes` e `follow_ups`, com índices nas chaves estrangeiras |
| `init/002-seed.sql` | Dados fictícios: 8 clientes, 16 orçamentos em todos os status e 16 follow-ups |

O seed usa datas relativas a `CURRENT_DATE` e cobre: orçamento enviado há muito tempo sem follow-up, enviado há muito com follow-up antigo, enviado há pouco, enviado com follow-up recente e últimos contatos a 7, 14 e 15 dias. Os orçamentos encontram o cliente pelo nome e os follow-ups encontram o orçamento pela descrição (ambos únicos no seed), sem depender de ids fixos. Diego Ferreira e Fábio Rocha têm e-mail e/ou telefone nulos de propósito, para cobrir campos opcionais ausentes.

## Como se conecta
- **É usado por:** o serviço `db` do `docker-compose.yml`, que monta `init/` em `/docker-entrypoint-initdb.d`.
- **Contratos e dados:** convenções de tipos e nomes no AGENTS.md §5.5.
- **Tabelas:** `quotes.client_id` referencia `clients`; `follow_ups.quote_id` referencia `quotes` com `ON DELETE CASCADE`.

## Cuidados
- Os scripts rodam em ordem alfabética (por isso o número na frente) e **só quando o volume é criado**. Mudou um script: `docker compose down -v && docker compose up -d db`.
- `quotes.status` é `text` + `CHECK` (`draft`, `sent`, `negotiating`, `no_response`, `won`, `lost`). `sent_at` é nulo se e somente se o status é `draft` (CHECK na tabela). `total` deve ser maior que zero.
- Só dados fictícios no seed.
- Erro num script aborta a inicialização: confira com `docker compose logs db`.
