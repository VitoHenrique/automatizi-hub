import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { companyRepository } from "@/lib/companies/store";
import { calculateOnboardingProgress } from "@/domain/company-lifecycle";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ToggleStepSchema = z.object({
  step_id: z.string(),
  is_completed: z.boolean(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "company:view", { type: "company", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para visualizar onboarding desta empresa.", correlationId);
  }

  const steps = companyRepository.getOnboardingSteps(id, ctx.organizationId);
  const progress = calculateOnboardingProgress(steps);

  return apiSuccess({
    data: {
      steps,
      progress,
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
  if (!hasPermission(ctx, "company:edit", { type: "company", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para alterar etapas de onboarding.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON inválido" }, correlationId);
  }

  const parsed = ToggleStepSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  const updatedStep = companyRepository.toggleOnboardingStep(
    parsed.data.step_id,
    id,
    ctx.organizationId,
    parsed.data.is_completed,
    ctx.userId
  );

  if (!updatedStep) {
    return ApiErrors.NOT_FOUND("Etapa de onboarding", correlationId);
  }

  // Se completou, registra atividade
  companyRepository.addActivity({
    organization_id: ctx.organizationId,
    company_id: id,
    actor_id: ctx.userId,
    actor_name: "Operador",
    action_type: "onboarding.step_toggled",
    title: `Etapa de onboarding ${parsed.data.is_completed ? "concluída" : "reaberta"}`,
    description: `Etapa: ${updatedStep.step_title}`,
  });

  const allSteps = companyRepository.getOnboardingSteps(id, ctx.organizationId);
  const progress = calculateOnboardingProgress(allSteps);

  return apiSuccess({
    data: {
      step: updatedStep,
      progress,
    },
    meta: { correlation_id: correlationId },
  });
}
