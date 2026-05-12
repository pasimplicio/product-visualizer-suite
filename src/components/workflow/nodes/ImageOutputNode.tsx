import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ImageIcon, Loader2, CheckCircle2, Play, RotateCcw, Trash2, GripVertical, Download } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GeminiService } from '@/lib/services/gemini-service';
import { HuggingFaceService } from '@/lib/services/huggingface-service';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const MODELS = [
  { id: 'flux-schnell',    label: 'FLUX Schnell — Grátis', badge: '🆓' },
  { id: 'flux-dev',        label: 'FLUX Dev — Grátis',     badge: '🆓' },
  { id: 'nano-banana-2',   label: 'Nano Banana 2',          badge: '⚡' },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro',         badge: '★'  },
];

export const ImageOutputNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const { addLibraryItem } = useLibrary();
  const isGenerating = data.status === 'generating';
  const isCompleted  = data.status === 'completed';
  const canRun = !isGenerating && !!(data.image || data.prompt);

  const update = useCallback((updates: Partial<WorkflowNodeData>) => {
    window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
    data.onUpdate?.(id, updates);
  }, [id, data.onUpdate]);

  const handleRun = async () => {
    if (!canRun) return;
    update({ status: 'generating', progress: 5, resultImage: undefined });
    try {
      const modelId = (data.modelId as string) || 'flux-schnell';
      const prompt   = (data.prompt as string) || 'Professional product photo, studio lighting, high quality';

      let imageUrl: string;
      if (modelId.startsWith('flux-')) {
        const result = await HuggingFaceService.generateImage({ prompt, modelId });
        if (!result.success || !result.data?.imageUrl) throw new Error(result.error);
        imageUrl = result.data.imageUrl;
      } else {
        const result = await GeminiService.generateImage({
          prompt, modelId,
          referenceImage: (data.image as string) || undefined,
          aspectRatio: (data.aspectRatio as string) || '1:1',
        });
        if (!result.success || !result.data?.imageUrl) throw new Error(result.error);
        imageUrl = result.data.imageUrl;
      }

      update({ status: 'completed', resultImage: imageUrl, progress: 100 });
      addLibraryItem(imageUrl, 'image', data.prompt as string);
      toast.success('Imagem gerada!');
    } catch (err: any) {
      update({ status: 'error', progress: 0 });
      toast.error('Erro ao gerar imagem', { description: err.message });
    }
  };

  const handleDownload = () => {
    if (!data.resultImage) return;
    const a = document.createElement('a');
    a.href = data.resultImage as string;
    a.download = `imagem-${id}.png`;
    a.click();
  };

  return (
    <div className={`w-[260px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
      isGenerating ? 'border-violet-500/50 ring-1 ring-violet-500/20'
      : isCompleted ? 'border-emerald-500/40'
      : selected  ? 'border-violet-500/50 ring-1 ring-violet-500/20'
      : 'border-border hover:border-border/60'
    }`}>
      <Handle type="target" position={Position.Left} id="image-in"
        style={{ top: '35%' }}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-[3px] !border-background !shadow-lg !-left-[7px]" />
      <Handle type="target" position={Position.Left} id="prompt-in"
        style={{ top: '60%' }}
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-[3px] !border-background !shadow-lg !-left-[7px]" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-violet-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
          <ImageIcon className="w-3 h-3 text-violet-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Saída de Imagem
        </span>
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {/* Model + Aspect Ratio */}
        <div className="flex gap-2">
          <select value={(data.modelId as string) || 'nano-banana-2'}
            onChange={(e) => { e.stopPropagation(); update({ modelId: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 h-7 bg-background border border-input rounded-lg px-2 text-[10px] text-foreground focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer">
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.badge} {m.label}</option>)}
          </select>
          <select value={(data.aspectRatio as string) || '1:1'}
            onChange={(e) => { e.stopPropagation(); update({ aspectRatio: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="w-[68px] h-7 bg-background border border-input rounded-lg px-2 text-[10px] text-foreground focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer">
            {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Input indicators */}
        <div className="flex gap-2 text-[9px]">
          <span className={`flex items-center gap-1 ${data.image ? 'text-orange-400' : 'text-muted-foreground/40'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
            Imagem
          </span>
          <span className={`flex items-center gap-1 ${data.prompt ? 'text-blue-400' : 'text-muted-foreground/40'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
            Prompt
          </span>
        </div>

        {/* Result or loading */}
        {(data.resultImage || isGenerating) && (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-background/50 border border-input">
            {data.resultImage && (
              <img src={data.resultImage as string} alt="Resultado" className="w-full h-full object-contain" />
            )}
            {isGenerating && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                <div className="w-3/4 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${data.progress || 0}%` }} />
                </div>
              </div>
            )}
            {isCompleted && data.resultImage && (
              <button onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all border border-border/50">
                <Download className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Run button */}
        <button disabled={!canRun}
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          className={`w-full h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            isGenerating ? 'bg-violet-500/20 text-violet-400 cursor-wait'
            : canRun ? 'bg-violet-500 text-white hover:bg-violet-400 active:scale-[0.98] shadow-lg shadow-violet-500/20'
            : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}>
          {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</>
           : isCompleted  ? <><RotateCcw className="w-3 h-3" /> Gerar Novamente</>
           :                <><Play className="w-3 h-3" /> Gerar Imagem</>}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="result-out"
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-background !shadow-lg !-right-[7px]" />
    </div>
  );
};
