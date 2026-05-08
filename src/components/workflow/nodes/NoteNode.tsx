import React, { useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { StickyNote, GripVertical, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';

export const NoteNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const update = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
      data.onUpdate?.(id, updates);
    },
    [id, data.onUpdate]
  );

  return (
    <div
      className={`w-[220px] rounded-xl border transition-all duration-300 shadow-xl ${
        selected
          ? 'border-amber-400/60 ring-1 ring-amber-400/20'
          : 'border-amber-400/30 hover:border-amber-400/50'
      } bg-amber-50/5 dark:bg-amber-950/10 backdrop-blur-xl`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-amber-400/15 rounded-t-xl">
        <GripVertical className="w-3 h-3 text-amber-400/30 cursor-grab" />
        <StickyNote className="w-3 h-3 text-amber-400/60" />
        <span className="text-[9px] font-bold text-amber-400/60 uppercase tracking-widest flex-1">
          Nota
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-5 h-5 rounded flex items-center justify-center text-amber-400/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Conteúdo editável */}
      <div className="p-2.5">
        <textarea
          value={(data.noteText as string) || ''}
          onChange={(e) => update({ noteText: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Escreva suas anotações aqui..."
          rows={5}
          className="w-full bg-transparent text-[10px] text-amber-100/70 placeholder:text-amber-400/25 focus:outline-none resize-none leading-relaxed"
        />
      </div>
    </div>
  );
};
