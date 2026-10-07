import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automatizi HUB — Plataforma Operacional B2B",
  description: "Central de controle multiempresa para operação de agentes de IA, tarefas, métricas e alertas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
