import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { operationsRepository } from "@/lib/operations/store";
import { agentRepository } from "@/lib/agents/store";
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
  if (!hasPermission(ctx, "execution:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para consultar detalhes de execução.", correlationId);
  }

  const execution = operationsRepository.findExecutionById(id, ctx.organizationId);
  if (!execution) {
    return ApiErrors.NOT_FOUND("Execução", correlationId);
  }

  const agent = agentRepository.findById(execution.agent_id, ctx.organizationId);
  const company = companyRepository.findById(execution.company_id, ctx.organizationId);

  return apiSuccess({
    data: {
      ...execution,
      agent_name: agent?.name || "Agente",
      company_name: company?.name || "Empresa",
    },
    meta: { correlation_id: correlationId },
  });
}
