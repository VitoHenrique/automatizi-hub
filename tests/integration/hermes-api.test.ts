import { describe, it, expect, beforeEach } from "vitest";
import { GET as contextGet } from "@/app/api/v1/hermes/context/route";
import { POST as actionPost } from "@/app/api/v1/hermes/actions/route";
import { GET as healthGet } from "@/app/api/v1/hermes/health/route";
import { GET as integrationsGet, POST as integrationsPost } from "@/app/api/v1/integrations/route";
import {
  GET as apiKeysGet,
  POST as apiKeysPost,
  DELETE as apiKeysDelete,
} from "@/app/api/v1/api-keys/route";
import {
  hermesRepository,
  DEMO_HERMES_API_KEY,
} from "@/lib/hermes/store";
import { idempotencyManager } from "@/lib/api/idempotency";
import { agentRepository, AGENT_GESTOR_TRAFEGO_ID } from "@/lib/agents/store";
import { companyRepository } from "@/lib/companies/store";
import { operationsRepository } from "@/lib/operations/store";
import { NextRequest } from "next/server";

describe("API do Hermes, Service Identity e Idempotência (Fase 4)", () => {
  const hermesHeaders = {
    authorization: `Bearer ${DEMO_HERMES_API_KEY}`,
    "x-correlation-id": "test-hermes-corr-01",
  };

  const adminHeaders = {
    "x-user-id": "00000000-0000-0000-0000-000000000001",
    "x-organization-id": "11111111-1111-1111-1111-111111111111",
    "x-user-role": "admin",
    "x-correlation-id": "test-admin-corr-01",
  };

  beforeEach(() => {
    hermesRepository.resetForTests();
    idempotencyManager.resetForTests();
    agentRepository.resetForTests();
    companyRepository.resetForTests();
    operationsRepository.resetForTests();
  });

  it("permite ao Hermes autenticar via API Key e consultar contexto operacional autorizado", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/v1/hermes/context?company_id=22222222-2222-2222-2222-222222222222",
      { headers: hermesHeaders }
    );

    const res = await contextGet(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.company.name).toBe("DBX Global");
    expect(json.data.agents.length).toBeGreaterThanOrEqual(3);
    expect(json.data.open_tasks.length).toBeGreaterThanOrEqual(1);
    expect(json.data.active_alerts.length).toBeGreaterThanOrEqual(1);
    expect(json.data.integrations.length).toBeGreaterThanOrEqual(3);

    // Garantir que nenhum segredo/token foi vazado
    const serialized = JSON.stringify(json.data);
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("api_key");
  });

  it("executa ação autorizada do Hermes (create_task) com suporte a idempotência e re-envio", async () => {
    const idemKey = "hermes-task-idem-key-101";

    const payload = {
      company_id: "22222222-2222-2222-2222-222222222222",
      agent_id: AGENT_GESTOR_TRAFEGO_ID,
      action_type: "create_task",
      tool_name: "hub_task_creator",
      reason: "Identificado anúncio com alto CTR necessitando de novo criativo",
      payload: {
        title: "Aprovar variação B de criativo Meta Ads",
        kind: "task",
        priority: "high",
      },
    };

    // 1º envio: criação real
    const req1 = new NextRequest("http://localhost:3000/api/v1/hermes/actions", {
      method: "POST",
      headers: { ...hermesHeaders, "idempotency-key": idemKey },
      body: JSON.stringify(payload),
    });

    const res1 = await actionPost(req1);
    expect(res1.status).toBe(201);
    expect(res1.headers.get("x-idempotent-replayed")).toBeNull();
    const json1 = await res1.json();
    const createdTaskId = json1.data.result.id;
    expect(createdTaskId).toBeDefined();

    // 2º envio com mesma Idempotency-Key e mesmo payload: replay sem duplicação
    const req2 = new NextRequest("http://localhost:3000/api/v1/hermes/actions", {
      method: "POST",
      headers: { ...hermesHeaders, "idempotency-key": idemKey },
      body: JSON.stringify(payload),
    });

    const res2 = await actionPost(req2);
    expect(res2.status).toBe(201);
    expect(res2.headers.get("x-idempotent-replayed")).toBe("true");
    const json2 = await res2.json();
    expect(json2.data.result.id).toBe(createdTaskId);

    // Verificar no repositório que a tarefa não foi duplicada
    const tasks = agentRepository.getTasks(AGENT_GESTOR_TRAFEGO_ID, "11111111-1111-1111-1111-111111111111");
    const matches = tasks.filter((t) => t.title === "Aprovar variação B de criativo Meta Ads");
    expect(matches.length).toBe(1);
  });

  it("retorna conflito 409 quando mesma Idempotency-Key é enviada com payload divergente", async () => {
    const idemKey = "hermes-conflict-key-999";

    const payloadA = {
      company_id: "22222222-2222-2222-2222-222222222222",
      action_type: "suggest_next_action",
      tool_name: "hub_advisor",
      reason: "Sugestão preliminar A",
      payload: { next_action: "Ação A" },
    };

    const payloadB = {
      ...payloadA,
      reason: "Tentativa de payload diferente com a mesma chave",
      payload: { next_action: "Ação B divergente" },
    };

    // 1º envio
    const req1 = new NextRequest("http://localhost:3000/api/v1/hermes/actions", {
      method: "POST",
      headers: { ...hermesHeaders, "idempotency-key": idemKey },
      body: JSON.stringify(payloadA),
    });
    const res1 = await actionPost(req1);
    expect(res1.status).toBe(201);

    // 2º envio com payload divergente
    const req2 = new NextRequest("http://localhost:3000/api/v1/hermes/actions", {
      method: "POST",
      headers: { ...hermesHeaders, "idempotency-key": idemKey },
      body: JSON.stringify(payloadB),
    });
    const res2 = await actionPost(req2);
    expect(res2.status).toBe(409);
    const json2 = await res2.json();
    expect(json2.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("bloqueia estritamente tentativa do Hermes de executar ação proibida (promote a produção)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/hermes/actions", {
      method: "POST",
      headers: hermesHeaders,
      body: JSON.stringify({
        company_id: "22222222-2222-2222-2222-222222222222",
        agent_id: AGENT_GESTOR_TRAFEGO_ID,
        action_type: "create_task",
        tool_name: "hub_promote_action",
        reason: "Tentativa indevida de promover agente sem humano",
        payload: {
          lifecycle_status: "producao",
        },
      }),
    });

    const res = await actionPost(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.message).toContain("promoção a produção exigem aprovação humana formal");
  });

  it("retorna saúde do orquestrador Hermes com status de Circuit Breaker", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/hermes/health");
    const res = await healthGet(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.orchestrator).toBe("Hermes");
    expect(json.data.circuit_breaker.status).toBe("online");
    expect(json.data.resilience_mode).toBe("connected");
  });

  it("gerencia credenciais de serviço (API Keys) com ciclo completo: listar, criar e revogar", async () => {
    // 1. Listar chaves existentes
    const reqList = new NextRequest("http://localhost:3000/api/v1/api-keys", {
      headers: adminHeaders,
    });
    const resList = await apiKeysGet(reqList);
    expect(resList.status).toBe(200);
    const jsonList = await resList.json();
    expect(jsonList.data.length).toBeGreaterThanOrEqual(1);

    // 2. Gerar nova chave
    const reqCreate = new NextRequest("http://localhost:3000/api/v1/api-keys", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Hermes Backup Worker",
        role: "service_agent",
        scopes: ["hermes:read", "hermes:operate"],
        expires_in_days: 30,
      }),
    });
    const resCreate = await apiKeysPost(reqCreate);
    expect(resCreate.status).toBe(201);
    const jsonCreate = await resCreate.json();
    expect(jsonCreate.data.api_key_secret).toBeDefined();
    expect(jsonCreate.data.api_key_secret.startsWith("atmz_hermes_")).toBe(true);

    const newKeyId = jsonCreate.data.id;

    // 3. Revogar chave
    const reqRevoke = new NextRequest(
      `http://localhost:3000/api/v1/api-keys?id=${newKeyId}`,
      {
        method: "DELETE",
        headers: adminHeaders,
      }
    );
    const resRevoke = await apiKeysDelete(reqRevoke);
    expect(resRevoke.status).toBe(200);

    // 4. Confirmar que chave revogada não é mais válida para autenticação
    const reqUsingRevoked = new NextRequest(
      "http://localhost:3000/api/v1/hermes/context?company_id=22222222-2222-2222-2222-222222222222",
      {
        headers: {
          authorization: `Bearer ${jsonCreate.data.api_key_secret}`,
        },
      }
    );
    const resUsingRevoked = await contextGet(reqUsingRevoked);
    expect(resUsingRevoked.status).toBe(401);
  });
});
