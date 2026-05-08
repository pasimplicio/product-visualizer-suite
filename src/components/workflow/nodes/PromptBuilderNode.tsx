import React, { useCallback, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Code2, GripVertical, Trash2, Plus, X } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';

/** Resolve {{variavel}} no template com os valores definidos */
function resolveTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/** Extrai todos os nomes de variáveis do template */
function extractVarNames(template: string): string[] {
  return [...new Set([...template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];
}

export const PromptBuilderNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const template = (data.templatePrompt as string) || '';
  const vars = (data.variables as Record<string, string>) || {};
  const resolved = resolveTemplate(template, vars);
  const varNames = extractVarNames(template);
  const prevResolved = useRef<string>('');

  const update = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
      data.onUpdate?.(id, updates);
    },
    [id, data.onUpdate]
  );

  // Propaga o prompt resolvido sempre que muda
  useEffect(() => {
    if (resolved !== prevResolved.current) {
      prevResolved.current = resolved;
      data.onUpdate?.(id, { prompt: resolved });
    }
  }, [resolved, id, data.onUpdate]);

  const setVar = (name: string, value: string) => {
    update({ variables: { ...vars, [name]: value } });
  };

  const addVar = () => {
    const name = `var${Object.keys(vars).length + 1}`;
    update({ variables: { ...vars, [name]: '' } });
  };

  const removeVar = (name: string) => {
    const next = { ...vars };
    delete next[name];
    update({ variables: next });
  };

  return (
    <div
      className={`w-[280px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        selected
          ? 'border-blue-500/50 ring-1 ring-blue-500/20'
          : 'border-border hover:border-blue-500/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-blue-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center">
          <Code2 className="w-3 h-3 text-blue-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Prompt Builder
        </span>
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Template */}
        <div>
          <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
            Template
          </label>
          <textarea
            value={template}
            onChange={(e) => update({ templatePrompt: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder={'Um {{produto}} em um cenário {{estilo}}'}
            rows={3}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
          />
        </div>

        {/* Variáveis */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
              Variáveis
            </label>
            <button onClick={(e) => { e.stopPropagation(); addVar(); }}
              className="flex items-center gap-0.5 text-[8px] text-blue-400 hover:text-blue-300 transition-colors">
              <Plus className="w-2.5 h-2.5" /> Adicionar
            </button>
          </div>
          <div className="space-y-1">
            {Object.keys(vars).map((name) => (
              <div key={name} className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">
                  {`{{${name}}}`}
                </span>
                <input
                  value={vars[name]}
                  onChange={(e) => setVar(name, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="valor..."
                  className="flex-1 h-6 bg-background border border-input rounded px-2 text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-blue-500/50"
                />
                <button onClick={(e) => { e.stopPropagation(); removeVar(name); }}
                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            {varNames.filter((n) => !(n in vars)).map((name) => (
              <div key={name} className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-amber-400/70 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                  {`{{${name}}}`}
                </span>
                <input
                  defaultValue=""
                  onChange={(e) => setVar(name, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="valor..."
                  className="flex-1 h-6 bg-background border border-amber-500/20 rounded px-2 text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview do prompt resolvido */}
        {resolved && (
          <div className="rounded-lg bg-background/50 border border-border/50 p-2">
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Preview</p>
            <p className="text-[10px] text-foreground/70 leading-relaxed break-words">{resolved}</p>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="prompt-out"
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
