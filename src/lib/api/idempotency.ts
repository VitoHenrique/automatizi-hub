import crypto from "crypto";

export interface IdempotencyRecord {
  id: string;
  organization_id: string;
  idempotency_key: string;
  request_hash: string;
  response_status: number;
  response_body: unknown;
  created_at: string;
  expires_at: string;
}

let idempotencyStore: IdempotencyRecord[] = [];

/**
 * Calcula o hash SHA-256 do payload da requisição para verificar consistência.
 */
export function hashPayload(payload: unknown): string {
  const serialized = JSON.stringify(payload || {});
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

export const idempotencyManager = {
  /**
   * Consulta se já existe um resultado para esta chave e tenant.
   */
  findRecord(orgId: string, idempotencyKey: string): IdempotencyRecord | null {
    const now = new Date().toISOString();
    const found = idempotencyStore.find(
      (r) => r.organization_id === orgId && r.idempotency_key === idempotencyKey
    );
    if (!found) return null;

    // Verificar expiração (24h)
    if (new Date(found.expires_at) < new Date(now)) {
      idempotencyStore = idempotencyStore.filter((r) => r.id !== found.id);
      return null;
    }

    return found;
  },

  /**
   * Registra a resposta para a chave de idempotência.
   */
  saveRecord(
    orgId: string,
    idempotencyKey: string,
    requestHash: string,
    status: number,
    body: unknown
  ): IdempotencyRecord {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const record: IdempotencyRecord = {
      id: crypto.randomUUID(),
      organization_id: orgId,
      idempotency_key: idempotencyKey,
      request_hash: requestHash,
      response_status: status,
      response_body: body,
      created_at: now.toISOString(),
      expires_at: expiresAt,
    };

    // Remove eventual registro antigo duplicado
    idempotencyStore = idempotencyStore.filter(
      (r) => !(r.organization_id === orgId && r.idempotency_key === idempotencyKey)
    );
    idempotencyStore.push(record);
    return record;
  },

  resetForTests() {
    idempotencyStore = [];
  },
};
