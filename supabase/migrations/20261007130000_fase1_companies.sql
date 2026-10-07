-- ==============================================================================
-- AUTOMATIZI HUB - MIGRATION FASE 1: EMPRESAS CLIENTES
-- Arquivo: 20261007130000_fase1_companies.sql
-- Descrição: Entidade Company, Ciclo de Vida da Empresa, Checklist de Onboarding,
--            Trilha de Atividades e Políticas de RLS Multi-Tenant.
-- ==============================================================================

-- 1. ENUMS ESPECÍFICOS DE EMPRESA E SAÚDE
DO $$ BEGIN
    CREATE TYPE public.company_lifecycle_status AS ENUM (
        'prospect',
        'onboarding',
        'diagnostico',
        'implantacao',
        'operacao_assistida',
        'ativa',
        'atencao',
        'pausada',
        'encerrada'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.operational_health AS ENUM (
        'saudavel',
        'atencao',
        'degradado',
        'critico',
        'sem_dados',
        'desconhecido'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELA: companies (Empresas Clientes da Automatizi)
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL,
    sector text NOT NULL DEFAULT 'Geral',
    lifecycle_status public.company_lifecycle_status NOT NULL DEFAULT 'onboarding',
    health public.operational_health NOT NULL DEFAULT 'sem_dados',
    contracted_scope text,
    objectives text,
    owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    owner_name text,
    primary_contact_name text,
    primary_contact_email text,
    connected_systems text[] NOT NULL DEFAULT '{}',
    risks text,
    next_action text,
    next_review_date date,
    is_demo boolean NOT NULL DEFAULT false,
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_companies_org_slug UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_companies_org ON public.companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_lifecycle ON public.companies(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_companies_health ON public.companies(health);
CREATE INDEX IF NOT EXISTS idx_companies_archived ON public.companies(archived_at) WHERE archived_at IS NULL;

DROP TRIGGER IF EXISTS trigger_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 3. TABELA: company_onboarding_checklists (Passos de Implantação)
CREATE TABLE IF NOT EXISTS public.company_onboarding_checklists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    step_key text NOT NULL,
    step_title text NOT NULL,
    step_order int NOT NULL DEFAULT 1,
    is_completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_company_onboarding_step UNIQUE (company_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_company ON public.company_onboarding_checklists(company_id, step_order);

DROP TRIGGER IF EXISTS trigger_onboarding_updated_at ON public.company_onboarding_checklists;
CREATE TRIGGER trigger_onboarding_updated_at
    BEFORE UPDATE ON public.company_onboarding_checklists
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4. TABELA: activities (Trilha de Atividades Operacionais e Legíveis)
CREATE TABLE IF NOT EXISTS public.activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    agent_id uuid,
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name text NOT NULL,
    action_type text NOT NULL, -- ex: 'company.created', 'onboarding.step_completed', 'status.changed'
    title text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_company_created ON public.activities(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_org_created ON public.activities(organization_id, created_at DESC);

-- 5. HABILITAÇÃO DE RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA COMPANIES

-- Leitura: Membro da organização. Se possuir escopo 'company', só lê a sua empresa autorizada.
DROP POLICY IF EXISTS "companies_select_scoped" ON public.companies;
CREATE POLICY "companies_select_scoped"
    ON public.companies
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (SELECT get_current_user_org_ids()) AND
        (
            NOT EXISTS (
                SELECT 1 FROM public.memberships m
                WHERE m.user_id = auth.uid()
                  AND m.organization_id = companies.organization_id
                  AND m.scope = 'company'
            ) OR
            EXISTS (
                SELECT 1 FROM public.memberships m
                WHERE m.user_id = auth.uid()
                  AND m.organization_id = companies.organization_id
                  AND m.scope = 'company'
                  AND m.resource_id = companies.id
            )
        )
    );

-- Criação: Owner, Admin ou Operator da organização
DROP POLICY IF EXISTS "companies_insert_operator" ON public.companies;
CREATE POLICY "companies_insert_operator"
    ON public.companies
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_user_org_role(organization_id, ARRAY[
            'owner'::public.membership_role,
            'admin'::public.membership_role,
            'operator'::public.membership_role
        ])
    );

-- Atualização: Owner, Admin ou Operator com validação de escopo
DROP POLICY IF EXISTS "companies_update_operator" ON public.companies;
CREATE POLICY "companies_update_operator"
    ON public.companies
    FOR UPDATE
    TO authenticated
    USING (
        public.has_user_org_role(organization_id, ARRAY[
            'owner'::public.membership_role,
            'admin'::public.membership_role,
            'operator'::public.membership_role
        ])
    )
    WITH CHECK (
        public.has_user_org_role(organization_id, ARRAY[
            'owner'::public.membership_role,
            'admin'::public.membership_role,
            'operator'::public.membership_role
        ])
    );

-- 7. POLÍTICAS RLS PARA ONBOARDING CHECKLIST
DROP POLICY IF EXISTS "onboarding_select_org" ON public.company_onboarding_checklists;
CREATE POLICY "onboarding_select_org"
    ON public.company_onboarding_checklists
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT get_current_user_org_ids()));

DROP POLICY IF EXISTS "onboarding_update_operator" ON public.company_onboarding_checklists;
CREATE POLICY "onboarding_update_operator"
    ON public.company_onboarding_checklists
    FOR ALL
    TO authenticated
    USING (
        public.has_user_org_role(organization_id, ARRAY[
            'owner'::public.membership_role,
            'admin'::public.membership_role,
            'operator'::public.membership_role
        ])
    );

-- 8. POLÍTICAS RLS PARA ACTIVITIES
DROP POLICY IF EXISTS "activities_select_org" ON public.activities;
CREATE POLICY "activities_select_org"
    ON public.activities
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT get_current_user_org_ids()));

DROP POLICY IF EXISTS "activities_insert_org" ON public.activities;
CREATE POLICY "activities_insert_org"
    ON public.activities
    FOR INSERT
    TO authenticated
    WITH CHECK (organization_id IN (SELECT get_current_user_org_ids()));

-- ==============================================================================
-- FIM DA MIGRATION FASE 1
-- ==============================================================================
