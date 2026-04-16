import React, { useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ArrowUpRight, Loader2, GripVertical, CheckCircle2, Trash2, Upload, X } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GeminiService } from '@/lib/services/gemini-service';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

export const UpscaleNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const { addLibraryItem } = useLibrary();
  const isGenerating = data.status === 'generating';
  const isCompleted = data.status === 'completed';
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const onImageUpload = useCallback((image: string) => {
    updateNodeState({ image });
  }, [updateNodeState]);

  const onClear = useCallback(() => {
    updateNodeState({ image: null, resultImage: undefined, status: 'idle', progress: 0 });
  }, [updateNodeState]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setTimeout(() => toast.error('Formato inválido. Selecione uma imagem.'), 0);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.onerror = () => setTimeout(() => toast.error('Erro ao ler imagem.'), 0);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setTimeout(() => toast.error('Formato inválido. Solte uma imagem.'), 0);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => onImageUpload(reader.result as string);
      reader.onerror = () => setTimeout(() => toast.error('Erro ao ler imagem.'), 0);
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleRun = async () => {
    if (!data.image) return;

    updateNodeState({ status: 'generating', progress: 10 });

    try {
      updateNodeState({ progress: 30 });

      const result = await GeminiService.upscaleImage(data.image);

      if (result.success && result.data?.imageUrl) {
        updateNodeState({
          status: 'completed',
          resultImage: result.data.imageUrl,
          progress: 100,
        });
        addLibraryItem(result.data.imageUrl, 'upscale');
        toast.success('Upscale concluído!');
      } else {
        throw new Error(result.error || 'Falha no upscale');
      }
    } catch (err: any) {
      updateNodeState({ status: 'error' });
      toast.error('Falha no upscale', { description: err.message });
    }
  };

  return (
    <div
      className={`w-[200px] rounded-xl border transition-all duration-300 shadow-2xl ${
        selected
          ? 'border-amber-500/50 ring-1 ring-amber-500/20'
          : 'border-border hover:border-border-foreground/20'
      } bg-card/80 backdrop-blur-xl`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-amber-500/[0.04]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center">
            <ArrowUpRight className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">{data.label || 'Melhorar Res.'}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {isCompleted && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </div>

      <div className="p-2">
        {!data.image && !data.resultImage ? (
          <div
            className="w-full aspect-square rounded-lg border-2 border-dashed border-amber-500/30 bg-background/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/[0.03] transition-all relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-5 h-5 text-amber-500/40 mb-1" />
            <span className="text-[9px] text-muted-foreground/60 font-medium">Soltar imagem</span>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center relative group">
            {data.resultImage ? (
              <img src={data.resultImage} alt="Upscaled" className="w-full h-full object-contain" />
            ) : (
              <img src={data.image} alt="Input" className="w-full h-full object-contain opacity-40 grayscale" />
            )}
            
            {!isGenerating && (
              <button
                className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500/80 z-10"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                title="Limpar nó"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg z-10">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-2 pb-2">
        <button
          disabled={!data.image || isGenerating}
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          className={`w-full h-7 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            data.image && !isGenerating
              ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
              : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpRight className="w-3 h-3" />}
          {isGenerating ? 'Processando...' : isCompleted ? 'Run Again' : 'Upscale'}
        </button>
        <p className="text-[8px] text-center text-emerald-400/60 mt-1">GRÁTIS</p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="upscale-out"
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
