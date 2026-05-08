import { GeminiService } from '@/lib/services/gemini-service';
import { getGeminiModel, GEMINI_MODELS } from '@/lib/services/gemini-models';
import type { WorkflowNode, WorkflowEdge, WorkflowNodeData } from './types';

// ─── Tipos de execução ─────────────────────────────────────────────────────

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

// ─── Nós que não precisam de execução pelo engine ─────────────────────────

const PASSIVE_TYPES = new Set([
  'trigger', 'imageOutput', 'prompt', 'referenceImage',
  'promptBuilder', 'note', 'gallery', 'instance',
]);

// ─── Avalia condição de um ConditionNode ──────────────────────────────────

function evaluateCondition(
  condition: string,
  data: Partial<WorkflowNodeData>
): boolean {
  switch (condition) {
    case 'has-image':   return !!(data.image || data.resultImage);
    case 'has-prompt':  return !!(data.prompt && (data.prompt as string).trim().length > 0);
    case 'always-true': return true;
    case 'always-false': return false;
    default:            return true;
  }
}

// ─── Verifica se nó deve ser pulado por condição ─────────────────────────

function shouldSkipByCondition(
  nodeId: string,
  edges: WorkflowEdge[],
  resultStore: Map<string, Partial<WorkflowNodeData>>
): boolean {
  for (const edge of edges.filter((e) => e.target === nodeId)) {
    const src = resultStore.get(edge.source);
    if (!src) continue;
    // Se a aresta saiu do false-out de uma condição e conditionResult é false → pula
    if (edge.sourceHandle === 'false-out' && src.conditionResult === false) return true;
    // Se a aresta saiu do true-out de uma condição e conditionResult é true → não pula
    if (edge.sourceHandle === 'true-out' && src.conditionResult === false) return true;
  }
  return false;
}

// ─── Topological sort (Kahn) ──────────────────────────────────────────────

function topoSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  }

  const queue = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
  const result: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    for (const neighbor of adj.get(id) || []) {
      const deg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  return result;
}

// ─── Resolve inputs de nós conectados ────────────────────────────────────

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
    // MergeNode: image-a e image-b
    if (edge.targetHandle === 'image-a') {
      const img = src.resultImage || src.image;
      if (img) resolved.imageA = img as string;
    }
    if (edge.targetHandle === 'image-b') {
      const img = src.resultImage || src.image;
      if (img) resolved.imageB = img as string;
    }
    // GalleryOutputNode: acumula array
    if (edge.targetHandle === 'image-in') {
      const img = src.resultImage || src.image;
      if (img) {
        const current = (resolved.images as string[]) || [];
        resolved.images = [...current, img as string];
      }
    }
  }

  return resolved;
}

// ─── Lógica de execução por tipo de nó ───────────────────────────────────

