/**
 * Gemini Service — ProductSuite
 * ---------------------
 * Serviço unificado para geração de imagens e vídeos via Google Gemini API.
 * 
 * Imagens: Nano Banana (generateContent endpoint)
 * Vídeos:  Veo 3.1 (predictLongRunning endpoint + polling)
 * 
 * Auth: x-goog-api-key header
 * Base URL: https://generativelanguage.googleapis.com/v1beta
 */

import { getGeminiModel, type GeminiModelInfo } from './gemini-models';

// =============================================
// TIPOS E INTERFACES
// =============================================

/** Resposta padronizada de geração de imagem */
export interface GeminiImageResponse {
  success: boolean;
  data?: {
    imageUrl: string;    // blob URL criada a partir do base64
    modelId: string;
    textResponse?: string; // texto que o modelo retornar junto
  };
  error?: string;
}

/** Resposta padronizada de geração de vídeo */
export interface GeminiVideoResponse {
  success: boolean;
  data?: {
    operationName: string;
    videoUrl?: string;
    status: 'processing' | 'completed' | 'failed';
  };
  error?: string;
}

/** Configuração para geração de imagem */
export interface GeminiImageConfig {
  prompt: string;
  modelId?: string;         // ID interno (ex: 'nano-banana-2')
  referenceImage?: string;  // base64 data URL da imagem de referência
  aspectRatio?: string;
}

/** Configuração para geração de vídeo */
export interface GeminiVideoConfig {
  prompt: string;
  modelId?: string;         // ID interno (ex: 'veo-3.1-lite')
  referenceImage?: string;  // base64 data URL
  aspectRatio?: string;     // '16:9' | '9:16'
  resolution?: string;      // '720p' | '1080p' | '4k'
}

// =============================================
// CLASSE DO SERVIÇO
// =============================================

export class GeminiService {
  private static apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  /** 
   * Retorna a URL base correta da API.
   * Local: /api/gemini (Proxy do Vite evita CORS)
   * Deploy: URL Direta (Hospedagens estáticas não tem proxy de servidor)
   */
  private static getBaseUrl(): string {
    const isDev = import.meta.env.DEV;
    return isDev ? '/api/gemini' : 'https://generativelanguage.googleapis.com';
  }

  /** Valida configuração da API */
  private static validateConfig(): void {
    if (!this.apiKey) {
      throw new Error(
        'Gemini API Key não configurada. Adicione VITE_GEMINI_API_KEY no .env\n' +
        'Obtenha em: https://aistudio.google.com/apikey'
      );
    }
  }

