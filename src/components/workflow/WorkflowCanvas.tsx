import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  Connection,
  applyEdgeChanges,
  applyNodeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PromptNode } from './nodes/PromptNode';
import { ReferenceImageNode } from './nodes/ReferenceImageNode';
import { GeneratorNode } from './nodes/GeneratorNode';
import { ImageOutputNode } from './nodes/ImageOutputNode';
import { UpscaleNode } from './nodes/UpscaleNode';
import { BackgroundRemoverNode } from './nodes/BackgroundRemoverNode';
import { Text2ImageNode } from './nodes/Text2ImageNode';
import { Image2ImageNode } from './nodes/Image2ImageNode';
import { Text2VideoNode } from './nodes/Text2VideoNode';
import { Image2VideoNode } from './nodes/Image2VideoNode';
import { PromptBuilderNode } from './nodes/PromptBuilderNode';
import { NoteNode } from './nodes/NoteNode';
import { MergeNode } from './nodes/MergeNode';
import { GalleryOutputNode } from './nodes/GalleryOutputNode';
import { WorkflowSidebar } from './WorkflowSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { CanvasToolbar } from './CanvasToolbar';
import { ExecutionPanel } from './ExecutionPanel';
import { CommandPalette } from './CommandPalette';
import { ContextMenu } from './ContextMenu';
import { InstanceNode } from './nodes/InstanceNode';
import { ConditionNode } from './nodes/ConditionNode';
import { IteratorNode } from './nodes/IteratorNode';
import { HttpRequestNode } from './nodes/HttpRequestNode';
import { DelayNode } from './nodes/DelayNode';
import { WorkflowNode, WorkflowEdge, WorkflowNodeData } from '@/lib/workflow/types';
import { WorkflowEngine, ExecutionRecord } from '@/lib/workflow/engine';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

const nodeTypes = {
  prompt: PromptNode,
  referenceImage: ReferenceImageNode,
  generator: GeneratorNode,
  imageOutput: ImageOutputNode,
  upscale: UpscaleNode,
  backgroundRemover: BackgroundRemoverNode,
  text2image: Text2ImageNode,
  image2image: Image2ImageNode,
  text2video: Text2VideoNode,
  image2video: Image2VideoNode,
  promptBuilder: PromptBuilderNode,
  note: NoteNode,
  merge: MergeNode,
  gallery: GalleryOutputNode,
  // Fase 4
  instance: InstanceNode,
  condition: ConditionNode,
  iterator: IteratorNode,
  // Fase 5
  httpRequest: HttpRequestNode,
  delay: DelayNode,
};

let nodeCounter = 10;

// Strip runtime callbacks before saving to history/export
function stripCallbacks(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map((n) => ({
    ...n,
    data: Object.fromEntries(
      Object.entries(n.data).filter(([k]) => !['onUpdate', 'onDelete', 'onRunWorkflow'].includes(k))
    ) as WorkflowNodeData,
  }));
}

interface WorkflowCanvasProps {
  workflowName?: string;
  onWorkflowNameChange?: (name: string) => void;
}

