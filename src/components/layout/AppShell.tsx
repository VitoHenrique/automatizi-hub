"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Breadcrumbs, BreadcrumbItem } from "./Breadcrumbs";

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  organizationName?: string;
  userRole?: string;
  userName?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  breadcrumbs = [{ label: "Visão Geral", href: "/" }],
  organizationName,
  userRole,
  userName,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar de navegação */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          organizationName={organizationName}
          userRole={userRole}
          userName={userName}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {breadcrumbs.length > 0 && (
            <div className="pb-1">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
