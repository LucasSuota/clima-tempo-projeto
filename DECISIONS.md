# Decisões

## 2026-11-07 — Modelagem do banco de dados

Primeira decisão, tomada no início da modelagem do banco.

### Contexto

A tabela gerada pela IA tinha dois problemas:

1. **Contato obrigatório.** Não aceitava cliente sem número de contato. Faz sentido em parte, mas um cliente pode ser cadastrado como rascunho, ficando pendente até ser atualizado. Com a regra da IA, esse cadastro seria rejeitado, e não é o comportamento esperado.
2. **Nomes inconsistentes.** Os textos padrão não estavam padronizados. Nas tabelas `quotes` e `follow_ups`, a descrição, que deveria ser um campo comum às duas, era `description` em uma e `note` na outra.

### Decisão

- `email` e `phone` deixaram de ser `NOT NULL` em `clients`.
- O campo de texto livre passou a se chamar `description` em `quotes` e em `follow_ups`.
