import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  ReactFlowProvider,
  BackgroundVariant,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PromptNode }         from './nodes/PromptNode';
import { ReferenceImageNode } from './nodes/ReferenceImageNode';
import { ImageOutputNode }    from './nodes/ImageOutputNode';
import { VideoOutputNode }    from './nodes/VideoOutputNode';
import { WorkflowSidebar }    from './WorkflowSidebar';
import { CanvasToolbar }      from './CanvasToolbar';
import { ExecutionPanel }     from './ExecutionPanel';
import { ContextMenu }        from './ContextMenu';
import { WorkflowNode, WorkflowEdge, WorkflowNodeData } from '@/lib/workflow/types';
import { WorkflowEngine, ExecutionRecord } from '@/lib/workflow/engine';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';
import { useLibrary } from '@/context/library-context';
import { toast } from 'sonner';

const nodeTypes = {
  referenceImage: ReferenceImageNode,
  prompt:         PromptNode,
  imageOutput:    ImageOutputNode,
  videoOutput:    VideoOutputNode,
};

let nodeCounter = 0;

function stripCallbacks(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map((n) => ({
    ...n,
    data: Object.fromEntries(
      Object.entries(n.data).filter(([k]) => !['onUpdate', 'onDelete'].includes(k))
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
  const [zoom, setZoom] = useState(1.1);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string | null } | null>(null);
  const engineRef = useRef(new WorkflowEngine());
  const { addLibraryItem } = useLibrary();

  // ─── Callbacks de nó ───────────────────────────────────────────────────

  const onUpdateNode = useCallback((id: string, updates: Partial<WorkflowNodeData>) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...updates } } : n));
  }, []);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    toast.info('Nó removido');
  }, []);

  const injectCallbacks = useCallback(
    (nds: WorkflowNode[]): WorkflowNode[] =>
      nds.map((n) => ({ ...n, data: { ...n.data, onUpdate: onUpdateNode, onDelete: onDeleteNode } })),
    [onUpdateNode, onDeleteNode]
  );

  // ─── Global node-update event ──────────────────────────────────────────

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.id && e.detail?.updates) onUpdateNode(e.detail.id, e.detail.updates);
    };
    window.addEventListener('workflow-node-update', handler);
    setNodes((nds) => injectCallbacks(nds));
    return () => window.removeEventListener('workflow-node-update', handler);
  }, [onUpdateNode, injectCallbacks]);

  // ─── Propagação automática de dados ───────────────────────────────────

  useEffect(() => {
    let changed = false;
    const next = nodes.map((node) => {
      if (node.type !== 'imageOutput' && node.type !== 'videoOutput') return node;

      const imgEdge    = edges.find((e) => e.target === node.id && e.targetHandle === 'image-in');
      const promptEdge = edges.find((e) => e.target === node.id && e.targetHandle === 'prompt-in');
      let updated = { ...node };

      if (imgEdge) {
        const src = nodes.find((n) => n.id === imgEdge.source);
        const img = src?.data.resultImage || src?.data.image;
        if (img && node.data.image !== img) { changed = true; updated = { ...updated, data: { ...updated.data, image: img } }; }
      }
      if (promptEdge) {
        const src = nodes.find((n) => n.id === promptEdge.source);
        if (src?.data.prompt && node.data.prompt !== src.data.prompt) { changed = true; updated = { ...updated, data: { ...updated.data, prompt: src.data.prompt } }; }
      }
      return updated;
    });
    if (changed) setNodes(next);
  }, [edges, nodes]);

  // ─── Execução ─────────────────────────────────────────────────────────

  const runWorkflow = useCallback(async () => {
    if (isRunning) { toast.warning('Workflow já está em execução'); return; }
    const executable = nodes.filter((n) => n.type === 'imageOutput' || n.type === 'videoOutput');
    if (executable.length === 0) {
      toast.error('Nenhum nó de saída', { description: 'Adicione um nó de Saída de Imagem ou Saída de Vídeo.' });
      return;
    }
    setIsRunning(true);
    setShowExecutionPanel(true);
    toast.success('Executando workflow', { description: `${executable.length} nó(s) na fila` });

    const record = await engineRef.current.execute(
      nodes.map((n) => ({ ...n, data: { ...n.data } })),
      [...edges],
      { onNodeUpdate: onUpdateNode, addLibraryItem },
      (updated) => setExecutions((prev) => {
        const idx = prev.findIndex((r) => r.id === updated.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
        return [...prev, updated];
      })
    );

    setIsRunning(false);
    if (record.status === 'completed') {
      toast.success('Concluído!', { description: `${record.completedNodes}/${record.totalNodes} em ${((record.durationMs || 0) / 1000).toFixed(1)}s` });
    } else if (record.status === 'error') {
      toast.error('Concluído com erros');
    }
  }, [isRunning, nodes, edges, onUpdateNode, addLibraryItem]);

  const cancelWorkflow = useCallback(() => {
    engineRef.current.cancel();
    setIsRunning(false);
    toast.info('Cancelado');
  }, []);

  // ─── Load template ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: any) => {
      const tmpl = WORKFLOW_TEMPLATES.find((t) => t.id === e.detail?.templateId);
      if (!tmpl) return;
      setNodes(injectCallbacks(tmpl.nodes as WorkflowNode[]));
      setEdges(tmpl.edges);
      if (onWorkflowNameChange) onWorkflowNameChange(tmpl.name);
      toast.success(`Template "${tmpl.name}" carregado!`);
    };
    window.addEventListener('workflow-load-template', handler);
    return () => window.removeEventListener('workflow-load-template', handler);
  }, [injectCallbacks, onWorkflowNameChange]);

  // ─── React Flow handlers ───────────────────────────────────────────────

  const onNodesChange: OnNodesChange<WorkflowNode> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds) as WorkflowNode[]), []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []
  );
  const onConnect: OnConnect = useCallback((params: Connection) => {
    const strokeColor =
      params.sourceHandle?.includes('prompt') ? '#3b82f6' :
      params.sourceHandle?.includes('image')  ? '#f97316' : '#8b5cf6';
    setEdges((eds) => addEdge({ ...params, animated: true, id: `e-${params.source}-${params.target}-${Date.now()}`, style: { stroke: strokeColor, strokeWidth: 2 } }, eds));
    toast.success('Conexão estabelecida');
  }, []);

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: WorkflowNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
  }, []);

  const onPaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY, nodeId: null });
  }, []);

  // ─── Duplicate node ───────────────────────────────────────────────────

  const duplicateNode = useCallback((id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    nodeCounter++;
    setNodes((nds) => [...nds, {
      ...node,
      id: `${node.type}-${nodeCounter}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { ...node.data, onUpdate: onUpdateNode, onDelete: onDeleteNode },
    }]);
    toast.success('Nó duplicado');
  }, [nodes, onUpdateNode, onDeleteNode]);

  // ─── Add node ────────────────────────────────────────────────────────

  const addNode = useCallback((type: string) => {
    nodeCounter++;
    const labels: Record<string, string> = {
      referenceImage: 'Entrada de Imagem',
      prompt:         'Prompt',
      imageOutput:    'Saída de Imagem',
      videoOutput:    'Saída de Vídeo',
    };
    const defaults: Record<string, Partial<WorkflowNodeData>> = {
      referenceImage: { image: null },
      prompt:         { prompt: '' },
      imageOutput:    { modelId: 'nano-banana-2', aspectRatio: '1:1' },
      videoOutput:    { modelId: 'veo-3.1-lite', aspectRatio: '16:9', resolution: '720p' },
    };
    const newNode: WorkflowNode = {
      id: `${type}-${nodeCounter}`,
      type: type as any,
      position: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 },
      data: { label: labels[type] || type, ...defaults[type], onUpdate: onUpdateNode, onDelete: onDeleteNode },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`${labels[type]} adicionado`);
  }, [onUpdateNode, onDeleteNode]);

  // ─── Export ──────────────────────────────────────────────────────────

  const exportWorkflow = useCallback(() => {
    const blob = new Blob([JSON.stringify({ name: workflowName, nodes: stripCallbacks(nodes), edges }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${(workflowName || 'workflow').toLowerCase().replace(/\s+/g, '-')}.json`; a.click();
    toast.success('Workflow exportado!');
  }, [nodes, edges, workflowName]);

  return (
    <div className="flex w-full h-full bg-background">
      <WorkflowSidebar onAddNode={addNode} onExport={exportWorkflow} />

      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={() => setContextMenu(null)}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu as any}
          onMoveEnd={(_, viewport) => setZoom(viewport.zoom)}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1.1 }}
          fitView fitViewOptions={{ maxZoom: 1.1, padding: 0.2 }}
          defaultEdgeOptions={{ animated: true, style: { strokeWidth: 2 } }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="currentColor" className="text-foreground/5 opacity-20" />
          <Controls className="!bg-card/80 !border-border !rounded-xl !shadow-xl [&>button]:!bg-transparent [&>button]:!border-border [&>button]:!text-muted-foreground [&>button:hover]:!text-foreground [&>button:hover]:!bg-accent" />
          <MiniMap className="!bg-card/80 !border !border-border !rounded-xl"
            nodeColor={(n) => ({ referenceImage: '#f97316', prompt: '#3b82f6', imageOutput: '#8b5cf6', videoOutput: '#06b6d4' }[n.type || ''] || '#6b7280')}
            maskColor="rgba(0,0,0,0.3)" />
        </ReactFlow>

        <CanvasToolbar
          onAddNode={addNode} zoom={zoom}
          onRunWorkflow={runWorkflow} isRunning={isRunning}
        />
      </div>

      {showExecutionPanel && (
        <ExecutionPanel executions={executions} isRunning={isRunning}
          onClose={() => setShowExecutionPanel(false)} onCancel={cancelWorkflow} />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y} nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
          onDeleteNode={onDeleteNode} onDuplicateNode={duplicateNode}
          onAddNode={addNode}
        />
      )}
    </div>
  );
};

export const WorkflowCanvas = (props: WorkflowCanvasProps) => (
  <ReactFlowProvider>
    <WorkflowCanvasInner {...props} />
  </ReactFlowProvider>
);
