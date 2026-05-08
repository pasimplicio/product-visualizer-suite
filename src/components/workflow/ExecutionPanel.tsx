import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, Loader2,
  ChevronDown, ChevronRight, X, History,
} from 'lucide-react';
import type { ExecutionRecord, NodeExecutionStatus } from '@/lib/workflow/engine';
import { cn } from '@/lib/utils';

interface ExecutionPanelProps {
  executions: ExecutionRecord[];
  isRunning: boolean;
  onClose: () => void;
  onCancel: () => void;
}

function formatDuration(ms?: number): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const StatusIcon = ({ status }: { status: NodeExecutionStatus | ExecutionRecord['status'] }) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'error':     return <XCircle      className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case 'running':   return <Loader2      className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />;
    case 'cancelled': return <XCircle      className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    default:          return <Clock        className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
  }
};

const statusBorder: Record<string, string> = {
  completed: 'border-emerald-500/20 bg-emerald-500/[0.03]',
  error:     'border-rose-500/20 bg-rose-500/[0.03]',
  running:   'border-violet-500/30 bg-violet-500/[0.04]',
  cancelled: 'border-border bg-background/50',
};

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  executions, isRunning, onClose, onCancel,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="w-72 h-full bg-popover border-l border-border flex flex-col animate-in slide-in-from-right-2 duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[11px] font-bold text-foreground">Execuções</h3>
          {isRunning && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Rodando
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isRunning && (
            <button
              onClick={onCancel}
              className="px-2 py-0.5 rounded text-[9px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
            >
              Parar
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lista de execuções */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {executions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <History className="w-10 h-10 text-muted-foreground/15" />
            <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed">
              Nenhuma execução ainda.<br />
              Clique em <strong className="text-muted-foreground">Executar Workflow</strong>.
            </p>
          </div>
        ) : (
          [...executions].reverse().map((exec) => (
            <div
              key={exec.id}
              className={cn('rounded-lg border overflow-hidden', statusBorder[exec.status] || statusBorder.cancelled)}
            >
              {/* Linha de execução */}
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
              >
                <StatusIcon status={exec.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-foreground">{formatTime(exec.startedAt)}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {exec.completedNodes}/{exec.totalNodes} nós · {formatDuration(exec.durationMs)}
                  </p>
                </div>
                {expandedId === exec.id
                  ? <ChevronDown  className="w-3 h-3 text-muted-foreground shrink-0" />
                  : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </button>

              {/* Logs por nó */}
              {expandedId === exec.id && exec.nodeLogs.length > 0 && (
                <div className="px-3 pb-2.5 pt-0.5 space-y-1.5 border-t border-border/40">
                  {exec.nodeLogs.map((log) => (
                    <div key={log.nodeId} className="flex items-start gap-2 pt-1">
                      <StatusIcon status={log.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-foreground truncate">{log.nodeLabel}</p>
                        {log.error ? (
                          <p className="text-[8px] text-rose-400 break-words">{log.error}</p>
                        ) : log.durationMs ? (
                          <p className="text-[8px] text-muted-foreground">{formatDuration(log.durationMs)}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border shrink-0">
        <p className="text-[8px] text-muted-foreground/40 text-center">
          Últimas {Math.min(executions.length, 20)} execuções
        </p>
      </div>
    </div>
  );
};
