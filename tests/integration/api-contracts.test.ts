import { describe, it, expect } from "vitest";
import { GET as healthGet } from "@/app/api/v1/health/route";
import { GET as orgsGet, POST as orgsPost } from "@/app/api/v1/organizations/route";
import { NextRequest } from "next/server";

describe("Contratos de API v1 (docs/05-api-contract.md)", () => {
  it("endpoint /api/v1/health retorna padrão { data, meta, error } com status healthy", async () => {
    const res = await healthGet();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("meta");
    expect(json.error).toBeNull();

    expect(json.data.status).toBe("healthy");
    expect(json.data.service).toBe("automatizi-hub-api");
    expect(json.data.subsystems.rls_enforcement).toBe("active");
  });

  it("endpoint /api/v1/organizations lista apenas organizações do tenant autorizado", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/organizations", {
      headers: {
        "x-user-id": "00000000-0000-0000-0000-000000000001",
        "x-organization-id": "11111111-1111-1111-1111-111111111111",
        "x-user-role": "operator",
        "x-correlation-id": "corr-test-123",
      },
    });

    const res = await orgsGet(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toBeInstanceOf(Array);
    expect(json.meta.correlation_id).toBe("corr-test-123");
    expect(json.data[0].slug).toBe("automatizi-hq");
  });

  it("rejeita requisições POST com payload inválido retornando VALIDATION_ERROR padronizado", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/organizations", {
      method: "POST",
      headers: {
        "x-user-id": "00000000-0000-0000-0000-000000000001",
        "x-organization-id": "11111111-1111-1111-1111-111111111111",
        "x-user-role": "owner",
        "x-correlation-id": "corr-val-error",
      },
      body: JSON.stringify({
        name: "A", // muito curto
        slug: "NOME INVALIDO COM ESPAÇO",
      }),
    });

    const res = await orgsPost(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.data).toBeNull();
    expect(json.error).not.toBeNull();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.details).toBeDefined();
    expect(json.meta.correlation_id).toBe("corr-val-error");
  });

  it("bloqueia operadores sem privilégio de criação com FORBIDDEN", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/organizations", {
      method: "POST",
      headers: {
        "x-user-id": "00000000-0000-0000-0000-000000000002",
        "x-organization-id": "11111111-1111-1111-1111-111111111111",
        "x-user-role": "operator", // operator não pode org:manage
        "x-correlation-id": "corr-forbidden",
      },
      body: JSON.stringify({
        name: "Nova Organização",
        slug: "nova-org",
      }),
    });

    const res = await orgsPost(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.error.code).toBe("FORBIDDEN");
  });
});
