/**
 * WaveSpeed AI Service
 * ---------------------
 * Serviço para integração com a API WaveSpeed.ai (v3).
 * Suporta geração de imagens e vídeos com múltiplos modelos.
 */

// =============================================
// TIPOS E INTERFACES
// =============================================

/** Modelos de geração de IMAGEM */
export type WaveSpeedImageModel =
  | 'seedream-4.0'
  | 'flux-dev'
  | 'flux-schnell';

/** Modelos de geração de VÍDEO */
export type WaveSpeedVideoModel =
  | 'seedance-1.0-lite'
  | 'hailuo-02'
  | 'kling-v2.1'
  | 'wan-2.5'
  | 'veo3-fast';

/** Union de todos os modelos */
export type WaveSpeedModel = WaveSpeedImageModel | WaveSpeedVideoModel;

/** Tipo do modelo (image ou video) */
export type WaveSpeedModelType = 'image' | 'video';

/** Informações de um modelo WaveSpeed */
export interface WaveSpeedModelInfo {
  id: WaveSpeedModel;
  name: string;
  type: WaveSpeedModelType;
  description: string;
  price: string;
  endpoint: string;
  exclusive: boolean;
  icon: string; // Emoji ou ícone representativo
}

/** Resposta padronizada da API WaveSpeed */
export interface WaveSpeedResponse {
  success: boolean;
  data?: {
    id: string;
    output: string; // URL do resultado (imagem ou vídeo)
    status: string;
    credits_used?: number;
    createdAt?: string;
  };
  error?: string;
}

/** Resposta de saldo da conta */
export interface WaveSpeedBalance {
  balance: number;
  currency: string;
}

/** Parâmetros para geração de imagem */
export interface ImageGenerationParams {
  prompt: string;
  model: WaveSpeedImageModel;
  size?: string;
  num_inference_steps?: number;
  seed?: number;
}

/** Parâmetros para geração de vídeo */
export interface VideoGenerationParams {
  prompt: string;
  model: WaveSpeedVideoModel;
  image?: string; // URL da imagem para image-to-video (opcional)
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
}

// =============================================
// CATÁLOGO DE MODELOS
// =============================================

/** Catálogo completo de modelos WaveSpeed disponíveis */
export const WAVESPEED_MODELS: WaveSpeedModelInfo[] = [
  // ─── MODELOS DE IMAGEM ───
  {
    id: 'seedream-4.0',
    name: 'Seedream 4.0',
    type: 'image',
    description: 'Modelo exclusivo ByteDance para imagens de alta qualidade com detalhamento superior.',
    price: '$0.027/img',
    endpoint: '/bytedance/seedream-4.0/txt2img',
    exclusive: true,
    icon: '🌱',
  },
  {
    id: 'flux-dev',
    name: 'FLUX 1.1 Dev',
    type: 'image',
    description: 'Modelo Black Forest Labs otimizado para desenvolvimento e iteração rápida.',
    price: '$0.025/img',
    endpoint: '/black-forest-labs/flux-1.1-dev/txt2img',
    exclusive: false,
    icon: '⚡',
  },
  {
    id: 'flux-schnell',
    name: 'FLUX 1.1 Schnell',
    type: 'image',
    description: 'Geração ultra-rápida com custo mínimo. Ideal para prototipação.',
    price: '$0.003/img',
    endpoint: '/black-forest-labs/flux-1.1-schnell/txt2img',
    exclusive: false,
    icon: '🚀',
  },

  // ─── MODELOS DE VÍDEO ───
  {
    id: 'seedance-1.0-lite',
    name: 'Seedance 1.0 Lite',
    type: 'video',
    description: 'Modelo exclusivo ByteDance para vídeos curtos com fidelidade visual impressionante.',
    price: '$0.08/5s',
    endpoint: '/bytedance/seedance-1.0-lite/txt2video',
    exclusive: true,
    icon: '🎬',
  },
  {
    id: 'hailuo-02',
    name: 'Hailuo 02',
    type: 'video',
    description: 'MiniMax Hailuo para vídeos com movimento natural e cinematográfico.',
    price: '$0.23/6s',
    endpoint: '/minimax/hailuo-02/t2v-standard',
    exclusive: false,
    icon: '🌊',
  },
  {
    id: 'kling-v2.1',
    name: 'Kling v2.1',
    type: 'video',
    description: 'Geração de vídeo de alta fidelidade com movimentos realistas.',
    price: '$0.25/5s',
    endpoint: '/kling/kling-v2-1/txt2video',
    exclusive: false,
    icon: '🎥',
  },
  {
    id: 'wan-2.5',
    name: 'WAN 2.5',
    type: 'video',
    description: 'Modelo exclusivo com excelente compreensão de cena e consistência temporal.',
    price: '$0.25/5s',
    endpoint: '/wan/wan-2.5/t2v',
    exclusive: true,
    icon: '🎞️',
  },
  {
    id: 'veo3-fast',
    name: 'Veo 3 Fast (Google)',
    type: 'video',
    description: 'Modelo Google de última geração para vídeos cinematográficos de alta resolução.',
    price: '$1.20/8s',
    endpoint: '/google/veo3-fast/txt2video',
    exclusive: false,
    icon: '🔮',
  },
];

// =============================================
// CLASSE DO SERVIÇO
// =============================================

export class WaveSpeedService {
  private static apiKey = import.meta.env.VITE_WAVESPEED_API_KEY;

  /**
   * Base URL do proxy local do Vite.
   * As requisições para /api/wavespeed são reescritas pelo proxy do Vite
   * para https://api.wavespeed.ai/api/v3, evitando CORS.
   */
  private static readonly PROXY_BASE = '/api/wavespeed';

