import { describe, it, expect, beforeEach } from "vitest";
import { MetaAdsAdapter } from "@/lib/adapters/meta-ads";
import { WhatsAppCloudAdapter } from "@/lib/adapters/whatsapp-cloud";
import { GoogleCalendarAdapter } from "@/lib/adapters/google-calendar";
import { DbxCrmAdapter } from "@/lib/adapters/dbx-crm";
import { isValidLeadTransition, normalizePhoneNumber, isSlaCompliant } from "@/domain/leads";
import { Lead } from "@/domain/types";
import crypto from "crypto";

describe("Adaptadores Isolados e Regras de Negócio do Piloto DBX (Fase 5)", () => {
  describe("1. Meta Ads Adapter", () => {
    const metaAdapter = new MetaAdsAdapter({
      appSecret: "test_secret_123",
      verifyToken: "atmz_meta_verify_token_dbx",
    });

    it("valida o handshake de verificação do webhook da Meta Ads (hub.challenge)", () => {
      const challenge = "challenge_code_987";
      const valid = metaAdapter.verifyWebhookChallenge("subscribe", "atmz_meta_verify_token_dbx", challenge);
      expect(valid).toBe(challenge);

      const invalidToken = metaAdapter.verifyWebhookChallenge("subscribe", "wrong_token", challenge);
      expect(invalidToken).toBeNull();

      const invalidMode = metaAdapter.verifyWebhookChallenge("unsubscribe", "atmz_meta_verify_token_dbx", challenge);
      expect(invalidMode).toBeNull();
    });

    it("valida a assinatura HMAC SHA-256 do webhook da Meta Ads", () => {
      const payload = JSON.stringify({ entry: [{ id: "123" }] });
      const signatureHex = crypto.createHmac("sha256", "test_secret_123").update(payload).digest("hex");
      const signatureHeader = `sha256=${signatureHex}`;

      expect(metaAdapter.verifySignature(payload, signatureHeader)).toBe(true);
      expect(metaAdapter.verifySignature(payload, "sha256=invalid_hash_value_1234567890")).toBe(false);
    });

    it("faz parse e higienização correta do payload bruto do Lead Ads", () => {
      const rawPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  leadgen_id: "lead-ext-456",
                  form_id: "form-01",
                  campaign_name: "DBX - Aquisição B2B - High Intent",
                  field_data: [
                    { name: "full_name", values: ["Lucas Fonseca"] },
                    { name: "email", values: ["lucas@fonseca.com.br"] },
                    { name: "phone_number", values: ["+5511999991234"] },
                  ],
                },
              },
            ],
          },
        ],
      };

      const parsed = metaAdapter.parseLeadWebhookPayload(rawPayload);
      expect(parsed).not.toBeNull();
      expect(parsed?.external_lead_id).toBe("lead-ext-456");
      expect(parsed?.full_name).toBe("Lucas Fonseca");
      expect(parsed?.email).toBe("lucas@fonseca.com.br");
      expect(parsed?.phone).toBe("+5511999991234");
      expect(parsed?.campaign_name).toBe("DBX - Aquisição B2B - High Intent");
    });

    it("avalia métricas de tráfego e fornece recomendações operacionais (scale/pause)", () => {
      const metrics = metaAdapter.getCampaignMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      const highIntent = metrics.find((m) => m.recommendation === "scale");
      expect(highIntent).toBeDefined();
      expect(highIntent?.ctr).toBeGreaterThanOrEqual(3.0);
      expect(highIntent?.cpl).toBeLessThanOrEqual(highIntent?.target_cpl || 99);

      const toPause = metrics.find((m) => m.recommendation === "pause");
      expect(toPause).toBeDefined();
      expect(toPause?.cpl).toBeGreaterThan(toPause?.target_cpl || 0);
    });
  });

  describe("2. WhatsApp Cloud Adapter & SLA do SDR", () => {
    const whatsapp = new WhatsAppCloudAdapter();

    it("normaliza telefones de múltiplos formatos para o padrão internacional E.164", () => {
      expect(normalizePhoneNumber("11988887777")).toBe("+5511988887777");
      expect(normalizePhoneNumber("(11) 98888-7777")).toBe("+5511988887777");
      expect(normalizePhoneNumber("+5511988887777")).toBe("+5511988887777");
      expect(normalizePhoneNumber("5511988887777")).toBe("+5511988887777");
    });

    it("avalia conformidade do SLA de primeiro contato (< 60 segundos)", () => {
      expect(isSlaCompliant(15)).toBe(true);
      expect(isSlaCompliant(59)).toBe(true);
      expect(isSlaCompliant(60)).toBe(true);
      expect(isSlaCompliant(61)).toBe(false);
      expect(isSlaCompliant(null)).toBe(false);
    });

    it("dispara template de primeiro contato e retorna dados de telemetria", async () => {
      const result = await whatsapp.sendFirstContactTemplate({
        full_name: "Guilherme Santos",
        phone: "+5511999998888",
        campaign_name: "DBX B2B",
      });

      expect(result.success).toBe(true);
      expect(result.message_id).toContain("wamid.");
      expect(result.template_name).toBe("sdr_primeiro_contato_v1");
      expect(result.response_time_seconds).toBeLessThanOrEqual(60);
    });

    it("detecta pedido de transbordo humano na resposta do lead", () => {
      const result = whatsapp.processLeadReply("Gostaria de falar com um atendente humano por favor");
      expect(result.is_human_request).toBe(true);
      expect(result.lead_intent).toBe("human_handover");
    });

    it("detecta interesse de agendamento de reunião", () => {
      const result = whatsapp.processLeadReply("Pode ser amanhã às 15h, por favor");
      expect(result.is_human_request).toBe(false);
      expect(result.lead_intent).toBe("scheduling");
    });
  });

  describe("3. Google Calendar Adapter", () => {
    const calendar = new GoogleCalendarAdapter();

    it("retorna slots disponíveis para agendamento", async () => {
      const slots = await calendar.getAvailableSlots();
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].available).toBe(true);
    });

    it("agenda reunião de vendas e gera link do Google Meet", async () => {
      const meeting = await calendar.scheduleMeeting({
        lead_name: "Marcos Vinicius",
        lead_email: "marcos@empresa.com",
        closer_name: "Rodrigo Mendonça",
        closer_email: "rodrigo.m@dbxglobal.demo",
      });

      expect(meeting.success).toBe(true);
      expect(meeting.meeting_link).toContain("meet.google.com");
      expect(meeting.attendees).toContain("rodrigo.m@dbxglobal.demo");
      expect(meeting.attendees).toContain("marcos@empresa.com");
    });
  });

  describe("4. DBX CRM Adapter & Algoritmo de Split de Leads", () => {
    let crm: DbxCrmAdapter;

    beforeEach(() => {
      crm = new DbxCrmAdapter();
    });

    it("direciona lead Enterprise (score >= 8) preferencialmente para Closer Senior", () => {
      const leadEnterprise: Lead = {
        id: "lead-ent-01",
        organization_id: "org-1",
        company_id: "comp-1",
        full_name: "Diretor Corporativo",
        phone: "+5511999990001",
        email: "diretor@corp.com",
        source: "meta_ads",
        campaign_name: "High Intent",
        status: "qualificado",
        qualification_score: 9, // Enterprise
        qualification_notes: null,
        assigned_closer_id: null,
        assigned_closer_name: null,
        scheduled_meeting_at: null,
        first_contact_response_time_seconds: 25,
        meta_event_id: null,
        payload_raw: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = crm.assignLeadToCloser(leadEnterprise);
      expect(result.new_status).toBe("distribuido");
      expect(result.rule_applied).toContain("Senior");

      const closers = crm.getClosers();
      const assigned = closers.find((c) => c.id === result.closer_id);
      expect(assigned?.seniority).toBe("senior");
    });

    it("distribui lead Standard preferencialmente para Pleno ou Junior por balanceamento de carga", () => {
      const leadStandard: Lead = {
        id: "lead-std-01",
        organization_id: "org-1",
        company_id: "comp-1",
        full_name: "Pequeno Comércio",
        phone: "+5511999990002",
        email: "contato@loja.com",
        source: "meta_ads",
        campaign_name: "Geral",
        status: "qualificado",
        qualification_score: 5, // Standard
        qualification_notes: null,
        assigned_closer_id: null,
        assigned_closer_name: null,
        scheduled_meeting_at: null,
        first_contact_response_time_seconds: 30,
        meta_event_id: null,
        payload_raw: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = crm.assignLeadToCloser(leadStandard);
      expect(result.new_status).toBe("distribuido");

      const closers = crm.getClosers();
      const assigned = closers.find((c) => c.id === result.closer_id);
      expect(assigned?.seniority).not.toBe("senior");
    });

    it("bloqueia e lança erro quando todos os closers atingem o limite máximo diário de 8 leads", () => {
      // Configura todos os closers como lotados (8 leads cada)
      crm.setClosers(
        crm.getClosers().map((c) => ({
          ...c,
          current_leads_today: 8,
          max_daily_leads: 8,
        }))
      );

      const lead: Lead = {
        id: "lead-overflow-01",
        organization_id: "org-1",
        company_id: "comp-1",
        full_name: "Lead Excedente",
        phone: "+5511999990003",
        email: null,
        source: "meta_ads",
        campaign_name: "Geral",
        status: "qualificado",
        qualification_score: 7,
        qualification_notes: null,
        assigned_closer_id: null,
        assigned_closer_name: null,
        scheduled_meeting_at: null,
        first_contact_response_time_seconds: 22,
        meta_event_id: null,
        payload_raw: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(() => crm.assignLeadToCloser(lead)).toThrowError(
        /Capacidade diária esgotada em todos os closers disponíveis/
      );
    });
  });

  describe("5. Matriz de Transições Válidas de Status de Leads", () => {
    it("permite transições naturais do funil de vendas", () => {
      expect(isValidLeadTransition("captado", "contatado")).toBe(true);
      expect(isValidLeadTransition("contatado", "qualificado")).toBe(true);
      expect(isValidLeadTransition("qualificado", "reuniao_agendada")).toBe(true);
      expect(isValidLeadTransition("reuniao_agendada", "distribuido")).toBe(true);
    });

    it("permite desqualificação ou perda a partir de estados ativos", () => {
      expect(isValidLeadTransition("captado", "desqualificado")).toBe(true);
      expect(isValidLeadTransition("contatado", "perdido")).toBe(true);
      expect(isValidLeadTransition("distribuido", "perdido")).toBe(true);
    });

    it("rejeita saltos arbitrários e ilegais no funil", () => {
      expect(isValidLeadTransition("captado", "distribuido")).toBe(false);
      expect(isValidLeadTransition("captado", "reuniao_agendada")).toBe(false);
      expect(isValidLeadTransition("perdido", "distribuido")).toBe(false);
    });
  });
});
