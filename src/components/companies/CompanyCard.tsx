import React from "react";
import Link from "next/link";
import { Company } from "@/domain/types";
import { CompanyStatusBadge } from "./CompanyStatusBadge";
import { HealthBadge } from "@/components/ui/HealthBadge";
import {
  Building2,
  Bot,
  User,
  ArrowRight,
  ArrowUpRight,
  Target,
  Sparkles,
} from "lucide-react";

interface CompanyCardProps {
  company: Company;
  agentsCount?: {
    total: number;
    inProduction: number;
    withAlerts: number;
  };
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  agentsCount = { total: company.is_demo ? 3 : 0, inProduction: company.is_demo ? 1 : 0, withAlerts: 0 },
}) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/companies/${company.id}`}
                  className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors flex items-center gap-1 group-hover:underline"
                >
                  <span>{company.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                {company.is_demo && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-2.5 h-2.5" />
                    Piloto
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{company.sector}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <CompanyStatusBadge status={company.lifecycle_status} size="sm" />
            <HealthBadge health={company.health} size="sm" />
          </div>
        </div>

        {/* Estatísticas de Agentes */}
        <div className="grid grid-cols-3 gap-2 py-3 my-2 border-y border-border/80 text-center">
          <div className="px-2">
            <span className="text-[11px] text-muted-foreground font-medium block">Agentes</span>
            <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              {agentsCount.total}
            </span>
          </div>
          <div className="px-2 border-x border-border/80">
            <span className="text-[11px] text-muted-foreground font-medium block">Em Produção</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {agentsCount.inProduction}
            </span>
          </div>
          <div className="px-2">
            <span className="text-[11px] text-muted-foreground font-medium block">Com Alerta</span>
            <span className={`text-sm font-bold ${agentsCount.withAlerts > 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {agentsCount.withAlerts}
            </span>
          </div>
        </div>

        {/* Próxima Ação */}
        {company.next_action && (
          <div className="mt-3 bg-muted/40 p-2.5 rounded-lg border border-border/60 text-xs">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider font-mono">
              <Target className="w-3 h-3 text-primary" />
              <span>Próxima Ação</span>
            </div>
            <p className="text-foreground line-clamp-2 leading-relaxed">{company.next_action}</p>
          </div>
        )}
      </div>

      {/* Rodapé: Responsável e Botão de Acesso */}
      <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate max-w-[160px]">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Resp: {company.owner_name || "Automatizi"}</span>
        </div>

        <Link
          href={`/companies/${company.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <span>Acessar Painel</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
