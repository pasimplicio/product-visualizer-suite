import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';
import type { GenerationInstance } from '@/lib/services/nanobanana';
import { cn } from '@/lib/utils';

interface InstanceCardProps {
  instance: GenerationInstance;
  onPromptChange: (id: string, prompt: string) => void;
  onGenerate: (id: string) => void;
}

export const InstanceCard: React.FC<InstanceCardProps> = ({ instance, onPromptChange, onGenerate }) => {
  const isIdle = instance.status === 'idle';
  const isSyncing = instance.status === 'syncing';
  const isGenerating = instance.status === 'generating';
  const isCompleted = instance.status === 'completed';
  const isError = instance.status === 'error';

  return (
    <Card className={cn(
      "group relative flex flex-col overflow-hidden border-muted/40 bg-card/50 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-primary/5",
      isGenerating && "border-primary/50 ring-1 ring-primary/20",
      isCompleted && "border-green-500/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-muted/20 px-4 py-3 bg-muted/10">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isIdle && "bg-slate-400",
            isSyncing && "bg-blue-400 animate-pulse",
            isGenerating && "bg-primary animate-pulse",
            isCompleted && "bg-green-500",
            isError && "bg-red-500"
          )} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {instance.name}
          </span>
        </div>
        
        <Badge variant={isCompleted ? "default" : "secondary"} className={cn(
          "text-[10px] h-5",
          isCompleted && "bg-green-500 hover:bg-green-600",
          isGenerating && "animate-pulse"
        )}>
          {instance.status.toUpperCase()}
        </Badge>
      </div>

      {/* Image Preview / Canvas */}
      <div className="relative aspect-[4/3] w-full bg-muted/30 overflow-hidden">
        {instance.resultImage ? (
          <img
            src={instance.resultImage}
            alt={instance.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center space-y-3 p-6">
            {isGenerating ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="w-full max-w-[150px] space-y-1">
                  <Progress value={instance.progress} className="h-1" />
                  <p className="text-[10px] text-center text-muted-foreground uppercase">{Math.round(instance.progress)}% gerando</p>
                </div>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-xs text-muted-foreground">Sincronizando imagem base...</p>
              </>
            ) : (
              <div className="opacity-20 flex flex-col items-center">
                <Send className="h-10 w-10 mb-2" />
                <p className="text-xs italic">Aguardando disparo</p>
              </div>
            )}
          </div>
        )}

        {/* Overlay status indication */}
        {isCompleted && (
          <div className="absolute top-2 right-2 rounded-full bg-green-500/90 p-1 text-white shadow-lg animate-in fade-in scale-in duration-300">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Editor / Actions */}
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase">Prompt da Visualização</label>
          <div className="flex space-x-2">
            <Input
              value={instance.defaultPrompt}
              onChange={(e) => onPromptChange(instance.id, e.target.value)}
              placeholder="Digite o prompt para este POV..."
              disabled={isGenerating || isSyncing}
              className="h-9 text-xs transition-all focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        <button
          onClick={() => onGenerate(instance.id)}
          disabled={isGenerating || isSyncing || isError}
          className={cn(
            "w-full flex items-center justify-center space-x-2 rounded-md h-9 text-xs font-semibold transition-all",
            isCompleted 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98]"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>GERANDO...</span>
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              <span>VISUALIZAÇÃO PRONTA</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              <span>DISPARAR INSTÂNCIA</span>
            </>
          )}
        </button>
      </div>

      {isError && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-500/90 text-white text-[10px] flex items-center justify-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>Erro na rede - Tentando reconectar...</span>
        </div>
      )}
    </Card>
  );
};
