import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Type, ImageIcon, Sparkles, ArrowUpRight,
  Eraser, Video, Clapperboard, Code2, StickyNote, Layers,
  LayoutGrid, Wand2, X, GitBranch, RefreshCw, Globe, Timer,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAddNode: (type: string) => void;
}

const ALL_NODES = [
  { type: 'prompt',           name: 'Prompt',            icon: Type,         color: 'text-blue-400',    desc: 'Bloco de texto para prompt' },
  { type: 'referenceImage',   name: 'Imagem de Referência', icon: ImageIcon, color: 'text-orange-400',  desc: 'Carrega uma imagem de referência' },
  { type: 'text2image',       name: 'Text → Image',      icon: ImageIcon,    color: 'text-violet-400',  desc: 'Gera imagem a partir de texto' },
  { type: 'image2image',      name: 'Image → Image',     icon: Wand2,        color: 'text-fuchsia-400', desc: 'Transforma uma imagem usando IA' },
  { type: 'text2video',       name: 'Text → Video',      icon: Video,        color: 'text-cyan-400',    desc: 'Gera vídeo a partir de texto' },
  { type: 'image2video',      name: 'Image → Video',     icon: Clapperboard, color: 'text-teal-400',    desc: 'Anima uma imagem com IA' },
  { type: 'upscale',          name: 'Upscale',           icon: ArrowUpRight, color: 'text-amber-400',   desc: 'Aumenta a resolução da imagem' },
  { type: 'backgroundRemover',name: 'Remover Fundo',     icon: Eraser,       color: 'text-rose-400',    desc: 'Remove o fundo da imagem' },
  { type: 'merge',            name: 'Merge / Composite', icon: Layers,       color: 'text-purple-400',  desc: 'Combina duas imagens com IA' },
  { type: 'promptBuilder',    name: 'Prompt Builder',    icon: Code2,        color: 'text-blue-400',    desc: 'Template com variáveis {{var}}' },
  { type: 'note',             name: 'Nota',              icon: StickyNote,   color: 'text-amber-400',   desc: 'Bloco de anotação no canvas' },
  { type: 'gallery',          name: 'Galeria',           icon: LayoutGrid,   color: 'text-indigo-400',  desc: 'Coleta e exibe múltiplas imagens' },
  { type: 'generator',        name: 'Gerador (legado)',  icon: Sparkles,     color: 'text-violet-400',  desc: 'Gerador unificado imagem/vídeo' },
  { type: 'instance',         name: 'WaveSpeed',         icon: Sparkles,     color: 'text-orange-400',  desc: 'Geração via Flux, HiDream e Wan2.1' },
  { type: 'condition',        name: 'Condição',          icon: GitBranch,    color: 'text-yellow-400',  desc: 'Bifurca o fluxo com verdadeiro/falso' },
  { type: 'iterator',         name: 'Iterador',          icon: RefreshCw,    color: 'text-lime-400',    desc: 'Itera sobre lista de variações de prompt' },
  { type: 'httpRequest',      name: 'HTTP Request',      icon: Globe,        color: 'text-sky-400',     desc: 'Chama API externa com GET/POST/etc' },
  { type: 'delay',            name: 'Delay',             icon: Timer,        color: 'text-slate-400',   desc: 'Aguarda N segundos antes de continuar' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, onAddNode }) => {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? ALL_NODES.filter(
        (n) =>
          n.name.toLowerCase().includes(query.toLowerCase()) ||
          n.desc.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_NODES;

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => setHighlighted(0), [query]);

  const select = (type: string) => {
    onAddNode(type);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && filtered[highlighted]) select(filtered[highlighted].type);
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-[520px] bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar nós... (ex: imagem, vídeo, upscale)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[11px] text-muted-foreground py-6">Nenhum nó encontrado</p>
          ) : (
            filtered.map((node, i) => {
              const Icon = node.icon;
              return (
                <button
                  key={node.type}
                  onClick={() => select(node.type)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                    i === highlighted ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${node.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground">{node.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{node.desc}</p>
                  </div>
                  {i === highlighted && (
                    <span className="text-[9px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">↵</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center gap-3">
          <span className="text-[9px] text-muted-foreground">↑↓ navegar</span>
          <span className="text-[9px] text-muted-foreground">↵ adicionar</span>
          <span className="text-[9px] text-muted-foreground">Esc fechar</span>
        </div>
      </div>
    </div>
  );
};
