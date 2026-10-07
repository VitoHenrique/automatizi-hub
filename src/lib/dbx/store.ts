import { Closer, Lead, LeadStatus, WebhookEvent } from "@/domain/types";
import { isValidLeadTransition } from "@/domain/leads";

const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const DBX_COMPANY_ID = "22222222-2222-2222-2222-222222222222";

const initialLeads: Lead[] = [
  {
    id: "lead-00000000-0000-0000-0000-000000000001",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    external_lead_id: "meta-leadgen-1001",
    full_name: "Marcos Vinicius Rezende",
    email: "marcos.rezende@empresa-alpha.com.br",
    phone: "+5511991234567",
    source: "meta_ads",
    campaign_name: "DBX - Aquisição B2B - High Intent",
    status: "distribuido",
    qualification_score: 9,
    qualification_notes: "Faturamento acima de R$ 80k/mês; busca automação de atendimento urgente.",
    assigned_closer_id: "closer-01",
    assigned_closer_name: "Rodrigo Mendonça",
    scheduled_meeting_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    first_contact_response_time_seconds: 32,
    meta_event_id: "evt-meta-1001",
    payload_raw: {
      budget: "R$ 80k+/mês",
      urgency: "imediata",
      segment: "Logística B2B",
    },
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-00000000-0000-0000-0000-000000000002",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    external_lead_id: "meta-leadgen-1002",
    full_name: "Camila Guimarães",
    email: "camila@guimaraesadv.com.br",
    phone: "+5511998765432",
    source: "meta_ads",
    campaign_name: "DBX - Aquisição B2B - High Intent",
    status: "reuniao_agendada",
    qualification_score: 8,
    qualification_notes: "Interesse em qualificação com SDR de WhatsApp e integração CRM.",
    assigned_closer_id: "closer-02",
    assigned_closer_name: "Mariana Alencar",
    scheduled_meeting_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    first_contact_response_time_seconds: 28,
    meta_event_id: "evt-meta-1002",
    payload_raw: {
      budget: "R$ 55k/mês",
      segment: "Advocacia Corporativa",
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead-00000000-0000-0000-0000-000000000003",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    external_lead_id: "meta-leadgen-1003",
    full_name: "Felipe Siqueira",
    email: "felipe.siqueira@varejocentral.com",
    phone: "+5511977778888",
    source: "meta_ads",
    campaign_name: "DBX - Aquisição B2B - High Intent",
    status: "contatado",
    qualification_score: null,
    qualification_notes: "Abordagem no WhatsApp enviada; aguardando resposta sobre volume de atendimento.",
    assigned_closer_id: null,
    assigned_closer_name: null,
    scheduled_meeting_at: null,
    first_contact_response_time_seconds: 41,
    meta_event_id: "evt-meta-1003",
    payload_raw: {
      segment: "Varejo",
    },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
  },
];

const initialWebhookEvents: WebhookEvent[] = [
  {
    id: "wh-evt-00000000-0000-0000-0000-000000000001",
    organization_id: DEFAULT_ORG_ID,
    provider: "meta_ads",
    event_id: "evt-meta-1001",
    signature: "sha256=mocked_signature_valid",
    status: "processed",
    payload: { leadgen_id: "meta-leadgen-1001" },
    processed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    error_message: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-evt-00000000-0000-0000-0000-000000000002",
    organization_id: DEFAULT_ORG_ID,
    provider: "meta_ads",
    event_id: "evt-meta-1002",
    signature: "sha256=mocked_signature_valid",
    status: "processed",
    payload: { leadgen_id: "meta-leadgen-1002" },
    processed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    error_message: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

class DbxStore {
  private leads: Lead[] = [...initialLeads];
  private webhookEvents: WebhookEvent[] = [...initialWebhookEvents];

  // ==========================================
  // WEBHOOK EVENTS & DEDUPLICAÇÃO
  // ==========================================

  findWebhookEvent(organizationId: string, provider: string, eventId: string): WebhookEvent | undefined {
    return this.webhookEvents.find(
      (e) => e.organization_id === organizationId && e.provider === provider && e.event_id === eventId
    );
  }

  registerWebhookEvent(
    organizationId: string,
    provider: "meta_ads" | "dbx_crm" | "whatsapp_cloud" | "google_calendar" | "webhook",
    eventId: string,
    payload: Record<string, unknown>,
    signature?: string | null
  ): { isDuplicate: boolean; event: WebhookEvent } {
    const existing = this.findWebhookEvent(organizationId, provider, eventId);
    if (existing) {
      return { isDuplicate: true, event: existing };
    }

    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      provider,
      event_id: eventId,
      signature: signature || null,
      status: "received",
      payload,
      processed_at: null,
      error_message: null,
      created_at: new Date().toISOString(),
    };

    this.webhookEvents.unshift(event);
    return { isDuplicate: false, event };
  }

  updateWebhookStatus(eventId: string, status: "processed" | "failed" | "duplicate", errorMessage?: string | null) {
    const event = this.webhookEvents.find((e) => e.id === eventId);
    if (event) {
      event.status = status;
      event.processed_at = new Date().toISOString();
      event.error_message = errorMessage || null;
    }
  }

  // ==========================================
  // LEADS STORE
  // ==========================================

  getLeads(
    organizationId: string,
    companyId?: string,
    filters?: { status?: LeadStatus; closer_id?: string; query?: string }
  ): Lead[] {
    return this.leads
      .filter((l) => {
        if (l.organization_id !== organizationId) return false;
        if (companyId && l.company_id !== companyId) return false;
        if (filters?.status && l.status !== filters.status) return false;
        if (filters?.closer_id && l.assigned_closer_id !== filters.closer_id) return false;
        if (filters?.query) {
          const q = filters.query.toLowerCase();
          const matchName = l.full_name.toLowerCase().includes(q);
          const matchPhone = l.phone.includes(q);
          const matchEmail = l.email ? l.email.toLowerCase().includes(q) : false;
          if (!matchName && !matchPhone && !matchEmail) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getLeadById(id: string, organizationId: string): Lead | undefined {
    return this.leads.find((l) => l.id === id && l.organization_id === organizationId);
  }

  createLead(data: Omit<Lead, "id" | "created_at" | "updated_at">): Lead {
    const now = new Date().toISOString();
    const newLead: Lead = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    this.leads.unshift(newLead);
    return newLead;
  }

  updateLead(id: string, organizationId: string, updates: Partial<Lead>): Lead {
    const lead = this.getLeadById(id, organizationId);
    if (!lead) {
      throw new Error("Lead não encontrado");
    }

    if (updates.status && updates.status !== lead.status) {
      if (!isValidLeadTransition(lead.status, updates.status)) {
        throw new Error(`Transição de status inválida de '${lead.status}' para '${updates.status}'`);
      }
    }

    Object.assign(lead, updates, { updated_at: new Date().toISOString() });
    return lead;
  }

  resetDemoData() {
    this.leads = [...initialLeads];
    this.webhookEvents = [...initialWebhookEvents];
  }
}

export const dbxStore = new DbxStore();
