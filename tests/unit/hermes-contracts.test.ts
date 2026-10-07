import { describe, it, expect } from "vitest";
import { validateHermesAction } from "@/domain/hermes";
import { hashPayload, idempotencyManager } from "@/lib/api/idempotency";

describe("Contrato Operacional e Restrições do Hermes (docs/11-hermes-contract.md)", () => {
  it("permite ações operacionais autorizadas de orquestração", () => {
    // 1. Criar tarefa
    const r1 = validateHermesAction("create_task", "hub_tasks_create", {
      title: "Verificar leads duplicados",
    });
    expect(r1.allowed).toBe(true);

    // 2. Atualizar status de tarefa
    const r2 = validateHermesAction("update_task", "hub_tasks_update", {
      task_id: "task-1",
      status: "done",
    });
    expect(r2.allowed).toBe(true);

    // 3. Registrar execução
    const r3 = validateHermesAction("record_execution", "hub_executions_record", {
      status: "success",
    });
    expect(r3.allowed).toBe(true);

    // 4. Emitir alerta
    const r4 = validateHermesAction("trigger_alert", "hub_alerts_create", {
      title: "Latência elevada detectada",
    });
    expect(r4.allowed).toBe(true);

    // 5. Sugerir próxima ação
    const r5 = validateHermesAction("suggest_next_action", "hub_company_action", {
      next_action: "Realizar call de alinhamento com closer",
    });
    expect(r5.allowed).toBe(true);
  });

  it("bloqueia estritamente ações financeiras, permissões e operações destrutivas", () => {
    // 1. Tentativa de apagar histórico
    const rDelete = validateHermesAction("delete_history", "delete_records_tool", {});
    expect(rDelete.allowed).toBe(false);
    expect(rDelete.reason).toContain("Violação da restrição");

    // 2. Tentativa de alterar permissões
    const rPerm = validateHermesAction("alter_permission", "update_role_tool", {});
    expect(rPerm.allowed).toBe(false);
    expect(rPerm.reason).toContain("Violação da restrição");

    // 3. Tentativa de transação financeira
    const rCharge = validateHermesAction("charge_customer", "financial_transfer", {});
    expect(rCharge.allowed).toBe(false);
    expect(rCharge.reason).toContain("Violação da restrição");
  });

  it("bloqueia estritamente tentativa do Hermes promover agentes a produção", () => {
    const rPromoteTool = validateHermesAction("promote_production", "promote_agent", {});
    expect(rPromoteTool.allowed).toBe(false);

    const rPromotePayload = validateHermesAction("update_task", "hub_tasks_update", {
      lifecycle_status: "producao",
    });
    expect(rPromotePayload.allowed).toBe(false);
    expect(rPromotePayload.reason).toContain("não possui autorização para promover agentes a produção");
  });

  it("valida hash de idempotência consistente para payloads idênticos e divergentes", () => {
    const payloadA = { company_id: "comp-1", title: "Tarefa A", priority: "high" };
    const payloadA_same = { company_id: "comp-1", title: "Tarefa A", priority: "high" };
    const payloadB = { company_id: "comp-1", title: "Tarefa B", priority: "low" };

    expect(hashPayload(payloadA)).toBe(hashPayload(payloadA_same));
    expect(hashPayload(payloadA)).not.toBe(hashPayload(payloadB));
  });

  it("gerencia registros de idempotência com expiração e isolamento de tenant", () => {
    idempotencyManager.resetForTests();
    const orgId = "11111111-1111-1111-1111-111111111111";
    const key = "test-idem-key-1";

    expect(idempotencyManager.findRecord(orgId, key)).toBeNull();

    idempotencyManager.saveRecord(orgId, key, "hash-123", 201, { success: true });
    const found = idempotencyManager.findRecord(orgId, key);
    expect(found).not.toBeNull();
    expect(found?.request_hash).toBe("hash-123");
    expect(found?.response_status).toBe(201);

    // Outro tenant não enxerga a chave do primeiro tenant
    expect(idempotencyManager.findRecord("other-org-id", key)).toBeNull();
  });
});
