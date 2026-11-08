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

## 2026-11-08 — Responsável pelo orçamento

### Contexto

Todo orçamento passa a ter uma pessoa da equipe responsável por ele. Sem isso, não dá para saber quem deve fazer o acompanhamento de um orçamento parado.

### Decisão

- Nova tabela `owners`, com `name` e `role`.
- `role` é texto livre, sem `CHECK` nem tabela de papéis: é só o cargo mostrado na tela e não muda nenhuma regra.
- `quotes.owner_id` é obrigatório (`NOT NULL`) e referencia `owners (id)`. A chave estrangeira não tem `ON DELETE CASCADE`: não se apaga um responsável que tem orçamentos.
- É uma mudança incompatível com o esquema anterior. É aceita porque os dados são fictícios e o banco é recriado com `docker compose down -v && docker compose up -d db` (AGENTS.md §5.5).
