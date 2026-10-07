"use client";

import React, { useState } from "react";
import { CompanyOnboardingStep } from "@/domain/types";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface OnboardingChecklistWidgetProps {
  companyId: string;
  initialSteps: CompanyOnboardingStep[];
  initialProgress: number;
}

export const OnboardingChecklistWidget: React.FC<OnboardingChecklistWidgetProps> = ({
  companyId,
  initialSteps,
  initialProgress,
}) => {
  const [steps, setSteps] = useState<CompanyOnboardingStep[]>(initialSteps);
  const [progress, setProgress] = useState(initialProgress);
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);

  const handleToggle = async (stepId: string, currentStatus: boolean) => {
    setLoadingStepId(stepId);
    try {
      const res = await fetch(`/api/v1/companies/${companyId}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_id: stepId,
          is_completed: !currentStatus,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSteps((prev) =>
          prev.map((s) => (s.id === stepId ? json.data.step : s))
        );
        setProgress(json.data.progress);
      }
    } catch (err) {
      console.error("Falha ao atualizar etapa de onboarding:", err);
    } finally {
      setLoadingStepId(null);
    }
  };

  const completedCount = steps.filter((s) => s.is_completed).length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Checklist de Implantação & Onboarding</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Critérios para avanço da empresa até a operação assistida.
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-bold text-primary">{progress}%</span>
          <span className="text-[11px] text-muted-foreground block">
            {completedCount} de {steps.length} concluídos
          </span>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Lista de Passos */}
      <div className="space-y-2 pt-2">
        {steps.map((step) => {
          const isLoading = loadingStepId === step.id;

          return (
            <button
              key={step.id}
              onClick={() => handleToggle(step.id, step.is_completed)}
              disabled={isLoading}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                step.is_completed
                  ? "bg-muted/40 border-border/60 text-muted-foreground line-through"
                  : "bg-card border-border hover:border-primary/50 text-foreground"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            >
              <div className="mt-0.5 shrink-0 text-primary">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : step.is_completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/60" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <span className={`font-medium ${step.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {step.step_title}
                </span>
                {step.completed_at && (
                  <span className="block text-[10px] text-muted-foreground mt-0.5 font-mono">
                    Concluído em: {new Date(step.completed_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
