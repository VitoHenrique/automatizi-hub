import { OperationalHealth, AgentExecution, Alert } from "./types";

export interface HealthCalculationResult {
  health: OperationalHealth;
  health_score: number;
  health_reasons: string[];
}

export interface HealthCalculationParams {
  executions: AgentExecution[];
  alerts?: Alert[];
  latencyThresholdMs?: number;
}

/**
 * Calcula dinamicamente o score de saúde operacional e o status (saudavel, atencao, critico, sem_dados)
 * com base na telemetria real de execuções e alertas ativos, conforme docs/10-observability.md.
 */
export function calculateAgentHealth({
  executions,
  alerts = [],
  latencyThresholdMs = 5000,
}: HealthCalculationParams): HealthCalculationResult {
  if (!executions || executions.length === 0) {
    return {
      health: "sem_dados",
      health_score: 0,
      health_reasons: ["Sem execuções registradas na janela recente para avaliar saúde operacional."],
    };
  }

  let score = 100;
  const reasons: string[] = [];

  // 1. Avaliação de taxa de sucesso
  const finished = executions.filter((e) => e.status !== "running");
  const successes = finished.filter((e) => e.status === "success").length;
  const totalFinished = finished.length;

  if (totalFinished > 0) {
    const successRate = Math.round((successes / totalFinished) * 100);
    if (successRate < 70) {
      score -= 55;
      reasons.push(`Taxa de sucesso crítica (${successRate}%), abaixo do limite operacional de 70%.`);
    } else if (successRate < 90) {
      score -= 20;
      reasons.push(`Taxa de sucesso degradada (${successRate}%), abaixo da meta de 90%.`);
    }
  }

  // 2. Avaliação de latência média
  const finishedWithDuration = finished.filter(
    (e) => typeof e.duration_ms === "number" && e.duration_ms > 0
  );
  if (finishedWithDuration.length > 0) {
    const totalDuration = finishedWithDuration.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);
    const avgDuration = Math.round(totalDuration / finishedWithDuration.length);
    if (avgDuration > latencyThresholdMs) {
      score -= 20;
      reasons.push(
        `Latência média de ${avgDuration}ms excede o limiar aceitável de ${latencyThresholdMs}ms.`
      );
    }
  }

  // 3. Avaliação de alertas ativos (firing)
  const activeAlerts = alerts.filter((a) => a.status === "firing");
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");
  const warningAlerts = activeAlerts.filter((a) => a.severity === "warning");

  if (criticalAlerts.length > 0) {
    score -= 45;
    criticalAlerts.forEach((a) => {
      reasons.push(`Alerta crítico ativo: ${a.title}`);
    });
  }

  if (warningAlerts.length > 0) {
    score -= 15 * warningAlerts.length;
    warningAlerts.forEach((a) => {
      reasons.push(`Alerta em atenção: ${a.title}`);
    });
  }

  // Garantir limites de 0 a 100
  score = Math.max(0, Math.min(100, score));

  // Determinar status de saúde final
  let health: OperationalHealth = "saudavel";
  if (criticalAlerts.length > 0 || score < 50) {
    health = "critico";
  } else if (warningAlerts.length > 0 || score < 85) {
    health = "atencao";
  }

  if (reasons.length === 0) {
    reasons.push("Todas as execuções recentes foram bem-sucedidas e sem alertas pendentes.");
  }

  return {
    health,
    health_score: score,
    health_reasons: reasons,
  };
}
