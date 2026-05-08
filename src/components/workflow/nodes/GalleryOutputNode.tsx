import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { LayoutGrid, GripVertical, Trash2, Download, ImageIcon } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { toast } from 'sonner';

export const GalleryOutputNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const images = (data.images as string[]) || [];

  const handleDownloadAll = useCallback(async () => {
    if (images.length === 0) return;
    for (let i = 0; i < images.length; i++) {
      try {
        const a = document.createElement('a');
        a.href = images[i];
        a.download = `gallery-${id}-${i + 1}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 300));
      } catch { /* continue */ }
    }
    toast.success(`${images.length} imagens baixadas`);
  }, [images, id]);

  return (
    <div
      className={`w-[300px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        selected
          ? 'border-indigo-500/50 ring-1 ring-indigo-500/20'
          : 'border-border hover:border-indigo-500/20'
      }`}
    >
      <Handle type="target" position={Position.Left} id="image-in"
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-indigo-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center">
          <LayoutGrid className="w-3 h-3 text-indigo-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Galeria
        </span>
        {images.length > 0 && (
          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
            {images.length}
          </span>
        )}
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Grid */}
      <div className="p-3">
        {images.length === 0 ? (
          <div className="w-full h-24 rounded-lg border-2 border-dashed border-indigo-500/20 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/30">
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[9px]">Conecte saídas de imagem aqui</span>
          </div>
        ) : (
          <div className={`grid gap-1.5 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-background/50 border border-input group">
                <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-contain" />
                <a
                  href={src} download={`gallery-${id}-${i + 1}.png`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-1 right-1 w-5 h-5 rounded bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-all border border-border/50"
                >
                  <Download className="w-2.5 h-2.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {images.length > 1 && (
        <div className="px-3 pb-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleDownloadAll(); }}
            className="w-full h-7 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all border border-indigo-500/20"
          >
            <Download className="w-3 h-3" />
            Baixar Todas ({images.length})
          </button>
        </div>
      )}
    </div>
  );
};
