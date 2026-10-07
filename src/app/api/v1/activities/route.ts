import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { companyRepository } from "@/lib/companies/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "company:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para consultar atividades da organização.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

  const activities = companyRepository.listAllActivities(ctx.organizationId, limit);

  return apiSuccess({
    data: activities,
    meta: {
      total: activities.length,
      correlation_id: correlationId,
    },
  });
}
