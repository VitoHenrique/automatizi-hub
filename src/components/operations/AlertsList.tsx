"use client";

import React, { useState } from "react";
import { Alert } from "@/domain/types";
import { AlertSeverityBadge } from "./AlertSeverityBadge";
import { Check, Eye, AlertOctagon, Clock, ShieldCheck } from "lucide-react";

interface AlertsListProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => Promise<void>;
  onResolve?: (alertId: string) => Promise<void>;
}

export function AlertsList({ alerts, onAcknowledge, onResolve }: AlertsListProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (alerts.length === 0) {
    return (
      <div className="text-center py-10 bg-card rounded-xl border border-border">
        <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
        <h3 className="text-sm font-semibold text-foreground">Tudo limpo na operação</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Nenhum alerta ativo ou disparado no momento.
        </p>
      </div>
    );
  }

  const handleAction = async (alertId: string, action: "ack" | "resolve") => {
    setLoadingAction(`${alertId}-${action}`);
    try {
      if (action === "ack" && onAcknowledge) {
        await onAcknowledge(alertId);
      } else if (action === "resolve" && onResolve) {
        await onResolve(alertId);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-xl border transition-all ${
            alert.status === "firing"
              ? alert.severity === "critical"
                ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
                : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
              : alert.status === "acknowledged"
              ? "bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
              : "bg-card border-border opacity-70"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <AlertSeverityBadge severity={alert.severity} />
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    alert.status === "firing"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : alert.status === "acknowledged"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {alert.status === "firing"
                    ? "Disparado"
                    : alert.status === "acknowledged"
                    ? "Reconhecido"
                    : "Resolvido"}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.created_at).toLocaleString("pt-BR")}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
              {alert.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
              )}
            </div>

            {/* Ações de Reconhecimento e Resolução */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              {alert.status === "firing" && onAcknowledge && (
                <button
                  type="button"
                  disabled={loadingAction === `${alert.id}-ack`}
                  onClick={() => handleAction(alert.id, "ack")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-border transition-colors disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {loadingAction === `${alert.id}-ack` ? "Reconhecendo..." : "Reconhecer"}
                </button>
              )}

              {alert.status !== "resolved" && onResolve && (
                <button
                  type="button"
                  disabled={loadingAction === `${alert.id}-resolve`}
                  onClick={() => handleAction(alert.id, "resolve")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {loadingAction === `${alert.id}-resolve` ? "Resolvendo..." : "Resolver"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
