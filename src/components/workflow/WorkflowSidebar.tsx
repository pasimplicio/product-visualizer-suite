import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';

export interface WorkflowSidebarProps {
  onAddInstance: () => void;
  className?: string;
}

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({ onAddInstance, className }) => {
  return (
    <aside className={cn("w-64 bg-background border-r flex flex-col hidden md:flex transition-colors duration-300 shadow-[2px_0_10px_rgba(0,0,0,0.05)]", className)}>
      <div className="p-4 border-b bg-muted/20">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
          <LayoutTemplate className="h-4 w-4 mr-2" />
          Painel de Ferramentas
        </h2>
      </div>

      <div className="flex-1 p-4 space-y-6">
        <div className="space-y-3">
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase">Ações Rápidas</h3>
          
          <Button 
            onClick={onAddInstance}
            className="w-full flex justify-start items-center space-x-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all font-medium h-12"
          >
            <div className="bg-primary/20 p-1.5 rounded-md">
              <Plus className="h-4 w-4" />
            </div>
            <span>Nova Instância POV</span>
          </Button>

          <Button 
            variant="outline"
            disabled
            className="w-full justify-start cursor-not-allowed border-white/5 text-muted-foreground bg-white/5 h-12"
          >
            <ImageIcon className="mr-3 h-4 w-4 opacity-50" />
            <span>Fonte Extra (Breve)</span>
          </Button>
        </div>
      </div>
      
      <div className="p-4 mt-auto border-t border-white/5 space-y-4">
        <div>
          <h3 className="text-[10px] font-bold uppercase mb-2 text-primary">Instruções Rápidas</h3>
          <ul className="text-[10px] space-y-2 text-muted-foreground">
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
              <span>Faça o upload da imagem no nó de origem.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
              <span>Arraste o 'handle' da direita para o nó da esquerda.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
              <span>Configure o cenário e clique em 'Disparar Action'.</span>
            </li>
          </ul>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
            Nanobanana Suite
          </div>
          <ModeToggle />
        </div>
      </div>
    </aside>
  );
};