const WorkflowCanvasInner = ({ workflowName, onWorkflowNameChange }: WorkflowCanvasProps) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.1);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string | null } | null>(null);
  const engineRef = useRef(new WorkflowEngine());
  const historyRef = useRef<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }[]>([]);
  const historyIndexRef = useRef(-1);
  const isTravelingRef = useRef(false);
  const { addLibraryItem } = useLibrary();
  const { screenToFlowPosition } = useReactFlow();

  // ─── History helpers ───────────────────────────────────────────────────

  const pushHistory = useCallback((ns: WorkflowNode[], es: WorkflowEdge[]) => {
    if (isTravelingRef.current) return;
    const snapshot = { nodes: stripCallbacks(ns), edges: es.map((e) => ({ ...e })) };
    // Discard redo stack
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 60) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // ─── Callbacks de nó ───────────────────────────────────────────────────

  const onUpdateNode = useCallback((id: string, updates: Partial<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
      )
    );
  }, []);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => {
      const next = nds.filter((node) => node.id !== id);
      setEdges((eds) => {
        const nextEdges = eds.filter((e) => e.source !== id && e.target !== id);
        pushHistory(next, nextEdges);
        return nextEdges;
      });
      return next;
    });
    setSelectedNodeId(null);
    toast.info('Nó removido');
  }, [pushHistory]);

  // ─── Injetar callbacks em todos os nós ────────────────────────────────

  const injectCallbacks = useCallback(
    (nds: WorkflowNode[]): WorkflowNode[] =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onUpdate: onUpdateNode,
          onDelete: onDeleteNode,
        },
      })),
    [onUpdateNode, onDeleteNode]
  );

  // ─── Execução do workflow ──────────────────────────────────────────────

  const runWorkflow = useCallback(async () => {
    if (isRunning) { toast.warning('Workflow já está em execução'); return; }

    const executableNodes = nodes.filter(
      (n) => !['trigger', 'imageOutput', 'prompt', 'referenceImage'].includes(n.type || '')
    );
    if (executableNodes.length === 0) {
      toast.error('Nenhum nó para executar', { description: 'Adicione nós de geração ou transformação.' });
      return;
    }

    setIsRunning(true);
    setShowExecutionPanel(true);
    toast.success('Workflow iniciado', { description: `${executableNodes.length} nós na fila` });

    const nodeSnapshot = nodes.map((n) => ({ ...n, data: { ...n.data } }));
    const edgeSnapshot = [...edges];

    const record = await engineRef.current.execute(
      nodeSnapshot, edgeSnapshot,
      { onNodeUpdate: onUpdateNode, addLibraryItem },
      (updated) => {
        setExecutions((prev) => {
          const idx = prev.findIndex((r) => r.id === updated.id);
          if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
          return [...prev, updated];
        });
      }
    );

    setIsRunning(false);

    if (record.status === 'completed') {
      toast.success('Workflow concluído!', {
        description: `${record.completedNodes}/${record.totalNodes} nós em ${((record.durationMs || 0) / 1000).toFixed(1)}s`,
      });
    } else if (record.status === 'error') {
      toast.error('Workflow com erros', { description: `${record.completedNodes}/${record.totalNodes} bem-sucedidos` });
    }
  }, [isRunning, nodes, edges, onUpdateNode, addLibraryItem]);

  const cancelWorkflow = useCallback(() => {
    engineRef.current.cancel();
    setIsRunning(false);
    toast.info('Workflow cancelado');
  }, []);

  // ─── Global node-update event ──────────────────────────────────────────

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.id && e.detail?.updates) onUpdateNode(e.detail.id, e.detail.updates);
    };
    window.addEventListener('workflow-node-update', handler);
    setNodes((nds) => injectCallbacks(nds));
    return () => window.removeEventListener('workflow-node-update', handler);
  }, [onUpdateNode, injectCallbacks, runWorkflow]);

  // ─── Propagação de dados entre nós conectados ─────────────────────────

  useEffect(() => {
    let hasChanges = false;
    const newNodes = nodes.map((node) => {
      const type = node.type || '';

      if (['generator', 'upscale', 'backgroundRemover', 'imageOutput',
           'text2image', 'image2image', 'text2video', 'image2video'].includes(type)) {
        const imageEdge  = edges.find((e) => e.target === node.id && e.targetHandle === 'image-in');
        const promptEdge = edges.find((e) => e.target === node.id && e.targetHandle === 'prompt-in');
        let updated = { ...node };

        if (imageEdge) {
          const src = nodes.find((n) => n.id === imageEdge.source);
          const srcImg = src?.data.resultImage || src?.data.image;
          if (srcImg && node.data.image !== srcImg) { hasChanges = true; updated = { ...updated, data: { ...updated.data, image: srcImg } }; }
        }
        if (promptEdge) {
          const src = nodes.find((n) => n.id === promptEdge.source);
          if (src?.data.prompt && node.data.prompt !== src.data.prompt) { hasChanges = true; updated = { ...updated, data: { ...updated.data, prompt: src.data.prompt } }; }
        }
        return updated;
      }

      if (type === 'merge') {
        const edgeA = edges.find((e) => e.target === node.id && e.targetHandle === 'image-a');
        const edgeB = edges.find((e) => e.target === node.id && e.targetHandle === 'image-b');
        let updated = { ...node };

        if (edgeA) {
          const src = nodes.find((n) => n.id === edgeA.source);
          const img = src?.data.resultImage || src?.data.image;
          if (img && node.data.imageA !== img) { hasChanges = true; updated = { ...updated, data: { ...updated.data, imageA: img } }; }
        }
        if (edgeB) {
          const src = nodes.find((n) => n.id === edgeB.source);
          const img = src?.data.resultImage || src?.data.image;
          if (img && node.data.imageB !== img) { hasChanges = true; updated = { ...updated, data: { ...updated.data, imageB: img } }; }
        }
        return updated;
      }

      if (type === 'gallery') {
        const imgs = edges
          .filter((e) => e.target === node.id)
          .map((e) => {
            const src = nodes.find((n) => n.id === e.source);
            return (src?.data.resultImage || src?.data.image) as string | undefined;
          })
          .filter(Boolean) as string[];
        const current = (node.data.images as string[]) || [];
        if (JSON.stringify(imgs) !== JSON.stringify(current)) { hasChanges = true; return { ...node, data: { ...node.data, images: imgs } }; }
      }

      return node;
    });

    if (hasChanges) setNodes(newNodes);
  }, [edges, nodes]);

  // ─── Undo / Redo ──────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const snap = historyRef.current[historyIndexRef.current];
    isTravelingRef.current = true;
    setNodes(injectCallbacks(snap.nodes));
    setEdges(snap.edges);
    isTravelingRef.current = false;
    toast.info('Desfeito');
  }, [injectCallbacks]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snap = historyRef.current[historyIndexRef.current];
    isTravelingRef.current = true;
    setNodes(injectCallbacks(snap.nodes));
    setEdges(snap.edges);
    isTravelingRef.current = false;
    toast.info('Refeito');
  }, [injectCallbacks]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
      if (e.key === 'Escape') { setShowCommandPalette(false); setContextMenu(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ─── Handlers do React Flow ───────────────────────────────────────────

  const onNodesChange: OnNodesChange<WorkflowNode> = useCallback(
    (changes) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds) as WorkflowNode[];
        const isDrag = changes.some((c) => c.type === 'position' && !(c as any).dragging);
        if (isDrag) {
          setEdges((eds) => { pushHistory(next, eds); return eds; });
        }
        return next;
      });
    },
    [pushHistory]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      let strokeColor = '#8b5cf6';
      if (params.sourceHandle?.includes('prompt'))  strokeColor = '#3b82f6';
      else if (params.sourceHandle?.includes('image')) strokeColor = '#f97316';
      else if (params.sourceHandle?.includes('trigger')) strokeColor = '#10b981';
      else if (params.sourceHandle?.includes('upscale') || params.sourceHandle?.includes('bg')) strokeColor = '#10b981';

      setEdges((eds) => {
        const next = addEdge(
          { ...params, animated: true, id: `e-${params.source}-${params.target}-${Date.now()}`, style: { stroke: strokeColor, strokeWidth: 2 } },
          eds
        );
        setNodes((nds) => { pushHistory(nds, next); return nds; });
        return next;
      });
      toast.success('Conexão estabelecida');
    },
    [pushHistory]
  );

  const onNodeClick = useCallback((_: any, node: WorkflowNode) => {
    setSelectedNodeId(node.id);
    setContextMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
  }, []);

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: WorkflowNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
  }, []);

  const onPaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY, nodeId: null });
  }, []);

  // ─── Adicionar nó ao canvas ────────────────────────────────────────────

  const addNode = useCallback(
    (type: string, position?: { x: number; y: number }) => {
      nodeCounter++;
      const labelMap: Record<string, string> = {
        prompt: 'Prompt', referenceImage: 'Entrada de Imagem',
        generator: 'Gerador', imageOutput: `Output ${nodeCounter}`,
        upscale: 'Upscale', backgroundRemover: 'BG Remove',
        text2image: 'Text → Image', image2image: 'Image → Image',
        text2video: 'Text → Video', image2video: 'Image → Video',
        promptBuilder: 'Prompt Builder', note: 'Nota',
        merge: 'Merge / Composite', gallery: 'Galeria',
        instance: 'WaveSpeed Instance', condition: 'Condição',
        iterator: 'Iterador', httpRequest: 'HTTP Request', delay: 'Delay',
      };
      const dataMap: Record<string, Partial<WorkflowNodeData>> = {
        prompt: { prompt: '' }, referenceImage: { image: null },
        generator: { modelId: 'nano-banana-2', modelType: 'image', aspectRatio: '1:1', resolution: '2K', thinkingLevel: 'Minimal' },
        imageOutput: {}, upscale: {}, backgroundRemover: {},
        text2image: { modelId: 'nano-banana-2', aspectRatio: '1:1' },
        image2image: { modelId: 'nano-banana-2', aspectRatio: '1:1' },
        text2video: { modelId: 'veo-3.1-lite', aspectRatio: '16:9', resolution: '720p' },
        image2video: { modelId: 'veo-3.1-lite', aspectRatio: '16:9', resolution: '720p' },
        promptBuilder: { templatePrompt: '', variables: {} },
        note: { noteText: '' }, merge: {}, gallery: { images: [] },
        instance:    { aiModel: 'wavespeed-ai/flux-schnell', generationType: 'image', videoDuration: 5, videoAspectRatio: '9:16' },
        condition:   { condition: 'has-image' },
        iterator:    { iteratorItems: [''], iteratorIndex: 0 },
        httpRequest: { httpMethod: 'POST', httpUrl: '', httpBody: '' },
        delay:       { delaySeconds: 5 },
      };

      const pos = position || { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 };

      const newNode: WorkflowNode = {
        id: `${type}-${nodeCounter}`,
        type: type as any,
        position: pos,
        data: {
          label: labelMap[type] || type,
          ...dataMap[type],
          onUpdate: onUpdateNode,
          onDelete: onDeleteNode,
        },
      };

      setNodes((nds) => {
        const next = [...nds, newNode];
        setEdges((eds) => { pushHistory(next, eds); return eds; });
        return next;
      });
      toast.success(`${labelMap[type] || type} adicionado`);
    },
    [onUpdateNode, onDeleteNode, runWorkflow, pushHistory]
  );

  // ─── Duplicate node ────────────────────────────────────────────────────

  const duplicateNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      nodeCounter++;
      const newNode: WorkflowNode = {
        ...node,
        id: `${node.type}-${nodeCounter}`,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        data: {
          ...node.data,
          onUpdate: onUpdateNode,
          onDelete: onDeleteNode,
          ...(node.type === 'trigger' ? { onRunWorkflow: runWorkflow } : {}),
        },
      };
      setNodes((nds) => {
        const next = [...nds, newNode];
        setEdges((eds) => { pushHistory(next, eds); return eds; });
        return next;
      });
      toast.success('Nó duplicado');
    },
    [nodes, onUpdateNode, onDeleteNode, runWorkflow, pushHistory]
  );

  // ─── Export / Import ───────────────────────────────────────────────────

  const exportWorkflow = useCallback(() => {
    const payload = {
      name: workflowName || 'Workflow',
      version: 1,
      exportedAt: new Date().toISOString(),
      nodes: stripCallbacks(nodes),
      edges,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(workflowName || 'workflow').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Workflow exportado!');
  }, [nodes, edges, workflowName]);

  const importWorkflow = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (!data.nodes || !data.edges) throw new Error('Arquivo inválido');
          const importedNodes = injectCallbacks(data.nodes);
          setNodes(importedNodes);
          setEdges(data.edges);
          if (data.name && onWorkflowNameChange) onWorkflowNameChange(data.name);
          pushHistory(importedNodes, data.edges);
          toast.success(`Workflow "${data.name || 'importado'}" carregado!`);
        } catch {
          toast.error('Erro ao importar', { description: 'Arquivo JSON inválido.' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [injectCallbacks, onWorkflowNameChange, pushHistory]);

  // ─── Load template ─────────────────────────────────────────────────────

  const loadTemplate = useCallback(
    (templateId: string) => {
      const tmpl = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
      if (!tmpl) return;
      const importedNodes = injectCallbacks(tmpl.nodes as WorkflowNode[]);
      setNodes(importedNodes);
      setEdges(tmpl.edges);
      if (onWorkflowNameChange) onWorkflowNameChange(tmpl.name);
      pushHistory(importedNodes, tmpl.edges);
      toast.success(`Template "${tmpl.name}" carregado!`);
    },
    [injectCallbacks, runWorkflow, onWorkflowNameChange, pushHistory]
  );

  // ─── Expose loadTemplate via CustomEvent ──────────────────────────────

  useEffect(() => {
    const handler = (e: any) => loadTemplate(e.detail?.templateId);
    window.addEventListener('workflow-load-template', handler);
    return () => window.removeEventListener('workflow-load-template', handler);
  }, [loadTemplate]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    return { id: node.id, type: node.type || '', data: node.data };
  }, [selectedNodeId, nodes]);

  return (
    <div className="flex w-full h-full bg-background">
      {/* Sidebar */}
      <WorkflowSidebar onAddNode={addNode} />

      {/* Canvas */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu as any}
          onMoveEnd={(_, viewport) => setZoom(viewport.zoom)}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1.1 }}
          fitView
          fitViewOptions={{ maxZoom: 1.1, padding: 0.2 }}
          defaultEdgeOptions={{ animated: true, style: { strokeWidth: 2 } }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="currentColor"
            className="text-foreground/5 opacity-20"
          />
          <Controls className="!bg-card/80 !border-border !rounded-xl !shadow-xl [&>button]:!bg-transparent [&>button]:!border-border [&>button]:!text-muted-foreground [&>button:hover]:!text-foreground [&>button:hover]:!bg-accent" />
          <MiniMap
            className="!bg-card/80 !border !border-border !rounded-xl"
            nodeColor={(n) => {
              const colors: Record<string, string> = {
                trigger: '#10b981', prompt: '#3b82f6', referenceImage: '#f97316',
                generator: '#8b5cf6', imageOutput: '#6b7280', upscale: '#f59e0b',
                backgroundRemover: '#f43f5e',
              };
              return colors[n.type || ''] || '#6b7280';
            }}
            maskColor="rgba(0,0,0,0.3)"
          />
        </ReactFlow>

        {/* Bottom toolbar */}
        <CanvasToolbar
          onAddNode={addNode}
          zoom={zoom}
          onRunWorkflow={runWorkflow}
          onToggleExecutionPanel={() => setShowExecutionPanel((v) => !v)}
          isRunning={isRunning}
          hasExecutions={executions.length > 0}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onExport={exportWorkflow}
          onImport={importWorkflow}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />
      </div>

      {/* Painel de propriedades */}
      {selectedNode?.type === 'generator' && (
        <PropertiesPanel selectedNode={selectedNode} onUpdateNode={onUpdateNode} />
      )}

      {/* Painel de execuções */}
      {showExecutionPanel && (
        <ExecutionPanel
          executions={executions}
          isRunning={isRunning}
          onClose={() => setShowExecutionPanel(false)}
          onCancel={cancelWorkflow}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onAddNode={addNode}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
          onDeleteNode={onDeleteNode}
          onDuplicateNode={duplicateNode}
          onAddNode={addNode}
        />
      )}
    </div>
  );
};

export const WorkflowCanvas = ({ workflowName, onWorkflowNameChange }: WorkflowCanvasProps) => (
  <ReactFlowProvider>
    <WorkflowCanvasInner workflowName={workflowName} onWorkflowNameChange={onWorkflowNameChange} />
  </ReactFlowProvider>
);
