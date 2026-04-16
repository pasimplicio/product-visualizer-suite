import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Indicador de status da API Gemini.
 * Mostra se a API Key está configurada.
 */
export const GeminiStatus = () => {
  const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="flex items-center space-x-2 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full backdrop-blur-md">
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gemini</span>
      {hasKey ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
      )}
    </div>
  );
};
