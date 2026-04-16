import React from 'react';
import {
  MousePointer2, Type, ImageIcon, Video, Mic, Download,
  LayoutGrid, Share2, Undo2, Redo2, Sparkles, ArrowUpRight, Eraser
} from 'lucide-react';

interface CanvasToolbarProps {
  onAddNode: (type: string) => void;
  zoom: number;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ onAddNode, zoom }) => {
  const tools: any[] = [
    { icon: Type, label: 'Prompt', action: () => onAddNode('prompt') },
    { icon: ImageIcon, label: 'Entrada de Imagem', action: () => onAddNode('referenceImage') },
    { icon: Sparkles, label: 'Gerador', action: () => onAddNode('generator') },
    { separator: true },
    { icon: ArrowUpRight, label: 'Melhorar Res.', action: () => onAddNode('upscale') },
    { icon: Eraser, label: 'Remover Fundo', action: () => onAddNode('backgroundRemover') },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-0.5 bg-card/90 backdrop-blur-xl border border-border rounded-2xl px-2 py-1.5 shadow-2xl">
        {tools.map((tool, i) => {
          if ('separator' in tool && tool.separator) {
            return <div key={i} className="w-px h-6 bg-border mx-1" />;
          }
          const Icon = tool.icon!;
          return (
            <button
              key={i}
              onClick={tool.action}
              disabled={tool.disabled}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                tool.disabled
                  ? 'text-muted-foreground/30 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
              {/* Tooltip */}
              <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-popover border border-border text-[9px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                {tool.label}
              </span>
            </button>
          );
        })}

        {/* Zoom indicator */}
        <div className="ml-2 pl-2 border-l border-border">
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
