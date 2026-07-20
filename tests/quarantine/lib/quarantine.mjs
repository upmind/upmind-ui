#!/usr/bin/env node
// @ts-check
/**
 * Shared library for the flake-quarantine tooling (FE-2776).
 *
 * Implements ADR 021's flakiness policy as mechanical enforcement:
 *   flake once → root-cause; flake twice → quarantine (skipped) with a linked
 *   Linear issue; quarantined > 30 days → deleted.
 * See docs/adr/021-testing-pyramid-and-agentic-workflow.md#flakiness-policy and
 * the test-quarantine skill for the human procedure this tooling backs.
 *
 * This module holds the pure parsing/classification logic shared by the four
 * entrypoints (lint / list / flaky-report / enforce). Kept dependency-free and
 * `// @ts-check`-clean to match the repo's other standalone scripts
 * (tests/fixtures/lint-fixtures.mjs, tests/allure/allure-index.mjs).
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Repo root: tests/quarantine/lib → ../../.. */
export const REPO_ROOT = join(__dirname, "..", "..", "..");

/**
 * The two surfaces ADR 021's policy governs. Kept in sync with the FE-2776
 * scope: the Playwright e2e suite and headless module tests. Visual-regression
 * lives under the Playwright tree so it is scanned too, but its FLAKE handling
 * is explicitly out of FE-2776 scope — only the bare-`.skip` tag convention
 * applies there.
 */
export const SCAN_ROOTS = [
  "tests/Playwright/e2e",
  "packages/headless/src/modules"
];

/** The non-negotiable forcing-function window from ADR 021. */
export const QUARANTINE_WINDOW_DAYS = 30;

export const BASELINE_PATH = join(
  REPO_ROOT,
  "tests",
  "quarantine",
  "quarantine-baseline.json"
);

// ---------------------------------------------------------------------------
// Tag grammar
// ---------------------------------------------------------------------------

/**
 * `@quarantine(<linear-id>, <delete-date>)` — the canonical tag.
 * Captures the id (group 1) and, when present, the delete-date (group 2).
 * The date is optional at the regex level so we can report a *malformed*
 * (dateless) tag distinctly from a *missing* one.
 */
export const TAG_RE =
  /@quarantine\(\s*([^,)\s]+)\s*(?:,\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[^)\s]+)\s*)?\)/;

/** A well-formed Linear issue id, e.g. `FE-2776`. */
export const LINEAR_ID_RE = /^[A-Z]{2,}-\d+$/;

/**
 * Parse a `@quarantine(...)` tag out of a single source line.
 * @param {string} line
 * @returns {{ id: string, date: string | null } | null}
 */
export function parseTag(line) {
  const m = line.match(TAG_RE);
  if (!m) return null;
  return { id: m[1], date: m[2] ?? null };
}

/**
 * @param {string | null | undefined} id
 * @returns {boolean} true when the id has the shape of a real Linear issue id
 *   (uppercase team prefix + numeric issue number, e.g. `FE-2776`).
 *
 * {@link LINEAR_ID_RE} already requires digits after the dash, so `FE-XXXX`-style
 * placeholders (whose number part is X's, or which carry a `-PAYPAL` suffix) fail
 * it. We must NOT additionally reject an id merely for *containing* an `X` — real
 * team prefixes do (`UX-123`, `EXP-45`, `MAX-9`) and are perfectly resolvable.
 */
