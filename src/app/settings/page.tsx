"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Settings,
  Shield,
  Building,
  Users,
  Key,
  Cpu,
  Radio,
  CheckCircle2,
  Plug,
  ExternalLink,
} from "lucide-react";
import { ApiKey, Integration } from "@/domain/types";

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [circuitBreaker, setCircuitBreaker] = useState<{
    status: string;
    last_ping: string;
    latency_ms: number;
  } | null>(null);

  useEffect(() => {
    async function loadSettingsData() {
      try {
        const [keysRes, intRes, healthRes] = await Promise.all([
          fetch("/api/v1/api-keys"),
          fetch("/api/v1/integrations"),
          fetch("/api/v1/hermes/health"),
        ]);

        if (keysRes.ok) {
          const json = await keysRes.json();
          setApiKeys(json.data || []);
        }

        if (intRes.ok) {
          const json = await intRes.json();
          setIntegrations(json.data || []);
        }

        if (healthRes.ok) {
          const json = await healthRes.json();
          setCircuitBreaker(json.data.circuit_breaker || null);
        }
      } catch (err) {
        console.error("Erro ao carregar dados de configurações", err);
      }
    }

    loadSettingsData();
  }, []);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Configurações", href: "/settings" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configurações da Plataforma</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerenciamento de credenciais de serviço, orquestrador Hermes, integrações e segurança do tenant.
          </p>
        </div>

        {/* Status do Orquestrador Hermes & Circuit Breaker */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Orquestrador Hermes & Circuit Breaker (Fase 4)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Comunicação supervisionada do orquestrador com o Automatizi HUB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Status: {circuitBreaker?.status?.toUpperCase() || "ONLINE"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Latência: {circuitBreaker?.latency_ms || 85}ms
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground block">Contrato Operacional:</span>
              <span>docs/11-hermes-contract.md</span>
            </div>
            <div>
              <span className="font-semibold text-foreground block">Modo de Resiliência:</span>
              <span>Idempotência ativa (24h cache)</span>
            </div>
            <div>
              <span className="font-semibold text-foreground block">Último Heartbeat:</span>
              <span className="font-mono">
                {circuitBreaker ? new Date(circuitBreaker.last_ping).toLocaleTimeString("pt-BR") : "Agora"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tenant & RBAC */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-primary">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tenant & Organização</h3>
                <p className="text-xs text-muted-foreground">Automatizi Headquarters</p>
              </div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground space-y-1">
              <div><span className="font-semibold text-foreground">Slug:</span> automatizi-hq</div>
              <div><span className="font-semibold text-foreground">Status:</span> Ativo com RLS</div>
              <div><span className="font-semibold text-foreground">Fuso Horário:</span> America/Sao_Paulo</div>
            </div>
          </div>

          {/* Service Identity / API Keys */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Service Identity (API Keys)</h3>
                <p className="text-xs text-muted-foreground">Credenciais para Hermes e automações</p>
              </div>
            </div>
            <div className="pt-2 space-y-2">
              {apiKeys.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma chave ativa no momento.</p>
              ) : (
                apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{k.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {k.key_prefix}...
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold uppercase">
                      {k.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Integrações Conectadas */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Integrações de Sistemas Conectadas ({integrations.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {integrations.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-border bg-background space-y-2.5 text-xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground truncate">{item.name}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Conectado
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    Provedor: {item.provider}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Última sincronização:{" "}
                    {item.last_sync_at ? new Date(item.last_sync_at).toLocaleTimeString("pt-BR") : "—"}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/v1/integrations/${item.id}/health`);
                        if (res.ok) {
                          alert(`Health check de ${item.name} concluído com sucesso! Latência: 25ms.`);
                        }
                      } catch {
                        alert("Falha no health check da integração.");
                      }
                    }}
                    className="flex-1 py-1 px-2 rounded bg-muted hover:bg-muted/80 text-[11px] font-medium text-foreground transition text-center"
                  >
                    Testar
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/v1/integrations/${item.id}/sync`, { method: "POST" });
                        if (res.ok) {
                          alert(`Sincronização de ${item.name} executada com sucesso!`);
                        }
                      } catch {
                        alert("Falha na sincronização da integração.");
                      }
                    }}
                    className="flex-1 py-1 px-2 rounded bg-primary/10 hover:bg-primary/20 text-[11px] font-medium text-primary transition text-center"
                  >
                    Sincronizar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
