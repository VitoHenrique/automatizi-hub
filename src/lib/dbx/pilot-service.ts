import { DbxCrmAdapter } from "@/lib/adapters/dbx-crm";
import { GoogleCalendarAdapter, ScheduledMeetingResult } from "@/lib/adapters/google-calendar";
import { MetaAdsAdapter } from "@/lib/adapters/meta-ads";
import { WhatsAppCloudAdapter } from "@/lib/adapters/whatsapp-cloud";
import {
  AGENT_GESTOR_TRAFEGO_ID,
  AGENT_SDR_RESPOSTA_ID,
  AGENT_SPLIT_LEADS_ID,
} from "@/lib/agents/store";
import { companiesRepository } from "@/lib/companies/store";
import { operationsRepository } from "@/lib/operations/store";
import { dbxStore } from "./store";
import { Lead, SplitAssignmentResult } from "@/domain/types";
import { logger } from "@/lib/logger/logger";

export interface PilotPipelineResult {
  isDuplicate: boolean;
  lead: Lead;
  sdrExecutionId?: string;
  splitExecutionId?: string;
  trafficExecutionId?: string;
  scheduledMeeting?: ScheduledMeetingResult;
  splitAssignment?: SplitAssignmentResult;
}

export class DbxPilotService {
  readonly metaAdapter = new MetaAdsAdapter();
  readonly whatsappAdapter = new WhatsAppCloudAdapter();
  readonly calendarAdapter = new GoogleCalendarAdapter();
  readonly crmAdapter = new DbxCrmAdapter();

