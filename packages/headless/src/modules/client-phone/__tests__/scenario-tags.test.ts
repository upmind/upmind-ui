// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — the module carries one scenario catalog (AC-44)
 *
 * ## Job To Be Done
 * Every member either composable's action layer RETURNS carries exactly one
 * `@scenario-include` or `@scenario-exclude <reason>` tag on its preceding
 * JSDoc comment — the flat catalog a scenario-driven consumer (the
 * playground, or any future step runner) reads to know which capability
 * names are drivable and which are deliberately internal, and why. A member
 * carrying NEITHER tag is graded here too — left ungraded, it is invisible
 * to the catalog while still being a live, returned capability.
 *
 * This reads the two action files' own SOURCE TEXT at run time — the same
 * technique `client-phone.traceability.test.ts` already uses on the feature
 * file — rather than asserting on any planning artefact. Detection is scoped
 * to each file's own trailing `return { ... }` block (brace-counted from the
 * last top-level `return {`), so a name-shaped line elsewhere in the factory
 * body is never mistaken for a returned member.
 *
 * ## What Breaks If This Fails
 * A returned capability with no tag is invisible to the catalog: silently
 * undrivable from the playground, and silently unaccounted for by anyone
 * auditing what this module's actions surface actually offers. Before this
 * file's own completeness check existed, an untagged member was simply
 * skipped rather than graded — a silent gap of exactly the FE-2824 shape.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

const ACTION_FILES = [
  "useClientPhones.actions.ts",
  "useClientPhoneManager.actions.ts"
];

type TaggedMember = {
  name: string;
  tag: "include" | "exclude" | "none";
  reason: string | undefined;
};

// Is this line part of a `//` line comment or a JSDoc `/** */` block?
function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*")
  );
}

/**
 * The lines of the file's own trailing `return { ... }` block — the LAST
 * top-level `return {` in the source, brace-counted to its matching close.
 * Scoping to this block (rather than the whole file) is what lets an
 * untagged-member check be added without false-positiving on unrelated
 * name-shaped lines in the factory body above the return.
 */
function returnBlockLines(source: string): string[] {
  const lines = source.split("\n");

  let start = -1;
  for (let index = lines.length - 1; index >= 0; index--) {
    if (/^\s*return\s*\{/.test(lines[index])) {
      start = index;
      break;
    }
  }
  if (start === -1) return [];

  let depth = 0;
  let end = start;
  for (let index = start; index < lines.length; index++) {
    for (const char of lines[index]) {
      if (char === "{") depth++;
      else if (char === "}") depth--;
    }
    end = index;
    if (depth <= 0 && index > start) break;
  }

  return lines.slice(start, end + 1);
}

/**
 * Every `<name>: ` / `<name>(` member inside the file's own trailing
 * `return { ... }` block, paired with the nearest `@scenario-include` /
 * `@scenario-exclude` tag found on the comment lines immediately above it
 * (skipping blank lines) — `tag: "none"` when neither is present.
 */
function taggedMembers(source: string): TaggedMember[] {
  const lines = returnBlockLines(source);
  const members: TaggedMember[] = [];

  for (let index = 0; index < lines.length; index++) {
    const nameMatch = lines[index].match(/^\s*([a-zA-Z_$][\w$]*)(?:[,:]| *\()/);
    if (!nameMatch) continue;
    if (/^\s*return\s*\{/.test(lines[index])) continue;

    // Walk upward through the WHOLE contiguous comment block immediately
    // above this member (skipping blank lines first) — a single `//` line
    // or a full multi-line `/** ... */` JSDoc block, either convention.
    let cursor = index - 1;
    while (cursor >= 0 && lines[cursor].trim() === "") cursor--;

    const commentLines: string[] = [];
    while (cursor >= 0 && isCommentLine(lines[cursor])) {
      commentLines.unshift(lines[cursor]);
      cursor--;
    }
    const commentBlock = commentLines.join("\n");

    const includeMatch = commentBlock.match(/@scenario-include\b([^\n]*)/);
    const excludeMatch = commentBlock.match(/@scenario-exclude\b([^\n]*)/);

    members.push({
      name: nameMatch[1],
      tag: excludeMatch ? "exclude" : includeMatch ? "include" : "none",
      reason: excludeMatch
        ? excludeMatch[1].replace(/\*\/\s*$/, "").trim()
        : undefined
    });
  }

  return members;
}

function readActionFile(file: string): string {
  return readFileSync(join(MODULE_DIR, file), "utf-8");
}

// -----------------------------------------------------------------------------

describe("client-phone — one scenario catalog across both action layers (AC-44)", () => {
  it("every @scenario-include action has a name — the catalog entry that covers it", () => {
    for (const file of ACTION_FILES) {
      const included = taggedMembers(readActionFile(file)).filter(
        member => member.tag === "include"
      );

      expect(included.length).toBeGreaterThan(0);
      for (const entry of included) {
        expect(entry.name.length).toBeGreaterThan(0);
      }

      // Unique WITHIN one composable's own action layer — the two
      // composables' action files are separate catalogs, and both being
      // "action-shaped" (isReady, destroy, refresh, ...) is expected, not a
      // collision.
      const names = included.map(entry => entry.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("every @scenario-exclude action carries a same-line reason", () => {
    const excluded = ACTION_FILES.flatMap(file =>
      taggedMembers(readActionFile(file))
    ).filter(member => member.tag === "exclude");

    const unreasoned = excluded.filter(entry => !entry.reason);
    expect(
      unreasoned.map(entry => entry.name),
      "Every @scenario-exclude needs a same-line reason"
    ).toEqual([]);
  });

  it("no returned action is left carrying neither tag — an untagged member is invisible to the catalog", () => {
    const ungraded = ACTION_FILES.flatMap(file =>
      taggedMembers(readActionFile(file)).map(member => ({ file, ...member }))
    ).filter(member => member.tag === "none");

    expect(
      ungraded.map(entry => `${entry.file}:${entry.name}`),
      "Every returned action needs @scenario-include or @scenario-exclude <reason>"
    ).toEqual([]);
  });
});
