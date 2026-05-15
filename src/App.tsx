import { useEffect, useMemo, useState } from "react";
import ImportDialog from "./components/ImportDialog";
import LibraryView from "./components/LibraryView";
import ReaderView from "./components/ReaderView";
import { addItem, deleteLibraryItem, getItems, seedSamples, updateItem } from "./storage/htmlItemsStore";
import type { HtmlItem } from "./types";

export default function App() {
  const [items, setItems] = useState<HtmlItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  async function refreshItems() {
    setItems(await getItems());
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await seedSamples();
        const nextItems = await getItems();
        if (active) {
          setItems(nextItems);
        }
      } catch {
        if (active) {
          setError("无法打开你的本地 HTML 书架。");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function saveImportedItem(item: HtmlItem) {
    await addItem(item);
    await refreshItems();
    setImportOpen(false);
    setSelectedId(item.id);
  }

  async function toggleFavorite(item: HtmlItem) {
    await updateItem(item.id, { favorite: !item.favorite });
    await refreshItems();
  }

  async function saveProgress(item: HtmlItem, readingProgress: number) {
    await updateItem(item.id, { readingProgress, lastReadAt: new Date().toISOString() });
    await refreshItems();
  }

  async function removeItem(item: HtmlItem) {
    await deleteLibraryItem(item.id);
    if (selectedId === item.id) {
      setSelectedId(null);
    }
    await refreshItems();
  }

  if (loading) {
    return <main className="loading-screen">正在打开字映...</main>;
  }

  if (error) {
    return <main className="loading-screen">{error}</main>;
  }

  if (selectedItem) {
    return (
      <main className="app-shell">
        <ReaderView
          item={selectedItem}
          onBack={() => setSelectedId(null)}
          onFavorite={() => void toggleFavorite(selectedItem)}
          onProgress={(progress) => void saveProgress(selectedItem, progress)}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <LibraryView items={items} onOpen={(item) => setSelectedId(item.id)} onImport={() => setImportOpen(true)} onDelete={(item) => void removeItem(item)} />
      {importOpen ? <ImportDialog onClose={() => setImportOpen(false)} onSave={saveImportedItem} /> : null}
    </main>
  );
}
