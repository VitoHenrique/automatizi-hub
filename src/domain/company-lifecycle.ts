import { CompanyLifecycleStatus, CompanyOnboardingStep } from "./types";

export interface CompanyTransitionResult {
  allowed: boolean;
  reason?: string;
}

const ALLOWED_COMPANY_TRANSITIONS: Record<CompanyLifecycleStatus, CompanyLifecycleStatus[]> = {
  prospect: ["onboarding", "encerrada"],
  onboarding: ["diagnostico", "pausada", "encerrada"],
  diagnostico: ["implantacao", "pausada", "encerrada"],
  implantacao: ["operacao_assistida", "pausada", "encerrada"],
  operacao_assistida: ["ativa", "implantacao", "atencao", "pausada", "encerrada"],
  ativa: ["atencao", "pausada", "encerrada"],
  atencao: ["ativa", "pausada", "encerrada"],
  pausada: ["onboarding", "diagnostico", "implantacao", "operacao_assistida", "ativa", "encerrada"],
  encerrada: [], // Estado terminal; preserva histórico (docs/08-company-lifecycle.md)
};

/**
 * Valida a transição de ciclo de vida da empresa.
 */
export function validateCompanyLifecycleTransition(
  currentStatus: CompanyLifecycleStatus,
  targetStatus: CompanyLifecycleStatus
): CompanyTransitionResult {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const allowedNext = ALLOWED_COMPANY_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Transição inválida para a empresa de '${currentStatus}' para '${targetStatus}'.`,
    };
  }

  return { allowed: true };
}

/**
 * Passos padrão de implantação/onboarding de uma nova empresa cliente na Automatizi.
 */
export const DEFAULT_ONBOARDING_STEPS_DEFINITION = [
  {
    step_key: "scope_definition",
    step_title: "Definição de objetivos e escopo contratado",
    step_order: 1,
  },
  {
    step_key: "systems_mapping",
    step_title: "Mapeamento e autorização de sistemas conectados",
    step_order: 2,
  },
  {
    step_key: "first_agent_design",
    step_title: "Desenho e configuração do primeiro agente piloto",
    step_order: 3,
  },
  {
    step_key: "integrations_validation",
    step_title: "Homologação de chaves e testes de webhook",
    step_order: 4,
  },
  {
    step_key: "assisted_testing",
    step_title: "Bateria de testes em ambiente de simulação",
    step_order: 5,
  },
  {
    step_key: "handover_approval",
    step_title: "Aprovação de prontidão e início da operação assistida",
    step_order: 6,
  },
];

/**
 * Gera os passos padrão de onboarding para inicialização no banco.
 */
export function generateInitialOnboardingSteps(
  companyId: string,
  organizationId: string
): Omit<CompanyOnboardingStep, "id" | "created_at" | "updated_at">[] {
  return DEFAULT_ONBOARDING_STEPS_DEFINITION.map((step) => ({
    organization_id: organizationId,
    company_id: companyId,
    step_key: step.step_key,
    step_title: step.step_title,
    step_order: step.step_order,
    is_completed: false,
    completed_at: null,
    completed_by: null,
    notes: null,
  }));
}

/**
 * Calcula o progresso percentual do onboarding (0 a 100).
 */
export function calculateOnboardingProgress(steps: { is_completed: boolean }[]): number {
  if (!steps || steps.length === 0) return 0;
  const completed = steps.filter((s) => s.is_completed).length;
  return Math.round((completed / steps.length) * 100);
}
