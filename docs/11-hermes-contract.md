# Contrato do Hermes

O Hermes é o orquestrador e consumidor/operador controlado do HUB.

## Pode
Consultar contexto autorizado; listar empresas e agentes; ler documentação; criar e atualizar tarefas; registrar atividades, execuções, métricas e alertas; sugerir próxima ação; consultar estado de integrações.

## Não pode por padrão
Apagar histórico; alterar permissões; acessar outra organização; revelar secrets; executar ação financeira ou destrutiva; promover agente a produção sem aprovação.

## Contexto mínimo
organization, company, agent, execution, task, incident e correlation id. Toda ação do Hermes deve ser auditada com motivo, ferramenta, escopo e resultado.

## Falhas
Use respostas idempotentes, retries limitados, circuit breaker e registro explícito de falha. O HUB deve continuar utilizável mesmo quando Hermes estiver indisponível.
