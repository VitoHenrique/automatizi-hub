// Sanitizador de dados sensíveis para logs e auditoria
const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /key/i,
  /auth/i,
  /bearer/i,
  /credential/i,
  /hash/i,
];

/**
 * Remove ou ofusca recursivamente chaves sensíveis de objetos ou arrays antes de logar ou persistir.
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    // Detectar possíveis Bearer tokens em strings soltas
    if (/Bearer\s+[A-Za-z0-9._~+/-]+=*/i.test(data)) {
      return "[REDACTED_BEARER_TOKEN]" as unknown as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const rawObj = data as Record<string, unknown>;
    const sanitizedObj: Record<string, unknown> = {};

    // Detectar se é um padrão do tipo chave-valor (ex: { key_name: 'api_token', value: 'secret123' })
    const keyDescriptor = String(rawObj.key_name || rawObj.key || rawObj.name || "");
    const isDescriptorSensitive = SENSITIVE_KEY_PATTERNS.some((p) => p.test(keyDescriptor));

    for (const [key, value] of Object.entries(rawObj)) {
      const isKeyDirectlySensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

      if (isKeyDirectlySensitive) {
        sanitizedObj[key] = "[REDACTED]";
      } else if (key === "value" && isDescriptorSensitive) {
        // Se a chave for 'value' e o descritor associado indicar segredo
        sanitizedObj[key] = "[REDACTED]";
      } else {
        sanitizedObj[key] = sanitizeData(value);
      }
    }
    return sanitizedObj as T;
  }

  return data;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId?: string;
  organizationId?: string;
  companyId?: string;
  agentId?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private formatLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    extra?: Record<string, unknown>
  ) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = context ? sanitizeData(context) : undefined;
    const sanitizedExtra = extra ? sanitizeData(extra) : undefined;

    return {
      timestamp,
      level,
      message,
      context: sanitizedContext,
      extra: sanitizedExtra,
    };
  }

  info(message: string, context?: LogContext, extra?: Record<string, unknown>) {
    const entry = this.formatLog("info", message, context, extra);
    console.log(JSON.stringify(entry));
    return entry;
  }

  warn(message: string, context?: LogContext, extra?: Record<string, unknown>) {
    const entry = this.formatLog("warn", message, context, extra);
    console.warn(JSON.stringify(entry));
    return entry;
  }

  error(message: string, context?: LogContext, extra?: Record<string, unknown>) {
    const entry = this.formatLog("error", message, context, extra);
    console.error(JSON.stringify(entry));
    return entry;
  }

  debug(message: string, context?: LogContext, extra?: Record<string, unknown>) {
    if (process.env.LOG_LEVEL === "debug") {
      const entry = this.formatLog("debug", message, context, extra);
      console.debug(JSON.stringify(entry));
      return entry;
    }
    return null;
  }
}

export const logger = new Logger();
