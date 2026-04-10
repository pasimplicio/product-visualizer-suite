/**
 * ImageGenerator – Gerador de imagens WaveSpeed AI
 * --------------------------------------------------
 * Componente completo para gerar imagens com modelos WaveSpeed.
 * Inclui seletor de modelo, prompt, grid de resultados,
 * cópia de URL e exibição de saldo.
 */

import React, { useState } from 'react';
import { ModelSelector } from './model-selector';
import { useWaveSpeed } from '@/hooks/use-wavespeed';
import { WaveSpeedImageModel } from '@/lib/services/wavespeed-service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Download,
  ImageIcon,
  Wallet,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export const ImageGenerator: React.FC = () => {
  const [model, setModel] = useState<WaveSpeedImageModel>('seedream-4.0');
  const [prompt, setPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    isLoading,
    error,
    balance,
    results,
    generateImage,
    clearError,
    clearResults,
  } = useWaveSpeed();

  // Filtra apenas resultados de imagem
  const imageResults = results.filter((r) => r.type === 'image');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.warning('Digite um prompt para gerar a imagem.');
      return;
    }

    clearError();
    toast.loading('Gerando imagem com WaveSpeed AI...', { id: 'ws-img-gen' });

    const response = await generateImage(prompt, model);

    if (response.success) {
      toast.success('Imagem gerada com sucesso!', { id: 'ws-img-gen' });
    } else {
      toast.error(response.error || 'Erro na geração.', { id: 'ws-img-gen' });
    }
  };

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('URL copiada!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Falha ao copiar URL.');
    }
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `wavespeed-image-${index}.png`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Saldo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
            <ImageIcon className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Geração de Imagem</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              WaveSpeed AI • Text-to-Image
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
          filterType="image"
          value={model}
          onValueChange={(m) => setModel(m as WaveSpeedImageModel)}
          disabled={isLoading}
        />
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Prompt
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Descreva a imagem que deseja gerar em detalhes..."
          className="min-h-[100px] bg-muted/30 border-border resize-none text-sm placeholder:text-muted-foreground/50"
          disabled={isLoading}
        />
        <p className="text-[10px] text-muted-foreground">
          💡 Dica: Seja específico com cores, estilo, iluminação e composição para melhores resultados.
        </p>
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
        className="w-full h-12 text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando Imagem...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Gerar Imagem
          </span>
        )}
      </Button>

      {/* Grid de Resultados */}
      {imageResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Resultados ({imageResults.length})
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {imageResults.map((result, index) => (
              <Card
                key={result.id}
                className="overflow-hidden border-border bg-muted/20 group hover:border-primary/30 transition-all duration-300"
              >
                {/* Imagem */}
                <div className="relative aspect-square overflow-hidden bg-muted/30">
                  <img
                    src={result.url}
                    alt={`Resultado ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Overlay de ações */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 h-8 text-[10px] font-bold bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        onClick={() => handleCopyUrl(result.url, result.id)}
                      >
                        {copiedId === result.id ? (
                          <><Check className="h-3 w-3 mr-1" /> Copiada</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1" /> Copiar URL</>
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 px-3 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        onClick={() => handleDownload(result.url, index)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Info do resultado */}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase">
                      {result.model}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground ml-auto">
                      {result.timestamp.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{result.prompt}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
