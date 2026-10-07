import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { buildSanitizedAuditEvent } from "@/lib/audit/audit-logger";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateOrgRequestSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas e números separados por hífen"),
});

interface MockOrg {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Mock in-memory state para testes e ambiente de desenvolvimento (Fase 0)
const mockOrganizations: MockOrg[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Automatizi Headquarters",
    slug: "automatizi-hq",
    status: "active",
    settings: { timezone: "America/Sao_Paulo" },
    created_at: "2026-10-07T12:00:00.000Z",
    updated_at: "2026-10-07T12:00:00.000Z",
  },
];

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) {
    return ApiErrors.UNAUTHORIZED(correlationId);
  }

  // Apenas retorna as organizações às quais o usuário tem acesso legítimo
  const tenantOrgs = mockOrganizations.filter((org) => org.id === ctx.organizationId);

  logger.info("Listagem de organizações consultada", {
    correlationId,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
  });

  return apiSuccess({
    data: tenantOrgs,
    meta: {
      total: tenantOrgs.length,
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

  // Apenas donos e admins podem criar organizações
  if (!hasPermission(ctx, "org:manage")) {
    return ApiErrors.FORBIDDEN("Apenas donos e administradores podem criar novas organizações.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateOrgRequestSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  const newOrg: MockOrg = {
    id: crypto.randomUUID(),
    name: parsed.data.name,
    slug: parsed.data.slug,
    status: "active",
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockOrganizations.push(newOrg);

  // Registro de auditoria obrigatório para mutações
  const auditEvent = buildSanitizedAuditEvent({
    organizationId: newOrg.id,
    actorId: ctx.userId,
    actorType: "user",
    action: "organization.created",
    targetType: "organization",
    targetId: newOrg.id,
    payload: { name: newOrg.name, slug: newOrg.slug },
    correlationId,
  });

  logger.info("Nova organização criada com sucesso", {
    correlationId,
    targetId: newOrg.id,
    action: auditEvent.action,
  });

  return apiSuccess({
    data: newOrg,
    meta: { correlation_id: correlationId },
    status: 201,
  });
}
