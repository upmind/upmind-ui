#!/usr/bin/env node
/**
 * Chrome-geometry read-back (SDD tasks.md Task 2 Reality Check, AC3.2/AC3.3/
 * AC3.4): files the topbar's, the sidebar's and each topbar-slot marker's
 * `getBoundingClientRect()` plus the sidebar's computed width, for whatever
 * the config currently declares.
 *
 * Observes and records only. Attaches to whatever answers on :3100; never
 * starts or stops a server.
 *
 *   node tests/readback/chrome-rects.mjs --out <dir> --label topbar-full
 */

import { chromium } from "@playwright/test";
import { map } from "lodash-es";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const BASE_URL = "http://localhost:3100";

function parseArgs(argv) {
  let out = ".";
  let label = "run";
  let route = "/";
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") out = argv[++index];
    if (argv[index] === "--label") label = argv[++index];
    if (argv[index] === "--route") route = argv[++index];
  }
  return { out, label, route };
}

async function observe(page) {
  return page.evaluate(() => {
    const rectOf = selector => {
      const element = document.querySelector(selector);
      if (element === null) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
        computedWidth: style.width,
        computedDisplay: style.display
      };
    };

    // A seated module's marker: the fixture module's own data-slot, plus any
    // link a nav-tagged module renders inside the topbar. AC3.3's read-back
    // needs the latter now that `menu` is the only topbar-admissible module
    // (tasks.md 2.7) — the fixture module carries `content`, which no topbar
    // slot accepts.
    const markers = [
      ...document.querySelectorAll(
        '[data-slot="portal-fixture-marker"], [data-slot="shell-header"] nav a[href]'
      )
    ].map(element => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.textContent.trim(),
        x: rect.x,
        centreX: rect.x + rect.width / 2,
        width: rect.width,
        parentClass:
          element.parentElement === null
            ? null
            : element.parentElement.className
      };
    });

    return {
      viewportWidth: window.innerWidth,
      topbar: rectOf('[data-slot="shell-header"]'),
      sidebar: rectOf('[data-slot="shell-sidebar"]'),
      panel: rectOf('[data-slot="shell-panel"]'),
      main: rectOf('[data-slot="shell-main"]'),
      markerCount: markers.length,
      markers
    };
  });
}

async function main() {
  const { out, label, route } = parseArgs(process.argv.slice(2));
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  const consoleErrors = [];
  const pageErrors = [];
  const record = {};

  await Promise.all(
    map(
      Object.entries({
        desktop: { width: 1440, height: 900 },
        mobile: { width: 390, height: 844 }
      }),
      ([name, viewport]) =>
        browser.newPage({ viewport }).then(page => {
          page.on("console", message => {
            if (message.type() === "error") {
              consoleErrors.push({ viewport: name, text: message.text() });
            }
          });
          page.on("pageerror", error => {
            pageErrors.push({ viewport: name, text: String(error) });
          });
          return page
            .goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" })
            .then(() => observe(page))
            .then(observed => {
              record[name] = observed;
            })
            .then(() =>
              page.screenshot({ path: path.join(out, `${label}--${name}.png`) })
            )
            .then(() => page.close());
        })
    )
  ).finally(() => browser.close());

  const payload = { label, route, ...record, consoleErrors, pageErrors };
  const file = path.join(out, `${label}--chrome-rects.json`);
  await writeFile(file, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));
  console.log(file);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
