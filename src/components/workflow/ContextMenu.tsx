import React, { useEffect, useRef } from 'react';
import { Copy, Trash2, Type, ImageIcon, Wand2, Video, ArrowUpRight, Eraser } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId?: string | null;
  onClose: () => void;
  onDeleteNode?: (id: string) => void;
  onDuplicateNode?: (id: string) => void;
  onAddNode: (type: string) => void;
}

const QUICK_ADD = [
  { type: 'prompt',     label: 'Prompt',          icon: Type,         color: 'text-blue-400' },
  { type: 'text2image', label: 'Text → Image',    icon: ImageIcon,    color: 'text-violet-400' },
  { type: 'image2image',label: 'Image → Image',   icon: Wand2,        color: 'text-fuchsia-400' },
  { type: 'text2video', label: 'Text → Video',    icon: Video,        color: 'text-cyan-400' },
  { type: 'upscale',    label: 'Upscale',         icon: ArrowUpRight, color: 'text-amber-400' },
  { type: 'backgroundRemover', label: 'Remover Fundo', icon: Eraser,  color: 'text-rose-400' },
];

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x, y, nodeId, onClose, onDeleteNode, onDuplicateNode, onAddNode,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Adjust position so menu doesn't overflow viewport
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={ref}
      style={{ left: adjustedX, top: adjustedY }}
      className="fixed z-50 w-44 bg-popover border border-border rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100"
    >
      {nodeId ? (
        // Node context menu
        <>
          <div className="px-3 py-1.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Nó</p>
          </div>
          <button
            onClick={() => { onDuplicateNode?.(nodeId); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            Duplicar
          </button>
          <button
            onClick={() => { onDeleteNode?.(nodeId); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Deletar
          </button>
        </>
      ) : (
        // Canvas context menu — quick add
        <>
          <div className="px-3 py-1.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Adicionar Nó</p>
          </div>
          {QUICK_ADD.map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => { onAddNode(type); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              {label}
            </button>
          ))}
        </>
      )}
    </div>
  );
};
