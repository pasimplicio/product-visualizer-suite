import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PromptNode } from './nodes/PromptNode';
import { ReferenceImageNode } from './nodes/ReferenceImageNode';
import { GeneratorNode } from './nodes/GeneratorNode';
import { ImageOutputNode } from './nodes/ImageOutputNode';
import { UpscaleNode } from './nodes/UpscaleNode';
import { BackgroundRemoverNode } from './nodes/BackgroundRemoverNode';
import { WorkflowSidebar } from './WorkflowSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { CanvasToolbar } from './CanvasToolbar';
import { WorkflowNode, WorkflowEdge, WorkflowNodeData } from '@/lib/workflow/types';
import { toast } from 'sonner';

const nodeTypes = {
  prompt: PromptNode,
  referenceImage: ReferenceImageNode,
  generator: GeneratorNode,
  imageOutput: ImageOutputNode,
  upscale: UpscaleNode,
  backgroundRemover: BackgroundRemoverNode,
};

const initialNodes: WorkflowNode[] = [];

const initialEdges: WorkflowEdge[] = [];

let nodeCounter = 10;

const WorkflowCanvasInner = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.1);

  const onUpdateNode = useCallback((id: string, updates: Partial<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
      )
    );
  }, []);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
    toast.info('Nó removido');
  }, []);

  // Inject callbacks into all nodes AND listen to global fallback events
  useEffect(() => {
    const handleGlobalUpdate = (e: any) => {
      if (e.detail && e.detail.id && e.detail.updates) {
        onUpdateNode(e.detail.id, e.detail.updates);
      }
    };
    
    window.addEventListener('workflow-node-update', handleGlobalUpdate);

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, onUpdate: onUpdateNode, onDelete: onDeleteNode },
      }))
    );

    return () => {
      window.removeEventListener('workflow-node-update', handleGlobalUpdate);
    };
  }, [onUpdateNode, onDeleteNode]);

  // Propagation: pass data between connected nodes
  useEffect(() => {
    let hasChanges = false;
    const newNodes = nodes.map((node) => {
      if (node.type === 'generator' || node.type === 'upscale' || node.type === 'backgroundRemover' || node.type === 'imageOutput') {
        // Find connected source nodes
        const imageEdge = edges.find((e) => e.target === node.id && (e.targetHandle === 'image-in'));
        const promptEdge = edges.find((e) => e.target === node.id && (e.targetHandle === 'prompt-in'));

        if (imageEdge) {
          const sourceNode = nodes.find((n) => n.id === imageEdge.source);
          const sourceImage = sourceNode?.data.resultImage || sourceNode?.data.image;
          if (sourceImage && node.data.image !== sourceImage) {
            hasChanges = true;
            return { ...node, data: { ...node.data, image: sourceImage } };
          }
        }

        if (promptEdge) {
          const sourceNode = nodes.find((n) => n.id === promptEdge.source);
          if (sourceNode?.data.prompt && node.data.prompt !== sourceNode.data.prompt) {
            hasChanges = true;
            return { ...node, data: { ...node.data, prompt: sourceNode.data.prompt } };
          }
        }
      }
      return node;
    });

    if (hasChanges) {
      setNodes(newNodes);
    }
  }, [edges, nodes]);

  const onNodesChange: OnNodesChange<WorkflowNode> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds) as WorkflowNode[]),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      // Determinar cor por tipo de handle
      let strokeColor = '#8b5cf6';
      if (params.sourceHandle?.includes('prompt')) strokeColor = '#3b82f6';
      else if (params.sourceHandle?.includes('image')) strokeColor = '#f97316';
      else if (params.sourceHandle?.includes('output') || params.sourceHandle?.includes('bg') || params.sourceHandle?.includes('upscale')) strokeColor = '#10b981';

      const edge = {
        ...params,
        animated: true,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        style: { stroke: strokeColor, strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(edge, eds));
      toast.success('Conexão estabelecida');
    },
    []
  );

  const onNodeClick = useCallback((_: any, node: WorkflowNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const addNode = useCallback((type: string) => {
    nodeCounter++;
    const labelMap: Record<string, string> = {
      prompt: 'Prompt',
      referenceImage: 'Imagem de referência',
      generator: 'Gerador de imagem',
      imageOutput: `Output ${nodeCounter}`,
      upscale: 'Upscale',
      backgroundRemover: 'BG Remove',
    };

    const dataMap: Record<string, Partial<WorkflowNodeData>> = {
      prompt: { prompt: '' },
      referenceImage: { image: null },
      generator: { modelId: 'realistic', modelType: 'image', aspectRatio: '1:1', resolution: '2K', thinkingLevel: 'Minimal' },
      imageOutput: {},
      upscale: {},
      backgroundRemover: {},
    };

    const newNode: WorkflowNode = {
      id: `${type}-${nodeCounter}`,
      type: type as any,
      position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
      data: {
        label: labelMap[type] || type,
        ...dataMap[type],
        onUpdate: onUpdateNode,
        onDelete: onDeleteNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`${labelMap[type]} adicionado`);
  }, [onUpdateNode, onDeleteNode]);

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
          onMoveEnd={(_, viewport) => setZoom(viewport.zoom)}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1.1 }}
          fitView
          fitViewOptions={{ maxZoom: 1.1, padding: 0.2 }}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="currentColor"
            className="text-foreground/5 opacity-20"
          />
          <Controls
            className="!bg-card/80 !border-border !rounded-xl !shadow-xl [&>button]:!bg-transparent [&>button]:!border-border [&>button]:!text-muted-foreground [&>button:hover]:!text-foreground [&>button:hover]:!bg-accent"
          />
        </ReactFlow>

        {/* Bottom toolbar */}
        <CanvasToolbar onAddNode={addNode} zoom={zoom} />
      </div>

      {/* Properties Panel - Only visible for generator nodes */}
      {selectedNode?.type === 'generator' && (
        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={onUpdateNode}
        />
      )}
    </div>
  );
};

export const WorkflowCanvas = () => (
  <ReactFlowProvider>
    <WorkflowCanvasInner />
  </ReactFlowProvider>
);
