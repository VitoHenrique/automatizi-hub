"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { BellRing } from "lucide-react";

export default function AlertsPage() {
  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Alertas & Incidentes", href: "/alerts" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alertas e Incidentes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoramento operacional de agentes e integrações críticas.
          </p>
        </div>

        <EmptyState
          title="Central de Alertas Operacionais (Fase 3)"
          description="O modelo de dados de alertas com severidade, acknowledgement e telemetria de incidentes será implementado na Fase 3 (Operação)."
          icon={BellRing}
        />
      </div>
    </AppShell>
  );
}
