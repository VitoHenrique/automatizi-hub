import React from "react";
import { Agent } from "@/domain/types";
import {
  LogIn,
  HelpCircle,
  PlayCircle,
  LogOut,
  ShieldAlert,
  Sliders,
  AlertTriangle,
} from "lucide-react";

interface AgentFlowDiagramProps {
  agent: Agent;
}

export const AgentFlowDiagram: React.FC<AgentFlowDiagramProps> = ({ agent }) => {
  return (
    <div className="space-y-6">
      {/* Resumo do Fluxo */}
      {agent.flow_summary && (
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="font-semibold text-xs text-muted-foreground uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            Visão Geral do Fluxo Operacional
          </span>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/60">
            {agent.flow_summary}
          </p>
        </div>
      )}

      {/* Grid de Blocos do Ciclo de Decisão (Entradas -> Decisões -> Ações -> Saídas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Entradas */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b border-border pb-2">
            <LogIn className="w-4 h-4 text-blue-600" />
            <span>1. Entradas (Inputs)</span>
          </div>
          <div className="space-y-2 text-xs">
            {agent.inputs_definition && agent.inputs_definition.length > 0 ? (
              agent.inputs_definition.map((inp, idx) => (
                <div key={idx} className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  <span className="font-mono font-semibold text-foreground block">
                    {String(inp.name || `Input ${idx + 1}`)}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {String(inp.desc || inp.type || "")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs italic">Nenhuma entrada formalizada.</p>
            )}
          </div>
        </div>

        {/* 2. Decisões */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b border-border pb-2">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>2. Decisões & Regras</span>
          </div>
          <div className="space-y-2 text-xs">
            {agent.decisions_definition && agent.decisions_definition.length > 0 ? (
              agent.decisions_definition.map((dec, idx) => (
                <div key={idx} className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  <span className="text-foreground leading-relaxed">
                    {String(dec.rule || `Regra ${idx + 1}`)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs italic">Nenhuma regra formalizada.</p>
            )}
          </div>
        </div>

        {/* 3. Ações */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b border-border pb-2">
            <PlayCircle className="w-4 h-4 text-emerald-600" />
            <span>3. Ações Executadas</span>
          </div>
          <div className="space-y-2 text-xs">
            {agent.actions_definition && agent.actions_definition.length > 0 ? (
              agent.actions_definition.map((act, idx) => (
                <div key={idx} className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  <span className="text-foreground leading-relaxed">
                    {String(act.action || `Ação ${idx + 1}`)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs italic">Nenhuma ação formalizada.</p>
            )}
          </div>
        </div>

        {/* 4. Saídas */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b border-border pb-2">
            <LogOut className="w-4 h-4 text-purple-600" />
            <span>4. Saídas (Outputs)</span>
          </div>
          <div className="space-y-2 text-xs">
            {agent.outputs_definition && agent.outputs_definition.length > 0 ? (
              agent.outputs_definition.map((out, idx) => (
                <div key={idx} className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  <span className="font-mono font-semibold text-foreground block">
                    {String(out.name || `Output ${idx + 1}`)}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {String(out.desc || "")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs italic">Nenhuma saída formalizada.</p>
            )}
          </div>
        </div>
      </div>

      {/* Limites Operacionais e Intervenção Humana (docs/00-product-vision.md) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agent.operational_limits && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase font-mono">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Limites Operacionais do Agente</span>
            </div>
            <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border/60 leading-relaxed">
              {agent.operational_limits}
            </p>
          </div>
        )}

        {agent.human_intervention_rules && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase font-mono">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span>Gatilhos de Intervenção Humana</span>
            </div>
            <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border/60 leading-relaxed">
              {agent.human_intervention_rules}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
