import { describe, it, expect } from "vitest";
import {
  validateAgentLifecycleTransition,
  calculateProgress,
  ReadinessChecklist,
} from "@/domain/lifecycle";

describe("Ciclo de Vida do Agente (docs/07-agent-lifecycle.md)", () => {
  it("permite transições válidas de desenvolvimento", () => {
    const r1 = validateAgentLifecycleTransition("ideia", "planejamento");
    expect(r1.allowed).toBe(true);

    const r2 = validateAgentLifecycleTransition("planejamento", "diagnostico");
    expect(r2.allowed).toBe(true);

    const r3 = validateAgentLifecycleTransition("construcao", "testes");
    expect(r3.allowed).toBe(true);

    const r4 = validateAgentLifecycleTransition("testes", "operacao_assistida");
    expect(r4.allowed).toBe(true);
  });

  it("bloqueia saltos e transições inválidas", () => {
    const invalid = validateAgentLifecycleTransition("ideia", "producao");
    expect(invalid.allowed).toBe(false);
    expect(invalid.reason).toContain("Transição inválida");

    const terminal = validateAgentLifecycleTransition("arquivado", "producao");
    expect(terminal.allowed).toBe(false);
  });

  it("exige checklist completo de prontidão para promoção a produção", () => {
    // Tentativa sem checklist
    const withoutChecklist = validateAgentLifecycleTransition("operacao_assistida", "producao");
    expect(withoutChecklist.allowed).toBe(false);
    expect(withoutChecklist.reason).toContain("exige preenchimento do checklist");

    // Tentativa com checklist incompleto
    const incompleteChecklist: ReadinessChecklist = {
      has_documentation: true,
      has_validated_integrations: true,
      has_passed_tests: false, // falhou
      has_designated_owner: true,
      has_rollback_plan: false, // pendente
      has_formal_approval: true,
    };

    const incomplete = validateAgentLifecycleTransition(
      "operacao_assistida",
      "producao",
      incompleteChecklist
    );
    expect(incomplete.allowed).toBe(false);
    expect(incomplete.missing_requirements).toContain("Bateria de testes aprovada");
    expect(incomplete.missing_requirements).toContain("Plano de rollback documentado");

    // Tentativa com checklist 100% atendido
    const completeChecklist: ReadinessChecklist = {
      has_documentation: true,
      has_validated_integrations: true,
      has_passed_tests: true,
      has_designated_owner: true,
      has_rollback_plan: true,
      has_formal_approval: true,
    };

    const approved = validateAgentLifecycleTransition(
      "operacao_assistida",
      "producao",
      completeChecklist
    );
    expect(approved.allowed).toBe(true);
  });

  it("calcula progresso operacional corretamente baseado em trabalho concluído", () => {
    expect(calculateProgress(0, 10)).toBe(0);
    expect(calculateProgress(5, 10)).toBe(50);
    expect(calculateProgress(10, 10)).toBe(100);
    expect(calculateProgress(12, 10)).toBe(100); // Teto em 100%
    expect(calculateProgress(0, 0)).toBe(0); // Divisão por zero segura
  });
});
