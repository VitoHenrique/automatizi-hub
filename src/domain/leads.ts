import { LeadStatus } from "./types";

/**
 * Matriz de transições permitidas para o status de um lead no funil
 */
export const ALLOWED_LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  captado: ["contatado", "qualificado", "desqualificado", "perdido"],
  contatado: ["qualificado", "reuniao_agendada", "distribuido", "desqualificado", "perdido"],
  qualificado: ["reuniao_agendada", "distribuido", "desqualificado", "perdido"],
  reuniao_agendada: ["distribuido", "desqualificado", "perdido"],
  distribuido: ["reuniao_agendada", "desqualificado", "perdido"],
  desqualificado: ["captado"], // Permite reativação
  perdido: ["captado"], // Permite reativação
};

/**
 * Valida se uma transição de status de lead é válida
 */
export function isValidLeadTransition(current: LeadStatus, next: LeadStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_LEAD_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

/**
 * Normaliza número de telefone para o padrão E.164 (ex: +5511999998888)
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone;

  // Se já começar com DDI (ex: 55) e tiver 12 ou 13 dígitos
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }

  // Se for número nacional com DDD (10 ou 11 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  // Caso internacional ou genérico
  return `+${digits}`;
}

/**
 * Verifica se o tempo de resposta do SDR cumpriu o SLA (< 60 segundos)
 */
export function isSlaCompliant(responseTimeSeconds: number | null | undefined): boolean {
  if (responseTimeSeconds === null || responseTimeSeconds === undefined) return false;
  return responseTimeSeconds <= 60;
}
