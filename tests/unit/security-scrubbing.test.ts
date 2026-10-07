import { describe, it, expect } from "vitest";
import { sanitizeData } from "@/lib/logger/logger";
import { buildSanitizedAuditEvent } from "@/lib/audit/audit-logger";

describe("Segurança & Prevenção de Vazamento de Segredos (AGENTS.md & docs/10-observability.md)", () => {
  it("ofusca recursivamente propriedades com chaves sensíveis em objetos e arrays", () => {
    const rawPayload = {
      username: "vito_operator",
      api_key: "ak_live_998877665544332211",
      meta: {
        access_token: "eyJh...secret",
        password_hash: "$2b$12$e8h...",
        client_secret: "sec_xyz",
        safe_counter: 42,
      },
      tags: ["webhook", "meta-ads"],
      parameters_list: [
        { key_name: "jwt_token", value: "super-secret-token" },
        { label: "normal_param", value: "safe_value" },
      ],
    };

    const sanitized = sanitizeData(rawPayload) as any;

    // Campos sensíveis devem estar ocultados
    expect(sanitized.api_key).toBe("[REDACTED]");
    expect(sanitized.meta.access_token).toBe("[REDACTED]");
    expect(sanitized.meta.password_hash).toBe("[REDACTED]");
    expect(sanitized.meta.client_secret).toBe("[REDACTED]");
    expect(sanitized.parameters_list[0].value).toBe("[REDACTED]");

    // Campos normais devem ser preservados
    expect(sanitized.username).toBe("vito_operator");
    expect(sanitized.meta.safe_counter).toBe(42);
    expect(sanitized.tags).toEqual(["webhook", "meta-ads"]);
    expect(sanitized.parameters_list[1].label).toBe("normal_param");
    expect(sanitized.parameters_list[1].value).toBe("safe_value");
  });

  it("ofusca listas e propriedades cujo nome contenha indicador de credencial/secret", () => {
    const payload = {
      credentials_bucket: {
        raw_key: "super_secret",
      },
    };
    const sanitized = sanitizeData(payload) as any;
    expect(sanitized.credentials_bucket).toBe("[REDACTED]");
  });

  it("ofusca strings contendo Bearer tokens avulsos", () => {
    const headerString = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz";
    const sanitized = sanitizeData(headerString);
    expect(sanitized).toBe("[REDACTED_BEARER_TOKEN]");
  });

  it("garante sanitização no registro de eventos de auditoria", () => {
    const auditRecord = buildSanitizedAuditEvent({
      organizationId: "11111111-1111-1111-1111-111111111111",
      actorId: "usr-1",
      action: "integration.credentials_updated",
      targetType: "integration",
      targetId: "22222222-2222-2222-2222-222222222222",
      payload: {
        provider: "meta_ads",
        access_token: "EAABw...secret",
        refresh_token: "RT...secret",
        account_id: "act_12345",
      },
    });

    expect((auditRecord.payload as any).access_token).toBe("[REDACTED]");
    expect((auditRecord.payload as any).refresh_token).toBe("[REDACTED]");
    expect((auditRecord.payload as any).account_id).toBe("act_12345");
  });
});
