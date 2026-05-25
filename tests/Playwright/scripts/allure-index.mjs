#!/usr/bin/env node
// @ts-check
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BUCKET = process.env.ALLURE_GCS_BUCKET || "REPLACE_ME_BUCKET_NAME";
const PREFIX = process.env.ALLURE_GCS_PREFIX || "allure";

if (BUCKET === "REPLACE_ME_BUCKET_NAME") {
  console.error("ALLURE_GCS_BUCKET is not set — skipping index refresh.");
  process.exit(0);
}

/** @param {string} path @returns {string[]} */
function listPrefixes(path) {
  try {
    const out = execSync(`gcloud storage ls "gs://${BUCKET}/${path}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (!out) return [];
    const stripped = `gs://${BUCKET}/`;
    return out
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.endsWith("/") && line !== `gs://${BUCKET}/${path}`)
      .map((line) => line.replace(stripped, ""));
  } catch {
    return [];
  }
}

/** @param {string} p @returns {string} */
function leafName(p) {
  return p.replace(/\/$/, "").split("/").pop() ?? "";
}

const ciBranches = listPrefixes(`${PREFIX}/ci/`).map(leafName).sort();
const localBranches = listPrefixes(`${PREFIX}/local/`).map(leafName).sort();

const now = new Date().toISOString();

const localSection = localBranches
  .map((branch) => {
    const users = listPrefixes(`${PREFIX}/local/${branch}/`).map(leafName);
    const userItems = users
      .map((user) => {
        // Newest run first
        const runs = listPrefixes(`${PREFIX}/local/${branch}/${user}/`)
          .map(leafName)
          .sort()
          .reverse();
        const runItems = runs
          .map(
            (ts) =>
              `<li><a href="${PREFIX}/local/${branch}/${user}/${ts}/report/index.html">${ts}</a></li>`
          )
          .join("");
        return `<li>${user}<ul>${runItems}</ul></li>`;
      })
      .join("");
    return `<li><strong>${branch}</strong><ul>${userItems}</ul></li>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Playwright test reports</title>
  <style>
    body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { margin-top: 0; }
    h2 { margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: .3rem; }
    ul { padding-left: 1.2rem; }
    li { margin: .2rem 0; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .meta { color: #888; font-size: 12px; }
    .empty { color: #888; font-style: italic; }
  </style>
</head>
<body>
  <h1>Playwright test reports</h1>
  <p class="meta">Updated ${now}</p>

  <h2>CI runs (latest per branch)</h2>
  ${
    ciBranches.length === 0
      ? '<p class="empty">No CI runs yet.</p>'
      : `<ul>${ciBranches
          .map(
            (b) =>
              `<li><a href="${PREFIX}/ci/${b}/latest/report/index.html">${b}</a></li>`
          )
          .join("")}</ul>`
  }

  <h2>Local runs</h2>
  ${localBranches.length === 0 ? '<p class="empty">No local runs yet.</p>' : `<ul>${localSection}</ul>`}
</body>
</html>
`;

const tmp = join(tmpdir(), `allure-index-${Date.now()}.html`);
writeFileSync(tmp, html);
execSync(
  `gcloud storage cp "${tmp}" "gs://${BUCKET}/index.html" --content-type=text/html --quiet`,
  { stdio: "inherit" }
);
unlinkSync(tmp);
console.log(
  `Index refreshed: https://storage.googleapis.com/${BUCKET}/index.html`
);
