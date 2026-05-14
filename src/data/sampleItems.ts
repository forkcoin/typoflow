import type { HtmlItem } from "../types";

const now = "2026-05-14T00:00:00.000Z";

export const sampleItems: HtmlItem[] = [
  {
    id: "sample-editorial-grid",
    title: "Editorial Grid",
    summary: "A magazine-like HTML page with strong spacing, serif headlines, and visual rhythm.",
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#f2eadf;color:#26221c;font-family:Georgia,serif}
      main{max-width:980px;margin:auto;padding:8vw 6vw}
      h1{font-size:clamp(48px,9vw,118px);line-height:.9;margin:0 0 28px}
      .kicker{font:700 13px system-ui;letter-spacing:.16em;text-transform:uppercase}
      .grid{display:grid;grid-template-columns:1.2fr .8fr;gap:34px;align-items:end}
      p{font-size:21px;line-height:1.55}.panel{border:1px solid #9b8064;padding:28px}
      @media(max-width:720px){.grid{grid-template-columns:1fr}h1{font-size:52px}}
    </style></head><body><main><p class="kicker">Sample Issue 01</p><div class="grid"><section><h1>Quiet pages for loud ideas.</h1><p>TypoFlow keeps designed HTML intact, so the page can speak in its own visual language.</p></section><aside class="panel">A saved HTML page should feel intentional, not like a forgotten file.</aside></div></main></body></html>`,
    sourceType: "sample",
    tags: ["editorial", "layout"],
    cover: "#d8b58a",
    createdAt: now,
    updatedAt: now,
    lastReadAt: null,
    readingProgress: 0,
    favorite: false,
    shareStatus: "private",
    shareSlug: "",
  },
  {
    id: "sample-night-notes",
    title: "Night Notes",
    summary: "A dark reading card with compact notes and a calm visual system.",
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#15171a;color:#f4efe6;font-family:Inter,system-ui,sans-serif}
      main{min-height:100vh;display:grid;place-items:center;padding:40px}
      article{width:min(760px,100%);border:1px solid #41464f;padding:42px;background:#1d2026}
      h1{font-size:56px;margin:0 0 12px}.meta{color:#c7b99f;margin-bottom:36px}
      li{font-size:20px;line-height:1.7;margin:12px 0}
    </style></head><body><main><article><h1>Night Notes</h1><p class="meta">A compact HTML reading object</p><ul><li>Designed documents keep their own atmosphere.</li><li>The reader should stay quiet.</li><li>Progress and favorites are enough for version one.</li></ul></article></main></body></html>`,
    sourceType: "sample",
    tags: ["notes", "dark"],
    cover: "#20242b",
    createdAt: now,
    updatedAt: now,
    lastReadAt: null,
    readingProgress: 0,
    favorite: false,
    shareStatus: "private",
    shareSlug: "",
  },
  {
    id: "sample-visual-brief",
    title: "Visual Brief",
    summary: "A clean project brief page with blocks, metrics, and a soft paper surface.",
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#fbfaf7;color:#202020;font-family:ui-sans-serif,system-ui}
      main{max-width:1040px;margin:0 auto;padding:64px 28px}
      h1{font-size:64px;line-height:1;margin:0 0 24px}
      .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:36px}
      .card{border:1px solid #ddd4c8;padding:22px;background:white;min-height:150px}
      strong{display:block;font-size:34px;margin-bottom:10px}
      @media(max-width:760px){.cards{grid-template-columns:1fr}h1{font-size:46px}}
    </style></head><body><main><h1>Readable systems for saved HTML.</h1><p>Use TypoFlow as a home for polished fragments, single-page essays, visual experiments, and generated layouts.</p><div class="cards"><div class="card"><strong>01</strong>Import</div><div class="card"><strong>02</strong>Read</div><div class="card"><strong>03</strong>Return</div></div></main></body></html>`,
    sourceType: "sample",
    tags: ["brief", "clean"],
    cover: "#efe7dc",
    createdAt: now,
    updatedAt: now,
    lastReadAt: null,
    readingProgress: 0,
    favorite: false,
    shareStatus: "private",
    shareSlug: "",
  },
];
