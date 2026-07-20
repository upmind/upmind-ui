#!/usr/bin/env node
// @ts-check
/**
 * Quarantine lint (FE-2776, ADR 021 §Flakiness policy — AC1).
 *
 * Fails the build when a STATIC `.skip("title", …)` test/describe in the
 * governed suites carries no well-formed `@quarantine(<linear-id>, <delete-date>)`
 * tag. Conditional/environment skips (`test.skip(!flag, …)`) are exempt by
 * design — they are feature gates, not quarantines.
 *
 *   HARD FAIL  a static skip with no tag, or a tag missing its id or date
 *              (i.e. it "lacks the tag" the convention requires).
 *   BEST-EFFORT date-format and issue-id validity are reported as warnings, per
 *              the AC ("date format + issue-ID resolution validated best-effort").
 *              `--strict` promotes those warnings to failures.
 *
 * Pre-existing debt is grandfathered via quarantine-baseline.json (the separate
 * audit pass FE-2776 defers). Regenerate it with `--update-baseline`.
 *
 * Usage:
 *   node tests/quarantine/lint-quarantine.mjs [--strict] [--update-baseline]
 */

import { writeFileSync } from "node:fs";
import {
  collectStaticSkips,
  loadBaseline,
  isValidISODate,
  isResolvableId,
  BASELINE_PATH
} from "./lib/quarantine.mjs";

const args = new Set(process.argv.slice(2));
const STRICT = args.has("--strict");
const UPDATE_BASELINE = args.has("--update-baseline");

/** @param {import("./lib/quarantine.mjs").QuarantineRecord} r */
function classify(r) {
  if (!r.id) return { level: "fail", reason: "no @quarantine tag on .skip" };
  if (!r.date)
    return {
      level: "fail",
      reason: `tag @quarantine(${r.id}) is missing its delete-date`
    };
  const warnings = [];
  if (!isValidISODate(r.date))
    warnings.push(`delete-date "${r.date}" is not a valid ISO YYYY-MM-DD`);
  if (!isResolvableId(r.id))
    warnings.push(`issue id "${r.id}" is not a resolvable Linear id (FE-1234)`);
  if (warnings.length)
    return { level: STRICT ? "fail" : "warn", reason: warnings.join("; ") };
  return { level: "ok", reason: "" };
}

function main() {
  const records = collectStaticSkips();

  if (UPDATE_BASELINE) {
    const entries = records
      .filter(r => classify(r).level === "fail")
      .map(r => ({
        key: r.key,
        file: r.file,
        title: r.title,
        id: r.id,
        reason: classify(r).reason
      }));
    const payload = {
      $comment:
        "Grandfathered pre-existing quarantine/.skip debt (FE-2776). Each entry " +
        "is a static .skip that predates mechanical enforcement and is deferred " +
        "to the separate audit pass. Do NOT add new entries by hand — new skips " +
        "must carry a valid @quarantine(<id>, <date>) tag. Regenerate with " +
        "`pnpm lint:quarantine --update-baseline` only when burning debt down.",
      generated: new Date().toISOString().slice(0, 10),
      entries
    };
    writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + "\n");
    console.log(
      `[quarantine-lint] wrote baseline: ${entries.length} grandfathered skip(s).`
    );
    process.exit(0);
  }

  const baseline = loadBaseline();
  const failures = [];
  const warnings = [];

  for (const r of records) {
    const { level, reason } = classify(r);
    if (level === "ok") continue;
    const grandfathered = baseline.has(r.key);
    const msg = `${r.file}:${r.line}  "${r.title}" — ${reason}`;
    if (level === "fail") {
      if (grandfathered) {
        warnings.push(`${msg}  [baselined — burn down in the audit pass]`);
      } else {
        failures.push(msg);
      }
    } else {
      warnings.push(msg);
    }
  }

  if (warnings.length) {
    console.warn("[quarantine-lint] warnings (best-effort checks):");
    for (const w of warnings) console.warn(`  ⚠ ${w}`);
  }

  if (failures.length) {
    console.error(
      "\n[quarantine-lint] FAIL: static .skip without a valid " +
        "@quarantine(<linear-id>, <delete-date>) tag:"
    );
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(
      "\nQuarantine the test via the /test-quarantine skill (file a Linear " +
        "issue, then tag the .skip), or remove the .skip. See " +
        "tests/quarantine/docs/14-quarantine-tooling.md."
    );
    process.exit(1);
  }

  const governed = records.length;
  console.log(
    `[quarantine-lint] OK: ${governed} static skip(s) scanned, ` +
      `${baseline.size} grandfathered, 0 new violations.`
  );
  process.exit(0);
}

main();
