"use client";

import React from "react";
import { Lead, LeadStatus } from "@/domain/types";
import { Clock, CheckCircle2, Calendar, UserCheck, PhoneCall, Sparkles } from "lucide-react";

interface LeadsPipelineProps {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
  onSplitLead?: (lead: Lead) => void;
}

const COLUMNS: Array<{ status: LeadStatus[]; title: string; desc: string; icon: any }> = [
  {
    status: ["captado"],
    title: "1. Captados",
    desc: "Webhook Meta Ads",
    icon: Sparkles,
  },
  {
    status: ["contatado"],
    title: "2. Contatados",
    desc: "WhatsApp SDR (< 60s)",
    icon: PhoneCall,
  },
  {
    status: ["qualificado", "reuniao_agendada"],
    title: "3. Qualificados / Agenda",
    desc: "BANT & Google Meet",
    icon: Calendar,
  },
  {
    status: ["distribuido"],
    title: "4. Distribuídos",
    desc: "CRM DBX / Closers",
    icon: UserCheck,
  },
];

export function LeadsPipeline({ leads, onSelectLead, onSplitLead }: LeadsPipelineProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => col.status.includes(l.status));
        const Icon = col.icon;

        return (
          <div
            key={col.title}
            className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
          >
            {/* Header da Coluna */}
            <div className="p-3.5 bg-slate-800/40 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{col.title}</h4>
                  <p className="text-xs text-slate-400">{col.desc}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {columnLeads.length}
              </span>
            </div>

            {/* Lista de Cards */}
            <div className="p-3 flex-1 flex flex-col gap-3 min-h-[360px] overflow-y-auto max-h-[640px]">
              {columnLeads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-800/80 rounded-lg">
                  <p className="text-xs text-slate-400 font-medium">Nenhum lead nesta etapa</p>
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead?.(lead)}
                    className="p-3.5 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-lg shadow transition cursor-pointer group flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition truncate">
                        {lead.full_name}
                      </h5>
                      {lead.qualification_score && (
                        <span className="shrink-0 px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {lead.qualification_score}/10
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p className="truncate">{lead.phone}</p>
                      {lead.campaign_name && (
                        <p className="text-[11px] text-slate-400 truncate">{lead.campaign_name}</p>
                      )}
                    </div>

                    {/* SLA de 1ª Resposta */}
                    {lead.first_contact_response_time_seconds !== null &&
                      lead.first_contact_response_time_seconds !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Resposta: {lead.first_contact_response_time_seconds}s (SLA OK)</span>
                        </div>
                      )}

                    {/* Reunião Agendada */}
                    {lead.scheduled_meeting_at && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-950/20 px-2 py-1 rounded border border-blue-900/30">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="truncate">
                          Meet: {new Date(lead.scheduled_meeting_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}

                    {/* Closer Atribuído */}
                    {lead.assigned_closer_name && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                        <span className="text-slate-400">Closer:</span>
                        <span className="text-slate-200 font-medium truncate max-w-[140px]">
                          {lead.assigned_closer_name}
                        </span>
                      </div>
                    )}

                    {/* Botão de Split Manual se ainda não distribuído */}
                    {lead.status !== "distribuido" && onSplitLead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSplitLead(lead);
                        }}
                        className="mt-1 w-full text-xs font-medium py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
                      >
                        Distribuir no CRM
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
