import crypto from "crypto";
import { ApiKey, Integration } from "@/domain/types";

const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const DBX_COMPANY_ID = "22222222-2222-2222-2222-222222222222";

export const DEMO_HERMES_API_KEY = "atmz_hermes_pilot_secret_key_12345";
export const DEMO_HERMES_KEY_PREFIX = "atmz_hermes_pilot";
export const DEMO_HERMES_KEY_ID = "66666666-6666-6666-6666-666666666661";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

const initialApiKeys: ApiKey[] = [
  {
    id: DEMO_HERMES_KEY_ID,
    organization_id: DEFAULT_ORG_ID,
    name: "Hermes Orquestrador Principal",
    key_prefix: DEMO_HERMES_KEY_PREFIX,
    key_hash: hashApiKey(DEMO_HERMES_API_KEY),
    role: "service_agent",
    scopes: ["hermes:read", "hermes:operate"],
    last_used_at: "2026-10-07T12:00:00.000Z",
    expires_at: null,
    revoked_at: null,
    created_at: "2026-10-07T10:00:00.000Z",
  },
];

const initialIntegrations: Integration[] = [
  {
    id: "int-1",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    provider: "meta_ads",
    name: "Meta Ads Marketing API",
    status: "connected",
    last_sync_at: "2026-10-07T15:00:00.000Z",
    error_details: null,
    config: { account_id: "act_99182312", ad_sets: 4 },
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T15:00:00.000Z",
  },
  {
    id: "int-2",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    provider: "dbx_crm",
    name: "CRM Próprio DBX",
    status: "connected",
    last_sync_at: "2026-10-07T15:15:00.000Z",
    error_details: null,
    config: { base_url: "https://crm.dbxglobal.internal/api/v2" },
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T15:15:00.000Z",
  },
  {
    id: "int-3",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    provider: "whatsapp_cloud",
    name: "WhatsApp Cloud API",
    status: "connected",
    last_sync_at: "2026-10-07T15:20:00.000Z",
    error_details: null,
    config: { phone_number_id: "10982391209" },
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T15:20:00.000Z",
  },
  {
    id: "int-4",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    provider: "google_calendar",
    name: "Google Calendar Closer",
    status: "connected",
    last_sync_at: "2026-10-07T15:25:00.000Z",
    error_details: null,
    config: { calendar_id: "vendas@dbxglobal.com" },
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T15:25:00.000Z",
  },
];

let apiKeysStore: ApiKey[] = [...initialApiKeys];
let integrationsStore: Integration[] = [...initialIntegrations];
let circuitBreakerState = {
  status: "online" as "online" | "degraded" | "offline",
  last_ping: new Date().toISOString(),
  latency_ms: 85,
};

export const hermesRepository = {
  // API Keys
  listApiKeys(orgId: string): ApiKey[] {
    return apiKeysStore
      .filter((k) => k.organization_id === orgId && !k.revoked_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createApiKey(
    orgId: string,
    name: string,
    role: ApiKey["role"] = "service_agent",
    scopes: string[] = ["hermes:read", "hermes:operate"],
    expiresInDays?: number
  ): { apiKeyRecord: ApiKey; fullKey: string } {
    const rawSecret = crypto.randomBytes(24).toString("hex");
    const prefix = `atmz_${role === "service_agent" ? "hermes" : "sa"}_${rawSecret.substring(0, 6)}`;
    const fullKey = `${prefix}_${rawSecret}`;
    const hash = hashApiKey(fullKey);

    const now = new Date();
    const expiresAt = expiresInDays
      ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const apiKeyRecord: ApiKey = {
      id: crypto.randomUUID(),
      organization_id: orgId,
      name,
      key_prefix: prefix,
      key_hash: hash,
      role,
      scopes,
      last_used_at: null,
      expires_at: expiresAt,
      revoked_at: null,
      created_at: now.toISOString(),
    };

    apiKeysStore.unshift(apiKeyRecord);
    return { apiKeyRecord, fullKey };
  },

  findApiKeyByHash(keyHash: string): ApiKey | null {
    const found = apiKeysStore.find((k) => k.key_hash === keyHash && !k.revoked_at);
    if (!found) return null;

    // Verificar se expirou
    if (found.expires_at && new Date(found.expires_at) < new Date()) {
      return null;
    }

    return found;
  },

  recordKeyUsage(keyId: string): void {
    const key = apiKeysStore.find((k) => k.id === keyId);
    if (key) {
      key.last_used_at = new Date().toISOString();
    }
  },

  revokeApiKey(keyId: string, orgId: string): boolean {
    const key = apiKeysStore.find((k) => k.id === keyId && k.organization_id === orgId);
    if (!key) return false;
    key.revoked_at = new Date().toISOString();
    return true;
  },

  // Integrações
  listIntegrations(orgId: string, companyId?: string): Integration[] {
    return integrationsStore
      .filter((i) => {
        if (i.organization_id !== orgId) return false;
        if (companyId && i.company_id && i.company_id !== companyId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findIntegrationById(id: string, orgId: string): Integration | null {
    const found = integrationsStore.find((i) => i.id === id && i.organization_id === orgId);
    return found || null;
  },

  createIntegration(data: Omit<Integration, "id" | "created_at" | "updated_at">): Integration {
    const now = new Date().toISOString();
    const newIntegration: Integration = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    integrationsStore.push(newIntegration);
    return newIntegration;
  },

  updateIntegrationStatus(
    id: string,
    orgId: string,
    status: "connected" | "disconnected" | "error",
    errorDetails?: string | null
  ): Integration | null {
    const item = integrationsStore.find((i) => i.id === id && i.organization_id === orgId);
    if (!item) return null;
    item.status = status;
    item.last_sync_at = new Date().toISOString();
    item.error_details = errorDetails || null;
    item.updated_at = new Date().toISOString();
    return item;
  },

  // Circuit Breaker
  getCircuitBreakerStatus() {
    return { ...circuitBreakerState };
  },

  recordPing(status: "online" | "degraded" | "offline" = "online", latencyMs: number = 85) {
    circuitBreakerState = {
      status,
      last_ping: new Date().toISOString(),
      latency_ms: latencyMs,
    };
  },

  resetForTests() {
    apiKeysStore = [...initialApiKeys];
    integrationsStore = [...initialIntegrations];
    circuitBreakerState = {
      status: "online",
      last_ping: new Date().toISOString(),
      latency_ms: 85,
    };
  },
};
