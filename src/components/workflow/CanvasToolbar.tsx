import React from 'react';
import {
  Type, ImageIcon, Sparkles, ArrowUpRight, Eraser,
  Play, Loader2, History, Undo2, Redo2,
  Download, Upload, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CanvasToolbarProps {
  onAddNode: (type: string) => void;
  zoom: number;
  onRunWorkflow: () => void;
  onToggleExecutionPanel: () => void;
  isRunning: boolean;
  hasExecutions: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onImport: () => void;
  onOpenCommandPalette: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onAddNode, zoom, onRunWorkflow, onToggleExecutionPanel,
  isRunning, hasExecutions,
  onUndo, onRedo, canUndo, canRedo,
  onExport, onImport, onOpenCommandPalette,
}) => {
  const nodeTools = [
    { icon: Type,       label: 'Prompt',            action: () => onAddNode('prompt') },
    { icon: ImageIcon,  label: 'Entrada de Imagem', action: () => onAddNode('referenceImage') },
    { icon: Sparkles,   label: 'Gerador',           action: () => onAddNode('generator') },
    { separator: true },
    { icon: ArrowUpRight, label: 'Upscale',         action: () => onAddNode('upscale') },
    { icon: Eraser,     label: 'Remover Fundo',     action: () => onAddNode('backgroundRemover') },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 bg-card/90 backdrop-blur-xl border border-border rounded-2xl px-1.5 py-1.5 shadow-2xl">
        <ToolBtn icon={Undo2} label="Desfazer (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} tooltip="-top-8" />
        <ToolBtn icon={Redo2} label="Refazer (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} tooltip="-top-8" />
      </div>

      {/* Run */}
      <button
        onClick={onRunWorkflow}
        disabled={isRunning}
        className={cn(
          'flex items-center gap-2 h-9 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg',
          isRunning
            ? 'bg-violet-500/20 text-violet-400 cursor-wait border border-violet-500/30'
            : 'bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95 shadow-emerald-500/30'
        )}
      >
        {isRunning
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executando...</>
          : <><Play className="w-3.5 h-3.5" /> Executar</>}
      </button>

      {/* Node palette */}
      <div className="flex items-center gap-0.5 bg-card/90 backdrop-blur-xl border border-border rounded-2xl px-2 py-1.5 shadow-2xl">
        {nodeTools.map((tool, i) => {
          if ('separator' in tool && tool.separator) return <div key={i} className="w-px h-6 bg-border mx-1" />;
          const Icon = tool.icon!;
          return (
            <button
              key={i}
              onClick={tool.action}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative text-muted-foreground hover:text-foreground hover:bg-accent',
                tool.color || ''
              )}
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
              <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-popover border border-border text-[9px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                {tool.label}
              </span>
            </button>
          );
        })}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Ctrl+K search */}
        <button
          onClick={onOpenCommandPalette}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative text-muted-foreground hover:text-foreground hover:bg-accent"
          title="Buscar nós (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
          <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-popover border border-border text-[9px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Buscar nós (Ctrl+K)
          </span>
        </button>

        {/* Executions history */}
        <button
          onClick={onToggleExecutionPanel}
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative',
            hasExecutions ? 'text-violet-400 hover:bg-violet-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          title="Histórico de execuções"
        >
          <History className="w-4 h-4" />
          {hasExecutions && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />}
          <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-popover border border-border text-[9px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Execuções
          </span>
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Export */}
        <button
          onClick={onExport}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative text-muted-foreground hover:text-foreground hover:bg-accent"
          title="Exportar workflow"
        >
          <Download className="w-4 h-4" />
          <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-popover border border-border text-[9px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Exportar JSON
          </span>
        </button>

        {/* Import */}
        <button
          onClick={onImport}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative text-muted-foreground hover:text-foreground hover:bg-accent"
          title="Importar workflow"
        >
          <Upload className="w-4 h-4" />
          <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-popover border border-border text-[9px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Importar JSON
          </span>
        </button>

        {/* Zoom */}
        <div className="ml-1 pl-2 border-l border-border">
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Small reusable icon button
const ToolBtn = ({
  icon: Icon, label, onClick, disabled, tooltip,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={cn(
      'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative',
      disabled
        ? 'text-muted-foreground/30 cursor-not-allowed'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    )}
  >
    <Icon className="w-4 h-4" />
    <span className={`absolute ${tooltip || '-top-8'} px-2 py-0.5 rounded-md bg-popover border border-border text-[9px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap`}>
      {label}
    </span>
  </button>
);
