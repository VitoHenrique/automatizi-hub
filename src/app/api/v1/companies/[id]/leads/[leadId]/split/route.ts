import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { companyRepository } from "@/lib/companies/store";
import { dbxPilotService } from "@/lib/dbx/pilot-service";
import { dbxStore } from "@/lib/dbx/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; leadId: string }> }
) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);
  const { id: companyId, leadId } = await params;

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "lead:manage")) {
    return ApiErrors.FORBIDDEN("Sem permissão para reatribuir leads.", correlationId);
  }

  const company = companyRepository.findById(companyId, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa cliente", correlationId);
  }

  const lead = dbxStore.getLeadById(leadId, ctx.organizationId);
  if (!lead || lead.company_id !== companyId) {
    return ApiErrors.NOT_FOUND("Lead", correlationId);
  }

  try {
    const assignment = dbxPilotService.manualSplit(leadId, ctx.organizationId);
    const updatedLead = dbxStore.getLeadById(leadId, ctx.organizationId);

    return apiSuccess({
      data: {
        assignment,
        lead: updatedLead,
      },
      meta: {
        correlation_id: correlationId,
      },
    });
  } catch (error: any) {
    return ApiErrors.VALIDATION_ERROR(
      { split: error?.message || "Não foi possível distribuir o lead." },
      correlationId
    );
  }
}
