#!/usr/bin/env node
// @ts-check
/**
 * Allure flaky-history query (FE-2776, ADR 021 §Flakiness policy — AC2).
 *
 * Surfaces tests that flaked TWICE inside a rolling window (default 30 days) —
 * the trigger ADR 021 sets for quarantine. Emits a machine-readable artefact
 * (JSON) plus a human summary, for a CI job to attach and a human to action via
 * the /test-quarantine skill.
 *
 * Data sources (both read where present; results are unioned per test):
 *   1. Allure history JSONL — `.allure-history/history.jsonl`. One
 *      HistoryDataPoint per past report, each carrying per-test final `status`
 *      and the run `timestamp`. Confirmed schema: @allurereport/core-api
 *      `HistoryTestResult`.
 *   2. The current run's `allure-results/*-result.json` — these DO carry the
 *      Playwright retried-pass `flaky` boolean, which history does not persist.
 *
 * Flake-event definition (per test, per run) — the union of:
 *   (a) a run whose result is marked `flaky` (retried-pass), and
 *   (b) a status OSCILLATION vs the chronologically-previous run in the window
 *       (passed ↔ failed/broken) — Allure's own "classic flaky" signal
 *       (@allurereport/core utils/flaky.js `isAllureClassicFlaky`).
 *
 * KNOWN LIMITATION (documented, not hidden): Allure's history.jsonl stores only
 * the final `status` per run, NOT Playwright's retried-pass `flaky` flag (see
 * @allurereport/core history.js `createHistoryItems`). So a *pure* retried-pass
 * that never changed final status is only detected for the CURRENT run (source
 * 2), not retroactively across the window. Persisting the per-run flaky flag
 * into history is an Allure-infra change — explicitly OUT OF SCOPE for FE-2776.
 * The oscillation heuristic (b) covers the pass↔fail instability that history
 * DOES retain.
 *
 * Usage:
 *   node tests/quarantine/allure-flaky-report.mjs [--window <days>] \
 *        [--history <path>] [--results <path>] [--out <path>]
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { REPO_ROOT } from "./lib/quarantine.mjs";

/** @param {string} name @param {string} fallback */
function argOf(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const WINDOW_DAYS = Number(argOf("--window", "30"));
const HISTORY_PATH = resolve(
  REPO_ROOT,
  argOf(
    "--history",
    "tests/Playwright/e2e/reports/.allure-history/history.jsonl"
  )
);
const RESULTS_DIR = resolve(
  REPO_ROOT,
  argOf("--results", "tests/Playwright/e2e/reports/allure-results")
);
const OUT_PATH = resolve(
  REPO_ROOT,
  argOf("--out", "tests/Playwright/e2e/reports/quarantine-flaky-report.json")
);

const FLAKE_THRESHOLD = 2; // ADR 021: flake twice → quarantine
const BAD = new Set(["failed", "broken"]);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A per-test timeline entry.
 * @typedef {Object} Point
 * @property {number} timestamp
 * @property {string} status
 * @property {boolean} flaky
 */

/**
 * Read the JSONL history into chronological per-test timelines keyed by
 * historyId. Tolerant of a missing/empty file (returns {}).
 * @returns {Map<string, { name: string, fullName?: string, points: Point[] }>}
 */
function readHistory() {
  /** @type {Map<string, { name: string, fullName?: string, points: Point[] }>} */
  const byTest = new Map();
  if (!existsSync(HISTORY_PATH)) return byTest;
  const lines = readFileSync(HISTORY_PATH, "utf8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    /** @type {any} */
    let dp;
    try {
      dp = JSON.parse(line);
    } catch {
      continue;
    }
    const ts = Number(dp.timestamp) || 0;
    for (const [historyId, tr] of Object.entries(dp.testResults ?? {})) {
      const t = /** @type {any} */ (tr);
      const entry = byTest.get(historyId) ?? {
        name: t.name ?? historyId,
        fullName: t.fullName,
        points: /** @type {Point[]} */ ([])
      };
      entry.points.push({
        timestamp: t.stop ?? t.start ?? ts,
        status: t.status ?? "unknown",
        // history.jsonl does not persist `flaky`; default false. Present only
        // if a future infra change starts writing it — read defensively.
        flaky: Boolean(t.flaky)
      });
      byTest.set(historyId, entry);
    }
  }
  return byTest;
}

/**
 * Fold the current run's raw results (which DO carry `flaky`) into the
 * timelines, keyed by historyId. Best-effort — skips unreadable files.
 *
 * CRITICAL — one RUN, one point: Playwright writes ONE `*-result.json` per
 * ATTEMPT, so a retried test contributes several files for the same historyId,
 * all belonging to the SAME run (allure-results holds only the current run).
 * We must NOT push a point per attempt: doing so let a single retried-pass score
 * TWO flake events at once — a `flaky` mark AND a failed→passed oscillation —
 * tripping ADR 021's flake-TWICE threshold after ONE flaky run. Instead we
 * collapse a run's attempts (grouped by historyId) into a single timeline point
 * carrying the run's FINAL status, flagged `flaky` iff the run was a
 * retried-pass (a failed/broken attempt followed by a final pass) or a reporter
 * `flaky` flag was set. History points are already one-per-run, so after this
 * collapse every point in a timeline is exactly one run.
 * @param {Map<string, { name: string, fullName?: string, points: Point[] }>} byTest
 */
function foldCurrentResults(byTest) {
  if (!existsSync(RESULTS_DIR)) return;

  /**
   * @typedef {Object} Attempt
   * @property {number} timestamp
   * @property {string} status
   * @property {boolean} flaky
   */
  /** @type {Map<string, { name: string, fullName?: string, attempts: Attempt[] }>} */
  const currentByTest = new Map();

  for (const f of readdirSync(RESULTS_DIR)) {
    if (!f.endsWith("-result.json")) continue;
    /** @type {any} */
    let tr;
    try {
      tr = JSON.parse(readFileSync(join(RESULTS_DIR, f), "utf8"));
    } catch {
      continue;
    }
    const historyId = tr.historyId;
    if (!historyId) continue;
    const run = currentByTest.get(historyId) ?? {
      name: tr.name ?? historyId,
      fullName: tr.fullName,
      attempts: /** @type {Attempt[]} */ ([])
    };
    run.attempts.push({
      timestamp: tr.stop ?? tr.start ?? Date.now(),
      status: tr.status ?? "unknown",
      flaky: Boolean(tr.flaky)
    });
    if (!run.fullName && tr.fullName) run.fullName = tr.fullName;
    currentByTest.set(historyId, run);
  }

  for (const [historyId, run] of currentByTest) {
    // Order attempts chronologically; the run's FINAL status is the last one.
    const attempts = run.attempts.sort((a, b) => a.timestamp - b.timestamp);
    const last = attempts[attempts.length - 1];
    const hadBadAttempt = attempts.some(a => BAD.has(a.status));
    // Retried-pass = Playwright's "flaky": a failed/broken attempt earlier in
    // the run, but the run's final status is a pass. Also honour an explicit
    // per-result `flaky` flag if the reporter set one.
    const retriedPass =
      (last.status === "passed" && hadBadAttempt) ||
      attempts.some(a => a.flaky);
    const entry = byTest.get(historyId) ?? {
      name: run.name,
      fullName: run.fullName,
      points: /** @type {Point[]} */ ([])
    };
    entry.points.push({
      timestamp: last.timestamp,
      status: last.status,
      flaky: retriedPass
    });
    if (!entry.fullName && run.fullName) entry.fullName = run.fullName;
    byTest.set(historyId, entry);
  }
}

/**
 * Count flake events for one test's timeline inside the window.
 * @param {Point[]} points
 * @param {number} cutoff epoch-ms; points older than this are ignored
 * @returns {{ events: number, marks: number, oscillations: number }}
 */
function countFlakes(points, cutoff) {
  const windowed = points
    .filter(p => p.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
  let marks = 0;
  let oscillations = 0;
  let prev = null;
  for (const p of windowed) {
    if (p.flaky) marks++;
    if (prev) {
      const flip =
        (prev === "passed" && BAD.has(p.status)) ||
        (BAD.has(prev) && p.status === "passed");
      if (flip) oscillations++;
    }
    prev = p.status;
  }
  return { events: marks + oscillations, marks, oscillations };
}

function main() {
  const byTest = readHistory();
  foldCurrentResults(byTest);

  const cutoff = Date.now() - WINDOW_DAYS * MS_PER_DAY;
  const flaky = [];
  for (const [historyId, entry] of byTest) {
    const { events, marks, oscillations } = countFlakes(entry.points, cutoff);
    if (events >= FLAKE_THRESHOLD) {
      flaky.push({
        historyId,
        name: entry.name,
        fullName: entry.fullName,
        flakeEvents: events,
        retriedPassMarks: marks,
        statusOscillations: oscillations,
        runsInWindow: entry.points.filter(p => p.timestamp >= cutoff).length
      });
    }
  }
  flaky.sort((a, b) => b.flakeEvents - a.flakeEvents);

  const report = {
    generated: new Date().toISOString(),
    windowDays: WINDOW_DAYS,
    threshold: FLAKE_THRESHOLD,
    historyPresent: existsSync(HISTORY_PATH),
    resultsPresent: existsSync(RESULTS_DIR),
    testsTracked: byTest.size,
    flakyCandidates: flaky
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + "\n");

  if (!report.historyPresent && !report.resultsPresent) {
    console.log(
      "[flaky-report] no Allure history or results found — nothing to query. " +
        `(looked in ${HISTORY_PATH} and ${RESULTS_DIR})`
    );
    console.log(`[flaky-report] wrote empty report → ${OUT_PATH}`);
    process.exit(0);
  }

  if (flaky.length === 0) {
    console.log(
      `[flaky-report] OK: 0 tests flaked ≥${FLAKE_THRESHOLD}× in the last ` +
        `${WINDOW_DAYS} days (${byTest.size} tracked). Report → ${OUT_PATH}`
    );
    process.exit(0);
  }

  console.log(
    `[flaky-report] ${flaky.length} test(s) flaked ≥${FLAKE_THRESHOLD}× in the ` +
      `last ${WINDOW_DAYS} days — candidates for quarantine (ADR 021):\n`
  );
  for (const t of flaky) {
    console.log(
      `  • ${t.name}  (${t.flakeEvents} events: ${t.retriedPassMarks} retried-pass, ` +
        `${t.statusOscillations} oscillations, over ${t.runsInWindow} runs)`
    );
    if (t.fullName) console.log(`      ${t.fullName}`);
  }
  console.log(
    `\n[flaky-report] Report → ${OUT_PATH}. Quarantine via /test-quarantine.`
  );
  // Informational artefact: do NOT fail the build here (quarantine is a human
  // decision; enforcement of the 30-day deadline lives in quarantine-enforce).
  process.exit(0);
}

main();
