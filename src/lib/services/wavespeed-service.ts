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
  | 'google/nano-banana/text-to-image'
  | 'wavespeed-ai/phota/text-to-image'
  | 'openai/dall-e-3'
  | 'google/gemini-2.5-flash-image/text-to-image'
  | 'wavespeed-ai/flux-1-srpo/image-to-image'
  | 'minimax/image-01/image-to-image'
  | 'google/nano-banana-2/edit'
  | 'google/nano-banana-pro/edit'
  | 'alibaba/wan-2.2/image-to-image'
  | 'stability-ai/stable-diffusion-3.5-large';

/** Modelos de geração de VÍDEO */
export type WaveSpeedVideoModel =
  | 'kwaivgi/kling-v3.0-std/text-to-video'
  | 'alibaba/wan-2.2/t2v-plus-1080p'
  | 'alibaba/wan-2.2/i2v-plus-1080p'
  | 'openai/sora-2-pro/text-to-video'
  | 'minimax/hailuo-02/fast'
  | 'pika/v2.2-t2v'
  | 'vidu/image-to-video-q2-pro';

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
  apiPath: string; // Caminho unificado (ex: google/nano-banana-2-text-to-image)
  exclusive?: boolean;
  hot?: boolean; // Adicionado suporte para flag HOT visualmente
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
  image?: string;
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
    id: 'google/nano-banana-2/edit',
    name: 'Nano Banana 2 (I2I)',
    type: 'image',
    description: 'Versão oficial Nano Banana 2 focada em Image-to-Image (Edit). Mantém fortíssima fidelidade.',
    price: '$0.07/img',
    apiPath: 'google/nano-banana-2/edit',
    hot: true,
    icon: '🍌',
  },
  {
    id: 'google/nano-banana-pro/edit',
    name: 'Nano Banana Pro (I2I)',
    type: 'image',
    description: 'Versão PRO oficial do Nano Banana para edições I2I de altíssima definição.',
    price: '$0.15/img',
    apiPath: 'google/nano-banana-pro/edit',
    exclusive: true,
    icon: '🍌',
  },
  {
    id: 'wavespeed-ai/flux-1-srpo/image-to-image',
    name: 'Flux SRPO (I2I)',
    type: 'image',
    description: 'Modelo Flux nativo otimizado para fidelidade máxima de alteração (Image-to-Image).',
    price: '$0.025/img',
    apiPath: 'wavespeed-ai/flux-1-srpo/image-to-image',
    hot: true,
    icon: 'F',
  },
  {
    id: 'minimax/image-01/image-to-image',
    name: 'Minimax Image 01 (I2I)',
    type: 'image',
    description: 'Modelo Minimax altamente fidedigno para edição de imagem baseada em referência.',
    price: '$0.06/img',
    apiPath: 'minimax/image-01/image-to-image',
    icon: 'M',
  },
  {
    id: 'google/nano-banana/text-to-image',
    name: 'Nano Banana',
    type: 'image',
    description: 'Modelo oficial do Google Nano Banana Text To Image. Qualidade impressionante.',
    price: '$0.038/img',
    apiPath: 'google/nano-banana/text-to-image',
    hot: true,
    icon: '🍌',
  },
  {
    id: 'google/gemini-2.5-flash-image/text-to-image',
    name: 'Gemini 2.5 Flash',
    type: 'image',
    description: 'Modelo oficial Google Gemini 2.5 Flash Text to Image.',
    price: '$0.038/img',
    apiPath: 'google/gemini-2.5-flash-image/text-to-image',
    icon: 'G',
  },
  {
    id: 'openai/dall-e-3',
    name: 'DALL-E 3',
    type: 'image',
    description: 'Gerador nativo e potente de imagens da linha OpenAI DALL-E 3.',
    price: '$0.04/img',
    apiPath: 'openai/dall-e-3',
    icon: 'O',
  },
  {
    id: 'alibaba/wan-2.2/image-to-image',
    name: 'WAN 2.2 I2I',
    type: 'image',
    description: 'A v2.2 do modelo WAN. Excelente para Image-to-Image styling.',
    price: '$0.02/img',
    apiPath: 'alibaba/wan-2.2/image-to-image',
    icon: 'W',
  },
  {
    id: 'wavespeed-ai/phota/text-to-image',
    name: 'Phota T2I',
    type: 'image',
    description: 'Modelo exclusivo WaveSpeed Phota focado em fotografia realista.',
    price: '$0.09/img',
    apiPath: 'wavespeed-ai/phota/text-to-image',
    icon: '📸',
  },

  // ─── MODELOS DE VÍDEO ───
  {
    id: 'kwaivgi/kling-v3.0-std/text-to-video',
    name: 'Kling 3.0 (Std)',
    type: 'video',
    description: 'A mais recente geração de modelo de vídeo da classe Kling 3.0 Standard.',
    price: '$0.42/5s',
    apiPath: 'kwaivgi/kling-v3.0-std/text-to-video',
    hot: true,
    icon: 'K',
  },
  {
    id: 'alibaba/wan-2.2/t2v-plus-1080p',
    name: 'WAN 2.2 T2V 1080p',
    type: 'video',
    description: 'Converte texto para vídeo em 1080p usando Alibaba WAN 2.2.',
    price: '$0.20/5s',
    apiPath: 'alibaba/wan-2.2/t2v-plus-1080p',
    icon: '🌐',
  },
  {
    id: 'openai/sora-2-pro/text-to-video',
    name: 'Sora 2 Pro',
    type: 'video',
    description: 'Modelo oficial Sora 2 Pro da OpenAI. Física revolucionária.',
    price: '$1.20/5s',
    apiPath: 'openai/sora-2-pro/text-to-video',
    exclusive: true,
    icon: 'S',
  },
  {
    id: 'minimax/hailuo-02/fast',
    name: 'Hailuo 02 Fast',
    type: 'video',
    description: 'Velocidade impressionante com o Minimax Hailuo 02.',
    price: '$0.10/6s',
    apiPath: 'minimax/hailuo-02/fast',
    icon: 'H',
  },
  {
    id: 'vidu/image-to-video-q2-pro',
    name: 'Vidu Q2 Pro I2V',
    type: 'video',
    description: 'Vidu Q2 Pro Image-to-Video.',
    price: '$0.30/5s',
    apiPath: 'vidu/image-to-video-q2-pro',
    icon: 'V',
  }
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
   * Retorna o apiPath unificado para um dado modelo
   */
  private static getApiPathForModel(modelId: WaveSpeedModel): string {
    const model = WAVESPEED_MODELS.find((m) => m.id === modelId);
    if (!model) {
      throw new Error(`Modelo WaveSpeed "${modelId}" não encontrado no catálogo.`);
    }
    return model.apiPath;
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
    const resultData = data.data || data;

    // A API retorna um ID de task — precisamos fazer polling para obter o resultado
    if (resultData.id) {
      if (resultData.status === 'completed' && resultData.outputs && resultData.outputs.length > 0) {
        return {
          success: true,
          data: {
            id: resultData.id,
            output: resultData.outputs[0],
            status: 'completed',
            createdAt: resultData.created_at || new Date().toISOString(),
          },
        };
      }
      return this.pollForResult(resultData.id);
    }

    // Se os dados já contêm output diretamente
    if (resultData.output) {
      return {
        success: true,
        data: {
          id: resultData.id || 'direct',
          output: resultData.output,
          status: 'completed',
          credits_used: resultData.credits_used,
          createdAt: resultData.created_at || new Date().toISOString(),
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
        const resultData = data.data || data;

        // Verifica se o resultado está disponível
        if (resultData.status === 'completed') {
          const finalOutput = (resultData.outputs && resultData.outputs.length > 0)
            ? resultData.outputs[0]
            : (resultData.output || '');

          return {
            success: true,
            data: {
              id: taskId,
              output: finalOutput,
              status: 'completed',
              credits_used: resultData.credits_used,
              createdAt: resultData.created_at || new Date().toISOString(),
            },
          };
        }

        // Se a task falhou
        if (resultData.status === 'failed' || resultData.status === 'error') {
          return { success: false, error: resultData.error || data.error || 'Geração falhou no servidor.' };
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
   * Gera uma imagem a partir de um prompt textual usando o endpoint consolidado V3.
   */
  static async generateImage(params: ImageGenerationParams): Promise<WaveSpeedResponse> {
    this.validateConfig();

    const apiPath = this.getApiPathForModel(params.model);

    const body: Record<string, unknown> = {
      prompt: params.prompt,
      size: params.size || '1024*1024',
      num_inference_steps: params.num_inference_steps || 28,
    };

    if (params.image) {
      if (apiPath.endsWith('/edit')) {
        // Modelos da família Nano Banana e Gemini Edit pedem um array "images"
        body.images = [params.image];
      } else {
        // Modelos como Flux ou Minimax I2I pedem string "image" + config de força
        body.image = params.image;
        body.strength = 0.70; // Preserva a estrutura mas permite variação
      }
    }

    if (params.seed !== undefined) {
      body.seed = params.seed;
    }

    // O proxy vite mapeia "/api/wavespeed" para "https://api.wavespeed.ai/api/v3"
    // Então adicionamos o apiPath (ex: "google/google-nano-banana-2-text-to-image") diretamente na URL.
    const endpoint = `${this.PROXY_BASE}/${apiPath}`;

    console.log(`[WaveSpeed] Gerando imagem com modelo "${params.model}" no endpoint ${endpoint}...`);
    return this.request(endpoint, body);
  }

  /**
   * Gera um vídeo a partir de um prompt textual (e opcionalmente, uma imagem de referência) via endpoint V3.
   */
  static async generateVideo(params: VideoGenerationParams): Promise<WaveSpeedResponse> {
    this.validateConfig();

    const apiPath = this.getApiPathForModel(params.model);

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

    // O proxy vite mapeia "/api/wavespeed" para "https://api.wavespeed.ai/api/v3"
    // Então adicionamos o apiPath (ex: "google/google-veo3.1-image-to-video") diretamente na URL.
    const endpoint = `${this.PROXY_BASE}/${apiPath}`;

    console.log(`[WaveSpeed] Gerando vídeo com modelo "${params.model}" no endpoint ${endpoint}...`);
    return this.request(endpoint, body);
  }

  /**
   * Consulta o saldo disponível na conta WaveSpeed.
   */
  static async getBalance(): Promise<WaveSpeedBalance | null> {
    this.validateConfig();

    try {
      const response = await fetch(`${this.PROXY_BASE}/balance`, {
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
      const resultData = data.data || data;

      return {
        balance: resultData.balance ?? resultData.credits ?? 0,
        currency: resultData.currency || 'USD',
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
