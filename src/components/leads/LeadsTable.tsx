"use client";

import React, { useState } from "react";
import { Lead, LeadStatus } from "@/domain/types";
import { Clock, Calendar, Search, RefreshCw, UserCheck, Phone, Mail } from "lucide-react";

interface LeadsTableProps {
  leads: Lead[];
  onSplitLead: (lead: Lead) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function LeadsTable({ leads, onSplitLead, onRefresh, isLoading }: LeadsTableProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = leads.filter((lead) => {
    if (filterStatus !== "all" && lead.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.full_name.toLowerCase().includes(q);
      const matchPhone = lead.phone.includes(q);
      const matchEmail = lead.email ? lead.email.toLowerCase().includes(q) : false;
      if (!matchName && !matchPhone && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Barra de Filtros */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar lead por nome, tel ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="captado">Captados</option>
            <option value="contatado">Contatados (WhatsApp)</option>
            <option value="qualificado">Qualificados</option>
            <option value="reuniao_agendada">Reunião Agendada</option>
            <option value="distribuido">Distribuídos (CRM)</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
            title="Atualizar listagem"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold">
              <th className="py-3 px-4">Lead</th>
              <th className="py-3 px-4">Contato</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">1ª Resposta (SLA)</th>
              <th className="py-3 px-4">Closer (CRM)</th>
              <th className="py-3 px-4">Reunião</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Nenhum lead encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-100">{lead.full_name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {lead.campaign_name || "Campanha direta"}
                    </div>
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{lead.phone}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[160px]">{lead.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize bg-slate-800 text-slate-200 border border-slate-700">
                      {lead.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {lead.first_contact_response_time_seconds !== null &&
                    lead.first_contact_response_time_seconds !== undefined ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {lead.first_contact_response_time_seconds}s
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {lead.assigned_closer_name ? (
                      <span className="inline-flex items-center gap-1 text-blue-400 font-medium">
                        <UserCheck className="w-3 h-3" />
                        {lead.assigned_closer_name}
                      </span>
                    ) : (
                      <span className="text-slate-400">Pendente</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {lead.scheduled_meeting_at ? (
                      <span className="inline-flex items-center gap-1 text-slate-300 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(lead.scheduled_meeting_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSplitLead(lead)}
                      className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
                    >
                      {lead.status === "distribuido" ? "Reatribuir" : "Distribuir"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
