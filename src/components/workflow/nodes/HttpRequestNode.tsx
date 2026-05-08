import React, { useCallback, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Globe, Trash2, GripVertical, Play, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { toast } from 'sonner';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export const HttpRequestNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const [showBody, setShowBody] = useState(false);
  const isGenerating = data.status === 'generating';
  const isCompleted = data.status === 'completed';

  const method   = (data.httpMethod as string) || 'POST';
  const url      = (data.httpUrl as string) || '';
  const body     = (data.httpBody as string) || '';
  const response = (data.httpResponse as string) || '';

  const update = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
      data.onUpdate?.(id, updates);
    },
    [id, data.onUpdate]
  );

  const handleRun = async () => {
    if (!url.trim()) { toast.error('URL obrigatória'); return; }
    update({ status: 'generating', progress: 10, httpResponse: undefined });

    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        // Interpolate {{prompt}} and {{image}} from connected inputs
        let resolvedBody = body;
        if (data.prompt) resolvedBody = resolvedBody.replace(/\{\{prompt\}\}/g, data.prompt as string);
        if (data.image)  resolvedBody = resolvedBody.replace(/\{\{image\}\}/g, data.image as string);
        options.body = resolvedBody;
      }

      update({ progress: 40 });
      const res = await fetch(url, options);
      const text = await res.text();

      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* leave as text */ }

      update({ status: 'completed', progress: 100, httpResponse: pretty, httpStatusCode: res.status });
      toast.success(`HTTP ${res.status}`, { description: `${method} ${url}` });
    } catch (err: any) {
      update({ status: 'error', progress: 0 });
      toast.error('Erro na requisição', { description: err.message });
    }
  };

  return (
    <div
      className={`w-[260px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        isGenerating ? 'border-sky-500/50 ring-1 ring-sky-500/20'
        : isCompleted ? 'border-emerald-500/40'
        : selected ? 'border-sky-500/50 ring-1 ring-sky-500/20'
        : 'border-border hover:border-border/60'
      }`}
    >
      <Handle type="target" position={Position.Left} id="prompt-in"
        style={{ top: '30%' }}
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />
      <Handle type="target" position={Position.Left} id="image-in"
        style={{ top: '55%' }}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-sky-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-sky-500/20 flex items-center justify-center">
          <Globe className="w-3 h-3 text-sky-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          HTTP Request
        </span>
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {/* Method + URL */}
        <div className="flex gap-1.5">
          <select
            value={method}
            onChange={(e) => { e.stopPropagation(); update({ httpMethod: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="h-8 bg-background border border-input rounded-lg px-1.5 text-[10px] font-bold text-sky-400 focus:outline-none appearance-none cursor-pointer w-[64px] shrink-0"
          >
            {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            value={url}
            onChange={(e) => update({ httpUrl: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="https://..."
            className="flex-1 h-8 bg-background border border-input rounded-lg px-2.5 text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-sky-500/50"
          />
        </div>

        {/* Body toggle */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowBody((v) => !v); }}
            className="w-full flex items-center justify-between px-2 py-1 text-[9px] text-muted-foreground hover:text-foreground border border-border/50 rounded-lg transition-colors"
          >
            <span>Body JSON (suporta {`{{prompt}}`}, {`{{image}}`})</span>
            {showBody ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {showBody && ['POST', 'PUT', 'PATCH'].includes(method) && (
          <textarea
            value={body}
            onChange={(e) => update({ httpBody: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder={'{\n  "prompt": "{{prompt}}"\n}'}
            rows={3}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-[9px] font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-sky-500/50 resize-none"
          />
        )}

        {/* Response preview */}
        {response && (
          <div className="rounded-lg bg-background/80 border border-border/50 p-2 max-h-24 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Resposta</span>
              {data.httpStatusCode && (
                <span className={`text-[9px] font-mono font-bold ${(data.httpStatusCode as number) < 400 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.httpStatusCode as number}
                </span>
              )}
            </div>
            <pre className="text-[9px] text-muted-foreground whitespace-pre-wrap break-all font-mono">{response.slice(0, 500)}{response.length > 500 ? '...' : ''}</pre>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          disabled={isGenerating || !url.trim()}
          className={`w-full h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            isGenerating ? 'bg-sky-500/20 text-sky-400 cursor-wait'
            : !url.trim() ? 'bg-muted text-muted-foreground/30 cursor-not-allowed'
            : 'bg-sky-500 text-white hover:bg-sky-400 active:scale-[0.98] shadow-lg shadow-sky-500/20'
          }`}
        >
          {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</> : <><Play className="w-3 h-3" /> Enviar</>}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="response-out"
        className="!w-3.5 !h-3.5 !bg-sky-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