async function executeNodeOperation(
  node: WorkflowNode,
  context: EngineContext,
  onProgress: (p: number) => void
): Promise<Partial<WorkflowNodeData>> {
  const { data } = node;

  switch (node.type) {
    case 'generator': {
      const modelInfo = getGeminiModel(data.modelId as string) || GEMINI_MODELS[0];
      const isVideo = modelInfo.type === 'video';

      if (isVideo) {
        const init = await GeminiService.generateVideo({
          prompt: (data.prompt as string) || 'Cinematic product showcase, professional lighting',
          modelId: modelInfo.id,
          referenceImage: (data.image as string) || undefined,
          aspectRatio: (data.aspectRatio as string) || '16:9',
          resolution: (data.resolution as string) || '720p',
        });
        if (!init.success || !init.data?.operationName) {
          throw new Error(init.error || 'Falha ao iniciar geração de vídeo');
        }
        onProgress(25);
        const poll = await GeminiService.pollVideoResult(init.data.operationName, onProgress);
        if (!poll.success || !poll.data?.videoUrl) {
          throw new Error(poll.error || 'Falha na geração de vídeo');
        }
        context.addLibraryItem(poll.data.videoUrl, 'video', data.prompt as string);
        return { status: 'completed', resultVideo: poll.data.videoUrl, resultImage: undefined, progress: 100 };
      } else {
        onProgress(30);
        const result = await GeminiService.generateImage({
          prompt: (data.prompt as string) || 'Professional product photo, studio lighting',
          modelId: modelInfo.id,
          referenceImage: (data.image as string) || undefined,
          aspectRatio: (data.aspectRatio as string) || '1:1',
        });
        if (!result.success || !result.data?.imageUrl) {
          throw new Error(result.error || 'Falha na geração de imagem');
        }
        context.addLibraryItem(result.data.imageUrl, 'image', data.prompt as string);
        return { status: 'completed', resultImage: result.data.imageUrl, resultVideo: undefined, progress: 100 };
      }
    }

    case 'upscale': {
      if (!data.image) throw new Error('Nenhuma imagem conectada para upscale');
      onProgress(30);
      const result = await GeminiService.upscaleImage(data.image as string);
      if (!result.success || !result.data?.imageUrl) {
        throw new Error(result.error || 'Falha no upscale');
      }
      context.addLibraryItem(result.data.imageUrl, 'upscale');
      return { status: 'completed', resultImage: result.data.imageUrl, progress: 100 };
    }

    case 'backgroundRemover': {
      if (!data.image) throw new Error('Nenhuma imagem conectada para remover fundo');
      onProgress(30);
      const result = await GeminiService.removeBackground(data.image as string);
      if (!result.success || !result.data?.imageUrl) {
        throw new Error(result.error || 'Falha na remoção de fundo');
      }
      context.addLibraryItem(result.data.imageUrl, 'background-remover');
      return { status: 'completed', resultImage: result.data.imageUrl, progress: 100 };
    }

    case 'text2image': {
      onProgress(30);
      const result = await GeminiService.generateImage({
        prompt: (data.prompt as string) || 'Professional product photo, studio lighting',
        modelId: (data.modelId as string) || 'nano-banana-2',
        aspectRatio: (data.aspectRatio as string) || '1:1',
      });
      if (!result.success || !result.data?.imageUrl) throw new Error(result.error || 'Falha na geração');
      context.addLibraryItem(result.data.imageUrl, 'image', data.prompt as string);
      return { status: 'completed', resultImage: result.data.imageUrl, progress: 100 };
    }

    case 'image2image': {
      if (!data.image) throw new Error('Nenhuma imagem conectada para image-to-image');
      onProgress(30);
      const result = await GeminiService.generateImage({
        prompt: (data.prompt as string) || 'Transform this image, improve quality and style',
        modelId: (data.modelId as string) || 'nano-banana-2',
        referenceImage: data.image as string,
        aspectRatio: (data.aspectRatio as string) || '1:1',
      });
      if (!result.success || !result.data?.imageUrl) throw new Error(result.error || 'Falha na transformação');
      context.addLibraryItem(result.data.imageUrl, 'image', data.prompt as string);
      return { status: 'completed', resultImage: result.data.imageUrl, progress: 100 };
    }

    case 'text2video': {
      const videoInit = await GeminiService.generateVideo({
        prompt: (data.prompt as string) || 'Cinematic product showcase',
        modelId: (data.modelId as string) || 'veo-3.1-lite',
        aspectRatio: (data.aspectRatio as string) || '16:9',
        resolution: (data.resolution as string) || '720p',
      });
      if (!videoInit.success || !videoInit.data?.operationName) throw new Error(videoInit.error || 'Falha ao iniciar vídeo');
      onProgress(25);
      const videoPoll = await GeminiService.pollVideoResult(videoInit.data.operationName, onProgress);
      if (!videoPoll.success || !videoPoll.data?.videoUrl) throw new Error(videoPoll.error || 'Falha na geração de vídeo');
      context.addLibraryItem(videoPoll.data.videoUrl, 'video', data.prompt as string);
      return { status: 'completed', resultVideo: videoPoll.data.videoUrl, resultImage: undefined, progress: 100 };
    }

    case 'image2video': {
      if (!data.image) throw new Error('Nenhuma imagem conectada para image-to-video');
      const i2vInit = await GeminiService.generateVideo({
        prompt: (data.prompt as string) || 'Animate this image with smooth cinematic motion',
        modelId: (data.modelId as string) || 'veo-3.1-lite',
        referenceImage: data.image as string,
        aspectRatio: (data.aspectRatio as string) || '16:9',
        resolution: (data.resolution as string) || '720p',
      });
      if (!i2vInit.success || !i2vInit.data?.operationName) throw new Error(i2vInit.error || 'Falha ao iniciar vídeo');
      onProgress(25);
      const i2vPoll = await GeminiService.pollVideoResult(i2vInit.data.operationName, onProgress);
      if (!i2vPoll.success || !i2vPoll.data?.videoUrl) throw new Error(i2vPoll.error || 'Falha na animação');
      context.addLibraryItem(i2vPoll.data.videoUrl, 'video', data.prompt as string);
      return { status: 'completed', resultVideo: i2vPoll.data.videoUrl, resultImage: undefined, progress: 100 };
    }

    case 'merge': {
      const imgA = data.imageA as string;
      const imgB = data.imageB as string;
      if (!imgA || !imgB) throw new Error('Conecte as imagens A e B ao nó de Merge');
      onProgress(30);
      const mergeResult = await GeminiService.generateImageMulti({
        prompt: (data.mergeInstruction as string) ||
          'Combine these two images: use the main subject from the first and the background from the second. Make it look natural and realistic.',
        referenceImages: [imgA, imgB],
      });
      if (!mergeResult.success || !mergeResult.data?.imageUrl) throw new Error(mergeResult.error || 'Falha ao mesclar');
      context.addLibraryItem(mergeResult.data.imageUrl, 'image');
      return { status: 'completed', resultImage: mergeResult.data.imageUrl, progress: 100 };
    }

    case 'condition': {
      const result = evaluateCondition(data.condition as string || 'has-image', data);
      return { status: 'completed', conditionResult: result, progress: 100 };
    }

    case 'iterator': {
      const items = (data.iteratorItems as string[]) || [];
      const idx   = (data.iteratorIndex as number) ?? 0;
      const currentPrompt = items[idx] || '';
      const nextIndex = (idx + 1) % Math.max(items.length, 1);
      return { status: 'completed', prompt: currentPrompt, iteratorIndex: nextIndex, progress: 100 };
    }

    case 'delay': {
      const ms = ((data.delaySeconds as number) ?? 5) * 1000;
      onProgress(50);
      await new Promise((r) => setTimeout(r, ms));
      return { status: 'completed', progress: 100 };
    }

    case 'httpRequest': {
      const url = (data.httpUrl as string) || '';
      if (!url.trim()) throw new Error('URL não configurada no nó HTTP Request');

      const method = (data.httpMethod as string) || 'POST';
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        let body = (data.httpBody as string) || '';
        if (data.prompt) body = body.replace(/\{\{prompt\}\}/g, data.prompt as string);
        if (data.image)  body = body.replace(/\{\{image\}\}/g, data.image as string);
        if (body.trim()) options.body = body;
      }

      onProgress(30);
      const res = await fetch(url, options);
      const text = await res.text();
      onProgress(100);

      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* leave as text */ }

      return { status: 'completed', progress: 100, httpResponse: pretty, httpStatusCode: res.status };
    }

    default:
      return {};
  }
}

