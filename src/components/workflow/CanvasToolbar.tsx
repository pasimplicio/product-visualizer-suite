import React from 'react';
import { ImageIcon, Type, Play, Loader2, Video, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CanvasToolbarProps {
  onAddNode: (type: string) => void;
  zoom: number;
  onRunWorkflow: () => void;
  isRunning: boolean;
}

const NODE_BUTTONS = [
  { type: 'referenceImage', label: 'Entrada de Imagem', icon: ImageIcon,  color: 'hover:text-orange-400' },
  { type: 'prompt',         label: 'Prompt',            icon: Type,        color: 'hover:text-blue-400'   },
  { type: 'imageOutput',    label: 'Saída de Imagem',   icon: Sparkles,    color: 'hover:text-violet-400' },
  { type: 'videoOutput',    label: 'Saída de Vídeo',    icon: Video,       color: 'hover:text-cyan-400'   },
];

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onAddNode, zoom, onRunWorkflow, isRunning,
}) => (
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
    {/* Run */}
    <button
      onClick={onRunWorkflow}
      disabled={isRunning}
      className={cn(
        'flex items-center gap-2 h-9 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg',
        isRunning
          ? 'bg-violet-500/20 text-violet-400 cursor-wait border border-violet-500/30'
          : 'bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95 shadow-emerald-500/30'
      )}
    >
      {isRunning
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executando...</>
        : <><Play className="w-3.5 h-3.5" /> Executar</>}
    </button>

    {/* Node buttons */}
    <div className="flex items-center gap-0.5 bg-card/90 backdrop-blur-xl border border-border rounded-2xl px-2 py-1.5 shadow-2xl">
      {NODE_BUTTONS.map(({ type, label, icon: Icon, color }) => (
        <button
          key={type}
          onClick={() => onAddNode(type)}
          title={label}
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative text-muted-foreground hover:bg-accent',
            color
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-popover border border-border text-[9px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            {label}
          </span>
        </button>
      ))}

      <div className="ml-1 pl-2 border-l border-border">
        <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  </div>
);
