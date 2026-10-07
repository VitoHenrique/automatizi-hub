import { IntegrationAdapter, SyncResult } from "@/domain/adapters";
import { AdapterHealthResult, Closer, IntegrationProvider, Lead, SplitAssignmentResult } from "@/domain/types";

export class DbxCrmAdapter implements IntegrationAdapter {
  readonly provider: IntegrationProvider = "dbx_crm";
  readonly name = "CRM Próprio DBX";

  private closers: Closer[] = [
    {
      id: "closer-01",
      name: "Rodrigo Mendonça",
      email: "rodrigo.m@dbxglobal.demo",
      phone: "+5511988881111",
      seniority: "senior",
      tier_specialty: "enterprise",
      max_daily_leads: 8,
      current_leads_today: 3,
      active: true,
    },
    {
      id: "closer-02",
      name: "Mariana Alencar",
      email: "mariana.a@dbxglobal.demo",
      phone: "+5511988882222",
      seniority: "senior",
      tier_specialty: "enterprise",
      max_daily_leads: 8,
      current_leads_today: 4,
      active: true,
    },
    {
      id: "closer-03",
      name: "Carlos Eduardo",
      email: "carlos.e@dbxglobal.demo",
      phone: "+5511988883333",
      seniority: "pleno",
      tier_specialty: "standard",
      max_daily_leads: 8,
      current_leads_today: 2,
      active: true,
    },
    {
      id: "closer-04",
      name: "Beatriz Lima",
      email: "beatriz.l@dbxglobal.demo",
      phone: "+5511988884444",
      seniority: "junior",
      tier_specialty: "standard",
      max_daily_leads: 8,
      current_leads_today: 1,
      active: true,
    },
  ];

  /**
   * Retorna os closers cadastrados
   */
  getClosers(): Closer[] {
    return [...this.closers];
  }

  /**
   * Atualiza lista de closers
   */
  setClosers(closers: Closer[]) {
    this.closers = [...closers];
  }

  /**
   * Executa a regra formal de split de leads do Agente "Split de Leads"
   * - Leads Enterprise (score >= 8 ou faturamento > 50k) vão para closers Senior
   * - Leads Standard são distribuídos por menor carga do dia
   * - Limite estrito de 8 novos leads por dia por closer
   */
  assignLeadToCloser(lead: Lead): SplitAssignmentResult {
    const isEnterprise =
      (lead.qualification_score !== null && lead.qualification_score !== undefined && lead.qualification_score >= 8) ||
      (typeof lead.payload_raw?.budget === "string" && lead.payload_raw.budget.includes("50k"));

    // Filtra closers ativos que ainda têm capacidade disponível hoje (< max_daily_leads)
    const availableClosers = this.closers.filter((c) => c.active && c.current_leads_today < c.max_daily_leads);

    if (availableClosers.length === 0) {
      throw new Error("Capacidade diária esgotada em todos os closers disponíveis (limite de 8 leads/dia atingido).");
    }

    let selectedCloser: Closer;
    let ruleApplied: string;

    if (isEnterprise) {
      const seniorClosers = availableClosers.filter((c) => c.seniority === "senior");
      if (seniorClosers.length > 0) {
        // Round-robin / balanceamento de carga: pega o que recebeu menos leads hoje
        seniorClosers.sort((a, b) => a.current_leads_today - b.current_leads_today);
        selectedCloser = seniorClosers[0];
        ruleApplied = "Enterprise -> Closer Senior com menor carga";
      } else {
        // Fallback para qualquer closer com vaga
        availableClosers.sort((a, b) => a.current_leads_today - b.current_leads_today);
        selectedCloser = availableClosers[0];
        ruleApplied = "Enterprise Fallback (sem senior vago) -> Menor carga";
      }
    } else {
      // Standard -> prefere pleno/junior primeiro para poupar seniors para enterprise
      const standardClosers = availableClosers.filter((c) => c.seniority !== "senior");
      if (standardClosers.length > 0) {
        standardClosers.sort((a, b) => a.current_leads_today - b.current_leads_today);
        selectedCloser = standardClosers[0];
        ruleApplied = "Standard -> Closer Pleno/Junior por balanceamento de carga";
      } else {
        availableClosers.sort((a, b) => a.current_leads_today - b.current_leads_today);
        selectedCloser = availableClosers[0];
        ruleApplied = "Standard Fallback -> Menor carga geral";
      }
    }

    // Incrementa contador do closer selecionado
    selectedCloser.current_leads_today += 1;

    return {
      lead_id: lead.id,
      closer_id: selectedCloser.id,
      closer_name: selectedCloser.name,
      rule_applied: ruleApplied,
      previous_status: lead.status,
      new_status: "distribuido",
    };
  }

  async healthCheck(): Promise<AdapterHealthResult> {
    return {
      is_healthy: true,
      latency_ms: 18,
      last_sync_at: new Date().toISOString(),
      details: {
        crm_version: "v3.4-dbx",
        active_closers: this.closers.filter((c) => c.active).length,
        total_capacity_remaining: this.closers.reduce(
          (acc, curr) => acc + Math.max(0, curr.max_daily_leads - curr.current_leads_today),
          0
        ),
      },
    };
  }

  async sync(): Promise<SyncResult> {
    return {
      success: true,
      itemsProcessed: this.closers.length,
      metadata: {
        active_closers_count: this.closers.filter((c) => c.active).length,
      },
    };
  }
}
