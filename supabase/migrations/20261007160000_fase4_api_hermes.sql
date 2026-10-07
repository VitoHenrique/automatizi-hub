-- ============================================================================
-- Automatizi HUB — Migration: Fase 4 (API & Hermes)
-- Service Identity (API Keys), Idempotência e Integrações
-- ============================================================================

-- 1. Tabela de API Keys (Service Identity para Hermes e Agentes de Serviço)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL, -- Ex: atmz_hermes_ab12
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256 da chave completa
    role TEXT NOT NULL DEFAULT 'service_agent' CHECK (role IN ('service_agent', 'operator', 'analyst')),
    scopes TEXT[] NOT NULL DEFAULT ARRAY['hermes:read', 'hermes:operate'],
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Registros de Idempotência
CREATE TABLE IF NOT EXISTS public.idempotency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL, -- Hash do endpoint + payload
    response_code INTEGER NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    UNIQUE(organization_id, idempotency_key)
);

-- 3. Tabela de Integrações de Sistemas (Meta Ads, WhatsApp, CRM DBX, Agenda)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('meta_ads', 'dbx_crm', 'whatsapp_cloud', 'google_calendar', 'webhook')),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    last_sync_at TIMESTAMPTZ,
    error_details TEXT,
    config JSONB DEFAULT '{}'::jsonb, -- Configurações e metadados não sensíveis
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices essenciais
CREATE INDEX IF NOT EXISTS idx_api_keys_org_hash ON public.api_keys(organization_id, key_hash);
CREATE INDEX IF NOT EXISTS idx_idempotency_org_key ON public.idempotency_records(organization_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_integrations_org_provider ON public.integrations(organization_id, provider);

-- Habilitar Row Level Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para API Keys (Apenas owners e admins gerenciam chaves da organização)
CREATE POLICY "Admins e owners gerenciam API keys da organização"
    ON public.api_keys FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Políticas de RLS para Integrações
CREATE POLICY "Membros visualizam integrações da sua organização"
    ON public.integrations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins e operadores gerenciam integrações"
    ON public.integrations FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'operator')
        )
    );
