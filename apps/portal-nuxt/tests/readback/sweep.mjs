#!/usr/bin/env node
/**
 * The read-back harness for the portal composition framework epic (SDD
 * tasks.md 1.0). It starts — or attaches to — portal-nuxt's dev server on
 * port 3100, drives a set of routes at a set of viewports, and files the
 * observations (computed styles, bounding rects, a screenshot per route ×
 * viewport, plus the rendered page heading, the landmark list, the resolved
 * pathname and `history.length`) into a named output directory.
 *
 * CORRECTED 2026-08-24 (stage-2 verifier). Two observations were constants and
 * could not tell a working route tree from a broken one:
 *   - `historyLengthBefore` was read on the fresh `about:blank` page, so it
 *     filed `1` for every route. It is now read after an in-origin warm load,
 *     making the pair a real before/after around the drive (a route that
 *     push-navigates reads one higher than one that replace-navigates).
 *   - `document.title` is set once in `nuxt.config.ts` and no page overrides
 *     it, so it filed the same string for every route. `heading` (the rendered
 *     `<h1>`) is the per-route discriminator; `title` is still filed, but as
 *     the global constant it is.
 * `landmarks` is filed alongside for X4.
 *
 * It ASSERTS NOTHING. It observes and records — tooling, not a test. Every
 * later stage re-runs it unchanged; extend ROUTES/SELECTORS below (or pass
 * `--routes`/`--selector`) rather than rebuilding it.
 *
 * Usage (from apps/portal-nuxt, or `pnpm -C apps/portal-nuxt exec node ...`):
 *   node tests/readback/sweep.mjs --out ../../docs/sdd/<epic>/evidence/stage-1/readback
 *   node tests/readback/sweep.mjs --routes /,/billing --selector shell="#shell-panel"
 *
 * Never stops a dev server it did not start itself, and never touches ports
 * 3000/3099/4310/6006 — those are other apps' (feedback_dont_kill_dev_server).
 */

import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const APP_DIR = fileURLToPath(new URL("../../", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_START_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 }
};

const DEFAULT_ROUTES = [
  "/",
  "/websites",
  "/services",
  "/domains",
  "/billing",
  "/support",
  "/account"
];

const COMPUTED_STYLE_PROPERTIES = [
  "display",
  "position",
  "top",
  "bottom",
  "left",
  "right",
  "grid-template-columns",
  "flex-direction",
  "column-count",
  "max-width",
  "padding-bottom",
  "width"
];

function parseArgs(argv) {
  const routes = [];
  const selectors = {};
  let out;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") {
      out = argv[++index];
    } else if (arg === "--routes") {
      routes.push(...argv[++index].split(","));
    } else if (arg === "--selector") {
      const [name, ...rest] = argv[++index].split("=");
      selectors[name] = rest.join("=");
    }
  }

  return {
    out: out ?? path.join(APP_DIR, "tests/readback/output", String(Date.now())),
    routes: routes.length > 0 ? routes : DEFAULT_ROUTES,
    selectors
  };
}

async function isUp(url) {
  return fetch(url)
    .then(response => response.ok || response.status < 500)
    .catch(() => false);
}

async function waitForServer(url) {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isUp(url)) return;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(
    `portal-nuxt did not come up on ${url} within ${SERVER_START_TIMEOUT_MS}ms`
  );
}

/** Starts the dev server only if nothing already answers on the port; never kills a server it did not start. */
async function ensureServer() {
  if (await isUp(BASE_URL)) return { startedHere: false, proc: null };

  const proc = spawn(
    "pnpm",
    ["--filter", "@upmind-automation/portal-nuxt", "dev"],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, PORT: String(PORT) },
      stdio: "ignore",
      detached: true
    }
  );
  await waitForServer(BASE_URL);
  return { startedHere: true, proc };
}

function stopServer(server) {
  if (!server.startedHere || server.proc === null) return;
  try {
    process.kill(-server.proc.pid, "SIGTERM");
  } catch {
    // already gone
  }
}

function slugFor(routePath) {
  if (routePath === "/") return "root";
  return routePath.replaceAll("/", "-").replace(/^-/, "");
}

