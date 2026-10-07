# Modelo de domínio

## Entidades
- Organization: tenant principal e limite de isolamento.
- User: identidade autenticada.
- Membership: vínculo de usuário, organização, papel e escopo.
- Company: empresa cliente.
- Agent: agente pertencente a uma empresa.
- AgentVersion: versão imutável/promovível do agente.
- Task: trabalho operacional ligado a empresa, agente ou iniciativa.
- Integration: conexão com sistema externo.
- Execution: execução de agente ou workflow.
- Metric: indicador observado.
- Alert: condição que exige atenção.
- Incident: evento operacional investigado.
- Activity: trilha de atividade legível.
- AuditEvent: registro imutável de segurança e mudanças.
- Document: conhecimento vinculado a organização, empresa ou agente.

## Regras
Todas as entidades tenant-owned carregam `organization_id`. Entidades específicas carregam `company_id` quando aplicável. Relações usam foreign keys. Exclusão deve ser evitada; prefira arquivamento.

## Separações obrigatórias
`lifecycle_status` descreve fase do projeto. `operational_health` descreve saúde atual. `progress` é cálculo baseado em trabalho definido e não pode ser duplicado em múltiplas fontes.
