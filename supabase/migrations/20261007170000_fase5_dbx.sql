-- ============================================================================
-- AUTOMATIZI HUB — MIGRATION FASE 5 (PILOTO DBX, LEADS & WEBHOOKS)
-- ============================================================================
-- Data: 2026-10-07
-- Descrição: Criação das tabelas 'leads' e 'webhook_events' com isolamento multi-tenant
-- e políticas RLS para suportar os adaptadores de integração (Meta Ads, WhatsApp, CRM e Calendar).
-- ============================================================================

-- 1. TABELA DE EVENTOS DE WEBHOOK (Ingestão bruta deduplicada)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('meta_ads', 'dbx_crm', 'whatsapp_cloud', 'google_calendar', 'webhook')),
  event_id TEXT NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'duplicate', 'failed')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice único para deduplicação idempotente estrita por provedor e ID externo
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_dedup
  ON webhook_events (organization_id, provider, event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_org ON webhook_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events (status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events (created_at DESC);

-- RLS para webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_events_tenant_select" ON webhook_events;
CREATE POLICY "webhook_events_tenant_select" ON webhook_events
  FOR SELECT
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

DROP POLICY IF EXISTS "webhook_events_tenant_insert" ON webhook_events;
CREATE POLICY "webhook_events_tenant_insert" ON webhook_events
  FOR INSERT
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

DROP POLICY IF EXISTS "webhook_events_tenant_update" ON webhook_events;
CREATE POLICY "webhook_events_tenant_update" ON webhook_events
  FOR UPDATE
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

-- 2. TABELA DE LEADS (Funil operacional multi-tenant)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  external_lead_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'meta_ads',
  campaign_name TEXT,
  status TEXT NOT NULL DEFAULT 'captado' CHECK (status IN ('captado', 'contatado', 'qualificado', 'reuniao_agendada', 'distribuido', 'desqualificado', 'perdido')),
  qualification_score INTEGER CHECK (qualification_score >= 0 AND qualification_score <= 10),
  qualification_notes TEXT,
  assigned_closer_id TEXT,
  assigned_closer_name TEXT,
  scheduled_meeting_at TIMESTAMPTZ,
  first_contact_response_time_seconds INTEGER,
  meta_event_id TEXT,
  payload_raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_org ON leads (organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads (company_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_closer ON leads (assigned_closer_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);

-- RLS para leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_tenant_select" ON leads;
CREATE POLICY "leads_tenant_select" ON leads
  FOR SELECT
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

DROP POLICY IF EXISTS "leads_tenant_insert" ON leads;
CREATE POLICY "leads_tenant_insert" ON leads
  FOR INSERT
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

DROP POLICY IF EXISTS "leads_tenant_update" ON leads;
CREATE POLICY "leads_tenant_update" ON leads
  FOR UPDATE
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

-- Comentários descritivos
COMMENT ON TABLE webhook_events IS 'Histórico deduplicado de webhooks externos ingeridos para disparo de fluxos dos agentes';
COMMENT ON TABLE leads IS 'Entidade operacional de leads captados, qualificados pelo SDR e distribuídos aos closers';
