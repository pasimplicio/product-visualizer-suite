import React from 'react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GEMINI_MODELS, getGeminiModelsByType } from '@/lib/services/gemini-models';
import { CREDIT_COSTS } from '@/context/auth-context';
import { useLibrary } from '@/context/library-context';
import {
  Settings2, Play, ChevronDown, Minus, Plus, Globe,
  Sparkles, ImageIcon, Video, Type, Eraser, ArrowUpRight,
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedNode: { id: string; type: string; data: WorkflowNodeData } | null;
  onUpdateNode: (id: string, updates: Partial<WorkflowNodeData>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode,
}) => {
  const { items, openLibrary } = useLibrary();

  if (!selectedNode) {
    return (
      <aside className="w-[280px] bg-popover border-l border-border flex-shrink-0 hidden lg:flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Recentes
          </h3>
          <button onClick={openLibrary} className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors">
            Ver tudo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Settings2 className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground font-medium">
                Selecione um nó ou gere algo novo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.slice(0, 8).map((item) => (
                <div 
                  key={item.id} 
                  className="group relative aspect-square rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={openLibrary}
                >
                  <div className={`w-full h-full ${
                    item.type === 'background-remover' 
                      ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMmEyYTNjIj48L3JlY3Q+CjxyZWN0IHggPSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMmEyYTNjIj48L3JlY3Q+Cjwvc3ZnPg==")] dark:bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMjIyIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMyMjIiPjwvcmVjdD4KPC9zdmc+")]'
                      : 'bg-muted/30'
                  }`}>
                    {item.type === 'video' ? (
                      <video src={item.previewUrl} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    );
  }

  const { id, type, data } = selectedNode;
  const imageModels = getGeminiModelsByType('image');
  const videoModels = getGeminiModelsByType('video');
  const currentModel = GEMINI_MODELS.find((m) => m.id === data.modelId);
  const runCount = data.runCount || 1;

  const getNodeIcon = () => {
    switch (type) {
      case 'prompt': return <Type className="w-4 h-4 text-blue-400" />;
      case 'referenceImage': return <ImageIcon className="w-4 h-4 text-orange-400" />;
      case 'generator': return <Sparkles className="w-4 h-4 text-violet-400" />;
      case 'imageOutput': return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'upscale': return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'backgroundRemover': return <Eraser className="w-4 h-4 text-rose-400" />;
      default: return <Settings2 className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <aside className="w-[280px] bg-popover border-l border-border flex-shrink-0 hidden lg:flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Propriedades</h3>
      </div>

      {/* Node Info */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          {getNodeIcon()}
          <span className="text-sm font-bold text-foreground">{data.label || type}</span>
        </div>
      </div>

      {/* Generator-specific controls */}
      {type === 'generator' && (
        <>
          {/* Model Selection */}
          <div className="px-4 py-3 border-b border-border space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Modelo</label>
            <div className="relative">
              <select
                value={data.modelId || 'nano-banana-2'}
                onChange={(e) => {
                  const model = GEMINI_MODELS.find(m => m.id === e.target.value);
                  onUpdateNode(id, {
                    modelId: e.target.value,
                    modelType: model?.type || 'image',
                  });
                }}
                className="w-full h-9 bg-background border border-input rounded-lg px-3 text-xs text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary/40 hover:bg-accent transition-all"
              >
                <optgroup label="🍌 Imagem — Nano Banana" className="dark:bg-[#1a1a24] dark:text-white bg-white text-black">
                  {imageModels.map((m) => (
                    <option key={m.id} value={m.id} className="dark:bg-[#1a1a24] dark:text-white bg-white text-black">
                      {m.icon} {m.name}{m.hot ? ' 🔥' : ''}{m.exclusive ? ' ★' : ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🎬 Vídeo — Veo 3.1" className="dark:bg-[#1a1a24] dark:text-white bg-white text-black">
                  {videoModels.map((m) => (
                    <option key={m.id} value={m.id} className="dark:bg-[#1a1a24] dark:text-white bg-white text-black">
                      {m.icon} {m.name} {m.hot ? ' 🔥' : ''}{m.exclusive ? ' ★' : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
            {/* Model description */}
            {currentModel && (
              <p className="text-[9px] text-muted-foreground/70 leading-relaxed">
                {currentModel.description}
              </p>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="px-4 py-3 border-b border-border space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Proporção</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(currentModel?.supportedAspectRatios || ['1:1', '2:3', '3:2', '4:3', '9:16', '16:9']).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onUpdateNode(id, { aspectRatio: ratio })}
                  className={`h-8 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 border ${
                    (data.aspectRatio || '1:1') === ratio
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <div className={`border border-current rounded-sm ${
                    ratio === '1:1' ? 'w-2.5 h-2.5' :
                    ratio === '2:3' ? 'w-2 h-3' :
                    ratio === '3:2' ? 'w-3 h-2' :
                    ratio === '4:3' ? 'w-3 h-2.5' :
                    ratio === '3:4' ? 'w-2.5 h-3' :
                    ratio === '9:16' ? 'w-1.5 h-3' :
                    'w-3 h-1.5'
                  }`} />
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution (para vídeo) */}
          {currentModel?.type === 'video' && currentModel.supportedResolutions && (
            <div className="px-4 py-3 border-b border-border space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resolução</label>
              <div className="relative">
                <select
                  value={data.resolution || '720p'}
                  onChange={(e) => onUpdateNode(id, { resolution: e.target.value })}
                  className="w-full h-9 bg-background border border-input rounded-lg px-3 text-xs text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary/40 hover:bg-accent transition-all"
                >
                  {currentModel.supportedResolutions.map((res) => (
                    <option key={res} value={res} className="dark:bg-[#1a1a24] dark:text-white bg-white text-black">
                      {res}{res === '4k' ? ' ★ Premium' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Resolution (para imagem) */}
          {currentModel?.type === 'image' && (
            <div className="px-4 py-3 border-b border-border space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resolução</label>
              <div className="relative">
                <select
                  value={data.resolution || '2K'}
                  onChange={(e) => onUpdateNode(id, { resolution: e.target.value })}
                  className="w-full h-9 bg-background border border-input rounded-lg px-3 text-xs text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary/40 hover:bg-accent transition-all"
                >
                  <option className="dark:bg-[#1a1a24] dark:text-white bg-white text-black" value="1K">1K</option>
                  <option className="dark:bg-[#1a1a24] dark:text-white bg-white text-black" value="2K">2K</option>
                  <option className="dark:bg-[#1a1a24] dark:text-white bg-white text-black" value="4K">4K</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Thinking Level (para Nano Banana Pro) */}
          {currentModel?.id === 'nano-banana-pro' && (
            <div className="px-4 py-3 border-b border-border space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nível de Reflexão</label>
              <div className="relative">
                <select
                  value={data.thinkingLevel || 'Minimal'}
                  onChange={(e) => onUpdateNode(id, { thinkingLevel: e.target.value as any })}
                  className="w-full h-9 bg-background border border-input rounded-lg px-3 text-xs text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary/40 hover:bg-accent transition-all"
                >
                  <option className="dark:bg-[#1a1a24] dark:text-white bg-white text-black" value="Minimal">Mínimo</option>
                  <option className="dark:bg-[#1a1a24] dark:text-white bg-white text-black" value="Standard">Padrão</option>
                  <option className="dark:bg-[#1a1a24] dark:text-white bg-white text-black" value="Deep">Profundo</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Prompt editing for prompt nodes */}
      {type === 'prompt' && (
        <div className="px-4 py-3 border-b border-border space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Texto do Prompt</label>
          <textarea
            value={data.prompt || ''}
            onChange={(e) => onUpdateNode(id, { prompt: e.target.value })}
            className="w-full min-h-[120px] bg-background border border-input rounded-lg p-2.5 text-xs text-foreground resize-y focus:outline-none focus:border-primary/40"
            placeholder="Digite seu prompt..."
          />
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Run Section */}
      {(type === 'generator' || type === 'upscale' || type === 'backgroundRemover') && (
        <div className="p-4 border-t border-border space-y-3">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Executar selecionados</h3>

          {/* Run count */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Qtd. de execuções</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateNode(id, { runCount: Math.max(1, runCount - 1) })}
                className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold text-foreground w-6 text-center">{runCount}</span>
              <button
                onClick={() => onUpdateNode(id, { runCount: Math.min(10, runCount + 1) })}
                className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Run button */}
          <button className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
            <Play className="w-4 h-4" />
            EXECUTAR SELECIONADOS
          </button>
        </div>
      )}
    </aside>
  );
};