export function isResolvableId(id) {
  return !!id && LINEAR_ID_RE.test(id);
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/**
 * Strict ISO calendar-date validation (`YYYY-MM-DD`, real day-of-month).
 * @param {string | null | undefined} s
 * @returns {boolean}
 */
export function isValidISODate(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole days from `a` to `b` (b − a), flooring both operands to UTC calendar
 * days. Delete-dates are constructed as UTC midnight (`…T00:00:00Z`), so we read
 * UTC components on both sides — otherwise a non-UTC CI runner would floor `now`
 * to a *local* day while `del` is already a UTC day, drifting the elapsed/remaining
 * counts and the expiry boundary by ±1.
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
export function daysBetween(a, b) {
  const ua = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const ub = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((ub - ua) / MS_PER_DAY);
}

/**
 * Age accounting for a quarantine, derived from its delete-date. The policy
 * pins delete-date = quarantine-date + {@link QUARANTINE_WINDOW_DAYS}, so the
 * start is recoverable without a second stored field.
 *
 * `expired` fires ON the delete-date (daysRemaining === 0), not the day after:
 * ADR 021 §Flakiness policy and the reminder copy both say a quarantine must be
 * resolved *by* its delete-date, so day-30 itself is the deadline, not a grace
 * day. `daysRemaining <= 0` is therefore the boundary; a `< 0` test would have
 * granted one silent extra day of skip.
 * @param {string} deleteDate ISO `YYYY-MM-DD`
 * @param {Date} [now]
 * @returns {{ daysRemaining: number, daysElapsed: number, expired: boolean }}
 */
export function ageOf(deleteDate, now = new Date()) {
  const del = new Date(`${deleteDate}T00:00:00Z`);
  const daysRemaining = daysBetween(now, del);
  const daysElapsed = QUARANTINE_WINDOW_DAYS - daysRemaining;
  return { daysRemaining, daysElapsed, expired: daysRemaining <= 0 };
}

// ---------------------------------------------------------------------------
// Source scanning
// ---------------------------------------------------------------------------

/**
 * Recursively collect `.ts` test-ish files under a root, skipping node_modules,
 * dist and type-declaration files.
 * @param {string} absRoot
 * @returns {string[]}
 */
export function walkTsFiles(absRoot) {
  /** @type {string[]} */
  const out = [];
  if (!existsSync(absRoot)) return out;
  /** @param {string} dir */
  const walk = dir => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === "dist") continue;
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
        out.push(full);
      }
    }
  };
  walk(absRoot);
  return out;
}

/** @returns {string[]} every scannable file across {@link SCAN_ROOTS}. */
export function allScannedFiles() {
  return SCAN_ROOTS.flatMap(r => walkTsFiles(join(REPO_ROOT, r)));
}

const STRING_START = new Set(['"', "'", "`"]);

/**
 * Produce a copy of `content` with the same length and line structure, but with
 * the INTERIORS of line/block comments and string/template literals blanked to
 * spaces (newlines are preserved, so 1-indexed line numbers computed off the
 * mask still match the original). Comment delimiters are blanked too, so nothing
 * inside `//` or a block comment can be read as code. String/template
 * *delimiters* are KEPT, so a genuine `.skip("title")` is still recognisable as
 * a static skip when scanning the mask — the title itself is then read back from
 * the ORIGINAL `content`, which the mask left untouched outside the interior.
 *
 * This is the root fix for `.skip(` living inside a comment or a string literal
 * being counted as a quarantine: on the mask those characters are spaces, so the
 * matcher never sees them.
 *
 * Tokenizer-lite by design (ADR 021: no full parser). It does NOT model regex
 * literals — a `.skip(` embedded in a regex literal is not specially handled —
 * because none exist in the governed suites and the prior implementation modelled
 * nothing at all. Worst case is unchanged from before this fix, never worse.
 * @param {string} content
 * @returns {string}
 */
function maskCommentsAndStrings(content) {
  const out = content.split("");
  const n = content.length;
  /** @param {number} i */
  const blank = i => {
    if (i < n && content[i] !== "\n") out[i] = " ";
  };
  let i = 0;
  while (i < n) {
    const c = content[i];
    const next = content[i + 1];
    // Line comment: blank the `//` and everything to end-of-line.
    if (c === "/" && next === "/") {
      blank(i);
      blank(i + 1);
      i += 2;
      while (i < n && content[i] !== "\n") blank(i++);
      continue;
    }
    // Block comment: blank `/* ... */` inclusive (may span lines).
    if (c === "/" && next === "*") {
      blank(i);
      blank(i + 1);
      i += 2;
      while (i < n && !(content[i] === "*" && content[i + 1] === "/")) blank(i++);
      if (i < n) {
        blank(i);
        blank(i + 1);
        i += 2;
      }
      continue;
    }
    // String / template literal: keep the delimiters, blank the interior so an
    // in-string `.skip(` is invisible while `.skip("real")` stays detectable.
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i++; // keep opening delimiter
      while (i < n) {
        if (content[i] === "\\") {
          blank(i);
          blank(i + 1);
          i += 2;
          continue;
        }
        if (content[i] === quote) {
          i++; // keep closing delimiter
          break;
        }
        blank(i++);
      }
      continue;
    }
    i++;
  }
  return out.join("");
}

/**
 * Find every STATIC `.skip(...)` declaration in a file — i.e. `.skip(` whose
 * first argument is a string/template literal (a named, permanently-skipped
 * test or describe block). This is the form ADR 021 governs.
 *
 * Deliberately does NOT match runtime/conditional skips
 * (`test.skip(!flag, "reason")`, `test.skip()`), nor `.skip` used as a value
 * (`cond ? test.skip : test`) — those are legitimate environment/feature gates,
 * not quarantines, per the test-quarantine skill's "When NOT to Use". It also
 * ignores any `.skip(` that lives inside a comment or a string literal: the scan
 * runs over a comment/string-masked copy of the source (see
 * {@link maskCommentsAndStrings}), so a documented or stringified `.skip(` is not
 * mistaken for a real quarantine. Titles are still read from the ORIGINAL source.
 *
 * @param {string} content
 * @returns {{ line: number, title: string }[]} 1-indexed line numbers
 */
