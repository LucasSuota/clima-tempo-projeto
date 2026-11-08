# domain

> Regras de negócio do ClimaFácil como funções puras, sem I/O.

## Responsabilidade

Decide status, validade de datas e valores, se um orçamento está parado e os indicadores. Recebe dados, a data de "hoje" e `staleDays` por parâmetro. **Não** lê relógio, banco nem env, e não conhece HTTP (AGENTS.md §5.2).

## O que tem aqui

| Arquivo                         | Papel                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `shared/calendar-date.ts`       | `CalendarDate` (`'YYYY-MM-DD'`), `isCalendarDate`, `daysBetween` (via UTC), `toCalendarDate` (padrão `America/Sao_Paulo`) |
| `quotes/quote-status.ts`        | `QUOTE_STATUSES`, `ALLOWED_TRANSITIONS`, `OPEN_STATUSES`, `assertTransition`                                              |
| `quotes/quote.ts`               | Tipos `Quote` e `NewQuoteInput`; `validateNewQuote` e `changeStatus`                                                      |
| `quotes/stale-quote.ts`         | `getLastContact`, `evaluateStaleness`, `effectiveStatus`                                                                  |
| `follow-ups/follow-up.ts`       | Tipo `FollowUp`                                                                                                           |
| `follow-ups/follow-up-rules.ts` | `validateFollowUp`: não aceita rascunho, data futura nem anterior ao envio                                                |
| `indicators/indicators.ts`      | `conversionRate(won, lost)`: fração de 0 a 1, ou `null` sem decididos                                                     |

## Como se conecta

- **Depende de:** só de `../errors.ts` (`ValidationError`, `InvalidStatusTransitionError`, `FollowUpNotAllowedError`) e de si mesmo.
- **É usado por:** só pelos testes em `server/test/domain/`; serviços ainda não existem.
- **Contratos e dados:** `total` e `sentAt` espelham `quotes.total` (`NUMERIC(12,2)`) e `quotes.sent_at` (`date`); `STALE_DAYS` chega por `Config.staleDays`, passado pelo chamador.

## Decisões que moldam este código

- Datas como string `'YYYY-MM-DD'`; comparação lexicográfica vale para ISO (AGENTS.md §5.5).
- `no_response` é derivado na leitura: só `sent` parado vira `no_response`; `negotiating` parado mantém o status (`effectiveStatus`).
- Parado = `daysWithoutContact >= staleDays`, contando do último follow-up ou, sem eles, do envio; só vale para `sent`, `negotiating` e `no_response`.
- `total` é string decimal no tipo `Quote`; o domínio não soma dinheiro (AGENTS.md §5.5).
- Follow-up não altera o status do orçamento e é aceito em `won` e `lost`.

## Como testar

`npm --prefix server run test`; arquivos em `server/test/domain/` (um por módulo), com "hoje" fixo.

## Cuidados

- Mudou regra aqui: teste novo ou atualizado no mesmo commit (AGENTS.md §10).
- Não importar `express`, `pg`, `config.ts` nem usar `new Date()` para "hoje".
- As regras de AGENTS.md §7 ainda estão "a definir": este código é a implementação atual, não a especificação.