async function observeSelector(page, selector) {
  return page.evaluate(sel => {
    const element = document.querySelector(sel);
    if (element === null) return null;

    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const computedStyle = {};
    for (const prop of window.__READBACK_STYLE_PROPS__) {
      computedStyle[prop] = style.getPropertyValue(prop);
    }

    return {
      computedStyle,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom
      }
    };
  }, selector);
}

async function sweep({ out, routes, selectors }) {
  await mkdir(out, { recursive: true });

  const server = await ensureServer();
  const browser = await chromium.launch();
  const observations = [];

  try {
    for (const routePath of routes) {
      for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
        const page = await browser.newPage({ viewport });
        await page.addInitScript(props => {
          window.__READBACK_STYLE_PROPS__ = props;
        }, COMPUTED_STYLE_PROPERTIES);

        // Warm the page inside the app's own origin FIRST, so the "before"
        // count is a real reading of the app rather than `about:blank`'s
        // constant 1 (see the corrected note in the header).
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        const historyLengthBefore = await page.evaluate(
          () => window.history.length
        );
        await page.goto(`${BASE_URL}${routePath}`, {
          waitUntil: "networkidle"
        });

        // `document.fonts.ready` only waits for faces already REQUESTED, so a
        // page whose webfont demand lands late resolves it while the text is
        // still in the fallback face — two trees then differ by which face was
        // rasterised, not by any chrome change. Demand every face the rendered
        // text actually resolves to, THEN settle.
        await page.evaluate(async () => {
          const faces = new Set();
          for (const element of document.querySelectorAll(
            "body,h1,h2,h3,h4,p,a,span,button,label,li,td,th,input"
          )) {
            const style = getComputedStyle(element);
            faces.add(
              `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
            );
          }
          await Promise.all(
            [...faces].map(face => document.fonts.load(face).catch(() => {}))
          );
          await document.fonts.ready;
        });

        const title = await page.title();
        const resolvedPath = await page.evaluate(
          () => window.location.pathname
        );
        const historyLengthAfter = await page.evaluate(
          () => window.history.length
        );
        const heading = await page.evaluate(() => {
          const inMain = document.querySelector("main h1");
          const anywhere = document.querySelector("h1");
          const element = inMain ?? anywhere;
          return element === null ? null : element.textContent.trim();
        });
        const landmarks = await page.evaluate(() =>
          [
            ...document.querySelectorAll(
              "header,nav,main,aside,footer,form,section,[role]"
            )
          ]
            .map(element => {
              const explicit = element.getAttribute("role");
              const implicit = {
                HEADER: "banner",
                NAV: "navigation",
                MAIN: "main",
                ASIDE: "complementary",
                FOOTER: "contentinfo"
              }[element.tagName];
              const role = explicit ?? implicit;
              if (role === undefined || role === null) return null;
              const label =
                element.getAttribute("aria-label") ??
                document
                  .getElementById(element.getAttribute("aria-labelledby") ?? "")
                  ?.textContent?.trim() ??
                null;
              return { role, label, tag: element.tagName.toLowerCase() };
            })
            .filter(entry => entry !== null)
        );

        const observedSelectors = {};
        for (const [name, selector] of Object.entries(selectors)) {
          observedSelectors[name] = await observeSelector(page, selector);
        }

        // Nuxt DevTools paints a floating badge with a live render-time
        // readout ("32 ms"), which differs between any two runs and lands in
        // a full-page capture. Hide it so the diff sees the app only.
        await page.addStyleTag({
          content:
            "#nuxt-devtools-anchor,#nuxt-devtools-container{display:none !important}"
        });

        const screenshotPath = path.join(
          out,
          `${slugFor(routePath)}--${viewportName}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });

        observations.push({
          route: routePath,
          viewport: viewportName,
          title,
          heading,
          landmarks,
          resolvedPath,
          historyLengthBefore,
          historyLengthAfter,
          selectors: observedSelectors,
          screenshot: screenshotPath
        });

        await page.close();
      }
    }
  } finally {
    await browser.close();
    stopServer(server);
  }

  const observationsPath = path.join(out, "observations.json");
  await writeFile(observationsPath, JSON.stringify(observations, null, 2));
  return { out, observationsPath, count: observations.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await sweep(args);
  console.log(`Filed ${result.count} observations to ${result.out}`);
  console.log(result.observationsPath);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
