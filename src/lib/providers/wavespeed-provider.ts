import { WaveSpeedService } from '@/lib/services/wavespeed-service';
import type { AIProvider, GenerateImageConfig, GenerateVideoConfig, GenerateResult } from './types';

export class WaveSpeedProvider implements AIProvider {
  readonly id = 'wavespeed';
  readonly name = 'WaveSpeed AI';
  readonly description = 'Imagens via Flux/HiDream · Vídeos via Wan2.1';

  isAvailable(): boolean {
    return WaveSpeedService.isAvailable();
  }

  async generateImage(config: GenerateImageConfig): Promise<GenerateResult> {
    const result = await WaveSpeedService.generateImage({
      prompt: config.prompt,
      model: (config.modelId as any) || 'wavespeed-ai/flux-schnell',
      image: config.referenceImage,
      aspect_ratio: config.aspectRatio,
    });
    return { success: result.success, imageUrl: result.data?.output, error: result.error };
  }

  async generateVideo(config: GenerateVideoConfig): Promise<GenerateResult> {
    if (!config.referenceImage) {
      return { success: false, error: 'WaveSpeed requer uma imagem de referência para gerar vídeo.' };
    }
    const result = await WaveSpeedService.generateVideo(
      {
        prompt: config.prompt,
        model: (config.modelId as any) || 'wavespeed-ai/wan2.1-i2v-480p',
        image: config.referenceImage,
        aspect_ratio: config.aspectRatio,
      },
      config.onProgress
    );
    return { success: result.success, videoUrl: result.data?.output, error: result.error };
  }
}
