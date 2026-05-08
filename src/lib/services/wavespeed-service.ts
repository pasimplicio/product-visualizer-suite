/**
 * WaveSpeed AI Service — ProductSuite
 * ------------------------------------
 * Geração de imagens (Flux, HiDream) e vídeos (Wan2.1) via WaveSpeed AI.
 *
 * Auth: Bearer token via VITE_WAVESPEED_API_KEY
 * Base: https://api.wavespeed.ai/api/v2
 * Dev proxy: /api/wavespeed  (vite.config.ts)
 */

// ─── Tipos de modelo ──────────────────────────────────────────────────────────

export type WaveSpeedImageModel =
  | 'wavespeed-ai/flux-schnell'
  | 'wavespeed-ai/flux-dev'
  | 'wavespeed-ai/hidream-i1-full'
  | 'wavespeed-ai/flux-dev-lora';

export type WaveSpeedVideoModel =
  | 'wavespeed-ai/wan2.1-i2v-480p'
  | 'wavespeed-ai/wan2.1-i2v-720p';

export type WaveSpeedModel = WaveSpeedImageModel | WaveSpeedVideoModel;

export interface WaveSpeedModelInfo {
  id: WaveSpeedModel;
  name: string;
  type: 'image' | 'video';
  icon: string;
  price: string;
  hot?: boolean;
  exclusive?: boolean;
}

export const WAVESPEED_MODELS: WaveSpeedModelInfo[] = [
  // ─── Imagem ───
  {
    id: 'wavespeed-ai/flux-schnell',
    name: 'Flux Schnell',
    type: 'image',
    icon: '⚡',
    price: '$0.003',
    hot: true,
  },
  {
    id: 'wavespeed-ai/flux-dev',
    name: 'Flux Dev',
    type: 'image',
    icon: '🎨',
    price: '$0.025',
  },
  {
    id: 'wavespeed-ai/hidream-i1-full',
    name: 'HiDream I1',
    type: 'image',
    icon: '✨',
    price: '$0.05',
    exclusive: true,
  },
  {
    id: 'wavespeed-ai/flux-dev-lora',
    name: 'Flux Dev LoRA',
    type: 'image',
    icon: '🔧',
    price: '$0.03',
  },
  // ─── Vídeo ───
  {
    id: 'wavespeed-ai/wan2.1-i2v-480p',
    name: 'Wan2.1 480p',
    type: 'video',
    icon: '🎬',
    price: '$0.08',
    hot: true,
  },
  {
    id: 'wavespeed-ai/wan2.1-i2v-720p',
    name: 'Wan2.1 720p',
    type: 'video',
    icon: '🎬',
    price: '$0.16',
    exclusive: true,
  },
];

// ─── Interfaces de configuração ────────────────────────────────────────────────

export interface WaveSpeedImageConfig {
  prompt: string;
  model: WaveSpeedImageModel;
  image?: string;        // data URL ou URL pública da imagem de referência
  num_outputs?: number;
  aspect_ratio?: string;
  seed?: number;
}

export interface WaveSpeedVideoConfig {
  prompt: string;
  model: WaveSpeedVideoModel;
  image: string;         // imagem de referência obrigatória para i2v
  duration?: number;     // segundos (3–10)
  aspect_ratio?: string; // '16:9' | '9:16' | '1:1' | '4:3'
}

export interface WaveSpeedResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WaveSpeedPredictionOutput {
  output: string;  // URL do resultado (imagem ou vídeo)
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  id: string;
}

export interface WaveSpeedBalanceData {
  balance: number;
  currency: string;
}

// ─── Serviço ────────────────────────────────────────────────────────────────

export class WaveSpeedService {
  private static apiKey = import.meta.env.VITE_WAVESPEED_API_KEY || '';

  private static getBaseUrl(): string {
    return import.meta.env.DEV ? '/api/wavespeed' : 'https://api.wavespeed.ai';
  }

  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  static isAvailable(): boolean {
    return !!this.apiKey;
  }

  // ─── Criar predição ──────────────────────────────────────────────────────

