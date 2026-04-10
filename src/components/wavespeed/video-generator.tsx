/**
 * VideoGenerator – Gerador de vídeos WaveSpeed AI
 * --------------------------------------------------
 * Componente completo para gerar vídeos com modelos WaveSpeed.
 * Suporta text-to-video e image-to-video, com controles de
 * duração, proporção e reprodução inline.
 */

import React, { useState } from 'react';
import { ModelSelector } from './model-selector';
import { useWaveSpeed } from '@/hooks/use-wavespeed';
import { WaveSpeedVideoModel } from '@/lib/services/wavespeed-service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Video,
  Loader2,
  Copy,
  Check,
  Download,
  Wallet,
  Trash2,
  AlertCircle,
  Clapperboard,
  Link2,
  Clock,
  RatioIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export const VideoGenerator: React.FC = () => {
  const [model, setModel] = useState<WaveSpeedVideoModel>('seedance-1.0-lite');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState('5');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    isLoading,
    error,
    balance,
    results,
    generateVideo,
    clearError,
    clearResults,
  } = useWaveSpeed();

  // Filtra apenas resultados de vídeo
  const videoResults = results.filter((r) => r.type === 'video');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.warning('Digite um prompt para gerar o vídeo.');
      return;
    }

    clearError();
    toast.loading('Gerando vídeo com WaveSpeed AI... Isso pode levar alguns minutos.', { id: 'ws-vid-gen' });

    const response = await generateVideo(prompt, model, {
      image: imageUrl || undefined,
      duration: parseInt(duration),
      aspect_ratio: aspectRatio,
    });

    if (response.success) {
      toast.success('Vídeo gerado com sucesso!', { id: 'ws-vid-gen' });
    } else {
      toast.error(response.error || 'Erro na geração.', { id: 'ws-vid-gen' });
    }
  };

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('URL do vídeo copiada!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Falha ao copiar URL.');
    }
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `wavespeed-video-${index}.mp4`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Saldo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
            <Video className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Geração de Vídeo</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              WaveSpeed AI • Text/Image-to-Video
            </p>
          </div>
        </div>

        {balance && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">
              ${balance.balance.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Seletor de Modelo */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Modelo de IA
        </label>
        <ModelSelector
          filterType="video"
          value={model}
          onValueChange={(m) => setModel(m as WaveSpeedVideoModel)}
          disabled={isLoading}
        />
      </div>

      {/* Controles de vídeo: Duração + Proporção */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Clock className="h-3 w-3" /> Duração
          </label>
          <Select value={duration} onValueChange={setDuration} disabled={isLoading}>
            <SelectTrigger className="bg-muted/30 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 segundos</SelectItem>
              <SelectItem value="5">5 segundos</SelectItem>
              <SelectItem value="6">6 segundos</SelectItem>
              <SelectItem value="8">8 segundos</SelectItem>
              <SelectItem value="10">10 segundos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <RatioIcon className="h-3 w-3" /> Proporção
          </label>
          <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isLoading}>
            <SelectTrigger className="bg-muted/30 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9:16">9:16 (TikTok / Reels)</SelectItem>
              <SelectItem value="16:9">16:9 (YouTube / Landscape)</SelectItem>
              <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
              <SelectItem value="4:3">4:3 (Padrão)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* URL de imagem (para image-to-video) */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <Link2 className="h-3 w-3" /> Imagem de Referência (Opcional)
        </label>
        <div className="relative">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... URL da imagem para image-to-video"
            className="w-full h-10 px-3 text-sm bg-muted/30 border border-border rounded-md placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            disabled={isLoading}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          🎞️ Insira uma URL de imagem para gerar o vídeo a partir dela, ou deixe em branco para text-to-video.
        </p>
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Prompt
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Descreva o vídeo que deseja gerar: movimento, estilo, ambiente..."
          className="min-h-[100px] bg-muted/30 border-border resize-none text-sm placeholder:text-muted-foreground/50"
          disabled={isLoading}
        />
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Botão de Geração */}
      <Button
        onClick={handleGenerate}
        disabled={isLoading || !prompt.trim()}
        className="w-full h-12 text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando Vídeo...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Clapperboard className="h-4 w-4" />
            Gerar Vídeo
          </span>
        )}
      </Button>

      {/* Resultados */}
      {videoResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Vídeos Gerados ({videoResults.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResults}
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>

          <div className="space-y-4">
            {videoResults.map((result, index) => (
              <Card
                key={result.id}
                className="overflow-hidden border-border bg-muted/20 group hover:border-cyan-500/30 transition-all duration-300"
              >
                {/* Player de vídeo */}
                <div className="relative bg-black rounded-t-lg overflow-hidden">
                  <video
                    src={result.url}
                    controls
                    className="w-full aspect-video"
                    preload="metadata"
                    playsInline
                  />
                </div>

                {/* Info e Ações */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-bold uppercase border-cyan-500/30 text-cyan-400"
                    >
                      {result.model}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground ml-auto">
                      {result.timestamp.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{result.prompt}</p>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-[10px] font-bold border-border hover:bg-muted/50"
                      onClick={() => handleCopyUrl(result.url, result.id)}
                    >
                      {copiedId === result.id ? (
                        <><Check className="h-3 w-3 mr-1" /> URL Copiada</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" /> Copiar URL</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 border-border hover:bg-muted/50"
                      onClick={() => handleDownload(result.url, index)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
