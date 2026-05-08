import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';

type ConditionType = 'has-image' | 'has-prompt' | 'always-true' | 'always-false';

const CONDITIONS: { value: ConditionType; label: string }[] = [
  { value: 'has-image',    label: 'Tem imagem conectada' },
  { value: 'has-prompt',   label: 'Prompt não está vazio' },
  { value: 'always-true',  label: 'Sempre verdadeiro' },
  { value: 'always-false', label: 'Sempre falso' },
];

export const ConditionNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const condition = (data.condition as ConditionType) || 'has-image';

  const update = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
      data.onUpdate?.(id, updates);
    },
    [id, data.onUpdate]
  );

  return (
    <div
      className={`w-[220px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        selected ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-border hover:border-border/60'
      }`}
    >
      <Handle
        type="target" position={Position.Left} id="data-in"
        className="!w-3.5 !h-3.5 !bg-yellow-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-yellow-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-yellow-500/20 flex items-center justify-center">
          <GitBranch className="w-3 h-3 text-yellow-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Condição
        </span>
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Condition selector */}
      <div className="px-3 py-2.5">
        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
          Se...
        </label>
        <select
          value={condition}
          onChange={(e) => { e.stopPropagation(); update({ condition: e.target.value as ConditionType }); }}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-8 bg-background border border-input rounded-lg px-2 text-[11px] text-foreground focus:outline-none focus:border-yellow-500/50 appearance-none cursor-pointer"
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Output labels */}
      <div className="px-3 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-emerald-400 font-bold">✓ Verdadeiro</span>
          <Handle
            type="source" position={Position.Right} id="true-out"
            style={{ top: '68%' }}
            className="!w-3.5 !h-3.5 !bg-emerald-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-rose-400 font-bold">✗ Falso</span>
          <Handle
            type="source" position={Position.Right} id="false-out"
            style={{ top: '82%' }}
            className="!w-3.5 !h-3.5 !bg-rose-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
          />
        </div>
      </div>
    </div>
  );
};
