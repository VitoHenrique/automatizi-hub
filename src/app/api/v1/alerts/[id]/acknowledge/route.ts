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
    return ApiErrors.FORBIDDEN("Sem permissão para reconhecer alertas.", correlationId);
  }

  const updated = operationsRepository.acknowledgeAlert(id, ctx.organizationId, ctx.userId);
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
    action_type: "alert.acknowledged",
    title: `Alerta reconhecido: ${updated.title}`,
    description: "Operador confirmou ciência do alerta.",
  });

  return apiSuccess({
    data: updated,
    meta: { correlation_id: correlationId },
  });
}
