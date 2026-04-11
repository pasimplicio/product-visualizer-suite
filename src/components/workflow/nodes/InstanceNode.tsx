import React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Video,
  Image as ImageIcon,
  Clock,
  RatioIcon,
  Clapperboard,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { cn } from '@/lib/utils';
import {
  WaveSpeedService,
  WAVESPEED_MODELS,
  WaveSpeedModel,
  WaveSpeedImageModel,
  WaveSpeedVideoModel,
} from '@/lib/services/wavespeed-service';
import { toast } from 'sonner';

export const InstanceNode = ({ data, id }: NodeProps<WorkflowNodeData>) => {
  const queryClient = useQueryClient();
  const isGenerating = data.status === 'generating';
  const isCompleted = data.status === 'completed';
  const canGenerate = data.image && !isGenerating;

  // Defaults
  const currentModel = data.aiModel || 'flux-schnell';
  const modelInfo = WAVESPEED_MODELS.find((m) => m.id === currentModel);
  const isVideoModel = modelInfo?.type === 'video';
  const currentDuration = data.videoDuration ?? 5;
  const currentAspectRatio = data.videoAspectRatio ?? '9:16';

  // Grouped models
  const imageModels = WAVESPEED_MODELS.filter((m) => m.type === 'image');
  const videoModels = WAVESPEED_MODELS.filter((m) => m.type === 'video');

  const handleModelChange = (modelId: string) => {
    const model = WAVESPEED_MODELS.find((m) => m.id === modelId);
    data.onUpdate?.(id, {
      aiModel: modelId as WaveSpeedModel,
      generationType: model?.type || 'image',
      // Reset results on model change
      resultImage: undefined,
      resultVideo: undefined,
      status: 'idle',
    });
  };

  const handleGenerate = async () => {
    if (!data.image || !data.onUpdate) return;

    data.onUpdate(id, {
      status: 'generating',
      progress: 5,
      resultImage: undefined,
      resultVideo: undefined,
    });

    try {
      if (isVideoModel) {
        // ─── GERAÇÃO DE VÍDEO ───
        data.onUpdate(id, { progress: 15 });

        const response = await WaveSpeedService.generateVideo({
          prompt: data.prompt || 'Cinematic product showcase',
          model: currentModel as WaveSpeedVideoModel,
          image: data.image, // Usa a imagem do produto como referência
          duration: currentDuration,
          aspect_ratio: currentAspectRatio,
        });

        if (response.success && response.data?.output) {
          data.onUpdate(id, {
            status: 'completed',
            resultVideo: response.data.output,
            progress: 100,
          });
          queryClient.invalidateQueries({ queryKey: ['wavespeed-balance'] });
          toast.success(`Vídeo gerado com sucesso! (${modelInfo?.name})`);
        } else {
          throw new Error(response.error || 'Falha na geração de vídeo');
        }
      } else {
        // ─── GERAÇÃO DE IMAGEM ───
        data.onUpdate(id, { progress: 15 });

        const response = await WaveSpeedService.generateImage({
          prompt: data.prompt || 'Cinematic product photo, studio lighting',
          model: currentModel as WaveSpeedImageModel,
          image: data.image, // Passa a imagem base para image-to-image
        });

        if (response.success && response.data?.output) {
          data.onUpdate(id, {
            status: 'completed',
            resultImage: response.data.output,
            progress: 100,
          });
          queryClient.invalidateQueries({ queryKey: ['wavespeed-balance'] });
          toast.success(`Imagem gerada com sucesso! (${modelInfo?.name})`);
        } else {
          throw new Error(response.error || 'Falha na geração de imagem');
        }
      }
    } catch (err: any) {
      data.onUpdate(id, { status: 'error' });
      const errorMessage = err.message || 'Erro desconhecido';
      toast.error(`Falha na instância ${data.label}`, {
        description: errorMessage,
      });
    }
  };

  const handleDownload = async () => {
    const resultUrl = isVideoModel ? data.resultVideo : data.resultImage;
    if (!resultUrl) return;

    const ext = isVideoModel ? 'mp4' : 'png';
    
    // Abre janela sincronamente para contornar bloqueadores de Popup (que agem em execuções assíncronas)
    const fallbackWindow = window.open('', '_blank');

    try {
      const response = await fetch(resultUrl as string);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `wavespeed-${id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Se o download via blob deu sucesso, fechamos a aba de retenção silently
      if (fallbackWindow) fallbackWindow.close();
    } catch {
      // Se ocorreu erro de CORS no Fetch, navegamos a aba permitida para o Cloudfront URL
      if (fallbackWindow) {
        fallbackWindow.location.href = resultUrl as string;
      }
    }
  };

  const hasResult = isVideoModel ? !!data.resultVideo : !!data.resultImage;

  return (
    <>
      <NodeResizer minWidth={360} minHeight={500} isVisible={data.selected || false} />
      <Card
        className={cn(
          'w-[370px] border-2 bg-card/80 backdrop-blur-xl shadow-2xl p-0 transition-all flex flex-col',
          isGenerating ? 'border-primary animate-pulse shadow-primary/20' : 'border-border',
          isCompleted ? 'border-green-500/50' : ''
        )}
      >
        {/* Handle de Entrada */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-primary border-4 border-background shadow-lg !-left-2 top-1/2"
        />

        {/* ─── HEADER ─── */}
        <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-2">
            {isVideoModel ? (
              <Video className="h-4 w-4 text-cyan-400" />
            ) : (
              <Sparkles className="h-4 w-4 text-violet-400" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">{data.label}</span>
            {modelInfo && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[8px] font-bold uppercase px-1.5 py-0',
                  isVideoModel
                    ? 'border-cyan-500/30 text-cyan-400'
                    : 'border-violet-500/30 text-violet-400'
                )}
              >
                {modelInfo.icon} {modelInfo.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isCompleted && (
              <div className="flex items-center space-x-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-3 w-3" />
                <span>PRONTO</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => data.onDelete?.(id)}
              className="h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="p-4 flex flex-col space-y-4">
          {/* ─── PREVIEW ─── */}
          <div className="relative w-full aspect-[9/16] h-[320px] mx-auto rounded-lg overflow-hidden bg-muted/30 border border-border flex items-center justify-center">
            {/* Resultado de VÍDEO */}
            {data.resultVideo && isVideoModel ? (
              <video
                src={data.resultVideo}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            ) : data.resultImage && !isVideoModel ? (
              /* Resultado de IMAGEM */
              <img src={data.resultImage} alt="Resultado" className="w-full h-full object-cover" />
            ) : data.image ? (
              /* Imagem de referência (do produto) */
              <div className="relative h-full w-full">
                <img
                  src={data.image}
                  alt="Referência"
                  className="w-full h-full object-contain opacity-40 grayscale"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary bg-background/80 px-2 py-1 rounded">
                    SINAL RECEBIDO
                  </span>
                </div>
              </div>
            ) : (
              /* Sem conexão */
              <div className="h-full w-full flex flex-col items-center justify-center space-y-2 opacity-20">
                <RefreshCw className="h-8 w-8" />
                <span className="text-[10px] font-bold uppercase">Aguardando Conexão</span>
              </div>
            )}

            {/* Overlay de Loading */}
            {isGenerating && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <Progress value={data.progress} className="h-1 w-full" />
                <span className="text-[10px] mt-2 font-bold uppercase">
                  {Math.round(data.progress || 0)}% processando
                </span>
              </div>
            )}
          </div>

          {/* ─── SELETOR DE MODELO IA ─── */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Modelo de IA
            </label>
            <Select
              value={currentModel}
              onValueChange={handleModelChange}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-full h-10 bg-muted/30 border-border hover:bg-muted/50 transition-colors text-xs">
                <SelectValue placeholder="Selecione um modelo">
                  {modelInfo && (
                    <div className="flex items-center gap-2">
                      <span>{modelInfo.icon}</span>
                      <span className="font-semibold text-xs">{modelInfo.name}</span>
                      {modelInfo.exclusive && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1 text-[8px] font-bold uppercase bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 border-violet-500/30"
                        >
                          ★
                        </Badge>
                      )}
                      {modelInfo.hot && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1 text-[8px] font-bold uppercase bg-orange-500/20 text-orange-400 border-orange-500/30"
                        >
                          HOT
                        </Badge>
                      )}
                      <span className="text-[9px] text-muted-foreground ml-auto font-mono">
                        {modelInfo.price}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>

              <SelectContent className="max-w-[380px] bg-card/95 backdrop-blur-xl border-border">
                {/* Modelos de Imagem */}
                <SelectGroup>
                  <SelectLabel className="text-[10px] font-bold uppercase tracking-widest text-violet-400 px-2 pb-1">
                    🖼️ Imagem
                  </SelectLabel>
                  {imageModels.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm shrink-0">{model.icon}</span>
                          <span className="text-xs font-semibold truncate">{model.name}</span>
                          {model.exclusive && (
                            <Badge
                              variant="secondary"
                              className="h-3.5 px-1 text-[8px] font-bold bg-violet-500/20 text-violet-300 border-violet-500/30 shrink-0"
                            >
                              Exclusivo
                            </Badge>
                          )}
                          {model.hot && (
                            <Badge
                              variant="secondary"
                              className="h-3.5 px-1 text-[8px] font-bold bg-orange-500/20 text-orange-400 border-orange-500/30 shrink-0"
                            >
                              HOT
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 shrink-0">
                          {model.price}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>

                {/* Modelos de Vídeo */}
                <SelectGroup>
                  <SelectLabel className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 px-2 pb-1 pt-2">
                    🎬 Vídeo
                  </SelectLabel>
                  {videoModels.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm shrink-0">{model.icon}</span>
                          <span className="text-xs font-semibold truncate">{model.name}</span>
                          {model.exclusive && (
                            <Badge
                              variant="secondary"
                              className="h-3.5 px-1 text-[8px] font-bold bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shrink-0"
                            >
                              Exclusivo
                            </Badge>
                          )}
                          {model.hot && (
                            <Badge
                              variant="secondary"
                              className="h-3.5 px-1 text-[8px] font-bold bg-orange-500/20 text-orange-400 border-orange-500/30 shrink-0"
                            >
                              HOT
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 shrink-0">
                          {model.price}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* ─── CONTROLES DE VÍDEO (condicional) ─── */}
          {isVideoModel && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Duração
                </label>
                <Select
                  value={String(currentDuration)}
                  onValueChange={(v) => data.onUpdate?.(id, { videoDuration: parseInt(v) })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-8 bg-muted/30 border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 seg</SelectItem>
                    <SelectItem value="5">5 seg</SelectItem>
                    <SelectItem value="6">6 seg</SelectItem>
                    <SelectItem value="8">8 seg</SelectItem>
                    <SelectItem value="10">10 seg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <RatioIcon className="h-3 w-3" /> Proporção
                </label>
                <Select
                  value={currentAspectRatio}
                  onValueChange={(v) => data.onUpdate?.(id, { videoAspectRatio: v })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-8 bg-muted/30 border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">9:16 Vertical</SelectItem>
                    <SelectItem value="16:9">16:9 Landscape</SelectItem>
                    <SelectItem value="1:1">1:1 Quadrado</SelectItem>
                    <SelectItem value="4:3">4:3 Padrão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ─── PROMPT ─── */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {isVideoModel ? 'Descrição do Vídeo' : 'Configuração POV'}
            </label>
            <Textarea
              value={data.prompt}
              onChange={(e) => data.onUpdate?.(id, { prompt: e.target.value })}
              placeholder={
                isVideoModel
                  ? 'Descreva o movimento, estilo e ambiente do vídeo...'
                  : 'Descreva o cenário detalhadamente...'
              }
              className="min-h-[70px] text-xs bg-muted/50 border-border resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* ─── BOTÕES DE AÇÃO ─── */}
          <div className="flex gap-2 pt-1">
            <Button
              disabled={!canGenerate}
              onClick={handleGenerate}
              className={cn(
                'flex-1 h-9 text-xs font-bold uppercase shadow-lg transition-all',
                isVideoModel
                  ? canGenerate
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 hover:scale-[1.02]'
                    : 'bg-muted text-muted-foreground'
                  : canGenerate
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 hover:scale-[1.02]'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isGenerating ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  GERANDO...
                </span>
              ) : isCompleted ? (
                'GERAR NOVAMENTE'
              ) : isVideoModel ? (
                <span className="flex items-center gap-1.5">
                  <Clapperboard className="h-3.5 w-3.5" />
                  GERAR VÍDEO
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  DISPARAR ACTION
                </span>
              )}
            </Button>

            {isCompleted && hasResult && (
              <Button
                variant="outline"
                className="h-9 px-3 border-border hover:bg-muted"
                onClick={handleDownload}
                title={isVideoModel ? 'Baixar Vídeo' : 'Baixar Imagem'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};
