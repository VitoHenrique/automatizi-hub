import React from "react";
import { OperationalHealth } from "@/domain/types";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Flame,
  HelpCircle,
  Radio,
} from "lucide-react";

interface HealthBadgeProps {
  health: OperationalHealth;
  score?: number;
  size?: "sm" | "md";
  className?: string;
}

const HEALTH_CONFIG: Record<
  OperationalHealth,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  saudavel: {
    label: "Saudável",
    icon: ShieldCheck,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-800",
  },
  atencao: {
    label: "Atenção",
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-800",
  },
  degradado: {
    label: "Degradado",
    icon: AlertCircle,
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-300 dark:border-orange-800",
  },
  critico: {
    label: "Crítico",
    icon: Flame,
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-800",
  },
  sem_dados: {
    label: "Sem dados",
    icon: Radio,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-300 dark:border-slate-700",
  },
  desconhecido: {
    label: "Desconhecido",
    icon: HelpCircle,
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-300 dark:border-zinc-700",
  },
};

export const HealthBadge: React.FC<HealthBadgeProps> = ({
  health,
  score,
  size = "md",
  className = "",
}) => {
  const config = HEALTH_CONFIG[health] || HEALTH_CONFIG.desconhecido;
  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${padding} ${className}`}
      role="status"
      aria-label={`Saúde operacional: ${config.label}${score !== undefined ? ` (Score: ${score})` : ""}`}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="font-mono text-[10px] opacity-80 border-l border-current pl-1 ml-0.5">
          {score}%
        </span>
      )}
    </span>
  );
};
