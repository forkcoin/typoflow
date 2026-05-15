import react from "@vitejs/plugin-react";
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import { syncSamplesManifest } from "./scripts/sync-samples-manifest.mjs";

function samplesManifestPlugin() {
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function syncAndReload(server?: { ws: { send: (payload: { type: "full-reload" }) => void } }) {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      await syncSamplesManifest();
      server?.ws.send({ type: "full-reload" });
    }, 80);
  }

  return {
    name: "typoflow-samples-manifest",
    async buildStart() {
      await syncSamplesManifest();
    },
    configureServer(server) {
      server.watcher.add("public/samples");
      const onChange = (filePath: string) => {
        if (!filePath.includes("public/samples") || filePath.endsWith("manifest.json")) {
          return;
        }
        void syncAndReload(server);
      };
      server.watcher.on("add", onChange);
      server.watcher.on("change", onChange);
      server.watcher.on("unlink", onChange);
      server.watcher.on("addDir", onChange);
      server.watcher.on("unlinkDir", onChange);
    },
  };
}

function githubPagesFallbackPlugin() {
  return {
    name: "typoflow-github-pages-fallback",
    async closeBundle() {
      await copyFile(path.resolve("dist/index.html"), path.resolve("dist/404.html"));
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [samplesManifestPlugin(), react(), githubPagesFallbackPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
