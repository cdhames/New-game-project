import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@long-map/protocol": fileURLToPath(
        new URL("../../packages/protocol/src/index.ts", import.meta.url),
      ),
      "@long-map/game-core": fileURLToPath(
        new URL("../../packages/game-core/src/index.ts", import.meta.url),
      ),
    },
  },
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
