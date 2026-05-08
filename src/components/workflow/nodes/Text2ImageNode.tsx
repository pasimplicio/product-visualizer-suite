import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  ImageIcon, Loader2, CheckCircle2, Play,
  RotateCcw, Trash2, Download, GripVertical,
} from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GEMINI_MODELS, getGeminiModel } from '@/lib/services/gemini-models';
import { GeminiService } from '@/lib/services/gemini-service';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

const IMAGE_MODELS = GEMINI_MODELS.filter((m) => m.type === 'image');
const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];

export const Text2ImageNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const { addLibraryItem } = useLibrary();
  const isGenerating = data.status === 'generating';
  const isCompleted = data.status === 'completed';
  const modelInfo = getGeminiModel(data.modelId as string) ?? IMAGE_MODELS[0];
  const canRun = !isGenerating && !!data.prompt;

  const update = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
      data.onUpdate?.(id, updates);
    },
    [id, data.onUpdate]
  );

  const handleRun = async () => {
    if (!canRun) return;
    update({ status: 'generating', progress: 10, resultImage: undefined });
    try {
      const result = await GeminiService.generateImage({
        prompt: data.prompt as string,
        modelId: modelInfo.id,
        aspectRatio: (data.aspectRatio as string) || '1:1',
      });
      if (!result.success || !result.data?.imageUrl) throw new Error(result.error);
      update({ status: 'completed', resultImage: result.data.imageUrl, progress: 100 });
      addLibraryItem(result.data.imageUrl, 'image', data.prompt as string);
      toast.success('Imagem gerada!');
    } catch (err: any) {
      update({ status: 'error', progress: 0 });
      toast.error('Erro na geração', { description: err.message });
    }
  };

  const handleDownload = async () => {
    if (!data.resultImage) return;
    try {
      const handle = await (window as any).showSaveFilePicker?.({
        suggestedName: `t2i-${id}.png`,
        types: [{ description: 'PNG', accept: { 'image/png': ['.png'] } }],
      });
      const blob = await fetch(data.resultImage as string).then((r) => r.blob());
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      const a = document.createElement('a');
      a.href = data.resultImage as string;
      a.download = `t2i-${id}.png`;
      a.click();
    }
  };

  return (
    <div
      className={`w-[260px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        isGenerating
          ? 'border-violet-500/50 ring-1 ring-violet-500/20'
          : isCompleted
          ? 'border-emerald-500/40'
          : selected
          ? 'border-violet-500/50 ring-1 ring-violet-500/20'
          : 'border-border hover:border-border/60'
      }`}
    >
      <Handle
        type="target" position={Position.Left} id="prompt-in"
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-violet-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
          <ImageIcon className="w-3 h-3 text-violet-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Text → Image
        </span>
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Settings */}
      <div className="px-3 pt-2.5 pb-1 flex gap-2">
        <select
          value={(data.modelId as string) || IMAGE_MODELS[0].id}
          onChange={(e) => update({ modelId: e.target.value })}
          className="flex-1 h-7 bg-background border border-input rounded-lg px-2 text-[10px] text-foreground focus:outline-none focus:border-violet-500/50 cursor-pointer"
        >
          {IMAGE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
          ))}
        </select>
        <select
          value={(data.aspectRatio as string) || '1:1'}
          onChange={(e) => update({ aspectRatio: e.target.value })}
          className="w-[58px] h-7 bg-background border border-input rounded-lg px-1 text-[10px] text-foreground focus:outline-none focus:border-violet-500/50 cursor-pointer"
        >
          {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Preview */}
      <div className="px-3 pb-1">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-background/50 border border-input flex items-center justify-center">
          {data.resultImage ? (
            <img src={data.resultImage as string} alt="Result" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground/30">
              <ImageIcon className="w-8 h-8" />
              <span className="text-[9px]">{data.prompt ? 'Pronto para gerar' : 'Aguardando prompt'}</span>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
              <div className="w-3/4 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${data.progress || 0}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground">{Math.round((data.progress as number) || 0)}%</span>
            </div>
          )}
          {isCompleted && data.resultImage && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all border border-border/50"
            >
              <Download className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Run */}
      <div className="px-3 pb-3 pt-2">
        <button
          disabled={!canRun}
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          className={`w-full h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            isGenerating
              ? 'bg-violet-500/20 text-violet-400 cursor-wait'
              : canRun
              ? 'bg-violet-500 text-white hover:bg-violet-400 active:scale-[0.98] shadow-lg shadow-violet-500/20'
              : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</>
          ) : isCompleted ? (
            <><RotateCcw className="w-3 h-3" /> Gerar Novamente</>
          ) : (
            <><Play className="w-3 h-3" /> Gerar Imagem</>
          )}
        </button>
      </div>

      <Handle
        type="source" position={Position.Right} id="result-out"
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
