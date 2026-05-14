# TypoFlow HTML Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first TypoFlow PWA: a local-first reading app for beautifully designed HTML, with sample content, paste/upload import, a library, pure-canvas reading, favorites, progress, and offline support.

**Architecture:** Create a Vite + React + TypeScript app with local IndexedDB storage and a hand-written service worker. Keep all v1 content private and local, while preserving share-ready fields in the item model for future public links.

**Tech Stack:** Vite, React, TypeScript, CSS, IndexedDB, Web App Manifest, Service Worker, Vitest, Testing Library.

---

## File Structure

- Create `package.json`: scripts, dependencies, test tooling.
- Create `index.html`: app entry shell.
- Create `vite.config.ts`: React and Vitest setup.
- Create `tsconfig.json`: strict TypeScript config.
- Create `src/main.tsx`: React entry.
- Create `src/App.tsx`: screen routing between library, import, and reader.
- Create `src/types.ts`: `HtmlItem` and app state types.
- Create `src/data/sampleItems.ts`: built-in sample HTML documents.
- Create `src/storage/htmlItemsStore.ts`: IndexedDB persistence and sample seeding.
- Create `src/utils/htmlMetadata.ts`: title/summary extraction from pasted or uploaded HTML.
- Create `src/utils/progress.ts`: reading progress helpers.
- Create `src/components/LibraryView.tsx`: bookshelf UI, search, filters, cards.
- Create `src/components/ImportDialog.tsx`: paste/upload import flow.
- Create `src/components/ReaderView.tsx`: pure-canvas HTML reader.
- Create `src/components/TopBar.tsx`: minimal reader controls.
- Create `src/styles.css`: full app styling.
- Create `public/manifest.webmanifest`: installable app metadata.
- Create `public/sw.js`: offline cache for app shell.
- Create `public/icons/icon.svg`: simple app icon.
- Create `src/**/*.test.ts(x)`: focused tests for metadata, storage, library, import, and reader behavior.

## Task 1: Scaffold App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create project scripts and dependencies**

```json
{
  "name": "typoflow",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview --host 127.0.0.1"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Create the HTML entry**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f7f2ea" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>TypoFlow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create Vite and TypeScript config**

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

- [ ] **Step 4: Create minimal app shell**

`src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>TypoFlow</h1>
      <p>HTML reading shelf</p>
    </main>
  );
}
```

`src/styles.css`:

```css
:root {
  color: #221f1a;
  background: #f7f2ea;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
}
```

- [ ] **Step 5: Install and verify**

Run: `npm i`

Run: `npm run build`

Expected: build completes with no TypeScript errors.

## Task 2: Define Content Model and Sample Items

**Files:**
- Create: `src/types.ts`
- Create: `src/data/sampleItems.ts`
- Create: `src/data/sampleItems.test.ts`

- [ ] **Step 1: Write model and sample tests**

```ts
import { sampleItems } from "./sampleItems";

it("ships at least three private sample items", () => {
  expect(sampleItems.length).toBeGreaterThanOrEqual(3);
  expect(sampleItems.every((item) => item.sourceType === "sample")).toBe(true);
  expect(sampleItems.every((item) => item.shareStatus === "private")).toBe(true);
  expect(sampleItems.every((item) => item.html.includes("<"))).toBe(true);
});
```

- [ ] **Step 2: Add item type**

```ts
export type HtmlSourceType = "sample" | "paste" | "upload";
export type HtmlShareStatus = "private" | "public";

export interface HtmlItem {
  id: string;
  title: string;
  summary: string;
  html: string;
  sourceType: HtmlSourceType;
  tags: string[];
  cover: string;
  createdAt: string;
  updatedAt: string;
  lastReadAt: string | null;
  readingProgress: number;
  favorite: boolean;
  shareStatus: HtmlShareStatus;
  shareSlug: string;
}

export type LibraryFilter = "all" | "unread" | "favorites";
```

- [ ] **Step 3: Add sample items**

Create three visually distinct sample HTML strings in `src/data/sampleItems.ts`. Each item must include all fields from `HtmlItem`, `shareStatus: "private"`, and `shareSlug: ""`.

- [ ] **Step 4: Verify**

Run: `npm run test -- src/data/sampleItems.test.ts`

Expected: sample test passes.

## Task 3: Add Local Storage

**Files:**
- Create: `src/storage/htmlItemsStore.ts`
- Create: `src/storage/htmlItemsStore.test.ts`

- [ ] **Step 1: Write storage tests**

```ts
import { sampleItems } from "../data/sampleItems";
import { addItem, getItems, resetStoreForTests, seedSamples, updateItem } from "./htmlItemsStore";

