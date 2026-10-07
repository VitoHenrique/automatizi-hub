import React from "react";
import { OperationalMetricsSummary } from "@/domain/types";
import { PlayCircle, CheckCircle2, Clock, DollarSign, AlertOctagon } from "lucide-react";

interface MetricsOverviewProps {
  metrics: OperationalMetricsSummary;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span>Execuções Totais</span>
          <PlayCircle className="w-4 h-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-foreground">
          {metrics.total_executions}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {metrics.success_count} sucesso · {metrics.failure_count} falhas
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span>Taxa de Sucesso</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-foreground flex items-baseline gap-1">
          {metrics.success_rate}%
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div
            className={`h-1.5 rounded-full ${
              metrics.success_rate >= 90
                ? "bg-emerald-500"
                : metrics.success_rate >= 70
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
            style={{ width: `${metrics.success_rate}%` }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span>Latência Média</span>
          <Clock className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-foreground">
          {metrics.avg_duration_ms > 0 ? `${metrics.avg_duration_ms}ms` : "—"}
        </div>
        <p className="text-[11px] text-muted-foreground">Tempo médio por execução</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span>Alertas Ativos</span>
          <AlertOctagon
            className={`w-4 h-4 ${
              metrics.critical_alerts_count > 0
                ? "text-rose-500 animate-pulse"
                : metrics.firing_alerts_count > 0
                ? "text-amber-500"
                : "text-muted-foreground"
            }`}
          />
        </div>
        <div
          className={`text-2xl font-bold ${
            metrics.critical_alerts_count > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
          }`}
        >
          {metrics.firing_alerts_count}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {metrics.critical_alerts_count} com severidade crítica
        </p>
      </div>
    </div>
  );
}
