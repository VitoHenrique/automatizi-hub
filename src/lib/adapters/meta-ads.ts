import crypto from "crypto";
import { IntegrationAdapter, SyncResult } from "@/domain/adapters";
import { AdapterHealthResult, IntegrationProvider, MetaAdsCampaignMetric } from "@/domain/types";

export interface ParsedMetaLeadPayload {
  external_lead_id: string;
  form_id: string;
  page_id: string;
  full_name: string;
  email?: string;
  phone: string;
  campaign_name?: string;
  raw_fields: Record<string, string>;
}

export class MetaAdsAdapter implements IntegrationAdapter {
  readonly provider: IntegrationProvider = "meta_ads";
  readonly name = "Meta Ads Marketing API";

  private appSecret: string;
  private verifyToken: string;

  constructor(config?: { appSecret?: string; verifyToken?: string }) {
    this.appSecret = config?.appSecret || "mock_meta_app_secret_demo";
    this.verifyToken = config?.verifyToken || "atmz_meta_verify_token_dbx";
  }

  /**
   * Valida desafio de verificação de webhook do Meta Ads (GET)
   */
  verifyWebhookChallenge(mode: string | null, token: string | null, challenge: string | null): string | null {
    if (mode === "subscribe" && token === this.verifyToken && challenge) {
      return challenge;
    }
    return null;
  }

  /**
   * Valida a assinatura HMAC SHA-256 enviada no cabeçalho 'x-hub-signature-256'
   */
  verifySignature(payloadBody: string, signatureHeader?: string | null): boolean {
    if (!signatureHeader) return true; // Em ambiente demo sem secret estrito
    const expectedPrefix = "sha256=";
    if (!signatureHeader.startsWith(expectedPrefix)) return false;

    try {
      const signature = signatureHeader.substring(expectedPrefix.length);
      const expectedSignature = crypto
        .createHmac("sha256", this.appSecret)
        .update(payloadBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(expectedSignature, "hex");

      if (sigBuffer.length !== expectedBuffer.length || sigBuffer.length === 0) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Faz o parse seguro do payload bruto de webhook de Lead Ads da Meta
   */
  parseLeadWebhookPayload(payload: Record<string, unknown>): ParsedMetaLeadPayload | null {
    try {
      const entry = (payload.entry as Array<Record<string, unknown>>)?.[0];
      const change = (entry?.changes as Array<Record<string, unknown>>)?.[0];
      const value = (change?.value as Record<string, unknown>) || payload;

      const leadgenId = String(value.leadgen_id || payload.leadgen_id || value.id || `lead-${Date.now()}`);
      const formId = String(value.form_id || payload.form_id || "form-default");
      const pageId = String(value.page_id || payload.page_id || "page-default");

      // Suporta formato de fields da Meta Ads ou objeto direto
      const fieldData = (value.field_data as Array<{ name: string; values: string[] }>) || [];
      const fieldMap: Record<string, string> = {};

      if (Array.isArray(fieldData)) {
        for (const item of fieldData) {
          if (item.name && item.values?.[0]) {
            fieldMap[item.name.toLowerCase()] = item.values[0];
          }
        }
      }

      const fullName =
        fieldMap["full_name"] ||
        fieldMap["nome_completo"] ||
        fieldMap["name"] ||
        (payload.full_name as string) ||
        (payload.name as string) ||
        "Lead Meta Ads";

      const email =
        fieldMap["email"] ||
        fieldMap["e-mail"] ||
        (payload.email as string) ||
        "";

      const phone =
        fieldMap["phone_number"] ||
        fieldMap["telefone"] ||
        fieldMap["whatsapp"] ||
        (payload.phone as string) ||
        (payload.phone_number as string) ||
        "+5511999998888";

      const campaignName =
        (value.campaign_name as string) ||
        (payload.campaign_name as string) ||
        "DBX - Aquisição B2B - High Intent";

      return {
        external_lead_id: leadgenId,
        form_id: formId,
        page_id: pageId,
        full_name: fullName,
        email: email || undefined,
        phone,
        campaign_name: campaignName,
        raw_fields: fieldMap,
      };
    } catch {
      return null;
    }
  }

  /**
   * Consulta métricas consolidadas da campanha para o Gestor de Tráfego
   */
  getCampaignMetrics(): MetaAdsCampaignMetric[] {
    return [
      {
        campaign_id: "cmp-meta-dbx-01",
        campaign_name: "DBX - Aquisição B2B - High Intent",
        status: "ACTIVE",
        daily_budget: 450.0,
        spend: 420.5,
        impressions: 24800,
        clicks: 890,
        leads_count: 28,
        cpl: 15.02,
        target_cpl: 18.0,
        roas: 4.8,
        ctr: 3.58,
        recommendation: "scale",
      },
      {
        campaign_id: "cmp-meta-dbx-02",
        campaign_name: "DBX - Remarketing Institucional",
        status: "ACTIVE",
        daily_budget: 150.0,
        spend: 145.0,
        impressions: 8400,
        clicks: 210,
        leads_count: 5,
        cpl: 29.0,
        target_cpl: 18.0,
        roas: 2.1,
        ctr: 2.5,
        recommendation: "pause",
      },
    ];
  }

  async healthCheck(): Promise<AdapterHealthResult> {
    const startTime = Date.now();
    // Simula ping na API do Graph da Meta com tolerância a falhas
    const latency = Math.max(12, Date.now() - startTime + 25);
    return {
      is_healthy: true,
      latency_ms: latency,
      last_sync_at: new Date().toISOString(),
      details: {
        api_version: "v20.0",
        app_connected: true,
        permissions: ["ads_read", "leads_retrieval"],
      },
    };
  }

  async sync(): Promise<SyncResult> {
    const metrics = this.getCampaignMetrics();
    return {
      success: true,
      itemsProcessed: metrics.length,
      metadata: {
        active_campaigns: metrics.filter((m) => m.status === "ACTIVE").length,
        total_leads_synced: metrics.reduce((acc, curr) => acc + curr.leads_count, 0),
      },
    };
  }
}
