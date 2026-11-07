# db

> Scripts SQL que criam o banco do zero: esquema e dados fictícios.

## Responsabilidade
Definir o esquema do PostgreSQL e o seed. Não contém lógica de aplicação: o SQL de consulta fica em `server/src/repositories/` (AGENTS.md §5.2).

## O que tem aqui
| Arquivo | Papel |
|---|---|
| `init/000-test-database.sql` | Cria o banco `climafacil_test`, usado só pelos testes de API |

O esquema e o seed entram na etapa 1 (AGENTS.md §1), como `init/001-schema.sql` e `init/002-seed.sql`.

## Como se conecta
- **É usado por:** o serviço `db` do `docker-compose.yml`, que monta `init/` em `/docker-entrypoint-initdb.d`.
- **Contratos e dados:** convenções de tipos e nomes no AGENTS.md §5.5.

## Cuidados
- Os scripts rodam em ordem alfabética (por isso o número na frente) e **só quando o volume é criado**. Mudou um script: `docker compose down -v && docker compose up -d db`.
- Só dados fictícios no seed.
- Erro num script aborta a inicialização: confira com `docker compose logs db`.
