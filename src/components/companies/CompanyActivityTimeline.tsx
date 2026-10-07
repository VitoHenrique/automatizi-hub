import React from "react";
import { Activity } from "@/domain/types";
import { Activity as ActivityIcon, Clock } from "lucide-react";

interface CompanyActivityTimelineProps {
  activities: Activity[];
}

export const CompanyActivityTimeline: React.FC<CompanyActivityTimelineProps> = ({
  activities,
}) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-card">
        Nenhuma atividade recente registrada nesta empresa.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <ActivityIcon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Trilha de Atividades</h3>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border before:z-0">
        {activities.map((act) => (
          <div key={act.id} className="relative z-10 flex items-start gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-primary shrink-0 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div className="flex-1 bg-muted/30 p-3 rounded-lg border border-border/60">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{act.title}</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(act.created_at).toLocaleDateString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {act.description && (
                <p className="text-muted-foreground mt-1 leading-relaxed">{act.description}</p>
              )}
              <div className="mt-2 text-[10px] text-muted-foreground font-mono">
                Ator: <span className="font-medium text-foreground">{act.actor_name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
