import { describe, it, expect, beforeEach } from "vitest";
import { GET as executionsGet, POST as executionsPost } from "@/app/api/v1/executions/route";
import { GET as executionDetailGet } from "@/app/api/v1/executions/[id]/route";
import { GET as alertsGet, POST as alertsPost } from "@/app/api/v1/alerts/route";
import { POST as alertAckPost } from "@/app/api/v1/alerts/[id]/acknowledge/route";
import { POST as alertResolvePost } from "@/app/api/v1/alerts/[id]/resolve/route";
import { GET as metricsGet } from "@/app/api/v1/metrics/route";
import {
  operationsRepository,
  EXECUTION_DEMO_1_ID,
  ALERT_DEMO_1_ID,
} from "@/lib/operations/store";
import { agentRepository, AGENT_GESTOR_TRAFEGO_ID } from "@/lib/agents/store";
import { companyRepository } from "@/lib/companies/store";
import { NextRequest } from "next/server";

describe("API de Operações: Execuções, Alertas e Métricas (Fase 3)", () => {
  const operatorHeaders = {
    "x-user-id": "00000000-0000-0000-0000-000000000001",
    "x-organization-id": "11111111-1111-1111-1111-111111111111",
    "x-user-role": "operator",
    "x-correlation-id": "test-corr-ops",
  };

  const viewerHeaders = {
    ...operatorHeaders,
    "x-user-role": "client_viewer",
  };

  beforeEach(() => {
    operationsRepository.resetForTests();
    agentRepository.resetForTests();
    companyRepository.resetForTests();
  });

  it("lista execuções com suporte a filtro por agente e status", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/executions?agent_id=${AGENT_GESTOR_TRAFEGO_ID}&status=success`,
      { headers: operatorHeaders }
    );
    const res = await executionsGet(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data[0].agent_id).toBe(AGENT_GESTOR_TRAFEGO_ID);
    expect(json.data[0].status).toBe("success");
  });

  it("registra uma nova execução com sanitização de credenciais e criação de atividade", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/executions", {
      method: "POST",
      headers: operatorHeaders,
      body: JSON.stringify({
        company_id: "22222222-2222-2222-2222-222222222222",
        agent_id: AGENT_GESTOR_TRAFEGO_ID,
        status: "failed",
        error_message: "Erro na API Meta com token Bearer EAAG...invalid_token",
        input_summary: "Atualização de orçamentos",
        duration_ms: 1500,
        cost_cents: 12,
        meta: { secret_token: "super-secret-12345", platform: "meta" },
      }),
    });

    const res = await executionsPost(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.status).toBe("failed");
    // Verificar que token no error_message foi higienizado
    expect(json.data.error_message).toContain("[REDACTED_BEARER_TOKEN]");
    expect(json.data.error_message).not.toContain("EAAG...invalid_token");
    // Verificar que token no meta foi sanitizado
    expect(json.data.meta.secret_token).toBe("[REDACTED]");

    // Como falhou, verificar se gerou alerta crítico automaticamente
    const alerts = operationsRepository.listAlerts(operatorHeaders["x-organization-id"], {
      status: "firing",
    });
    const generatedAlert = alerts.find((a) => a.execution_id === json.data.id);
    expect(generatedAlert).toBeDefined();
    expect(generatedAlert?.severity).toBe("critical");
  });

  it("bloqueia disparo de execução para perfis sem permissão (client_viewer)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/executions", {
      method: "POST",
      headers: viewerHeaders,
      body: JSON.stringify({
        company_id: "22222222-2222-2222-2222-222222222222",
        agent_id: AGENT_GESTOR_TRAFEGO_ID,
      }),
    });

    const res = await executionsPost(req);
    expect(res.status).toBe(403);
  });

  it("retorna detalhes completos da execução pelo ID", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/executions/${EXECUTION_DEMO_1_ID}`, {
      headers: operatorHeaders,
    });
    const res = await executionDetailGet(req, {
      params: Promise.resolve({ id: EXECUTION_DEMO_1_ID }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(EXECUTION_DEMO_1_ID);
    expect(json.data.agent_name).toBe("Gestor de Tráfego");
    expect(json.data.company_name).toBe("DBX Global");
  });

  it("permite reconhecer e resolver alertas operacionais", async () => {
    // 1. Reconhecer (Acknowledge)
    const ackReq = new NextRequest(
      `http://localhost:3000/api/v1/alerts/${ALERT_DEMO_1_ID}/acknowledge`,
      {
        method: "POST",
        headers: operatorHeaders,
      }
    );
    const ackRes = await alertAckPost(ackReq, {
      params: Promise.resolve({ id: ALERT_DEMO_1_ID }),
    });
    expect(ackRes.status).toBe(200);
    const ackJson = await ackRes.json();
    expect(ackJson.data.status).toBe("acknowledged");
    expect(ackJson.data.acknowledged_at).not.toBeNull();

    // 2. Resolver (Resolve)
    const resReq = new NextRequest(
      `http://localhost:3000/api/v1/alerts/${ALERT_DEMO_1_ID}/resolve`,
      {
        method: "POST",
        headers: operatorHeaders,
      }
    );
    const resRes = await alertResolvePost(resReq, {
      params: Promise.resolve({ id: ALERT_DEMO_1_ID }),
    });
    expect(resRes.status).toBe(200);
    const resJson = await resRes.json();
    expect(resJson.data.status).toBe("resolved");
    expect(resJson.data.resolved_at).not.toBeNull();
  });

  it("calcula métricas operacionais agregadas (taxa de sucesso, latência, volume)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/metrics", {
      headers: operatorHeaders,
    });
    const res = await metricsGet(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.total_executions).toBeGreaterThanOrEqual(3);
    expect(json.data.success_rate).toBe(100); // Todas as iniciais são de sucesso
    expect(json.data.avg_duration_ms).toBeGreaterThan(0);
    expect(json.data.firing_alerts_count).toBeGreaterThanOrEqual(1);
  });
});
