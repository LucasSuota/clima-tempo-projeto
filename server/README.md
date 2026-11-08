# server

> API do ClimaFácil (Express 5 + TypeScript `strict`, SQL puro com `pg`, `zod`). Hoje tem o esqueleto (`GET /api/health`) e as regras de domínio puras; repositórios, serviços e rotas de recurso ainda não existem.

## Responsabilidade

Sobe o servidor HTTP, valida o ambiente, monta o Express e traduz erros para o formato único da API (AGENTS.md §5.3).
As regras de negócio vivem em `src/domain/` (funções puras, sem I/O; veja [src/domain/README.md](src/domain/README.md)). Ainda **não** há SQL de domínio nem recursos: `repositories/` e `services/` não existem e entram nas próximas issues (AGENTS.md §1, etapa 2).

## O que tem aqui

| Arquivo                                                                  | Papel                                                                                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                                           | Carrega a config, cria o Pool e o app, chama `listen` e encerra com `SIGINT`/`SIGTERM`.                                                                             |
| `src/app.ts`                                                             | `createApp({ pool })`: `express.json()`, `apiRouter` em `/api`, 404 e handler de erros. Não chama `listen`.                                                         |
| `src/config.ts`                                                          | `loadConfig(env)`: valida as variáveis com zod e devolve `Config` (inclui `staleDays`); lança erro se `DATABASE_URL` faltar ou `PORT`/`STALE_DAYS` forem inválidas. |
| `src/db.ts`                                                              | `createPool(connectionString)`: cria o `Pool` do `pg`.                                                                                                              |
| `src/errors.ts`                                                          | `DomainError`, `ValidationError`, `InvalidStatusTransitionError` e `FollowUpNotAllowedError` (todos 422; a tradução para HTTP fica em `middlewares/`).              |
| `src/domain/`                                                            | Regras puras: datas, status, orçamento, follow-up, parado e indicadores. Detalhes em `src/domain/README.md`.                                                        |
| `src/middlewares/error-handler.ts`                                       | `notFoundHandler` (404) e `errorHandler` (422 para zod e JSON malformado, 500 genérico).                                                                            |
| `src/routes/index.ts`                                                    | `apiRouter(pool)`: monta os routers de recurso; `app.ts` o usa em `/api`.                                                                                           |
| `src/routes/health.ts`                                                   | `healthRouter(pool)`: `GET /api/health` roda `SELECT 1` e responde `{ "ok": true }`.                                                                                |
| `test/config.test.ts`                                                    | Valida `loadConfig` (sem banco).                                                                                                                                    |
| `test/middlewares/error-handler.test.ts`                                 | `errorHandler` e `notFoundHandler` (sem banco).                                                                                                                     |
| `test/domain/`                                                           | Testes unitários do domínio (sem banco), espelhando `src/domain/`.                                                                                                  |
| `test/routes/health.test.ts`                                             | API com supertest e banco de teste.                                                                                                                                 |
| `vitest.config.ts`                                                       | Carrega `../.env` e desliga o paralelismo entre arquivos (um banco de teste só).                                                                                    |
| `package.json`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json` | Scripts e ferramentas; `tsconfig.build.json` gera `dist/`.                                                                                                          |

## Estrutura-alvo

> Organização do código (AGENTS.md §5.2). O código existente já segue esta organização; a tabela "O que tem aqui" lista o que existe hoje.

```
src/
├── index.ts, app.ts, config.ts, db.ts, errors.ts
├── middlewares/    # error-handler.ts, validate-body.ts
├── domain/         # puro; uma pasta por recurso (quotes, follow-ups, indicators, owners, clients) e shared/ (calendar-date.ts)
├── repositories/   # único lugar com SQL; <recurso>-repository.ts
├── services/       # casos de uso; <recurso>-service.ts
└── routes/         # index.ts (monta /api), health.ts, <recurso>.ts com os schemas zod
test/               # espelha src/: domain/, routes/, middlewares/, config.test.ts, helpers/ (criada quando houver testes de API com dados)
```

Regras:

1. Na raiz de `src/` só `index`, `app`, `config`, `db`, `errors` e as pastas; nada de `utils.ts`, `helpers.ts` ou `types.ts` soltos.
2. Tipos do domínio em `domain/<recurso>/`; tipos do contrato HTTP inferidos dos schemas zod nas `routes/`.
3. Schemas zod no arquivo do router; acima de ~80 linhas, extrair para `<recurso>-schemas.ts` na mesma pasta.
4. Recurso novo = um arquivo (no `domain/`, uma pasta) em cada camada, com o mesmo nome-base.
5. Só `routes/`, `middlewares/` e `app.ts` importam `express`; só `db.ts` e `repositories/` usam `pg` em execução (`import type { Pool }` é permitido onde o `Pool` chega por parâmetro); `domain/` não importa nada de fora de `domain/`, exceto os erros de `errors.ts`.

## Como se conecta

- **Depende de:** `express`, `pg`, `zod`; `routes/health.ts` recebe o `Pool` por parâmetro; `app.ts` importa `middlewares/error-handler.ts` e `routes/index.ts`; `middlewares/error-handler.ts` importa `errors.ts`; `domain/` importa só a si mesmo e `errors.ts` (nenhum import de `express`, `pg` ou `config.ts`).
- **É usado por:** nada ainda no repositório (o `web/` consumirá `/api` na etapa 4).
- **Contratos e dados:** `GET /api/health`; erro sempre `{ "detail", "errors": [{ "field", "message" }] }`.
- **Variáveis de ambiente** (lidas de `../.env`): `DATABASE_URL` (obrigatória), `DATABASE_URL_TEST` (só testes de API), `PORT` (padrão `3333`), `CORS_ORIGIN` (lida, ainda sem uso), `STALE_DAYS` (padrão `7`, mínimo `1`; vira `Config.staleDays`, ainda não consumida por serviço).

## Decisões que moldam este código

- `app.ts` separado de `index.ts` para o supertest usar o app sem `listen` (AGENTS.md §5.2).
- `loadConfig` e `createApp` recebem env e `Pool` por parâmetro, sem singleton (AGENTS.md §5.2).
- Erro 500 não vaza stack nem mensagem interna; só o log do server vê o erro (AGENTS.md §12).
- Datas de calendário são strings `'YYYY-MM-DD'` (`CalendarDate`), como na API e nas colunas `date`; o domínio não usa `Date` para regra (AGENTS.md §5.5).
- "Hoje" e `staleDays` entram por parâmetro no domínio; nada lê relógio nem env (AGENTS.md §5.2, §8).
- `no_response` é derivado na leitura: só um `sent` parado vira `no_response` (`effectiveStatus`); não é gravado por job.
- O domínio não faz aritmética de dinheiro: `total` é string decimal vinda do `NUMERIC`; somas ficam no SQL (AGENTS.md §5.5).
- Exige Node `^22.13 || ^24 || >=26` (`engines` no `package.json`), por causa do Vitest 5 e do ESLint 10.

## Como testar

Banco no ar (`docker compose up -d db`) e `.env` criado (`cp .env.example .env`).

- `npm --prefix server run test`: Vitest. `routes/health.test.ts` usa `DATABASE_URL_TEST` e falha de propósito se ela não existir; nunca usa o banco de dev (AGENTS.md §8).
- `npm --prefix server run check`: `typecheck` + `lint` + `format:check` + `test`.
- Outros scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `format`, `format:check`. Primeira vez: `npm --prefix server install`.

## Cuidados

- `errorHandler` precisa manter os 4 parâmetros (`_next`), senão o Express não o reconhece como handler de erro.
- `console` só aparece em `index.ts` e `middlewares/error-handler.ts`, com `eslint-disable` pontual; não espalhar.
- Regra de negócio e SQL não entram em `routes/` (AGENTS.md §5.2).
- `dist/`, `node_modules/` e `package-lock.json` ficam fora do Prettier (`.prettierignore`).
