import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { companyRepository } from "@/lib/companies/store";
import { UpdateCompanySchema } from "@/domain/types";
import { validateCompanyLifecycleTransition, calculateOnboardingProgress } from "@/domain/company-lifecycle";
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

  if (!ctx) {
    return ApiErrors.UNAUTHORIZED(correlationId);
  }

  if (!hasPermission(ctx, "company:view", { type: "company", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para visualizar esta empresa.", correlationId);
  }

  const company = companyRepository.findById(id, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa", correlationId);
  }

  const onboardingSteps = companyRepository.getOnboardingSteps(id, ctx.organizationId);
  const onboardingProgress = calculateOnboardingProgress(onboardingSteps);
  const activities = companyRepository.getActivities(id, ctx.organizationId);

  return apiSuccess({
    data: {
      ...company,
      onboarding_progress: onboardingProgress,
      onboarding_steps: onboardingSteps,
      recent_activities: activities.slice(0, 5),
      agents_summary: {
        total: company.is_demo ? 3 : 0,
        in_production: company.is_demo ? 1 : 0,
        with_alerts: 0,
      },
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

  if (!ctx) {
    return ApiErrors.UNAUTHORIZED(correlationId);
  }

  if (!hasPermission(ctx, "company:edit", { type: "company", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para atualizar dados desta empresa.", correlationId);
  }

  const company = companyRepository.findById(id, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = UpdateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  // Validação de transição de ciclo de vida se houver alteração de status
  if (parsed.data.lifecycle_status && parsed.data.lifecycle_status !== company.lifecycle_status) {
    const transitionCheck = validateCompanyLifecycleTransition(
      company.lifecycle_status,
      parsed.data.lifecycle_status
    );
    if (!transitionCheck.allowed) {
      return ApiErrors.VALIDATION_ERROR(
        { lifecycle_status: [transitionCheck.reason || "Transição inválida"] },
        correlationId
      );
    }
  }

  const updated = companyRepository.update(id, ctx.organizationId, parsed.data);
  if (!updated) {
    return ApiErrors.INTERNAL_ERROR(correlationId);
  }

  // Registrar atividade legível
  companyRepository.addActivity({
    organization_id: ctx.organizationId,
    company_id: id,
    actor_id: ctx.userId,
    actor_name: "Operador",
    action_type: "company.updated",
    title: "Dados da empresa atualizados",
    description: `Campos modificados: ${Object.keys(parsed.data).join(", ")}`,
  });

  // Auditoria
  buildSanitizedAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    action: "company.updated",
    targetType: "company",
    targetId: id,
    payload: parsed.data,
    correlationId,
  });

  logger.info("Empresa atualizada com sucesso", { correlationId, companyId: id });

  return apiSuccess({
    data: updated,
    meta: { correlation_id: correlationId },
  });
}
