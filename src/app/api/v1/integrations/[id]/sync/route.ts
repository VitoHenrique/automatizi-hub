import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAuthenticatedUserContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { hermesRepository } from "@/lib/hermes/store";
import { MetaAdsAdapter } from "@/lib/adapters/meta-ads";
import { WhatsAppCloudAdapter } from "@/lib/adapters/whatsapp-cloud";
import { GoogleCalendarAdapter } from "@/lib/adapters/google-calendar";
import { DbxCrmAdapter } from "@/lib/adapters/dbx-crm";
import { SyncResult } from "@/domain/adapters";

export const dynamic = "force-dynamic";

const metaAdapter = new MetaAdsAdapter();
const whatsappAdapter = new WhatsAppCloudAdapter();
const calendarAdapter = new GoogleCalendarAdapter();
const crmAdapter = new DbxCrmAdapter();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const ctx = await getAuthenticatedUserContext(req);
  const { id } = await params;

  if (!ctx) return ApiErrors.UNAUTHORIZED(correlationId);
  if (!hasPermission(ctx, "integration:configure")) {
    return ApiErrors.FORBIDDEN("Sem permissão para sincronizar integrações.", correlationId);
  }

  const integration = hermesRepository.findIntegrationById(id, ctx.organizationId);
  if (!integration) {
    return ApiErrors.NOT_FOUND("Integração", correlationId);
  }

  let syncResult: SyncResult;

  switch (integration.provider) {
    case "meta_ads":
      syncResult = await metaAdapter.sync();
      break;
    case "whatsapp_cloud":
      syncResult = await whatsappAdapter.sync();
      break;
    case "google_calendar":
      syncResult = await calendarAdapter.sync();
      break;
    case "dbx_crm":
      syncResult = await crmAdapter.sync();
      break;
    default:
      syncResult = { success: true, itemsProcessed: 1 };
      break;
  }

  hermesRepository.updateIntegrationStatus(id, ctx.organizationId, syncResult.success ? "connected" : "error");

  return apiSuccess({
    data: {
      integration_id: id,
      provider: integration.provider,
      ...syncResult,
      synced_at: new Date().toISOString(),
    },
    meta: { correlation_id: correlationId },
  });
}
