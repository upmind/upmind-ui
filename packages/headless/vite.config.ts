import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      entryRoot: "src",
      outDir: "dist",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@upmind-automation/headless",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize if you have external dependencies
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // ---
      "@upmind-automation/types": resolve(__dirname, "../types/src/index.ts"),
    },
  },
  // Vitest config - https://vitest.dev/guide/#configuring-vitest
  // @ts-ignore
  // test: {
  //   environment: "jsdom",
  //   exclude: [...configDefaults.exclude, "e2e/*"],
  //   root: resolve(__dirname, "./"),
  //   // https://vitest.dev/guide/coverage.html
  //   coverage: {
  //     provider: "istanbul",
  //     enabled: true,
  //   },
  // },
});
