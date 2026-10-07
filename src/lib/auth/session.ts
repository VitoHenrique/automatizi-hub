import { NextRequest } from "next/server";
import { UserContext } from "./permissions";
import { MembershipRole, MembershipScope } from "@/domain/types";

/**
 * Extrai o contexto do usuário autenticado a partir da requisição ou dos headers.
 * Funciona tanto em Route Handlers do Next.js (recebendo req ou Headers) quanto em testes.
 */
export async function getAuthenticatedUserContext(
  req?: NextRequest | Request | Headers
): Promise<UserContext | null> {
  let headersList: Headers | null = null;

  if (req instanceof Headers) {
    headersList = req;
  } else if (req && "headers" in req) {
    headersList = req.headers;
  } else {
    try {
      const nextHeaders = await import("next/headers");
      headersList = await nextHeaders.headers();
    } catch {
      headersList = null;
    }
  }

  const userId = headersList?.get("x-user-id");
  const organizationId = headersList?.get("x-organization-id");
  const role = (headersList?.get("x-user-role") as MembershipRole) || "operator";
  const scope = (headersList?.get("x-user-scope") as MembershipScope) || "global";
  const resourceId = headersList?.get("x-resource-id");

  if (!userId || !organizationId) {
    // Contexto padrão mockado para ambiente de desenvolvimento inicial (Fase 0) caso não haja headers
    if (process.env.NODE_ENV === "development") {
      return {
        userId: "00000000-0000-0000-0000-000000000001",
        organizationId: "11111111-1111-1111-1111-111111111111",
        role: "owner",
        scope: "global",
        resourceId: null,
      };
    }
    return null;
  }

  return {
    userId,
    organizationId,
    role,
    scope,
    resourceId: resourceId || null,
  };
}
