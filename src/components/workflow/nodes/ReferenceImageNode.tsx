import React, { useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ImageIcon, Upload, Trash2, GripVertical, Plus, X } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { toast } from 'sonner';

export const ReferenceImageNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImageUpload = useCallback(
    (image: string) => {
      // Dispara um evento global customizado em vez de depender da prop volátil do ReactFlow
      const event = new CustomEvent('workflow-node-update', {
        detail: { id, updates: { image } },
      });
      window.dispatchEvent(event);
      
      // Fallback pra manter compatibilidade caso onUpdate ainda exista em alguns contextos
      if (data.onUpdate) {
        data.onUpdate(id, { image });
      }
    },
    [id, data.onUpdate]
  );

  const onClear = useCallback(() => {
    const event = new CustomEvent('workflow-node-update', {
      detail: { id, updates: { image: null } },
    });
    window.dispatchEvent(event);
    
    if (data.onUpdate) {
      data.onUpdate(id, { image: null });
    }
  }, [id, data.onUpdate]);

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
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => toast.success(`Imagem "${file.name}" processada com sucesso!`), 0);
      };
      reader.onerror = (err) => {
        setTimeout(() => toast.error('Erro ao ler a imagem.'), 0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          setTimeout(() => toast.error('Formato inválido. Solte uma imagem.'), 0);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageUpload(reader.result as string);
          setTimeout(() => toast.success(`Imagem "${file.name}" arrastada com sucesso!`), 0);
        };
        reader.onerror = (err) => {
          setTimeout(() => toast.error('Erro ao ler a imagem.'), 0);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageUpload]
  );

  return (
    <div
      className={`min-w-[200px] max-w-[220px] rounded-xl border transition-all duration-300 shadow-2xl ${
        selected
          ? 'border-orange-500/50 ring-1 ring-orange-500/20'
          : 'border-border hover:border-border-foreground/20'
      } bg-card/80 backdrop-blur-xl`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-orange-500/[0.04]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-orange-500/20 flex items-center justify-center">
            <ImageIcon className="w-3 h-3 text-orange-400" />
          </div>
          <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
            {data.label || 'Image'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-2">
        {!data.image ? (
          <div
            className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-input bg-background/50 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-6 h-6 text-muted-foreground/30 mb-2" />
            <span className="text-[9px] text-muted-foreground/50 font-medium">Soltar imagem aqui</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative group rounded-lg overflow-hidden">
            <img
              src={data.image}
              alt="Referência"
              className="w-full aspect-[3/4] object-cover rounded-lg"
            />
            <button
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Add more button */}
      <button className="w-full flex items-center justify-center gap-1 py-1.5 text-[9px] text-muted-foreground/50 hover:text-orange-400 transition-colors border-t border-border/50">
        <Plus className="w-3 h-3" />
        <span>Adicionar imagem</span>
      </button>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="image-out"
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
