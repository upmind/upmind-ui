#!/usr/bin/env node
// @ts-check
/**
 * List quarantined tests by age (FE-2776, ADR 021 — AC3).
 *
 * Backs `pnpm test:quarantined --age`: every `@quarantine`-tagged static skip in
 * the governed suites, with its linked issue, delete-date, days elapsed and days
 * remaining. `--age` sorts oldest-first (least time remaining first) so the
 * about-to-expire ones surface at the top.
 *
 * Usage:
 *   node tests/quarantine/list-quarantined.mjs [--age] [--json]
 */

import {
  collectStaticSkips,
  loadBaseline,
  ageOf,
  isValidISODate
} from "./lib/quarantine.mjs";

const args = new Set(process.argv.slice(2));
const SORT_BY_AGE = args.has("--age");
const AS_JSON = args.has("--json");

function main() {
  const baseline = loadBaseline();
  const now = new Date();

  const rows = collectStaticSkips()
    .filter(r => r.id) // only tagged skips are "quarantined"
    .map(r => {
      const age = r.date && isValidISODate(r.date) ? ageOf(r.date, now) : null;
      return {
        file: r.file,
        line: r.line,
        title: r.title,
        issue: r.id,
        deleteDate: r.date,
        daysElapsed: age?.daysElapsed ?? null,
        daysRemaining: age?.daysRemaining ?? null,
        expired: age?.expired ?? false,
        grandfathered: baseline.has(r.key)
      };
    });

  if (SORT_BY_AGE) {
    // Least time remaining first; unknown dates sink to the bottom.
    rows.sort((a, b) => {
      const ar = a.daysRemaining ?? Number.POSITIVE_INFINITY;
      const br = b.daysRemaining ?? Number.POSITIVE_INFINITY;
      return ar - br;
    });
  }

  if (AS_JSON) {
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  }

  if (rows.length === 0) {
    console.log("No quarantined tests. 🎉");
    process.exit(0);
  }

  console.log(`Quarantined tests (${rows.length}):\n`);
  for (const r of rows) {
    const remaining =
      r.daysRemaining === null
        ? "date?"
        : r.expired
          ? `EXPIRED (${-r.daysRemaining}d over)`
          : `${r.daysRemaining}d left`;
    const elapsed = r.daysElapsed === null ? "?" : `${r.daysElapsed}d in`;
    const flags = [
      r.expired
        ? "⛔"
        : r.daysRemaining !== null && r.daysRemaining <= 5
          ? "⏰"
          : "",
      r.grandfathered ? "[baselined]" : ""
    ]
      .filter(Boolean)
      .join(" ");
    console.log(
      `  ${r.issue}  ${elapsed} / ${remaining}  ${flags}\n` +
        `    ${r.file}:${r.line}  "${r.title}"  (delete by ${r.deleteDate ?? "?"})`
    );
  }
  process.exit(0);
}

main();
