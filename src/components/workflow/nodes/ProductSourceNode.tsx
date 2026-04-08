import React, { useCallback } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Upload, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowNodeData } from '@/lib/workflow/types';

export const ProductSourceNode = ({ data, id }: NodeProps<WorkflowNodeData>) => {
  const onImageUpload = useCallback((image: string) => {
    // A lógica de atualização do estado global do workflow será injetada via data.onChange
    if (data.onUpdate) {
      (data.onUpdate as (id: string, updates: Partial<WorkflowNodeData>) => void)(id, { image });
    }
  }, [data.onUpdate, id]);

  const onClear = useCallback(() => {
    if (data.onUpdate) {
      (data.onUpdate as (id: string, updates: Partial<WorkflowNodeData>) => void)(id, { image: null });
    }
  }, [data.onUpdate, id]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <NodeResizer minWidth={280} minHeight={300} isVisible={data.selected || false} />
      <Card className="w-[350px] border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl p-0 flex flex-col">
        <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Upload className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Origem do Produto (9:16)</span>
          </div>
        </div>

      <div className="p-4 flex flex-col">
        {!data.image ? (
          <div className="flex flex-col items-center justify-center w-full aspect-[9/16] h-[360px] border-2 border-dashed border-border rounded-lg bg-muted/30">
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="flex flex-col h-auto py-8">
              <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Subir Produto Vertical</span>
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className="relative group rounded-lg overflow-hidden border border-border flex flex-col justify-center bg-muted/30 w-full aspect-[9/16] h-[360px]">
            <img src={data.image} alt="Produto" className="w-full h-full object-cover" />
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onClear}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="p-2 bg-black/60 flex items-center space-x-2">
              <ImageIcon className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-medium truncate">Imagem Sincronizada</span>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-primary border-4 border-background shadow-lg !-right-2 top-1/2"
      />
    </Card>
    </>
  );
};
