"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { HealthBadge } from "@/components/ui/HealthBadge";
import { AgentFlowDiagram } from "@/components/agents/AgentFlowDiagram";
import { AgentTasksList } from "@/components/agents/AgentTasksList";
import { AgentPromotionModal } from "@/components/agents/AgentPromotionModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Agent, AgentVersion, Task } from "@/domain/types";
import {
  Bot,
  Rocket,
  Sliders,
  History,
  ListTodo,
  Share2,
  AlertCircle,
  Sparkles,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface AgentDetailsData extends Agent {
  company_name: string;
  versions: AgentVersion[];
  tasks: Task[];
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string; agentId: string }>;
}) {
  const { id: companyId, agentId } = use(params);
  const [agent, setAgent] = useState<AgentDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"flow" | "tasks" | "versions">("flow");
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agents/${agentId}`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os detalhes do agente.");
      }
      const json = await res.json();
      setAgent(json.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido ao carregar o agente.");
      }
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  if (loading) {
    return (
      <AppShell
        breadcrumbs={[
          { label: "Visão Geral", href: "/" },
          { label: "Empresas", href: "/companies" },
          { label: "Carregando Agente..." },
        ]}
      >
        <LoadingState message="Buscando arquitetura do agente..." />
      </AppShell>
    );
  }

  if (error || !agent) {
    return (
      <AppShell
        breadcrumbs={[
          { label: "Visão Geral", href: "/" },
          { label: "Empresas", href: "/companies" },
          { label: "Erro" },
        ]}
      >
        <ErrorState message={error || "Agente não encontrado"} onRetry={fetchAgent} />
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Empresas", href: "/companies" },
        { label: agent.company_name, href: `/companies/${companyId}` },
        { label: agent.name },
      ]}
    >
      <div className="space-y-6">
        {/* Header do Agente */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-primary shrink-0 border border-border">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{agent.name}</h1>
                  {agent.is_demo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono uppercase font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      <Sparkles className="w-3 h-3" />
                      Piloto DBX
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Versão atual: <span className="font-mono font-bold text-foreground">v{agent.current_version}</span> • Empresa:{" "}
                  <strong className="text-foreground">{agent.company_name}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
              <LifecycleBadge status={agent.lifecycle_status} size="md" />
              <HealthBadge health={agent.health} score={agent.health_score} size="md" />

              {agent.lifecycle_status !== "producao" && (
                <button
                  onClick={() => setIsPromoteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Promover a Produção</span>
                </button>
              )}
            </div>
          </div>

          {/* Missão e Problema Resolvido */}
          <div className="pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground uppercase font-mono text-[10px] block mb-1">
                Missão Operacional
              </span>
              <p className="text-foreground bg-muted/30 p-3 rounded-lg border border-border/60 leading-relaxed">
                {agent.role_description}
              </p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground uppercase font-mono text-[10px] block mb-1">
                Problema Resolvido
              </span>
              <p className="text-foreground bg-muted/30 p-3 rounded-lg border border-border/60 leading-relaxed">
                {agent.problem_solved || "Otimização e automação de processos comerciais."}
              </p>
            </div>
          </div>

          {/* Justificativa de Saúde */}
          {agent.health_reasons && agent.health_reasons.length > 0 && (
            <div className="bg-muted/40 p-3 rounded-lg border border-border/60 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Diagnóstico de Saúde Operacional:</span>
                <p className="text-muted-foreground">{agent.health_reasons.join(" ")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Abas Internas */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("flow")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "flow"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Fluxo de Decisão & Arquitetura</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "tasks"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Tarefas do Agente ({agent.tasks?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("versions")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "versions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Versões Promovidas ({agent.versions?.length || 0})</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === "flow" && <AgentFlowDiagram agent={agent} />}

        {activeTab === "tasks" && (
          <AgentTasksList agentId={agent.id} initialTasks={agent.tasks || []} />
        )}

        {activeTab === "versions" && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Histórico de Versões do Agente</h3>
            </div>

            <div className="space-y-3">
              {agent.versions?.map((ver) => (
                <div
                  key={ver.id}
                  className="p-4 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground text-sm">v{ver.version}</span>
                      {ver.is_production && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                          PRODUÇÃO ATIVA
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{ver.change_summary}</p>
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    Criada em: {new Date(ver.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Promoção para Produção com Critérios de Prontidão */}
      <AgentPromotionModal
        agentId={agent.id}
        agentName={agent.name}
        currentVersion={agent.current_version}
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        onSuccess={fetchAgent}
      />
    </AppShell>
  );
}
