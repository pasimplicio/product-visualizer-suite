import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Layers, Loader2, CheckCircle2, Play,
  RotateCcw, Trash2, Download, GripVertical,
} from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GeminiService } from '@/lib/services/gemini-service';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

const DEFAULT_INSTRUCTION =
  'Combine these two images: use the main subject/product from the first image and place it naturally in the background/environment of the second image. Keep lighting consistent and make the composition look realistic.';

export const MergeNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const { addLibraryItem } = useLibrary();
  const isGenerating = data.status === 'generating';
  const isCompleted = data.status === 'completed';
  const imageA = data.imageA as string | undefined;
  const imageB = data.imageB as string | undefined;
  const canRun = !isGenerating && !!imageA && !!imageB;

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
      const instruction = (data.mergeInstruction as string) || DEFAULT_INSTRUCTION;
      const result = await GeminiService.generateImageMulti({
        prompt: instruction,
        referenceImages: [imageA!, imageB!],
      });
      if (!result.success || !result.data?.imageUrl) throw new Error(result.error);
      update({ status: 'completed', resultImage: result.data.imageUrl, progress: 100 });
      addLibraryItem(result.data.imageUrl, 'image', instruction);
      toast.success('Imagens mescladas!');
    } catch (err: any) {
      update({ status: 'error', progress: 0 });
      toast.error('Erro ao mesclar', { description: err.message });
    }
  };

  const handleDownload = async () => {
    if (!data.resultImage) return;
    const a = document.createElement('a');
    a.href = data.resultImage as string;
    a.download = `merge-${id}.png`;
    a.click();
  };

  return (
    <div
      className={`w-[260px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        isGenerating
          ? 'border-purple-500/50 ring-1 ring-purple-500/20'
          : isCompleted
          ? 'border-emerald-500/40'
          : selected
          ? 'border-purple-500/50 ring-1 ring-purple-500/20'
          : 'border-border hover:border-border/60'
      }`}
    >
      {/* image-a handle (topo) */}
      <Handle type="target" position={Position.Left} id="image-a"
        style={{ top: '30%' }}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />
      {/* image-b handle (meio) */}
      <Handle type="target" position={Position.Left} id="image-b"
        style={{ top: '60%' }}
        className="!w-3.5 !h-3.5 !bg-pink-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-purple-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center">
          <Layers className="w-3 h-3 text-purple-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Merge / Composite
        </span>
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Input labels */}
      <div className="px-3 py-1.5 flex gap-3 text-[8px]">
        <span className="flex items-center gap-1 text-orange-400/70">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" /> Imagem A (sujeito)
        </span>
        <span className="flex items-center gap-1 text-pink-400/70">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" /> Imagem B (fundo)
        </span>
      </div>

      {/* Thumbnails das inputs */}
      <div className="px-3 pb-2 flex gap-2">
        <div className={`flex-1 h-14 rounded-lg border overflow-hidden flex items-center justify-center ${imageA ? 'border-orange-500/30' : 'border-dashed border-orange-500/20 bg-background/50'}`}>
          {imageA ? <img src={imageA} alt="A" className="w-full h-full object-contain" /> :
            <span className="text-[8px] text-orange-400/40">A</span>}
        </div>
        <div className="flex items-center text-[14px] text-muted-foreground/30">+</div>
        <div className={`flex-1 h-14 rounded-lg border overflow-hidden flex items-center justify-center ${imageB ? 'border-pink-500/30' : 'border-dashed border-pink-500/20 bg-background/50'}`}>
          {imageB ? <img src={imageB} alt="B" className="w-full h-full object-contain" /> :
            <span className="text-[8px] text-pink-400/40">B</span>}
        </div>
      </div>

      {/* Instrução customizável */}
      <div className="px-3 pb-2">
        <textarea
          value={(data.mergeInstruction as string) || ''}
          onChange={(e) => update({ mergeInstruction: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder={DEFAULT_INSTRUCTION}
          rows={2}
          className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-[9px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
        />
      </div>

      {/* Resultado */}
      {data.resultImage && (
        <div className="px-3 pb-2">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-background/50 border border-input">
            <img src={data.resultImage as string} alt="Merged" className="w-full h-full object-contain" />
            {isGenerating && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
                <div className="w-3/4 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${data.progress || 0}%` }} />
                </div>
              </div>
            )}
            {isCompleted && (
              <button onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all border border-border/50">
                <Download className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading sem resultado ainda */}
      {isGenerating && !data.resultImage && (
        <div className="px-3 pb-2">
          <div className="w-full h-20 rounded-lg bg-background/50 border border-input flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <div className="w-3/4 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${data.progress || 0}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Run */}
      <div className="px-3 pb-3">
        <button disabled={!canRun}
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          className={`w-full h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            isGenerating ? 'bg-purple-500/20 text-purple-400 cursor-wait' :
            canRun ? 'bg-purple-500 text-white hover:bg-purple-400 active:scale-[0.98] shadow-lg shadow-purple-500/20' :
            'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}>
          {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin" /> Mesclando...</> :
           isCompleted  ? <><RotateCcw className="w-3 h-3" /> Mesclar Novamente</> :
                          <><Play className="w-3 h-3" /> Mesclar Imagens</>}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="result-out"
        className="!w-3.5 !h-3.5 !bg-purple-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
