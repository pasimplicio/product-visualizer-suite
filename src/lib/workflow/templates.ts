import type { WorkflowNode, WorkflowEdge } from './types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  nodes: Omit<WorkflowNode, 'data'>[] & { data: Record<string, unknown> }[];
  edges: WorkflowEdge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'product-photo',
    name: 'Foto de Produto',
    description: 'Prompt → gera imagem profissional do produto',
    emoji: '📸',
    nodes: [
      {
        id: 't-2', type: 'prompt', position: { x: 80, y: 180 },
        data: { label: 'Prompt', prompt: 'Professional product photo, studio lighting, white background, 4K quality' },
      },
      {
        id: 't-3', type: 'text2image', position: { x: 340, y: 180 },
        data: { label: 'Text → Image', modelId: 'nano-banana-2', aspectRatio: '1:1' },
      },
    ],
    edges: [
      { id: 'te-1', source: 't-2', sourceHandle: 'prompt-out', target: 't-3', targetHandle: 'prompt-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    ],
  },
  {
    id: 'image-to-video',
    name: 'Imagem para Vídeo',
    description: 'Imagem de referência → animação com Veo',
    emoji: '🎬',
    nodes: [
      {
        id: 'v-2', type: 'referenceImage', position: { x: 80, y: 100 },
        data: { label: 'Imagem de Ref.', image: null },
      },
      {
        id: 'v-3', type: 'prompt', position: { x: 80, y: 260 },
        data: { label: 'Prompt', prompt: 'Slow cinematic zoom, smooth motion, studio lighting' },
      },
      {
        id: 'v-4', type: 'image2video', position: { x: 360, y: 170 },
        data: { label: 'Image → Video', modelId: 'veo-3.1-lite', aspectRatio: '16:9', resolution: '720p' },
      },
    ],
    edges: [
      { id: 've-1', source: 'v-2', sourceHandle: 'image-out', target: 'v-4', targetHandle: 'image-in', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 've-2', source: 'v-3', sourceHandle: 'prompt-out', target: 'v-4', targetHandle: 'prompt-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    ],
  },
  {
    id: 'bg-swap',
    name: 'Troca de Fundo',
    description: 'Remove fundo do produto + coloca em novo cenário',
    emoji: '🎭',
    nodes: [
      {
        id: 'b-2', type: 'referenceImage', position: { x: 80, y: 100 },
        data: { label: 'Produto', image: null },
      },
      {
        id: 'b-3', type: 'backgroundRemover', position: { x: 320, y: 100 },
        data: { label: 'Remover Fundo' },
      },
      {
        id: 'b-4', type: 'prompt', position: { x: 80, y: 280 },
        data: { label: 'Novo Cenário', prompt: 'Luxury kitchen counter, marble background, warm sunlight, professional photography' },
      },
      {
        id: 'b-5', type: 'merge', position: { x: 580, y: 180 },
        data: { label: 'Composição Final', mergeInstruction: 'Place the product from image A naturally on the scene in image B. Match lighting and perspective. Make it look photorealistic.' },
      },
    ],
    edges: [
      { id: 'be-1', source: 'b-2', sourceHandle: 'image-out', target: 'b-3', targetHandle: 'image-in', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'be-2', source: 'b-3', sourceHandle: 'result-out', target: 'b-5', targetHandle: 'image-a', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'be-3', source: 'b-4', sourceHandle: 'prompt-out', target: 'b-5', targetHandle: 'image-b', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    ],
  },
  {
    id: 'product-variations',
    name: 'Variações de Produto',
    description: 'Uma imagem → upscale + variações com gallery',
    emoji: '🎨',
    nodes: [
      {
        id: 'p-2', type: 'referenceImage', position: { x: 80, y: 180 },
        data: { label: 'Produto Base', image: null },
      },
      {
        id: 'p-3', type: 'upscale', position: { x: 320, y: 180 },
        data: { label: 'Upscale' },
      },
      {
        id: 'p-4', type: 'image2image', position: { x: 560, y: 80 },
        data: { label: 'Variação 1', prompt: 'Same product, black matte finish, dark studio background', modelId: 'nano-banana-2', aspectRatio: '1:1' },
      },
      {
        id: 'p-5', type: 'image2image', position: { x: 560, y: 280 },
        data: { label: 'Variação 2', prompt: 'Same product, white glossy finish, bright minimalist background', modelId: 'nano-banana-2', aspectRatio: '1:1' },
      },
      {
        id: 'p-6', type: 'gallery', position: { x: 820, y: 170 },
        data: { label: 'Galeria', images: [] },
      },
    ],
    edges: [
      { id: 'pe-1', source: 'p-2', sourceHandle: 'image-out', target: 'p-3', targetHandle: 'image-in', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'pe-2', source: 'p-3', sourceHandle: 'result-out', target: 'p-4', targetHandle: 'image-in', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'pe-3', source: 'p-3', sourceHandle: 'result-out', target: 'p-5', targetHandle: 'image-in', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'pe-4', source: 'p-4', sourceHandle: 'result-out', target: 'p-6', targetHandle: 'image-in', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'pe-5', source: 'p-5', sourceHandle: 'result-out', target: 'p-6', targetHandle: 'image-in', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
];
