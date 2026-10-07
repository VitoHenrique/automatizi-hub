# Registro de decisões

## DEC-001 — Empresas são a entidade principal
**Status:** adotada

O produto será organizado como HUB → Empresas → Agentes. A antiga central de tarefas não será a navegação principal.

## DEC-002 — DBX é piloto, não acoplamento
**Status:** adotada

Dados e seeds podem começar pela DBX, mas o domínio deve suportar qualquer empresa.

## DEC-003 — Separar lifecycle de saúde
**Status:** adotada

Um agente pode estar em produção e simultaneamente crítico. Portanto, os campos e componentes são independentes.

## DEC-004 — Hermes usa API segura
**Status:** adotada

Hermes não terá acesso irrestrito ao banco. Suas ações serão versionadas, escopadas e auditadas.

## DEC-005 — Começar com monólito modular
**Status:** adotada

Evitar microserviços prematuros. Separar módulos e contratos para permitir evolução posterior.

## DEC-006 — Recomeço limpo
**Status:** adotada
**Data:** 7 de outubro de 2026

O repositório GitHub antigo e o projeto Supabase antigo foram deletados. O Automatizi HUB será construído do zero, sem migração de dados, sem compatibilidade com o schema anterior e sem dependência da antiga central de tarefas. A documentação deste pacote é a especificação inicial oficial; decisões futuras devem ser adicionadas a este arquivo.

## DEC-007 — Stack de Fundação com Next.js 15, TypeScript e Tailwind CSS
- Data: 2026-10-07
- Status: adotada
- Contexto: A fundação do novo projeto requer monólito modular com SSR, API versionada (/api/v1), tipagem estrita e design profissional B2B.
- Decisão: Adotar Next.js 15 (App Router), TypeScript, Tailwind CSS, Zod e Vitest.
- Alternativas: Vite SPA puro (perderia rotas de backend nativas e SSR seguro) ou microsserviços Express separados (complexidade prematura).
- Motivo: Garante autorização server-side confiável, roteamento nativo /api/v1 e produtividade consistente.
- Impacto: Aplicação unificada com backend e frontend no mesmo repositório com forte separação em camadas.
- Responsável: Antigravity / Vito

## DEC-008 — Isolamento Multi-tenant com RLS e memberships formais
- Data: 2026-10-07
- Status: adotada
- Contexto: A nova fundação do zero exige isolamento multiempresa absoluto desde a primeira migration.
- Decisão: Toda entidade tenant-owned carrega 'organization_id'. Acesso é estritamente regulado por memberships e RLS no PostgreSQL.
- Alternativas: Esquema compartilhado sem RLS (vulnerável a vazamentos cross-tenant).
- Motivo: Segurança e isolamento são regras inegociáveis do produto.
- Impacto: Impossibilidade estrutural de ler ou modificar recursos de outros tenants.
- Responsável: Antigravity / Vito

## DEC-009 — Matriz RBAC com 6 papéis e 3 escopos de autorização
- Data: 2026-10-07
- Status: adotada
- Contexto: Necessidade de suportar administradores, operadores, analistas, agentes de serviço e clientes com permissões delimitadas.
- Decisão: Definir papéis formais ('owner', 'admin', 'operator', 'analyst', 'client_viewer', 'service_agent') e escopos ('global', 'company', 'agent').
- Alternativas: Permissões binárias (admin/user).
- Motivo: Escalabilidade de acesso e segurança exigida para clientes B2B e automação supervisionada.
- Impacto: Autorização validada no servidor em cada endpoint antes de qualquer query.
- Responsável: Antigravity / Vito

## DEC-010 — Contrato de API { data, meta, error } e Sanitização Obrigatória de Segredos
- Data: 2026-10-07
- Status: adotada
- Contexto: Risco de vazamento acidental de tokens e credenciais em logs e payloads.
- Decisão: Todas as respostas da API seguem { data, meta, error } com correlation_id e sanitização recursiva de secrets.
- Alternativas: Respostas arbitrárias por endpoint.
- Motivo: Previsibilidade para integrações (incluindo Hermes) e conformidade com diretrizes de observabilidade segura.
- Impacto: Logs e eventos de auditoria nunca armazenam segredos em texto puro.
- Responsável: Antigravity / Vito

## DEC-011 — Estrutura de Empresas com Onboarding Automatizado e Atividades Legíveis
- Data: 2026-10-07
- Status: adotada
- Contexto: A Fase 1 exige gestão formal de empresas clientes com etapas de implantação, observabilidade de atividades e separação entre o cliente piloto e a arquitetura geral.
- Decisão: Criar a tabela 'companies' (tenant-owned via organization_id), 'company_onboarding_checklists' com 6 etapas padronizadas geradas no cadastro, e 'activities' para trilha operacional legível. A DBX Global é fornecida como piloto oficial marcado com flag 'is_demo: true'.
- Alternativas: Checklists em colunas de texto não estruturadas ou acoplamento direto dos dados da DBX no código da aplicação.
- Motivo: Atende a DEC-001 (Empresas como entidade principal) e DEC-002 (DBX piloto sem acoplamento estrutural), garantindo visibilidade clara da implantação.
- Impacto: Toda empresa possui progresso quantificado de onboarding, histórico cronológico de atividades e suporte a restrição de escopo por membership.
- Responsável: Antigravity / Vito

## Template para novas decisões
### DEC-XXX — Título
- Data:
- Status: proposta | adotada | substituída
- Contexto:
- Decisão:
- Alternativas:
- Motivo:
- Impacto:
- Responsável:
