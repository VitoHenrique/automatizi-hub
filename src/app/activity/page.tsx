"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Atividade", href: "/activity" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trilha de Atividades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registro visual e legível de eventos operacionais e execuções de agentes.
          </p>
        </div>

        <EmptyState
          title="Trilha de Atividades Operacionais (Fase 3)"
          description="A tabela audit_events já está persistindo eventos no banco com RLS. O feed visual de atividades humanas e de agentes será entregue na Fase 3."
          icon={Activity}
        />
      </div>
    </AppShell>
  );
}
