import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { agentRepository } from "@/lib/agents/store";
import { companyRepository } from "@/lib/companies/store";
import { UpdateAgentSchema } from "@/domain/types";
import { validateAgentLifecycleTransition } from "@/domain/lifecycle";
import { buildSanitizedAuditEvent } from "@/lib/audit/audit-logger";
import { logger } from "@/lib/logger/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "agent:view", { type: "agent", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para visualizar este agente.", correlationId);
  }

  const agent = agentRepository.findById(id, ctx.organizationId);
  if (!agent) {
    return ApiErrors.NOT_FOUND("Agente", correlationId);
  }

  const company = companyRepository.findById(agent.company_id, ctx.organizationId);
  const versions = agentRepository.getVersions(id, ctx.organizationId);
  const tasks = agentRepository.getTasks(id, ctx.organizationId);

  return apiSuccess({
    data: {
      ...agent,
      company_name: company?.name || "Empresa Vinculada",
      versions,
      tasks,
    },
    meta: { correlation_id: correlationId },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "agent:edit", { type: "agent", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para editar este agente.", correlationId);
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

  const parsed = UpdateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  // Validação de transição de ciclo de vida
  if (parsed.data.lifecycle_status && parsed.data.lifecycle_status !== agent.lifecycle_status) {
    if (parsed.data.lifecycle_status === "producao") {
      return ApiErrors.VALIDATION_ERROR(
        {
          lifecycle_status: [
            "Para promover o agente a produção, utilize o endpoint formal /promote com o checklist completo de prontidão.",
          ],
        },
        correlationId
      );
    }

    const transitionResult = validateAgentLifecycleTransition(
      agent.lifecycle_status,
      parsed.data.lifecycle_status
    );
    if (!transitionResult.allowed) {
      return ApiErrors.VALIDATION_ERROR(
        { lifecycle_status: [transitionResult.reason || "Transição inválida"] },
        correlationId
      );
    }
  }

  const updated = agentRepository.update(id, ctx.organizationId, parsed.data);
  if (!updated) {
    return ApiErrors.INTERNAL_ERROR(correlationId);
  }

  // Auditoria
  buildSanitizedAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    action: "agent.updated",
    targetType: "agent",
    targetId: id,
    payload: parsed.data,
    correlationId,
  });

  logger.info("Agente atualizado com sucesso", { correlationId, agentId: id });

  return apiSuccess({
    data: updated,
    meta: { correlation_id: correlationId },
  });
}
