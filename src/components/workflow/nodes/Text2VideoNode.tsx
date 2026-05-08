import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Video, Loader2, CheckCircle2, Play,
  RotateCcw, Trash2, Download, GripVertical,
} from 'lucide-react';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { GEMINI_MODELS, getGeminiModel } from '@/lib/services/gemini-models';
import { GeminiService } from '@/lib/services/gemini-service';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

const VIDEO_MODELS = GEMINI_MODELS.filter((m) => m.type === 'video');
const ASPECT_RATIOS = ['16:9', '9:16'];
const RESOLUTIONS = ['720p', '1080p'];

export const Text2VideoNode = ({ data, id, selected }: NodeProps<WorkflowNodeData>) => {
  const { addLibraryItem } = useLibrary();
  const isGenerating = data.status === 'generating';
  const isCompleted = data.status === 'completed';
  const modelInfo = getGeminiModel(data.modelId as string) ?? VIDEO_MODELS[0];
  const canRun = !isGenerating && !!data.prompt;

  const update = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      window.dispatchEvent(new CustomEvent('workflow-node-update', { detail: { id, updates } }));
      data.onUpdate?.(id, updates);
    },
    [id, data.onUpdate]
  );

  const handleRun = async () => {
    if (!canRun) return;
    update({ status: 'generating', progress: 5, resultVideo: undefined });
    try {
      const init = await GeminiService.generateVideo({
        prompt: data.prompt as string,
        modelId: modelInfo.id,
        aspectRatio: (data.aspectRatio as string) || '16:9',
        resolution: (data.resolution as string) || '720p',
      });
      if (!init.success || !init.data?.operationName) throw new Error(init.error);

      update({ progress: 20 });
      const poll = await GeminiService.pollVideoResult(init.data.operationName, (p) =>
        update({ progress: p })
      );
      if (!poll.success || !poll.data?.videoUrl) throw new Error(poll.error);

      update({ status: 'completed', resultVideo: poll.data.videoUrl, progress: 100 });
      addLibraryItem(poll.data.videoUrl, 'video', data.prompt as string);
      toast.success('Vídeo gerado!');
    } catch (err: any) {
      update({ status: 'error', progress: 0 });
      toast.error('Erro na geração de vídeo', { description: err.message });
    }
  };

  const handleDownload = () => {
    if (!data.resultVideo) return;
    const a = document.createElement('a');
    a.href = data.resultVideo as string;
    a.download = `t2v-${id}.mp4`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div
      className={`w-[260px] rounded-xl border transition-all duration-300 shadow-2xl bg-card/80 backdrop-blur-xl ${
        isGenerating
          ? 'border-cyan-500/50 ring-1 ring-cyan-500/20 animate-pulse'
          : isCompleted
          ? 'border-emerald-500/40'
          : selected
          ? 'border-cyan-500/50 ring-1 ring-cyan-500/20'
          : 'border-border hover:border-border/60'
      }`}
    >
      <Handle type="target" position={Position.Left} id="prompt-in"
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-[3px] !border-background !shadow-lg !-left-[7px]"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl bg-cyan-500/[0.03]">
        <GripVertical className="w-3 h-3 text-muted-foreground/20 cursor-grab" />
        <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
          <Video className="w-3 h-3 text-cyan-400" />
        </div>
        <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider flex-1">
          Text → Video
        </span>
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(id); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Settings */}
      <div className="px-3 pt-2.5 pb-1 flex gap-2">
        <select value={(data.modelId as string) || VIDEO_MODELS[0].id}
          onChange={(e) => update({ modelId: e.target.value })}
          className="flex-1 h-7 bg-background border border-input rounded-lg px-2 text-[10px] text-foreground focus:outline-none cursor-pointer">
          {VIDEO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </select>
        <select value={(data.aspectRatio as string) || '16:9'}
          onChange={(e) => update({ aspectRatio: e.target.value })}
          className="w-16 h-7 bg-background border border-input rounded-lg px-1 text-[10px] text-foreground focus:outline-none cursor-pointer">
          {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={(data.resolution as string) || '720p'}
          onChange={(e) => update({ resolution: e.target.value })}
          className="w-16 h-7 bg-background border border-input rounded-lg px-1 text-[10px] text-foreground focus:outline-none cursor-pointer">
          {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Preview */}
      <div className="px-3 pb-1">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-background/50 border border-input flex items-center justify-center">
          {data.resultVideo ? (
            <video src={data.resultVideo as string} controls playsInline className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground/30">
              <Video className="w-8 h-8" />
              <span className="text-[9px]">{data.prompt ? 'Pronto para gerar' : 'Aguardando prompt'}</span>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              <div className="w-3/4 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${data.progress || 0}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground">{Math.round((data.progress as number) || 0)}% · processando...</span>
            </div>
          )}
          {isCompleted && data.resultVideo && (
            <button onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all border border-border/50">
              <Download className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Run */}
      <div className="px-3 pb-3 pt-2">
        <button disabled={!canRun}
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          className={`w-full h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            isGenerating ? 'bg-cyan-500/20 text-cyan-400 cursor-wait' :
            canRun ? 'bg-cyan-500 text-white hover:bg-cyan-400 active:scale-[0.98] shadow-lg shadow-cyan-500/20' :
            'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}>
          {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando vídeo...</> :
           isCompleted  ? <><RotateCcw className="w-3 h-3" /> Gerar Novamente</> :
                          <><Play className="w-3 h-3" /> Gerar Vídeo</>}
        </button>
        <p className="text-[8px] text-center text-muted-foreground/40 mt-1">⏱ Pode demorar alguns minutos</p>
      </div>

      <Handle type="source" position={Position.Right} id="video-out"
        className="!w-3.5 !h-3.5 !bg-cyan-500 !border-[3px] !border-background !shadow-lg !-right-[7px]"
      />
    </div>
  );
};
