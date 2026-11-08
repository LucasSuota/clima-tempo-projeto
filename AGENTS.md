# AGENTS.md

Contexto canônico do **ClimaFácil**, um sistema de controle e acompanhamento de orçamentos. Este arquivo é a **única fonte de verdade** de escopo, arquitetura e regras para qualquer agente (e pessoa) que trabalhe no repositório. Os agentes em [agents/](agents/) citam as seções daqui pelo número (`AGENTS.md §5.2`).

Se o código e este arquivo discordarem, **não decida qual está certo**: relate ao autor.

---

## §1. Estado atual e ordem de construção

| Etapa | O que entra | Estado |
|---|---|---|
| 0 | Setup: AGENTS.md, agentes, README, Docker Compose com o banco, `.env.example` | ✅ feito |
| 1 | Banco: esquema do mínimo obrigatório + seed com dados fictícios (`db/init/`) | ⏳ próximo |
| 2 | Server: esqueleto (Express + TS + Vitest), `GET /api/health`, domínio puro com testes, repositórios, serviços, rotas com supertest | ⬜ |
| 3 | Levantamento de requisitos da parte livre → preencher §2, §3.1, §7 e §11 | ⬜ |
| 4 | Web: esqueleto (Vite + React + TS + Tailwind), telas consumindo a API | ⬜ |
| 5 | Docker Compose com `server` e `web` (subir tudo com um comando) | ⬜ |
| 6 | README final: decisões, o que ficou de fora, uso de IA, próximos passos | ⬜ |

**A ordem importa.** Uma camada de cima só começa quando a de baixo está pronta: nada de tela antes da rota existir, nem rota antes da regra de domínio. Os testes são só os estritamente necessários (§8). Pedido fora de ordem: avise e proponha a tarefa de baixo.

## §2. Escopo (o que será feito)

> ⏳ **Parcial.** Os campos do mínimo obrigatório já bastam para o esquema da etapa 1. A parte livre entra no levantamento de requisitos (etapa 3).

Formato esperado: uma subseção por funcionalidade (`§2.1`, `§2.2`…), cada uma com o objetivo em uma frase, as regras e os critérios de aceite. Separe o **mínimo obrigatório** da **parte livre**.

## §3. Fora do escopo (o que não será feito)

### §3.1 Funcionalidades

> ⏳ A definir no levantamento de requisitos. Cada item fica com o motivo em uma linha (alimenta a seção "O que ficou de fora" do README).

### §3.2 Dependências e tecnologia

- **Sem ORM** nem query builder (Prisma, TypeORM, Drizzle, Knex…). SQL puro com `pg`.
- **Sem biblioteca de estado global** no front (Redux, Zustand…) enquanto `useState`/`useReducer` + hooks resolverem.
- **Sem biblioteca de componentes pesada** (MUI, Ant…). Tailwind e componentes próprios.
- Toda dependência nova precisa de **uma linha de justificativa** no plano da issue e no PR. Prefira a biblioteca padrão do Node e do browser.
- Ferramentas de desenvolvimento já aceitas: TypeScript, Vitest, supertest, ESLint, Prettier, `tsx` (rodar TS em dev).

## §4. Stack

| Camada | Tecnologia |
|---|---|
| Banco | PostgreSQL 16 em container |
| Server | Node 20+ · Express · TypeScript · `pg` com SQL puro |
| Validação de entrada | `zod` (na borda da API) |
| Testes | Vitest + supertest |
| Web | Vite · React · TypeScript · Tailwind CSS |
| Infra | Docker Compose na raiz (banco agora; server e web depois) |

## §5. Arquitetura

### §5.1 Estrutura do repositório

```
.
├── AGENTS.md            # este arquivo
├── README.md            # visão geral e como rodar
├── docker-compose.yml
├── .env.example
├── agents/              # definições dos agentes (§13 e agents/README.md)
├── db/
│   └── init/            # scripts SQL executados na criação do volume
├── server/              # API (§5.2)
└── web/                 # front (§5.4)
```

Cada pasta com código tem um `README.md` curto de resumo, mantido pelo `doc-writer`.

### §5.2 Camadas do server

