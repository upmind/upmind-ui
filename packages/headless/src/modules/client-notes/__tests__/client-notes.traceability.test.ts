// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notes traceability — every scenario has a proving test
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `client-notes.feature`'s `@AC-*` scenario tags and
 * every sibling spec's `AC-<n>` title mentions, then enforce the link BOTH
 * ways: a non-exempt scenario with no proving test fails, and a test naming
 * an AC the feature does not tag fails. The feature gains a scenario before a
 * test is ever dropped — coverage never falls.
 *
 * Two tags EXEMPT a scenario from the "needs a proving test" rule without
 * removing it from the count: `@todo` (not yet built) and
 * `@blocked-on-platform` (built, proven, and its proving test currently
 * `.skip`-ped over a confirmed platform defect outside this module — see the
 * colocated `.skip` comments naming the root cause). Both are still CARRIED
 * in every tag set below and still appear in the coverage map, with
 * `exempt`/`exemptReason` set — a blocked scenario that silently vanished
 * from the report would be exactly the silent capability drop this whole
 * suite exists to prevent (repair cycle 3, operator ruling 2026-08-28).
 *
 * Per ADR-020 the `.feature` is spec-only and non-executable — nothing runs
 * it, and there is no steps file. This test is the whole of its enforcement.
 *
 * This conductor dispatches unit + integration ONLY (review-notes.md's
 * binding ruling) — every one of this module's 33 scenarios is proven at
 * one of those two altitudes; there is no e2e consumer-proof table here.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import clientNotesSteps, { coveredActionIds } from "./client-notes.steps";
import { includes, map, reject } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-notes.feature");
const CATALOG_FILE = join(TEST_DIR, "client-notes.steps.ts");

type ExemptReason = "todo" | "blocked-on-platform";

/**
 * Every `@AC-*` tag in the feature, each carrying whether it is EXEMPT from
 * the "needs a proving test" rule (`@todo` or `@blocked-on-platform`) and
 * why. Exempt scenarios are still returned here — never dropped — so a
 * caller that wants the enforced-only set filters explicitly rather than
 * this function silently deciding it for them.
 */
function scenarioTags(path: string): Map<string, ExemptReason | undefined> {
  const lines = readFileSync(path, "utf-8").split("\n");
  const tagged = new Map<string, ExemptReason | undefined>();

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/@AC-(\d+)/);
    if (!match) continue;

    let cursor = index;
    let reason: ExemptReason | undefined;
    while (cursor < lines.length && !/^\s*Scenario/.test(lines[cursor])) {
      if (/@blocked-on-platform/.test(lines[cursor]))
        reason = "blocked-on-platform";
      else if (/@todo/.test(lines[cursor]) && !reason) reason = "todo";
      cursor++;
    }
    tagged.set(`AC-${match[1]}`, reason);
  }

  return tagged;
}

/** Every `@AC-*` tag, exempt or not. */
function featureAcTags(path: string): Set<string> {
  return new Set(scenarioTags(path).keys());
}

/** Only the tags EXEMPT from the "needs a proving test" rule, with their reason. */
function exemptAcTags(path: string): Map<string, ExemptReason> {
  const exempt = new Map<string, ExemptReason>();
  for (const [ac, reason] of scenarioTags(path)) {
    if (reason) exempt.set(ac, reason);
  }
  return exempt;
}

/**
 * AC ids named by a sibling spec's `describe`/`it` titles -> the files naming
 * them. Matches `it.skip(`/`it.todo(` too — a `@blocked-on-platform` (or
 * `@todo`) scenario's proving test is landed, not absent; only its RUN is
 * deferred, and the coverage map must still find it.
 */
