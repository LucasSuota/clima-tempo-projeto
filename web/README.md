# web

> Front do ClimaFácil (Vite + React + TypeScript `strict` + Tailwind CSS v4). Tem as telas do mínimo obrigatório (responsáveis, clientes, orçamentos com lista, criação, edição, exclusão e detalhe com mudança de status e follow-ups) e o painel inicial com os indicadores e a fila "quem contatar hoje", dentro de um layout com menu lateral.

## Responsabilidade

Mostrar os dados da API e enviar as ações do usuário. O front **não** repete regra de negócio: o que é calculado no server (`isStale`, `daysWithoutContact`, status efetivo, indicadores) chega pronto (AGENTS.md §5.4). Textos da interface em português; identificadores em inglês.

Também guarda no navegador o que o usuário já digitou ou abriu (rascunhos de formulário, painéis abertos, busca, filtro e página), para um F5 não perder o trabalho. É só conveniência de interface: nada disso vai para a API.

## O que tem aqui

### Raiz e módulos puros

| Arquivo                | Papel                                                                                                                                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`           | Página de entrada (`lang="pt-BR"`, viewport para celular). Carrega a fonte Inter do Google Fonts.                                                                                                                                                                                         |
| `src/main.tsx`         | Monta o React em `#root` e importa o CSS.                                                                                                                                                                                                                                                 |
| `src/App.tsx`          | Raiz: `useHashRoute` escolhe a tela dentro do `Layout`. `QuoteDetailPage` usa `key={id}` para não mostrar o orçamento anterior (e para a chave do rascunho do painel não mudar com a página montada).                                                                                     |
| `src/router.ts`        | `parseRoute(hash)` (puro) e `quoteHref(id)`. Rotas: `#/` e `#/fila` (painel), `#/orcamentos`, `#/orcamentos/:id`, `#/clientes`, `#/responsaveis`; o resto é "Página não encontrada".                                                                                                      |
| `src/forms.ts`         | `splitErrors` (erro da API em mensagens por campo + mensagem geral; campo que o formulário não tem vai para a mensagem geral) e `parseMoneyInput` (`1.500,50` -> `1500.5`).                                                                                                               |
| `src/format.ts`        | `formatCurrency`, `formatDate` (sem `new Date`, para não deslocar o dia pelo fuso), `formatDays`, `formatPercent`, `QUOTE_STATUS_LABELS` e `staleTone` (ver "Decisões").                                                                                                                  |
| `src/search.ts`        | `normalizeText`: tira acento e põe em minúsculas, para a busca achar "orcamento" em "Orçamento".                                                                                                                                                                                          |
| `src/charts.ts`        | Contas puras dos gráficos do painel: `shareOf` (fração com `null` quando o todo é zero), `splitOpenTotal` (parado vs. em dia dentro do em aberto) e `groupQueueByAge` (fila por faixa de dias sem contato: até 14, 15 a 29, 30 ou mais). Só apresentação: "parado" continua vindo da API. |
| `src/pagination.ts`    | Contas puras de página: `PAGE_SIZE` (20), `pageCount`, `toOffset`, `pageRange` ("Mostrando a–b de N") e `clampPage`.                                                                                                                                                                      |
| `src/draft-storage.ts` | Rascunhos no `localStorage` (ver "Rascunhos e estado da tela"): prefixo, `DRAFT_KEYS`, `readDraft`/`saveDraft`/`clearDraft` (recebem o storage e o "agora" por parâmetro), `isStringRecord` e os atalhos `readBrowserDraft`/`saveBrowserDraft`/`discardDraft`.                            |
| `src/ui-state.ts`      | Formato e `parse*` do estado de tela que sobrevive ao F5: painel de criar/editar (`CrudPanel`), painel de edição do detalhe, painel por `quoteId`, busca + filtro + página da lista de orçamentos e busca + página das demais. Dado inválido vira `null`.                                 |
| `src/index.css`        | `@import 'tailwindcss'`, tokens de cor `--color-cf-*`, estilo base do `body`, anel de foco, a variante `no-hover` (`@media (hover: none)`, usada pelo menu lateral) e as classes `.cf-field` (campo de formulário), `.cf-search` (caixa de busca) e `.hit` (trecho destacado na busca).   |

