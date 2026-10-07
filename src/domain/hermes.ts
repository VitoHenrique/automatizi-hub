import { HermesActionType } from "./types";

export interface HermesActionValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Ações estritamente proibidas para o Hermes por padrão, conforme docs/11-hermes-contract.md:
 * "Não pode por padrão: Apagar histórico; alterar permissões; acessar outra organização;
 *  revelar secrets; executar ação financeira ou destrutiva; promover agente a produção sem aprovação."
 */
const FORBIDDEN_ACTION_PATTERNS = [
  /delete/i,
  /drop/i,
  /truncate/i,
  /promote_production/i,
  /promote/i,
  /permission/i,
  /role/i,
  /transfer_funds/i,
  /charge/i,
  /financial/i,
  /destroy/i,
];

/**
 * Valida se uma intenção ou ação proposta pelo Hermes é permitida pelas regras de segurança
 * e pelo contrato operacional docs/11-hermes-contract.md.
 */
export function validateHermesAction(
  actionType: HermesActionType | string,
  toolName: string,
  payload: Record<string, unknown> = {}
): HermesActionValidationResult {
  // 1. Checagem de ferramentas ou ações proibidas
  const targetCheck = `${actionType} ${toolName} ${JSON.stringify(payload)}`.toLowerCase();

  for (const pattern of FORBIDDEN_ACTION_PATTERNS) {
    if (pattern.test(actionType) || pattern.test(toolName)) {
      return {
        allowed: false,
        reason: `Ação ou ferramenta não permitida para o Hermes: Violação da restrição '${pattern.source}'. Operações destrutivas, financeiras, de permissão ou de promoção a produção exigem aprovação humana formal.`,
      };
    }
  }

  // 2. Bloqueio explícito de promoção para produção
  if (
    payload.lifecycle_status === "producao" ||
    payload.target_status === "producao" ||
    payload.action === "promote"
  ) {
    return {
      allowed: false,
      reason:
        "O Hermes não possui autorização para promover agentes a produção. Promoções exigem checklist formal de prontidão e aprovação de um administrador humano (DEC-012).",
    };
  }

  // 3. Validação de ações permitidas
  const allowedActionTypes: HermesActionType[] = [
    "create_task",
    "update_task",
    "record_execution",
    "trigger_alert",
    "suggest_next_action",
  ];

  if (!allowedActionTypes.includes(actionType as HermesActionType)) {
    return {
      allowed: false,
      reason: `Tipo de ação '${actionType}' não reconhecido pelo contrato do Hermes.`,
    };
  }

  return { allowed: true };
}
