import { OperationalHealth } from "./types";

export interface HealthMetricsInput {
  hasData: boolean;
  successRatePercent: number; // 0 a 100
  p95LatencyMs: number;
  openCriticalAlertsCount: number;
  openWarningAlertsCount: number;
  failingIntegrationsCount: number;
  lastExecutionMinutesAgo: number | null;
}

export interface HealthEvaluationResult {
  health: OperationalHealth;
  score: number; // 0 a 100
  reasons: string[];
}

/**
 * Avalia a saúde operacional do agente ou sistema com base em métricas e alertas reais.
 * Separação rigorosa de lifecycle_status (DEC-003).
 */
export function evaluateOperationalHealth(input: HealthMetricsInput): HealthEvaluationResult {
  const reasons: string[] = [];

  if (!input.hasData || input.lastExecutionMinutesAgo === null) {
    return {
      health: "sem_dados",
      score: 0,
      reasons: ["Nenhuma telemetria ou execução registrada no período recente."],
    };
  }

  // 1. Alertas críticos são determinantes para estado crítico
  if (input.openCriticalAlertsCount > 0) {
    reasons.push(`${input.openCriticalAlertsCount} alerta(s) crítico(s) não resolvido(s).`);
  }

  // 2. Integrações quebradas
  if (input.failingIntegrationsCount > 0) {
    reasons.push(`${input.failingIntegrationsCount} integração(ões) externa(s) em estado de falha.`);
  }

  // 3. Taxa de sucesso de execução
  if (input.successRatePercent < 80) {
    reasons.push(`Taxa de sucesso baixa: ${input.successRatePercent.toFixed(1)}% (mínimo esperado: 80%).`);
  } else if (input.successRatePercent < 95) {
    reasons.push(`Taxa de sucesso abaixo do ideal: ${input.successRatePercent.toFixed(1)}%.`);
  }

  // 4. Latência P95
  if (input.p95LatencyMs > 15000) {
    reasons.push(`Latência P95 severamente degradada (${input.p95LatencyMs}ms).`);
  } else if (input.p95LatencyMs > 5000) {
    reasons.push(`Latência P95 alta (${input.p95LatencyMs}ms).`);
  }

  // 5. Alertas de aviso
  if (input.openWarningAlertsCount > 0) {
    reasons.push(`${input.openWarningAlertsCount} alerta(s) de atenção pendente(s).`);
  }

  // Cálculo de pontuação 0 - 100
  let score = 100;
  score -= input.openCriticalAlertsCount * 35;
  score -= input.failingIntegrationsCount * 25;
  score -= input.openWarningAlertsCount * 10;
  score -= Math.max(0, (95 - input.successRatePercent) * 1.5);
  if (input.p95LatencyMs > 5000) {
    score -= Math.min(20, (input.p95LatencyMs - 5000) / 500);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determinar status de saúde a partir do score e gatilhos severos
  let health: OperationalHealth = "saudavel";

  if (input.openCriticalAlertsCount > 0 || input.failingIntegrationsCount > 1 || score < 40) {
    health = "critico";
  } else if (input.failingIntegrationsCount === 1 || input.successRatePercent < 85 || score < 70) {
    health = "degradado";
  } else if (input.openWarningAlertsCount > 0 || score < 90) {
    health = "atencao";
  }

  if (reasons.length === 0) {
    reasons.push("Todas as operações, integrações e métricas operando dentro dos parâmetros ideais.");
  }

  return {
    health,
    score,
    reasons,
  };
}
