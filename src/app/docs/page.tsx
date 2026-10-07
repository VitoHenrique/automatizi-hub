import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BookOpen, FileText, ExternalLink } from "lucide-react";

const DOCS_LIST = [
  { file: "00-product-vision.md", title: "Visão do Produto", desc: "Objetivos do Automatizi HUB e hierarquia de empresas e agentes" },
  { file: "01-domain-model.md", title: "Modelo de Domínio", desc: "Entidades, relacionamentos e separações obrigatórias de status" },
  { file: "02-architecture.md", title: "Arquitetura", desc: "Monólito modular, camadas de separação e contratos com Hermes" },
  { file: "03-database.md", title: "Banco de Dados & RLS", desc: "PostgreSQL, migrações idempotentes e isolamento multi-tenant" },
  { file: "04-security.md", title: "Segurança & RBAC", desc: "Papéis, escopos, hashes e política zero de vazamento de secrets" },
  { file: "05-api-contract.md", title: "Contrato de API", desc: "Padronização /api/v1 com formato { data, meta, error }" },
  { file: "06-ui-information-architecture.md", title: "Arquitetura de UI", desc: "App shell, navegação principal e fluxos operacionais" },
  { file: "07-agent-lifecycle.md", title: "Ciclo de Vida do Agente", desc: "Fases de implantação e critérios de promoção para produção" },
  { file: "08-company-lifecycle.md", title: "Ciclo de Vida da Empresa", desc: "Fases comerciais e operacionais do cliente" },
  { file: "09-integrations.md", title: "Integrações & Webhooks", desc: "Adaptadores para Meta Ads, CRM, WhatsApp e agendas" },
  { file: "10-observability.md", title: "Observabilidade", desc: "Correlation IDs, telemetria de execuções e sanitização" },
  { file: "11-hermes-contract.md", title: "Contrato do Hermes", desc: "Permissões e limites de orquestração autônoma do Hermes" },
  { file: "12-seed-data.md", title: "Dados Iniciais & DBX Global", desc: "Estrutura dos 3 agentes piloto da DBX" },
  { file: "13-testing-strategy.md", title: "Estratégia de Testes", desc: "Pirâmide de testes unitários, integração, RLS e segurança" },
  { file: "14-roadmap.md", title: "Roadmap por Fases", desc: "Fase 0 (Fundação) até Fase 5 (Validação DBX em Produção)" },
  { file: "15-decision-log.md", title: "Registro de Decisões (ADR)", desc: "Histórico formal de decisões arquiteturais adotadas" },
];

export default function DocsPage() {
  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Documentação", href: "/docs" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Documentação do Sistema</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Especificações normativas e arquitetura oficial do Automatizi HUB localizadas em <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">docs/</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOCS_LIST.map((doc) => (
            <div
              key={doc.file}
              className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/40 transition-colors flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {doc.desc}
                  </p>
                  <span className="inline-block mt-2 font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    docs/{doc.file}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
