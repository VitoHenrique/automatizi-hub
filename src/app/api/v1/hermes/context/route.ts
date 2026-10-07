import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { companyRepository } from "@/lib/companies/store";
import { agentRepository } from "@/lib/agents/store";
import { operationsRepository } from "@/lib/operations/store";
import { hermesRepository } from "@/lib/hermes/store";
import { HermesContextResponse } from "@/domain/types";
import { logger } from "@/lib/logger/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  // Hermes precisa ter permissão para ver empresas e agentes
  if (!hasPermission(ctx, "company:view") || !hasPermission(ctx, "agent:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para consultar contexto operacional do Hermes.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id");

  if (!companyId) {
    return ApiErrors.VALIDATION_ERROR(
      { company_id: ["Parâmetro 'company_id' é obrigatório para obter contexto operacional."] },
      correlationId
    );
  }

  const company = companyRepository.findById(companyId, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa cliente vinculada", correlationId);
  }

  const agents = agentRepository.list(ctx.organizationId, companyId);
  const allTasks = agents.flatMap((a) => agentRepository.getTasks(a.id, ctx.organizationId));
  const openTasks = allTasks.filter((t) => t.status !== "done");
  const alerts = operationsRepository.listAlerts(ctx.organizationId, {
    companyId,
    status: "firing",
  });
  const integrations = hermesRepository.listIntegrations(ctx.organizationId, companyId);

  const contextData: HermesContextResponse = {
    organization: {
      id: ctx.organizationId,
      name: "Automatizi Headquarters",
      slug: "automatizi-hq",
    },
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      lifecycle_status: company.lifecycle_status,
      health: company.health,
      connected_systems: company.connected_systems,
      next_action: company.next_action,
    },
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      lifecycle_status: a.lifecycle_status,
      health: a.health,
      current_version: a.current_version,
      accessed_systems: a.accessed_systems,
    })),
    open_tasks: openTasks.map((t) => ({
      id: t.id,
      title: t.title,
      kind: t.kind,
      priority: t.priority,
      agent_id: t.agent_id,
    })),
    active_alerts: alerts.map((al) => ({
      id: al.id,
      title: al.title,
      severity: al.severity,
      agent_id: al.agent_id,
    })),
    integrations: integrations.map((i) => ({
      provider: i.provider,
      name: i.name,
      status: i.status,
      last_sync_at: i.last_sync_at,
    })),
    correlation_id: correlationId,
  };

  logger.info("Contexto do Hermes consultado", {
    correlationId,
    userId: ctx.userId,
    companyId,
    totalAgents: agents.length,
    openTasksCount: openTasks.length,
  });

  return apiSuccess({
    data: contextData,
    meta: { correlation_id: correlationId },
  });
}
