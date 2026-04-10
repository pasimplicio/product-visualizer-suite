import React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, RefreshCw, Trash2, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { cn } from '@/lib/utils';
import { NanobananaService } from '@/lib/services/nanobanana';
import { toast } from 'sonner';

export const InstanceNode = ({ data, id }: NodeProps<WorkflowNodeData>) => {
  const isGenerating = data.status === 'generating';
  const isCompleted = data.status === 'completed';
  const canGenerate = data.image && !isGenerating;
  const currentStrength = data.strength ?? 0.85;
  const currentCfg = data.cfgScale ?? 7;

  const handleGenerate = async () => {
    if (!data.image || !data.onUpdate) return;

    data.onUpdate(id, { status: 'generating', progress: 0 });

    try {
      const result = await NanobananaService.generateImage(
        data.image,
        data.prompt || '',
        currentStrength,
        currentCfg,
        (progress) => {
          data.onUpdate!(id, { progress });
        }
      );

      data.onUpdate(id, { status: 'completed', resultImage: result, progress: 100 });
      toast.success(`POV Gerado com sucesso!`);
    } catch (err: any) {
      data.onUpdate(id, { status: 'error' });
      const errorMessage = err.message || "Erro desconhecido";
      toast.error(`Falha na instância ${data.label}`, {
        description: errorMessage
      });
    }
  };

  return (
    <>
      <NodeResizer minWidth={350} minHeight={450} isVisible={data.selected || false} />
      <Card className={cn(
        "w-[350px] border-2 bg-card/80 backdrop-blur-xl shadow-2xl p-0 transition-all flex flex-col",
        isGenerating ? "border-primary animate-pulse shadow-primary/20" : "border-border",
        isCompleted ? "border-green-500/50" : ""
      )}>
        {/* Handle de Entrada */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-primary border-4 border-background shadow-lg !-left-2 top-1/2"
        />

        <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">{data.label} (9:16)</span>
          </div>
          <div className="flex items-center space-x-2">
            {isCompleted && (
              <div className="flex items-center space-x-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-3 w-3" />
                <span>PRONTO</span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => data.onDelete?.(id)}
              className="h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="p-4 flex flex-col space-y-4">
          {/* Preview fixo no modelo 9:16 */}
          <div className="relative w-full aspect-[9/16] h-[360px] mx-auto rounded-lg overflow-hidden bg-muted/30 border border-border flex items-center justify-center">
            {data.resultImage ? (
              <img src={data.resultImage} alt="Resultado" className="w-full h-full object-cover" />
          ) : data.image ? (
            <div className="relative h-full w-full">
              <img src={data.image} alt="Referência" className="w-full h-full object-contain opacity-40 grayscale" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary bg-background/80 px-2 py-1 rounded">SINAL RECEBIDO</span>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-2 opacity-20">
              <RefreshCw className="h-8 w-8" />
              <span className="text-[10px] font-bold uppercase">Aguardando Conexão</span>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <Progress value={data.progress} className="h-1 w-full" />
              <span className="text-[10px] mt-2 font-bold uppercase">{Math.round(data.progress || 0)}% processando</span>
            </div>
          )}
        </div>

        {/* CONTROLES DE IA */}
        <div className="space-y-4 bg-muted/20 p-3 rounded-lg border border-border/50">
          {/* Slider de Strength (Criatividade) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Gauge className="h-3 w-3 text-orange-400" />
                Criatividade vs Fidelidade
              </label>
              <span className="text-[10px] font-mono font-bold text-primary">{Math.round(currentStrength * 100)}%</span>
            </div>
            <Slider
              value={[currentStrength]}
              min={0.1}
              max={1.0}
              step={0.05}
              onValueChange={(vals) => data.onUpdate?.(id, { strength: vals[0] })}
              disabled={isGenerating}
              className="py-1"
            />
            <div className="flex justify-between text-[8px] text-muted-foreground font-medium uppercase px-0.5">
              <span>Mais Fiel</span>
              <span>Mais Criativo</span>
            </div>
          </div>

          {/* Slider de CFG Scale (Obediência ao Prompt) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-purple-400" />
                Obediência ao Prompt
              </label>
              <span className="text-[10px] font-mono font-bold text-primary">Nível {currentCfg}</span>
            </div>
            <Slider
              value={[currentCfg]}
              min={1}
              max={10}
              step={1}
              onValueChange={(vals) => data.onUpdate?.(id, { cfgScale: vals[0] })}
              disabled={isGenerating}
              className="py-1"
            />
            <div className="flex justify-between text-[8px] text-muted-foreground font-medium uppercase px-0.5">
              <span>Solto</span>
              <span>Rigoroso</span>
            </div>
          </div>

          {/* Editor de Prompt */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configuração POV</label>
            <Textarea 
              value={data.prompt}
              onChange={(e) => data.onUpdate?.(id, { prompt: e.target.value })}
              placeholder="Descreva o cenário detalhadamente..."
              className="min-h-[80px] text-xs bg-muted/50 border-border resize-none"
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            disabled={!canGenerate}
            onClick={handleGenerate}
            className={cn(
              "flex-1 h-9 text-xs font-bold uppercase shadow-lg transition-all",
              canGenerate ? "bg-primary text-primary-foreground hover:scale-[1.02]" : "bg-muted text-muted-foreground"
            )}
          >
            {isCompleted ? "GERAR NOVAMENTE" : isGenerating ? "GERANDO..." : "DISPARAR ACTION"}
          </Button>

          {isCompleted && data.resultImage && (
            <Button 
              variant="outline"
              className="h-9 px-3 border-border hover:bg-muted"
              onClick={async () => {
                const imgUrl = data.resultImage as string;
                try {
                  const response = await fetch(imgUrl);
                  const blob = await response.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = `ai-render-pov-${id}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(blobUrl);
                } catch (error) {
                  // Fallback para caso de imagens externas com restrição de CORS
                  const link = document.createElement('a');
                  link.href = imgUrl;
                  link.download = `ai-render-pov-${id}.png`;
                  link.target = '_blank';
                  link.click();
                }
              }}
              title="Baixar Rendering"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </Button>
          )}
        </div>
      </div>

      </Card>
    </>
  );
};
