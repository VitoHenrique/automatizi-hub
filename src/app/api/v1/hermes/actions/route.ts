import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { companyRepository } from "@/lib/companies/store";
import { agentRepository } from "@/lib/agents/store";
import { operationsRepository } from "@/lib/operations/store";
import { HermesActionSchema } from "@/domain/types";
import { validateHermesAction } from "@/domain/hermes";
import { idempotencyManager, hashPayload } from "@/lib/api/idempotency";
import { buildSanitizedAuditEvent } from "@/lib/audit/audit-logger";
import { logger } from "@/lib/logger/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const idempotencyKey = req.headers.get("idempotency-key");
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  // 1. Checagem de Idempotência
  if (idempotencyKey) {
    const currentHash = hashPayload(rawBody);
    const existingRecord = idempotencyManager.findRecord(ctx.organizationId, idempotencyKey);

    if (existingRecord) {
      if (existingRecord.request_hash !== currentHash) {
        return NextResponse.json(
          {
            data: null,
            meta: { correlation_id: correlationId, timestamp: new Date().toISOString() },
            error: {
              code: "IDEMPOTENCY_CONFLICT",
              message: "Chave de idempotência já utilizada com um payload divergente.",
            },
          },
          { status: 409 }
        );
      }

      // Replay da resposta gravada
      return NextResponse.json(existingRecord.response_body, {
        status: existingRecord.response_status,
        headers: { "x-idempotent-replayed": "true" },
      });
    }
  }

  // 2. Validação de Schema da Ação
  const parsed = HermesActionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  const { company_id, agent_id, action_type, tool_name, reason, payload } = parsed.data;

  // 3. Validação das Regras Inegociáveis do Hermes (docs/11-hermes-contract.md)
  const validation = validateHermesAction(action_type, tool_name, payload);
  if (!validation.allowed) {
    return ApiErrors.FORBIDDEN(
      validation.reason || "Operação não autorizada pelo contrato do Hermes.",
      correlationId
    );
  }

  // Verificar se a empresa pertence ao tenant
  const company = companyRepository.findById(company_id, ctx.organizationId);
  if (!company) {
    return ApiErrors.NOT_FOUND("Empresa cliente vinculada", correlationId);
  }

  let actionResult: unknown = null;

  // 4. Execução da ação autorizada
  switch (action_type) {
    case "create_task": {
      const taskTitle = String(payload.title || "Nova tarefa sugerida pelo Hermes");
      const newTask = agentRepository.createTask({
        organization_id: ctx.organizationId,
        company_id,
        agent_id: agent_id || null,
        title: taskTitle,
        description: payload.description ? String(payload.description) : null,
        kind: (payload.kind as any) || "task",
        status: "todo",
        priority: (payload.priority as any) || "medium",
        assignee_id: null,
        assignee_name: "Hermes (Orquestrador)",
        due_date: payload.due_date ? String(payload.due_date) : null,
        completed_at: null,
      });
      actionResult = newTask;
      break;
    }

    case "update_task": {
      const taskId = String(payload.task_id);
      const newStatus = (payload.status as any) || "done";
      const updatedTask = agentRepository.updateTaskStatus(taskId, ctx.organizationId, newStatus);
      if (!updatedTask) {
        return ApiErrors.NOT_FOUND("Tarefa", correlationId);
      }
      actionResult = updatedTask;
      break;
    }

    case "record_execution": {
      if (!agent_id) {
        return ApiErrors.VALIDATION_ERROR({ agent_id: ["Obrigatório para registrar execução"] }, correlationId);
      }
      const newExecution = operationsRepository.createExecution({
        organization_id: ctx.organizationId,
        company_id,
        agent_id,
        agent_version: String(payload.agent_version || "1.0.0"),
        correlation_id: correlationId,
        status: (payload.status as any) || "success",
        started_at: String(payload.started_at || new Date().toISOString()),
        finished_at: new Date().toISOString(),
        duration_ms: Number(payload.duration_ms) || 500,
        cost_cents: Number(payload.cost_cents) || 0,
        input_summary: payload.input_summary ? String(payload.input_summary) : null,
        output_summary: payload.output_summary ? String(payload.output_summary) : null,
        error_message: payload.error_message ? String(payload.error_message) : null,
        meta: (payload.meta as Record<string, unknown>) || {},
      });
      actionResult = newExecution;
      break;
    }

    case "trigger_alert": {
      const newAlert = operationsRepository.createAlert({
        organization_id: ctx.organizationId,
        company_id,
        agent_id: agent_id || null,
        execution_id: null,
        incident_id: null,
        severity: (payload.severity as any) || "warning",
        title: String(payload.title || "Alerta emitido pelo Hermes"),
        description: payload.description ? String(payload.description) : null,
        status: "firing",
        acknowledged_at: null,
        acknowledged_by: null,
        resolved_at: null,
        resolved_by: null,
      });
      actionResult = newAlert;
      break;
    }

    case "suggest_next_action": {
      const nextActionText = String(payload.next_action || "");
      companyRepository.update(company_id, ctx.organizationId, {
        next_action: nextActionText,
      });
      actionResult = { company_id, next_action: nextActionText };
      break;
    }
  }

  // 5. Registro de Atividade Legível
  companyRepository.addActivity({
    organization_id: ctx.organizationId,
    company_id,
    agent_id: agent_id || null,
    actor_id: ctx.userId,
    actor_name: "Hermes (Orquestrador)",
    action_type: `hermes.${action_type}`,
    title: `Ação do Hermes: ${action_type}`,
    description: `Ferramenta: ${tool_name} | Motivo: ${reason}`,
  });

  // 6. Auditoria de Segurança
  buildSanitizedAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    actorType: "hermes",
    action: `hermes.action.${action_type}`,
    targetType: agent_id ? "agent" : "company",
    targetId: agent_id || company_id,
    payload: {
      tool_name,
      reason,
      action_type,
      payload,
    },
    correlationId,
  });

  const responsePayload = {
    data: {
      action_type,
      tool_name,
      reason,
      result: actionResult,
    },
    meta: { correlation_id: correlationId, timestamp: new Date().toISOString() },
    error: null,
  };

  // 7. Gravação de Idempotência
  if (idempotencyKey) {
    idempotencyManager.saveRecord(
      ctx.organizationId,
      idempotencyKey,
      hashPayload(rawBody),
      201,
      responsePayload
    );
  }

  return NextResponse.json(responsePayload, { status: 201 });
}
