import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { hermesRepository } from "@/lib/hermes/store";
import { MetaAdsAdapter } from "@/lib/adapters/meta-ads";
import { WhatsAppCloudAdapter } from "@/lib/adapters/whatsapp-cloud";
import { GoogleCalendarAdapter } from "@/lib/adapters/google-calendar";
import { DbxCrmAdapter } from "@/lib/adapters/dbx-crm";
import { AdapterHealthResult } from "@/domain/types";

export const dynamic = "force-dynamic";

const metaAdapter = new MetaAdsAdapter();
const whatsappAdapter = new WhatsAppCloudAdapter();
const calendarAdapter = new GoogleCalendarAdapter();
const crmAdapter = new DbxCrmAdapter();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);
  const { id } = await params;

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "integration:view")) {
    return ApiErrors.FORBIDDEN("Sem permissão para consultar integracões.", correlationId);
  }

  const integration = hermesRepository.findIntegrationById(id, ctx.organizationId);
  if (!integration) {
    return ApiErrors.NOT_FOUND("Integração", correlationId);
  }

  let healthResult: AdapterHealthResult;

  switch (integration.provider) {
    case "meta_ads":
      healthResult = await metaAdapter.healthCheck();
      break;
    case "whatsapp_cloud":
      healthResult = await whatsappAdapter.healthCheck();
      break;
    case "google_calendar":
      healthResult = await calendarAdapter.healthCheck();
      break;
    case "dbx_crm":
      healthResult = await crmAdapter.healthCheck();
      break;
    default:
      healthResult = {
        is_healthy: true,
        latency_ms: 20,
        last_sync_at: new Date().toISOString(),
        details: { status: "ready" },
      };
      break;
  }

  // Atualiza metadados na integração
  hermesRepository.updateIntegrationStatus(
    id,
    ctx.organizationId,
    healthResult.is_healthy ? "connected" : "error",
    healthResult.error_details || undefined
  );

  return apiSuccess({
    data: {
      integration_id: id,
      provider: integration.provider,
      ...healthResult,
    },
    meta: { correlation_id: correlationId },
  });
}
