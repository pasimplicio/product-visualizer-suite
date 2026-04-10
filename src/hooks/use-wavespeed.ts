/**
 * Custom Hook: useWaveSpeed
 * --------------------------
 * Gerencia o estado de geração WaveSpeed (imagens e vídeos),
 * consulta de saldo, e histórico de resultados.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  WaveSpeedService,
  WaveSpeedResponse,
  WaveSpeedBalance,
  WaveSpeedImageModel,
  WaveSpeedVideoModel,
} from '@/lib/services/wavespeed-service';

export interface GeneratedResult {
  id: string;
  url: string;
  model: string;
  prompt: string;
  type: 'image' | 'video';
  timestamp: Date;
  creditsUsed?: number;
}

export function useWaveSpeed() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<WaveSpeedBalance | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);

  // Busca o saldo ao montar o hook
  const fetchBalance = useCallback(async () => {
    const bal = await WaveSpeedService.getBalance();
    if (bal) setBalance(bal);
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  /**
   * Gera uma imagem com o modelo e prompt especificados
   */
  const generateImage = useCallback(async (
    prompt: string,
    model: WaveSpeedImageModel = 'seedream-4.0',
    size?: string
  ): Promise<WaveSpeedResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await WaveSpeedService.generateImage({ prompt, model, size });

      if (response.success && response.data) {
        const newResult: GeneratedResult = {
          id: response.data.id,
          url: response.data.output,
          model,
          prompt,
          type: 'image',
          timestamp: new Date(),
          creditsUsed: response.data.credits_used,
        };
        setResults((prev) => [newResult, ...prev]);
        // Atualiza saldo após geração
        fetchBalance();
      } else {
        setError(response.error || 'Falha na geração de imagem.');
      }

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance]);

  /**
   * Gera um vídeo com o modelo e prompt especificados
   */
  const generateVideo = useCallback(async (
    prompt: string,
    model: WaveSpeedVideoModel = 'seedance-1.0-lite',
    options?: { image?: string; duration?: number; aspect_ratio?: string }
  ): Promise<WaveSpeedResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await WaveSpeedService.generateVideo({
        prompt,
        model,
        image: options?.image,
        duration: options?.duration,
        aspect_ratio: options?.aspect_ratio,
      });

      if (response.success && response.data) {
        const newResult: GeneratedResult = {
          id: response.data.id,
          url: response.data.output,
          model,
          prompt,
          type: 'video',
          timestamp: new Date(),
          creditsUsed: response.data.credits_used,
        };
        setResults((prev) => [newResult, ...prev]);
        fetchBalance();
      } else {
        setError(response.error || 'Falha na geração de vídeo.');
      }

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance]);

  /** Limpa o erro atual */
  const clearError = useCallback(() => setError(null), []);

  /** Limpa o histórico de resultados */
  const clearResults = useCallback(() => setResults([]), []);

  return {
    isLoading,
    error,
    balance,
    results,
    generateImage,
    generateVideo,
    fetchBalance,
    clearError,
    clearResults,
  };
}
