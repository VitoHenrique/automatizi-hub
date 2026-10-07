import { describe, it, expect } from "vitest";
import { hasPermission, UserContext } from "@/lib/auth/permissions";

describe("Controle de Acesso RBAC e Escopos (docs/04-security.md)", () => {
  const globalOwner: UserContext = {
    userId: "usr-1",
    organizationId: "org-1",
    role: "owner",
    scope: "global",
  };

  const globalOperator: UserContext = {
    userId: "usr-2",
    organizationId: "org-1",
    role: "operator",
    scope: "global",
  };

  const companyScopedOperator: UserContext = {
    userId: "usr-3",
    organizationId: "org-1",
    role: "operator",
    scope: "company",
    resourceId: "comp-dbx",
  };

  const clientViewer: UserContext = {
    userId: "usr-4",
    organizationId: "org-1",
    role: "client_viewer",
    scope: "global",
  };

  it("permite que owner execute qualquer ação operacional e administrativa", () => {
    expect(hasPermission(globalOwner, "org:manage")).toBe(true);
    expect(hasPermission(globalOwner, "membership:manage")).toBe(true);
    expect(hasPermission(globalOwner, "agent:create")).toBe(true);
    expect(hasPermission(globalOwner, "agent:promote_production")).toBe(true);
    expect(hasPermission(globalOwner, "execution:trigger")).toBe(true);
  });

  it("bloqueia operador de gerenciar organização e memberships", () => {
    expect(hasPermission(globalOperator, "org:manage")).toBe(false);
    expect(hasPermission(globalOperator, "membership:manage")).toBe(false);
    expect(hasPermission(globalOperator, "agent:promote_production")).toBe(false);

    // Mas permite operar tarefas e disparar execuções
    expect(hasPermission(globalOperator, "task:create")).toBe(true);
    expect(hasPermission(globalOperator, "execution:trigger")).toBe(true);
  });

  it("restringe rigorosamente permissões quando o escopo é restrito à empresa", () => {
    // Acesso permitido na empresa correta (comp-dbx)
    expect(
      hasPermission(companyScopedOperator, "task:create", {
        type: "company",
        id: "comp-dbx",
      })
    ).toBe(true);

    // Acesso NEGADO na empresa alheia (comp-outra)
    expect(
      hasPermission(companyScopedOperator, "task:create", {
        type: "company",
        id: "comp-outra",
      })
    ).toBe(false);
  });

  it("impede que visualizador cliente execute ações mutantes", () => {
    expect(hasPermission(clientViewer, "company:view")).toBe(true);
    expect(hasPermission(clientViewer, "agent:view")).toBe(true);
    expect(hasPermission(clientViewer, "task:create")).toBe(false);
    expect(hasPermission(clientViewer, "agent:create")).toBe(false);
    expect(hasPermission(clientViewer, "execution:trigger")).toBe(false);
  });
});
