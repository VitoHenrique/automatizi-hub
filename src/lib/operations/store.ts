import {
  AgentExecution,
  Alert,
  Incident,
  OperationalMetricsSummary,
} from "@/domain/types";
import {
  AGENT_GESTOR_TRAFEGO_ID,
  AGENT_SDR_RESPOSTA_ID,
  AGENT_SPLIT_LEADS_ID,
} from "@/lib/agents/store";

const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const DBX_COMPANY_ID = "22222222-2222-2222-2222-222222222222";

export const EXECUTION_DEMO_1_ID = "44444444-4444-4444-4444-444444444441";
export const EXECUTION_DEMO_2_ID = "44444444-4444-4444-4444-444444444442";
export const EXECUTION_DEMO_3_ID = "44444444-4444-4444-4444-444444444443";

export const ALERT_DEMO_1_ID = "55555555-5555-5555-5555-555555555551";
export const ALERT_DEMO_2_ID = "55555555-5555-5555-5555-555555555552";

const initialExecutions: AgentExecution[] = [
  {
    id: EXECUTION_DEMO_1_ID,
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_GESTOR_TRAFEGO_ID,
    agent_version: "1.2.0",
    correlation_id: "corr-traffic-sync-01",
    status: "success",
    started_at: "2026-10-07T12:00:00.000Z",
    finished_at: "2026-10-07T12:00:01.250Z",
    duration_ms: 1250,
    cost_cents: 14,
    input_summary: "Sincronização periódica de criativos de topo e CPL médio.",
    output_summary: "Campanhas otimizadas com sucesso; 14 novos leads inseridos no CRM.",
    error_message: null,
    meta: { api_calls: 3, platform: "Meta Ads Marketing API" },
    created_at: "2026-10-07T12:00:00.000Z",
  },
  {
    id: EXECUTION_DEMO_2_ID,
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_GESTOR_TRAFEGO_ID,
    agent_version: "1.2.0",
    correlation_id: "corr-traffic-sync-02",
    status: "success",
    started_at: "2026-10-07T14:30:00.000Z",
    finished_at: "2026-10-07T14:30:00.980Z",
    duration_ms: 980,
    cost_cents: 8,
    input_summary: "Ajuste autônomo de lances para grupo de anúncios 'Imóveis Alto Padrão'.",
    output_summary: "Bid incrementado em 8% conforme taxa de conversão superior a 3.5%.",
    error_message: null,
    meta: { api_calls: 2, platform: "Meta Ads Marketing API" },
    created_at: "2026-10-07T14:30:00.000Z",
  },
  {
    id: EXECUTION_DEMO_3_ID,
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_SDR_RESPOSTA_ID,
    agent_version: "1.0.0",
    correlation_id: "corr-sdr-lead-99",
    status: "success",
    started_at: "2026-10-07T15:10:00.000Z",
    finished_at: "2026-10-07T15:10:00.410Z",
    duration_ms: 410,
    cost_cents: 5,
    input_summary: "Lead inbound 'Dr. Roberto Mendes' captado via página de aterrissagem.",
    output_summary: "Mensagem enviada em 38s; lead respondeu positivamente e pré-agendou reunião.",
    error_message: null,
    meta: { channel: "whatsapp", sla_met: true },
    created_at: "2026-10-07T15:10:00.000Z",
  },
];

const initialAlerts: Alert[] = [
  {
    id: ALERT_DEMO_1_ID,
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_GESTOR_TRAFEGO_ID,
    execution_id: EXECUTION_DEMO_1_ID,
    incident_id: null,
    severity: "warning",
    title: "Latência temporária no webhook Meta Ads",
    description: "Tempo de resposta do webhook superou 2.000ms na última janela de verificação.",
    status: "firing",
    acknowledged_at: null,
    acknowledged_by: null,
    resolved_at: null,
    resolved_by: null,
    created_at: "2026-10-07T13:00:00.000Z",
    updated_at: "2026-10-07T13:00:00.000Z",
  },
  {
    id: ALERT_DEMO_2_ID,
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_SDR_RESPOSTA_ID,
    execution_id: null,
    incident_id: null,
    severity: "info",
    title: "Meta WhatsApp Cloud API homologada",
    description: "Janela de testes operacionais concluída com sucesso.",
    status: "resolved",
    acknowledged_at: "2026-10-07T10:30:00.000Z",
    acknowledged_by: "00000000-0000-0000-0000-000000000001",
    resolved_at: "2026-10-07T11:00:00.000Z",
    resolved_by: "00000000-0000-0000-0000-000000000001",
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T11:00:00.000Z",
  },
];

const initialIncidents: Incident[] = [];

let executionsStore: AgentExecution[] = [...initialExecutions];
let alertsStore: Alert[] = [...initialAlerts];
let incidentsStore: Incident[] = [...initialIncidents];

