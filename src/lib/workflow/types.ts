import { type Node, type Edge } from '@xyflow/react';

/** Todos os tipos de nó suportados */
export type NodeType =
  | 'prompt'
  | 'referenceImage'
  | 'generator'
  | 'imageOutput'
  | 'upscale'
  | 'backgroundRemover';

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
