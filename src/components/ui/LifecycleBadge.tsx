import React from "react";
import { AgentLifecycleStatus } from "@/domain/types";
import {
  Lightbulb,
  Calendar,
  Search,
  PenTool,
  Hammer,
  Cable,
  CheckCircle2,
  Headphones,
  Rocket,
  PauseCircle,
  AlertOctagon,
  Archive,
} from "lucide-react";

interface LifecycleBadgeProps {
  status: AgentLifecycleStatus;
  size?: "sm" | "md";
  className?: string;
}

const LIFECYCLE_CONFIG: Record<
  AgentLifecycleStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  ideia: {
    label: "Ideia",
    icon: Lightbulb,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
  },
  planejamento: {
    label: "Planejamento",
    icon: Calendar,
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  diagnostico: {
    label: "Diagnóstico",
    icon: Search,
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  desenho: {
    label: "Desenho",
    icon: PenTool,
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  construcao: {
    label: "Construção",
    icon: Hammer,
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  integracao: {
    label: "Integração",
    icon: Cable,
    bg: "bg-purple-50 dark:bg-purple-950/50",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  testes: {
    label: "Testes",
    icon: CheckCircle2,
    bg: "bg-teal-50 dark:bg-teal-950/50",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
  },
  operacao_assistida: {
    label: "Operação Assistida",
    icon: Headphones,
    bg: "bg-sky-50 dark:bg-sky-950/50",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
  },
  producao: {
    label: "Produção",
    icon: Rocket,
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  pausado: {
    label: "Pausado",
    icon: PauseCircle,
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-300 dark:border-zinc-700",
  },
  bloqueado: {
    label: "Bloqueado",
    icon: AlertOctagon,
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  arquivado: {
    label: "Arquivado",
    icon: Archive,
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-700",
  },
};

export const LifecycleBadge: React.FC<LifecycleBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const config = LIFECYCLE_CONFIG[status] || LIFECYCLE_CONFIG.ideia;
  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${padding} ${className}`}
      role="status"
      aria-label={`Ciclo de vida: ${config.label}`}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </span>
  );
};