```
server/src/
├── index.ts          # sobe o servidor (listen). Nada além disso
├── app.ts            # monta o Express (middlewares, rotas, erros). Exportado para o supertest
├── config.ts         # lê e valida as variáveis de ambiente (zod)
├── db.ts             # Pool do pg
├── errors.ts         # erros de domínio + middleware que os traduz para HTTP
├── domain/           # funções puras: regras de negócio, sem I/O
├── repositories/     # único lugar com SQL
├── services/         # casos de uso: orquestram domínio + repositórios
└── routes/           # routers Express + schemas zod de entrada
server/test/          # testes (unitários do domínio e de API com supertest)
```

Direção de dependência, sempre para baixo:

```
routes  →  services  →  domain
                     →  repositories  →  db (pg)
```

- `domain/` é **puro**: recebe dados e a data de referência por parâmetro, não lê relógio, banco nem env. É onde fica a lógica mais testada (ex.: decidir se um orçamento está parado).
- `repositories/` é o **único** lugar com SQL, sempre parametrizado (`$1`, `$2`). Converte linhas do banco em tipos do domínio.
- `services/` contém a regra de aplicação. Recebe o repositório (ou o `Pool`) por parâmetro, sem singleton escondido.
- `routes/` só traduz: valida a entrada com zod, chama o serviço, devolve JSON. **Nenhuma regra de negócio aqui.**
- `app.ts` não chama `listen`, para os testes de API usarem o app direto.

### §5.3 Contrato da API

- Prefixo `/api`. Recursos no plural, em `kebab-case`: `/api/quotes`, `/api/quotes/:id/follow-ups`.
- JSON nos dois sentidos; campos em `camelCase` na API e `snake_case` no banco. A conversão acontece no repositório.
- Toda entrada passa por um schema zod. Os schemas ficam em `routes/` junto do router que os usa.
- Formato de erro único. Chaves em inglês, mensagens em português (são exibidas ao usuário, §6):

  ```json
  { "detail": "Dados inválidos", "errors": [{ "field": "amount", "message": "Deve ser maior que zero" }] }
  ```

- Status: `201` criado · `200` ok · `204` sem corpo · `404` inexistente · `422` entrada inválida · `500` erro inesperado (sem vazar stack).
- Mudança **incompatível** de contrato (remover ou renomear campo, mudar tipo ou status) só com o plano dizendo e o front ajustado no mesmo PR.
- `GET /api/health` responde `{ "ok": true }` e confere a conexão com o banco.

### §5.4 Web

```
web/src/
├── api/          # cliente HTTP tipado (fetch) e tipos do contrato (types.ts)
├── components/   # componentes reutilizáveis
├── pages/        # telas
└── hooks/        # hooks de dados e de UI
```

- O front **nunca** fala com o banco nem repete regra de negócio: o que é calculado no server (ex.: "está parado") vem pronto da API.
- Tipos do contrato ficam em `web/src/api/types.ts`, espelhando os schemas do server. Mudou o contrato, mudam os dois no mesmo PR.
- Em dev, o Vite faz proxy de `/api` para o server, então não há CORS em dev.
- Pensar em celular desde o início: layout responsivo com Tailwind, sem largura fixa.

### §5.5 Banco

- Esquema e seed em `db/init/*.sql`, executados em ordem alfabética **só quando o volume é criado** (`000-test-database.sql`, `001-schema.sql`, `002-seed.sql`). Mudou o esquema: `docker compose down -v && docker compose up -d db`. É aceitável porque todos os dados são fictícios e o seed os recria.
- `000-test-database.sql` cria o banco `climafacil_test`, usado só pelos testes de API.
- Tabelas no plural; tabelas e colunas em `snake_case`, em inglês: `quotes`, `follow_ups`, `sent_at`, `quote_id`.
- **Dinheiro em `NUMERIC(12,2)`**, nunca `float`. O `pg` devolve `NUMERIC` como string (`"1500.00"`): a conversão é explícita e acontece no repositório. Somas e totais são feitos no SQL (`SUM`), que é exato.
- Datas de calendário (ex.: data de envio) em `date`; momentos (ex.: `created_at`) em `timestamptz`.
- Fuso de referência: `America/Sao_Paulo`.
- Chaves primárias `id bigint generated always as identity`. Chaves estrangeiras com índice (o Postgres não cria sozinho).
- Status como `text` + `CHECK`. Nada de `ENUM` do Postgres, que é difícil de alterar.

