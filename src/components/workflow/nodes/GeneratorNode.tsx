import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Sparkles, Loader2, CheckCircle2, Play, GripVertical,
  Download, Maximize2, RotateCcw, Video, ImageIcon, Trash2
} from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GEMINI_MODELS, getGeminiModel } from '@/lib/services/gemini-models';
import { useAuth, CREDIT_COSTS, CreditOperation } from '@/context/auth-context';
import { GeminiService } from '@/lib/services/gemini-service';
import { toast } from 'sonner';

export const GeneratorNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const { consumeCredits, canAfford } = useAuth();
  const isGenerating = data.status === 'generating';
  const isCompleted = data.status === 'completed';
  const modelInfo = getGeminiModel(data.modelId as string) || GEMINI_MODELS[0];
  const isVideo = modelInfo?.type === 'video';
  const hasResult = isVideo ? !!data.resultVideo : !!data.resultImage;
  const canGenerate = !isGenerating && (data.image || data.prompt);

  const updateNodeState = useCallback((updates: Partial<WorkflowNodeData>) => {
    window.dispatchEvent(
      new CustomEvent('workflow-node-update', {
        detail: { id, updates },
      })
    );
    if (data.onUpdate) {
      data.onUpdate(id, updates);
    }
  }, [id, data.onUpdate]);

  const handleRun = async () => {
    // Agora não bloqueamos mais se data.onUpdate for undefined
    if (!canGenerate) return;

    // Determinar a operação para créditos
    let operation: CreditOperation;
    if (isVideo) {
      operation = data.image ? 'image-to-video' : 'text-to-video';
      if (modelInfo?.creditCost >= 50) operation = data.image ? 'image-to-video-pro' : 'text-to-video-pro';
      else if (modelInfo?.creditCost >= 30) operation = data.image ? 'image-to-video-hd' : 'text-to-video-hd';
    } else {
      operation = data.image ? 'image-to-image' : 'text-to-image';
    }

    // Verificar créditos
    if (!canAfford(operation)) {
      toast.error('Créditos insuficientes', {
        description: `Esta operação custa ${CREDIT_COSTS[operation]} créditos.`,
      });
      return;
    }

    updateNodeState({
      status: 'generating',
      progress: 5,
      resultImage: undefined,
      resultVideo: undefined,
    });

    try {
      // Consumir créditos
      const consumed = await consumeCredits(operation);
      if (!consumed && CREDIT_COSTS[operation] > 0) {
        throw new Error('Falha ao consumir créditos');
      }

      updateNodeState({ progress: 15 });

      if (isVideo) {
        // ─── GERAÇÃO DE VÍDEO (Veo 3.1) ───
        const initResult = await GeminiService.generateVideo({
          prompt: data.prompt || 'Cinematic product showcase, professional lighting, smooth camera movement',
          modelId: modelInfo.id,
          referenceImage: data.image || undefined,
          aspectRatio: data.aspectRatio || '16:9',
          resolution: data.resolution || '720p',
        });

        if (initResult.success && initResult.data?.operationName) {
          updateNodeState({ progress: 25 });

          // Polling para resultado do vídeo
          const videoResult = await GeminiService.pollVideoResult(
            initResult.data.operationName,
            (p) => updateNodeState({ progress: p })
          );

          if (videoResult.success && videoResult.data?.videoUrl) {
            updateNodeState({
              status: 'completed',
              resultVideo: videoResult.data.videoUrl,
              progress: 100,
            });
            toast.success('Vídeo gerado com sucesso!');
          } else {
            throw new Error(videoResult.error || 'Falha na geração de vídeo');
          }
        } else {
          throw new Error(initResult.error || 'Falha ao iniciar geração de vídeo');
        }
      } else {
        // ─── GERAÇÃO DE IMAGEM (Nano Banana) ───
        updateNodeState({ progress: 30 });

        const result = await GeminiService.generateImage({
          prompt: data.prompt || 'Professional product photo, studio lighting, high quality',
          modelId: modelInfo.id,
          referenceImage: data.image || undefined,
          aspectRatio: data.aspectRatio || '1:1',
        });

        if (result.success && result.data?.imageUrl) {
          updateNodeState({
            status: 'completed',
            resultImage: result.data.imageUrl,
            progress: 100,
          });
          toast.success('Imagem gerada com sucesso!');
        } else {
          throw new Error(result.error || 'Falha na geração de imagem');
        }
      }
    } catch (err: any) {
      updateNodeState({ status: 'error' });
      toast.error('Falha na geração', { description: err.message });
    }
  };

  const handleDownload = async () => {
    const url = isVideo ? data.resultVideo : data.resultImage;
    if (!url) return;
    const ext = isVideo ? 'mp4' : 'png';
    const defaultFilename = `productsuite-${id}.${ext}`;
    
    try {
      // 1. Tentar forçar a janela "Salvar como..." usando File System Access API
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: isVideo 
            ? [{ description: 'Vídeo Produto', accept: { 'video/mp4': ['.mp4'] } }]
            : [{ description: 'Imagem Produto', accept: { 'image/png': ['.png'] } }],
        });
        
        const response = await fetch(url as string);
        const blob = await response.blob();
        
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return; // Sucesso, usuário escolheu onde salvar!
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // Usuário cancelou a janela
      console.warn('File System API error, falling back to standard download', err);
    }

    // 2. Fallback: Download padrão do navegador (pasta Downloads)
    try {
      const link = document.createElement('a');
      link.href = url as string;
      link.download = defaultFilename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url as string, '_blank');
    }
  };

  return (
    <div
      className={`w-[380px] rounded-xl border transition-all duration-300 shadow-2xl ${
        isGenerating
          ? 'border-violet-500/50 ring-1 ring-violet-500/20 animate-pulse'
          : isCompleted
          ? 'border-emerald-500/40 shadow-emerald-500/10'
          : selected
          ? 'border-violet-500/50 ring-1 ring-violet-500/20'
          : 'border-border hover:border-border-foreground/20'
      } bg-card/80 backdrop-blur-xl`}
    >
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="prompt-in"
        style={{ top: '20%' }}
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{ top: '50%' }}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header with toolbar */}
      <div className="relative">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 rounded-t-xl bg-primary/[0.03]">
          <div className="flex items-center gap-2">
            <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
            <div className="flex items-center gap-1.5">
              {isVideo ? (
                <Video className="w-4 h-4 text-cyan-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-violet-400" />
              )}
              <span className="text-[11px] font-bold text-foreground/80">{data.label || modelInfo.name}</span>
            </div>
            {modelInfo && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground">
                {modelInfo.icon} {modelInfo.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isCompleted && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>PRONTO</span>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input labels */}
        <div className="px-3 py-1.5 border-b border-white/5 flex gap-4 text-[9px]">
          <div className="flex items-center gap-1 text-blue-400/60">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Prompt</span>
          </div>
          <div className="flex items-center gap-1 text-orange-400/60">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>Reference Image</span>
          </div>
          <div className="flex items-center gap-1 text-violet-400/60 ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span>Output</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-3">
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-background/50 border border-input flex items-center justify-center group/preview">
          {data.resultVideo && isVideo ? (
            <video id={`preview-${id}`} src={data.resultVideo} controls playsInline className="w-full h-full object-cover" />
          ) : data.resultImage && !isVideo ? (
            <img id={`preview-${id}`} src={data.resultImage} alt="Resultado" className="w-full h-full object-cover" />
          ) : data.image ? (
            <div className="relative w-full h-full">
              <img src={data.image} alt="Referência" className="w-full h-full object-contain opacity-40 grayscale" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-muted-foreground bg-background/60 px-2 py-1 rounded">
                  REFERÊNCIA RECEBIDA
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
              <ImageIcon className="w-10 h-10" />
              <span className="text-[10px] font-medium">Aguardando entrada</span>
            </div>
          )}

          {/* Loading overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="w-3/4 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300"
                  style={{ width: `${data.progress || 0}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">
                {Math.round(data.progress || 0)}% processando...
              </span>
            </div>
          )}

          {/* Result toolbar */}
          {isCompleted && hasResult && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="w-7 h-7 rounded-md bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all border border-border/50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const el = document.getElementById(`preview-${id}`);
                  if (el) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    } else {
                      el.requestFullscreen().catch(() => toast.error('Seu navegador bloqueou o modo tela cheia.'));
                    }
                  }
                }}
                className="w-7 h-7 rounded-md bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all border border-border/50"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Run button */}
      <div className="px-3 pb-3">
        <button
          disabled={!canGenerate}
          onClick={(e) => {
            e.stopPropagation();
            handleRun();
          }}
          className={`w-full h-9 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            isGenerating
              ? 'bg-primary/20 text-primary cursor-wait'
              : canGenerate
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20'
              : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Gerando...
            </>
          ) : isCompleted ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              GERAR NOVAMENTE
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              EXECUTAR
            </>
          )}
        </button>
        {/* Custo oculto em Standby */}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="result-out"
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
