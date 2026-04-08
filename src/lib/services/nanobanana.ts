export interface GenerationInstance {
  id: string;
  name: string;
  defaultPrompt: string;
  status: 'idle' | 'syncing' | 'generating' | 'completed' | 'error';
  progress: number;
  resultImage?: string;
}

export const INITIAL_INSTANCES: GenerationInstance[] = [
  {
    id: 'inst-1',
    name: 'Frontal Studio',
    status: 'idle',
    progress: 0,
    defaultPrompt: 'Cinematic front view of the product, professional studio lighting, high resolution, minimalist white background.',
  },
  {
    id: 'inst-2',
    name: '45° Detail',
    status: 'idle',
    progress: 0,
    defaultPrompt: 'Close-up 45-degree angle shot of the product, sharp focus on textures, bokeh background, premium lighting.',
  },
  {
    id: 'inst-3',
    name: 'Isometric Clean',
    status: 'idle',
    progress: 0,
    defaultPrompt: 'Top-down isometric view of the product, clean technical photography, uniform lighting, shadows preserved.',
  },
  {
    id: 'inst-4',
    name: 'Lifestyle Context',
    status: 'idle',
    progress: 0,
    defaultPrompt: 'Lifestyle action shot of the product being used in a modern, high-end living room environment, warm natural lighting.',
  },
];

export class NanobananaService {
  /**
   * Simula a geração de uma imagem para uma instância específica.
   */
  static async generateImage(
    instanceId: string,
    sourceImage: string, // Base64 da imagem anexada
    prompt: string,
    onProgress: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          setTimeout(() => {
            // Lógica de "Reconhecimento" do Mock inteligente
            const lowercasePrompt = prompt.toLowerCase();
            
            // Caso 2: Contexto de Fone de Ouvido / Loja de Eletrônicos
            if (lowercasePrompt.includes('fone') || lowercasePrompt.includes('unha') || lowercasePrompt.includes('loja')) {
              resolve('/result-fone.png'); // Imagem ultra-realista que acabamos de gerar
              return;
            }

            // Fallback para Unsplash com ID de instância para garantir imagens diferentes
            const keywords = prompt.split(' ').slice(0, 3).join(',');
            resolve(`https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800&sig=${instanceId}&q=${encodeURIComponent(keywords)}`);
          }, 1500);
        }
        onProgress(Math.min(progress, 99));
      }, 250);
    });
  }
}
