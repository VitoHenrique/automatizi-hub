import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { hermesRepository } from "@/lib/hermes/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const circuitBreaker = hermesRepository.getCircuitBreakerStatus();

  return apiSuccess({
    data: {
      circuit_breaker: circuitBreaker,
      orchestrator: "Hermes",
      hub_status: "operante",
      resilience_mode: circuitBreaker.status === "offline" ? "fallback_decoupled" : "connected",
    },
    meta: { correlation_id: correlationId },
  });
}
