"use client";

import React, { useState } from "react";
import { AgentExecution } from "@/domain/types";
import { ExecutionStatusBadge } from "./ExecutionStatusBadge";
import { Clock, Play, FileText, ChevronRight, X, Terminal, ShieldAlert } from "lucide-react";

interface ExecutionsListProps {
  executions: AgentExecution[];
  onTriggerExecution?: () => Promise<void>;
  isTriggering?: boolean;
}

export function ExecutionsList({
  executions,
  onTriggerExecution,
  isTriggering = false,
}: ExecutionsListProps) {
  const [selectedExecution, setSelectedExecution] = useState<AgentExecution | null>(null);

  return (
    <div className="space-y-4">
      {onTriggerExecution && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Exibindo as últimas {executions.length} execuções registradas.
          </p>
          <button
            type="button"
            disabled={isTriggering}
            onClick={onTriggerExecution}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isTriggering ? "Executando..." : "Simular Execução"}
          </button>
        </div>
      )}

      {executions.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-xl border border-border">
          <Terminal className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-foreground">Nenhuma execução registrada</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Este agente ainda não processou dados ou disparou automações.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Correlation ID</th>
                <th className="py-2.5 px-4 font-semibold">Versão</th>
                <th className="py-2.5 px-4 font-semibold">Duração</th>
                <th className="py-2.5 px-4 font-semibold">Início</th>
                <th className="py-2.5 px-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {executions.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <ExecutionStatusBadge status={e.status} />
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-foreground">
                    {e.correlation_id}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">v{e.agent_version}</td>
                  <td className="py-3 px-4 text-muted-foreground font-mono">
                    {e.duration_ms ? `${e.duration_ms}ms` : "—"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(e.started_at).toLocaleTimeString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedExecution(e)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover p-1"
                    >
                      <span>Detalhes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalhes da Execução */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ExecutionStatusBadge status={selectedExecution.status} />
                <h3 className="text-base font-bold text-foreground">Detalhes da Execução</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExecution(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground block text-[11px]">Correlation ID:</span>
                <span className="font-mono font-medium text-foreground break-all">
                  {selectedExecution.correlation_id}
                </span>
              </div>
              <div className="p-2.5 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground block text-[11px]">Versão em Operação:</span>
                <span className="font-medium text-foreground">v{selectedExecution.agent_version}</span>
              </div>
              <div className="p-2.5 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground block text-[11px]">Duração:</span>
                <span className="font-mono font-medium text-foreground">
                  {selectedExecution.duration_ms ? `${selectedExecution.duration_ms} ms` : "Em andamento"}
                </span>
              </div>
              <div className="p-2.5 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground block text-[11px]">Horário:</span>
                <span className="font-medium text-foreground">
                  {new Date(selectedExecution.started_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            {selectedExecution.input_summary && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground">Resumo de Entrada (Input):</h4>
                <div className="p-3 bg-muted/40 rounded-lg text-xs font-mono text-foreground leading-relaxed">
                  {selectedExecution.input_summary}
                </div>
              </div>
            )}

            {selectedExecution.output_summary && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground">Resultado (Output):</h4>
                <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-foreground leading-relaxed">
                  {selectedExecution.output_summary}
                </div>
              </div>
            )}

            {selectedExecution.error_message && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <h4>Erro Sanitizado:</h4>
                </div>
                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-mono text-rose-700 dark:text-rose-300 whitespace-pre-wrap">
                  {selectedExecution.error_message}
                </div>
              </div>
            )}

            {selectedExecution.meta && Object.keys(selectedExecution.meta).length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground">Metadados de Telemetria:</h4>
                <pre className="p-3 bg-muted rounded-lg text-[11px] font-mono text-foreground overflow-x-auto">
                  {JSON.stringify(selectedExecution.meta, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedExecution(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-border"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
