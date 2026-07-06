import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Self-alias so in-package tests import via the public specifier
// (`@upmind-automation/test-fixtures/generator`) exactly as external consumers
// do — the bare specifier maps to this directory; subpaths resolve to `.ts`.
const alias = {
  "@upmind-automation/test-fixtures": fileURLToPath(
    new URL("./", import.meta.url)
  )
};

export default defineConfig({
  test: {
    root: fileURLToPath(new URL("./", import.meta.url)),
    environment: "node",
    include: ["*.test.ts"]
  },
  resolve: { alias }
});