### Hooks (`src/hooks/`)

| Arquivo                | Papel                                                                                                                                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAsync.ts`          | `useAsync(load)` devolve `{ data, error, loading, reload }`. O `load` precisa ser estável (função de módulo ou `useCallback`).                                                                                                                                                      |
| `usePagedList.ts`      | `usePagedList(fetchPage, page, setPage)`: controlado, quem chama é dono de `page` (assim a página entra no estado persistido junto com busca e filtro). Envia `limit`/`offset`; se a página some (exclusão do último item), corrige com `setPage`. `fetchPage` precisa ser estável. |
| `usePersistedState.ts` | `usePersistedState(key, initial, parse)`: `useState` que parte do rascunho salvo (se válido) e grava a cada mudança; devolve também `discard()`, que apaga a entrada na hora e volta ao valor inicial. A `key` não pode mudar com o componente montado.                             |
| `useSubmit.ts`         | Ciclo comum dos formulários: `submitting`, erros por campo e mensagem geral; `run(action)` devolve se deu certo.                                                                                                                                                                    |
| `useHashRoute.ts`      | Lê `location.hash` com `useSyncExternalStore` e devolve a `Route`.                                                                                                                                                                                                                  |

### Componentes (`src/components/`)

| Arquivo                                                                                        | Papel                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Layout.tsx`                                                                                   | Casca da aplicação: `Sidebar` à esquerda a partir de `lg` (1024px), reservando só a largura comprimida (`pl-16`; `pl-60` em telas só de toque) e, abaixo disso, barra superior com hambúrguer, nome e lupa. Atalho Ctrl/⌘+K abre a busca global. Com o menu aberto, a barra e o `<main>` ficam `inert`.                                                                           |
| `Sidebar.tsx`                                                                                  | Menu lateral a partir de `lg:`: comprimido (só ícones, `w-16`) e expande para `w-60` sobre o conteúdo no hover ou no foco por teclado; em telas só de toque (`hover: none`) fica sempre expandido. Abaixo de `lg` é gaveta (fundo escurecido, `Esc`, troca de hash ou volta ao desktop fecham; foco vai para "Fechar menu"). Links com `aria-current`, botão "Buscar em tudo ⌘K". |
| `GlobalSearchModal.tsx`                                                                        | Busca em tudo: carrega até 50 orçamentos, clientes e responsáveis (`Promise.allSettled`, então uma lista que falha não derruba as outras) e filtra no navegador com `normalizeText`. `Esc` fecha. Resultados levam ao detalhe do orçamento ou à lista.                                                                                                                            |
| `SlideOver.tsx`                                                                                | Painel lateral modal (`role="dialog"`) usado para criar/editar. X, `Esc` e clique no fundo chamam `onClose`; trava a rolagem do `body`, foca o primeiro campo e devolve o foco a quem abriu.                                                                                                                                                                                      |
| `SearchInput.tsx`, `SearchHighlight.tsx`                                                       | Caixa de busca com botão "Limpar busca" e trecho destacado (`.hit`) nos resultados, ignorando acento.                                                                                                                                                                                                                                                                             |
| `FilterDropdown.tsx`                                                                           | Botão de filtro com menu (`role="menu"`, itens `menuitemradio` com check e contagem), ao lado da busca; navegação por setas/Home/End, `Esc` e clique fora fecham, e o × "Limpar filtro" volta à primeira opção (genérico no tipo do id).                                                                                                                                          |
| `IconButton.tsx`                                                                               | `IconButton` (variantes `default` e `danger`) e os ícones SVG do projeto: `EditIcon`, `TrashIcon`, `CloseIcon`, `SearchIcon`, `MenuIcon` e os dos itens do menu (`DashboardIcon`, `QuotesIcon`, `ClientsIcon`, `OwnersIcon`), além da `BrandMark` (floco de neve sobre o azul da marca, usada no menu e na barra do celular).                                                     |
| `MissingValue.tsx`                                                                             | Texto cinza em itálico para dado ausente ("Não informado" por padrão).                                                                                                                                                                                                                                                                                                            |
| `StaleIndicator.tsx`                                                                           | "Parado há N dias", com cor vinda de `staleTone`. Quem usa só o renderiza quando `isStale` é verdadeiro; ele não decide se está parado. Substitui o antigo `StaleBadge`.                                                                                                                                                                                                          |
| `StatusBadge.tsx`                                                                              | Badge do status efetivo, com o rótulo de `QUOTE_STATUS_LABELS`.                                                                                                                                                                                                                                                                                                                   |
| `FormField.tsx`                                                                                | Rótulo + mensagem de erro de um campo. Os filhos são uma função (render-prop) que recebe `id`, `aria-invalid` e `aria-describedby` para ligar o controle ao rótulo e ao erro.                                                                                                                                                                                                     |
| `Button.tsx`                                                                                   | Variantes `primary`, `secondary`, `danger` e `ghost`.                                                                                                                                                                                                                                                                                                                             |
| `DataTable.tsx`                                                                                | Uma definição de colunas vira `<table>` a partir de `md:` e lista de cards no celular.                                                                                                                                                                                                                                                                                            |
| `Pagination.tsx`                                                                               | Anterior/Próxima e "Mostrando a–b de N"; não aparece com uma página só.                                                                                                                                                                                                                                                                                                           |
| `AsyncView.tsx`, `Spinner.tsx`, `ErrorMessage.tsx`, `EmptyState.tsx`                           | Estados de carregando, erro (com "Tentar de novo") e vazio.                                                                                                                                                                                                                                                                                                                       |
| `IndicatorCards.tsx`                                                                           | Três cards do painel: dinheiro parado, em aberto (com barra parado vs. em dia) e taxa de conversão (com anel ganhos vs. perdidos; `null` aparece como "Sem dados"). Gráficos em SVG/CSS próprios, com `role="img"` e `aria-label` com os números.                                                                                                                                 |
| `QueueAgingChart.tsx`                                                                          | Barras da fila "para ligar hoje" por faixa de dias sem contato, com quantidade e soma escritas ao lado de cada barra. Agrega só os itens que a fila já devolveu.                                                                                                                                                                                                                  |
| `OwnerForm.tsx`, `ClientForm.tsx`, `QuoteForm.tsx`, `StatusChangeForm.tsx`, `FollowUpForm.tsx` | Formulários, todos com rascunho via `usePersistedState`. Cliente e orçamento criam e editam conforme recebam `client`/`quote`. `inSlideOver` ajusta o layout dentro do painel.                                                                                                                                                                                                    |
| `ClientActions.tsx`, `QuoteActions.tsx`, `FollowUpHistory.tsx`                                 | Botões Editar e Excluir (com confirmação inline) e o histórico de contatos.                                                                                                                                                                                                                                                                                                       |

