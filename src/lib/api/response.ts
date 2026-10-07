import { NextResponse } from "next/server";
import { ApiResponse, ApiResponseMeta, ApiResponseError } from "@/domain/types";
import { sanitizeData } from "../logger/logger";

export interface SuccessOptions<T> {
  data: T;
  meta?: Partial<ApiResponseMeta>;
  status?: number;
  headers?: Record<string, string>;
}

export interface ErrorOptions {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown> | null;
  correlationId?: string;
  headers?: Record<string, string>;
}

export function apiSuccess<T>({
  data,
  meta,
  status = 200,
  headers = {},
}: SuccessOptions<T>): NextResponse<ApiResponse<T>> {
  const fullMeta: ApiResponseMeta = {
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const responseBody: ApiResponse<T> = {
    data: sanitizeData(data),
    meta: fullMeta,
    error: null,
  };

  return NextResponse.json(responseBody, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function apiError({
  code,
  message,
  status,
  details = null,
  correlationId,
  headers = {},
}: ErrorOptions): NextResponse<ApiResponse<null>> {
  const errorObj: ApiResponseError = {
    code,
    message,
    details: details ? sanitizeData(details) : null,
  };

  const fullMeta: ApiResponseMeta = {
    timestamp: new Date().toISOString(),
    correlation_id: correlationId,
  };

  const responseBody: ApiResponse<null> = {
    data: null,
    meta: fullMeta,
    error: errorObj,
  };

  return NextResponse.json(responseBody, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

// Códigos de erro padronizados estáveis
export const ApiErrors = {
  UNAUTHORIZED: (correlationId?: string) =>
    apiError({
      code: "UNAUTHORIZED",
      message: "Autenticação obrigatória para acessar este recurso.",
      status: 401,
      correlationId,
    }),
  FORBIDDEN: (message = "Acesso negado para o escopo ou papel atual.", correlationId?: string) =>
    apiError({
      code: "FORBIDDEN",
      message,
      status: 403,
      correlationId,
    }),
  TENANT_MISMATCH: (correlationId?: string) =>
    apiError({
      code: "TENANT_MISMATCH",
      message: "Operação cruzada entre organizações é estritamente proibida.",
      status: 403,
      correlationId,
    }),
  NOT_FOUND: (resource = "Recurso", correlationId?: string) =>
    apiError({
      code: "NOT_FOUND",
      message: `${resource} não encontrado.`,
      status: 404,
      correlationId,
    }),
  VALIDATION_ERROR: (details: Record<string, unknown>, correlationId?: string) =>
    apiError({
      code: "VALIDATION_ERROR",
      message: "Dados de requisição inválidos.",
      status: 400,
      details,
      correlationId,
    }),
  INTERNAL_ERROR: (correlationId?: string) =>
    apiError({
      code: "INTERNAL_ERROR",
      message: "Erro interno no servidor. Contate o suporte com o correlation_id.",
      status: 500,
      correlationId,
    }),
};
