import { sampleItems } from "../data/sampleItems";
import { loadPublicSampleItems } from "../data/publicSamples";
import type { HtmlItem } from "../types";

const DB_NAME = "typoflow";
const STORE_NAME = "htmlItems";
const DB_VERSION = 1;
const HIDDEN_PUBLIC_SAMPLE_IDS_KEY = "typoflow.hiddenPublicSampleIds";
const REMOVED_BUILT_IN_SAMPLE_IDS = new Set(["sample-editorial-grid", "sample-night-notes", "sample-visual-brief"]);
const REMOVED_BUILT_IN_SAMPLE_TITLES = new Set(["编辑网格", "编辑网络", "夜间札记", "视觉简报"]);

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

function readHiddenPublicSampleIds(): Set<string> {
  if (typeof localStorage === "undefined") {
    return new Set();
  }

  try {
    const value = localStorage.getItem(HIDDEN_PUBLIC_SAMPLE_IDS_KEY);
    const ids = value ? JSON.parse(value) : [];
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function saveHiddenPublicSampleIds(ids: Set<string>): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(HIDDEN_PUBLIC_SAMPLE_IDS_KEY, JSON.stringify([...ids]));
}

function isPublicSampleItem(item: HtmlItem): boolean {
  return item.sourceType === "sample" && item.id.startsWith("public-sample-");
}

function isRemovedBuiltInSampleItem(item: HtmlItem): boolean {
  return item.sourceType === "sample" && (REMOVED_BUILT_IN_SAMPLE_IDS.has(item.id) || REMOVED_BUILT_IN_SAMPLE_TITLES.has(item.title));
}

function mergePublicSampleState(nextItem: HtmlItem, existingItem?: HtmlItem): HtmlItem {
  if (!existingItem) {
    return nextItem;
  }

  return {
    ...nextItem,
    favorite: existingItem.favorite,
    lastReadAt: existingItem.lastReadAt,
    readingProgress: existingItem.readingProgress,
    shareSlug: existingItem.shareSlug,
    shareStatus: existingItem.shareStatus,
  };
}

export async function deleteLibraryItem(id: string): Promise<void> {
  const item = await getItem(id);
  if (item && isPublicSampleItem(item)) {
    const hiddenIds = readHiddenPublicSampleIds();
    hiddenIds.add(item.id);
    saveHiddenPublicSampleIds(hiddenIds);
  }
  await deleteItem(id);
}

export async function seedSamples(): Promise<void> {
  const items = await getItems();
  const existingIds = new Set(items.map((item) => item.id));
  const hiddenPublicSampleIds = readHiddenPublicSampleIds();
  const publicSampleItems = (await loadPublicSampleItems()).filter((item) => !hiddenPublicSampleIds.has(item.id));
  const publicSampleIds = new Set(publicSampleItems.map((item) => item.id));
  const existingById = new Map(items.map((item) => [item.id, item]));

  const stalePublicSampleIds = items.filter((item) => isPublicSampleItem(item) && !publicSampleIds.has(item.id)).map((item) => item.id);
  const removedBuiltInSampleIds = items.filter(isRemovedBuiltInSampleItem).map((item) => item.id);
  await Promise.all([...stalePublicSampleIds, ...removedBuiltInSampleIds].map((id) => deleteItem(id)));

  const builtInItems = sampleItems.filter((item) => !existingIds.has(item.id) && !isRemovedBuiltInSampleItem(item));
  const syncedPublicSampleItems = publicSampleItems.map((item) => mergePublicSampleState(item, existingById.get(item.id)));
  await Promise.all([...builtInItems, ...syncedPublicSampleItems].map((item) => addItem(item)));
}

export function resetStoreForTests(): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error ?? new Error("Could not reset test database."));
    deleteRequest.onblocked = () => resolve();
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(HIDDEN_PUBLIC_SAMPLE_IDS_KEY);
    }
  });
}
