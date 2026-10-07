import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { companyRepository } from "@/lib/companies/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "company:view", { type: "company", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para visualizar atividades desta empresa.", correlationId);
  }

  const activities = companyRepository.getActivities(id, ctx.organizationId);

  return apiSuccess({
    data: activities,
    meta: {
      total: activities.length,
      correlation_id: correlationId,
    },
  });
}
