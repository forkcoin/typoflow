# TypoFlow HTML Reader Design

## Product Positioning

TypoFlow is a PWA for reading beautifully designed HTML documents. The first version behaves like a personal reading shelf, not a public publishing platform.

The user value is simple: people creating or collecting polished HTML pages need a clean place to store, reopen, and read them. TypoFlow should make those pages feel like saved reading material rather than loose files.

The first version must leave room for future public sharing, but it should not include a public gallery, creator network, comments, likes, follows, or moderation system.

## First Version Scope

TypoFlow v1 includes:

- A library view for browsing saved HTML items.
- Built-in sample HTML items so the product is useful immediately.
- Import by pasting HTML text.
- Import by uploading a local HTML file.
- A clean reading page that preserves the original HTML as much as possible.
- Lightweight reading controls: back, progress, favorite, and more actions.
- Search and simple filters for all items, unread items, favorites, and tags.
- Local persistence for imported items, favorites, tags, and reading progress.
- PWA support so the app can be installed and opened like a normal app.
- Offline access to saved and sample items.

TypoFlow v1 excludes:

- Public publishing.
- Public gallery.
- Creator profile pages.
- Comments, likes, follows, or social feeds.
- Collaborative editing.
- Full HTML editing tools.
- Account system.
- Server-side storage.

## Core Experience

The app opens to the library. The library should feel like a reading shelf: visual, calm, and quick to scan. Each item card shows a title, short summary, tags, favorite state, and reading progress.

Users can start with built-in sample content or add their own HTML. The import flow should be lightweight:

1. Choose paste or upload.
2. Preview basic metadata.
3. Save to library.
4. Open in the reader.

The reader is a pure canvas. The HTML content is the main experience. TypoFlow should avoid adding a heavy reader shell, side panel, visible explanation, or decorative frame around the document.

The reader may show a minimal top control bar with:

- Back to library.
- Reading progress.
- Favorite toggle.
- More menu.

The control bar should stay visually quiet and should not compete with the HTML content.

## Content Model

Each saved HTML item should include:

- `id`: stable local identifier.
- `title`: display title.
- `summary`: short description used in the library and future sharing.
- `html`: full HTML content.
- `sourceType`: `sample`, `paste`, or `upload`.
- `tags`: simple user-editable labels.
- `cover`: optional visual preview or fallback color treatment.
- `createdAt`: local creation date.
- `updatedAt`: local update date.
- `lastReadAt`: last opened date.
- `readingProgress`: percentage from 0 to 100.
- `favorite`: boolean.
- `shareStatus`: `private` for v1, reserved for future `public`.
- `shareSlug`: empty in v1, reserved for future public links.

This model keeps the first version local while preventing a redesign when public sharing is added later.

## Storage

The first version stores data locally in the browser. IndexedDB is preferred because imported HTML can be larger than typical settings data.

Sample items can ship as static app data. When the app first opens, samples should appear in the library without requiring setup.

The app should work offline for saved content after it has loaded once.

## HTML Rendering

Imported HTML should render inside an isolated preview area to reduce the chance that a saved document breaks the app interface.

The app should preserve the document's design as much as possible. It should not rewrite typography, colors, layout, or spacing unless needed to keep the reader usable.

The first version should support normal static HTML, inline CSS, and basic embedded assets when they are part of the saved document. It should not try to solve complex external dependency hosting in v1.

If an imported document depends on external network assets, the app may display it when online, but should not promise those external assets will work offline.

## Future Sharing Path

The v1 data model reserves fields for sharing, but all items remain private.

Future versions can add:

- Public share link for a single HTML item.
- Public item page using the same title, summary, cover, tags, and HTML.
- Creator profile that lists public items.
- Public gallery or curated collections.

The first version should avoid adding UI that suggests publishing is already available. A disabled or hidden future share path is acceptable only if it does not distract from reading.

## Error Handling

Import should fail gently when:

- The uploaded file is not readable.
- The file is too large for local storage.
- The pasted content is empty.
- Local storage is unavailable or full.

Failures should explain what happened in plain language and offer a next step, such as trying a smaller file or pasting again.

The reader should avoid losing the user if a document cannot render. It should show a simple failure state and a way back to the library.

## Testing

The first version should be checked with:

- A sample item appears on first load.
- A pasted HTML item can be saved and reopened.
- An uploaded HTML item can be saved and reopened.
- Favorites persist after refresh.
- Reading progress persists after refresh.
- Search and filters return the expected items.
- The app can be installed as a PWA.
- Saved content remains available offline after first load.
- A malformed or empty import shows a useful error.

## Success Criteria

TypoFlow v1 is successful if a user can open the app, see beautiful sample HTML, import their own HTML, save it to a library, read it in a clean full-page canvas, close the app, return later, and continue from their saved state.

The product should feel like a real reading home for HTML, while staying small enough that future public sharing can be added without undoing the first version.
