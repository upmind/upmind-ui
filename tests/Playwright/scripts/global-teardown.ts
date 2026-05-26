/// <reference types="node" />
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RESULTS_DIR = "tests/Playwright/e2e/reports/allure-results";

function writeExecutorInfo(): void {
  const isCI = Boolean(process.env.CI);
  const branch =
    process.env.CI_COMMIT_REF_NAME ||
    process.env.GITHUB_REF_NAME ||
    process.env.GIT_BRANCH ||
    "unknown";

  const executor = isCI
    ? {
        name: "GitLab CI",
        type: "gitlab",
        url: process.env.CI_PROJECT_URL || "",
        buildOrder: Number(process.env.CI_PIPELINE_IID) || Date.now(),
        buildName: `Pipeline #${process.env.CI_PIPELINE_IID || "?"} (${branch})`,
        buildUrl: process.env.CI_PIPELINE_URL || "",
        reportName: `Playwright E2E report — pipeline #${process.env.CI_PIPELINE_IID || "?"}`,
        reportUrl: ""
      }
    : {
        name: "Local",
        type: "manual",
        url: "",
        buildOrder: Date.now(),
        buildName: `local ${new Date().toISOString().replace(/\.\d+Z$/, "Z")} (${branch})`,
        buildUrl: "",
        reportName: "Playwright E2E report — local run",
        reportUrl: ""
      };

  if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(
    join(RESULTS_DIR, "executor.json"),
    JSON.stringify(executor, null, 2)
  );
}

export default function globalTeardown(): void {
  if (process.env.ALLURE_SKIP_GENERATE === "1") return;

  try {
    writeExecutorInfo();
    execSync("bash tests/Playwright/scripts/allure-generate.sh", {
      stdio: "inherit"
    });
  } catch (err) {
    console.warn("[allure] report generation skipped:", (err as Error).message);
  }
}
