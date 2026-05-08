/** Interface comum a todos os provedores de IA */

export interface GenerateImageConfig {
  prompt: string;
  referenceImage?: string;
  aspectRatio?: string;
  modelId?: string;
}

export interface GenerateVideoConfig {
  prompt: string;
  referenceImage?: string;
  aspectRatio?: string;
  resolution?: string;
  modelId?: string;
  onProgress?: (progress: number) => void;
}

export interface GenerateResult {
  success: boolean;
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  isAvailable(): boolean;
  generateImage(config: GenerateImageConfig): Promise<GenerateResult>;
  generateVideo?(config: GenerateVideoConfig): Promise<GenerateResult>;
  removeBackground?(imageUrl: string): Promise<GenerateResult>;
  upscaleImage?(imageUrl: string): Promise<GenerateResult>;
}