export function findStaticSkips(content) {
  /** @type {{ line: number, title: string }[]} */
  const found = [];
  const masked = maskCommentsAndStrings(content);
  const re = /\.skip\s*\(/g;
  let m;
  while ((m = re.exec(masked)) !== null) {
    // Look at the first non-whitespace character after the opening paren. On the
    // mask, a real string argument survives as its bare delimiter (`"`/`'`/`` ` ``);
    // a `.skip(` inside a comment/string was blanked and never matched at all.
    let i = m.index + m[0].length;
    while (i < masked.length && /\s/.test(masked[i])) i++;
    const ch = masked[i];
    if (!STRING_START.has(ch)) continue; // conditional / arg-less skip → exempt
    const quote = ch;
    // Extract the literal title from the ORIGINAL content (the mask blanked the
    // interior). Best-effort; templates keep their raw text.
    let title = "";
    for (let j = i + 1; j < content.length && j < i + 300; j++) {
      const c = content[j];
      if (c === "\\") {
        title += content[j + 1] ?? "";
        j++;
        continue;
      }
      if (c === quote) break;
      title += c;
    }
    const line = masked.slice(0, m.index).split("\n").length;
    found.push({ line, title: title.trim() });
  }
  return found;
}

/**
 * Scan upward from a `.skip` line for the nearest `@quarantine(...)` tag,
 * walking through the contiguous run of comment/blank/decorator lines that
 * belongs to the skipped test. Stops at the first line of real code, so the tag
 * is found however long the explanatory comment block between it and the `.skip`
 * is. `maxLookback` is only a defensive ceiling against a pathological
 * all-comment file; the real terminator is the first non-context line.
 * @param {string[]} lines file split on "\n"
 * @param {number} skipLine 1-indexed line of the `.skip(`
 * @param {number} [maxLookback]
 * @returns {{ id: string, date: string | null, tagLine: number } | null}
 */
export function findTagAbove(lines, skipLine, maxLookback = Infinity) {
  for (let n = 1; n <= maxLookback; n++) {
    const idx = skipLine - 1 - n; // 0-indexed line above
    if (idx < 0) break;
    const raw = lines[idx];
    const trimmed = raw.trim();
    const tag = parseTag(raw);
    if (tag) return { ...tag, tagLine: idx + 1 };
    // Keep climbing through comment / blank / decorator context only.
    const isContext =
      trimmed === "" ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("@");
    if (!isContext) break;
  }
  return null;
}

/**
 * @typedef {Object} QuarantineRecord
 * @property {string} file        repo-relative path
 * @property {number} line        1-indexed line of the `.skip(`
 * @property {string} title       the skipped test/describe title
 * @property {string | null} id   linked Linear id (null if untagged)
 * @property {string | null} date delete-date (null if missing)
 * @property {number | null} tagLine
 * @property {string} key         stable identity: `<relpath>::<id|title>`
 */

/**
 * Scan every governed file and return one record per STATIC skip, joined to its
 * `@quarantine` tag when present. This is the single source of truth the lint,
 * list and enforce entrypoints all build on.
 * @returns {QuarantineRecord[]}
 */
export function collectStaticSkips() {
  /** @type {QuarantineRecord[]} */
  const records = [];
  for (const abs of allScannedFiles()) {
    const content = readFileSync(abs, "utf8");
    if (!content.includes(".skip")) continue;
    const lines = content.split("\n");
    const rel = relative(REPO_ROOT, abs);
    for (const { line, title } of findStaticSkips(content)) {
      const tag = findTagAbove(lines, line);
      const id = tag?.id ?? null;
      records.push({
        file: rel,
        line,
        title,
        id,
        date: tag?.date ?? null,
        tagLine: tag?.tagLine ?? null,
        key: `${rel}::${id ?? title}`
      });
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

/**
 * Load the grandfathered-skip baseline (the pre-existing `.skip` debt that
 * FE-2776 explicitly defers to a separate audit pass). Mirrors the repo's
 * `eslint-suppressions.json` idiom: new violations must comply; the baseline is
 * the burn-down list, not a licence to skip.
 * @returns {Set<string>}
 */
export function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return new Set();
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
    /** @type {{ key: string }[]} */
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
    return new Set(entries.map(e => e.key));
  } catch {
    return new Set();
  }
}