  /** Headers padrão para requisições à API Gemini */
  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.apiKey,
    };
  }

  // =============================================
  // GERAÇÃO DE IMAGEM (Nano Banana)
  // =============================================

  /**
   * Gera uma imagem a partir de texto (e opcionalmente uma imagem de referência).
   * 
   * Usa o endpoint generateContent com responseModalities: ['IMAGE', 'TEXT']
   * 
   * POST /v1beta/models/{model}:generateContent
   */
  static async generateImage(config: GeminiImageConfig): Promise<GeminiImageResponse> {
    this.validateConfig();

    const model = getGeminiModel(config.modelId || 'nano-banana-2');
    if (!model) {
      return { success: false, error: `Modelo "${config.modelId}" não encontrado.` };
    }

    // Montar os parts da requisição
    const parts: Array<Record<string, unknown>> = [];

    // Se há imagem de referência, adicionar como inline_data
    if (config.referenceImage) {
      const { mimeType, base64Data } = this.parseDataUrl(config.referenceImage);
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      });
    }

    // Adicionar o prompt de texto
    parts.push({ text: config.prompt });

    const requestBody: any = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    };

    if (config.aspectRatio) {
      // O Gemini Imagen 3 exige que a proporção esteja dentro de imageConfig
      requestBody.generationConfig.imageConfig = {
        aspectRatio: config.aspectRatio
      };
    }

    try {
      const url = `${this.getBaseUrl()}/v1beta/models/${model.apiModel}:generateContent`;
      
      console.log(`[Gemini] Gerando imagem com "${model.name}" (${model.apiModel})...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg = errData?.error?.message || `Erro HTTP ${response.status}`;
        console.error('[Gemini] Erro na geração de imagem:', errData);
        return { success: false, error: errorMsg };
      }

      const data = await response.json();

      // Extrair imagem e texto da resposta
      let imageUrl = '';
      let textResponse = '';

      const responseParts = data?.candidates?.[0]?.content?.parts || [];

      for (const part of responseParts) {
        if (part.text) {
          textResponse = part.text;
        } else if (part.inlineData || part.inline_data) {
          const inlineData = part.inlineData || part.inline_data;
          const base64 = inlineData.data;
          const mime = inlineData.mimeType || inlineData.mime_type || 'image/png';
          
          // Converter base64 para blob URL
          const byteString = atob(base64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mime });
          imageUrl = URL.createObjectURL(blob);
        }
      }

      if (!imageUrl) {
        // Se o modelo retornou apenas texto (safety filter, etc.)
        return {
          success: false,
          error: textResponse || 'O modelo não retornou uma imagem. Tente um prompt diferente.',
        };
      }

      return {
        success: true,
        data: {
          imageUrl,
          modelId: model.id,
          textResponse: textResponse || undefined,
        },
      };
    } catch (err: any) {
      console.error('[Gemini] Erro na geração de imagem:', err);
      return { success: false, error: err.message || 'Erro de conexão com a API Gemini' };
    }
  }

  // =============================================
  // GERAÇÃO DE VÍDEO (Veo 3.1)
  // =============================================

  /**
   * Inicia a geração de um vídeo. Retorna o operationName para polling.
   * 
   * POST /v1beta/models/{model}:predictLongRunning
   */
  static async generateVideo(config: GeminiVideoConfig): Promise<GeminiVideoResponse> {
    this.validateConfig();

    const model = getGeminiModel(config.modelId || 'veo-3.1-lite');
    if (!model) {
      return { success: false, error: `Modelo "${config.modelId}" não encontrado.` };
    }

    // Montar o corpo da requisição
    const instance: Record<string, unknown> = {
      prompt: config.prompt,
    };

    // Imagem de referência (image-to-video)
    if (config.referenceImage) {
      const { mimeType, base64Data } = this.parseDataUrl(config.referenceImage);
      instance.image = {
        bytesBase64Encoded: base64Data,
        mimeType: mimeType,
      };
    }

    const parameters: Record<string, unknown> = {};
    if (config.aspectRatio) {
      parameters.aspectRatio = config.aspectRatio;
    }
    if (config.resolution) {
      parameters.resolution = config.resolution;
    }

    const requestBody: Record<string, unknown> = {
      instances: [instance],
    };

    if (Object.keys(parameters).length > 0) {
      requestBody.parameters = parameters;
    }

    try {
      const url = `${this.getBaseUrl()}/v1beta/models/${model.apiModel}:predictLongRunning`;

      console.log(`[Gemini] Iniciando vídeo com "${model.name}" (${model.apiModel})...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg = errData?.error?.message || `Erro HTTP ${response.status}`;
        console.error('[Gemini] Erro ao iniciar vídeo:', errData);
        return { success: false, error: errorMsg };
      }

      const data = await response.json();
      const operationName = data.name;

      if (!operationName) {
        return { success: false, error: 'API não retornou um operationName válido.' };
      }

      console.log(`[Gemini] Operação iniciada: ${operationName}`);

      return {
        success: true,
        data: {
          operationName,
          status: 'processing',
        },
      };
    } catch (err: any) {
      console.error('[Gemini] Erro ao iniciar vídeo:', err);
      return { success: false, error: err.message || 'Erro de conexão com a API Gemini' };
    }
  }

  /**
   * Polling: consulta o status de uma operação de vídeo.
   * 
   * GET /v1beta/{operationName}
   */
  static async checkVideoOperation(operationName: string): Promise<GeminiVideoResponse> {
    this.validateConfig();

    try {
      const url = `${this.getBaseUrl()}/v1beta/${operationName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg = errData?.error?.message || `Polling falhou (${response.status})`;
        return { success: false, error: errorMsg };
      }

      const data = await response.json();

      if (data.done === true) {
        // Extrair URL do vídeo gerado
        const videoUri =
          data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
          data?.response?.generatedVideos?.[0]?.video?.uri;

        if (videoUri) {
          // Construir URL de download com a API key
          const downloadUrl = videoUri.includes('?')
            ? `${videoUri}&key=${this.apiKey}`
            : `${videoUri}?key=${this.apiKey}`;

          return {
            success: true,
            data: {
              operationName,
              videoUrl: downloadUrl,
              status: 'completed',
            },
          };
        }

        // Verificar se houve erro
        const error = data?.error?.message || 'Vídeo gerado mas sem URL disponível.';
        return { success: false, error };
      }

      // Ainda processando
      return {
        success: true,
        data: {
          operationName,
          status: 'processing',
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro no polling' };
    }
  }

  /**
   * Polling completo: aguarda o vídeo ser gerado, com callbacks de progresso.
   * Consulta a cada 10 segundos, timeout de 10 minutos.
   */
  static async pollVideoResult(
    operationName: string,
    onProgress?: (progress: number) => void
  ): Promise<GeminiVideoResponse> {
    const maxAttempts = 60; // 10 min (60 × 10s)
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      const progress = Math.min(10 + (attempt / maxAttempts) * 85, 95);
      onProgress?.(progress);

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const result = await this.checkVideoOperation(operationName);

      if (!result.success) {
        return result;
      }

      if (result.data?.status === 'completed' && result.data?.videoUrl) {
        onProgress?.(100);
        return result;
      }

      if (result.data?.status === 'failed') {
        return { success: false, error: 'Geração de vídeo falhou no servidor Google.' };
      }
    }

    return { success: false, error: 'Timeout: vídeo demorou mais de 10 minutos.' };
  }

  // =============================================
  // UTILITÁRIOS
  // =============================================

  /**
   * Remove o background de uma imagem usando Gemini (prompt-based).
   * Usa Nano Banana com um prompt específico para remoção de fundo.
   */
  static async removeBackground(imageDataUrl: string): Promise<GeminiImageResponse> {
    return this.generateImage({
      prompt: 'Remove the background from this image completely. Make the background transparent. Keep only the main subject with clean edges. Ensure absolute strict alpha transparency with zero white halos, soft glow, or fringes around the edges.',
      modelId: 'nano-banana-2',
      referenceImage: imageDataUrl,
    });
  }

  /**
   * Faz upscale de uma imagem usando Gemini (prompt-based).
   */
  static async upscaleImage(imageDataUrl: string): Promise<GeminiImageResponse> {
    return this.generateImage({
      prompt: 'Upscale this image to the highest quality possible. Enhance all details, sharpen textures, and improve clarity. Keep the exact same composition and content.',
      modelId: 'nano-banana-pro',
      referenceImage: imageDataUrl,
    });
  }

  /** Converte Data URL para Blob */
  static async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /** Parse de data URL para mimeType e base64 puro */
  private static parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } {
    // Formato: data:image/png;base64,iVBORw0KGgoAAAA...
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64Data: match[2] };
    }
    // Se não tem prefixo data:, assume PNG
    return { mimeType: 'image/png', base64Data: dataUrl };
  }
}