export const operationsRepository = {
  // Executions
  listExecutions(
    orgId: string,
    filters?: {
      companyId?: string;
      agentId?: string;
      status?: string;
      limit?: number;
    }
  ): AgentExecution[] {
    return executionsStore
      .filter((e) => {
        if (e.organization_id !== orgId) return false;
        if (filters?.companyId && e.company_id !== filters.companyId) return false;
        if (filters?.agentId && e.agent_id !== filters.agentId) return false;
        if (filters?.status && filters.status !== "all" && e.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, filters?.limit || 50);
  },

  findExecutionById(id: string, orgId: string): AgentExecution | null {
    const found = executionsStore.find((e) => e.id === id && e.organization_id === orgId);
    return found || null;
  },

  createExecution(data: Omit<AgentExecution, "id" | "created_at">): AgentExecution {
    const now = new Date().toISOString();
    const newExecution: AgentExecution = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
    };
    executionsStore.unshift(newExecution);
    return newExecution;
  },

  getMetricsSummary(
    orgId: string,
    filters?: { companyId?: string; agentId?: string }
  ): OperationalMetricsSummary {
    const relevantExecutions = executionsStore.filter((e) => {
      if (e.organization_id !== orgId) return false;
      if (filters?.companyId && e.company_id !== filters.companyId) return false;
      if (filters?.agentId && e.agent_id !== filters.agentId) return false;
      return true;
    });

    const relevantAlerts = alertsStore.filter((a) => {
      if (a.organization_id !== orgId) return false;
      if (filters?.companyId && a.company_id !== filters.companyId) return false;
      if (filters?.agentId && a.agent_id !== filters.agentId) return false;
      return true;
    });

    const total = relevantExecutions.length;
    const successes = relevantExecutions.filter((e) => e.status === "success").length;
    const failures = relevantExecutions.filter((e) => e.status === "failed" || e.status === "timeout").length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 100;

    const executionsWithDuration = relevantExecutions.filter((e) => typeof e.duration_ms === "number" && e.duration_ms > 0);
    const avgDuration =
      executionsWithDuration.length > 0
        ? Math.round(
            executionsWithDuration.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0) /
              executionsWithDuration.length
          )
        : 0;

    const totalCost = relevantExecutions.reduce((acc, curr) => acc + (curr.cost_cents || 0), 0);
    const firingAlerts = relevantAlerts.filter((a) => a.status === "firing");
    const criticalAlerts = firingAlerts.filter((a) => a.severity === "critical");

    return {
      total_executions: total,
      success_count: successes,
      failure_count: failures,
      success_rate: successRate,
      avg_duration_ms: avgDuration,
      total_cost_cents: totalCost,
      firing_alerts_count: firingAlerts.length,
      critical_alerts_count: criticalAlerts.length,
    };
  },

  // Alerts
  listAlerts(
    orgId: string,
    filters?: {
      companyId?: string;
      agentId?: string;
      status?: string;
      severity?: string;
    }
  ): Alert[] {
    return alertsStore
      .filter((a) => {
        if (a.organization_id !== orgId) return false;
        if (filters?.companyId && a.company_id !== filters.companyId) return false;
        if (filters?.agentId && a.agent_id !== filters.agentId) return false;
        if (filters?.status && filters.status !== "all" && a.status !== filters.status) return false;
        if (filters?.severity && filters.severity !== "all" && a.severity !== filters.severity) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findAlertById(id: string, orgId: string): Alert | null {
    const found = alertsStore.find((a) => a.id === id && a.organization_id === orgId);
    return found || null;
  },

  createAlert(data: Omit<Alert, "id" | "created_at" | "updated_at">): Alert {
    const now = new Date().toISOString();
    const newAlert: Alert = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    alertsStore.unshift(newAlert);
    return newAlert;
  },

  acknowledgeAlert(id: string, orgId: string, userId: string): Alert | null {
    const idx = alertsStore.findIndex((a) => a.id === id && a.organization_id === orgId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const updated: Alert = {
      ...alertsStore[idx],
      status: "acknowledged",
      acknowledged_at: now,
      acknowledged_by: userId,
      updated_at: now,
    };
    alertsStore[idx] = updated;
    return updated;
  },

  resolveAlert(id: string, orgId: string, userId: string): Alert | null {
    const idx = alertsStore.findIndex((a) => a.id === id && a.organization_id === orgId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const updated: Alert = {
      ...alertsStore[idx],
      status: "resolved",
      resolved_at: now,
      resolved_by: userId,
      updated_at: now,
    };
    alertsStore[idx] = updated;
    return updated;
  },

  // Incidents
  listIncidents(orgId: string, filters?: { companyId?: string; agentId?: string; status?: string }): Incident[] {
    return incidentsStore
      .filter((i) => {
        if (i.organization_id !== orgId) return false;
        if (filters?.companyId && i.company_id !== filters.companyId) return false;
        if (filters?.agentId && i.agent_id !== filters.agentId) return false;
        if (filters?.status && filters.status !== "all" && i.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createIncident(data: Omit<Incident, "id" | "created_at" | "updated_at">): Incident {
    const now = new Date().toISOString();
    const newIncident: Incident = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    incidentsStore.unshift(newIncident);
    return newIncident;
  },

  resetForTests() {
    executionsStore = [...initialExecutions];
    alertsStore = [...initialAlerts];
    incidentsStore = [...initialIncidents];
  },
};
