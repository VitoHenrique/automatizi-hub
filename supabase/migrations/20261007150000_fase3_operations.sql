-- ============================================================================
-- Automatizi HUB — Migration: Fase 3 (Operação)
-- Execuções de Agentes, Alertas, Incidentes e Métricas Operacionais
-- ============================================================================

-- 1. Tabela de Incidentes Operacionais
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('p1_critical', 'p2_major', 'p3_minor')),
    status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    root_cause TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Execuções de Agentes / Workflows
CREATE TABLE IF NOT EXISTS public.agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    agent_version TEXT NOT NULL,
    correlation_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'timeout', 'cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    cost_cents INTEGER DEFAULT 0,
    input_summary TEXT,
    output_summary TEXT,
    error_message TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Alertas Operacionais
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    execution_id UUID REFERENCES public.agent_executions(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'firing' CHECK (status IN ('firing', 'acknowledged', 'resolved')),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices essenciais para consultas analíticas e multi-tenancy
CREATE INDEX IF NOT EXISTS idx_executions_org_agent ON public.agent_executions(organization_id, agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_correlation ON public.agent_executions(correlation_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON public.alerts(organization_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON public.incidents(organization_id, status);

-- Habilitação de RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Incidents
CREATE POLICY "Membros visualizam incidentes da sua organização"
    ON public.incidents FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Operadores e admins gerenciam incidentes da organização"
    ON public.incidents FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'operator')
        )
    );

-- Políticas de RLS para Executions
CREATE POLICY "Membros visualizam execuções da sua organização"
    ON public.agent_executions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Operadores, admins e service_agents inserem execuções"
    ON public.agent_executions FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'operator', 'service_agent')
        )
    );

-- Políticas de RLS para Alerts
CREATE POLICY "Membros visualizam alertas da sua organização"
    ON public.alerts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Operadores e admins alteram status de alertas"
    ON public.alerts FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'operator')
        )
    );
