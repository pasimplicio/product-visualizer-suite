import { type Node, type Edge } from '@xyflow/react';

/** Todos os tipos de nó suportados */
export type NodeType =
  | 'prompt'
  | 'referenceImage'
  | 'generator'
  | 'imageOutput'
  | 'upscale'
  | 'backgroundRemover'
  // Fase 2 — geração dedicada
  | 'text2image'
  | 'image2image'
  | 'text2video'
  | 'image2video'
  // Fase 2 — utilitários
  | 'promptBuilder'
  | 'note'
  | 'merge'
  | 'gallery'
  // Fase 4 — WaveSpeed
  | 'instance'
  // Fase 4 — Flow control
  | 'condition'
  | 'iterator'
  // Fase 5 — Utilitários avançados
  | 'httpRequest'
  | 'delay';

/** Dados compartilhados por todos os nós */
export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;

  // ─── Imagem ───
  image?: string | null;
  resultImage?: string;
  resultVideo?: string;

  // ─── Status ───
  status?: 'idle' | 'syncing' | 'generating' | 'completed' | 'error';
  progress?: number;

  // ─── Prompt ───
  prompt?: string;

  // ─── Modelo / Gerador ───
  modelId?: string;
  modelType?: 'image' | 'video';
  aspectRatio?: string;
  resolution?: string;
  thinkingLevel?: 'Minimal' | 'Standard' | 'Deep';
  webSearchEnabled?: boolean;
  runCount?: number;
  seed?: number;
  videoStyle?: string;

  // ─── Fase 2: Gallery ───
  images?: string[];

  // ─── Fase 2: PromptBuilder ───
  templatePrompt?: string;
  variables?: Record<string, string>;

  // ─── Fase 2: Note ───
  noteText?: string;

  // ─── Fase 2: Merge ───
  imageA?: string;
  imageB?: string;
  mergeInstruction?: string;

  // ─── Fase 4: Condition ───
  condition?: string;
  conditionResult?: boolean;

  // ─── Fase 4: Iterator ───
  iteratorItems?: string[];
  iteratorIndex?: number;

  // ─── Fase 5: HTTP Request ───
  httpMethod?: string;
  httpUrl?: string;
  httpBody?: string;
  httpResponse?: string;
  httpStatusCode?: number;

  // ─── Fase 5: Delay ───
  delaySeconds?: number;

  // ─── WaveSpeed / Instance ───
  aiModel?: string;
  generationType?: 'image' | 'video';
  videoDuration?: number;
  videoAspectRatio?: string;

  // ─── Callbacks ───
  onUpdate?: (id: string, updates: Partial<WorkflowNodeData>) => void;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
}

export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge;

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
}