beforeEach(async () => {
  await resetStoreForTests();
});

it("seeds sample items once", async () => {
  await seedSamples();
  await seedSamples();
  const items = await getItems();
  expect(items).toHaveLength(sampleItems.length);
});

it("adds and updates imported items", async () => {
  await addItem({ ...sampleItems[0], id: "imported-1", sourceType: "paste", title: "Imported" });
  await updateItem("imported-1", { favorite: true, readingProgress: 62 });
  const item = (await getItems()).find((entry) => entry.id === "imported-1");
  expect(item?.favorite).toBe(true);
  expect(item?.readingProgress).toBe(62);
});
```

- [ ] **Step 2: Implement IndexedDB wrapper**

Implement `openDb`, `getItems`, `getItem`, `addItem`, `updateItem`, `deleteItem`, `seedSamples`, and `resetStoreForTests`. Use one database named `typoflow`, one object store named `htmlItems`, and item `id` as key.

- [ ] **Step 3: Verify**

Run: `npm run test -- src/storage/htmlItemsStore.test.ts`

Expected: storage tests pass.

## Task 4: Build Metadata Extraction

**Files:**
- Create: `src/utils/htmlMetadata.ts`
- Create: `src/utils/htmlMetadata.test.ts`

- [ ] **Step 1: Write metadata tests**

```ts
import { createItemFromHtml } from "./htmlMetadata";

it("extracts title and summary from html", () => {
  const item = createItemFromHtml("<html><head><title>Quiet Layout</title></head><body><p>A calm reading test.</p></body></html>", "paste");
  expect(item.title).toBe("Quiet Layout");
  expect(item.summary).toContain("A calm reading test");
  expect(item.shareStatus).toBe("private");
  expect(item.shareSlug).toBe("");
});

it("rejects empty html", () => {
  expect(() => createItemFromHtml("   ", "paste")).toThrow("HTML content is empty.");
});
```

- [ ] **Step 2: Implement metadata extraction**

Use `DOMParser` to read the document title and body text. Fall back to `Untitled HTML` when no title exists. Create a short summary from body text. Generate a local id with `crypto.randomUUID()`. Default tags to `[]`, favorite to `false`, progress to `0`, and sharing fields to private/empty.

- [ ] **Step 3: Verify**

Run: `npm run test -- src/utils/htmlMetadata.test.ts`

Expected: metadata tests pass.

## Task 5: Build Library View

**Files:**
- Create: `src/components/LibraryView.tsx`
- Create: `src/components/LibraryView.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write library behavior tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sampleItems } from "../data/sampleItems";
import LibraryView from "./LibraryView";

it("shows items and filters favorites", async () => {
  const user = userEvent.setup();
  render(<LibraryView items={[{ ...sampleItems[0], favorite: true }, sampleItems[1]]} onOpen={() => {}} onImport={() => {}} />);
  expect(screen.getAllByRole("article")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: /favorites/i }));
  expect(screen.getAllByRole("article")).toHaveLength(1);
});
```

- [ ] **Step 2: Implement library**

Create a top bar with app name, search field, and import button. Add filter buttons for all, unread, favorites. Render item cards with title, summary, tags, progress, source label, and favorite state.

- [ ] **Step 3: Wire library in App**

On app start, call `seedSamples()` and load items. Store selected item id in React state. Show library by default.

- [ ] **Step 4: Verify**

Run: `npm run test -- src/components/LibraryView.test.tsx`

Run: `npm run build`

Expected: tests and build pass.

## Task 6: Build Import Flow

**Files:**
- Create: `src/components/ImportDialog.tsx`
- Create: `src/components/ImportDialog.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write import tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImportDialog from "./ImportDialog";

it("saves pasted html", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<ImportDialog onClose={() => {}} onSave={onSave} />);
  await user.type(screen.getByLabelText(/paste html/i), "<html><head><title>Saved</title></head><body>Text</body></html>");
  await user.click(screen.getByRole("button", { name: /save/i }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Saved", sourceType: "paste" }));
});
```

- [ ] **Step 2: Implement paste and upload**

Add a dialog with textarea paste input and file input. Use `createItemFromHtml` for pasted HTML. For uploaded files, read text with `FileReader`, then call `createItemFromHtml(html, "upload")`. Show plain-language errors for empty content or unreadable files.

- [ ] **Step 3: Persist imported item**

In `App.tsx`, save imported items with `addItem`, refresh the library, close the dialog, and open the new reader item.

- [ ] **Step 4: Verify**

Run: `npm run test -- src/components/ImportDialog.test.tsx`

Run: `npm run build`

Expected: tests and build pass.

## Task 7: Build Pure Canvas Reader

**Files:**
- Create: `src/components/ReaderView.tsx`
- Create: `src/components/TopBar.tsx`
- Create: `src/utils/progress.ts`
- Create: `src/components/ReaderView.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write reader tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sampleItems } from "../data/sampleItems";
import ReaderView from "./ReaderView";

