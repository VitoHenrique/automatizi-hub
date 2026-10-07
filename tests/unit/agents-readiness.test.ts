import { describe, it, expect } from "vitest";
import {
  validateAgentLifecycleTransition,
  ReadinessChecklist,
} from "@/domain/lifecycle";
import {
  PromoteAgentSchema,
  CreateAgentSchema,
  CreateTaskSchema,
  AgentLifecycleStatus,
} from "@/domain/types";

describe("Critérios de Prontidão e Ciclo de Vida do Agente (Fase 2)", () => {
  it("valida o formato semântico rigoroso de versão na promoção (X.Y.Z)", () => {
    const validPayload = {
      version: "1.0.0",
      change_summary: "Versão candidata para homologação final.",
      readiness_checklist: {
        has_documentation: true,
        has_validated_integrations: true,
        has_passed_tests: true,
        has_designated_owner: true,
        has_rollback_plan: true,
        has_formal_approval: true,
      },
    };

    expect(PromoteAgentSchema.safeParse(validPayload).success).toBe(true);

    // Versões inválidas
    expect(
      PromoteAgentSchema.safeParse({ ...validPayload, version: "v1.0.0" }).success
    ).toBe(false);
    expect(
      PromoteAgentSchema.safeParse({ ...validPayload, version: "1.0" }).success
    ).toBe(false);
    expect(
      PromoteAgentSchema.safeParse({ ...validPayload, version: "draft-1" }).success
    ).toBe(false);
  });

  it("exige que todos os 6 critérios de prontidão sejam atendidos para promover a produção", () => {
    const completeChecklist: ReadinessChecklist = {
      has_documentation: true,
      has_validated_integrations: true,
      has_passed_tests: true,
      has_designated_owner: true,
      has_rollback_plan: true,
      has_formal_approval: true,
    };

    const resValid = validateAgentLifecycleTransition(
      "operacao_assistida",
      "producao",
      completeChecklist
    );
    expect(resValid.allowed).toBe(true);
    expect(resValid.missing_requirements).toBeUndefined();

    // Testar cada um dos 6 critérios individualmente quando ausente
    const keys: (keyof ReadinessChecklist)[] = [
      "has_documentation",
      "has_validated_integrations",
      "has_passed_tests",
      "has_designated_owner",
      "has_rollback_plan",
      "has_formal_approval",
    ];

    for (const key of keys) {
      const incompleteChecklist = { ...completeChecklist, [key]: false };
      const res = validateAgentLifecycleTransition(
        "operacao_assistida",
        "producao",
        incompleteChecklist
      );
      expect(res.allowed).toBe(false);
      expect(res.missing_requirements?.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("bloqueia saltos diretos para produção a partir de fases preliminares (ex: ideia, construcao)", () => {
    const completeChecklist: ReadinessChecklist = {
      has_documentation: true,
      has_validated_integrations: true,
      has_passed_tests: true,
      has_designated_owner: true,
      has_rollback_plan: true,
      has_formal_approval: true,
    };

    const jumpFromIdeia = validateAgentLifecycleTransition(
      "ideia",
      "producao",
      completeChecklist
    );
    expect(jumpFromIdeia.allowed).toBe(false);
    expect(jumpFromIdeia.reason).toContain("Transição inválida");

    const jumpFromConstrucao = validateAgentLifecycleTransition(
      "construcao",
      "producao",
      completeChecklist
    );
    expect(jumpFromConstrucao.allowed).toBe(false);
    expect(jumpFromConstrucao.reason).toContain("Transição inválida");
  });

  it("permite pausar ou bloquear agente em execução preservando o estado", () => {
    const pauseFromProd = validateAgentLifecycleTransition("producao", "pausado");
    expect(pauseFromProd.allowed).toBe(true);

    const blockFromAssisted = validateAgentLifecycleTransition("operacao_assistida", "bloqueado");
    expect(blockFromAssisted.allowed).toBe(true);

    const resumeToAssisted = validateAgentLifecycleTransition("pausado", "operacao_assistida");
    expect(resumeToAssisted.allowed).toBe(true);

    const resumeToProdWithChecklist = validateAgentLifecycleTransition("pausado", "producao", {
      has_documentation: true,
      has_validated_integrations: true,
      has_passed_tests: true,
      has_designated_owner: true,
      has_rollback_plan: true,
      has_formal_approval: true,
    });
    expect(resumeToProdWithChecklist.allowed).toBe(true);
  });

  it("valida o schema de criação de agente (CreateAgentSchema)", () => {
    const valid = CreateAgentSchema.safeParse({
      company_id: "22222222-2222-2222-2222-222222222222",
      name: "Agente de Cobrança",
      slug: "agente-cobranca",
      role_description: "Enviar lembretes amigáveis e gerar boletos Pix atualizados.",
      kind: "agent",
      accessed_systems: ["ERP", "Asaas"],
    });
    expect(valid.success).toBe(true);

    // Slug inválido com espaços e maiúsculas
    const invalidSlug = CreateAgentSchema.safeParse({
      company_id: "22222222-2222-2222-2222-222222222222",
      name: "Agente de Cobrança",
      slug: "Agente Cobrança",
      role_description: "Enviar lembretes amigáveis.",
    });
    expect(invalidSlug.success).toBe(false);
  });

  it("valida o schema de tarefas de agente com tipagem formal (CreateTaskSchema)", () => {
    const validTask = CreateTaskSchema.safeParse({
      company_id: "22222222-2222-2222-2222-222222222222",
      agent_id: "33333333-3333-3333-3333-333333333331",
      title: "Configurar credenciais da Meta Ads API",
      kind: "milestone",
      status: "in_progress",
      priority: "urgent",
    });
    expect(validTask.success).toBe(true);

    // Tipo inválido
    const invalidKind = CreateTaskSchema.safeParse({
      company_id: "22222222-2222-2222-2222-222222222222",
      title: "Tarefa sem tipo válido",
      kind: "random_type",
    });
    expect(invalidKind.success).toBe(false);
  });
});
