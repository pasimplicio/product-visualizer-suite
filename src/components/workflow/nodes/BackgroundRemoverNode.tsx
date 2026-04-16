import React, { useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Eraser, Loader2, GripVertical, CheckCircle2, Trash2, Upload, X } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GeminiService } from '@/lib/services/gemini-service';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

export const BackgroundRemoverNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
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
      reader.onerror = () => setTimeout(() => toast.error('Erro ao ler a imagem.'), 0);
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleRun = async () => {
    if (!data.image) return;

    updateNodeState({ status: 'generating', progress: 10 });

    try {
      updateNodeState({ progress: 30 });

      const result = await GeminiService.removeBackground(data.image);

      if (result.success && result.data?.imageUrl) {
        updateNodeState({
          status: 'completed',
          resultImage: result.data.imageUrl,
          progress: 100,
        });
        addLibraryItem(result.data.imageUrl, 'background-remover');
        toast.success('Fundo removido com sucesso!');
      } else {
        throw new Error(result.error || 'Falha na remoção de fundo');
      }
    } catch (err: any) {
      updateNodeState({ status: 'error' });
      toast.error('Falha na remoção de fundo', { description: err.message });
    }
  };

  return (
    <div
      className={`w-[200px] rounded-xl border transition-all duration-300 shadow-2xl ${
        selected
          ? 'border-rose-500/50 ring-1 ring-rose-500/20'
          : 'border-border hover:border-border-foreground/20'
      } bg-card/80 backdrop-blur-xl`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-rose-500/[0.04]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-rose-500/20 flex items-center justify-center">
            <Eraser className="w-3 h-3 text-rose-400" />
          </div>
          <span className="text-[9px] font-bold text-foreground/70 uppercase tracking-wider">{data.label || 'Remover Fundo'}</span>
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
            className="w-full aspect-square rounded-lg border-2 border-dashed border-rose-500/30 bg-background/50 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/60 hover:bg-rose-500/[0.03] transition-all relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-5 h-5 text-rose-500/40 mb-1" />
            <span className="text-[9px] text-muted-foreground/60 font-medium">Soltar imagem</span>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center relative group">
            {data.resultImage ? (
              <img src={data.resultImage} alt="BG Removed" className="w-full h-full object-contain" />
            ) : (
              <img src={data.image} alt="Input" className="w-full h-full object-contain opacity-40" />
            )}
            
            {!isGenerating && (
              <button
                className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/80 z-10"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                title="Limpar nó"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg z-10">
                <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
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
              ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
              : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eraser className="w-3 h-3" />}
          {isGenerating ? 'Processando...' : isCompleted ? 'Run Again' : 'Remover Fundo'}
        </button>
        <p className="text-[8px] text-center text-emerald-400/60 mt-1">GRÁTIS</p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="bg-out"
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
