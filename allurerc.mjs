import { defineConfig } from "allure";

export default defineConfig({
  name: "Upmind Cart e2e",
  output: "./tests/Playwright/e2e/reports/allure-report",
  historyPath: "./tests/Playwright/e2e/reports/.allure-history/history.jsonl",
  qualityGate: {
    rules: [
      {
        maxFailures: 10,
        fastFail: true,
      },
    ],
  },
  plugins: {
    awesome: {
      options: {
        reportName: "Allure Report",
        singleFile: false,
        reportLanguage: "en",
        charts: [
          {
            type: "currentStatus",
          },
          {
            type: "testResultSeverities",
          },
          {
            type: "statusDynamics",
          },

          {
            type: "statusTransitions",
          },
        ],
      },
    },
  },
  defaultLabels: {
    severity: "normal",
  }
});