### Telas e API

| Arquivo                                                         | Papel                                                                                                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/`                                                    | `DashboardPage` (indicadores e fila, com painel de follow-up), `QuotesPage` (busca, chips de status e painel de criar/editar), `QuoteDetailPage` (mudança de status, follow-ups, edita e exclui), `ClientsPage`, `OwnersPage`. |
| `src/api/types.ts`                                              | Tipos do contrato, espelhando `server/src/routes` e `services` (`Quote`, `Owner`, `Client`, `FollowUp`, `Indicators`, `ListResponse`, `QUOTE_STATUSES`, etc.).                                                                 |
| `src/api/client.ts`                                             | `request<T>()` e `ApiError { status, detail, errors }`. `status 0` = sem conexão. Erro fora do formato do §5.3 vira mensagem genérica.                                                                                         |
| `src/api/owners.ts`, `clients.ts`, `quotes.ts`, `follow-ups.ts` | Uma função fina por endpoint (`listOwners`, `createQuote`, `updateClient`, `deleteClient`, `updateQuote`, `deleteQuote`, `changeQuoteStatus`, `listStaleQuotes`...).                                                           |
| `src/api/indicators.ts`                                         | `getIndicators`. Com `listStaleQuotes`, alimenta o painel; os dois endpoints dependem de PRs ainda não mesclados, e até lá o painel mostra erro de carregamento (404).                                                         |

### Teste, build e ferramentas

| Arquivo                                                                                    | Papel                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/`                                                                                    | `format`, `router`, `forms`, `pagination`, `draft-storage` e `api/client`, em ambiente Node.                                                                                                                                                             |
| `references/`                                                                              | Mockups de design exportados (`components-layout-design/`, `design-pattern-layout/`), **só para consulta**: cores, medidas e espaçamentos que as telas replicam. Não são código do app e ficam fora do lint, do Prettier e da imagem Docker.             |
| `vite.config.ts`                                                                           | Plugins React e Tailwind, proxy de `/api` e bloco do Vitest.                                                                                                                                                                                             |
| `Dockerfile`, `nginx.conf`, `.dockerignore`                                                | Imagem em dois estágios: `npm run build` em `node:24-alpine` e `dist` servido por `nginxinc/nginx-unprivileged` (usuário não-root, porta interna 8080). O nginx encaminha `/api/` para `server:3333` e devolve `index.html` para caminhos desconhecidos. |
| `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore` | Scripts e ferramentas, com as mesmas versões do `server/`. `references/` está nos ignores do ESLint, do Prettier e do Docker.                                                                                                                            |

