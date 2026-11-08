# web

> Front do ClimaFácil (Vite + React + TypeScript `strict` + Tailwind CSS v4). Tem as telas do mínimo obrigatório (responsáveis, clientes, orçamentos com lista, criação, edição, exclusão e detalhe com mudança de status e follow-ups) e o painel inicial com os indicadores e a fila "quem contatar hoje".

## Responsabilidade

Mostrar os dados da API e enviar as ações do usuário. O front **não** repete regra de negócio: o que é calculado no server (`isStale`, `daysWithoutContact`, status efetivo, indicadores) chega pronto (AGENTS.md §5.4). Textos da interface em português; identificadores em inglês.

## O que tem aqui

| Arquivo                                                                 | Papel                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                                                            | Página de entrada (`lang="pt-BR"`, viewport para celular).                                                                                                                                                                                               |
| `src/main.tsx`                                                          | Monta o React em `#root` e importa o CSS.                                                                                                                                                                                                                |
| `src/App.tsx`                                                           | Raiz: `useHashRoute` escolhe a tela dentro do `Layout`. `QuoteDetailPage` usa `key={id}` para não mostrar o orçamento anterior.                                                                                                                          |
| `src/router.ts`                                                         | `parseRoute(hash)` (puro) e `quoteHref(id)`. Rotas: `#/` e `#/fila` (painel), `#/orcamentos`, `#/orcamentos/:id`, `#/clientes`, `#/responsaveis`; o resto é "Página não encontrada".                                                                     |
| `src/forms.ts`                                                          | `splitErrors` (erro da API em mensagens por campo + mensagem geral; campo que o formulário não tem vai para a mensagem geral) e `parseMoneyInput` (`1.500,50` -> `1500.5`).                                                                              |
| `src/index.css`                                                         | `@import 'tailwindcss'`, estilo base do `body` e a classe `.field-input`.                                                                                                                                                                                |
| `src/components/Layout.tsx`                                             | Cabeçalho com menu (`aria-current`) e `<main>` centralizado, sem largura fixa.                                                                                                                                                                           |
| `src/components/DataTable.tsx`                                          | Uma definição de colunas vira `<table>` a partir de `md:` e lista de cards no celular.                                                                                                                                                                   |
| `src/components/AsyncView.tsx`, `Spinner`, `ErrorMessage`, `EmptyState` | Estados de carregando, erro (com "Tentar de novo") e vazio.                                                                                                                                                                                              |
| `src/components/IndicatorCards.tsx`                                     | Três cards do painel: total em aberto, valor parado e taxa de conversão (`null` aparece como "Sem dados", com texto de apoio). Só formata o que a API mandou.                                                                                            |
| `src/components/FormField`, `Button`, `StatusBadge`, `StaleBadge`       | Peças de formulário (`Button` tem a variante `danger`) e badges (o "Parado há N dias" só exibe o que a API mandou).                                                                                                                                      |
| `src/components/*Form.tsx`, `FollowUpHistory.tsx`                       | Formulários de responsável, cliente (cria e edita, conforme receba `client`), orçamento (cria e edita, conforme receba `quote`), mudança de status e follow-up, e o histórico de contatos. `ClientActions.tsx` e `QuoteActions.tsx`: botões Editar e Excluir (cliente e orçamento), com confirmação inline.             |
| `src/pages/`                                                            | `DashboardPage` (painel: indicadores e fila), `QuotesPage`, `QuoteDetailPage` (também edita e exclui o orçamento), `ClientsPage`, `OwnersPage`.                                                                                                                                              |
| `src/api/types.ts`                                                      | Tipos do contrato, espelhando `server/src/routes` e `services` (`Quote`, `Owner`, `Client`, `FollowUp`, `Indicators`, `ListResponse`, etc.).                                                                                                             |
| `src/api/client.ts`                                                     | `request<T>()` e `ApiError { status, detail, errors }`. `status 0` = sem conexão. Erro fora do formato do §5.3 vira mensagem genérica.                                                                                                                   |
| `src/api/owners.ts`, `clients.ts`, `quotes.ts`, `follow-ups.ts`         | Uma função fina por endpoint (`listOwners`, `createQuote`, `updateClient`, `deleteClient`, `updateQuote`, `deleteQuote`, `changeQuoteStatus`...).                                                                                                                                      |
| `src/api/indicators.ts`                                                 | `getIndicators`. Junto com `listStaleQuotes` (em `quotes.ts`), alimenta o painel; os dois endpoints ainda estão em PR (#33 e #34), então o painel mostra erro de carregamento (404) até entrarem na `main`.                                              |
| `src/hooks/useAsync.ts`                                                 | `useAsync(load)` devolve `{ data, error, loading, reload }`. O `load` precisa ser estável (função de módulo ou `useCallback`).                                                                                                                           |
| `src/hooks/useSubmit.ts`                                                | Ciclo comum dos formulários: `submitting`, erros por campo e mensagem geral; `run(action)` devolve se deu certo.                                                                                                                                         |
| `src/hooks/useHashRoute.ts`                                             | Lê `location.hash` com `useSyncExternalStore` e devolve a `Route`.                                                                                                                                                                                       |
| `src/format.ts`                                                         | `formatCurrency`, `formatDate` (sem `new Date`, para não deslocar o dia pelo fuso), `formatDays`, `formatPercent` e `QUOTE_STATUS_LABELS`.                                                                                                               |
| `test/`                                                                 | Testes das lógicas não triviais: formatação, rotas, formulários e tratamento de erro do cliente, em ambiente Node.                                                                                                                                       |
| `vite.config.ts`                                                        | Plugins React e Tailwind, proxy de `/api` e bloco do Vitest.                                                                                                                                                                                             |
| `Dockerfile`, `nginx.conf`, `.dockerignore`                             | Imagem em dois estágios: `npm run build` em `node:24-alpine` e `dist` servido por `nginxinc/nginx-unprivileged` (usuário não-root, porta interna 8080). O nginx encaminha `/api/` para `server:3333` e devolve `index.html` para caminhos desconhecidos. |
| `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json` | Scripts e ferramentas, com as mesmas versões do `server/`.                                                                                                                                                                                               |

## Comandos

```bash
npm --prefix web install
npm --prefix web run dev        # http://localhost:5173 (precisa do server no ar)
npm --prefix web run build      # typecheck + vite build, gera web/dist
npm --prefix web run preview    # serve o build, com o mesmo proxy
npm --prefix web run check      # typecheck + lint + format + testes
```

## Proxy e portas

O Vite serve em `5173` (`strictPort`: falha em vez de subir em outra porta, porque o `CORS_ORIGIN` do server espera essa) e encaminha `/api` para `http://localhost:$PORT`, lendo `PORT` do `.env` da raiz (padrão `3333`). Por isso o front chama só `/api/...` e não há CORS em dev. Teste do proxy: `curl localhost:5173/api/health` responde `{"ok":true}` com o server no ar.

## No Docker

`docker compose up --build` (na raiz) sobe o front em `http://localhost:$WEB_PORT` (padrão `8080`; a porta interna do container é sempre 8080). O nginx faz o papel do proxy do Vite: `/api/` vai para `server:3333` pela rede do Compose, então o navegador continua falando só com uma origem e não precisa de CORS. A API não é publicada no host.

## Como criar uma tela

1. Chame a API pelas funções de `src/api/`, nunca com `fetch` direto no componente.
2. Liste com `useAsync` (`load` estável) dentro de `AsyncView` (carregando e erro) e trate o vazio com `EmptyState`.
3. Formulário: estado com `useState`, envio com `useSubmit(camposConhecidos)` e `FormField` para a mensagem de cada campo. O 422 do server aparece no campo (`errors[].field`) ou na mensagem geral (`detail`); não replique a regra no front.
4. Nova rota: acrescente o caso em `src/router.ts` (com teste), em `App.tsx` e, se couber, no menu do `Layout`.
5. Formate valor e data com `src/format.ts` e mostre o status com `QUOTE_STATUS_LABELS`.
6. Tailwind mobile-first: classe base para celular, `md:` para telas maiores.

## Decisões

- **Tailwind v4 com `@tailwindcss/vite`**: sem `tailwind.config` e sem PostCSS.
- **Navegação por hash, sem biblioteca de router, estado global, dados ou componentes** (AGENTS.md §3.2). O parser é uma função pura e testável; o build estático não precisa de fallback de servidor.
- **Painel como página inicial**: `#/` mostra os indicadores e a fila; `#/fila` é um apelido para a mesma tela, e `#/orcamentos` segue com a lista completa. A fila aparece na ordem da API (o server decide a prioridade) e os dois blocos carregam e falham de forma independente. Sem hooks próprios: `useAsync` direto basta.
- **Transições de status e rascunho ficam no server**: o formulário oferece todos os status e mostra o 422 que vier (o front não repete regra de negócio).
- **Testes em ambiente Node**, sem jsdom: só funções puras e `fetch` simulado. Componentes, hooks e páginas não têm teste (AGENTS.md §8).
- **Sem zod no front**: a API é a fonte da validação; os tipos só descrevem a resposta.
