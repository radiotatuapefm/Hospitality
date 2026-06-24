const DB_NAME = 'bar-hotel-manager-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  TABLES: 'tables',
  ROOMS: 'rooms',
  COMANDAS: 'comandas',
  COMANDA_ITEMS: 'comanda_items',
  ROOM_OCCUPANCIES: 'room_occupancies',
  CASH_SHIFTS: 'cash_shifts',
  CASH_MOVEMENTS: 'cash_movements',
  FINANCIAL_ACCOUNTS: 'financial_accounts',
  STOCK_MOVEMENTS: 'stock_movements',
  RESERVATIONS: 'reservations',
  SETTINGS: 'settings',
  BRANDING: 'branding',
  SYNC_QUEUE: 'sync_queue',
};

// Open database
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
  });
}

// Generic CRUD operations
export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getById<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as T | null);
    request.onerror = () => reject(request.error);
  });
}

export async function put<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function putAll<T>(storeName: string, dataList: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    dataList.forEach((data) => store.put(data));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Sync queue for offline operations
interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  storeName: string;
  data: unknown;
  timestamp: number;
  synced: boolean;
}

export async function addToSyncQueue(
  action: SyncQueueItem['action'],
  storeName: string,
  data: unknown
): Promise<void> {
  const queueItem: SyncQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    storeName,
    data,
    timestamp: Date.now(),
    synced: false,
  };

  await put(STORES.SYNC_QUEUE, queueItem);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
}

export async function markSynced(id: string): Promise<void> {
  const item = await getById<SyncQueueItem>(STORES.SYNC_QUEUE, id);
  if (item) {
    item.synced = true;
    await put(STORES.SYNC_QUEUE, item);
  }
}

export async function clearSyncedItems(): Promise<void> {
  const items = await getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
  for (const item of items) {
    if (item.synced) {
      await remove(STORES.SYNC_QUEUE, item.id);
    }
  }
}

// Export/Import functionality
export async function exportAllData(): Promise<string> {
  const db = await openDB();
  const exportData: Record<string, unknown[]> = {};

  for (const storeName of Object.values(STORES)) {
    if (storeName !== STORES.SYNC_QUEUE) {
      exportData[storeName] = await getAll(storeName);
    }
  }

  return JSON.stringify({
    version: DB_VERSION,
    exportDate: new Date().toISOString(),
    data: exportData,
  }, null, 2);
}

export async function importAllData(jsonData: string): Promise<void> {
  const parsed = JSON.parse(jsonData);

  if (!parsed.data) {
    throw new Error('Invalid backup format');
  }

  const db = await openDB();

  for (const [storeName, dataList] of Object.entries(parsed.data)) {
    if (storeName !== STORES.SYNC_QUEUE && Array.isArray(dataList)) {
      await clearStore(storeName);
      await putAll(storeName, dataList as unknown[]);
    }
  }
}

export { STORES };
