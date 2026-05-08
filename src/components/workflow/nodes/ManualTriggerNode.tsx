import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play, GripVertical, Trash2, Zap } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';

export const ManualTriggerNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div
      className={`w-[190px] rounded-xl border transition-all duration-300 shadow-2xl ${
        selected
          ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
          : 'border-border hover:border-emerald-500/30'
      } bg-card/80 backdrop-blur-xl`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-emerald-500/[0.04]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="flex items-center gap-1.5 flex-1">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
            <Zap className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
            Manual Trigger
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          title="Excluir"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-[9px] text-muted-foreground/50 text-center mb-3 leading-relaxed">
          Inicia a execução do workflow em ordem topológica
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onRunWorkflow?.();
          }}
          className="w-full h-8 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 active:scale-95 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all border border-emerald-500/20"
        >
          <Play className="w-3 h-3" />
          Executar Workflow
        </button>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="trigger-out"
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
