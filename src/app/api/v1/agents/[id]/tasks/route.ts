import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { agentRepository } from "@/lib/agents/store";
import { CreateTaskSchema, TaskStatusSchema } from "@/domain/types";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateTaskStatusSchema = z.object({
  task_id: z.string(),
  status: TaskStatusSchema,
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "task:view", { type: "agent", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para listar tarefas deste agente.", correlationId);
  }

  const tasks = agentRepository.getTasks(id, ctx.organizationId);

  return apiSuccess({
    data: tasks,
    meta: {
      total: tasks.length,
      correlation_id: correlationId,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "task:create", { type: "agent", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para criar tarefas para este agente.", correlationId);
  }

  const agent = agentRepository.findById(id, ctx.organizationId);
  if (!agent) {
    return ApiErrors.NOT_FOUND("Agente", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateTaskSchema.safeParse({
    ...body,
    company_id: agent.company_id,
    agent_id: id,
  });

  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  const newTask = agentRepository.createTask({
    organization_id: ctx.organizationId,
    company_id: agent.company_id,
    agent_id: id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    kind: parsed.data.kind,
    status: parsed.data.status,
    priority: parsed.data.priority,
    assignee_id: ctx.userId,
    assignee_name: parsed.data.assignee_name || "Operador",
    due_date: parsed.data.due_date || null,
    completed_at: parsed.data.status === "done" ? new Date().toISOString() : null,
  });

  return apiSuccess({
    data: newTask,
    meta: { correlation_id: correlationId },
    status: 201,
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
  if (!hasPermission(ctx, "task:edit", { type: "agent", id })) {
    return ApiErrors.FORBIDDEN("Sem permissão para alterar tarefas deste agente.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = UpdateTaskStatusSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  const updatedTask = agentRepository.updateTaskStatus(
    parsed.data.task_id,
    ctx.organizationId,
    parsed.data.status
  );

  if (!updatedTask) {
    return ApiErrors.NOT_FOUND("Tarefa", correlationId);
  }

  return apiSuccess({
    data: updatedTask,
    meta: { correlation_id: correlationId },
  });
}
