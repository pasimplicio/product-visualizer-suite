import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Video, Loader2, CheckCircle2, Play, RotateCcw, Trash2, GripVertical, Download } from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GeminiService } from '@/lib/services/gemini-service';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

const MODELS = [
  { id: 'veo-3.1-lite', label: 'Veo 3.1 Lite', badge: '⚡' },
  { id: 'veo-3.1',      label: 'Veo 3.1',      badge: '★' },
];
const ASPECT_RATIOS = ['16:9', '9:16'];
const RESOLUTIONS  = ['720p', '1080p'];

export const VideoOutputNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const { addLibraryItem } = useLibrary();
  const isGenerating = data.status === 'generating';
  const isCompleted  = data.status === 'completed';
  const canRun = !isGenerating && !!(data.image);

  const update = useCallback((updates: Partial<WorkflowNodeData>) => {
    window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
    data.onUpdate?.(id, updates);
  }, [id, data.onUpdate]);

  const handleRun = async () => {
    if (!canRun) return;
    update({ status: 'generating', progress: 5, resultVideo: undefined });
    try {
      const init = await GeminiService.generateVideo({
        prompt: (data.prompt as string) || 'Smooth cinematic motion, professional lighting',
        modelId: (data.modelId as string) || 'veo-3.1-lite',
        referenceImage: data.image as string,
        aspectRatio: (data.aspectRatio as string) || '16:9',
        resolution: (data.resolution as string) || '720p',
      });
      if (!init.success || !init.data?.operationName) throw new Error(init.error);
      update({ progress: 20 });
      const poll = await GeminiService.pollVideoResult(init.data.operationName, (p) => update({ progress: p }));
      if (!poll.success || !poll.data?.videoUrl) throw new Error(poll.error);
      update({ status: 'completed', resultVideo: poll.data.videoUrl, progress: 100 });
      addLibraryItem(poll.data.videoUrl, 'video', data.prompt as string);
      toast.success('Vídeo gerado!');
    } catch (err: any) {
      update({ status: 'error', progress: 0 });
      toast.error('Erro ao gerar vídeo', { description: err.message });
    }
  };

  const handleDownload = async () => {
    if (!data.resultVideo) return;
    try {
      const res = await fetch(data.resultVideo as string);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `video-${id}.mp4`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(data.resultVideo as string, '_blank');
    }
  };

  return (
    <div className={`w-[260px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
      isGenerating ? 'border-cyan-500/50 ring-1 ring-cyan-500/20'
      : isCompleted ? 'border-emerald-500/40'
      : selected  ? 'border-cyan-500/50 ring-1 ring-cyan-500/20'
      : 'border-border hover:border-border/60'
    }`}>
      <Handle type="target" position={Position.Left} id="image-in"
        style={{ top: '35%' }}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-[3px] !border-background !shadow-lg !-left-[7px]" />
      <Handle type="target" position={Position.Left} id="prompt-in"
        style={{ top: '60%' }}
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-[3px] !border-background !shadow-lg !-left-[7px]" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-cyan-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
          <Video className="w-3 h-3 text-cyan-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Saída de Vídeo
        </span>
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {/* Controls */}
        <div className="flex gap-1.5">
          <select value={(data.modelId as string) || 'veo-3.1-lite'}
            onChange={(e) => { e.stopPropagation(); update({ modelId: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 h-7 bg-background border border-input rounded-lg px-2 text-[10px] text-foreground focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.badge} {m.label}</option>)}
          </select>
          <select value={(data.aspectRatio as string) || '16:9'}
            onChange={(e) => { e.stopPropagation(); update({ aspectRatio: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="w-[60px] h-7 bg-background border border-input rounded-lg px-1.5 text-[10px] text-foreground focus:outline-none appearance-none cursor-pointer">
            {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={(data.resolution as string) || '720p'}
            onChange={(e) => { e.stopPropagation(); update({ resolution: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="w-[58px] h-7 bg-background border border-input rounded-lg px-1.5 text-[10px] text-foreground focus:outline-none appearance-none cursor-pointer">
            {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Input indicators */}
        <div className="flex gap-2 text-[9px]">
          <span className={`flex items-center gap-1 ${data.image ? 'text-orange-400' : 'text-muted-foreground/40'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
            Imagem {!data.image && '(obrigatório)'}
          </span>
          <span className={`flex items-center gap-1 ${data.prompt ? 'text-blue-400' : 'text-muted-foreground/40'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
            Prompt
          </span>
        </div>

        {/* Result video */}
        {data.resultVideo && (
          <div className="relative w-full rounded-lg overflow-hidden bg-background/50 border border-input">
            <video src={data.resultVideo as string} controls playsInline
              className="w-full rounded-lg" style={{ maxHeight: 160 }} />
            <button onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border/50">
              <Download className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Loading */}
        {isGenerating && !data.resultVideo && (
          <div className="w-full h-20 rounded-lg bg-background/50 border border-input flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <div className="w-3/4 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${data.progress || 0}%` }} />
            </div>
            <span className="text-[8px] text-muted-foreground">Pode levar alguns minutos...</span>
          </div>
        )}

        {/* Run button */}
        <button disabled={!canRun}
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          className={`w-full h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            isGenerating ? 'bg-cyan-500/20 text-cyan-400 cursor-wait'
            : canRun ? 'bg-cyan-500 text-white hover:bg-cyan-400 active:scale-[0.98] shadow-lg shadow-cyan-500/20'
            : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}>
          {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</>
           : isCompleted  ? <><RotateCcw className="w-3 h-3" /> Gerar Novamente</>
           :                <><Play className="w-3 h-3" /> Gerar Vídeo</>}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="video-out"
        className="!w-3.5 !h-3.5 !bg-cyan-500 !border-[3px] !border-background !shadow-lg !-right-[7px]" />
    </div>
  );
};