it("renders html in a document frame and toggles favorite", async () => {
  const user = userEvent.setup();
  const onFavorite = vi.fn();
  render(<ReaderView item={sampleItems[0]} onBack={() => {}} onFavorite={onFavorite} onProgress={() => {}} />);
  expect(screen.getByTitle("HTML document")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /favorite/i }));
  expect(onFavorite).toHaveBeenCalled();
});
```

- [ ] **Step 2: Implement reader**

Render a minimal top bar and an `iframe` using `srcDoc={item.html}`. Use `sandbox="allow-same-origin"` for static reading. Keep the iframe full height below the quiet top bar.

- [ ] **Step 3: Add progress helper**

Implement a scroll-based progress calculation inside the reader container. Save progress as a number from 0 to 100 when it changes meaningfully.

- [ ] **Step 4: Persist reader state**

In `App.tsx`, update `favorite`, `lastReadAt`, and `readingProgress` through `updateItem`, then refresh local state.

- [ ] **Step 5: Verify**

Run: `npm run test -- src/components/ReaderView.test.tsx`

Run: `npm run build`

Expected: tests and build pass.

## Task 8: Add PWA and Offline Support

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `public/icons/icon.svg`
- Modify: `src/main.tsx`

- [ ] **Step 1: Add manifest**

```json
{
  "name": "TypoFlow",
  "short_name": "TypoFlow",
  "description": "A reading shelf for beautifully designed HTML.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f7f2ea",
  "theme_color": "#f7f2ea",
  "icons": [
    {
      "src": "/icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Add service worker**

Cache the app shell during install. Use a cache-first strategy for same-origin app files and a network-first fallback for navigation requests. Do not attempt to cache arbitrary external assets referenced by imported HTML.

- [ ] **Step 3: Register service worker**

In `src/main.tsx`, after render, register `/sw.js` when `"serviceWorker" in navigator` and `import.meta.env.PROD`.

- [ ] **Step 4: Verify**

Run: `npm run build`

Run: `npm run preview`

Open the app, confirm the browser reports a registered service worker and a valid manifest.

## Task 9: Final App Polish and Manual Verification

**Files:**
- Modify: `src/styles.css`
- Modify: `src/components/LibraryView.tsx`
- Modify: `src/components/ImportDialog.tsx`
- Modify: `src/components/ReaderView.tsx`
- Modify: `src/components/TopBar.tsx`

- [ ] **Step 1: Polish responsive layout**

Ensure the library works on desktop and mobile. On narrow screens, cards should become one column, the sidebar filters should become a compact horizontal row, and the reader top bar should not cover the HTML.

- [ ] **Step 2: Manual reading checks**

Run: `npm run dev`

Check:

- Sample items appear on first load.
- A sample opens in the pure canvas reader.
- Back returns to the library.
- Favorite state survives refresh.
- Pasted HTML saves and reopens.
- Uploaded HTML saves and reopens.
- Empty paste shows an understandable error.
- Search finds expected items.
- Favorites filter shows only favorites.

- [ ] **Step 3: Production verification**

Run: `npm run test`

Expected: all tests pass.

Run: `npm run build`

Expected: production build completes.

Run: `npm run preview`

Expected: app opens from the built output and saved content remains in the browser.

## Self-Review

- Spec coverage: This plan covers library, samples, paste import, upload import, pure-canvas reader, favorites, progress, local storage, PWA installability, offline app shell, and future sharing fields.
- Scope check: Public publishing, gallery, accounts, comments, likes, follows, and server storage are intentionally excluded.
- Placeholder scan: The plan contains no TBD/TODO items. Layout polish is constrained to `styles.css`, `LibraryView`, `ImportDialog`, `ReaderView`, and `TopBar`.
- Type consistency: `HtmlItem`, `sourceType`, `shareStatus`, `shareSlug`, `favorite`, and `readingProgress` are defined once and used consistently throughout the tasks.
