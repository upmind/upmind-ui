import { defineConfig } from "allure";

export default defineConfig({
  name: "Upmind Cart e2e",
  output: "./tests/Playwright/e2e/reports/allure-report",
  historyPath: "./tests/Playwright/e2e/reports/.allure-history/history.jsonl"
});
