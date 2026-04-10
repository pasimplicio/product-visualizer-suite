/**
 * ModelSelector – Seletor de modelos WaveSpeed AI
 * -------------------------------------------------
 * Dropdown estilizado que exibe todos os modelos disponíveis,
 * divididos por tipo (imagem/vídeo), com badges para exclusivos.
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  WAVESPEED_MODELS,
  WaveSpeedModel,
  WaveSpeedModelType,
  WaveSpeedModelInfo,
} from '@/lib/services/wavespeed-service';

interface ModelSelectorProps {
  /** Tipo de modelo a filtrar ('image' ou 'video'). Se não informado, mostra todos. */
  filterType?: WaveSpeedModelType;
  /** Modelo atualmente selecionado */
  value: WaveSpeedModel;
  /** Callback quando o modelo muda */
  onValueChange: (model: WaveSpeedModel) => void;
  /** Desabilitar o seletor */
  disabled?: boolean;
}

/** Renderiza a linha de um modelo no dropdown */
const ModelItem: React.FC<{ model: WaveSpeedModelInfo }> = ({ model }) => (
  <div className="flex items-center justify-between w-full gap-3 py-0.5">
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-base shrink-0">{model.icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold truncate">{model.name}</span>
          {model.exclusive && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[9px] font-bold uppercase bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 border-violet-500/30 shrink-0"
            >
              Exclusivo
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight truncate">
          {model.description}
        </p>
      </div>
    </div>
    <span className="text-[10px] font-mono text-emerald-400 whitespace-nowrap shrink-0">
      {model.price}
    </span>
  </div>
);

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  filterType,
  value,
  onValueChange,
  disabled = false,
}) => {
  // Filtra modelos conforme o tipo, ou mostra todos
  const imageModels = WAVESPEED_MODELS.filter((m) => m.type === 'image');
  const videoModels = WAVESPEED_MODELS.filter((m) => m.type === 'video');

  const showImages = !filterType || filterType === 'image';
  const showVideos = !filterType || filterType === 'video';

  // Encontra o modelo selecionado para exibir no trigger
  const selectedModel = WAVESPEED_MODELS.find((m) => m.id === value);

  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as WaveSpeedModel)} disabled={disabled}>
      <SelectTrigger className="w-full h-12 bg-muted/30 border-border hover:bg-muted/50 transition-colors">
        <SelectValue placeholder="Selecione um modelo">
          {selectedModel && (
            <div className="flex items-center gap-2">
              <span>{selectedModel.icon}</span>
              <span className="font-semibold text-sm">{selectedModel.name}</span>
              {selectedModel.exclusive && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 text-[9px] font-bold uppercase bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 border-violet-500/30"
                >
                  ★
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                {selectedModel.price}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="max-w-[420px] bg-card/95 backdrop-blur-xl border-border">
        {showImages && imageModels.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 pb-1">
              🖼️ Modelos de Imagem
            </SelectLabel>
            {imageModels.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-2"
              >
                <ModelItem model={model} />
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {showVideos && videoModels.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 pb-1 pt-2">
              🎬 Modelos de Vídeo
            </SelectLabel>
            {videoModels.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-2"
              >
                <ModelItem model={model} />
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
};
