import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, configDefaults } from "vitest/config";

const alias = {
  "@upmind-automation/headless": fileURLToPath(
    new URL("../../packages/headless/src/index.ts", import.meta.url)
  ),
  "@upmind-automation/test-fixtures": fileURLToPath(
    new URL("../fixtures", import.meta.url)
  )
};

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias
  },
  test: {
    root: fileURLToPath(new URL("./", import.meta.url)),
    environment: "jsdom",
    include: ["**/*.int.test.ts"],
    exclude: [
      ...configDefaults.exclude,
      "**/*.spec.ts",
      "**/*.fixtures.ts",
      "**/fixtures/**",
      "**/node_modules/**"
    ],
    passWithNoTests: true
  }
});
