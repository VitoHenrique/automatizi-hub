import React from "react";
import { CompanyLifecycleStatus } from "@/domain/types";
import {
  Compass,
  UserCheck,
  Stethoscope,
  Wrench,
  Headphones,
  ShieldCheck,
  AlertTriangle,
  PauseCircle,
  Archive,
} from "lucide-react";

interface CompanyStatusBadgeProps {
  status: CompanyLifecycleStatus;
  size?: "sm" | "md";
  className?: string;
}

const COMPANY_STATUS_CONFIG: Record<
  CompanyLifecycleStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  prospect: {
    label: "Prospect",
    icon: Compass,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
  },
  onboarding: {
    label: "Onboarding",
    icon: UserCheck,
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  diagnostico: {
    label: "Diagnóstico",
    icon: Stethoscope,
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  implantacao: {
    label: "Implantação",
    icon: Wrench,
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  operacao_assistida: {
    label: "Operação Assistida",
    icon: Headphones,
    bg: "bg-sky-50 dark:bg-sky-950/50",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
  },
  ativa: {
    label: "Ativa",
    icon: ShieldCheck,
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  atencao: {
    label: "Atenção",
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  pausada: {
    label: "Pausada",
    icon: PauseCircle,
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-300 dark:border-zinc-700",
  },
  encerrada: {
    label: "Encerrada",
    icon: Archive,
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-700",
  },
};

export const CompanyStatusBadge: React.FC<CompanyStatusBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const config = COMPANY_STATUS_CONFIG[status] || COMPANY_STATUS_CONFIG.prospect;
  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${padding} ${className}`}
      role="status"
      aria-label={`Status da empresa: ${config.label}`}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </span>
  );
};
