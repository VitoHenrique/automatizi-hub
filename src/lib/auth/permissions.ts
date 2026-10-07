import { MembershipRole, MembershipScope } from "@/domain/types";

export type PermissionAction =
  | "org:manage"
  | "membership:manage"
  | "membership:view"
  | "company:create"
  | "company:edit"
  | "company:archive"
  | "company:view"
  | "agent:create"
  | "agent:edit"
  | "agent:promote_production"
  | "agent:archive"
  | "agent:view"
  | "execution:trigger"
  | "execution:view"
  | "task:create"
  | "task:edit"
  | "task:view"
  | "metric:view"
  | "alert:manage"
  | "alert:view"
  | "audit:view"
  | "integration:configure"
  | "integration:view";

/**
 * Matriz estrita de permissões por papel.
 * Autorização deve sempre existir no servidor e reforçada no banco por RLS.
 */
const ROLE_PERMISSIONS: Record<MembershipRole, Set<PermissionAction>> = {
  owner: new Set([
    "org:manage",
    "membership:manage",
    "membership:view",
    "company:create",
    "company:edit",
    "company:archive",
    "company:view",
    "agent:create",
    "agent:edit",
    "agent:promote_production",
    "agent:archive",
    "agent:view",
    "execution:trigger",
    "execution:view",
    "task:create",
    "task:edit",
    "task:view",
    "metric:view",
    "alert:manage",
    "alert:view",
    "audit:view",
    "integration:configure",
    "integration:view",
  ]),
  admin: new Set([
    "membership:manage",
    "membership:view",
    "company:create",
    "company:edit",
    "company:archive",
    "company:view",
    "agent:create",
    "agent:edit",
    "agent:promote_production",
    "agent:archive",
    "agent:view",
    "execution:trigger",
    "execution:view",
    "task:create",
    "task:edit",
    "task:view",
    "metric:view",
    "alert:manage",
    "alert:view",
    "audit:view",
    "integration:configure",
    "integration:view",
  ]),
  operator: new Set([
    "membership:view",
    "company:view",
    "company:edit",
    "agent:view",
    "agent:edit",
    "execution:trigger",
    "execution:view",
    "task:create",
    "task:edit",
    "task:view",
    "metric:view",
    "alert:manage",
    "alert:view",
    "audit:view",
    "integration:view",
  ]),
  analyst: new Set([
    "membership:view",
    "company:view",
    "agent:view",
    "execution:view",
    "task:view",
    "metric:view",
    "alert:view",
    "audit:view",
    "integration:view",
  ]),
  client_viewer: new Set([
    "company:view",
    "agent:view",
    "task:view",
    "metric:view",
    "alert:view",
  ]),
  service_agent: new Set([
    "execution:trigger",
    "execution:view",
    "task:create",
    "task:edit",
    "task:view",
    "metric:view",
    "alert:manage",
    "alert:view",
    "integration:view",
  ]),
};

export interface UserContext {
  userId: string;
  organizationId: string;
  role: MembershipRole;
  scope: MembershipScope;
  resourceId?: string | null;
}

/**
 * Valida se um usuário possui permissão para uma ação específica,
 * respeitando o papel e o escopo associado (global, company ou agent).
 */
export function hasPermission(
  ctx: UserContext,
  action: PermissionAction,
  targetScope?: { type: "company" | "agent"; id: string }
): boolean {
  const allowedActions = ROLE_PERMISSIONS[ctx.role];
  if (!allowedActions || !allowedActions.has(action)) {
    return false;
  }

  // Se o membership tem escopo global, o acesso ao recurso da organização é liberado
  if (ctx.scope === "global") {
    return true;
  }

  // Se a permissão exige escopo específico (empresa ou agente)
  if (targetScope && ctx.resourceId) {
    if (ctx.scope === "company" && targetScope.type === "company") {
      return ctx.resourceId === targetScope.id;
    }
    if (ctx.scope === "agent" && targetScope.type === "agent") {
      return ctx.resourceId === targetScope.id;
    }
  }

  // Se o usuário tem escopo restrito e a ação não tem escopo fornecido, nega por segurança
  return false;
}
