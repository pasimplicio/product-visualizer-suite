import { type Node, type Edge } from '@xyflow/react';

export type NodeType =
  | 'referenceImage'
  | 'prompt'
  | 'imageOutput'
  | 'videoOutput';

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;

  // Imagem de entrada
  image?: string | null;

  // Resultados gerados
  resultImage?: string;
  resultVideo?: string;

  // Status
  status?: 'idle' | 'generating' | 'completed' | 'error';
  progress?: number;

  // Prompt
  prompt?: string;

  // Configurações de geração
  modelId?: string;
  aspectRatio?: string;
  resolution?: string;

  // Callbacks
  onUpdate?: (id: string, updates: Partial<WorkflowNodeData>) => void;
  onDelete?: (id: string) => void;
}

export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge;

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
}
