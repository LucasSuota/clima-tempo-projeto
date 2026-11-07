# agents

> Definições dos agentes que trabalham no repositório e do fluxo entre eles.

As regras do projeto ficam no [AGENTS.md](../AGENTS.md). Cada arquivo aqui define só o papel de um agente e cita o AGENTS.md pelo número da seção. Os agentes são escritos em português; o que eles produzem no repositório segue o AGENTS.md §6 (código e commits em inglês; issues e PRs em português).

## Agentes

| Agente | Papel | Escreve código? | Mexe no git/GitHub? |
|---|---|---|---|
| [orchestrator](orchestrator.md) | Ponto de entrada: triagem, roteamento, pontos de parada, conferência final | Não | Não |
| [issue-creator](issue-creator.md) | Transforma um pedido em issue no GitHub | Não | Cria issue |
| [issue-planner](issue-planner.md) | Lê a issue e o código e escreve o plano em TDD | Não | Só lê |
| [issue-coder](issue-coder.md) | Implementa o plano, etapa por etapa, com testes | Sim | Não |
| [issue-reviewer](issue-reviewer.md) | Revisa o diff contra o AGENTS.md e refatora dentro do escopo | Sim (refatoração) | Não |
| [doc-writer](doc-writer.md) | Mantém os `README.md` de cada pasta com código | Só docs | Não |
| [git-manager](git-manager.md) | Branch, commits e PR | Não | Sim |

## Fluxo padrão

```
pedido → orchestrator ─┬─ pergunta / requisitos → responde direto
                       └─ issue-creator → issue-planner → [autor aprova]
                            → issue-coder ⇄ issue-reviewer (até 2 voltas)
                            → doc-writer (se mudou estrutura, contrato ou comandos)
                            → git-manager → [autor aprova push e PR]
```

## Pontos de parada

O autor decide antes de: gravar requisitos no AGENTS.md, criar issue, começar a codificar, qualquer item do AGENTS.md §3, mudança incompatível de contrato ou de esquema, push e PR. Detalhes em [orchestrator.md](orchestrator.md).

## Registro no Claude Code

`.claude/agents/` tem um link simbólico para cada agente desta pasta (este README fica de fora), para os agentes aparecerem como subagentes. Agente novo: crie o arquivo aqui e o link com `ln -s ../../agents/<nome>.md .claude/agents/<nome>.md`.
