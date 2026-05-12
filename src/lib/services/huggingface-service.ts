/**
 * Hugging Face Inference Service — ProductSuite
 * ----------------------------------------------
 * Geração de imagem gratuita via Hugging Face Inference API.
 * Modelos: FLUX.1-schnell (rápido) e FLUX.1-dev (qualidade)
 *
 * Auth: Bearer token (VITE_HF_TOKEN)
 * Docs: https://huggingface.co/docs/api-inference
 */

const HF_MODELS: Record<string, string> = {
  'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
  'flux-dev':     'black-forest-labs/FLUX.1-dev',
};

export interface HFImageResponse {
  success: boolean;
  data?: { imageUrl: string };
  error?: string;
}

export class HuggingFaceService {
  private static get token() {
    return import.meta.env.VITE_HF_TOKEN || '';
  }

  private static getBaseUrl(): string {
    return import.meta.env.DEV
      ? '/api/hf'
      : 'https://api-inference.huggingface.co';
  }

  static async generateImage(config: {
    prompt: string;
    modelId: string;
  }): Promise<HFImageResponse> {
    if (!this.token) {
      return { success: false, error: 'Token Hugging Face não configurado. Adicione VITE_HF_TOKEN no .env' };
    }

    const model = HF_MODELS[config.modelId];
    if (!model) {
      return { success: false, error: `Modelo "${config.modelId}" não encontrado.` };
    }

    const url = `${this.getBaseUrl()}/pipeline/text-to-image/${model}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true',
        },
        body: JSON.stringify({
          inputs: config.prompt,
          parameters: { num_inference_steps: 4 },
        }),
      });

      if (response.status === 503) {
        return { success: false, error: 'Modelo carregando. Tente novamente em 20 segundos.' };
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return { success: false, error: `Erro ${response.status}: ${text || 'Falha na requisição'}` };
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      return { success: true, data: { imageUrl } };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão com Hugging Face' };
    }
  }
}
