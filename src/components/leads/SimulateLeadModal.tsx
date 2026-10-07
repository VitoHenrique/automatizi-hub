"use client";

import React, { useState } from "react";
import { X, Send, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface SimulateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
}

export function SimulateLeadModal({ isOpen, onClose, onSuccess, companyId }: SimulateLeadModalProps) {
  const [fullName, setFullName] = useState("Rafael Bittencourt");
  const [phone, setPhone] = useState("+55 11 98765-4321");
  const [email, setEmail] = useState("rafael@inovavarejo.com.br");
  const [budget, setBudget] = useState("R$ 65.000/mês");
  const [campaign, setCampaign] = useState("DBX - Aquisição B2B - High Intent");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const eventId = `sim-lead-${Date.now()}`;
      const res = await fetch(`/api/v1/integrations/webhooks/meta-ads?company_id=${companyId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=mocked_signature_valid",
        },
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    leadgen_id: eventId,
                    form_id: "form-meta-dbx-high-intent",
                    campaign_name: campaign,
                    field_data: [
                      { name: "full_name", values: [fullName] },
                      { name: "phone_number", values: [phone] },
                      { name: "email", values: [email] },
                      { name: "budget", values: [budget] },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Falha ao simular lead");
      }

      setResult(json.data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Simulação de Lead (Piloto DBX)</h3>
              <p className="text-xs text-slate-400">
                Dispara webhook simulado da Meta Ads e testa o pipeline dos 3 agentes em tempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSimulate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Prospect</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp (E.164)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">E-mail Corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Orçamento / Faturamento</label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Campanha Meta Ads</label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {result && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lead processado com sucesso pelo pipeline ponta a ponta!</span>
              </div>
              <ul className="text-slate-300 space-y-1 pl-6 list-disc text-[11px]">
                <li>Lead criado com ID: <span className="font-mono text-slate-400">{result.lead?.id}</span></li>
                <li>SDR WhatsApp acionado em <strong className="text-emerald-400">{result.lead?.first_contact_response_time_seconds}s</strong> (&lt; 60s SLA)</li>
                <li>Closer atribuído no CRM DBX: <strong className="text-blue-400">{result.closer_assigned || "Distribuído"}</strong></li>
                <li>Reunião agendada via Google Calendar: {result.meeting_scheduled ? "Sim (Google Meet gerado)" : "Em qualificação"}</li>
                <li>Gestor de Tráfego: Execução de retroalimentação registrada no hub.</li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 rounded-lg transition shadow-md"
            >
              {loading ? (
                <>Processando pipeline...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Disparar Webhook de Teste
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
