/**
 * WaveSpeed Studio – Página de geração de imagens e vídeos com WaveSpeed AI
 * ---------------------------------------------------------------------------
 * Adiciona uma nova seção ao app com abas para Imagem e Vídeo,
 * mantendo total compatibilidade com o workflow já existente.
 */

import React from 'react';
import { ImageGenerator } from '@/components/wavespeed/image-generator';
import { VideoGenerator } from '@/components/wavespeed/video-generator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Sparkles, Image as ImageIcon, Video, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Toaster } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const WaveSpeedStudio = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="z-20 flex h-16 items-center justify-between border-b bg-background/60 px-6 backdrop-blur-xl">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 rounded-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">
              WaveSpeed <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">AI Studio</span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
              Multi-Model Image & Video Generation
            </p>
          </div>
        </div>

        <nav className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-[10px] font-bold text-muted-foreground border-r border-white/10 pr-4">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>API CONECTADA</span>
          </div>
          <ModeToggle />
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Hero / Informação */}
          <div className="text-center space-y-2 py-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Geração com <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">Inteligência Artificial</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Escolha entre modelos exclusivos como Seedream, Seedance e WAN, 
              ou utilize Flux, Kling, Hailuo e Veo para gerar imagens e vídeos de alta qualidade.
            </p>
          </div>

          {/* Abas: Imagem / Vídeo */}
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="w-full h-12 bg-muted/30 border border-border p-1 rounded-lg">
              <TabsTrigger
                value="image"
                className="flex-1 h-full text-xs font-bold uppercase tracking-wider data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Imagem
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="flex-1 h-full text-xs font-bold uppercase tracking-wider data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all"
              >
                <Video className="h-4 w-4 mr-2" />
                Vídeo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-6">
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <ImageGenerator />
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-6">
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <VideoGenerator />
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer com créditos dos modelos */}
          <div className="text-center py-6 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Powered by WaveSpeed AI • ByteDance • Black Forest Labs • MiniMax • Google
            </p>
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
};

export default WaveSpeedStudio;
