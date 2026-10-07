import { describe, it, expect } from "vitest";
import { calculateAgentHealth } from "@/domain/health-calculator";
import { AgentExecution, Alert } from "@/domain/types";

describe("Cálculo de Saúde Operacional do Agente (docs/10-observability.md)", () => {
  const baseExecution: AgentExecution = {
    id: "exec-1",
    organization_id: "org-1",
    company_id: "comp-1",
    agent_id: "agent-1",
    agent_version: "1.0.0",
    correlation_id: "corr-1",
    status: "success",
    started_at: "2026-10-07T12:00:00.000Z",
    finished_at: "2026-10-07T12:00:01.000Z",
    duration_ms: 1000,
    cost_cents: 10,
    meta: {},
    created_at: "2026-10-07T12:00:00.000Z",
  };

  it("retorna 'sem_dados' quando não existem execuções recentes registradas", () => {
    const result = calculateAgentHealth({ executions: [] });
    expect(result.health).toBe("sem_dados");
    expect(result.health_score).toBe(0);
    expect(result.health_reasons[0]).toContain("Sem execuções registradas");
  });

  it("retorna 'saudavel' com score 100 para execuções 100% bem-sucedidas e sem alertas", () => {
    const executions: AgentExecution[] = [
      baseExecution,
      { ...baseExecution, id: "exec-2", duration_ms: 800 },
      { ...baseExecution, id: "exec-3", duration_ms: 1200 },
    ];

    const result = calculateAgentHealth({ executions });
    expect(result.health).toBe("saudavel");
    expect(result.health_score).toBe(100);
    expect(result.health_reasons[0]).toContain("bem-sucedidas");
  });

  it("reduz score e marca como 'atencao' quando taxa de sucesso cai para menos de 90%", () => {
    const executions: AgentExecution[] = [
      ...Array(8).fill(baseExecution).map((e, idx) => ({ ...e, id: `exec-${idx}` })),
      { ...baseExecution, id: "fail-1", status: "failed" },
      { ...baseExecution, id: "fail-2", status: "failed" },
    ]; // 8 sucessos de 10 = 80%

    const result = calculateAgentHealth({ executions });
    expect(result.health).toBe("atencao");
    expect(result.health_score).toBeLessThan(90);
    expect(result.health_reasons.some((r) => r.includes("Taxa de sucesso degradada"))).toBe(true);
  });

  it("marca como 'critico' quando taxa de sucesso cai para menos de 70%", () => {
    const executions: AgentExecution[] = [
      { ...baseExecution, id: "s-1", status: "success" },
      { ...baseExecution, id: "f-1", status: "failed" },
      { ...baseExecution, id: "f-2", status: "failed" },
    ]; // 1 sucesso de 3 = 33%

    const result = calculateAgentHealth({ executions });
    expect(result.health).toBe("critico");
    expect(result.health_score).toBeLessThanOrEqual(60);
    expect(result.health_reasons.some((r) => r.includes("Taxa de sucesso crítica"))).toBe(true);
  });

  it("penaliza score quando latência média excede o limiar aceitável", () => {
    const executions: AgentExecution[] = [
      { ...baseExecution, id: "slow-1", duration_ms: 7000 },
      { ...baseExecution, id: "slow-2", duration_ms: 8500 },
    ]; // Média > 5000ms

    const result = calculateAgentHealth({ executions, latencyThresholdMs: 5000 });
    expect(result.health).toBe("atencao");
    expect(result.health_reasons.some((r) => r.includes("Latência média"))).toBe(true);
  });

  it("marca como 'critico' imediatamente na presença de alerta crítico ativo (firing)", () => {
    const executions = [baseExecution];
    const alert: Alert = {
      id: "al-1",
      organization_id: "org-1",
      company_id: "comp-1",
      agent_id: "agent-1",
      severity: "critical",
      title: "Falha de autenticação no WhatsApp Cloud API",
      status: "firing",
      created_at: "2026-10-07T12:00:00.000Z",
      updated_at: "2026-10-07T12:00:00.000Z",
    };

    const result = calculateAgentHealth({ executions, alerts: [alert] });
    expect(result.health).toBe("critico");
    expect(result.health_reasons.some((r) => r.includes("Alerta crítico ativo"))).toBe(true);
  });
});
