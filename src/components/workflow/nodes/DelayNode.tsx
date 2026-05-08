import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Timer, Trash2, GripVertical } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';

const PRESETS = [1, 2, 5, 10, 30, 60];

export const DelayNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const seconds = (data.delaySeconds as number) ?? 5;

  const update = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
      data.onUpdate?.(id, updates);
    },
    [id, data.onUpdate]
  );

  return (
    <div
      className={`w-[200px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        selected ? 'border-slate-400/50 ring-1 ring-slate-400/20' : 'border-border hover:border-border/60'
      }`}
    >
      <Handle type="target" position={Position.Left} id="data-in"
        className="!w-3.5 !h-3.5 !bg-slate-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-slate-500/20 flex items-center justify-center">
          <Timer className="w-3 h-3 text-slate-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Delay
        </span>
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Seconds input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={3600}
            value={seconds}
            onChange={(e) => { e.stopPropagation(); update({ delaySeconds: Math.max(1, parseInt(e.target.value) || 1) }); }}
            onClick={(e) => e.stopPropagation()}
            className="w-16 h-8 bg-background border border-input rounded-lg px-2 text-[12px] font-mono text-foreground text-center focus:outline-none focus:border-slate-400/50"
          />
          <span className="text-[11px] text-muted-foreground">segundos</span>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); update({ delaySeconds: s }); }}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-colors ${
                seconds === s
                  ? 'bg-slate-500 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-slate-400/50'
              }`}
            >
              {s >= 60 ? `${s / 60}m` : `${s}s`}
            </button>
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="data-out"
        className="!w-3.5 !h-3.5 !bg-slate-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
