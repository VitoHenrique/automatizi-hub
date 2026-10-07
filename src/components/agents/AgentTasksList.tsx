"use client";

import React, { useState } from "react";
import { Task, TaskStatus, TaskPriority, TaskKind } from "@/domain/types";
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Milestone,
  HelpCircle,
  Loader2,
} from "lucide-react";

interface AgentTasksListProps {
  agentId: string;
  initialTasks: Task[];
}

const KIND_CONFIG: Record<TaskKind, { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string }> = {
  milestone: {
    label: "Marco",
    icon: Milestone,
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-700 dark:text-purple-300",
  },
  blocker: {
    label: "Bloqueio",
    icon: AlertOctagon,
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-300",
  },
  decision: {
    label: "Decisão",
    icon: HelpCircle,
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
  },
  task: {
    label: "Tarefa",
    icon: ListTodo,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
  },
};

const PRIORITY_BADGES: Record<TaskPriority, { label: string; text: string; bg: string }> = {
  low: { label: "Baixa", text: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
  medium: { label: "Média", text: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40" },
  high: { label: "Alta", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40" },
  urgent: { label: "Urgente", text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950/40" },
};

export const AgentTasksList: React.FC<AgentTasksListProps> = ({
  agentId,
  initialTasks,
}) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<TaskKind>("task");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? json.data : t)));
      }
    } catch (err) {
      console.error("Falha ao atualizar tarefa:", err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          kind: newKind,
          priority: newPriority,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setTasks((prev) => [json.data, ...prev]);
        setNewTitle("");
        setIsAdding(false);
      }
    } catch (err) {
      console.error("Falha ao criar tarefa:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Tarefas e Entregas do Agente</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhamento de marcos, bloqueios operacionais e decisões técnicas.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Formulário Rápido de Criação */}
      {isAdding && (
        <form onSubmit={handleCreateTask} className="p-4 bg-muted/40 rounded-xl border border-border space-y-3 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Título da Tarefa *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Ajustar threshold de confiança do classificador..."
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Tipo</label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as TaskKind)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="task">Tarefa</option>
                <option value="milestone">Marco</option>
                <option value="blocker">Bloqueio</option>
                <option value="decision">Decisão</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Prioridade</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-lg border border-border hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar Tarefa"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Tarefas */}
      {tasks.length === 0 ? (
        <p className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
          Nenhuma tarefa cadastrada para este agente.
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const kindMeta = KIND_CONFIG[task.kind] || KIND_CONFIG.task;
            const KindIcon = kindMeta.icon;
            const prioMeta = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;

            return (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-border/60 ${kindMeta.bg} ${kindMeta.text}`}>
                    <KindIcon className="w-3 h-3" />
                    <span>{kindMeta.label}</span>
                  </span>

                  <span className={`font-medium text-foreground truncate ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${prioMeta.bg} ${prioMeta.text}`}>
                    {prioMeta.label}
                  </span>

                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="px-2 py-1 rounded border border-border bg-background text-[11px] font-medium text-foreground focus-visible:outline-none"
                  >
                    <option value="todo">A Fazer</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="done">Concluída</option>
                    <option value="blocked">Bloqueada</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
