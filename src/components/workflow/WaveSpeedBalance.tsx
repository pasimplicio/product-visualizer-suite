import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WaveSpeedService } from '@/lib/services/wavespeed-service';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WaveSpeedBalance = () => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['wavespeed-balance'],
    queryFn: () => WaveSpeedService.getBalance(),
    refetchInterval: 60000, // Atualiza a cada 1 minuto automaticamente
  });

  return (
    <div className="flex items-center space-x-3 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full backdrop-blur-md">
      <div className="flex items-center space-x-2">
        <Wallet className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo:</span>
      </div>
      
      <div className="flex items-center min-w-[60px]">
        {isLoading ? (
          <div className="h-3 w-12 bg-primary/20 animate-pulse rounded" />
        ) : error ? (
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <span className="text-xs font-black text-primary tabular-nums tracking-tight">
            ${data?.balance.toFixed(4) || '0.0000'}
          </span>
        )}
      </div>

      <button 
        onClick={() => refetch()}
        disabled={isFetching}
        className={cn(
          "p-1 hover:bg-primary/10 rounded-full transition-colors",
          isFetching && "animate-spin text-primary"
        )}
      >
        <RefreshCw className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
};