## §6. Idiomas e nomes

**Em inglês:** código, comentários, testes, commits e branches.

**Em português:**

- **Issues e pull requests**: título e corpo. As labels ficam em inglês (`type/feature`, `area/db`).
- **Documentação**: este AGENTS.md, o `README.md` da raiz e os resumos de pasta (`db/README.md`, `server/README.md`...).
- **Agentes**: as definições em `agents/` e os planos e relatórios que os agentes mandam ao autor. O que os agentes escrevem no repositório segue esta seção.
- **Textos para o usuário final**: rótulos e mensagens da interface, nomes dos status na tela e mensagens de erro da API (`detail` e `message`), porque os usuários são brasileiros. Identificadores e valores no código continuam em inglês: o status `sent` é gravado e trafega como `sent` e aparece na tela como "Enviado".

Nomes de código citados em textos em português (arquivos, funções, rotas, campos) ficam como estão no código.

Padrão web para nomes:

| O quê | Padrão | Exemplo |
|---|---|---|
| Variáveis, funções, propriedades | `camelCase` | `daysWithoutContact`, `sentAt` |
| Tipos, interfaces, classes, componentes React | `PascalCase` | `Quote`, `QuoteNotFoundError`, `QuoteCard` |
| Constantes de configuração | `UPPER_SNAKE_CASE` | `DEFAULT_STALE_DAYS` |
| Variáveis de ambiente | `UPPER_SNAKE_CASE` | `DATABASE_URL` |
| Arquivos e pastas do server, scripts SQL | `kebab-case` | `quote-repository.ts`, `001-schema.sql` |
| Componentes React | arquivo `PascalCase.tsx` | `QuoteCard.tsx` |
| Hooks | arquivo `useX.ts` | `useQuotes.ts` |
| Testes | `<arquivo>.test.ts` | `stale-quote.test.ts` |
| Tabelas e colunas | `snake_case`, tabelas no plural | `follow_ups.quote_id` |
| Rotas da API | `kebab-case`, plural | `/api/quotes/:id/follow-ups` |
| Campos JSON | `camelCase` | `{ "sentAt": "2026-03-01" }` |
| Valores de status | `snake_case` | `sent`, `negotiating`, `won`, `lost` |
| Branches | `tipo/kebab-case` | `feat/create-quote` |

## §7. Regras de domínio

> ⏳ **A definir.** Aqui entram as regras que o código precisa respeitar e que os testes do `domain/` cobrem: status possíveis e transições permitidas, o que conta como "parado" e como X dias é configurado, o que um follow-up altera no orçamento, e qualquer indicador calculado.

## §8. Testes

- **Sem TDD.** O projeto não exige teste antes do código nem o ciclo Red → Green → Refactor. Escreva **apenas os testes estritamente necessários**, depois ou junto do código.
- O que vale testar: as regras críticas de `domain/` (caminho feliz, erro e limites de data) e o mínimo de API (um caminho feliz e um erro por rota relevante). Serviços e front só quando houver lógica não trivial.
- Não é preciso teste para toda mudança: ajuste de texto, configuração, refatoração sem efeito de comportamento e código trivial ficam sem teste novo.
- Testes de API com **supertest** sobre `app.ts`, contra o banco `climafacil_test` (`DATABASE_URL_TEST`), **nunca** o de dev. Cada teste prepara e limpa os próprios dados.
- Teste de API confere status, corpo e formato de erro (§5.3).
- Data "hoje" sempre injetada nos testes. Nenhum teste depende do relógio real nem de rede.
- Arrange / Act / Assert, um comportamento por teste, nome descritivo em inglês: `it('marks a quote as stale after X days without contact')`.
- Front: teste só para lógica não trivial (formatação, hooks). Não é obrigatório testar componente visual.

## §9. Código limpo

