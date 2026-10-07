"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { CompanyFormModal } from "@/components/companies/CompanyFormModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Company } from "@/domain/types";
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
} from "lucide-react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/v1/companies?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar lista de empresas.");
      }
      const json = await res.json();
      setCompanies(json.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido ao consultar empresas.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Contadores
  const totalCount = companies.length;
  const onboardingCount = companies.filter((c) =>
    ["prospect", "onboarding", "diagnostico", "implantacao"].includes(c.lifecycle_status)
  ).length;
  const activeCount = companies.filter((c) =>
    ["operacao_assistida", "ativa"].includes(c.lifecycle_status)
  ).length;
  const alertCount = companies.filter((c) => c.lifecycle_status === "atencao").length;

  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Empresas", href: "/companies" },
      ]}
    >
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Empresas Clientes</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Gestão centralizada de clientes, implantação, saúde operacional e agentes de IA.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary-hover shadow-sm transition-colors self-start sm:self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Empresa</span>
          </button>
        </div>

        {/* Métricas Agregadas de Topo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-primary shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                Total de Empresas
              </span>
              <span className="text-lg font-bold text-foreground block">{totalCount}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                Em Implantação
              </span>
              <span className="text-lg font-bold text-foreground block">{onboardingCount}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                Em Produção / Ativas
              </span>
              <span className="text-lg font-bold text-foreground block">{activeCount}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                Em Atenção
              </span>
              <span className={`text-lg font-bold ${alertCount > 0 ? "text-rose-600" : "text-foreground"} block`}>
                {alertCount}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou setor da empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="all">Todas as Fases</option>
              <option value="prospect">Prospect</option>
              <option value="onboarding">Onboarding</option>
              <option value="diagnostico">Diagnóstico</option>
              <option value="implantacao">Implantação</option>
              <option value="operacao_assistida">Operação Assistida</option>
              <option value="ativa">Ativa</option>
              <option value="atencao">Atenção</option>
              <option value="pausada">Pausada</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
        </div>

        {/* Estados de Interface: Loading, Error, Empty e Lista */}
        {loading ? (
          <LoadingState message="Carregando empresas cadastradas..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCompanies} />
        ) : companies.length === 0 ? (
          <EmptyState
            title="Nenhuma empresa encontrada"
            description="Não há empresas cadastradas para o filtro selecionado. Adicione uma nova empresa para iniciar a operação."
            icon={Building2}
            actionLabel="Cadastrar Empresa"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      <CompanyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCompanies}
      />
    </AppShell>
  );
}
