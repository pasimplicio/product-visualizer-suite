import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Type, GripVertical, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';

export const PromptNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div
      className={`min-w-[280px] max-w-[340px] rounded-xl border transition-all duration-300 shadow-2xl ${
        selected
          ? 'border-blue-500/50 ring-1 ring-blue-500/20'
          : 'border-border hover:border-border-foreground/20'
      } bg-card/80 backdrop-blur-xl`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-blue-500/[0.04]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center">
            <Type className="w-3 h-3 text-blue-400" />
          </div>
          <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Prompt</span>
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
      <div className="p-3">
        <textarea
          value={data.prompt || ''}
          onChange={(e) => {
            const updates = { prompt: e.target.value };
            // Fallback robusto global
            window.dispatchEvent(
              new CustomEvent('workflow-node-update', {
                detail: { id, updates },
              })
            );
            if (data.onUpdate) data.onUpdate(id, updates);
          }}
          placeholder="Descreva o que você quer gerar..."
          className="w-full min-h-[80px] max-h-[200px] bg-background/50 border border-input rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 resize-y focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all nodrag nopan"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="prompt-out"
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
