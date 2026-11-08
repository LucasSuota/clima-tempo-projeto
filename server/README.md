# server

> API do ClimaFácil (Express 5 + TypeScript `strict`, SQL puro com `pg`, `zod`). Hoje é só o esqueleto: expõe `GET /api/health`.

## Responsabilidade

Sobe o servidor HTTP, valida o ambiente, monta o Express e traduz erros para o formato único da API (AGENTS.md §5.3).
Ainda **não** tem regra de negócio, SQL de domínio nem recursos: `domain/`, `repositories/` e `services/` não existem e entram nas próximas issues (AGENTS.md §1, etapa 2).

## O que tem aqui

| Arquivo                                                                  | Papel                                                                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/index.ts`                                                           | Carrega a config, cria o Pool e o app, chama `listen` e encerra com `SIGINT`/`SIGTERM`.                                        |
| `src/app.ts`                                                             | `createApp({ pool })`: `express.json()`, router em `/api`, 404 e handler de erros. Não chama `listen`.                         |
| `src/config.ts`                                                          | `loadConfig(env)`: valida as variáveis com zod e devolve `Config`; lança erro se `DATABASE_URL` faltar ou `PORT` for inválida. |
| `src/db.ts`                                                              | `createPool(connectionString)`: cria o `Pool` do `pg`.                                                                         |
| `src/errors.ts`                                                          | `DomainError`, `ValidationError`, `notFoundHandler` e `errorHandler` (422 para zod e JSON malformado, 500 genérico).           |
| `src/routes/health.ts`                                                   | `healthRouter(pool)`: `GET /api/health` roda `SELECT 1` e responde `{ "ok": true }`.                                           |
| `test/*.test.ts`                                                         | `config.test.ts` e `errors.test.ts` (sem banco); `health.test.ts` (API com supertest e banco de teste).                        |
| `vitest.config.ts`                                                       | Carrega `../.env` e desliga o paralelismo entre arquivos (um banco de teste só).                                               |
| `package.json`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json` | Scripts e ferramentas; `tsconfig.build.json` gera `dist/`.                                                                     |

## Estrutura-alvo

> Alvo para o código **novo** (AGENTS.md §5.2). O que existe hoje está na tabela "O que tem aqui"; nada foi movido ainda.

```
src/
├── index.ts, app.ts, config.ts, db.ts, errors.ts
├── middlewares/    # error-handler.ts, validate-body.ts
├── domain/         # puro; uma pasta por recurso (quotes, follow-ups, indicators, owners, clients)
├── repositories/   # único lugar com SQL; <recurso>-repository.ts
├── services/       # casos de uso; <recurso>-service.ts
└── routes/         # index.ts (monta /api), health.ts, <recurso>.ts com os schemas zod
test/               # espelha src/: domain/, routes/, config.test.ts, errors.test.ts, helpers/
```

Regras:

1. Na raiz de `src/` só `index`, `app`, `config`, `db`, `errors` e as pastas; nada de `utils.ts`, `helpers.ts` ou `types.ts` soltos.
2. Tipos do domínio em `domain/<recurso>/`; tipos do contrato HTTP inferidos dos schemas zod nas `routes/`.
3. Schemas zod no arquivo do router; acima de ~80 linhas, extrair para `<recurso>-schemas.ts` na mesma pasta.
4. Recurso novo = um arquivo (no `domain/`, uma pasta) em cada camada, com o mesmo nome-base.
5. Só `routes/`, `middlewares/` e `app.ts` importam `express`; só `db.ts` e `repositories/` usam `pg` em execução (`import type { Pool }` é permitido onde o `Pool` chega por parâmetro); `domain/` não importa nada de fora de `domain/`, exceto os erros de `errors.ts`.

## Movimentações pendentes

Para o autor decidir (candidata a issue `chore`):

- `errors.ts` também contém `notFoundHandler` e `errorHandler`: mover para `middlewares/error-handler.ts`, mantendo `DomainError` e `ValidationError` em `errors.ts`.
- O router de `/api` é montado em `app.ts`: mover para `routes/index.ts`.
- `test/health.test.ts` -> `test/routes/health.test.ts`, e criar `test/helpers/`.
- `test/errors.test.ts` testa `errorHandler`: ao mover o handler, esse teste vai para `test/middlewares/error-handler.test.ts`.
- Já no lugar: `config.ts`, `db.ts`, `routes/health.ts`, `test/config.test.ts`.

## Como se conecta

- **Depende de:** `express`, `pg`, `zod`; `routes/health.ts` recebe o `Pool` por parâmetro; `app.ts` importa `errors.ts` e `routes/health.ts`.
- **É usado por:** nada ainda no repositório (o `web/` consumirá `/api` na etapa 4).
- **Contratos e dados:** `GET /api/health`; erro sempre `{ "detail", "errors": [{ "field", "message" }] }`.
- **Variáveis de ambiente** (lidas de `../.env`): `DATABASE_URL` (obrigatória), `DATABASE_URL_TEST` (só testes de API), `PORT` (padrão `3333`), `CORS_ORIGIN` (lida, ainda sem uso).

## Decisões que moldam este código

- `app.ts` separado de `index.ts` para o supertest usar o app sem `listen` (AGENTS.md §5.2).
- `loadConfig` e `createApp` recebem env e `Pool` por parâmetro, sem singleton (AGENTS.md §5.2).
- Erro 500 não vaza stack nem mensagem interna; só o log do server vê o erro (AGENTS.md §12).
- Exige Node `^22.13 || ^24 || >=26` (`engines` no `package.json`), por causa do Vitest 5 e do ESLint 10.

## Como testar

Banco no ar (`docker compose up -d db`) e `.env` criado (`cp .env.example .env`).

- `npm --prefix server run test`: Vitest. `health.test.ts` usa `DATABASE_URL_TEST` e falha de propósito se ela não existir; nunca usa o banco de dev (AGENTS.md §8).
- `npm --prefix server run check`: `typecheck` + `lint` + `format:check` + `test`.
- Outros scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `format`, `format:check`. Primeira vez: `npm --prefix server install`.

## Cuidados

- `errorHandler` precisa manter os 4 parâmetros (`_next`), senão o Express não o reconhece como handler de erro.
- `console` só aparece em `index.ts` e `errors.ts`, com `eslint-disable` pontual; não espalhar.
- Regra de negócio e SQL não entram em `routes/` (AGENTS.md §5.2).
- `dist/`, `node_modules/` e `package-lock.json` ficam fora do Prettier (`.prettierignore`).
