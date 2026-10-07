import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { hermesRepository } from "@/lib/hermes/store";
import { CreateIntegrationSchema } from "@/domain/types";
import { companyRepository } from "@/lib/companies/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "integration:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para consultar integrações.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") || undefined;

  const integrations = hermesRepository.listIntegrations(ctx.organizationId, companyId);

  return apiSuccess({
    data: integrations,
    meta: { total: integrations.length, correlation_id: correlationId },
  });
}

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "integration:configure")) {
    return ApiErrors.FORBIDDEN("Sem permissão para configurar integrações.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateIntegrationSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  if (parsed.data.company_id) {
    const comp = companyRepository.findById(parsed.data.company_id, ctx.organizationId);
    if (!comp) {
      return ApiErrors.NOT_FOUND("Empresa cliente vinculada", correlationId);
    }
  }

  const newIntegration = hermesRepository.createIntegration({
    organization_id: ctx.organizationId,
    company_id: parsed.data.company_id || null,
    provider: parsed.data.provider,
    name: parsed.data.name,
    status: "connected",
    last_sync_at: new Date().toISOString(),
    error_details: null,
    config: parsed.data.config || {},
  });

  return apiSuccess({
    data: newIntegration,
    meta: { correlation_id: correlationId },
    status: 201,
  });
}
