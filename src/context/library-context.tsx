import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LibraryService, LibraryItem, GeneratedType } from '@/lib/services/library-service';
import { toast } from 'sonner';

interface LibraryContextType {
  items: LibraryItem[];
  loading: boolean;
  isOpen: boolean;
  openLibrary: () => void;
  closeLibrary: () => void;
  addLibraryItem: (blobUrl: string, type: GeneratedType, prompt?: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearBlobUrl: (url: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const loadItems = async () => {
    try {
      const records = await LibraryService.getItems();
      // Converter records para itens com blob URLs locais
      const loadedItems = records.map(r => ({
        ...r,
        previewUrl: URL.createObjectURL(r.blob)
      }));
      setItems(loadedItems);
    } catch (e) {
      console.error('Failed to load library items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // Cleanup URLs upon unmount
    return () => {
      setItems(prev => {
        prev.forEach(item => URL.revokeObjectURL(item.previewUrl));
        return [];
      });
    };
  }, []);

  const clearBlobUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const addLibraryItem = useCallback(async (existingBlobUrl: string, type: GeneratedType, prompt?: string) => {
    try {
      // Fetch the blob from the existing object URL to save it
      const response = await fetch(existingBlobUrl);
      const blob = await response.blob();
      
      const newRecord = await LibraryService.saveItem({ blob, type, prompt });
      
      setItems(prev => [{
        ...newRecord,
        previewUrl: URL.createObjectURL(newRecord.blob)
      }, ...prev]);
      
    } catch (e) {
      console.error('Falha ao salvar na biblioteca:', e);
      toast.error('Não foi possível salvar na biblioteca local');
    }
  }, []);

  const removeItem = useCallback(async (id: string) => {
    try {
      await LibraryService.deleteItem(id);
      setItems(prev => {
        const itemToRemove = prev.find(i => i.id === id);
        if (itemToRemove) {
          URL.revokeObjectURL(itemToRemove.previewUrl);
        }
        return prev.filter(i => i.id !== id);
      });
      toast.success('Removido da biblioteca');
    } catch (e) {
      toast.error('Erro ao remover imagem');
    }
  }, []);

  const openLibrary = useCallback(() => setIsOpen(true), []);
  const closeLibrary = useCallback(() => setIsOpen(false), []);

  return (
    <LibraryContext.Provider value={{
      items, loading, isOpen, openLibrary, closeLibrary, addLibraryItem, removeItem, clearBlobUrl
    }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary deve ser usado dento de LibraryProvider');
  return context;
};
