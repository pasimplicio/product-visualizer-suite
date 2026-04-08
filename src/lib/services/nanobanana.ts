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
    sourceImage: string, // Base64 ou URL da imagem anexada
    prompt: string,
    onProgress: (progress: number) => void
  ): Promise<string> {
    
    // ==========================================
    // INTERCEPTADOR DE API REAL DA STABILITY
    // ==========================================
    const API_KEY = import.meta.env.VITE_STABILITY_API_KEY;
    const API_URL = import.meta.env.VITE_STABILITY_ENDPOINT || "https://api.stability.ai/v2beta/stable-image/generate/sd3";

    if (API_KEY) {
      console.log(`⚡ [Stability AI] Iniciando Conexão Oficial. Traduzindo imagem para o Robô...`);
      try {
        onProgress(15);
        
        // As IAs reais exigem que a foto viaje como um "Arquivo de Formulário" (Multipart)
        const formData = new FormData();
        const imageBlob = dataURLtoBlob(sourceImage);
        
        formData.append('image', imageBlob, 'product.png');
        formData.append('prompt', prompt);
        formData.append('mode', 'image-to-image');
        formData.append('strength', '0.50'); // Mantém muito do shape original (0 = Cópia / 1 = Novo desenho)
        formData.append('output_format', 'png');

        onProgress(30);

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            // Nota: NÃO inserimos "Content-Type" porque o navegador precisa calcular as amarras do 'multipart' sozinho.
            "Authorization": `Bearer ${API_KEY}`,
            "Accept": "application/json" 
          },
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error("Erro interno dos servidores IA:", errData);
          throw new Error(`A Stability AI barrou o pacote com status: ${response.status}`);
        }

        onProgress(80);
        const data = await response.json();
        onProgress(100);
        
        // O robô da Stability devolve um arquivo Base64 cru se der certo no JSON
        if (data.image) {
          return `data:image/png;base64,${data.image}`;
        }
        
        throw new Error("Sucesso na geração, mas falha ao recuperar a imagem.");
        
      } catch (error) {
        console.error("Erro Crítico no Endpoint:", error);
        throw error;
      }
    }

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
