import { describe, it, expect, beforeEach } from "vitest";
import { GET as listGet, POST as createPost } from "@/app/api/v1/companies/route";
import { GET as detailGet, PATCH as updatePatch } from "@/app/api/v1/companies/[id]/route";
import { PATCH as toggleStepPatch } from "@/app/api/v1/companies/[id]/onboarding/route";
import { companyRepository } from "@/lib/companies/store";
import { NextRequest } from "next/server";

describe("API de Empresas e Onboarding (Fase 1)", () => {
  const defaultHeaders = {
    "x-user-id": "00000000-0000-0000-0000-000000000001",
    "x-organization-id": "11111111-1111-1111-1111-111111111111",
    "x-user-role": "operator",
    "x-correlation-id": "test-corr-comp",
  };

  beforeEach(() => {
    companyRepository.resetForTests();
  });

  it("lista empresas do tenant com suporte a busca", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/companies?search=DBX", {
      headers: defaultHeaders,
    });

    const res = await listGet(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data[0].slug).toBe("dbx-global");
    expect(json.data[0].is_demo).toBe(true);
  });

  it("cria nova empresa cliente com validação Zod e inicialização de checklist", async () => {
    const adminHeaders = {
      ...defaultHeaders,
      "x-user-role": "admin",
    };

    const req = new NextRequest("http://localhost:3000/api/v1/companies", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Acme Corporativo",
        slug: "acme-corp",
        sector: "Logística",
        objectives: "Automatizar triagem de pedidos",
        connected_systems: ["ERP SAP", "WhatsApp"],
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.name).toBe("Acme Corporativo");
    expect(json.data.slug).toBe("acme-corp");
    expect(json.data.lifecycle_status).toBe("onboarding");

    // Verificar se checklist inicial de onboarding foi gerado
    const steps = companyRepository.getOnboardingSteps(json.data.id, defaultHeaders["x-organization-id"]);
    expect(steps.length).toBe(6);
    expect(steps[0].step_key).toBe("scope_definition");
  });

  it("rejeita criação com slug duplicado no mesmo tenant", async () => {
    const adminHeaders = {
      ...defaultHeaders,
      "x-user-role": "admin",
    };

    const req = new NextRequest("http://localhost:3000/api/v1/companies", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "DBX Clone",
        slug: "dbx-global", // Já existe
        sector: "Marketing",
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("retorna detalhes da empresa com progresso de onboarding", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/companies/22222222-2222-2222-2222-222222222222", {
      headers: defaultHeaders,
    });

    const res = await detailGet(req, {
      params: Promise.resolve({ id: "22222222-2222-2222-2222-222222222222" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe("22222222-2222-2222-2222-222222222222");
    expect(json.data.onboarding_steps.length).toBe(6);
    expect(json.data.onboarding_progress).toBeGreaterThan(0);
  });

  it("permite atualizar campos e valida transições de lifecycle", async () => {
    // 1. Atualização permitida (implantacao -> operacao_assistida)
    const validReq = new NextRequest("http://localhost:3000/api/v1/companies/22222222-2222-2222-2222-222222222222", {
      method: "PATCH",
      headers: defaultHeaders,
      body: JSON.stringify({
        lifecycle_status: "operacao_assistida",
        next_action: "Iniciar primeira semana assistida com a equipe DBX",
      }),
    });

    const validRes = await updatePatch(validReq, {
      params: Promise.resolve({ id: "22222222-2222-2222-2222-222222222222" }),
    });
    expect(validRes.status).toBe(200);

    // 2. Transição proibida (tentar pular direto para prospect a partir de operacao_assistida)
    const invalidReq = new NextRequest("http://localhost:3000/api/v1/companies/22222222-2222-2222-2222-222222222222", {
      method: "PATCH",
      headers: defaultHeaders,
      body: JSON.stringify({
        lifecycle_status: "prospect",
      }),
    });

    const invalidRes = await updatePatch(invalidReq, {
      params: Promise.resolve({ id: "22222222-2222-2222-2222-222222222222" }),
    });
    expect(invalidRes.status).toBe(400);
  });

  it("permite alternar status de etapa de onboarding e recalcular progresso", async () => {
    const companyId = "22222222-2222-2222-2222-222222222222";
    const steps = companyRepository.getOnboardingSteps(companyId, defaultHeaders["x-organization-id"]);
    const targetStep = steps[2]; // Terceiro passo (inicialmente false)

    const req = new NextRequest(`http://localhost:3000/api/v1/companies/${companyId}/onboarding`, {
      method: "PATCH",
      headers: defaultHeaders,
      body: JSON.stringify({
        step_id: targetStep.id,
        is_completed: true,
      }),
    });

    const res = await toggleStepPatch(req, {
      params: Promise.resolve({ id: companyId }),
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.step.is_completed).toBe(true);
    expect(json.data.progress).toBe(50); // 3 de 6 = 50%
  });
});
