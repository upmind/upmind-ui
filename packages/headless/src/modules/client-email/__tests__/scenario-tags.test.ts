// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email scenario tags — @scenario-* on the actions (Task 34)
 *
 * ## Job To Be Done
 * Every input-taking collection action (Task 33's map: `ensure`, `remove`,
 * `setDefault`, `verify`) carries a `@scenario-include` / `@scenario-exclude`
 * doc-tag the coverage gate parses, and every `@scenario-exclude` carries a
 * same-line reason — an untagged input-taking action is gate cause
 * `untagged-input-taking`, a bare exclude is `missing-reason`.
 *
 * The tag grammar mirrors the harness's `parsePlaygroundTags` (`tags.ts`
 * `TAG_LINE` first-token-of-a-doc-line + `resolveMemberName` the member the
 * block sits above); it is reimplemented here rather than imported because
 * `packages/headless` has no `@upmind-automation/scenario-harness` dependency
 * (design §10). Read from source at runtime, exactly as the co-located
 * traceability test reads its feature and sibling specs.
 *
 * ## What Breaks If These Fail
 * An input-taking action with no scenario reads as covered without a proving
 * scenario — the gate goes green over an unproven capability.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const ACTIONS_SOURCE = join(
  import.meta.dirname,
  "../useClientEmails.actions.ts"
);

const INPUT_TAKING = ["ensure", "remove", "setDefault", "verify"] as const;

const ACTION_IDS =
  "destroy|ensure|filterBy|invalidate|isReady|nextPage|prevPage|refresh|remove|setDefault|sortBy|verify";

// First token of its own doc-comment line — the harness's TAG_LINE shape.
const TAG_LINE = /^\s*\*\s*(@scenario-(?:include|exclude))\b[ \t]*(.*)$/;

/** The member a doc-block tag governs — the first action id below the block. */
function memberBelow(lines: string[], tagIndex: number): string | undefined {
  let cursor = tagIndex;
  while (cursor < lines.length && !lines[cursor].includes("*/")) cursor++;
  for (
    let ahead = cursor + 1;
    ahead < Math.min(cursor + 6, lines.length);
    ahead++
  ) {
    const match = lines[ahead].match(new RegExp(`\\b(${ACTION_IDS})\\b`));
    if (match) return match[1];
  }
  return undefined;
}

/** member id → { kind, reason } parsed from the real actions source. */
function scenarioTags(): Map<string, { kind: string; reason: string }> {
  const lines = readFileSync(ACTIONS_SOURCE, "utf-8").split("\n");
  const tags = new Map<string, { kind: string; reason: string }>();

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(TAG_LINE);
    if (!match) continue;
    const member = memberBelow(lines, index);
    if (member) tags.set(member, { kind: match[1], reason: match[2].trim() });
  }

  return tags;
}

// -----------------------------------------------------------------------------

describe("client-email scenario tags — @scenario-* on the actions (Task 34)", () => {
  it("tags every input-taking action with @scenario-include or @scenario-exclude", async () => {
    const tags = scenarioTags();

    const untagged = INPUT_TAKING.filter(action => !tags.has(action));
    expect(
      untagged,
      `untagged input-taking action(s): ${untagged.join(", ")}`
    ).toEqual([]);
  });

  it("carries a same-line reason on every @scenario-exclude", async () => {
    const tags = scenarioTags();

    const bareExcludes = [...tags.entries()]
      .filter(
        ([, tag]) => tag.kind === "@scenario-exclude" && tag.reason === ""
      )
      .map(([member]) => member);
    expect(
      bareExcludes,
      `@scenario-exclude with no reason: ${bareExcludes.join(", ")}`
    ).toEqual([]);
  });

  it("associates no tag with a non-action member", async () => {
    const validIds = new Set(ACTION_IDS.split("|"));
    const orphan = [...scenarioTags().keys()].filter(
      member => !validIds.has(member)
    );
    expect(orphan, `tag on a non-action member: ${orphan.join(", ")}`).toEqual(
      []
    );
  });
});
