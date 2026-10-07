import { z } from "zod";

// ============================================================================
// 1. ROLES E ESCOPOS DE AUTORIZAÇÃO
// ============================================================================

export const MembershipRoleSchema = z.enum([
  "owner",
  "admin",
  "operator",
  "analyst",
  "client_viewer",
  "service_agent",
]);
export type MembershipRole = z.infer<typeof MembershipRoleSchema>;

export const MembershipScopeSchema = z.enum(["global", "company", "agent"]);
export type MembershipScope = z.infer<typeof MembershipScopeSchema>;

// ============================================================================
// 2. CICLO DE VIDA (LIFECYCLE STATUS) E SAÚDE OPERACIONAL (HEALTH)
// IMPORTANTE: Conforme DEC-003, estes dois eixos NUNCA devem ser misturados.
// ============================================================================

export const AgentLifecycleStatusSchema = z.enum([
  "ideia",
  "planejamento",
  "diagnostico",
  "desenho",
  "construcao",
  "integracao",
  "testes",
  "operacao_assistida",
  "producao",
  "pausado",
  "bloqueado",
  "arquivado",
]);
export type AgentLifecycleStatus = z.infer<typeof AgentLifecycleStatusSchema>;

export const OperationalHealthSchema = z.enum([
  "saudavel",
  "atencao",
  "degradado",
  "critico",
  "sem_dados",
  "desconhecido",
]);
export type OperationalHealth = z.infer<typeof OperationalHealthSchema>;

export const CompanyLifecycleStatusSchema = z.enum([
  "prospect",
  "onboarding",
  "diagnostico",
  "implantacao",
  "operacao_assistida",
  "ativa",
  "atencao",
  "pausada",
  "encerrada",
]);
export type CompanyLifecycleStatus = z.infer<typeof CompanyLifecycleStatusSchema>;

export const OrganizationStatusSchema = z.enum(["active", "suspended", "archived"]);
export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;

// ============================================================================
// 3. SCHEMAS DE ENTIDADES CORE (FASE 0)
// ============================================================================

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "O nome da organização deve ter ao menos 2 caracteres"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  status: OrganizationStatusSchema.default("active"),
  settings: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: MembershipRoleSchema,
  scope: MembershipScopeSchema.default("global"),
  resource_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Membership = z.infer<typeof MembershipSchema>;

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  actor_id: z.string().uuid().nullable().optional(),
  actor_type: z.enum(["user", "service_agent", "hermes", "system"]).default("user"),
  action: z.string().min(3),
  target_type: z.string().min(2),
  target_id: z.string().uuid().nullable().optional(),
  payload: z.record(z.unknown()).default({}),
  ip_address: z.string().nullable().optional(),
  correlation_id: z.string().nullable().optional(),
  created_at: z.string().datetime(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ============================================================================
// 4. SCHEMAS DE EMPRESAS CLIENTES (FASE 1)
// ============================================================================

export const CompanySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  sector: z.string().default("Geral"),
  lifecycle_status: CompanyLifecycleStatusSchema.default("onboarding"),
  health: OperationalHealthSchema.default("sem_dados"),
  contracted_scope: z.string().nullable().optional(),
  objectives: z.string().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  owner_name: z.string().nullable().optional(),
  primary_contact_name: z.string().nullable().optional(),
  primary_contact_email: z.string().email().nullable().optional(),
  connected_systems: z.array(z.string()).default([]),
  risks: z.string().nullable().optional(),
  next_action: z.string().nullable().optional(),
  next_review_date: z.string().nullable().optional(),
  is_demo: z.boolean().default(false),
  archived_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Company = z.infer<typeof CompanySchema>;

export const CreateCompanySchema = z.object({
  name: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  sector: z.string().min(2, "Informe o setor da empresa"),
  objectives: z.string().optional(),
  contracted_scope: z.string().optional(),
  primary_contact_name: z.string().optional(),
  primary_contact_email: z.string().email("E-mail de contato inválido").optional().or(z.literal("")),
  connected_systems: z.array(z.string()).default([]),
  next_action: z.string().optional(),
  is_demo: z.boolean().default(false),
});
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;

export const UpdateCompanySchema = CreateCompanySchema.partial().extend({
  lifecycle_status: CompanyLifecycleStatusSchema.optional(),
  health: OperationalHealthSchema.optional(),
  owner_name: z.string().optional(),
  risks: z.string().optional(),
  next_review_date: z.string().optional(),
});
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;

export const CompanyOnboardingStepSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  company_id: z.string().uuid(),
  step_key: z.string(),
  step_title: z.string(),
  step_order: z.number().int(),
  is_completed: z.boolean().default(false),
  completed_at: z.string().datetime().nullable().optional(),
  completed_by: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type CompanyOnboardingStep = z.infer<typeof CompanyOnboardingStepSchema>;

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  company_id: z.string().uuid().nullable().optional(),
  agent_id: z.string().uuid().nullable().optional(),
  actor_id: z.string().uuid().nullable().optional(),
  actor_name: z.string(),
  action_type: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string().datetime(),
});
export type Activity = z.infer<typeof ActivitySchema>;