  /**
   * Verifica se a API está configurada corretamente
   */
  private static validateConfig(): void {
    if (!this.apiKey || this.apiKey === 'sua_chave_aqui') {
      throw new Error('WaveSpeed API Key não configurada. Adicione VITE_WAVESPEED_API_KEY no .env');
    }
  }

  /**
   * Retorna o endpoint completo (via proxy) para um dado modelo
   */
  private static getEndpointForModel(modelId: WaveSpeedModel): string {
    const model = WAVESPEED_MODELS.find((m) => m.id === modelId);
    if (!model) {
      throw new Error(`Modelo WaveSpeed "${modelId}" não encontrado no catálogo.`);
    }
    return `${this.PROXY_BASE}${model.endpoint}`;
  }

  /**
   * Faz uma requisição genérica à API WaveSpeed com tratamento de erro
   */
  private static async request(endpoint: string, body: Record<string, unknown>): Promise<WaveSpeedResponse> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.message || errorData?.error || `Erro HTTP ${response.status}`;
      console.error('[WaveSpeed] Erro na requisição:', errorData);
      return { success: false, error: message };
    }

    const data = await response.json();

    // A API retorna um ID de task — precisamos fazer polling para obter o resultado
    if (data.id) {
      return this.pollForResult(data.id);
    }

    // Se os dados já contêm output diretamente
    if (data.data?.output || data.output) {
      return {
        success: true,
        data: {
          id: data.id || data.data?.id || 'direct',
          output: data.data?.output || data.output,
          status: 'completed',
          credits_used: data.credits_used || data.data?.credits_used,
          createdAt: data.createdAt || new Date().toISOString(),
        },
      };
    }

    return { success: false, error: 'Resposta inesperada da API WaveSpeed.' };
  }

  /**
   * Polling: aguarda o resultado de uma task assíncrona (imagem/vídeo).
   * Consulta a cada 3 segundos, com timeout de 5 minutos.
   */
  private static async pollForResult(taskId: string): Promise<WaveSpeedResponse> {
    const resultUrl = `${this.PROXY_BASE}/predictions/${taskId}/result`;
    const maxAttempts = 100; // 5 minutos (100 × 3s)
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        const response = await fetch(resultUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (response.status === 202) {
          // Ainda processando, continuar polling
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return { success: false, error: errorData?.message || `Polling falhou (${response.status})` };
        }

        const data = await response.json();

        // Verifica se o resultado está disponível
        if (data.status === 'completed' || data.output || data.data?.output) {
          return {
            success: true,
            data: {
              id: taskId,
              output: data.output || data.data?.output || '',
              status: 'completed',
              credits_used: data.credits_used,
              createdAt: data.createdAt || new Date().toISOString(),
            },
          };
        }

        // Se a task falhou
        if (data.status === 'failed' || data.status === 'error') {
          return { success: false, error: data.error || 'Geração falhou no servidor.' };
        }

      } catch (err) {
        console.warn(`[WaveSpeed] Tentativa de polling ${attempt} falhou:`, err);
      }
    }

    return { success: false, error: 'Timeout: geração demorou mais de 5 minutos.' };
  }

  // =============================================
  // MÉTODOS PÚBLICOS
  // =============================================

  /**
   * Gera uma imagem a partir de um prompt textual.
   */
  static async generateImage(params: ImageGenerationParams): Promise<WaveSpeedResponse> {
    this.validateConfig();

    const endpoint = this.getEndpointForModel(params.model);

    const body: Record<string, unknown> = {
      prompt: params.prompt,
      size: params.size || '1024*1024',
      num_inference_steps: params.num_inference_steps || 28,
    };

    if (params.seed !== undefined) {
      body.seed = params.seed;
    }

    console.log(`[WaveSpeed] Gerando imagem com modelo "${params.model}"...`);
    return this.request(endpoint, body);
  }

  /**
   * Gera um vídeo a partir de um prompt textual (e opcionalmente, uma imagem de referência).
   */
  static async generateVideo(params: VideoGenerationParams): Promise<WaveSpeedResponse> {
    this.validateConfig();

    const endpoint = this.getEndpointForModel(params.model);

    const body: Record<string, unknown> = {
      prompt: params.prompt,
      duration: params.duration || 5,
      aspect_ratio: params.aspect_ratio || '9:16',
    };

    if (params.image) {
      body.image = params.image;
    }

    if (params.resolution) {
      body.resolution = params.resolution;
    }

    console.log(`[WaveSpeed] Gerando vídeo com modelo "${params.model}"...`);
    return this.request(endpoint, body);
  }

  /**
   * Consulta o saldo disponível na conta WaveSpeed.
   */
  static async getBalance(): Promise<WaveSpeedBalance | null> {
    this.validateConfig();

    try {
      const response = await fetch(`${this.PROXY_BASE}/account/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error('[WaveSpeed] Erro ao consultar saldo:', response.status);
        return null;
      }

      const data = await response.json();
      return {
        balance: data.balance ?? data.credits ?? 0,
        currency: data.currency || 'USD',
      };
    } catch (err) {
      console.error('[WaveSpeed] Falha ao buscar saldo:', err);
      return null;
    }
  }

  /**
   * Retorna informações de um modelo específico pelo ID
   */
  static getModelInfo(modelId: WaveSpeedModel): WaveSpeedModelInfo | undefined {
    return WAVESPEED_MODELS.find((m) => m.id === modelId);
  }

  /**
   * Retorna modelos filtrados por tipo
   */
  static getModelsByType(type: WaveSpeedModelType): WaveSpeedModelInfo[] {
    return WAVESPEED_MODELS.filter((m) => m.type === type);
  }
}
