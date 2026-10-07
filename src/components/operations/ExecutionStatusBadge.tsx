import React from "react";
import { ExecutionStatus } from "@/domain/types";
import { CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

interface ExecutionStatusBadgeProps {
  status: ExecutionStatus;
  className?: string;
}

export function ExecutionStatusBadge({ status, className = "" }: ExecutionStatusBadgeProps) {
  switch (status) {
    case "success":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sucesso
        </span>
      );
    case "failed":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Falha
        </span>
      );
    case "timeout":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 ${className}`}
        >
          <Clock className="w-3.5 h-3.5" />
          Timeout
        </span>
      );
    case "running":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 ${className}`}
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Em execução
        </span>
      );
    case "cancelled":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Cancelada
        </span>
      );
    default:
      return null;
  }
}
