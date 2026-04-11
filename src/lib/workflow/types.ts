import { type Node, type Edge } from '@xyflow/react';
import type { WaveSpeedModel, WaveSpeedModelType } from '@/lib/services/wavespeed-service';

export type NodeType = 'productSource' | 'instance';

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  image?: string | null;
  status?: 'idle' | 'syncing' | 'generating' | 'completed' | 'error';
  progress?: number;
  prompt?: string;
  resultImage?: string;
  resultVideo?: string;
  /** WaveSpeed model selected for this instance */
  aiModel?: WaveSpeedModel;
  /** Derived automatically from the selected model type */
  generationType?: WaveSpeedModelType;
  /** Video duration in seconds (3-10) */
  videoDuration?: number;
  /** Video aspect ratio (9:16, 16:9, 1:1, 4:3) */
  videoAspectRatio?: string;
  onUpdate?: (id: string, updates: Partial<WorkflowNodeData>) => void;
  onDelete?: (id: string) => void;
}

export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge;

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