  private static async createPrediction(
    model: WaveSpeedModel,
    input: Record<string, unknown>
  ): Promise<WaveSpeedResponse<{ id: string }>> {
    if (!this.apiKey) {
      return { success: false, error: 'WaveSpeed API Key não configurada. Adicione VITE_WAVESPEED_API_KEY no .env' };
    }

    try {
      const url = `${this.getBaseUrl()}/api/v2/predictions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ model, input }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData?.detail || errData?.error || `Erro HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data: { id: data.id } };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão com WaveSpeed' };
    }
  }

  // ─── Polling de predição ─────────────────────────────────────────────────

  private static async pollPrediction(
    id: string,
    onProgress?: (p: number) => void,
    maxAttempts = 60,
    intervalMs = 5000
  ): Promise<WaveSpeedResponse<WaveSpeedPredictionOutput>> {
    for (let i = 0; i < maxAttempts; i++) {
      onProgress?.(Math.min(15 + (i / maxAttempts) * 80, 92));
      await new Promise((r) => setTimeout(r, intervalMs));

      try {
        const url = `${this.getBaseUrl()}/api/v2/predictions/${id}`;
        const response = await fetch(url, { headers: this.getHeaders() });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { success: false, error: errData?.detail || `Polling falhou (${response.status})` };
        }

        const data = await response.json();

        if (data.status === 'succeeded' && data.output) {
          onProgress?.(100);
          const output: string = Array.isArray(data.output) ? data.output[0] : data.output;
          return { success: true, data: { id, output, status: 'succeeded' } };
        }

        if (data.status === 'failed') {
          return { success: false, error: data.error || 'Geração falhou no servidor WaveSpeed.' };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'Timeout: operação WaveSpeed demorou demais.' };
  }

  // ─── Geração de imagem ────────────────────────────────────────────────────

  static async generateImage(
    config: WaveSpeedImageConfig,
    onProgress?: (p: number) => void
  ): Promise<WaveSpeedResponse<WaveSpeedPredictionOutput>> {
    const input: Record<string, unknown> = {
      prompt: config.prompt,
      num_outputs: config.num_outputs ?? 1,
    };

    if (config.image) input.image = config.image;
    if (config.aspect_ratio) input.aspect_ratio = config.aspect_ratio;
    if (config.seed !== undefined) input.seed = config.seed;

    onProgress?.(5);
    const init = await this.createPrediction(config.model, input);
    if (!init.success || !init.data?.id) return { success: false, error: init.error };

    onProgress?.(10);
    return this.pollPrediction(init.data.id, onProgress, 40, 3000);
  }

  // ─── Geração de vídeo ─────────────────────────────────────────────────────

  static async generateVideo(
    config: WaveSpeedVideoConfig,
    onProgress?: (p: number) => void
  ): Promise<WaveSpeedResponse<WaveSpeedPredictionOutput>> {
    const input: Record<string, unknown> = {
      prompt: config.prompt,
      image: config.image,
      num_frames: config.duration ? config.duration * 24 : 5 * 24,
    };

    if (config.aspect_ratio) input.aspect_ratio = config.aspect_ratio;

    onProgress?.(5);
    const init = await this.createPrediction(config.model, input);
    if (!init.success || !init.data?.id) return { success: false, error: init.error };

    onProgress?.(10);
    return this.pollPrediction(init.data.id, onProgress, 60, 8000);
  }

  // ─── Saldo ────────────────────────────────────────────────────────────────

  static async getBalance(): Promise<WaveSpeedResponse<WaveSpeedBalanceData>> {
    if (!this.apiKey) return { success: false, error: 'API Key não configurada' };

    try {
      const url = `${this.getBaseUrl()}/api/v2/balance`;
      const response = await fetch(url, { headers: this.getHeaders() });

      if (!response.ok) return { success: false, error: `Erro ${response.status}` };

      const data = await response.json();
      return { success: true, data: { balance: data.balance ?? data.credits ?? 0, currency: data.currency ?? 'USD' } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
