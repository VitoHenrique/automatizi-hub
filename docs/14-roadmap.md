# Roadmap do Automatizi HUB

## Fase 0 — Fundação [CONCLUÍDA]
Documentação oficial, stack Next.js 15, autenticação RBAC multi-tenant, migrações versionadas, RLS no banco, layout base, observabilidade com correlation ID e testes unitários/integrados.

## Fase 1 — Empresas [CONCLUÍDA]
CRUD multi-tenant seguro, cards com badges de ciclo de vida e saúde, checklist formal de onboarding em 6 passos, timeline de atividades e piloto DBX Global inicializado como demo.

## Fase 2 — Agentes [CONCLUÍDA]
Cards operacionais, lifecycle imutável, métricas de saúde determinísticas, detalhe completo do agente, tarefas contextualizadas com 4 tipos formais e checklist auditado de 6 critérios para promoção a produção.

## Fase 3 — Operação [CONCLUÍDA]
Registro de execuções com correlation ID e higienização recursiva de secrets, cálculo auditável de saúde operacional (0-100), ciclo de vida de alertas (firing -> acknowledged -> resolved), incidentes e painel analítico de métricas agregadas.

## Fase 4 — API e Hermes [CONCLUÍDA]
Service Identity com chaves hash SHA-256 e escopos restritos, middleware de idempotência com cache de 24h (detecção de conflito 409), contrato de segurança do Hermes (permissões supervisionadas sem poderes destrutivos) e monitoramento de Circuit Breaker.

## Fase 5 — DBX & Adaptadores Operacionais [CONCLUÍDA]
Implementação dos 4 adaptadores modulares (Meta Ads, WhatsApp Cloud API, Google Calendar e CRM DBX), deduplicação de webhooks com índice único, funil visual de leads no detalhe da empresa cliente, split round-robin ponderado com teto diário de capacidade e simulação de pipeline em tempo real.

