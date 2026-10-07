# Contrato de API

API versionada, preferencialmente `/api/v1`, com respostas consistentes: `data`, `meta`, `error`. Erros devem ter código estável, mensagem segura e detalhes de validação sem secrets.

## Recursos iniciais
Organizations, companies, agents, agent versions, tasks, integrations, executions, metrics, alerts, activities, documents e audit events.

## Regras
Paginação explícita, filtros documentados, ordenação determinística, idempotency key em criação de eventos/executions e correlation id em toda requisição.

## Hermes
Endpoints do Hermes devem usar credencial própria, escopos mínimos, limites de operação e auditoria. Nunca expor endpoint que permita execução arbitrária sem política e confirmação.
