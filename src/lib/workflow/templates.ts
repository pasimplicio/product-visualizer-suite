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
    description: 'Imagem de referência → gera foto profissional',
    emoji: '📸',
    nodes: [
      { id: 'p-1', type: 'referenceImage', position: { x: 80, y: 180 }, data: { label: 'Entrada de Imagem', image: null } },
      { id: 'p-2', type: 'prompt',         position: { x: 80, y: 380 }, data: { label: 'Prompt', prompt: 'Professional product photo, studio lighting, white background, 4K quality' } },
      { id: 'p-3', type: 'imageOutput',    position: { x: 380, y: 260 }, data: { label: 'Saída de Imagem', modelId: 'nano-banana-2', aspectRatio: '1:1' } },
    ],
    edges: [
      { id: 'e-1', source: 'p-1', sourceHandle: 'image-out',  target: 'p-3', targetHandle: 'image-in',  animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e-2', source: 'p-2', sourceHandle: 'prompt-out', target: 'p-3', targetHandle: 'prompt-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    ],
  },
  {
    id: 'product-video',
    name: 'Vídeo de Produto',
    description: 'Imagem de referência → animação com Veo',
    emoji: '🎬',
    nodes: [
      { id: 'v-1', type: 'referenceImage', position: { x: 80, y: 180 }, data: { label: 'Entrada de Imagem', image: null } },
      { id: 'v-2', type: 'prompt',         position: { x: 80, y: 380 }, data: { label: 'Prompt', prompt: 'Smooth cinematic motion, professional lighting, elegant product showcase' } },
      { id: 'v-3', type: 'videoOutput',    position: { x: 380, y: 260 }, data: { label: 'Saída de Vídeo', modelId: 'veo-3.1-lite', aspectRatio: '16:9', resolution: '720p' } },
    ],
    edges: [
      { id: 'e-1', source: 'v-1', sourceHandle: 'image-out',  target: 'v-3', targetHandle: 'image-in',  animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e-2', source: 'v-2', sourceHandle: 'prompt-out', target: 'v-3', targetHandle: 'prompt-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    ],
  },
  {
    id: 'image-and-video',
    name: 'Imagem + Vídeo',
    description: 'Gera imagem e vídeo ao mesmo tempo',
    emoji: '✨',
    nodes: [
      { id: 'a-1', type: 'referenceImage', position: { x: 80, y: 240 }, data: { label: 'Entrada de Imagem', image: null } },
      { id: 'a-2', type: 'prompt',         position: { x: 80, y: 440 }, data: { label: 'Prompt', prompt: 'Professional product showcase, clean background, studio lighting' } },
      { id: 'a-3', type: 'imageOutput',    position: { x: 380, y: 140 }, data: { label: 'Saída de Imagem', modelId: 'nano-banana-2', aspectRatio: '1:1' } },
      { id: 'a-4', type: 'videoOutput',    position: { x: 380, y: 360 }, data: { label: 'Saída de Vídeo', modelId: 'veo-3.1-lite', aspectRatio: '16:9', resolution: '720p' } },
    ],
    edges: [
      { id: 'e-1', source: 'a-1', sourceHandle: 'image-out',  target: 'a-3', targetHandle: 'image-in',  animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e-2', source: 'a-2', sourceHandle: 'prompt-out', target: 'a-3', targetHandle: 'prompt-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e-3', source: 'a-1', sourceHandle: 'image-out',  target: 'a-4', targetHandle: 'image-in',  animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e-4', source: 'a-2', sourceHandle: 'prompt-out', target: 'a-4', targetHandle: 'prompt-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    ],
  },
];
