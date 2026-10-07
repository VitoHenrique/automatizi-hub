import { AgentLifecycleStatus } from "./types";

export interface ReadinessChecklist {
  has_documentation: boolean;
  has_validated_integrations: boolean;
  has_passed_tests: boolean;
  has_designated_owner: boolean;
  has_rollback_plan: boolean;
  has_formal_approval: boolean;
}

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
  missing_requirements?: string[];
}

/**
 * Matriz de transições permitidas para o ciclo de vida do agente.
 */
const ALLOWED_AGENT_TRANSITIONS: Record<AgentLifecycleStatus, AgentLifecycleStatus[]> = {
  ideia: ["planejamento", "arquivado"],
  planejamento: ["diagnostico", "pausado", "bloqueado", "arquivado"],
  diagnostico: ["desenho", "pausado", "bloqueado", "arquivado"],
  desenho: ["construcao", "pausado", "bloqueado", "arquivado"],
  construcao: ["integracao", "testes", "pausado", "bloqueado", "arquivado"],
  integracao: ["testes", "pausado", "bloqueado", "arquivado"],
  testes: ["operacao_assistida", "construcao", "pausado", "bloqueado", "arquivado"],
  operacao_assistida: ["producao", "testes", "pausado", "bloqueado", "arquivado"],
  producao: ["operacao_assistida", "pausado", "bloqueado", "arquivado"],
  pausado: ["planejamento", "construcao", "testes", "operacao_assistida", "producao", "arquivado"],
  bloqueado: ["planejamento", "construcao", "testes", "operacao_assistida", "producao", "arquivado"],
  arquivado: [], // Estado terminal por padrão
};

/**
 * Valida se uma transição de ciclo de vida é permitida e se cumpre os requisitos de prontidão (ex: produção).
 */
export function validateAgentLifecycleTransition(
  currentStatus: AgentLifecycleStatus,
  targetStatus: AgentLifecycleStatus,
  checklist?: ReadinessChecklist
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const allowedNext = ALLOWED_AGENT_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Transição inválida de '${currentStatus}' para '${targetStatus}'.`,
    };
  }

  // Promoção para produção exige checklist completo de prontidão (docs/07-agent-lifecycle.md)
  if (targetStatus === "producao") {
    if (!checklist) {
      return {
        allowed: false,
        reason: "Promoção para produção exige preenchimento do checklist de prontidão.",
        missing_requirements: [
          "has_documentation",
          "has_validated_integrations",
          "has_passed_tests",
          "has_designated_owner",
          "has_rollback_plan",
          "has_formal_approval",
        ],
      };
    }

    const missing: string[] = [];
    if (!checklist.has_documentation) missing.push("Documentação técnica e operacional");
    if (!checklist.has_validated_integrations) missing.push("Integrações homologadas");
    if (!checklist.has_passed_tests) missing.push("Bateria de testes aprovada");
    if (!checklist.has_designated_owner) missing.push("Responsável técnico designado");
    if (!checklist.has_rollback_plan) missing.push("Plano de rollback documentado");
    if (!checklist.has_formal_approval) missing.push("Aprovação formal registrada");

    if (missing.length > 0) {
      return {
        allowed: false,
        reason: "Critérios de prontidão não atendidos para promoção a produção.",
        missing_requirements: missing,
      };
    }
  }

  return { allowed: true };
}

/**
 * Calcula o progresso operacional baseado em itens completados e total de itens planejados.
 * Conforme docs/01-domain-model.md: 'progress é cálculo baseado em trabalho definido e não pode ser duplicado'.
 */
export function calculateProgress(completedWork: number, totalWork: number): number {
  if (totalWork <= 0) return 0;
  if (completedWork >= totalWork) return 100;
  return Math.round((completedWork / totalWork) * 100);
}
