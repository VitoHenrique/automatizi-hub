-- ==============================================================================
-- AUTOMATIZI HUB - MIGRATION FASE 0: FUNDAÇÃO
-- Arquivo: 20261007120000_fase0_foundation.sql
-- Descrição: Tenants (Organizations), Perfis, Memberships com Papéis e Escopos,
--            Auditoria Imutável e Políticas de RLS para Isolamento Multi-Tenant.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE public.organization_status AS ENUM ('active', 'suspended', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.membership_role AS ENUM (
        'owner',
        'admin',
        'operator',
        'analyst',
        'client_viewer',
        'service_agent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.membership_scope AS ENUM ('global', 'company', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UTILITÁRIOS: updated_at E SEGURANÇA DE AUDITORIA
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Imutabilidade da tabela de auditoria
CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'Registros de auditoria são imutáveis e não podem ser alterados ou excluídos.';
END;
$$;

-- 4. TABELA: organizations (Tenants Principais)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    status public.organization_status NOT NULL DEFAULT 'active',
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON public.organizations;
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 5. TABELA: profiles (Espelho de usuários autenticados)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Sincronização automática auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 6. TABELA: memberships (Associação Usuário <-> Tenant com Papel e Escopo)
CREATE TABLE IF NOT EXISTS public.memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.membership_role NOT NULL DEFAULT 'operator',
    scope public.membership_scope NOT NULL DEFAULT 'global',
    resource_id uuid, -- ID opcional de empresa ou agente se escopo for restrito
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_memberships_tenant_user_role_scope_res UNIQUE (organization_id, user_id, role, scope, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON public.memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_active ON public.memberships(is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS trigger_memberships_updated_at ON public.memberships;
CREATE TRIGGER trigger_memberships_updated_at
    BEFORE UPDATE ON public.memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 7. TABELA: audit_events (Trilha Imutável de Auditoria)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_type text NOT NULL DEFAULT 'user', -- 'user', 'service_agent', 'hermes', 'system'
    action text NOT NULL, -- ex: 'organization.create', 'membership.update', 'login'
    target_type text NOT NULL, -- ex: 'organization', 'company', 'agent', 'membership'
    target_id uuid,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    ip_address text,
    correlation_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_org_created ON public.audit_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON public.audit_events(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON public.audit_events(actor_id);

-- Proteger contra alteração ou exclusão de auditoria
DROP TRIGGER IF EXISTS trigger_audit_events_tampering ON public.audit_events;
CREATE TRIGGER trigger_audit_events_tampering
    BEFORE UPDATE OR DELETE ON public.audit_events
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_tampering();

-- 8. FUNÇÕES AUXILIARES DE RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_current_user_org_ids()
RETURNS TABLE (organization_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT m.organization_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.has_user_org_role(
    p_org_id uuid,
    p_roles public.membership_role[]
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.organization_id = p_org_id
          AND m.is_active = true
          AND m.role = ANY(p_roles)
    );
$$;

-- 9. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS RLS

-- Organizations
DROP POLICY IF EXISTS "organizations_select_member" ON public.organizations;
CREATE POLICY "organizations_select_member"
    ON public.organizations
    FOR SELECT
    TO authenticated
    USING (id IN (SELECT get_current_user_org_ids()));

DROP POLICY IF EXISTS "organizations_update_admin" ON public.organizations;
CREATE POLICY "organizations_update_admin"
    ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (public.has_user_org_role(id, ARRAY['owner'::public.membership_role, 'admin'::public.membership_role]))
    WITH CHECK (public.has_user_org_role(id, ARRAY['owner'::public.membership_role, 'admin'::public.membership_role]));

-- Profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.memberships m1
            JOIN public.memberships m2 ON m1.organization_id = m2.organization_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
        )
    );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Memberships
DROP POLICY IF EXISTS "memberships_select_member" ON public.memberships;
CREATE POLICY "memberships_select_member"
    ON public.memberships
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT get_current_user_org_ids()));

DROP POLICY IF EXISTS "memberships_insert_admin" ON public.memberships;
CREATE POLICY "memberships_insert_admin"
    ON public.memberships
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_user_org_role(organization_id, ARRAY['owner'::public.membership_role, 'admin'::public.membership_role]));

DROP POLICY IF EXISTS "memberships_update_admin" ON public.memberships;
CREATE POLICY "memberships_update_admin"
    ON public.memberships
    FOR UPDATE
    TO authenticated
    USING (public.has_user_org_role(organization_id, ARRAY['owner'::public.membership_role, 'admin'::public.membership_role]))
    WITH CHECK (public.has_user_org_role(organization_id, ARRAY['owner'::public.membership_role, 'admin'::public.membership_role]));

DROP POLICY IF EXISTS "memberships_delete_admin" ON public.memberships;
CREATE POLICY "memberships_delete_admin"
    ON public.memberships
    FOR DELETE
    TO authenticated
    USING (public.has_user_org_role(organization_id, ARRAY['owner'::public.membership_role, 'admin'::public.membership_role]));

-- Audit Events
DROP POLICY IF EXISTS "audit_events_select_authorized" ON public.audit_events;
CREATE POLICY "audit_events_select_authorized"
    ON public.audit_events
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (SELECT get_current_user_org_ids()) AND
        public.has_user_org_role(organization_id, ARRAY[
            'owner'::public.membership_role,
            'admin'::public.membership_role,
            'operator'::public.membership_role,
            'analyst'::public.membership_role
        ])
    );

DROP POLICY IF EXISTS "audit_events_insert_authorized" ON public.audit_events;
CREATE POLICY "audit_events_insert_authorized"
    ON public.audit_events
    FOR INSERT
    TO authenticated
    WITH CHECK (organization_id IN (SELECT get_current_user_org_ids()));

-- ==============================================================================
-- FIM DA MIGRATION FASE 0
-- ==============================================================================