// ─── Engine principal ─────────────────────────────────────────────────────

export class WorkflowEngine {
  private _cancelled = false;

  cancel(): void {
    this._cancelled = true;
  }

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

    // Acumula outputs conforme nós concluem
    const resultStore = new Map<string, Partial<WorkflowNodeData>>();
    for (const n of nodes) resultStore.set(n.id, { ...n.data });

    for (const nodeId of order) {
      if (this._cancelled) {
        record.status = 'cancelled';
        break;
      }

      const node = nodes.find((n) => n.id === nodeId);
      if (!node || PASSIVE_TYPES.has(node.type || '')) continue;

      // Verifica se nó deve ser pulado por condição upstream
      if (shouldSkipByCondition(nodeId, edges, resultStore)) {
        const log: NodeExecutionLog = {
          nodeId,
          nodeLabel: (node.data.label as string) || node.type || '',
          nodeType: node.type || '',
          status: 'skipped',
          startedAt: Date.now(),
          completedAt: Date.now(),
          durationMs: 0,
        };
        record.nodeLogs.push(log);
        context.onNodeUpdate(nodeId, { status: 'idle' });
        onRecordUpdate?.({ ...record });
        continue;
      }

      // Resolve entradas de nós upstream
      const resolved = resolveInputs(nodeId, edges, resultStore);
      const mergedData: Partial<WorkflowNodeData> = { ...resultStore.get(nodeId), ...resolved };
      resultStore.set(nodeId, mergedData);

      const log: NodeExecutionLog = {
        nodeId,
        nodeLabel: (node.data.label as string) || node.type || '',
        nodeType: node.type || '',
        status: 'running',
        startedAt: Date.now(),
      };

      // Sinaliza nó como "gerando" com inputs resolvidos
      context.onNodeUpdate(nodeId, {
        ...resolved,
        status: 'generating',
        progress: 5,
        resultImage: undefined,
        resultVideo: undefined,
      });

      try {
        const execNode: WorkflowNode = {
          ...node,
          data: { ...node.data, ...mergedData } as WorkflowNodeData,
        };

        const result = await executeNodeOperation(execNode, context, (p) =>
          context.onNodeUpdate(nodeId, { progress: p })
        );

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
