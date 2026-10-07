import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { companyRepository } from "@/lib/companies/store";
import { CreateCompanySchema } from "@/domain/types";
import { buildSanitizedAuditEvent } from "@/lib/audit/audit-logger";
import { logger } from "@/lib/logger/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) {
    return ApiErrors.UNAUTHORIZED(correlationId);
  }

  // Verifica permissão para visualizar empresas
  if (!hasPermission(ctx, "company:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para listar empresas.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  let companies = companyRepository.list(ctx.organizationId, statusFilter, search);

  // Se o usuário possui escopo restrito a uma empresa específica
  if (ctx.scope === "company" && ctx.resourceId) {
    companies = companies.filter((c) => c.id === ctx.resourceId);
  }

  logger.info("Listagem de empresas consultada", {
    correlationId,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    total: companies.length,
  });

  return apiSuccess({
    data: companies,
    meta: {
      total: companies.length,
      correlation_id: correlationId,
    },
  });
}

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) {
    return ApiErrors.UNAUTHORIZED(correlationId);
  }

  // Apenas quem tem permissão company:create (owner, admin)
  if (!hasPermission(ctx, "company:create")) {
    return ApiErrors.FORBIDDEN("Apenas administradores podem cadastrar novas empresas.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  // Checar unicidade do slug dentro do mesmo tenant
  const existing = companyRepository.findBySlug(parsed.data.slug, ctx.organizationId);
  if (existing) {
    return ApiErrors.VALIDATION_ERROR(
      { slug: ["Uma empresa com este identificador (slug) já existe nesta organização."] },
      correlationId
    );
  }

  const newCompany = companyRepository.create({
    organization_id: ctx.organizationId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    sector: parsed.data.sector,
    lifecycle_status: "onboarding",
    health: "sem_dados",
    objectives: parsed.data.objectives || null,
    contracted_scope: parsed.data.contracted_scope || null,
    primary_contact_name: parsed.data.primary_contact_name || null,
    primary_contact_email: parsed.data.primary_contact_email || null,
    connected_systems: parsed.data.connected_systems,
    next_action: parsed.data.next_action || "Completar diagnóstico inicial e mapeamento de sistemas",
    is_demo: parsed.data.is_demo,
    owner_id: ctx.userId,
    owner_name: "Operador Responsável",
    risks: null,
    next_review_date: null,
    archived_at: null,
  });

  // Registrar atividade legível
  companyRepository.addActivity({
    organization_id: ctx.organizationId,
    company_id: newCompany.id,
    actor_id: ctx.userId,
    actor_name: "Operador",
    action_type: "company.created",
    title: "Nova empresa cadastrada",
    description: `Empresa ${newCompany.name} cadastrada com status inicial de Onboarding.`,
  });

  // Registrar evento de auditoria imutável
  buildSanitizedAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    actorType: "user",
    action: "company.created",
    targetType: "company",
    targetId: newCompany.id,
    payload: { name: newCompany.name, slug: newCompany.slug, sector: newCompany.sector },
    correlationId,
  });

  logger.info("Empresa criada com sucesso", {
    correlationId,
    companyId: newCompany.id,
    name: newCompany.name,
  });

  return apiSuccess({
    data: newCompany,
    meta: { correlation_id: correlationId },
    status: 201,
  });
}
