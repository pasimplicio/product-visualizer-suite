import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UploadStageProps {
  onImageUpload: (image: string) => void;
  currentImage: string | null;
  onClear: () => void;
}

export const UploadStage: React.FC<UploadStageProps> = ({ onImageUpload, currentImage, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-muted-foreground/20 bg-background/50 backdrop-blur-sm transition-all hover:border-primary/50">
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        {!currentImage ? (
          <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="rounded-full bg-primary/10 p-6 ring-8 ring-primary/5">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">Upload do Produto Base</h3>
              <p className="max-w-[300px] text-sm text-muted-foreground">
                Arraste a imagem original ou clique para selecionar o arquivo. Este será o ponto de partida para os 4 POVs.
              </p>
            </div>
            <Button onClick={triggerUpload} size="lg" className="px-8 shadow-lg shadow-primary/20">
              Escolher Imagem
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative w-full h-full max-h-[600px] animate-in fade-in zoom-in duration-500">
            <img
              src={currentImage}
              alt="Produto Base"
              className="mx-auto block max-h-[500px] w-auto rounded-lg object-contain shadow-2xl"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                variant="destructive"
                size="icon"
                onClick={onClear}
                className="rounded-full shadow-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-6 flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2 text-primary">
                <ImageIcon className="h-5 w-5" />
                <span className="font-medium">Imagem Base Pronta</span>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Sincronização automática para as 4 instâncias habilitada.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
