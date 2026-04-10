import React from 'react';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { Sparkles, HelpCircle, LayoutGrid } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { ModeToggle } from '@/components/mode-toggle';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden transition-colors duration-300">
      {/* Header Compacto */}
      <header className="z-20 flex h-16 items-center justify-between border-b bg-background/60 px-6 backdrop-blur-xl">
        <div className="flex items-center space-x-4">
          <div className="bg-primary p-2 rounded-md">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Visualizer <span className="text-primary">Workflow</span></h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">AI Node-Based Studio</p>
          </div>
        </div>

        <nav className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-[11px] font-bold text-muted-foreground border-r border-white/10 pr-6">
            <LayoutGrid className="h-3 w-3" />
            <span>MODO WORKFLOW ATIVO</span>
          </div>

          {/* Link para WaveSpeed AI Studio */}
          <Link
            to="/wavespeed"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 text-violet-400 hover:from-violet-500/20 hover:to-fuchsia-500/20 hover:text-violet-300 transition-all"
          >
            <Sparkles className="h-3 w-3" />
            WaveSpeed AI
          </Link>

          <ModeToggle />
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {/* Área Principal - Workflow Canvas */}
      <main className="relative flex-1 overflow-hidden">
        <WorkflowCanvas />
      </main>

      <Toaster />
    </div>
  );
};

export default Index;
