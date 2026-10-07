import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { HealthBadge } from "@/components/ui/HealthBadge";
import {
  ShieldCheck,
  Database,
  Layers,
  ArrowRight,
  Terminal,
  Activity,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <AppShell
      breadcrumbs={[{ label: "Painel Principal", href: "/" }]}
      organizationName="Automatizi Headquarters"
      userRole="Administrador da Plataforma"
      userName="Vito"
    >
      {/* Banner de Status da Fase 0 */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Fase 0 — Fundação Operacional Concluída
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Automatizi HUB Operacional
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Plataforma B2B multiempresa configurada. Isolamento por organização garantido no servidor e banco de dados via RLS, contratos de API versionados e design system padronizado.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Ver Empresas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de Pilares da Fundação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-primary">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Multi-tenant & RLS</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Tabelas <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">organizations</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">memberships</code> e <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">audit_events</code> com isolamento obrigatório por tenant e policies no PostgreSQL.
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>RLS habilitado e ativo</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Autorização Server-Side</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Matriz RBAC com 6 papéis (<span className="font-mono text-xs">owner, admin, operator, analyst, client_viewer, service_agent</span>) e 3 escopos (<span className="font-mono text-xs">global, company, agent</span>).
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Validação de escopo estrita</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Observabilidade & Auditoria</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Audit log imutável contra adulteração, correlation IDs em todas as requisições e sanitização obrigatória contra vazamento de secrets.
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Sanitização ativa</span>
          </div>
        </div>
      </div>

      {/* Amostra dos Eixos de Estado do DESIGN.md (DEC-003) */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Diretrizes do Design System (DEC-003: Separação de Lifecycle e Saúde)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Status nunca depende apenas de cor. Cada badge possui ícone e rótulo semântico legível para rápida tomada de decisão operacional.
          </p>
        </div>

        {/* Eixo 1: Ciclo de Vida */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            Eixo 1 — Ciclo de Vida do Agente (Fase de Implantação)
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            <LifecycleBadge status="ideia" />
            <LifecycleBadge status="planejamento" />
            <LifecycleBadge status="diagnostico" />
            <LifecycleBadge status="desenho" />
            <LifecycleBadge status="construcao" />
            <LifecycleBadge status="integracao" />
            <LifecycleBadge status="testes" />
            <LifecycleBadge status="operacao_assistida" />
            <LifecycleBadge status="producao" />
            <LifecycleBadge status="pausado" />
            <LifecycleBadge status="bloqueado" />
            <LifecycleBadge status="arquivado" />
          </div>
        </div>

        {/* Eixo 2: Saúde Operacional */}
        <div className="space-y-2.5 pt-2 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            Eixo 2 — Saúde Operacional (Telemetria & Estabilidade)
          </span>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <HealthBadge health="saudavel" score={98} />
            <HealthBadge health="atencao" score={85} />
            <HealthBadge health="degradado" score={65} />
            <HealthBadge health="critico" score={32} />
            <HealthBadge health="sem_dados" />
            <HealthBadge health="desconhecido" />
          </div>
        </div>
      </div>

      {/* Terminal de API / Diagnóstico */}
      <div className="rounded-xl border border-border bg-slate-900 text-slate-100 p-5 shadow-sm space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-bold">Endpoints Base Ativos (/api/v1)</span>
          </div>
          <span className="text-[11px] text-slate-500">Formato: {"{ data, meta, error }"}</span>
        </div>
        <div className="space-y-1 text-slate-300">
          <div><span className="text-emerald-400 font-bold">GET</span> /api/v1/health <span className="text-slate-500">— Diagnóstico de subsistemas e uptime</span></div>
          <div><span className="text-blue-400 font-bold">GET</span> /api/v1/organizations <span className="text-slate-500">— Tenants vinculados ao usuário autenticado</span></div>
          <div><span className="text-amber-400 font-bold">POST</span> /api/v1/organizations <span className="text-slate-500">— Cadastro seguro com auditoria</span></div>
        </div>
      </div>
    </AppShell>
  );
}