## Rascunhos e estado da tela

Implementado em `src/draft-storage.ts`, `src/ui-state.ts` e `src/hooks/usePersistedState.ts`.

- **O que persiste:** valores dos formulários, painel aberto (criar/editar), busca, filtro e página das listas. Tudo no `localStorage`, sob chaves `climafacil:draft:v1:*` (catálogo em `DRAFT_KEYS`; nenhuma tela escreve chave à mão).
- **Validade:** 7 dias (`DRAFT_MAX_AGE_MS`). Entrada vencida, com JSON quebrado ou fora do formato esperado é descartada e a tela parte do estado inicial. Valor igual ao inicial não deixa entrada.
- **Esconder não é descartar:** X, `Esc` e clique no fundo só fecham o painel (`setPanel(null)`); o rascunho do formulário continua salvo e reaparece ao reabrir.
- **Só descartam:** o botão "Cancelar" e o envio com sucesso (`discard()` do `usePersistedState`). Recarregar a página (F5) nunca limpa: não há nenhum tratamento de `unload`.
- **Item que sumiu:** se o painel restaurado aponta para um orçamento, cliente ou fila que não existe mais, a tela apaga a chave do painel e a do formulário (`discardDraft`).
- **Storage indisponível** (modo privado, dados bloqueados, cota cheia): `getBrowserStorage` devolve `null` e leitura, gravação e remoção falham em silêncio. A tela funciona, só sem rascunho.
- **Relógio e storage fora da lógica:** `readDraft`/`saveDraft`/`clearDraft` recebem o storage e o "agora" por parâmetro; só os atalhos `*BrowserDraft` leem `window.localStorage` e `Date.now()`.
- **Teste:** `test/draft-storage.test.ts` usa um `Storage` falso (sem jsdom): ida e volta, validade (incluindo o limite exato), JSON inválido, escrita e remoção que falham, ausência de storage e `isStringRecord`.

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
2. Liste com `useAsync` (`load` estável) dentro de `AsyncView` (carregando e erro) e trate o vazio com `EmptyState`. Listas que crescem usam `usePagedList(fetchPage, page, setPage)` e `Pagination` (vazio é `data.total === 0`). Se a lista tem busca ou filtro, guarde `{ search, filter, page }` com `usePersistedState` e um `parse*` em `ui-state.ts`.
3. Formulário: estado com `usePersistedState` (chave nova em `DRAFT_KEYS`), envio com `useSubmit(camposConhecidos)` e `FormField` para a mensagem de cada campo (o controle recebe `id`, `aria-invalid` e `aria-describedby` do render-prop). Chame `discard()` no Cancelar e depois do envio com sucesso. O 422 do server aparece no campo (`errors[].field`) ou na mensagem geral (`detail`); não replique a regra no front.
4. Criar/editar em painel: `SlideOver` com o formulário dentro; o fechamento do painel só esconde, não descarta.
5. Nova rota: acrescente o caso em `src/router.ts` (com teste), em `App.tsx` e, se couber, em `NAV_ITEMS` do `Sidebar`.
6. Formate valor e data com `src/format.ts` e mostre o status com `QUOTE_STATUS_LABELS`.
7. Tailwind mobile-first: classe base para celular, `md:`/`lg:` para telas maiores.

