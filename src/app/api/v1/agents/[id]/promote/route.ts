import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { agentRepository } from "@/lib/agents/store";
import { companyRepository } from "@/lib/companies/store";
import { PromoteAgentSchema } from "@/domain/types";
import { validateAgentLifecycleTransition } from "@/domain/lifecycle";
import { buildSanitizedAuditEvent } from "@/lib/audit/audit-logger";
import { logger } from "@/lib/logger/logger";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);

  // Apenas quem possui privilégio de promoção para produção (owner ou admin - docs/04-security.md)
  if (!hasPermission(ctx, "agent:promote_production")) {
    return ApiErrors.FORBIDDEN(
      "Apenas administradores podem aprovar a promoção formal de um agente para produção.",
      correlationId
    );
  }

  const agent = agentRepository.findById(id, ctx.organizationId);
  if (!agent) {
    return ApiErrors.NOT_FOUND("Agente", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = PromoteAgentSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  // Validação dos 6 critérios de prontidão (docs/07-agent-lifecycle.md)
  const validation = validateAgentLifecycleTransition(
    agent.lifecycle_status,
    "producao",
    parsed.data.readiness_checklist
  );

  if (!validation.allowed) {
    return ApiErrors.VALIDATION_ERROR(
      {
        readiness_checklist: [
          validation.reason || "Critérios de prontidão insuficientes para produção.",
          ...(validation.missing_requirements || []),
        ],
      },
      correlationId
    );
  }

  const promotionResult = agentRepository.promoteToProduction(
    id,
    ctx.organizationId,
    parsed.data.version,
    parsed.data.change_summary,
    ctx.userId
  );

  if (!promotionResult) {
    return ApiErrors.INTERNAL_ERROR(correlationId);
  }

  // Registrar atividade legível
  companyRepository.addActivity({
    organization_id: ctx.organizationId,
    company_id: agent.company_id,
    agent_id: id,
    actor_id: ctx.userId,
    actor_name: "Administrador",
    action_type: "agent.promoted_production",
    title: `Agente promovido a Produção (v${parsed.data.version})`,
    description: parsed.data.change_summary,
  });

  // Auditoria
  buildSanitizedAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    action: "agent.promoted_production",
    targetType: "agent",
    targetId: id,
    payload: {
      version: parsed.data.version,
      change_summary: parsed.data.change_summary,
      readiness_checklist: parsed.data.readiness_checklist,
    },
    correlationId,
  });

  logger.info("Agente promovido a produção com sucesso", {
    correlationId,
    agentId: id,
    version: parsed.data.version,
  });

  return apiSuccess({
    data: {
      agent: promotionResult.agent,
      version: promotionResult.versionRecord,
    },
    meta: { correlation_id: correlationId },
  });
}
