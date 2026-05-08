import type { AIProvider } from './types';
import { GeminiProvider } from './gemini-provider';

class ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  constructor() {
    this.register(new GeminiProvider());
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getDefault(): AIProvider {
    return this.providers.get('gemini')!;
  }

  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailable(): AIProvider[] {
    return this.getAll().filter((p) => p.isAvailable());
  }
}

export const providerRegistry = new ProviderRegistry();
