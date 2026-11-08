# web

> Front do ClimaFácil (Vite + React + TypeScript `strict` + Tailwind CSS v4). Hoje é só o esqueleto: uma tela de boas-vindas, o cliente HTTP tipado, os tipos do contrato, um hook de dados e as funções de formatação pt-BR. As telas de negócio entram nas próximas issues.

## Responsabilidade

Mostrar os dados da API e enviar as ações do usuário. O front **não** repete regra de negócio: o que é calculado no server (`isStale`, `daysWithoutContact`, status efetivo, indicadores) chega pronto (AGENTS.md §5.4). Textos da interface em português; identificadores em inglês.

## O que tem aqui

| Arquivo                                                                 | Papel                                                                                                                                        |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                                                            | Página de entrada (`lang="pt-BR"`, viewport para celular).                                                                                   |
| `src/main.tsx`                                                          | Monta o React em `#root` e importa o CSS.                                                                                                    |
| `src/App.tsx`                                                           | Raiz: `Layout` com a `HomePage`. Sem router por enquanto.                                                                                    |
| `src/index.css`                                                         | `@import 'tailwindcss'` e estilo base do `body`.                                                                                             |
| `src/components/Layout.tsx`                                             | Cabeçalho e `<main>` centralizado, sem largura fixa (`max-w-5xl`, `px-4`).                                                                   |
| `src/pages/HomePage.tsx`                                                | Tela de boas-vindas (placeholder das telas reais).                                                                                           |
| `src/api/types.ts`                                                      | Tipos do contrato, espelhando `server/src/routes` e `services` (`Quote`, `Owner`, `Client`, `FollowUp`, `Indicators`, `ListResponse`, etc.). |
| `src/api/client.ts`                                                     | `request<T>()` e `ApiError { status, detail, errors }`. `status 0` = sem conexão. Erro fora do formato do §5.3 vira mensagem genérica.       |
| `src/api/owners.ts`, `clients.ts`, `quotes.ts`, `follow-ups.ts`         | Uma função fina por endpoint (`listOwners`, `createQuote`, `changeQuoteStatus`...).                                                          |
| `src/api/indicators.ts`                                                 | `getIndicators`. Junto com `listStaleQuotes` (em `quotes.ts`), responde 404 até os PRs #33 e #34 entrarem na `main`.                         |
| `src/hooks/useAsync.ts`                                                 | `useAsync(load)` devolve `{ data, error, loading, reload }`. O `load` precisa ser estável (função de módulo ou `useCallback`).               |
| `src/format.ts`                                                         | `formatCurrency`, `formatDate` (sem `new Date`, para não deslocar o dia pelo fuso), `formatPercent` e `QUOTE_STATUS_LABELS`.                 |
| `test/format.test.ts`, `test/api/client.test.ts`                        | Testes das únicas lógicas não triviais (formatação e tratamento de erro do cliente), em ambiente Node.                                       |
| `vite.config.ts`                                                        | Plugins React e Tailwind, proxy de `/api` e bloco do Vitest.                                                                                 |
| `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json` | Scripts e ferramentas, com as mesmas versões do `server/`.                                                                                   |

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

## Como criar uma tela

1. Chame a API pelas funções de `src/api/`, nunca com `fetch` direto no componente.
2. Use `useAsync` com um `load` estável e trate os três estados: carregando, vazio e erro (`ApiError.detail` já vem em português; `errors[].field` mapeia para os campos do formulário).
3. Formate valor e data com `src/format.ts` e mostre o status com `QUOTE_STATUS_LABELS`.
4. Tailwind mobile-first: classe base para celular, `md:` para telas maiores.

## Decisões

- **Tailwind v4 com `@tailwindcss/vite`**: sem `tailwind.config` e sem PostCSS.
- **Sem router, sem estado global, sem biblioteca de dados ou de componentes** (AGENTS.md §3.2). Quando houver duas ou mais telas, a navegação entra numa issue própria.
- **Testes em ambiente Node**, sem jsdom: só funções puras e `fetch` simulado. Componentes visuais não têm teste (AGENTS.md §8).
- **Sem zod no front**: a API é a fonte da validação; os tipos só descrevem a resposta.
