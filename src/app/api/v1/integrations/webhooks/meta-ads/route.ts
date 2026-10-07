import { NextRequest } from "next/server";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { dbxPilotService } from "@/lib/dbx/pilot-service";
import { companyRepository } from "@/lib/companies/store";

export const dynamic = "force-dynamic";

const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const DBX_COMPANY_ID = "22222222-2222-2222-2222-222222222222";

/**
 * GET: Verificação de Webhook da Meta Ads (hub.mode, hub.verify_token, hub.challenge)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifiedChallenge = dbxPilotService.metaAdapter.verifyWebhookChallenge(mode, token, challenge);

  if (verifiedChallenge) {
    return new Response(verifiedChallenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: Ingestão de leads gerados em anúncios do Meta Ads com deduplicação e pipeline automático
 */
export async function POST(req: NextRequest) {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const signature = req.headers.get("x-hub-signature-256");

  let rawBodyText = "";
  let payload: Record<string, unknown> = {};

  try {
    rawBodyText = await req.text();
    payload = JSON.parse(rawBodyText);
  } catch {
    return ApiErrors.VALIDATION_ERROR({ body: "Payload de webhook inválido ou JSON mal formatado" }, correlationId);
  }

  // Verifica assinatura quando presente
  const isValidSignature = dbxPilotService.metaAdapter.verifySignature(rawBodyText, signature);
  if (!isValidSignature) {
    return ApiErrors.FORBIDDEN("Assinatura do webhook do Meta Ads inválida.", correlationId);
  }

  // Permite passar company_id e organization_id via headers ou query se configurado, ou usa o piloto DBX por padrão
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") || DBX_COMPANY_ID;
  const organizationId = searchParams.get("organization_id") || DEFAULT_ORG_ID;

  try {
    const result = await dbxPilotService.processIncomingMetaLead({
      organizationId,
      companyId,
      rawPayload: payload,
      signature,
      correlationId,
    });

    return apiSuccess({
      data: {
        processed: true,
        is_duplicate: result.isDuplicate,
        lead: result.lead,
        sdr_execution_id: result.sdrExecutionId,
        split_execution_id: result.splitExecutionId,
        traffic_execution_id: result.trafficExecutionId,
        meeting_scheduled: !!result.scheduledMeeting,
        closer_assigned: result.splitAssignment?.closer_name,
      },
      meta: {
        correlation_id: correlationId,
      },
      status: result.isDuplicate ? 200 : 201,
    });
  } catch {
    return ApiErrors.INTERNAL_ERROR(correlationId);
  }
}
