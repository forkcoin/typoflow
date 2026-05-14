import { sampleItems } from "../data/sampleItems";
import type { HtmlItem } from "../types";

const DB_NAME = "typoflow";
const STORE_NAME = "htmlItems";
const DB_VERSION = 1;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local library."));
  });
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    const transaction = db.transaction(STORE_NAME, mode);
    return await requestToPromise(action(transaction.objectStore(STORE_NAME)));
  } finally {
    db.close();
  }
}

export async function getItems(): Promise<HtmlItem[]> {
  const items = await withStore<HtmlItem[]>("readonly", (store) => store.getAll());
  return items.sort((a, b) => {
    const bDate = b.lastReadAt ?? b.createdAt;
    const aDate = a.lastReadAt ?? a.createdAt;
    return bDate.localeCompare(aDate);
  });
}

export function getItem(id: string): Promise<HtmlItem | undefined> {
  return withStore<HtmlItem | undefined>("readonly", (store) => store.get(id));
}

export function addItem(item: HtmlItem): Promise<IDBValidKey> {
  return withStore<IDBValidKey>("readwrite", (store) => store.put(item));
}

export async function updateItem(id: string, patch: Partial<HtmlItem>): Promise<HtmlItem> {
  const existing = await getItem(id);
  if (!existing) {
    throw new Error("Item not found.");
  }
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await addItem(updated);
  return updated;
}

export function deleteItem(id: string): Promise<undefined> {
  return withStore<undefined>("readwrite", (store) => store.delete(id));
}

export async function seedSamples(): Promise<void> {
  const items = await getItems();
  const existingIds = new Set(items.map((item) => item.id));
  await Promise.all(sampleItems.filter((item) => !existingIds.has(item.id)).map((item) => addItem(item)));
}

export function resetStoreForTests(): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error ?? new Error("Could not reset test database."));
    deleteRequest.onblocked = () => resolve();
  });
}
