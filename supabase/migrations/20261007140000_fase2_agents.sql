-- ==============================================================================
-- AUTOMATIZI HUB - MIGRATION FASE 2: AGENTES DE IA E TAREFAS CONTEXTUALIZADAS
-- Arquivo: 20261007140000_fase2_agents.sql
-- Descrição: Entidades Agents, AgentVersions imutáveis, Tasks operacionais por agente
--            e Políticas de RLS Multi-Tenant com escopo formal.
-- ==============================================================================

-- 1. ENUMS ESPECÍFICOS DE AGENTES E TAREFAS
DO $$ BEGIN
    CREATE TYPE public.agent_lifecycle_status AS ENUM (
        'ideia',
        'planejamento',
        'diagnostico',
        'desenho',
        'construcao',
        'integracao',
        'testes',
        'operacao_assistida',
        'producao',
        'pausado',
        'bloqueado',
        'arquivado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_kind AS ENUM ('task', 'milestone', 'blocker', 'decision');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELA: agents (Agentes de IA pertencentes a empresas clientes)
CREATE TABLE IF NOT EXISTS public.agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL,
    kind text NOT NULL DEFAULT 'agent', -- 'agent', 'foundation', 'transversal'
    role_description text NOT NULL, -- Missão principal
    problem_solved text, -- Problema que o agente resolve
    lifecycle_status public.agent_lifecycle_status NOT NULL DEFAULT 'planejamento',
    health public.operational_health NOT NULL DEFAULT 'sem_dados',
    health_score integer NOT NULL DEFAULT 100,
    health_reasons text[] NOT NULL DEFAULT '{}',
    current_version text NOT NULL DEFAULT '1.0.0',
    owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    owner_name text,
    flow_summary text,
    inputs_definition jsonb NOT NULL DEFAULT '[]'::jsonb,
    decisions_definition jsonb NOT NULL DEFAULT '[]'::jsonb,
    actions_definition jsonb NOT NULL DEFAULT '[]'::jsonb,
    outputs_definition jsonb NOT NULL DEFAULT '[]'::jsonb,
    accessed_systems text[] NOT NULL DEFAULT '{}',
    operational_limits text,
    human_intervention_rules text,
    key_indicators jsonb NOT NULL DEFAULT '[]'::jsonb,
    risks text,
    is_demo boolean NOT NULL DEFAULT false,
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_agents_company_slug UNIQUE (company_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON public.agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_company ON public.agents(company_id);
CREATE INDEX IF NOT EXISTS idx_agents_lifecycle ON public.agents(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_agents_health ON public.agents(health);
CREATE INDEX IF NOT EXISTS idx_agents_archived ON public.agents(archived_at) WHERE archived_at IS NULL;

DROP TRIGGER IF EXISTS trigger_agents_updated_at ON public.agents;
CREATE TRIGGER trigger_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 3. TABELA: agent_versions (Versões imutáveis e auditadas do agente)
CREATE TABLE IF NOT EXISTS public.agent_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    version text NOT NULL,
    change_summary text NOT NULL,
    config_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_production boolean NOT NULL DEFAULT false,
    promoted_at timestamptz,
    promoted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_agent_version UNIQUE (agent_id, version)
);

CREATE INDEX IF NOT EXISTS idx_agent_versions_agent ON public.agent_versions(agent_id, created_at DESC);

-- 4. TABELA: tasks (Tarefas operacionais ligadas a empresa, agente ou iniciativa)
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    kind public.task_kind NOT NULL DEFAULT 'task',
    status public.task_status NOT NULL DEFAULT 'todo',
    priority public.task_priority NOT NULL DEFAULT 'medium',
    assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    assignee_name text,
    due_date date,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON public.tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 5. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA AGENTS
DROP POLICY IF EXISTS "agents_select_scoped" ON public.agents;
CREATE POLICY "agents_select_scoped"
    ON public.agents
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (SELECT get_current_user_org_ids()) AND
        (
            NOT EXISTS (
                SELECT 1 FROM public.memberships m
                WHERE m.user_id = auth.uid()
                  AND m.organization_id = agents.organization_id
                  AND m.scope IN ('company', 'agent')
            ) OR
            EXISTS (
                SELECT 1 FROM public.memberships m
                WHERE m.user_id = auth.uid()
                  AND m.organization_id = agents.organization_id
                  AND (
                      (m.scope = 'company' AND m.resource_id = agents.company_id) OR
                      (m.scope = 'agent' AND m.resource_id = agents.id)
                  )
            )
        )
    );

DROP POLICY IF EXISTS "agents_write_operator" ON public.agents;
CREATE POLICY "agents_write_operator"
    ON public.agents
    FOR ALL
    TO authenticated
    USING (
        public.has_user_org_role(organization_id, ARRAY[
            'owner'::public.membership_role,
            'admin'::public.membership_role,
            'operator'::public.membership_role
        ])
    );

-- 7. POLÍTICAS RLS PARA AGENT_VERSIONS
DROP POLICY IF EXISTS "agent_versions_select_org" ON public.agent_versions;
CREATE POLICY "agent_versions_select_org"
    ON public.agent_versions
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT get_current_user_org_ids()));

DROP POLICY IF EXISTS "agent_versions_insert_operator" ON public.agent_versions;
CREATE POLICY "agent_versions_insert_operator"
    ON public.agent_versions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_user_org_role(organization_id, ARRAY[
            'owner'::public.membership_role,
            'admin'::public.membership_role,
            'operator'::public.membership_role
        ])
    );

-- 8. POLÍTICAS RLS PARA TASKS
DROP POLICY IF EXISTS "tasks_select_org" ON public.tasks;
CREATE POLICY "tasks_select_org"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT get_current_user_org_ids()));

DROP POLICY IF EXISTS "tasks_write_authorized" ON public.tasks;
CREATE POLICY "tasks_write_authorized"
    ON public.tasks
    FOR ALL
    TO authenticated
    USING (
        public.has_user_org_role(organization_id, ARRAY[
            'owner'::public.membership_role,
            'admin'::public.membership_role,
            'operator'::public.membership_role,
            'service_agent'::public.membership_role
        ])
    );

-- ==============================================================================
-- FIM DA MIGRATION FASE 2
-- ==============================================================================
