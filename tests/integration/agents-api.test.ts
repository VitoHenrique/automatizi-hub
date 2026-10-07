import { describe, it, expect, beforeEach } from "vitest";
import { GET as listGet, POST as createPost } from "@/app/api/v1/agents/route";
import { GET as detailGet, PATCH as updatePatch } from "@/app/api/v1/agents/[id]/route";
import { POST as promotePost } from "@/app/api/v1/agents/[id]/promote/route";
import {
  GET as tasksGet,
  POST as tasksPost,
  PATCH as tasksPatch,
} from "@/app/api/v1/agents/[id]/tasks/route";
import {
  agentRepository,
  AGENT_GESTOR_TRAFEGO_ID,
  AGENT_SDR_RESPOSTA_ID,
  AGENT_SPLIT_LEADS_ID,
} from "@/lib/agents/store";
import { companyRepository } from "@/lib/companies/store";
import { NextRequest } from "next/server";

describe("API de Agentes, Tarefas e Prontidão de Produção (Fase 2)", () => {
  const adminHeaders = {
    "x-user-id": "00000000-0000-0000-0000-000000000001",
    "x-organization-id": "11111111-1111-1111-1111-111111111111",
    "x-user-role": "admin",
    "x-correlation-id": "test-corr-agent-api",
  };

  const operatorHeaders = {
    ...adminHeaders,
    "x-user-role": "operator",
  };

  const viewerHeaders = {
    ...adminHeaders,
    "x-user-role": "client_viewer",
  };

  beforeEach(() => {
    agentRepository.resetForTests();
    companyRepository.resetForTests();
  });

  it("lista agentes da organização e suporta filtros por empresa, status e busca", async () => {
    // 1. Listar todos
    const reqAll = new NextRequest("http://localhost:3000/api/v1/agents", {
      headers: adminHeaders,
    });
    const resAll = await listGet(reqAll);
    expect(resAll.status).toBe(200);
    const jsonAll = await resAll.json();
    expect(jsonAll.data.length).toBe(3); // Os 3 agentes pilotos da DBX

    // 2. Filtrar por status=producao
    const reqStatus = new NextRequest("http://localhost:3000/api/v1/agents?status=producao", {
      headers: adminHeaders,
    });
    const resStatus = await listGet(reqStatus);
    const jsonStatus = await resStatus.json();
    expect(jsonStatus.data.length).toBe(1);
    expect(jsonStatus.data[0].id).toBe(AGENT_GESTOR_TRAFEGO_ID);

    // 3. Filtrar por busca textual
    const reqSearch = new NextRequest("http://localhost:3000/api/v1/agents?search=WhatsApp", {
      headers: adminHeaders,
    });
    const resSearch = await listGet(reqSearch);
    const jsonSearch = await resSearch.json();
    expect(jsonSearch.data.length).toBe(1);
    expect(jsonSearch.data[0].id).toBe(AGENT_SDR_RESPOSTA_ID);
  });

  it("cria um novo agente em estado planejamento com versão inicial 1.0.0", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/agents", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        company_id: "22222222-2222-2222-2222-222222222222",
        name: "Agente de CS e NPS",
        slug: "agente-cs-nps",
        role_description: "Pesquisar satisfação pós-atendimento e coletar feedbacks qualitativos.",
        kind: "agent",
        accessed_systems: ["WhatsApp", "HubSpot"],
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.name).toBe("Agente de CS e NPS");
    expect(json.data.lifecycle_status).toBe("planejamento");
    expect(json.data.current_version).toBe("1.0.0");
    expect(json.data.health).toBe("sem_dados");

    // Verificar se versão inicial foi criada no store
    const versions = agentRepository.getVersions(json.data.id, adminHeaders["x-organization-id"]);
    expect(versions.length).toBe(1);
    expect(versions[0].version).toBe("1.0.0");
    expect(versions[0].is_production).toBe(false);
  });

  it("bloqueia criação de agente com slug duplicado para a mesma empresa", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/agents", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        company_id: "22222222-2222-2222-2222-222222222222",
        name: "Gestor Duplicado",
        slug: "gestor-de-trafego", // Já existe
        role_description: "Tentativa de colisão de slug na mesma empresa.",
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("bloqueia criação por perfil sem permissão (client_viewer)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/agents", {
      method: "POST",
      headers: viewerHeaders,
      body: JSON.stringify({
        company_id: "22222222-2222-2222-2222-222222222222",
        name: "Agente Não Autorizado",
        slug: "agente-nao-autorizado",
        role_description: "Tentativa por perfil somente leitura.",
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(403);
  });

  it("retorna detalhes completos do agente incluindo versões e tarefas vinculadas", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/agents/${AGENT_GESTOR_TRAFEGO_ID}`, {
      headers: adminHeaders,
    });

    const res = await detailGet(req, {
      params: Promise.resolve({ id: AGENT_GESTOR_TRAFEGO_ID }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(AGENT_GESTOR_TRAFEGO_ID);
    expect(json.data.versions.length).toBeGreaterThanOrEqual(1);
    expect(json.data.tasks.length).toBeGreaterThanOrEqual(2);
    expect(json.data.company_name).toBe("DBX Global");
  });

  it("bloqueia promoção direta a produção via simples PATCH (exige /promote)", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/agents/${AGENT_SDR_RESPOSTA_ID}`, {
      method: "PATCH",
      headers: operatorHeaders,
      body: JSON.stringify({
        lifecycle_status: "producao",
      }),
    });

    const res = await updatePatch(req, {
      params: Promise.resolve({ id: AGENT_SDR_RESPOSTA_ID }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.details.lifecycle_status[0]).toContain("utilize o endpoint formal /promote");
  });

  it("bloqueia promoção formal para produção se perfil não for admin/owner", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/agents/${AGENT_SDR_RESPOSTA_ID}/promote`,
      {
        method: "POST",
        headers: operatorHeaders, // Operador não tem permissão agent:promote_production
        body: JSON.stringify({
          version: "1.1.0",
          change_summary: "Promoção tentada por operador",
          readiness_checklist: {
            has_documentation: true,
            has_validated_integrations: true,
            has_passed_tests: true,
            has_designated_owner: true,
            has_rollback_plan: true,
            has_formal_approval: true,
          },
        }),
      }
    );

    const res = await promotePost(req, {
      params: Promise.resolve({ id: AGENT_SDR_RESPOSTA_ID }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.message).toContain("Apenas administradores podem aprovar a promoção formal");
  });

  it("bloqueia promoção formal para produção se checklist de prontidão estiver incompleto", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/agents/${AGENT_SDR_RESPOSTA_ID}/promote`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          version: "1.1.0",
          change_summary: "Tentativa com testes e rollback pendentes",
          readiness_checklist: {
            has_documentation: true,
            has_validated_integrations: true,
            has_passed_tests: false, // Incompleto
            has_designated_owner: true,
            has_rollback_plan: false, // Incompleto
            has_formal_approval: true,
          },
        }),
      }
    );

    const res = await promotePost(req, {
      params: Promise.resolve({ id: AGENT_SDR_RESPOSTA_ID }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(JSON.stringify(json.error.details)).toContain("Bateria de testes aprovada");
  });

  it("promove agente a produção com checklist 100% satisfeito gerando nova versão e atividade", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/agents/${AGENT_SDR_RESPOSTA_ID}/promote`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          version: "1.1.0",
          change_summary: "Homologado para escala total no WhatsApp de corretores.",
          readiness_checklist: {
            has_documentation: true,
            has_validated_integrations: true,
            has_passed_tests: true,
            has_designated_owner: true,
            has_rollback_plan: true,
            has_formal_approval: true,
          },
        }),
      }
    );

    const res = await promotePost(req, {
      params: Promise.resolve({ id: AGENT_SDR_RESPOSTA_ID }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.agent.lifecycle_status).toBe("producao");
    expect(json.data.agent.current_version).toBe("1.1.0");
    expect(json.data.version.is_production).toBe(true);

    // Verificar se atividade legível foi criada na empresa
    const activities = companyRepository.getActivities("22222222-2222-2222-2222-222222222222", adminHeaders["x-organization-id"]);
    const promoAct = activities.find((a) => a.action_type === "agent.promoted_production");
    expect(promoAct).toBeDefined();
    expect(promoAct?.title).toContain("v1.1.0");
  });

  it("permite criar, listar e atualizar o status de tarefas contextuais do agente", async () => {
    // 1. Criar tarefa
    const createReq = new NextRequest(
      `http://localhost:3000/api/v1/agents/${AGENT_SPLIT_LEADS_ID}/tasks`,
      {
        method: "POST",
        headers: operatorHeaders,
        body: JSON.stringify({
          title: "Adicionar validação de CPF no formulário",
          kind: "blocker",
          priority: "urgent",
          assignee_name: "Engenharia",
        }),
      }
    );

    const createRes = await tasksPost(createReq, {
      params: Promise.resolve({ id: AGENT_SPLIT_LEADS_ID }),
    });
    expect(createRes.status).toBe(201);
    const createdJson = await createRes.json();
    const taskId = createdJson.data.id;
    expect(createdJson.data.kind).toBe("blocker");
    expect(createdJson.data.status).toBe("todo");

    // 2. Listar tarefas do agente
    const listReq = new NextRequest(
      `http://localhost:3000/api/v1/agents/${AGENT_SPLIT_LEADS_ID}/tasks`,
      {
        headers: operatorHeaders,
      }
    );
    const listRes = await tasksGet(listReq, {
      params: Promise.resolve({ id: AGENT_SPLIT_LEADS_ID }),
    });
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.data.find((t: { id: string }) => t.id === taskId)).toBeDefined();

    // 3. Atualizar status da tarefa para 'done'
    const patchReq = new NextRequest(
      `http://localhost:3000/api/v1/agents/${AGENT_SPLIT_LEADS_ID}/tasks`,
      {
        method: "PATCH",
        headers: operatorHeaders,
        body: JSON.stringify({
          task_id: taskId,
          status: "done",
        }),
      }
    );
    const patchRes = await tasksPatch(patchReq, {
      params: Promise.resolve({ id: AGENT_SPLIT_LEADS_ID }),
    });
    expect(patchRes.status).toBe(200);
    const patchJson = await patchRes.json();
    expect(patchJson.data.status).toBe("done");
    expect(patchJson.data.completed_at).not.toBeNull();
  });
});
