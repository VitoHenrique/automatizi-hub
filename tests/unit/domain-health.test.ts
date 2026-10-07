import { describe, it, expect } from "vitest";
import { evaluateOperationalHealth } from "@/domain/health";

describe("Saúde Operacional Independente (DEC-003 & docs/10-observability.md)", () => {
  it("reporta 'sem_dados' quando não há telemetria recente", () => {
    const result = evaluateOperationalHealth({
      hasData: false,
      successRatePercent: 100,
      p95LatencyMs: 200,
      openCriticalAlertsCount: 0,
      openWarningAlertsCount: 0,
      failingIntegrationsCount: 0,
      lastExecutionMinutesAgo: null,
    });

    expect(result.health).toBe("sem_dados");
    expect(result.score).toBe(0);
    expect(result.reasons[0]).toContain("Nenhuma telemetria");
  });

  it("avalia como 'saudavel' com score alto quando todos os parâmetros estão normais", () => {
    const result = evaluateOperationalHealth({
      hasData: true,
      successRatePercent: 99.5,
      p95LatencyMs: 450,
      openCriticalAlertsCount: 0,
      openWarningAlertsCount: 0,
      failingIntegrationsCount: 0,
      lastExecutionMinutesAgo: 5,
    });

    expect(result.health).toBe("saudavel");
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.reasons[0]).toContain("parâmetros ideais");
  });

  it("avalia como 'critico' imediatamente na presença de alertas críticos não resolvidos", () => {
    const result = evaluateOperationalHealth({
      hasData: true,
      successRatePercent: 98,
      p95LatencyMs: 500,
      openCriticalAlertsCount: 2,
      openWarningAlertsCount: 0,
      failingIntegrationsCount: 0,
      lastExecutionMinutesAgo: 1,
    });

    expect(result.health).toBe("critico");
    expect(result.reasons.some((r) => r.includes("2 alerta(s) crítico(s)"))).toBe(true);
  });

  it("avalia como 'degradado' quando uma integração externa falha", () => {
    const result = evaluateOperationalHealth({
      hasData: true,
      successRatePercent: 95,
      p95LatencyMs: 600,
      openCriticalAlertsCount: 0,
      openWarningAlertsCount: 1,
      failingIntegrationsCount: 1,
      lastExecutionMinutesAgo: 2,
    });

    expect(result.health).toBe("degradado");
    expect(result.reasons.some((r) => r.includes("integração(ões) externa(s) em estado de falha"))).toBe(true);
  });

  it("avalia como 'atencao' quando há alertas de aviso ou queda moderada de performance", () => {
    const result = evaluateOperationalHealth({
      hasData: true,
      successRatePercent: 94,
      p95LatencyMs: 3000,
      openCriticalAlertsCount: 0,
      openWarningAlertsCount: 1,
      failingIntegrationsCount: 0,
      lastExecutionMinutesAgo: 5,
    });

    expect(result.health).toBe("atencao");
  });
});
