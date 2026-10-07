import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getMetaWebhook, POST as postMetaWebhook } from "@/app/api/v1/integrations/webhooks/meta-ads/route";
import { GET as getLeads, POST as postLead } from "@/app/api/v1/companies/[id]/leads/route";
import { POST as postSplit } from "@/app/api/v1/companies/[id]/leads/[leadId]/split/route";
import { GET as getIntegrationHealth } from "@/app/api/v1/integrations/[id]/health/route";
import { POST as postIntegrationSync } from "@/app/api/v1/integrations/[id]/sync/route";
import { dbxStore } from "@/lib/dbx/store";
import { operationsRepository } from "@/lib/operations/store";

const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const DBX_COMPANY_ID = "22222222-2222-2222-2222-222222222222";
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

function createMockRequest(url: string, options?: { method?: string; body?: any; headers?: Record<string, string> }) {
  const headers = new Headers({
    "x-organization-id": DEFAULT_ORG_ID,
    "x-user-id": DEMO_USER_ID,
    "x-user-role": "admin",
    "x-user-scope": "global",
    "x-correlation-id": "test-dbx-corr-id",
    ...(options?.headers || {}),
  });

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options?.method || "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

describe("Fluxos Operacionais e Pipeline do Piloto DBX (Fase 5)", () => {
  beforeEach(() => {
    dbxStore.resetDemoData();
  });

  describe("1. Webhook da Meta Ads (Handshake & Ingestão)", () => {
    it("responde ao desafio de verificação do Webhook da Meta Ads (hub.challenge)", async () => {
      const challengeToken = "challenge_meta_123456";
      const req = createMockRequest(
        `http://localhost:3000/api/v1/integrations/webhooks/meta-ads?hub.mode=subscribe&hub.verify_token=atmz_meta_verify_token_dbx&hub.challenge=${challengeToken}`
      );

      const res = await getMetaWebhook(req);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe(challengeToken);
    });

    it("rejeita verificação de Webhook com token inválido", async () => {
      const req = createMockRequest(
        "http://localhost:3000/api/v1/integrations/webhooks/meta-ads?hub.mode=subscribe&hub.verify_token=token_falso&hub.challenge=123"
      );

      const res = await getMetaWebhook(req);
      expect(res.status).toBe(403);
    });

    it("ingere lead do Meta Ads, roda SDR no WhatsApp, qualifica no Calendar, distribui no CRM e registra execuções", async () => {
      const uniqueLeadId = `lead-test-${Date.now()}`;
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  leadgen_id: uniqueLeadId,
                  campaign_name: "DBX - Aquisição B2B - High Intent",
                  field_data: [
                    { name: "full_name", values: ["Tatiana Nogueira"] },
                    { name: "phone_number", values: ["+55 11 97777-6666"] },
                    { name: "email", values: ["tatiana@industriapack.com.br"] },
                    { name: "budget", values: ["R$ 60k/mês"] },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = createMockRequest("http://localhost:3000/api/v1/integrations/webhooks/meta-ads", {
        method: "POST",
        body: payload,
      });

      const res = await postMetaWebhook(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.processed).toBe(true);
      expect(json.data.is_duplicate).toBe(false);
      expect(json.data.lead.full_name).toBe("Tatiana Nogueira");
      expect(json.data.lead.status).toBe("distribuido");
      expect(json.data.lead.first_contact_response_time_seconds).toBeLessThanOrEqual(60);
      expect(json.data.sdr_execution_id).toBeDefined();
      expect(json.data.split_execution_id).toBeDefined();
      expect(json.data.traffic_execution_id).toBeDefined();
      expect(json.data.closer_assigned).toBeDefined();

      // Verifica se as execuções dos 3 agentes foram realmente salvas no repositório de operações
      const executions = operationsRepository.listExecutions(DEFAULT_ORG_ID, {
        companyId: DBX_COMPANY_ID,
      });
      const sdrExec = executions.find((e) => e.id === json.data.sdr_execution_id);
      expect(sdrExec).toBeDefined();
      expect(sdrExec?.status).toBe("success");
    });

    it("aplica deduplicação idempotente: segundo webhook com mesmo ID não duplica o lead", async () => {
      const duplicateLeadId = "lead-dedup-fixed-999";
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  leadgen_id: duplicateLeadId,
                  field_data: [
                    { name: "full_name", values: ["Roberto Almir"] },
                    { name: "phone_number", values: ["+5511999994444"] },
                  ],
                },
              },
            ],
          },
        ],
      };

      // 1ª Requisição
      const req1 = createMockRequest("http://localhost:3000/api/v1/integrations/webhooks/meta-ads", {
        method: "POST",
        body: payload,
      });
      const res1 = await postMetaWebhook(req1);
      expect(res1.status).toBe(201);
      const json1 = await res1.json();
      expect(json1.data.is_duplicate).toBe(false);

      // 2ª Requisição (Repetida com mesmo event_id)
      const req2 = createMockRequest("http://localhost:3000/api/v1/integrations/webhooks/meta-ads", {
        method: "POST",
        body: payload,
      });
      const res2 = await postMetaWebhook(req2);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.data.is_duplicate).toBe(true);
    });
  });

  describe("2. Gerenciamento e Listagem de Leads por Empresa", () => {
    it("lista os leads da DBX Global com suporte a busca e filtros por status", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/v1/companies/${DBX_COMPANY_ID}/leads?status=distribuido`
      );

      const res = await getLeads(req, { params: Promise.resolve({ id: DBX_COMPANY_ID }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      expect(json.data.every((l: any) => l.status === "distribuido")).toBe(true);
    });

    it("permite criação manual de lead e dispara o pipeline do piloto", async () => {
      const newLeadData = {
        full_name: "Renata Cordeiro",
        phone: "+5511988887766",
        email: "renata@cordeiro.adv.br",
        campaign_name: "Indicação Direta",
      };

      const req = createMockRequest(
        `http://localhost:3000/api/v1/companies/${DBX_COMPANY_ID}/leads`,
        {
          method: "POST",
          body: newLeadData,
        }
      );

      const res = await postLead(req, { params: Promise.resolve({ id: DBX_COMPANY_ID }) });
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.full_name).toBe("Renata Cordeiro");
      expect(json.data.status).toBe("distribuido");
    });
  });

  describe("3. Split Manual e Reatribuição de Closer", () => {
    it("permite ao operador reatribuir o lead a um closer disponível", async () => {
      const leads = dbxStore.getLeads(DEFAULT_ORG_ID, DBX_COMPANY_ID);
      const targetLead = leads[0];

      const req = createMockRequest(
        `http://localhost:3000/api/v1/companies/${DBX_COMPANY_ID}/leads/${targetLead.id}/split`,
        { method: "POST" }
      );

      const res = await postSplit(req, {
        params: Promise.resolve({ id: DBX_COMPANY_ID, leadId: targetLead.id }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.assignment.closer_id).toBeDefined();
      expect(json.data.lead.status).toBe("distribuido");
    });
  });

  describe("4. Health Check e Sincronização dos Adaptadores", () => {
    it("executa health check dinâmico na integração do Meta Ads", async () => {
      const req = createMockRequest("http://localhost:3000/api/v1/integrations/int-1/health");
      const res = await getIntegrationHealth(req, { params: Promise.resolve({ id: "int-1" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.is_healthy).toBe(true);
      expect(json.data.latency_ms).toBeGreaterThan(0);
      expect(json.data.provider).toBe("meta_ads");
    });

    it("executa sincronização manual na integração do CRM DBX", async () => {
      const req = createMockRequest("http://localhost:3000/api/v1/integrations/int-2/sync", {
        method: "POST",
      });
      const res = await postIntegrationSync(req, { params: Promise.resolve({ id: "int-2" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.success).toBe(true);
      expect(json.data.provider).toBe("dbx_crm");
      expect(json.data.synced_at).toBeDefined();
    });
  });
});
