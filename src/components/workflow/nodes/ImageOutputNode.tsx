import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ImageIcon, Download, GripVertical, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';

export const ImageOutputNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const handleDownload = async () => {
    if (!data.resultImage) return;
    try {
      const resp = await fetch(data.resultImage as string);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `output-${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(data.resultImage as string, '_blank');
    }
  };

  return (
    <div
      className={`w-[220px] rounded-xl border transition-all duration-300 shadow-2xl ${
        selected
          ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
          : 'border-border hover:border-border-foreground/20'
      } bg-card/80 backdrop-blur-xl`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-emerald-500/[0.04]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
            <ImageIcon className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">Output</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-2">
        <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted/30 border border-border flex items-center justify-center">
          {data.resultImage ? (
            <img src={data.resultImage} alt="Output" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground/30">
              <ImageIcon className="w-8 h-8" />
              <span className="text-[9px] font-medium">Aguardando</span>
            </div>
          )}
        </div>
      </div>

      {/* Download */}
      {data.resultImage && (
        <div className="px-2 pb-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className="w-full h-7 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500/20 transition-all"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-out"
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