- TypeScript `strict`. Sem `any` nem `@ts-ignore` sem um comentário explicando o motivo. Dado externo (body, linha do banco) entra como `unknown` e é validado.
- Funções pequenas, uma responsabilidade, nomes completos.
- Comente o **porquê**, nunca o **quê**.
- Sem código morto, código comentado, `console.log` de depuração ou TODO sem explicação.
- Sem abstração prematura: só extraia na terceira repetição.
- Erros de domínio próprios (`class QuoteNotFoundError extends DomainError`). Nunca `catch` vazio.
- Simples a ponto de o autor explicar cada linha.

## §10. Trabalho com IA

- Todo código entregue precisa ser entendido e explicável pelo autor. Se uma solução não é simples de explicar, simplifique.
- Em dúvida de escopo ou de regra, **pergunte** em vez de adivinhar.
- Mudança em regra crítica de `domain/` pede teste novo ou atualizado; nas demais, só o estritamente necessário (§8).
- Commits, branches e PRs não levam rastro de IA (§13).

## §11. Linha de corte e prioridades

> ⏳ A definir no levantamento de requisitos: o que é `p0` (mínimo obrigatório), `p1` (parte livre escolhida) e `p2` (só se sobrar tempo). Na dúvida, vale "uma ou duas coisas bem feitas" em vez de muitas pela metade.

## §12. Segurança

- SQL **sempre** parametrizado. Nunca concatenar ou interpolar valor em query.
- Toda entrada do cliente é não confiável: validada com zod no server, mesmo que o front já valide.
- Erro `500` não devolve stack nem mensagem interna.
- CORS restrito a `CORS_ORIGIN`, nunca `*`.
- Segredos só em `.env` (fora do git). `.env.example` com valores de dev, sem nada sensível.
- **Apenas dados fictícios** em seed, testes, issues e prints.

## §13. Git e GitHub

- Branch principal: `main`. Trabalho em branch `{tipo}/{descricao-em-kebab-case}`, em inglês.
- **Conventional Commits em inglês**, com escopo: `feat(server): ...`, `fix(web): ...`, `chore(db): ...`, `docs: ...`. Teste no mesmo commit do código que ele cobre.
- **Issues e PRs em português**, título e corpo. O PR referencia a issue com `Closes #n`.
- Nunca `git add .`/`-A`, nunca `--no-verify`, nunca force-push na `main`. Push e criação de PR só com confirmação do autor.
- **Sem rastros de IA** em commits, branches, PRs ou comentários de código: nada de `Co-Authored-By`, "Generated with" ou similares. Regra completa em [agents/git-manager.md](agents/git-manager.md).
- O fluxo entre agentes está em [agents/README.md](agents/README.md).

## §14. Critério de pronto

Uma issue só está pronta quando:

- [ ] `npm run check` passa em cada pacote tocado (`server/`, `web/`);
- [ ] as regras críticas novas ou alteradas de `domain/` têm teste (feliz, erro e borda); fora delas, só os testes estritamente necessários (§8);
- [ ] o contrato está inalterado, ou a mudança está sinalizada e o front foi ajustado no mesmo PR;
- [ ] nada do §3 entrou; nenhuma dependência nova sem justificativa;
- [ ] SQL parametrizado, sem segredo no diff, só dados fictícios;
- [ ] nomes e idiomas seguem o §6;
- [ ] os `README.md` de pasta, o README da raiz e este arquivo refletem a mudança, se ela mexeu em estrutura, comandos ou escopo.

## §15. Comandos

| O quê | Comando |
|---|---|
| Subir o banco | `docker compose up -d db` |
| Ver o estado | `docker compose ps` |
| Abrir o psql | `docker compose exec db psql -U climafacil -d climafacil` |
| Recriar o banco do zero (reaplica `db/init/`) | `docker compose down -v && docker compose up -d db` |
| Validar um pacote | `npm --prefix server run check` · `npm --prefix web run check` |

Todo pacote Node expõe os scripts: `dev`, `build`, `typecheck`, `lint`, `format:check`, `test` e `check` (`typecheck` + `lint` + `format:check` + `test`). Eles passam a valer quando o pacote é criado (etapas 2 e 4).
