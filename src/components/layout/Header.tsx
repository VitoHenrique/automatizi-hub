"use client";

import React from "react";
import { Building2, Shield, User, Menu } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  organizationName?: string;
  userRole?: string;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  organizationName = "Automatizi Headquarters",
  userRole = "Administrador",
  userName = "Vito",
}) => {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Contexto do Tenant / Organização Ativa */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-sm">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[180px] sm:max-w-xs">
            {organizationName}
          </span>
          <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold bg-primary/10 text-primary rounded border border-primary/20">
            Tenant
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Identificação do Usuário e Papel */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 border border-border">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-tight">{userName}</span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Shield className="w-3 h-3 text-primary" />
              <span>{userRole}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