// ============================================================================
// 5. SCHEMAS DE AGENTES DE IA E TAREFAS (FASE 2)
// ============================================================================

export const AgentSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  company_id: z.string().uuid(),
  name: z.string().min(2, "Nome do agente deve ter ao menos 2 caracteres"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  kind: z.enum(["agent", "foundation", "transversal"]).default("agent"),
  role_description: z.string().min(5, "Informe a missão do agente"),
  problem_solved: z.string().nullable().optional(),
  lifecycle_status: AgentLifecycleStatusSchema.default("planejamento"),
  health: OperationalHealthSchema.default("sem_dados"),
  health_score: z.number().int().min(0).max(100).default(100),
  health_reasons: z.array(z.string()).default([]),
  current_version: z.string().default("1.0.0"),
  owner_id: z.string().uuid().nullable().optional(),
  owner_name: z.string().nullable().optional(),
  flow_summary: z.string().nullable().optional(),
  inputs_definition: z.array(z.record(z.unknown())).default([]),
  decisions_definition: z.array(z.record(z.unknown())).default([]),
  actions_definition: z.array(z.record(z.unknown())).default([]),
  outputs_definition: z.array(z.record(z.unknown())).default([]),
  accessed_systems: z.array(z.string()).default([]),
  operational_limits: z.string().nullable().optional(),
  human_intervention_rules: z.string().nullable().optional(),
  key_indicators: z.array(z.record(z.unknown())).default([]),
  risks: z.string().nullable().optional(),
  is_demo: z.boolean().default(false),
  archived_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(2, "Nome do agente deve ter ao menos 2 caracteres"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  role_description: z.string().min(5, "Informe a missão do agente"),
  problem_solved: z.string().optional(),
  kind: z.enum(["agent", "foundation", "transversal"]).default("agent"),
  accessed_systems: z.array(z.string()).default([]),
  flow_summary: z.string().optional(),
  operational_limits: z.string().optional(),
  human_intervention_rules: z.string().optional(),
  risks: z.string().optional(),
  is_demo: z.boolean().default(false),
});
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

export const UpdateAgentSchema = CreateAgentSchema.partial().extend({
  lifecycle_status: AgentLifecycleStatusSchema.optional(),
  health: OperationalHealthSchema.optional(),
  health_score: z.number().int().min(0).max(100).optional(),
  current_version: z.string().optional(),
  owner_name: z.string().optional(),
});
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;

export const PromoteAgentSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "A versão deve seguir o formato semântico (ex: 1.0.0)"),
  change_summary: z.string().min(5, "Descreva as mudanças desta versão"),
  readiness_checklist: z.object({
    has_documentation: z.boolean(),
    has_validated_integrations: z.boolean(),
    has_passed_tests: z.boolean(),
    has_designated_owner: z.boolean(),
    has_rollback_plan: z.boolean(),
    has_formal_approval: z.boolean(),
  }),
});
export type PromoteAgentInput = z.infer<typeof PromoteAgentSchema>;

export const AgentVersionSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  version: z.string(),
  change_summary: z.string(),
  config_snapshot: z.record(z.unknown()),
  is_production: z.boolean().default(false),
  promoted_at: z.string().datetime().nullable().optional(),
  promoted_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
});
export type AgentVersion = z.infer<typeof AgentVersionSchema>;

export const TaskKindSchema = z.enum(["task", "milestone", "blocker", "decision"]);
export type TaskKind = z.infer<typeof TaskKindSchema>;

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done", "blocked"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  company_id: z.string().uuid(),
  agent_id: z.string().uuid().nullable().optional(),
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres"),
  description: z.string().nullable().optional(),
  kind: TaskKindSchema.default("task"),
  status: TaskStatusSchema.default("todo"),
  priority: TaskPrioritySchema.default("medium"),
  assignee_id: z.string().uuid().nullable().optional(),
  assignee_name: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = z.object({
  company_id: z.string().uuid(),
  agent_id: z.string().uuid().optional(),
  title: z.string().min(2, "Título da tarefa é obrigatório"),
  description: z.string().optional(),
  kind: TaskKindSchema.default("task"),
  status: TaskStatusSchema.default("todo"),
  priority: TaskPrioritySchema.default("medium"),
  assignee_name: z.string().optional(),
  due_date: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// ============================================================================
// 6. CONTRATOS DE API PADRÃO (/api/v1)
// ============================================================================

export interface ApiResponseMeta {
  page?: number;
  per_page?: number;
  total?: number;
  correlation_id?: string;
  timestamp: string;
}

export interface ApiResponseError {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export interface ApiResponse<T> {
  data: T | null;
  meta: ApiResponseMeta;
  error: ApiResponseError | null;
}
