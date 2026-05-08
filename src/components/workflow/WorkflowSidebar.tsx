import React, { useState } from 'react';
import {
  LayoutGrid, Boxes, Search, FolderOpen, Wand2,
  Type, ImageIcon, Sparkles, Video, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';

interface WorkflowSidebarProps {
  onAddNode: (type: string) => void;
  onExport?: () => void;
}

const SIDEBAR_TABS = [
  { id: 'content', icon: LayoutGrid, label: 'Content' },
  { id: 'nodes',   icon: Boxes,      label: 'Nodes'   },
  { id: 'search',  icon: Search,     label: 'Search'  },
  { id: 'assets',  icon: FolderOpen, label: 'Assets'  },
  { id: 'builder', icon: Wand2,      label: 'Builder' },
];

const NODE_CATALOG = [
  {
    category: 'Entrada',
    nodes: [
      { type: 'referenceImage', name: 'Entrada de Imagem', icon: ImageIcon, color: 'text-orange-400', bg: 'bg-orange-500/10' },
      { type: 'prompt',         name: 'Prompt',            icon: Type,      color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    ],
  },
  {
    category: 'Saída',
    nodes: [
      { type: 'imageOutput', name: 'Saída de Imagem', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10' },
      { type: 'videoOutput', name: 'Saída de Vídeo',  icon: Video,    color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
    ],
  },
];

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({ onAddNode }) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      {/* Icon bar */}
      <div className="w-12 bg-muted border-r border-border flex flex-col items-center py-3 gap-1.5">
        {SIDEBAR_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(isActive ? null : tab.id)}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
              title={tab.label}
            >
              <Icon className="w-4 h-4" />
              {/* Tooltip */}
              <span className="absolute left-12 px-2 py-1 rounded-md bg-popover border border-border text-[10px] font-medium text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expandable panel */}
      {activeTab && (
        <div className="w-56 bg-popover border-r border-border flex flex-col overflow-hidden animate-in slide-in-from-left-2 duration-200">
          <div className="px-3 py-3 border-b border-border">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {SIDEBAR_TABS.find(t => t.id === activeTab)?.label}
            </h3>
          </div>

          {activeTab === 'nodes' && (
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
              {NODE_CATALOG.map((category) => (
                <div key={category.category}>
                  <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5">
                    {category.category}
                  </h4>
                  <div className="space-y-1">
                    {category.nodes.map((node) => {
                      const Icon = node.icon;
                      return (
                        <button
                          key={node.type}
                          onClick={() => onAddNode(node.type)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-all group text-left"
                        >
                          <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', node.bg)}>
                            <Icon className={cn('w-3.5 h-3.5', node.color)} />
                          </div>
                          <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                            {node.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Quota Google (API)
                  </h4>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold">ATIVA</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-[10px] font-bold text-violet-400 mb-1 tracking-tight">Plano Profissional (Pay-as-you-go)</p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Você ativou o faturamento. O sistema agora utiliza os modelos Gemini 2.5 e 3.1 com velocidade e qualidade prioritárias.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">Status do Faturamento</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">ATIVO</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">Velocidade de Geração</span>
                    <span className="text-[10px] font-mono font-bold text-violet-400">MÁXIMA</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Tokens por Minuto</span>
                    <span className="text-[10px] font-mono font-bold text-blue-400">1.0M</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="px-2 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar nós..."
                  className="w-full h-8 bg-background border border-input rounded-lg pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
                />
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="flex-1 flex items-center justify-center px-4">
              <p className="text-[10px] text-muted-foreground text-center font-medium">
                Arraste imagens e vídeos para cá
              </p>
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
              <p className="text-[9px] text-muted-foreground px-1 pb-1 uppercase tracking-widest font-bold">Templates</p>
              {WORKFLOW_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => window.dispatchEvent(new CustomEvent('workflow-load-template', { detail: { templateId: tmpl.id } }))}
                  className="w-full text-left p-2.5 rounded-xl border border-border bg-background/50 hover:bg-accent hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{tmpl.emoji}</span>
                    <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">{tmpl.name}</span>
                    <Play className="w-2.5 h-2.5 text-muted-foreground/0 group-hover:text-primary/60 transition-colors ml-auto" />
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed pl-6">{tmpl.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
