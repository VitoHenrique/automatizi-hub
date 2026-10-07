import React from "react";
import { ShieldAlert } from "lucide-react";

interface ForbiddenStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export const ForbiddenState: React.FC<ForbiddenStateProps> = ({
  title = "Acesso Não Autorizado",
  message = "Seu usuário ou nível de permissão (role/escopo) não possui autorização para visualizar este recurso.",
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-amber-700 dark:text-amber-300 max-w-md leading-relaxed">
        {message}
      </p>
    </div>
  );
};
