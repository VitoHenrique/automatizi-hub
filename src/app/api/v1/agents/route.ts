import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { agentRepository } from "@/lib/agents/store";
import { companyRepository } from "@/lib/companies/store";
import { CreateAgentSchema } from "@/domain/types";
import { buildSanitizedAuditEvent } from "@/lib/audit/audit-logger";
import { logger } from "@/lib/logger/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "agent:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para listar agentes.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") || undefined;
  const statusFilter = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  let agents = agentRepository.list(ctx.organizationId, companyId, statusFilter, search);

  // Escopo restrito a nível de empresa ou agente
  if (ctx.scope === "company" && ctx.resourceId) {
    agents = agents.filter((a) => a.company_id === ctx.resourceId);
  } else if (ctx.scope === "agent" && ctx.resourceId) {
    agents = agents.filter((a) => a.id === ctx.resourceId);
  }

  logger.info("Listagem de agentes consultada", {
    correlationId,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    total: agents.length,
  });

  return apiSuccess({
    data: agents,
    meta: {
      total: agents.length,
      correlation_id: correlationId,
    },
  });
}

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "agent:create")) {
    return ApiErrors.FORBIDDEN("Apenas administradores e operadores podem cadastrar agentes.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  // Validar se a empresa destino pertence a esta organização
  const company = companyRepository.findById(parsed.data.company_id, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa cliente vinculada", correlationId);
  }

  // Checar unicidade de slug dentro da mesma empresa
  const existing = agentRepository.findBySlug(parsed.data.slug, parsed.data.company_id, ctx.organizationId);
  if (existing) {
    return ApiErrors.VALIDATION_ERROR(
      { slug: ["Já existe um agente com este identificador (slug) nesta empresa."] },
      correlationId
    );
  }

  const newAgent = agentRepository.create({
    organization_id: ctx.organizationId,
    company_id: parsed.data.company_id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    kind: parsed.data.kind,
    role_description: parsed.data.role_description,
    problem_solved: parsed.data.problem_solved || null,
    lifecycle_status: "planejamento",
    health: "sem_dados",
    health_score: 100,
    health_reasons: ["Agente recém-criado em fase de planejamento."],
    current_version: "1.0.0",
    owner_id: ctx.userId,
    owner_name: "Operador Responsável",
    flow_summary: parsed.data.flow_summary || null,
    inputs_definition: [],
    decisions_definition: [],
    actions_definition: [],
    outputs_definition: [],
    accessed_systems: parsed.data.accessed_systems,
    operational_limits: parsed.data.operational_limits || null,
    human_intervention_rules: parsed.data.human_intervention_rules || null,
    key_indicators: [],
    risks: parsed.data.risks || null,
    is_demo: parsed.data.is_demo,
    archived_at: null,
  });

  // Registrar atividade legível vinculada à empresa e agente
  companyRepository.addActivity({
    organization_id: ctx.organizationId,
    company_id: newAgent.company_id,
    agent_id: newAgent.id,
    actor_id: ctx.userId,
    actor_name: "Operador",
    action_type: "agent.created",
    title: "Novo agente desenhado",
    description: `Agente '${newAgent.name}' criado para a empresa ${company.name}.`,
  });

  // Auditoria
  buildSanitizedAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    action: "agent.created",
    targetType: "agent",
    targetId: newAgent.id,
    payload: { name: newAgent.name, slug: newAgent.slug, company_id: newAgent.company_id },
    correlationId,
  });

  logger.info("Agente criado com sucesso", { correlationId, agentId: newAgent.id, name: newAgent.name });

  return apiSuccess({
    data: newAgent,
    meta: { correlation_id: correlationId },
    status: 201,
  });
}
