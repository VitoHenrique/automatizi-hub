import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { operationsRepository } from "@/lib/operations/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "metric:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para visualizar métricas operacionais.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") || undefined;
  const agentId = searchParams.get("agent_id") || undefined;

  const metrics = operationsRepository.getMetricsSummary(ctx.organizationId, {
    companyId: ctx.scope === "company" && ctx.resourceId ? ctx.resourceId : companyId,
    agentId: ctx.scope === "agent" && ctx.resourceId ? ctx.resourceId : agentId,
  });

  return apiSuccess({
    data: metrics,
    meta: { correlation_id: correlationId },
  });
}
