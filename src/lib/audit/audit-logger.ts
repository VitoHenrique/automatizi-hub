import { sanitizeData } from "../logger/logger";
import { AuditEvent } from "@/domain/types";

export interface CreateAuditInput {
  organizationId: string;
  actorId?: string | null;
  actorType?: "user" | "service_agent" | "hermes" | "system";
  action: string;
  targetType: string;
  targetId?: string | null;
  payload?: Record<string, unknown>;
  ipAddress?: string | null;
  correlationId?: string | null;
}

/**
 * Prepara um registro de auditoria, garantindo que nenhum secret ou credencial
 * seja gravado no banco ou na telemetria.
 */
export function buildSanitizedAuditEvent(input: CreateAuditInput): Omit<AuditEvent, "id" | "created_at"> {
  const sanitizedPayload = sanitizeData(input.payload || {});

  return {
    organization_id: input.organizationId,
    actor_id: input.actorId || null,
    actor_type: input.actorType || "user",
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId || null,
    payload: sanitizedPayload,
    ip_address: input.ipAddress || null,
    correlation_id: input.correlationId || null,
  };
}
