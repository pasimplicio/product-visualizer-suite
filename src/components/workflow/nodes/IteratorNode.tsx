import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { RefreshCw, Trash2, GripVertical, Plus, X } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';

export const IteratorNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const items = (data.iteratorItems as string[]) || [''];
  const currentIndex = (data.iteratorIndex as number) ?? 0;

  const update = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
      data.onUpdate?.(id, updates);
    },
    [id, data.onUpdate]
  );

  const addItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    update({ iteratorItems: [...items, ''] });
  };

  const removeItem = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    update({ iteratorItems: items.filter((_, i) => i !== idx) });
  };

  const editItem = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    update({ iteratorItems: next });
  };

  return (
    <div
      className={`w-[240px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        selected ? 'border-lime-500/50 ring-1 ring-lime-500/20' : 'border-border hover:border-border/60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-lime-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-lime-500/20 flex items-center justify-center">
          <RefreshCw className="w-3 h-3 text-lime-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Iterador
        </span>
        <span className="text-[9px] text-muted-foreground font-mono bg-background/50 border border-border px-1.5 rounded">
          {items.length} itens
        </span>
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Items list */}
      <div className="px-3 py-2.5 space-y-1.5 max-h-48 overflow-y-auto">
        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
          Variações de Prompt
        </label>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-1.5">
            <span className={`text-[8px] font-mono mt-1.5 shrink-0 ${idx === currentIndex ? 'text-lime-400' : 'text-muted-foreground/40'}`}>
              {idx + 1}.
            </span>
            <input
              value={item}
              onChange={(e) => editItem(idx, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={`Variação ${idx + 1}...`}
              className="flex-1 h-7 bg-background border border-input rounded-md px-2 text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-lime-500/50"
            />
            {items.length > 1 && (
              <button onClick={(e) => removeItem(e, idx)}
                className="w-5 h-5 mt-1 rounded flex items-center justify-center text-muted-foreground/30 hover:text-rose-400 transition-colors shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        <button onClick={addItem}
          className="w-full h-7 rounded-lg border border-dashed border-lime-500/30 text-[10px] text-lime-400/60 hover:text-lime-400 hover:border-lime-500/60 transition-all flex items-center justify-center gap-1 mt-1">
          <Plus className="w-3 h-3" /> Adicionar variação
        </button>
      </div>

      {/* Progress indicator */}
      {items.length > 1 && (
        <div className="px-3 pb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-muted-foreground">Progresso</span>
            <span className="text-[9px] font-mono text-lime-400">{currentIndex + 1}/{items.length}</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-lime-500 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <Handle
        type="source" position={Position.Right} id="prompt-out"
        className="!w-3.5 !h-3.5 !bg-lime-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
