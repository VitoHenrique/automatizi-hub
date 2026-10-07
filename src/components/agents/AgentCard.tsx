import React from "react";
import Link from "next/link";
import { Agent } from "@/domain/types";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { HealthBadge } from "@/components/ui/HealthBadge";
import {
  Bot,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Share2,
  ListTodo,
} from "lucide-react";

interface AgentCardProps {
  agent: Agent;
  companyId: string;
  tasksCount?: number;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  companyId,
  tasksCount = 0,
}) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-primary shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/companies/${companyId}/agents/${agent.id}`}
                  className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors flex items-center gap-1 group-hover:underline"
                >
                  <span>{agent.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                {agent.is_demo && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-2.5 h-2.5" />
                    Demo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-mono">
                <span>v{agent.current_version}</span>
                <span>•</span>
                <span className="capitalize">{agent.kind}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <LifecycleBadge status={agent.lifecycle_status} size="sm" />
            <HealthBadge health={agent.health} score={agent.health_score} size="sm" />
          </div>
        </div>

        {/* Missão do Agente */}
        <div className="py-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {agent.role_description}
        </div>

        {/* Sistemas Acessados */}
        {agent.accessed_systems && agent.accessed_systems.length > 0 && (
          <div className="py-2 flex items-center gap-1.5 flex-wrap">
            <Share2 className="w-3 h-3 text-muted-foreground shrink-0" />
            {agent.accessed_systems.map((sys, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[11px] font-mono bg-muted text-foreground rounded border border-border"
              >
                {sys}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rodapé: Tarefas e Link de Acesso */}
      <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ListTodo className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono">{tasksCount} tarefas</span>
        </div>

        <Link
          href={`/companies/${companyId}/agents/${agent.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <span>Ver Detalhes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
