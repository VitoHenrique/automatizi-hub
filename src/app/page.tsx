import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { HealthBadge } from "@/components/ui/HealthBadge";
import { MetricsOverview } from "@/components/operations/MetricsOverview";
import { operationsRepository } from "@/lib/operations/store";
import {
  ShieldCheck,
  Database,
  Layers,
  ArrowRight,
  Terminal,
  Activity,
  CheckCircle,
  BellRing,
  Bot,
  Building2,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
  const metrics = operationsRepository.getMetricsSummary(DEFAULT_ORG_ID);

  return (
    <AppShell
      breadcrumbs={[{ label: "Painel Principal", href: "/" }]}
      organizationName="Automatizi Headquarters"
      userRole="Administrador da Plataforma"
      userName="Vito"
    >
      {/* Banner de Status */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Operação em Tempo Real Ativa (Fase 3)
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Automatizi HUB Operacional
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Plataforma B2B multiempresa com supervisão ativa de agentes de IA, telemetria de execuções, monitoramento de saúde, gestão de alertas e auditoria em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Building2 className="w-4 h-4" />
              <span>Ver Empresas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/alerts"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-border transition-colors"
            >
              <BellRing className="w-4 h-4" />
              <span>Alertas ({metrics.firing_alerts_count})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Visão Operacional / Métricas Globais (Fase 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Telemetria Operacional da Plataforma
          </h2>
          <Link
            href="/activity"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span>Ver Feed de Atividades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <MetricsOverview metrics={metrics} />
      </div>

      {/* Grid de Pilares da Plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-primary">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Multi-tenant & RLS</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Tabelas <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">companies</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">agents</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">agent_executions</code> e <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">alerts</code> com isolamento por organização e policies RLS no PostgreSQL.
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>RLS habilitado e auditado</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Autorização & RBAC</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Matriz RBAC com 6 papéis e 3 escopos, com validação de prontidão de produção e aprovação formal em endpoints dedicados.
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Controle estrito de escopo</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Observabilidade Segura</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Trilha de auditoria imutável, sanitização ativa de credenciais e correlação fim-a-fim em todas as execuções de agentes.
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Sanitização ativa</span>
          </div>
        </div>
      </div>

      {/* Terminal de API / Diagnóstico */}
      <div className="rounded-xl border border-border bg-slate-900 text-slate-100 p-5 shadow-sm space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-bold">Endpoints Operacionais (/api/v1)</span>
          </div>
          <span className="text-[11px] text-slate-500">Formato: {"{ data, meta, error }"}</span>
        </div>
        <div className="space-y-1 text-slate-300">
          <div><span className="text-emerald-400 font-bold">GET</span> /api/v1/executions <span className="text-slate-500">— Listagem de execuções com correlation ID e telemetria</span></div>
          <div><span className="text-amber-400 font-bold">POST</span> /api/v1/executions <span className="text-slate-500">— Disparo/registro de execução com sanitização de erro</span></div>
          <div><span className="text-blue-400 font-bold">GET</span> /api/v1/alerts <span className="text-slate-500">— Alertas com severidade, acknowledgement e resolução</span></div>
          <div><span className="text-purple-400 font-bold">GET</span> /api/v1/metrics <span className="text-slate-500">— Métricas agregadas de sucesso, latência e custo</span></div>
        </div>
      </div>
    </AppShell>
  );
}
