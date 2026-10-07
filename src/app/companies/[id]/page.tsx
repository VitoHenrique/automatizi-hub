"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CompanyStatusBadge } from "@/components/companies/CompanyStatusBadge";
import { HealthBadge } from "@/components/ui/HealthBadge";
import { OnboardingChecklistWidget } from "@/components/companies/OnboardingChecklistWidget";
import { CompanyActivityTimeline } from "@/components/companies/CompanyActivityTimeline";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentFormModal } from "@/components/agents/AgentFormModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Company, CompanyOnboardingStep, Activity, Agent, Lead } from "@/domain/types";
import { LeadsPipeline } from "@/components/leads/LeadsPipeline";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { SimulateLeadModal } from "@/components/leads/SimulateLeadModal";
import {
  Building2,
  Bot,
  Mail,
  User,
  Target,
  Share2,
  Calendar,
  AlertCircle,
  FileText,
  Sparkles,
  Plus,
  Workflow,
  Send,
} from "lucide-react";

interface CompanyDetailsData extends Company {
  onboarding_progress: number;
  onboarding_steps: CompanyOnboardingStep[];
  recent_activities: Activity[];
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CompanyDetailsData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "leads" | "activity">("overview");
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/companies/${id}`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os dados desta empresa.");
      }
      const json = await res.json();
      setData(json.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido ao carregar detalhes.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const res = await fetch(`/api/v1/agents?company_id=${id}`);
      if (res.ok) {
        const json = await res.json();
        setAgents(json.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar agentes:", err);
    } finally {
      setLoadingAgents(false);
    }
  }, [id]);

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch(`/api/v1/companies/${id}/leads`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
    } finally {
      setLoadingLeads(false);
    }
  }, [id]);

  const handleSplitLead = async (lead: Lead) => {
    try {
      const res = await fetch(`/api/v1/companies/${id}/leads/${lead.id}/split`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchLeads();
      }
    } catch (err) {
      console.error("Erro ao distribuir lead:", err);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchAgents();
    fetchLeads();
  }, [fetchDetails, fetchAgents, fetchLeads]);

  if (loading) {
    return (
      <AppShell
        breadcrumbs={[
          { label: "Visão Geral", href: "/" },
          { label: "Empresas", href: "/companies" },
          { label: "Carregando..." },
        ]}
      >
        <LoadingState message="Buscando detalhes da empresa cliente..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell
        breadcrumbs={[
          { label: "Visão Geral", href: "/" },
          { label: "Empresas", href: "/companies" },
          { label: "Erro" },
        ]}
      >
        <ErrorState message={error || "Empresa não encontrada"} onRetry={fetchDetails} />
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Empresas", href: "/companies" },
        { label: data.name },
      ]}
    >
      <div className="space-y-6">
        {/* Header Principal da Empresa */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-primary shrink-0 border border-border">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{data.name}</h1>
                  {data.is_demo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono uppercase font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      <Sparkles className="w-3 h-3" />
                      Piloto Oficial
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Setor: <span className="font-semibold text-foreground">{data.sector}</span> • Slug:{" "}
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{data.slug}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
              <CompanyStatusBadge status={data.lifecycle_status} size="md" />
              <HealthBadge health={data.health} size="md" />
            </div>
          </div>

          {/* Dados Operacionais Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 text-primary shrink-0" />
              <span>
                Responsável: <strong className="text-foreground">{data.owner_name || "Automatizi"}</strong>
              </span>
            </div>
            {data.primary_contact_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">
                  Contato: <strong className="text-foreground">{data.primary_contact_name}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span>
                Cadastrado em:{" "}
                <strong className="text-foreground font-mono">
                  {new Date(data.created_at).toLocaleDateString("pt-BR")}
                </strong>
              </span>
            </div>
            {data.next_review_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Próxima Revisão:{" "}
                  <strong className="text-foreground font-mono">{data.next_review_date}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Abas de Navegação Interna */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Visão Geral & Onboarding
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "agents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Agentes de IA ({agents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "leads"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Pipeline de Leads ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "activity"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Trilha de Atividades ({data.recent_activities?.length || 0})
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Escopo & Objetivos de Negócio</h3>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <span className="font-semibold text-muted-foreground uppercase font-mono text-[10px] block mb-0.5">
                      Objetivos Estratégicos
                    </span>
                    <p className="text-foreground bg-muted/30 p-3 rounded-lg border border-border/60">
                      {data.objectives || "Objetivos não especificados."}
                    </p>
                  </div>

                  {data.contracted_scope && (
                    <div>
                      <span className="font-semibold text-muted-foreground uppercase font-mono text-[10px] block mb-0.5">
                        Escopo Contratado
                      </span>
                      <p className="text-foreground bg-muted/30 p-3 rounded-lg border border-border/60">
                        {data.contracted_scope}
                      </p>
                    </div>
                  )}

                  {data.risks && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/60">
                      <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1 text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Riscos Mapeados
                      </span>
                      <p className="text-amber-900 dark:text-amber-200 text-xs">{data.risks}</p>
                    </div>
                  )}
                </div>
              </div>

              <OnboardingChecklistWidget
                companyId={data.id}
                initialSteps={data.onboarding_steps}
                initialProgress={data.onboarding_progress}
              />
            </div>

            <div className="space-y-6">
              {data.next_action && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase font-mono">
                    <Target className="w-4 h-4 text-primary" />
                    <span>Próxima Ação Imediata</span>
                  </div>
                  <p className="text-xs text-foreground bg-muted/40 p-3 rounded-lg border border-border/60 leading-relaxed font-medium">
                    {data.next_action}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Share2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Sistemas Conectados</h3>
                </div>

                {data.connected_systems && data.connected_systems.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.connected_systems.map((sys, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-mono bg-muted text-foreground border border-border flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {sys}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum sistema conectado ainda.</p>
                )}
              </div>

              <CompanyActivityTimeline activities={data.recent_activities} />
            </div>
          </div>
        )}

        {/* Aba de Agentes: Operação Real e Viva na Fase 2 */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Agentes de IA da Empresa</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Agentes operacionais, automações assistidas e componentes transversais.
                </p>
              </div>

              <button
                onClick={() => setIsAgentModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Agente</span>
              </button>
            </div>

            {loadingAgents ? (
              <LoadingState message="Carregando agentes de IA..." />
            ) : agents.length === 0 ? (
              <EmptyState
                title="Nenhum agente cadastrado para esta empresa"
                description="Desenhe o primeiro agente operacional para iniciar a automação dos processos comerciais da empresa."
                icon={Bot}
                actionLabel="Criar Primeiro Agente"
                onAction={() => setIsAgentModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    companyId={data.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba de Leads: Operação Real do Piloto DBX (Fase 5) */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Pipeline de Leads & Operação Piloto</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fluxo automatizado: Webhook Meta Ads → SDR WhatsApp (&lt; 60s) → Qualificação BANT → Split CRM.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSimulateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simular Lead (Meta Ads)</span>
                </button>
              </div>
            </div>

            {loadingLeads ? (
              <LoadingState message="Carregando leads da operação..." />
            ) : leads.length === 0 ? (
              <EmptyState
                title="Nenhum lead recebido ainda"
                description="Dispare um webhook de teste ou aguarde novas conversões de anúncios para visualizar a qualificação e distribuição em tempo real."
                icon={Workflow}
                actionLabel="Simular Primeiro Lead"
                onAction={() => setIsSimulateModalOpen(true)}
              />
            ) : (
              <div className="space-y-6">
                <LeadsPipeline
                  leads={leads}
                  onSplitLead={handleSplitLead}
                />

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-bold text-foreground mb-3">Visão Tabular & Distribuição</h3>
                  <LeadsTable
                    leads={leads}
                    onSplitLead={handleSplitLead}
                    onRefresh={fetchLeads}
                    isLoading={loadingLeads}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="max-w-3xl">
            <CompanyActivityTimeline activities={data.recent_activities} />
          </div>
        )}
      </div>

      <AgentFormModal
        companyId={data.id}
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSuccess={fetchAgents}
      />

      <SimulateLeadModal
        companyId={data.id}
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onSuccess={fetchLeads}
      />
    </AppShell>
  );
}