## Decisões

- **Tailwind v4 com `@tailwindcss/vite`**: sem `tailwind.config` e sem PostCSS. Os tokens ficam em `@theme` no `index.css`.
- **Navegação por hash, sem biblioteca de router, estado global, dados ou componentes** (AGENTS.md §3.2). O parser é uma função pura e testável; o build estático não precisa de fallback de servidor.
- **Menu lateral no lugar do cabeçalho**: a partir de `lg` (1024px) o menu fica à esquerda, comprimido em ícones e expandido no hover ou no foco por teclado (sobrepõe o conteúdo, que não se mexe; em telas só de toque fica expandido, porque não há hover e o foco o deixaria preso aberto); abaixo disso, uma barra superior abre o menu como gaveta. A busca global (Ctrl/⌘+K) fica no menu e na barra.
- **Painel como página inicial**: `#/` mostra os indicadores e a fila; `#/fila` é um apelido para a mesma tela, e `#/orcamentos` segue com a lista completa. A fila aparece na ordem da API (o server decide a prioridade) e os dois blocos carregam e falham de forma independente.
- **"Parado" vem sempre de `isStale` da API.** `CRITICAL_DAYS_WITHOUT_CONTACT` (30) e `staleTone` em `format.ts` são constante e função de apresentação: só escolhem a cor do texto de dias sem contato (laranja ou vermelho). Não definem se o orçamento está parado.
- **Busca e chips da lista de orçamentos, clientes e responsáveis filtram no navegador, sobre os itens da página carregada** (a API não tem filtro). A busca global carrega até 50 itens de cada tipo.
- **Transições de status e rascunho ficam no server**: o formulário oferece todos os status e mostra o 422 que vier (o front não repete regra de negócio).
- **Rascunho no `localStorage`, sem biblioteca**: `useState` + efeito bastam (AGENTS.md §3.2); o fluxo está em "Rascunhos e estado da tela".
- **Testes em ambiente Node**, sem jsdom: só funções puras, `fetch` simulado e `Storage` falso. Componentes, hooks e páginas não têm teste (AGENTS.md §8).
- **Sem zod no front**: a API é a fonte da validação; os tipos só descrevem a resposta. O estado salvo no navegador é validado à mão (`parse*` e `isStringRecord`), porque entra como `unknown`.

## Cuidados

- `fetchPage` do `usePagedList` e `load` do `useAsync` precisam ser estáveis, senão recarregam a cada render.
- A `key` do `usePersistedState` não pode mudar com o componente montado; para trocar de item, remonte com `key` do React.
- Mudar o formato de um estado salvo exige trocar a versão do prefixo (`v1`) ou aceitar o descarte pelo `parse*`.
- Não escreva em `references/` nem importe de lá: é só consulta.
