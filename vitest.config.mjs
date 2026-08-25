import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@long-map/protocol": fileURLToPath(
        new URL("./packages/protocol/src/index.ts", import.meta.url),
      ),
      "@long-map/game-core": fileURLToPath(
        new URL("./packages/game-core/src/index.ts", import.meta.url),
      ),
      "@long-map/sim": fileURLToPath(new URL("./packages/sim/src/index.ts", import.meta.url)),
    },
  },
  test: {
    include: ["packages/*/src/**/*.test.ts"],
  },
});
