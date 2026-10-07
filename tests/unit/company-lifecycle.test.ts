import { describe, it, expect } from "vitest";
import {
  validateCompanyLifecycleTransition,
  generateInitialOnboardingSteps,
  calculateOnboardingProgress,
  DEFAULT_ONBOARDING_STEPS_DEFINITION,
} from "@/domain/company-lifecycle";

describe("Ciclo de Vida da Empresa (docs/08-company-lifecycle.md)", () => {
  it("permite transições naturais de relacionamento e implantação", () => {
    expect(validateCompanyLifecycleTransition("prospect", "onboarding").allowed).toBe(true);
    expect(validateCompanyLifecycleTransition("onboarding", "diagnostico").allowed).toBe(true);
    expect(validateCompanyLifecycleTransition("diagnostico", "implantacao").allowed).toBe(true);
    expect(validateCompanyLifecycleTransition("implantacao", "operacao_assistida").allowed).toBe(true);
    expect(validateCompanyLifecycleTransition("operacao_assistida", "ativa").allowed).toBe(true);
  });

  it("permite pausar ou encerrar a partir de fases operacionais preservando histórico", () => {
    expect(validateCompanyLifecycleTransition("implantacao", "pausada").allowed).toBe(true);
    expect(validateCompanyLifecycleTransition("ativa", "atencao").allowed).toBe(true);
    expect(validateCompanyLifecycleTransition("ativa", "encerrada").allowed).toBe(true);
  });

  it("bloqueia saltos diretos inválidos", () => {
    const jump = validateCompanyLifecycleTransition("prospect", "ativa");
    expect(jump.allowed).toBe(false);
    expect(jump.reason).toContain("Transição inválida");

    const terminal = validateCompanyLifecycleTransition("encerrada", "prospect");
    expect(terminal.allowed).toBe(false);
  });

  it("gera exatamente os 6 passos padronizados de onboarding para uma nova empresa", () => {
    const steps = generateInitialOnboardingSteps("comp-1", "org-1");
    expect(steps.length).toBe(DEFAULT_ONBOARDING_STEPS_DEFINITION.length);
    expect(steps[0].step_key).toBe("scope_definition");
    expect(steps[0].is_completed).toBe(false);
    expect(steps[steps.length - 1].step_key).toBe("handover_approval");
  });

  it("calcula percentual de progresso de onboarding corretamente", () => {
    expect(calculateOnboardingProgress([])).toBe(0);
    expect(calculateOnboardingProgress([{ is_completed: false }, { is_completed: false }])).toBe(0);
    expect(calculateOnboardingProgress([{ is_completed: true }, { is_completed: false }])).toBe(50);
    expect(calculateOnboardingProgress([{ is_completed: true }, { is_completed: true }])).toBe(100);
  });
});
