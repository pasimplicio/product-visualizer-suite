import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  applyEdgeChanges,
  applyNodeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Panel,
} from '@xyflow/react';
import { ProductSourceNode } from './nodes/ProductSourceNode';
import { InstanceNode } from './nodes/InstanceNode';
import { WorkflowSidebar } from './WorkflowSidebar';
import { WorkflowNode, WorkflowEdge, NodeType, WorkflowNodeData } from '@/lib/workflow/types';
import { MousePointer2, Play } from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes = {
  productSource: ProductSourceNode,
  instance: InstanceNode,
};

const initialNodes: WorkflowNode[] = [
  {
    id: 'source-1',
    type: 'productSource',
    position: { x: 100, y: 100 },
    data: { label: 'Fonte Principal', image: null },
  },
];

export const WorkflowCanvas = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);

  // Atualiza os dados de um nó específico
  const onUpdateNode = useCallback((id: string, updates: Partial<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...updates } };
        }
        return node;
      })
    );
  }, []);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id));
    toast.info("Nó Removido");
  }, []);

  // Injetar funções onUpdate e onDelete em todos os nós toda vez que eles mudarem
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, onUpdate: onUpdateNode, onDelete: onDeleteNode },
      }))
    );
  }, [onUpdateNode, onDeleteNode]);

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
      const edge = { ...params, animated: true, id: `e-${params.source}-${params.target}` };
      setEdges((eds) => addEdge(edge, eds));
      toast.success("Instância Conectada", { description: "O fluxo de dados foi estabelecido." });
    },
    []
  );

  // Lógica de Propagação: Se um nó de origem tem imagem e está conectado a uma instância, passa a imagem.
  useEffect(() => {
    let hasChanges = false;
    const newNodes = nodes.map(node => {
      if (node.type !== 'instance') return node;

      const inputEdge = edges.find(e => e.target === node.id);
      if (!inputEdge) {
        if (node.data.image) {
          hasChanges = true;
          return { ...node, data: { ...node.data, image: null, status: 'idle', resultImage: undefined } };
        }
        return node;
      }

      const sourceNode = nodes.find(n => n.id === inputEdge.source);
      if (sourceNode?.data.image && node.data.image !== sourceNode.data.image) {
        hasChanges = true;
        return { ...node, data: { ...node.data, image: sourceNode.data.image } };
      }

      if (!sourceNode?.data.image && node.data.image) {
        hasChanges = true;
        return { ...node, data: { ...node.data, image: null, status: 'idle' } };
      }

      return node;
    });

    if (hasChanges) {
      setNodes(newNodes);
    }
  }, [edges, nodes]);

  const addInstanceNode = () => {
    const id = `inst-${nodes.length + 1}`;
    const newNode: WorkflowNode = {
      id,
      type: 'instance',
      position: { x: 500, y: 100 + (nodes.length * 50) },
      data: { 
        label: `Instância ${nodes.length}`, 
        prompt: 'Cinematic studio shot, high resolution, professional lighting.',
        onUpdate: onUpdateNode,
        onDelete: onDeleteNode
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="flex w-full h-full bg-background transition-colors duration-300">
      {/* Sidebar Lateral */}
      <WorkflowSidebar onAddInstance={addInstanceNode} />
      
      {/* Canvas */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#111" gap={20} />
          <Controls />
          <Panel position="top-right" className="flex flex-col space-y-2">
            <div className="bg-background/80 backdrop-blur-md p-3 rounded-lg border border-white/10 space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</h4>
              <div className="flex items-center space-x-2 text-xs">
                <MousePointer2 className="h-3 w-3 text-primary" />
                <span>Canvas Ativo</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <Play className="h-3 w-3 text-green-500" />
                <span>{nodes.length} Nós Ativos</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
