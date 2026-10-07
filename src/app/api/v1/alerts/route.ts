import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { operationsRepository } from "@/lib/operations/store";
import { companyRepository } from "@/lib/companies/store";
import { CreateAlertSchema } from "@/domain/types";
import { logger } from "@/lib/logger/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "alert:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para consultar alertas.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") || undefined;
  const agentId = searchParams.get("agent_id") || undefined;
  const status = searchParams.get("status") || undefined;
  const severity = searchParams.get("severity") || undefined;

  let alerts = operationsRepository.listAlerts(ctx.organizationId, {
    companyId,
    agentId,
    status,
    severity,
  });

  // Aplicar restrição de escopo de membership
  if (ctx.scope === "company" && ctx.resourceId) {
    alerts = alerts.filter((a) => a.company_id === ctx.resourceId);
  } else if (ctx.scope === "agent" && ctx.resourceId) {
    alerts = alerts.filter((a) => a.agent_id === ctx.resourceId);
  }

  logger.info("Alertas consultados", {
    correlationId,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    total: alerts.length,
  });

  return apiSuccess({
    data: alerts,
    meta: {
      total: alerts.length,
      correlation_id: correlationId,
    },
  });
}

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "alert:manage")) {
    return ApiErrors.FORBIDDEN("Sem permissão para criar alertas.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateAlertSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  const company = companyRepository.findById(parsed.data.company_id, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa cliente vinculada", correlationId);
  }

  const newAlert = operationsRepository.createAlert({
    organization_id: ctx.organizationId,
    company_id: parsed.data.company_id,
    agent_id: parsed.data.agent_id || null,
    execution_id: parsed.data.execution_id || null,
    incident_id: null,
    severity: parsed.data.severity,
    title: parsed.data.title,
    description: parsed.data.description || null,
    status: "firing",
    acknowledged_at: null,
    acknowledged_by: null,
    resolved_at: null,
    resolved_by: null,
  });

  return apiSuccess({
    data: newAlert,
    meta: { correlation_id: correlationId },
    status: 201,
  });
}
