"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity } from "@/domain/types";
import { Activity as ActivityIcon, Clock, User, Sparkles, AlertCircle } from "lucide-react";

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/activities");
      if (!res.ok) {
        throw new Error("Falha ao carregar a trilha de atividades.");
      }
      const json = await res.json();
      setActivities(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Visão Geral", href: "/" },
        { label: "Atividade", href: "/activity" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trilha de Atividades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registro cronológico legível de eventos operacionais, execuções de agentes e intervenções humanas.
          </p>
        </div>

        {isLoading ? (
          <LoadingState message="Carregando trilha de atividades..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchActivities} />
        ) : activities.length === 0 ? (
          <EmptyState
            title="Nenhuma atividade registrada"
            description="Conforme as operações e automações forem executadas, os eventos serão registrados aqui."
            icon={ActivityIcon}
          />
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {activities.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{item.title}</span>
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.actor_name}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {item.action_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
