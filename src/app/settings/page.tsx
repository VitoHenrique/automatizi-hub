"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Settings, Shield, Building, Users } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Configurações", href: "/settings" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configurações da Organização</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerenciamento de membros, escopos de autorização e preferências do tenant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-primary">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tenant Atual</h3>
                <p className="text-xs text-muted-foreground">Automatizi Headquarters</p>
              </div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground space-y-1">
              <div><span className="font-semibold text-foreground">Slug:</span> automatizi-hq</div>
              <div><span className="font-semibold text-foreground">Status:</span> Ativo</div>
              <div><span className="font-semibold text-foreground">Fuso Horário:</span> America/Sao_Paulo</div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Membros & Permissões (RBAC)</h3>
                <p className="text-xs text-muted-foreground">Políticas ativas na tabela memberships</p>
              </div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground space-y-1">
              <div><span className="font-semibold text-foreground">Papéis configurados:</span> Owner, Admin, Operator, Analyst, Client Viewer, Service Agent</div>
              <div><span className="font-semibold text-foreground">Escopos suportados:</span> Global, Company, Agent</div>
              <div><span className="font-semibold text-foreground">Segurança:</span> RLS ativado no PostgreSQL</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
