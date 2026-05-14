import { BookOpen, Clock, Heart, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { HtmlItem, LibraryFilter } from "../types";

interface LibraryViewProps {
  items: HtmlItem[];
  onOpen: (item: HtmlItem) => void;
  onImport: () => void;
}

const filterLabels: Array<{ key: LibraryFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "favorites", label: "Favorites" },
];

export default function LibraryView({ items, onOpen, onImport }: LibraryViewProps) {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter =
        filter === "all" || (filter === "unread" && item.readingProgress === 0) || (filter === "favorites" && item.favorite);
      const searchable = [item.title, item.summary, item.sourceType, ...item.tags].join(" ").toLowerCase();
      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [filter, items, query]);

  return (
    <section className="library-screen" aria-label="HTML library">
      <header className="library-header">
        <div>
          <p className="eyebrow">TypoFlow</p>
          <h1>HTML reading shelf</h1>
        </div>
        <button className="primary-button" onClick={onImport}>
          <Plus size={18} />
          Import
        </button>
      </header>

      <div className="library-tools">
        <label className="search-box">
          <Search size={18} />
          <span className="sr-only">Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved HTML" />
        </label>
        <div className="filter-row" aria-label="Library filters">
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
      </div>

      <div className="item-grid">
        {visibleItems.map((item) => (
          <article className="item-card" key={item.id} onClick={() => onOpen(item)}>
            <div className="cover-strip" style={{ background: item.cover }} />
            <div className="card-content">
              <div className="card-meta">
                <span>{item.sourceType}</span>
                {item.favorite ? <Heart size={16} fill="currentColor" aria-label="Favorite" /> : null}
              </div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <div className="tag-row">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="progress-line">
                <BookOpen size={15} />
                <span>{item.readingProgress}% read</span>
                {item.lastReadAt ? <Clock size={15} /> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {visibleItems.length === 0 ? <p className="empty-state">No HTML found here yet.</p> : null}
    </section>
  );
}