function provingTests(): Map<string, string[]> {
  const files = readdirSync(TEST_DIR).filter(
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== "client-notes.traceability.test.ts"
  );

  const mentions = new Map<string, string[]>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    for (const title of content.matchAll(
      /(?:describe|it)(?:\.skip|\.todo)?\(\s*["'`]([^"'`]*)["'`]/g
    )) {
      for (const ac of title[1].matchAll(/AC-(\d+)/g)) {
        const key = `AC-${ac[1]}`;
        const seen = mentions.get(key) ?? [];
        if (!seen.includes(file)) seen.push(file);
        mentions.set(key, seen);
      }
    }
  }
  return mentions;
}

// -----------------------------------------------------------------------------

describe("client-notes traceability — co-located feature vs proving tests", () => {
  it("the co-located feature is present and tags at least one scenario", () => {
    expect(readFileSync(COLOCATED_FEATURE, "utf-8").length).toBeGreaterThan(0);
    expect(featureAcTags(COLOCATED_FEATURE).size).toBeGreaterThan(0);
  });

  it("every non-exempt scenario has at least one proving test", () => {
    const proven = provingTests();
    const exempt = exemptAcTags(COLOCATED_FEATURE);
    const unproven = [...featureAcTags(COLOCATED_FEATURE)].filter(
      ac => !exempt.has(ac) && !proven.has(ac)
    );

    expect(
      unproven,
      `Unproven scenarios (no test names this AC): ${unproven.join(", ")}`
    ).toEqual([]);
  });

  it("@blocked-on-platform scenarios are exempt but still counted and reported, never silently absent", () => {
    const exempt = exemptAcTags(COLOCATED_FEATURE);
    const blocked = [...exempt].filter(
      ([, reason]) => reason === "blocked-on-platform"
    );

    expect(blocked.map(([ac]) => ac).sort()).toEqual(["AC-29"]);
    // Still present in the full tag set — the exemption removes the
    // "needs a proving test" obligation, not the scenario itself.
    for (const [ac] of blocked) {
      expect(featureAcTags(COLOCATED_FEATURE).has(ac)).toBe(true);
    }
  });

  it("every AC a test names is a scenario the feature actually tags", () => {
    const tagged = featureAcTags(COLOCATED_FEATURE);
    const named = [...provingTests().keys()];
    const orphaned = named.filter(ac => !tagged.has(ac));

    expect(
      orphaned,
      "Test(s) name an AC the feature does not tag (the feature gains the " +
        `scenario — coverage never falls): ${orphaned.join(", ")}`
    ).toEqual([]);
  });

  it("the coverage map names a proving file for every tagged scenario, exempt ones included and marked", () => {
    const tests = provingTests();
    const exempt = exemptAcTags(COLOCATED_FEATURE);
    const map = [...featureAcTags(COLOCATED_FEATURE)]
      .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
      .map(ac => ({
        ac,
        files: tests.get(ac) ?? [],
        exempt: exempt.has(ac),
        exemptReason: exempt.get(ac)
      }));

    expect(map.length).toBeGreaterThan(0);
    // Only a non-exempt scenario with zero proving files is a gap; an exempt
    // one is reported via its `exempt`/`exemptReason` fields, not hidden.
    expect(
      map.filter(entry => !entry.exempt && entry.files.length === 0)
    ).toEqual([]);
    expect(
      map
        .filter(entry => entry.exemptReason === "blocked-on-platform")
        .map(entry => entry.ac)
        .sort()
    ).toEqual(["AC-29"]);
  });
});

// -----------------------------------------------------------------------------
/**
 * The SECOND job this file carries (client-email precedent, the built pair):
 * the spec-to-catalog drift gate for `client-notes.steps.ts` — the page-level
 * step catalog the `useClientNotes` playground scenario plays. An orphan step
 * definition FAILS (dead code, or a scenario renamed underneath it); a
 * scenario whose steps match only in PART FAILS (the dangerous case — it
 * reads as driveable and silently is not); a malformed step pattern FAILS; a
 * pattern another module's catalog already claims FAILS; an action id the
 * catalog declares covered that no step fires FAILS. A scenario nothing
 * matches PASSES — a capability written down and not yet driven, which is a
 * legitimate state (every editor-side scenario, @AC-18..@AC-26, is exactly
 * that: `add`/`edit` are handoff keys, not live composable members, so no
 * step presses them — see client-notes.steps.ts's own docblock).
 */

const catalogSource = readFileSync(CATALOG_FILE, "utf-8");

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(
  readFileSync(COLOCATED_FEATURE, "utf-8"),
  clientNotesSteps,
  stepCatalogs
);

describe("client-notes — the page's step catalog drives what it claims to", () => {
  it(`drives ${driveable.length} of ${scenarios.length} scenarios`, () => {
    expect(
      map(partial, "name"),
      "Half-matched scenarios — they read as driveable and silently are not"
    ).toEqual([]);
    expect(
      map(orphanStepDefs, "pattern"),
      "Step definitions nothing calls"
    ).toEqual([]);
    expect(
      map(malformedStepDefs, "pattern"),
      "Patterns that do not compile"
    ).toEqual([]);
    expect(
      duplicatedPatterns,
      "Patterns another module's catalog already claims"
    ).toEqual([]);
    expect(driveable.length).toBeGreaterThan(0);
  });

  it("fires every action it declares as covered", () => {
    expect(
      reject(coveredActionIds, id =>
        includes(catalogSource, `fire(CLIENT_NOTES_COVERED_ACTIONS.${id}`)
      ),
      "Declared covered but fired by no step"
    ).toEqual([]);
  });
});
