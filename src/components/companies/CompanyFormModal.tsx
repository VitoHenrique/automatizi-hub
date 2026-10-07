"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Building2 } from "lucide-react";
import { CreateCompanyInput } from "@/domain/types";

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: "",
    slug: "",
    sector: "Tecnologia",
    contracted_scope: "",
    objectives: "",
    primary_contact_name: "",
    primary_contact_email: "",
    connected_systems: [],
    next_action: "Iniciar diagnóstico e mapeamento de processos",
    is_demo: false,
  });

  const [systemsInput, setSystemsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-gerar slug a partir do nome
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
      const res = await fetch("/api/v1/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          connected_systems: systems,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Falha ao cadastrar empresa");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro inesperado ao salvar a empresa.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
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
      aria-labelledby="modal-company-title"
    >
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Fechar formulário"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 id="modal-company-title" className="text-base font-bold text-foreground">
              Cadastrar Nova Empresa Cliente
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inicialização multiempresa e geração automática de checklist de onboarding.
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
            <label className="font-semibold text-foreground block mb-1">
              Nome da Empresa *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: DBX Global, FinTech Brasil..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Identificador (Slug) *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Setor de Atuação *
              </label>
              <input
                type="text"
                required
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                placeholder="Ex: Saúde, Varejo, Tech..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Objetivos da Automação
            </label>
            <textarea
              rows={2}
              value={formData.objectives || ""}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              placeholder="Ex: Aumentar captação de leads qualificados e agilizar agendamentos..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Sistemas Conectados (separados por vírgula)
            </label>
            <input
              type="text"
              value={systemsInput}
              onChange={(e) => setSystemsInput(e.target.value)}
              placeholder="Ex: Meta Ads, CRM Próprio, WhatsApp, Slack"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nome do Contato Principal
              </label>
              <input
                type="text"
                value={formData.primary_contact_name || ""}
                onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                placeholder="Ex: Ana Souza"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">
                E-mail do Contato
              </label>
              <input
                type="email"
                value={formData.primary_contact_email || ""}
                onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                placeholder="contato@empresa.com"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
              />
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
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Criar Empresa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
