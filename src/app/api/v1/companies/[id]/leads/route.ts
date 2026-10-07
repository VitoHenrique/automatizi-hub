import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { companyRepository } from "@/lib/companies/store";
import { dbxStore } from "@/lib/dbx/store";
import { dbxPilotService } from "@/lib/dbx/pilot-service";
import { CreateLeadSchema, LeadStatus } from "@/domain/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);
  const { id: companyId } = await params;

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "lead:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para visualizar leads.", correlationId);
  }

  const company = companyRepository.findById(companyId, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa cliente", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") as LeadStatus) || undefined;
  const closerId = searchParams.get("closer_id") || undefined;
  const query = searchParams.get("q") || undefined;

  const leads = dbxStore.getLeads(ctx.organizationId, companyId, {
    status,
    closer_id: closerId,
    query,
  });

  return apiSuccess({
    data: leads,
    meta: {
      total: leads.length,
      correlation_id: correlationId,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);
  const { id: companyId } = await params;

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "lead:manage")) {
    return ApiErrors.FORBIDDEN("Sem permissão para gerenciar leads.", correlationId);
  }

  const company = companyRepository.findById(companyId, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa cliente", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateLeadSchema.safeParse({ ...body, company_id: companyId });
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  try {
    // Processa lead pelo pipeline piloto DBX
    const result = await dbxPilotService.processIncomingMetaLead({
      organizationId: ctx.organizationId,
      companyId,
      rawPayload: {
        leadgen_id: parsed.data.external_lead_id || `lead-${Date.now()}`,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        campaign_name: parsed.data.campaign_name,
        ...parsed.data.payload_raw,
      },
      correlationId,
    });

    return apiSuccess({
      data: result.lead,
      meta: {
        correlation_id: correlationId,
      },
      status: 201,
    });
  } catch {
    return ApiErrors.INTERNAL_ERROR(correlationId);
  }
}
