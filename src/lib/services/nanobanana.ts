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

/**
 * Redimensiona uma imagem (Data URL) para garantir que ela não exceda as dimensões 
 * ou peso suportados pela IA do Stability AI.
 */
async function resizeImage(dataUrl: string, maxWidth = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Exporta como PNG ou JPEG comprimido se necessário
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

export class NanobananaService {
  /**
   * Simula a geração de uma imagem para uma instância específica.
   */
  static async generateImage(
    sourceImage: string, 
    prompt: string, 
    strength: number = 0.85, 
    cfgScale: number = 7, 
    onProgress: (p: number) => void
  ): Promise<string> {
    try {
        const API_KEY = import.meta.env.VITE_STABILITY_API_KEY;
        // Mudança para o endpoint de Controle de Estrutura (melhor para novos contextos)
        const API_URL = "/api/stability/v2beta/stable-image/control/structure";

        if (!API_KEY || API_KEY === 'sua_chave_aqui') {
          throw new Error("API Key não configurada no arquivo .env");
        }

        onProgress(5);
        
        const optimizedImage = await resizeImage(sourceImage);
        onProgress(15);

        const formData = new FormData();
        // O endpoint de estrutura não usa 'mode', ele já é especializado
        
        const imageResponse = await fetch(optimizedImage);
        const imageBlob = await imageResponse.blob();
        
        formData.append('image', imageBlob, 'product.png');
        formData.append('prompt', prompt || 'Cinematic product photo');
        
        // No modo Structure, usamos 'control_strength'
        formData.append('control_strength', strength.toString());
        formData.append('output_format', 'png');

        onProgress(30);

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Accept": "application/json" 
          },
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error("Erro nos servidores IA:", errData);
          
          // Se acabar o crédito, entra em modo simulação para não travar o usuário
          if (response.status === 402) {
            toast.info("Créditos esgotados. Entrando em modo Simulação Acadêmica...");
            return this.generateImageMock("fallback", sourceImage, prompt, onProgress);
          }

          const details = errData.errors?.join(", ") || errData.name || "Erro na API";
          throw new Error(`${details} (Status: ${response.status})`);
        }

        onProgress(80);
        const data = await response.json();
        onProgress(100);
        
        if (data.image) {
          return `data:image/png;base64,${data.image}`;
        }
        
        throw new Error("Resposta da API sem dados de imagem");
    } catch (error) {
      console.error("Falha na geração Nanobanana:", error);
      throw error;
    }
  }

  /**
   * Simula a geração de uma imagem para uma instância específica.
   */
  static async generateImageMock(
    instanceId: string,
    sourceImage: string, // Base64 ou URL da imagem anexada
    prompt: string,
    onProgress: (progress: number) => void
  ): Promise<string> {
    // ==========================================
    // MODO ESTATICO / MOCK FALLBACK (V1)
    // ==========================================
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
