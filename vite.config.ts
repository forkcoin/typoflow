import react from "@vitejs/plugin-react";
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

export default defineConfig({
  plugins: [samplesManifestPlugin(), react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
