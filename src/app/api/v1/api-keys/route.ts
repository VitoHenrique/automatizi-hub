import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { hermesRepository } from "@/lib/hermes/store";
import { CreateApiKeySchema } from "@/domain/types";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return ApiErrors.FORBIDDEN("Apenas administradores podem gerenciar chaves de API.", correlationId);
  }

  const keys = hermesRepository.listApiKeys(ctx.organizationId);

  return apiSuccess({
    data: keys,
    meta: { total: keys.length, correlation_id: correlationId },
  });
}

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return ApiErrors.FORBIDDEN("Apenas administradores podem gerar chaves de API.", correlationId);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "JSON mal formatado" }, correlationId);
  }

  const parsed = CreateApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.VALIDATION_ERROR(parsed.error.flatten().fieldErrors, correlationId);
  }

  const { apiKeyRecord, fullKey } = hermesRepository.createApiKey(
    ctx.organizationId,
    parsed.data.name,
    parsed.data.role,
    parsed.data.scopes,
    parsed.data.expires_in_days
  );

  return NextResponse.json(
    {
      data: {
        ...apiKeyRecord,
        api_key_secret: fullKey, // Apenas exibida no momento da criação!
      },
      meta: { correlation_id: correlationId, timestamp: new Date().toISOString() },
      error: null,
    },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return ApiErrors.FORBIDDEN("Apenas administradores podem revogar chaves de API.", correlationId);
  }

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("id");

  if (!keyId) {
    return ApiErrors.VALIDATION_ERROR({ id: ["ID da chave é obrigatório"] }, correlationId);
  }

  const revoked = hermesRepository.revokeApiKey(keyId, ctx.organizationId);
  if (!revoked) {
    return ApiErrors.NOT_FOUND("Chave de API", correlationId);
  }

  return apiSuccess({
    data: { id: keyId, revoked: true },
    meta: { correlation_id: correlationId },
  });
}
