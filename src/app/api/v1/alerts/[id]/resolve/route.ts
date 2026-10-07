import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { operationsRepository } from "@/lib/operations/store";
import { companyRepository } from "@/lib/companies/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "alert:manage")) {
    return ApiErrors.FORBIDDEN("Sem permissão para resolver alertas.", correlationId);
  }

  const updated = operationsRepository.resolveAlert(id, ctx.organizationId, ctx.userId);
  if (!updated) {
    return ApiErrors.NOT_FOUND("Alerta", correlationId);
  }

  // Atividade legível
  companyRepository.addActivity({
    organization_id: ctx.organizationId,
    company_id: updated.company_id,
    agent_id: updated.agent_id || null,
    actor_id: ctx.userId,
    actor_name: "Operador",
    action_type: "alert.resolved",
    title: `Alerta resolvido: ${updated.title}`,
    description: "Operador marcou o alerta como mitigado e resolvido.",
  });

  return apiSuccess({
    data: updated,
    meta: { correlation_id: correlationId },
  });
}
