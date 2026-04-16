export type GeneratedType = 'image' | 'video' | 'upscale' | 'background-remover';

export interface LibraryRecord {
  id: string;
  blob: Blob;
  type: GeneratedType;
  prompt?: string;
  createdAt: number;
}

export interface LibraryItem extends LibraryRecord {
  previewUrl: string; // Object URL gerada em runtime
}

const DB_NAME = 'ProductSuiteDB';
const STORE_NAME = 'LibraryMap';

export const LibraryService = {
  dbPromise: null as Promise<IDBDatabase> | null,

  init(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      };
    });
    return this.dbPromise;
  },

  async saveItem(item: Omit<LibraryRecord, 'id' | 'createdAt'>): Promise<LibraryRecord> {
    const db = await this.init();
    const newItem: LibraryRecord = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(newItem);
      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  },

  async getItems(): Promise<LibraryRecord[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      // Usando request getAll pela performance local
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = (request.result as LibraryRecord[]).sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteItem(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
