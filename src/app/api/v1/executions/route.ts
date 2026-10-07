import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { operationsRepository } from "@/lib/operations/store";
import { agentRepository } from "@/lib/agents/store";
import { companyRepository } from "@/lib/companies/store";
import { CreateExecutionSchema } from "@/domain/types";
import { buildSanitizedAuditEvent } from "@/lib/audit/audit-logger";
import { logger, sanitizeData } from "@/lib/logger/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "execution:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para consultar execuções.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") || undefined;
  const agentId = searchParams.get("agent_id") || undefined;
  const status = searchParams.get("status") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

  let executions = operationsRepository.listExecutions(ctx.organizationId, {
    companyId,
    agentId,
    status,
    limit,
  });

  // Aplicar restrição de escopo de membership
  if (ctx.scope === "company" && ctx.resourceId) {
    executions = executions.filter((e) => e.company_id === ctx.resourceId);
  } else if (ctx.scope === "agent" && ctx.resourceId) {
    executions = executions.filter((e) => e.agent_id === ctx.resourceId);
  }

  logger.info("Execuções consultadas", {
    correlationId,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    total: executions.length,
  });

  return apiSuccess({
    data: executions,
    meta: {
      total: executions.length,
      correlation_id: correlationId,
    },
  });
}

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "execution:trigger")) {
    return ApiErrors.FORBIDDEN("Sem permissão para acionar ou registrar execuções.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateExecutionSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  // Validar se o agente e a empresa pertencem ao tenant
  const agent = agentRepository.findById(parsed.data.agent_id, ctx.organizationId);
  if (!agent) {
    return ApiErrors.NOT_FOUND("Agente", correlationId);
  }

  const now = new Date().toISOString();
  const startedAt = parsed.data.started_at || now;
  const finishedAt = parsed.data.finished_at || (parsed.data.status !== "running" ? now : null);
  const durationMs =
    parsed.data.duration_ms ??
    (finishedAt ? Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime()) : null);

  // Sanitização de mensagem de erro e metadados contra vazamento de secrets
  const sanitizedMeta = sanitizeData(parsed.data.meta);
  const sanitizedError = parsed.data.error_message
    ? sanitizeData(parsed.data.error_message)
    : null;

  const newExecution = operationsRepository.createExecution({
    organization_id: ctx.organizationId,
    company_id: agent.company_id,
    agent_id: agent.id,
    agent_version: parsed.data.agent_version || agent.current_version,
    correlation_id: parsed.data.correlation_id || correlationId,
    status: parsed.data.status,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: durationMs,
    cost_cents: parsed.data.cost_cents || 0,
    input_summary: parsed.data.input_summary || null,
    output_summary: parsed.data.output_summary || null,
    error_message: sanitizedError,
    meta: sanitizedMeta,
  });

  // Se falhou, gerar alerta automático caso seja um erro crítico
  if (parsed.data.status === "failed" || parsed.data.status === "timeout") {
    operationsRepository.createAlert({
      organization_id: ctx.organizationId,
      company_id: agent.company_id,
      agent_id: agent.id,
      execution_id: newExecution.id,
      incident_id: null,
      severity: parsed.data.status === "timeout" ? "warning" : "critical",
      title: `Falha na execução de ${agent.name}`,
      description: sanitizedError || `A execução finalizou com status '${parsed.data.status}'.`,
      status: "firing",
      acknowledged_at: null,
      acknowledged_by: null,
      resolved_at: null,
      resolved_by: null,
    });
  }

  // Registrar atividade legível
  companyRepository.addActivity({
    organization_id: ctx.organizationId,
    company_id: agent.company_id,
    agent_id: agent.id,
    actor_id: ctx.userId,
    actor_name: ctx.role === "service_agent" ? `Agente (${agent.name})` : "Operador",
    action_type: `execution.${parsed.data.status}`,
    title: `Execução ${parsed.data.status.toUpperCase()} de ${agent.name}`,
    description: parsed.data.output_summary || parsed.data.input_summary || null,
  });

  return apiSuccess({
    data: newExecution,
    meta: { correlation_id: correlationId },
    status: 201,
  });
}
