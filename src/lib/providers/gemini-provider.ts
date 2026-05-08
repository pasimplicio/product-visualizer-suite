import { GeminiService } from '@/lib/services/gemini-service';
import type { AIProvider, GenerateImageConfig, GenerateVideoConfig, GenerateResult } from './types';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly description = 'Imagens via Nano Banana · Vídeos via Veo 3.1';

  isAvailable(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  }

  async generateImage(config: GenerateImageConfig): Promise<GenerateResult> {
    const result = await GeminiService.generateImage({
      prompt: config.prompt,
      modelId: config.modelId,
      referenceImage: config.referenceImage,
      aspectRatio: config.aspectRatio,
    });
    return { success: result.success, imageUrl: result.data?.imageUrl, error: result.error };
  }

  async generateVideo(config: GenerateVideoConfig): Promise<GenerateResult> {
    const init = await GeminiService.generateVideo({
      prompt: config.prompt,
      modelId: config.modelId,
      referenceImage: config.referenceImage,
      aspectRatio: config.aspectRatio,
      resolution: config.resolution,
    });
    if (!init.success || !init.data?.operationName) {
      return { success: false, error: init.error };
    }
    const poll = await GeminiService.pollVideoResult(init.data.operationName, config.onProgress);
    return { success: poll.success, videoUrl: poll.data?.videoUrl, error: poll.error };
  }

  async removeBackground(imageUrl: string): Promise<GenerateResult> {
    const result = await GeminiService.removeBackground(imageUrl);
    return { success: result.success, imageUrl: result.data?.imageUrl, error: result.error };
  }

  async upscaleImage(imageUrl: string): Promise<GenerateResult> {
    const result = await GeminiService.upscaleImage(imageUrl);
    return { success: result.success, imageUrl: result.data?.imageUrl, error: result.error };
  }
}
