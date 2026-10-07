import React from "react";
import { AlertSeverity } from "@/domain/types";
import { AlertOctagon, AlertTriangle, Info } from "lucide-react";

interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
  className?: string;
}

export function AlertSeverityBadge({ severity, className = "" }: AlertSeverityBadgeProps) {
  switch (severity) {
    case "critical":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 ${className}`}
        >
          <AlertOctagon className="w-3 h-3" />
          Crítico
        </span>
      );
    case "warning":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${className}`}
        >
          <AlertTriangle className="w-3 h-3" />
          Atenção
        </span>
      );
    case "info":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 ${className}`}
        >
          <Info className="w-3 h-3" />
          Info
        </span>
      );
    default:
      return null;
  }
}