  /**
   * Processa o fluxo end-to-end do piloto DBX disparado pelo webhook da Meta Ads
   */
  async processIncomingMetaLead(params: {
    organizationId: string;
    companyId: string;
    rawPayload: Record<string, unknown>;
    signature?: string | null;
    correlationId?: string;
  }): Promise<PilotPipelineResult> {
    const { organizationId, companyId, rawPayload, signature, correlationId } = params;
    const corrId = correlationId || `corr-pilot-${Date.now()}`;

    // 1. Parsing do payload do Meta Ads
    const parsed = this.metaAdapter.parseLeadWebhookPayload(rawPayload);
    if (!parsed) {
      throw new Error("Payload de lead do Meta Ads inválido ou corrompido");
    }

    const eventId = parsed.external_lead_id || `evt-${Date.now()}`;

    // 2. Registro e Deduplicação Idempotente do Webhook
    const { isDuplicate, event } = dbxStore.registerWebhookEvent(
      organizationId,
      "meta_ads",
      eventId,
      rawPayload,
      signature
    );

    if (isDuplicate) {
      logger.info("Webhook duplicado detectado no piloto DBX. Ignorando reprocessamento.", {
        correlationId: corrId,
        eventId,
      });
      const existingLeads = dbxStore.getLeads(organizationId, companyId);
      const existingLead = existingLeads.find((l) => l.meta_event_id === eventId) || existingLeads[0];
      return {
        isDuplicate: true,
        lead: existingLead,
      };
    }

    // 3. Criação do Lead em estado inicial 'captado'
    let lead = dbxStore.createLead({
      organization_id: organizationId,
      company_id: companyId,
      external_lead_id: parsed.external_lead_id,
      full_name: parsed.full_name,
      email: parsed.email || null,
      phone: parsed.phone,
      source: "meta_ads",
      campaign_name: parsed.campaign_name || "DBX - Aquisição B2B - High Intent",
      status: "captado",
      qualification_score: null,
      qualification_notes: null,
      assigned_closer_id: null,
      assigned_closer_name: null,
      scheduled_meeting_at: null,
      first_contact_response_time_seconds: null,
      meta_event_id: eventId,
      payload_raw: parsed.raw_fields,
    });

    let sdrExecutionId: string | undefined;
    let splitExecutionId: string | undefined;
    let trafficExecutionId: string | undefined;
    let scheduledMeeting: ScheduledMeetingResult | undefined;
    let splitAssignment: SplitAssignmentResult | undefined;

    try {
      // 4. Execução do Agente 2: SDR de Resposta Imediata (< 60s no WhatsApp)
      const sdrStart = Date.now();
      const sendResult = await this.whatsappAdapter.sendFirstContactTemplate({
        full_name: lead.full_name,
        phone: lead.phone,
        campaign_name: lead.campaign_name,
      });

      // Atualiza Lead para 'contatado' com tempo de resposta auditado
      lead = dbxStore.updateLead(lead.id, organizationId, {
        status: "contatado",
        first_contact_response_time_seconds: sendResult.response_time_seconds,
      });

      // Registro de telemetria da execução do SDR
      const sdrExec = operationsRepository.createExecution({
        organization_id: organizationId,
        company_id: companyId,
        agent_id: AGENT_SDR_RESPOSTA_ID,
        agent_version: "1.0.0",
        correlation_id: corrId,
        status: "success",
        started_at: new Date(sdrStart).toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - sdrStart,
        cost_cents: 6,
        input_summary: `Novo lead captado: ${lead.full_name} (${lead.phone})`,
        output_summary: `Mensagem WhatsApp disparada em ${sendResult.response_time_seconds}s (Template: ${sendResult.template_name})`,
        error_message: null,
        meta: {
          whatsapp_message_id: sendResult.message_id,
          sla_compliant: sendResult.response_time_seconds <= 60,
        },
      });
      sdrExecutionId = sdrExec.id;

      // 5. Qualificação BANT e Agendamento no Google Calendar
      const qualificationScore = Math.floor(Math.random() * 3) + 7; // Score 7 a 9 para demonstração
      const isMeetingReady = qualificationScore >= 8;

      if (isMeetingReady) {
        // Encontra closer com vaga para agendar reunião
        const availableClosers = this.crmAdapter.getClosers().filter((c) => c.active);
        const targetCloser = availableClosers[0] || {
          name: "Especialista DBX",
          email: "closer@dbxglobal.demo",
        };

        scheduledMeeting = await this.calendarAdapter.scheduleMeeting({
          lead_name: lead.full_name,
          lead_email: lead.email,
          closer_name: targetCloser.name,
          closer_email: targetCloser.email,
        });

        lead = dbxStore.updateLead(lead.id, organizationId, {
          status: "reuniao_agendada",
          qualification_score: qualificationScore,
          qualification_notes: `Qualificado com score ${qualificationScore}/10 via roteiro consultivo BANT. Reunião agendada via Google Meet.`,
          scheduled_meeting_at: scheduledMeeting.scheduled_at,
        });
      } else {
        lead = dbxStore.updateLead(lead.id, organizationId, {
          status: "qualificado",
          qualification_score: qualificationScore,
          qualification_notes: `Qualificado com score ${qualificationScore}/10. Aguardando confirmação de horário pelo lead.`,
        });
      }

      // 6. Execução do Agente 3: Split de Leads (Roteamento ponderado no CRM)
      const splitStart = Date.now();
      try {
        splitAssignment = this.crmAdapter.assignLeadToCloser(lead);
        lead = dbxStore.updateLead(lead.id, organizationId, {
          status: "distribuido",
          assigned_closer_id: splitAssignment.closer_id,
          assigned_closer_name: splitAssignment.closer_name,
        });

        const splitExec = operationsRepository.createExecution({
          organization_id: organizationId,
          company_id: companyId,
          agent_id: AGENT_SPLIT_LEADS_ID,
          agent_version: "0.9.0",
          correlation_id: corrId,
          status: "success",
          started_at: new Date(splitStart).toISOString(),
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - splitStart,
          cost_cents: 4,
          input_summary: `Lead ${lead.full_name} pronto para distribuição`,
          output_summary: `Atribuído para ${splitAssignment.closer_name} (${splitAssignment.rule_applied})`,
          error_message: null,
          meta: {
            assigned_closer_id: splitAssignment.closer_id,
            rule_applied: splitAssignment.rule_applied,
          },
        });
        splitExecutionId = splitExec.id;
      } catch (splitError: any) {
        // Capacidade esgotada -> emite alerta operacional formal
        operationsRepository.createAlert({
          organization_id: organizationId,
          company_id: companyId,
          agent_id: AGENT_SPLIT_LEADS_ID,
          title: "Capacidade de Closers Esgotada",
          description: `Não foi possível distribuir o lead ${lead.full_name}: ${splitError.message}`,
          severity: "warning",
          status: "firing",
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_at: null,
        });
      }

      // 7. Execução do Agente 1: Gestor de Tráfego (Retroalimentação de métricas e CPL)
      const trafficStart = Date.now();
      const metrics = this.metaAdapter.getCampaignMetrics();
      const mainCampaign = metrics[0];

      const trafficExec = operationsRepository.createExecution({
        organization_id: organizationId,
        company_id: companyId,
        agent_id: AGENT_GESTOR_TRAFEGO_ID,
        agent_version: "1.2.0",
        correlation_id: corrId,
        status: "success",
        started_at: new Date(trafficStart).toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - trafficStart,
        cost_cents: 8,
        input_summary: `Retroalimentação da conversão do lead ${lead.full_name} na campanha ${lead.campaign_name}`,
        output_summary: `CPL médio mantido em R$ ${mainCampaign.cpl.toFixed(2)} (Recomendação: ${mainCampaign.recommendation.toUpperCase()})`,
        error_message: null,
        meta: {
          campaign_id: mainCampaign.campaign_id,
          cpl: mainCampaign.cpl,
          roas: mainCampaign.roas,
        },
      });
      trafficExecutionId = trafficExec.id;

      // 8. Atualiza status do webhook como processado com sucesso
      dbxStore.updateWebhookStatus(event.id, "processed");

      // 9. Registra atividade na timeline da empresa
      companiesRepository.addActivity({
        organization_id: organizationId,
        company_id: companyId,
        actor_name: "Pipeline Piloto DBX",
        action_type: "lead.processed",
        title: `Novo lead ${lead.full_name} processado ponta a ponta`,
        description: `Lead captado via Meta Ads, contatado via WhatsApp em ${lead.first_contact_response_time_seconds}s e distribuído no CRM para ${lead.assigned_closer_name || "Fila de Espera"}.`,
      });

      return {
        isDuplicate: false,
        lead,
        sdrExecutionId,
        splitExecutionId,
        trafficExecutionId,
        scheduledMeeting,
        splitAssignment,
      };
    } catch (pipelineErr: any) {
      dbxStore.updateWebhookStatus(event.id, "failed", pipelineErr.message);
      throw pipelineErr;
    }
  }

  /**
   * Executa reatribuição manual de um lead pelo operador
   */
  manualSplit(leadId: string, organizationId: string): SplitAssignmentResult {
    const lead = dbxStore.getLeadById(leadId, organizationId);
    if (!lead) {
      throw new Error("Lead não encontrado");
    }

    const assignment = this.crmAdapter.assignLeadToCloser(lead);
    dbxStore.updateLead(lead.id, organizationId, {
      status: "distribuido",
      assigned_closer_id: assignment.closer_id,
      assigned_closer_name: assignment.closer_name,
    });

    companiesRepository.addActivity({
      organization_id: organizationId,
      company_id: lead.company_id,
      actor_name: "Operador",
      action_type: "lead.reassigned",
      title: `Lead ${lead.full_name} reatribuído manualmente`,
      description: `Reatribuído para ${assignment.closer_name} via ${assignment.rule_applied}.`,
    });

    return assignment;
  }
}

export const dbxPilotService = new DbxPilotService();
