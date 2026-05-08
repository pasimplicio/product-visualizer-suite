/**
 * Gemini Models Catalog
 * ---------------------
 * Catálogo oficial de modelos Google Gemini disponíveis no ProductSuite.
 * 
 * Imagem: Nano Banana 2 (Flash) e Nano Banana Pro
 * Vídeo:  Veo 3.1 e Veo 3.1 Lite
 * 
 * Docs: https://ai.google.dev/gemini-api/docs/image-generation
 *       https://ai.google.dev/gemini-api/docs/video
 */

// =============================================
// TIPOS
// =============================================

/** Tier de preço do modelo */
export type GeminiModelTier = 'free' | 'standard' | 'premium';

/** Tipo do modelo */
export type GeminiModelType = 'image' | 'video';

/** Informações de um modelo Gemini */
export interface GeminiModelInfo {
  /** ID interno usado no app */
  id: string;
  /** ID do modelo na API Gemini */
  apiModel: string;
  /** Nome amigável */
  name: string;
  /** Tipo: image ou video */
  type: GeminiModelType;
  /** Descrição curta */
  description: string;
  /** Emoji/ícone */
  icon: string;
  /** Tier de preço */
  tier: GeminiModelTier;
  /** Custo em créditos internos */
  creditCost: number;
  /** Destaque visual */
  hot?: boolean;
  /** Exclusivo/premium */
  exclusive?: boolean;
  /** Aspect ratios suportados */
  supportedAspectRatios?: string[];
  /** Resoluções suportadas (vídeo) */
  supportedResolutions?: string[];
}

// =============================================
// CATÁLOGO DE MODELOS
// =============================================

export const GEMINI_MODELS: GeminiModelInfo[] = [
  // ─── MODELOS DE IMAGEM (Nano Banana) ───
  {
    id: 'nano-banana-2',
    apiModel: 'gemini-3.1-flash-image-preview',
    name: 'Nano Banana 2',
    type: 'image',
    description: 'Nova geração. Alta qualidade e velocidade.',
    icon: '🍌',
    tier: 'standard',
    creditCost: 0,
    hot: true,
    supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9'],
  },
  {
    id: 'nano-banana-pro',
    apiModel: 'gemini-3.1-flash-image-preview',
    name: 'Nano Banana Pro',
    type: 'image',
    description: 'Profissional. Detalhes ultra-precisos e realismo.',
    icon: '🍌',
    tier: 'premium',
    creditCost: 5,
    exclusive: true,
    supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9'],
  },
  {
    id: 'nano-banana-legacy',
    apiModel: 'gemini-2.0-flash-exp',
    name: 'Flash (Gratuito)',
    type: 'image',
    description: 'Gratuito. Até 1500 imagens/dia. Ideal para uso diário.',
    icon: '🆓',
    tier: 'free',
    creditCost: 0,
    supportedAspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
  },

  // ─── MODELOS DE VÍDEO (Veo 3.1) ───
  {
    id: 'veo-3.1',
    apiModel: 'veo-3.1-generate-preview',
    name: 'Veo 3.1',
    type: 'video',
    description: '8s de vídeo 720p–4K com áudio nativo. Qualidade cinematográfica.',
    icon: '🎬',
    tier: 'premium',
    creditCost: 50,
    exclusive: true,
    supportedAspectRatios: ['16:9', '9:16'],
    supportedResolutions: ['720p', '1080p', '4k'],
  },
  {
    id: 'veo-3.1-lite',
    apiModel: 'veo-3.1-lite-generate-preview',
    name: 'Veo 3.1 Lite',
    type: 'video',
    description: 'Rápido e econômico. 720p–1080p com áudio.',
    icon: '⚡',
    tier: 'standard',
    creditCost: 20,
    hot: true,
    supportedAspectRatios: ['16:9', '9:16'],
    supportedResolutions: ['720p', '1080p'],
  },
];

/** Retorna informações de um modelo pelo ID */
export function getGeminiModel(modelId: string): GeminiModelInfo | undefined {
  return GEMINI_MODELS.find((m) => m.id === modelId);
}

/** Retorna modelos filtrados por tipo */
export function getGeminiModelsByType(type: GeminiModelType): GeminiModelInfo[] {
  return GEMINI_MODELS.filter((m) => m.type === type);
}
