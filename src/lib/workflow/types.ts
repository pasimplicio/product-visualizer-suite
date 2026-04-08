import { type Node, type Edge } from '@xyflow/react';

export type NodeType = 'productSource' | 'instance';

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  image?: string | null;
  status?: 'idle' | 'syncing' | 'generating' | 'completed' | 'error';
  progress?: number;
  prompt?: string;
  resultImage?: string;
  onUpdate?: (id: string, updates: Partial<WorkflowNodeData>) => void;
  onDelete?: (id: string) => void;
}

export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge;

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
