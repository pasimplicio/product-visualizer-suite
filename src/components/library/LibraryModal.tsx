import React, { useMemo } from 'react';
import { useLibrary } from '@/context/library-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Image as ImageIcon, Video, ArrowUpRight, Eraser, Download, Play } from 'lucide-react';
import { LibraryItem } from '@/lib/services/library-service';

export const LibraryModal: React.FC = () => {
  const { items, isOpen, closeLibrary, removeItem } = useLibrary();

  // Group by relative date string
  const groupedItems = useMemo(() => {
    const groups: Record<string, LibraryItem[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    items.forEach(item => {
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);
      
      let key = 'Anteriores';
      if (itemDate.getTime() === today.getTime()) {
        key = 'Hoje';
      } else if (itemDate.getTime() === yesterday.getTime()) {
        key = 'Ontem';
      } else if (today.getTime() - itemDate.getTime() <= 7 * 24 * 60 * 60 * 1000) {
        key = 'Últimos 7 dias';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [items]);

  const handleDownload = (item: LibraryItem) => {
    const link = document.createElement('a');
    link.href = item.previewUrl;
    link.download = `ProductSuite-${item.type}-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`;
    link.click();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4 text-violet-400" />;
      case 'video': return <Video className="w-4 h-4 text-cyan-400" />;
      case 'upscale': return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'background-remover': return <Eraser className="w-4 h-4 text-rose-400" />;
      default: return <ImageIcon className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeLibrary()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col bg-background/95 backdrop-blur-3xl border-border p-0 gap-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              Minha Biblioteca
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-semibold text-lg">Nenhuma geração ainda</p>
              <p className="text-sm">Suas criações aparecerão aqui magicamente.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {['Hoje', 'Ontem', 'Últimos 7 dias', 'Anteriores'].map((groupKey) => {
                const groupItems = groupedItems[groupKey];
                if (!groupItems || groupItems.length === 0) return null;

                return (
                  <div key={groupKey}>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/50" />
                      {groupKey}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 masonry-grid">
                      {groupItems.map((item) => (
                        <div
                          key={item.id}
                          className="group relative rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:ring-2 hover:ring-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                        >
                          <div className={`relative aspect-square w-full flex items-center justify-center ${
                            item.type === 'background-remover' 
                              // O Fundo xadrez pedido para imagens com fundo transparente
                              ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMmEyYTNjIj48L3JlY3Q+CjxyZWN0IHggPSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMmEyYTNjIj48L3JlY3Q+Cjwvc3ZnPg==")] dark:bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMjIyIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMyMjIiPjwvcmVjdD4KPC9zdmc+")]'
                              : 'bg-muted/30'
                          }`}>
                            {item.type === 'video' ? (
                              <>
                                <video
                                  src={item.previewUrl}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                  <Play className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                              </>
                            ) : (
                              <img
                                src={item.previewUrl}
                                alt={item.prompt || 'Geração'}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            )}

                            {/* Badge do Tipo */}
                            <div className="absolute top-2 left-2 p-1.5 rounded-md bg-background/80 backdrop-blur-md border border-border shadow-sm">
                              {getTypeIcon(item.type)}
                            </div>

                            {/* Ações Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                              {item.prompt && (
                                <p className="text-[10px] text-white/90 line-clamp-3 leading-tight mb-1 drop-shadow-md">
                                  {item.prompt}
                                </p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDownload(item)}
                                  className="flex-1 h-8 rounded-lg bg-primary/90 text-primary-foreground text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-primary shadow-lg"
                                >
                                  <Download className="w-3.5 h-3.5" /> BAIXAR
                                </button>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="w-8 h-8 rounded-lg bg-destructive/90 text-white flex items-center justify-center hover:bg-destructive shadow-lg flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
