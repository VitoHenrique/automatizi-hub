"use client";

import React, { useState } from "react";
import { X, Rocket, CheckSquare, Square, Loader2, AlertCircle } from "lucide-react";
import { ReadinessChecklist } from "@/domain/lifecycle";

interface AgentPromotionModalProps {
  agentId: string;
  agentName: string;
  currentVersion: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AgentPromotionModal: React.FC<AgentPromotionModalProps> = ({
  agentId,
  agentName,
  currentVersion,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [version, setVersion] = useState(() => {
    const parts = currentVersion.split(".").map(Number);
    if (parts.length === 3 && !isNaN(parts[1])) {
      return `${parts[0]}.${parts[1] + 1}.0`;
    }
    return "1.0.0";
  });

  const [changeSummary, setChangeSummary] = useState("");
  const [checklist, setChecklist] = useState<ReadinessChecklist>({
    has_documentation: false,
    has_validated_integrations: false,
    has_passed_tests: false,
    has_designated_owner: false,
    has_rollback_plan: false,
    has_formal_approval: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCheck = (key: keyof ReadinessChecklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) {
      setError("Todos os 6 critérios de prontidão devem ser atendidos antes da promoção para produção.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/agents/${agentId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          change_summary: changeSummary,
          readiness_checklist: checklist,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Falha na promoção para produção.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao promover o agente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Promoção para Produção — {agentName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Critérios inegociáveis de prontidão operacional (docs/07-agent-lifecycle.md).
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nova Versão Semântica *
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="Ex: 1.1.0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Versão Anterior
              </label>
              <input
                type="text"
                disabled
                value={currentVersion}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Resumo das Alterações (Changelog) *
            </label>
            <textarea
              required
              rows={2}
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="Ex: Integração validada com a API da Meta, novos parâmetros de CPL e aprovação da diretoria..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <span className="font-semibold text-foreground block">
              Checklist Obrigatório de Prontidão (Todos obrigatórios):
            </span>

            <div className="space-y-2">
              {[
                { key: "has_documentation", label: "Documentação técnica, fluxo e limites definidos" },
                { key: "has_validated_integrations", label: "Integrações externas e webhooks homologados" },
                { key: "has_passed_tests", label: "Bateria de testes em simulação aprovada sem falhas" },
                { key: "has_designated_owner", label: "Responsável técnico operacional designado" },
                { key: "has_rollback_plan", label: "Plano de contingência e reversão (rollback) documentado" },
                { key: "has_formal_approval", label: "Aprovação formal do administrador registrada" },
              ].map((item) => {
                const isChecked = checklist[item.key as keyof ReadinessChecklist];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleCheck(item.key as keyof ReadinessChecklist)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-border bg-background hover:bg-muted text-left transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={isChecked ? "font-medium text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !allChecked}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors ${
                allChecked
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Promover a Produção</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
