"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Bot } from "lucide-react";
import { CreateAgentInput } from "@/domain/types";

interface AgentFormModalProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AgentFormModal: React.FC<AgentFormModalProps> = ({
  companyId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateAgentInput>({
    company_id: companyId,
    name: "",
    slug: "",
    role_description: "",
    problem_solved: "",
    kind: "agent",
    accessed_systems: [],
    flow_summary: "",
    operational_limits: "",
    human_intervention_rules: "",
    risks: "",
    is_demo: false,
  });

  const [systemsInput, setSystemsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name,
      slug: generatedSlug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const systems = systemsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/v1/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          company_id: companyId,
          accessed_systems: systems,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Falha ao cadastrar agente");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao salvar agente.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Novo Agente de IA</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Definição de missão, problema resolvido e limites operacionais.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Nome do Agente *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: SDR de Resposta Imediata, Qualificador..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Tipo</label>
              <select
                value={formData.kind}
                onChange={(e) => setFormData({ ...formData, kind: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="agent">Agente Operacional</option>
                <option value="foundation">Fundação</option>
                <option value="transversal">Transversal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Missão do Agente *</label>
            <textarea
              required
              rows={2}
              value={formData.role_description}
              onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
              placeholder="Descreva o propósito operacional do agente..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Problema Resolvido</label>
            <input
              type="text"
              value={formData.problem_solved || ""}
              onChange={(e) => setFormData({ ...formData, problem_solved: e.target.value })}
              placeholder="Qual dor do negócio este agente elimina?"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Sistemas Acessados (separados por vírgula)
            </label>
            <input
              type="text"
              value={systemsInput}
              onChange={(e) => setSystemsInput(e.target.value)}
              placeholder="Ex: WhatsApp, Meta Ads, CRM DBX"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Limites Operacionais</label>
            <input
              type="text"
              value={formData.operational_limits || ""}
              onChange={(e) => setFormData({ ...formData, operational_limits: e.target.value })}
              placeholder="Ex: Não fecha contratos acima de R$ 10.000 sem aprovação humana."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
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
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Criar Agente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
