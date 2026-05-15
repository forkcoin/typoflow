import { ChevronLeft, Folder, Heart, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HtmlItem, LibraryFilter } from "../types";

interface LibraryViewProps {
  items: HtmlItem[];
  onOpen: (item: HtmlItem) => void;
  onImport: () => void;
  onDelete: (item: HtmlItem) => void;
}

const filterLabels: Array<{ key: LibraryFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "unread", label: "未读" },
  { key: "favorites", label: "收藏" },
];

const sourceLabels: Record<HtmlItem["sourceType"], string> = {
  sample: "示例",
  paste: "粘贴",
  upload: "上传",
};

const DEFAULT_ITEMS_PER_PAGE = 12;
const TOOLS_OPEN_ITEMS_PER_PAGE = 9;

interface FolderGroup {
  name: string;
  count: number;
}

export default function LibraryView({ items, onOpen, onImport, onDelete }: LibraryViewProps) {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<HtmlItem | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextOpen = useRef(false);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter =
        filter === "all" || (filter === "unread" && item.readingProgress === 0) || (filter === "favorites" && item.favorite);
      const searchable = [item.title, item.summary, item.sourceType, item.folderName ?? "", ...item.tags].join(" ").toLowerCase();
      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [filter, items, query]);

  const folderGroups = useMemo<FolderGroup[]>(() => {
    if (currentFolderName) {
      return [];
    }
    const counts = new Map<string, number>();
    visibleItems.forEach((item) => {
      if (item.folderName) {
        counts.set(item.folderName, (counts.get(item.folderName) ?? 0) + 1);
      }
    });
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, "zh-CN")).map(([name, count]) => ({ name, count }));
  }, [currentFolderName, visibleItems]);

  const visiblePageItems = useMemo(() => {
    if (currentFolderName) {
      return visibleItems.filter((item) => item.folderName === currentFolderName);
    }
    return visibleItems.filter((item) => !item.folderName);
  }, [currentFolderName, visibleItems]);

  const totalVisibleCount = currentFolderName ? visiblePageItems.length : visiblePageItems.length + folderGroups.length;
  const pageEntries = useMemo(() => [...folderGroups, ...visiblePageItems], [folderGroups, visiblePageItems]);
  const itemsPerPage = searchOpen || filtersOpen ? TOOLS_OPEN_ITEMS_PER_PAGE : DEFAULT_ITEMS_PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(pageEntries.length / itemsPerPage));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = pageEntries.slice(currentPage * itemsPerPage, currentPage * itemsPerPage + itemsPerPage);

  useEffect(() => {
    setPage(0);
  }, [currentFolderName, filter, filtersOpen, query, searchOpen]);

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(pageCount - 1);
    }
  }, [page, pageCount]);

  function openFromKeyboard(event: KeyboardEvent<HTMLElement>, item: HtmlItem) {
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      setDeleteTarget(item);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(item);
    }
  }

  function clearLongPressTimer() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function startLongPress(item: HtmlItem) {
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      suppressNextOpen.current = true;
      setDeleteTarget(item);
      longPressTimer.current = null;
    }, 650);
  }

  function openFromClick(item: HtmlItem) {
    if (suppressNextOpen.current) {
      suppressNextOpen.current = false;
      return;
    }
    onOpen(item);
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    onDelete(deleteTarget);
    setDeleteTarget(null);
  }

  return (
    <section className="library-screen" aria-label="HTML 书架">
      <div className="device-frame">
        <div className="screen-bezel">
          <header className="library-header">
            <div className="library-title-group">
              <h1>字映</h1>
              <span>{currentFolderName ?? `${totalVisibleCount} FILES`}</span>
            </div>
            <div className="library-actions">
              <button className="icon-button" aria-label={searchOpen ? "关闭搜索" : "打开搜索"} onClick={() => setSearchOpen((open) => !open)}>
                {searchOpen ? <X size={17} /> : <Search size={17} />}
              </button>
              <button className="icon-button" aria-label={filtersOpen ? "关闭筛选" : "打开筛选"} onClick={() => setFiltersOpen((open) => !open)}>
                <SlidersHorizontal size={17} />
              </button>
              <button className="icon-button import-trigger" aria-label="导入 HTML" onClick={onImport}>
                <Plus size={17} />
              </button>
            </div>
          </header>

          {searchOpen ? (
            <label className="search-box">
              <Search size={17} />
              <span className="sr-only">搜索</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 HTML 文件" />
            </label>
          ) : null}

          {filtersOpen ? (
            <div className="filter-row" aria-label="书架筛选">
              {filterLabels.map((entry) => (
                <button
                  className={filter === entry.key ? "filter-button active" : "filter-button"}
                  key={entry.key}
                  onClick={() => setFilter(entry.key)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          ) : null}

          {currentFolderName ? (
            <button className="folder-back-button" onClick={() => setCurrentFolderName(null)}>
              <ChevronLeft size={16} />
              书架
            </button>
          ) : null}

          <div className="item-grid">
            {pageItems.map((entry) =>
              "count" in entry ? (
                <button className="item-card folder-card" key={`folder-${entry.name}`} aria-label={`${entry.name}，${entry.count} 篇`} onClick={() => setCurrentFolderName(entry.name)}>
                  <div className="cover-strip" aria-hidden="true">
                    <Folder size={15} />
                  </div>
                  <div className="card-content">
                    <h2>{entry.name}</h2>
                    <div className="card-meta">
                      <span>{entry.count} 篇</span>
                    </div>
                  </div>
                </button>
              ) : (
                <article
                  className="item-card"
                  key={entry.id}
                  onClick={() => openFromClick(entry)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setDeleteTarget(entry);
                  }}
                  onKeyDown={(event) => openFromKeyboard(event, entry)}
                  onPointerCancel={clearLongPressTimer}
                  onPointerDown={() => startLongPress(entry)}
                  onPointerLeave={clearLongPressTimer}
                  onPointerUp={clearLongPressTimer}
                  tabIndex={0}
                >
                  <div className="cover-strip" aria-hidden="true">
                    &gt;
                  </div>
                  <div className="card-content">
                    <h2>{entry.title}</h2>
                    <div className="card-meta">
                      <span>{sourceLabels[entry.sourceType]}</span>
                      <span>{entry.readingProgress > 0 ? `读到 ${entry.readingProgress}%` : "未读"}</span>
                      {entry.favorite ? <Heart size={13} fill="currentColor" aria-label="已收藏" /> : null}
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
          {totalVisibleCount === 0 ? <p className="empty-state">这里还没有找到 HTML。</p> : null}
          <div className="screen-footer">
            <button className="pager-button" disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
              PREV
            </button>
            <span>
              PAGE {currentPage + 1}/{pageCount}
            </span>
            <button className="pager-button" disabled={currentPage >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>
              NEXT
            </button>
          </div>
        </div>
        <div className="device-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      {deleteTarget ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}>
          <section className="import-dialog delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <h2 id="delete-dialog-title">删除这篇 HTML？</h2>
                <p>{deleteTarget.title}</p>
              </div>
              <button className="icon-button" aria-label="关闭删除确认" onClick={() => setDeleteTarget(null)}>
                <X size={17} />
              </button>
            </header>
            <p className="delete-dialog-message">该项目会从书架中移除，原始文件不会被删除。</p>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => setDeleteTarget(null)}>
                取消
              </button>
              <button className="primary-button danger-button" onClick={confirmDelete}>
                删除
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
