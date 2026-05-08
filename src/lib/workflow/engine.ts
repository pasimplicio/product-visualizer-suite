import { GeminiService } from '@/lib/services/gemini-service';
import type { WorkflowNode, WorkflowEdge, WorkflowNodeData } from './types';

// ─── Tipos de execução ──────────────────────────────────────────────────────

export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'error' | 'skipped';

export interface NodeExecutionLog {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: NodeExecutionStatus;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  error?: string;
}

export interface ExecutionRecord {
  id: string;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  status: 'running' | 'completed' | 'error' | 'cancelled';
  nodeLogs: NodeExecutionLog[];
  totalNodes: number;
  completedNodes: number;
}

export interface EngineContext {
  onNodeUpdate: (id: string, updates: Partial<WorkflowNodeData>) => void;
  addLibraryItem: (
    url: string,
    type: 'image' | 'video' | 'upscale' | 'background-remover',
    prompt?: string
  ) => void;
}

// ─── Nós passivos (não executados pelo engine) ────────────────────────────

const PASSIVE_TYPES = new Set(['prompt', 'referenceImage']);

// ─── Topological sort (Kahn) ──────────────────────────────────────────────

function topoSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj      = new Map<string, string[]>();

  for (const n of nodes) { inDegree.set(n.id, 0); adj.set(n.id, []); }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  }

  const queue = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
  const result: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    for (const nb of adj.get(id) || []) {
      const deg = (inDegree.get(nb) || 0) - 1;
      inDegree.set(nb, deg);
      if (deg === 0) queue.push(nb);
    }
  }
  return result;
}

// ─── Resolve inputs de nós upstream ──────────────────────────────────────

function resolveInputs(
  nodeId: string,
  edges: WorkflowEdge[],
  resultStore: Map<string, Partial<WorkflowNodeData>>
): Partial<WorkflowNodeData> {
  const resolved: Partial<WorkflowNodeData> = {};
  for (const edge of edges.filter((e) => e.target === nodeId)) {
    const src = resultStore.get(edge.source);
    if (!src) continue;
    if (edge.targetHandle === 'image-in') {
      const img = src.resultImage || src.image;
      if (img) resolved.image = img as string;
    }
    if (edge.targetHandle === 'prompt-in') {
      if (src.prompt) resolved.prompt = src.prompt as string;
    }
  }
  return resolved;
}

// ─── Execução por tipo de nó ──────────────────────────────────────────────

async function executeNodeOperation(
  node: WorkflowNode,
  context: EngineContext,
  onProgress: (p: number) => void
): Promise<Partial<WorkflowNodeData>> {
  const { data } = node;

  switch (node.type) {
    case 'imageOutput': {
      onProgress(20);
      const result = await GeminiService.generateImage({
        prompt: (data.prompt as string) || 'Professional product photo, studio lighting',
        modelId: (data.modelId as string) || 'nano-banana-legacy',
        referenceImage: (data.image as string) || undefined,
        aspectRatio: (data.aspectRatio as string) || '1:1',
      });
      if (!result.success || !result.data?.imageUrl) throw new Error(result.error || 'Falha na geração de imagem');
      context.addLibraryItem(result.data.imageUrl, 'image', data.prompt as string);
      return { status: 'completed', resultImage: result.data.imageUrl, progress: 100 };
    }

    case 'videoOutput': {
      const init = await GeminiService.generateVideo({
        prompt: (data.prompt as string) || 'Smooth cinematic motion, professional lighting',
        modelId: (data.modelId as string) || 'veo-3.1-lite',
        referenceImage: (data.image as string) || undefined,
        aspectRatio: (data.aspectRatio as string) || '16:9',
        resolution: (data.resolution as string) || '720p',
      });
      if (!init.success || !init.data?.operationName) throw new Error(init.error || 'Falha ao iniciar vídeo');
      onProgress(20);
      const poll = await GeminiService.pollVideoResult(init.data.operationName, onProgress);
      if (!poll.success || !poll.data?.videoUrl) throw new Error(poll.error || 'Falha na geração de vídeo');
      context.addLibraryItem(poll.data.videoUrl, 'video', data.prompt as string);
      return { status: 'completed', resultVideo: poll.data.videoUrl, resultImage: undefined, progress: 100 };
    }

    default:
      return {};
  }
}

// ─── Engine principal ─────────────────────────────────────────────────────

export class WorkflowEngine {
  private _cancelled = false;

  cancel(): void { this._cancelled = true; }

  async execute(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: EngineContext,
    onRecordUpdate?: (record: ExecutionRecord) => void
  ): Promise<ExecutionRecord> {
    this._cancelled = false;

    const record: ExecutionRecord = {
      id: `exec-${Date.now()}`,
      startedAt: Date.now(),
      status: 'running',
      nodeLogs: [],
      totalNodes: 0,
      completedNodes: 0,
    };

    const order = topoSort(nodes, edges);
    const executableIds = order.filter((id) => {
      const n = nodes.find((x) => x.id === id);
      return n && !PASSIVE_TYPES.has(n.type || '');
    });
    record.totalNodes = executableIds.length;
    onRecordUpdate?.({ ...record });

    const resultStore = new Map<string, Partial<WorkflowNodeData>>();
    for (const n of nodes) resultStore.set(n.id, { ...n.data });

    for (const nodeId of order) {
      if (this._cancelled) { record.status = 'cancelled'; break; }

      const node = nodes.find((n) => n.id === nodeId);
      if (!node || PASSIVE_TYPES.has(node.type || '')) continue;

      const resolved = resolveInputs(nodeId, edges, resultStore);
      const mergedData = { ...resultStore.get(nodeId), ...resolved };
      resultStore.set(nodeId, mergedData);

      const log: NodeExecutionLog = {
        nodeId,
        nodeLabel: (node.data.label as string) || node.type || '',
        nodeType: node.type || '',
        status: 'running',
        startedAt: Date.now(),
      };

      context.onNodeUpdate(nodeId, { ...resolved, status: 'generating', progress: 5, resultImage: undefined, resultVideo: undefined });

      try {
        const execNode: WorkflowNode = { ...node, data: { ...node.data, ...mergedData } as WorkflowNodeData };
        const result = await executeNodeOperation(execNode, context, (p) => context.onNodeUpdate(nodeId, { progress: p }));
        resultStore.set(nodeId, { ...mergedData, ...result });
        context.onNodeUpdate(nodeId, result);
        log.status = 'completed';
        log.completedAt = Date.now();
        log.durationMs = log.completedAt - log.startedAt;
        record.completedNodes++;
      } catch (err: any) {
        context.onNodeUpdate(nodeId, { status: 'error', progress: 0 });
        log.status = 'error';
        log.error = err.message;
        log.completedAt = Date.now();
        log.durationMs = log.completedAt! - log.startedAt;
      }

      record.nodeLogs.push(log);
      onRecordUpdate?.({ ...record });
    }

    if (!this._cancelled) {
      record.status = record.nodeLogs.some((l) => l.status === 'error') ? 'error' : 'completed';
    }
    record.completedAt = Date.now();
    record.durationMs = record.completedAt - record.startedAt;
    onRecordUpdate?.({ ...record });
    return record;
  }
}

export const workflowEngine = new WorkflowEngine();
