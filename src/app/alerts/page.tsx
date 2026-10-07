"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AlertsList } from "@/components/operations/AlertsList";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Alert } from "@/domain/types";
import { BellRing, ShieldAlert, CheckCircle2, Filter } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchAlerts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);

      const res = await fetch(`/api/v1/alerts?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os alertas da plataforma.");
      }
      const json = await res.json();
      setAlerts(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? json.data : a)));
      }
    } catch (err) {
      console.error("Falha ao reconhecer alerta", err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${alertId}/resolve`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? json.data : a)));
      }
    } catch (err) {
      console.error("Falha ao resolver alerta", err);
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Alertas & Incidentes", href: "/alerts" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Alertas e Incidentes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitoramento operacional contínuo de agentes de IA e integrações críticas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="all">Todos os Estados</option>
              <option value="firing">Disparados (Firing)</option>
              <option value="acknowledged">Reconhecidos</option>
              <option value="resolved">Resolvidos</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="all">Todas as Severidades</option>
              <option value="critical">Crítico</option>
              <option value="warning">Atenção</option>
              <option value="info">Informativo</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Consultando alertas operacionais..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAlerts} />
        ) : (
          <AlertsList
            alerts={alerts}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
          />
        )}
      </div>
    </AppShell>
  );
}
