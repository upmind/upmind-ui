#!/usr/bin/env node
/**
 * Single-mount read-back (SDD tasks.md Task 2 Reality Check): counts the
 * nodes matching the menu's marker at 1440px, and at 390px with the drawer
 * OPEN. `ShellSidebar` renders the desktop rail and the mobile Sheet as
 * `v-if`/`v-else` over the same slot, so a second copy for the drawer would
 * show up here as a doubled count.
 *
 * Observes and records only — asserts nothing, like sweep.mjs beside it.
 * Attaches to whatever answers on :3100; never starts or stops a server.
 *
 *   node tests/readback/nav-count.mjs --out <dir> --label after
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const BASE_URL = "http://localhost:3100";

const MARKERS = {
  /** The menu itself — the sidebar's nav landmark. One mount, never two. */
  menu: 'nav[aria-label="Portal"]',
  /** Its rows — the links the menu is made of. */
  menuItems: 'nav[aria-label="Portal"] a[href]',
  /** Any resolved module the config seated in a slot. */
  moduleMarkers: '[data-slot="portal-fixture-marker"]',
  sidebarRail: '[data-slot="shell-sidebar"]',
  sheetNav: '[role="dialog"] nav'
};

function parseArgs(argv) {
  let out = ".";
  let label = "run";
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") out = argv[++index];
    if (argv[index] === "--label") label = argv[++index];
  }
  return { out, label };
}

async function countAll(page) {
  return page.evaluate(markers => {
    const counts = {};
    for (const [name, selector] of Object.entries(markers)) {
      counts[name] = document.querySelectorAll(selector).length;
    }
    counts.menuItemText = [...document.querySelectorAll(markers.menuItems)].map(
      element => element.textContent.trim()
    );
    return counts;
  }, MARKERS);
}

async function main() {
  const { out, label } = parseArgs(process.argv.slice(2));
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  const observations = [];

  try {
    // 1440px — the desktop rail.
    const desktop = await browser.newPage({
      viewport: { width: 1440, height: 900 }
    });
    await desktop.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    observations.push({
      viewport: "1440x900",
      drawer: "n/a",
      counts: await countAll(desktop)
    });
    await desktop.screenshot({
      path: path.join(out, `${label}--menu-1440.png`)
    });
    await desktop.close();

    // 390px — open the drawer, then count.
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 }
    });
    await mobile.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const closed = await countAll(mobile);
    const trigger = mobile.locator('[data-slot="shell-sidebar-trigger"]');
    const triggerCount = await trigger.count();
    let opened = null;
    if (triggerCount > 0) {
      await trigger.first().click();
      await mobile.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await mobile.waitForTimeout(400);
      opened = await countAll(mobile);
      await mobile.screenshot({
        path: path.join(out, `${label}--menu-390-drawer-open.png`)
      });
    }
    observations.push({
      viewport: "390x844",
      drawer: "closed",
      counts: closed,
      triggerCount
    });
    observations.push({ viewport: "390x844", drawer: "open", counts: opened });
    await mobile.close();
  } finally {
    await browser.close();
  }

  const file = path.join(out, `${label}--nav-count.json`);
  await writeFile(
    file,
    JSON.stringify({ markers: MARKERS, observations }, null, 2)
  );
  console.log(JSON.stringify(observations, null, 2));
  console.log(file);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
