// -----------------------------------------------------------------------------
/**
 * @fileoverview client-address traceability — every capability has a proof
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `client-address.feature`'s `@AC-*` scenarios and enforce
 * that every capability is PROVEN — under the scenario-first model (operator
 * ruling 2026-09-24), a capability is proven by one of:
 *  - a DRIVEN scenario: the scenario carrying the AC has its own per-step
 *    recording under `scenarios/<slug>/` (the replay test plays it);
 *  - a pure-unit spec that names the AC in a `describe`/`it` title
 *    (`client-address.mappers.test.ts`, `client-address.surface.test.ts`);
 *  - a live Playwright consumer proof ({@link CONSUMER_PROOFS}).
 * A capability that cannot be driven honestly THIS pass is tagged `@todo` in the
 * feature with a one-line reason and is exempt here — the honest "unproven, and
 * declared so" state.
 *
 * The 41 tagged capabilities are the whole contract; the count is asserted so a
 * capability cannot be silently dropped. AC-6 (in-memory getOne, no observable
 * signal) and AC-40 (feedback toast — consumer presentation, not this module's)
 * were dropped by operator triage 2026-09-25; AC-29 (two editors at once — the
 * World holds one editor cell) was dropped by operator ruling FE-3145 wave 2.
 * Nothing here reads a planning artefact.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven and
 * not even declared `@todo`.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kebabCase } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-address.feature");
const SCENARIOS_DIR = join(TEST_DIR, "scenarios");
const REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf-8"
}).trim();

/** The scenarios the Playwright suite proves, and the titles that prove them. */
const CONSUMER_PROOFS: Record<
  string,
  Array<{ file: string; title: string }>
> = {
  "AC-37": [
    {
      file: "tests/Playwright/e2e/e2e-tests/checkout/billing-details/standalone-billing.spec.ts",
      title:
        "Continue button is rendered once the client has at least one saved address"
    },
    {
      file: "tests/Playwright/e2e/e2e-tests/checkout/billing-details/standalone-billing.spec.ts",
      title: "Summary displays selected address"
    },
    {
      file: "tests/Playwright/e2e/e2e-tests/checkout/billing-details/standalone-billing.spec.ts",
      title: "Inline billing form shown when standalone is disabled"
    }
  ],
  "AC-38": [
    {
      file: "tests/Playwright/e2e/e2e-tests/checkout/billing-details/update-billing-details.spec.ts",
      title: "Existing Address - Billing Details at checkout"
    },
    {
      file: "tests/Playwright/e2e/e2e-tests/checkout/billing-details/standalone-billing.spec.ts",
      title: "Round-trip: update address on billing page"
    }
  ],
  "AC-39": [
    {
      file: "tests/Playwright/e2e/e2e-tests/checkout/billing-details/standalone-billing.spec.ts",
      title: "Can add new address on billing page"
    },
    {
      file: "tests/Playwright/e2e/e2e-tests/checkout/billing-details/standalone-billing.spec.ts",
      title: "Round-trip: update address on billing page"
    }
  ]
};

// -----------------------------------------------------------------------------

type Scenario = { name: string; acs: string[]; exempt: boolean };

/**
 * Parse every scenario with its `@AC-*` tags and whether it is EXEMPT from a
 * driven proof — `@todo` (a named blocker) or `@moved` (proven in another
 * module: transport/token behaviour lives in query / session-store / auth).
 */
function scenarios(path: string): Scenario[] {
  const lines = readFileSync(path, "utf-8").split("\n");
  const found: Scenario[] = [];

  for (let index = 0; index < lines.length; index++) {
    const scenarioMatch = lines[index].match(/^\s*Scenario:\s*(.+?)\s*$/);
    if (!scenarioMatch) continue;

    const acs: string[] = [];
    let exempt = false;
    // Walk back over the contiguous tag/comment block above the Scenario line.
    for (let cursor = index - 1; cursor >= 0; cursor--) {
      const line = lines[cursor];
      if (/^\s*(@|#)/.test(line) || line.trim() === "") {
        if (line.trim() === "") continue;
        if (/@todo|@moved/.test(line)) exempt = true;
        for (const ac of line.matchAll(/@AC-(\d+)/g)) acs.push(`AC-${ac[1]}`);
        continue;
      }
      break;
    }
    found.push({ name: scenarioMatch[1], acs, exempt });
  }

  return found;
}

/** Every distinct `@AC-*` capability the feature tags. */
function allAcs(list: Scenario[]): Set<string> {
  return new Set(list.flatMap(scenario => scenario.acs));
}

/** ACs on a NON-exempt scenario that has its own per-step recording — a driven proof. */
function drivenAcs(list: Scenario[]): Set<string> {
  const driven = new Set<string>();
  for (const scenario of list) {
    if (!scenario.acs.length || scenario.exempt) continue;
    if (existsSync(join(SCENARIOS_DIR, kebabCase(scenario.name))))
      for (const ac of scenario.acs) driven.add(ac);
  }
  return driven;
}

/** AC ids named by a sibling PURE-unit spec's `describe`/`it` titles. */
function unitTestAcs(): Set<string> {
  const files = readdirSync(TEST_DIR).filter(
    file =>
      file.endsWith(".test.ts") &&
      !file.endsWith(".int.test.ts") &&
      file !== "client-address.traceability.test.ts"
  );
  const named = new Set<string>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    for (const title of content.matchAll(
      /(?:describe|it)\(\s*["'`]([^"'`]*)["'`]/g
    ))
      for (const ac of title[1].matchAll(/AC-(\d+)/g)) named.add(`AC-${ac[1]}`);
  }
  return named;
}

/** Every AC with a proof: a driven scenario, a pure-unit spec, or a consumer proof. */
function provenAcs(list: Scenario[]): Set<string> {
  return new Set([
    ...drivenAcs(list),
    ...unitTestAcs(),
    ...Object.keys(CONSUMER_PROOFS)
  ]);
}

/** ACs whose every carrying scenario is EXEMPT (`@todo`/`@moved`) — declared, with a reason. */
function exemptOnlyAcs(list: Scenario[]): Set<string> {
  const byAc = new Map<string, Scenario[]>();
  for (const scenario of list)
    for (const ac of scenario.acs) {
      const seen = byAc.get(ac) ?? [];
      seen.push(scenario);
      byAc.set(ac, seen);
    }
  const exemptOnly = new Set<string>();
  for (const [ac, carrying] of byAc)
    if (carrying.every(scenario => scenario.exempt)) exemptOnly.add(ac);
  return exemptOnly;
}

// -----------------------------------------------------------------------------

describe("client-address traceability — co-located feature vs its proofs", () => {
  it("the co-located feature is present and tags all 41 capabilities", () => {
    expect(existsSync(COLOCATED_FEATURE)).toBe(true);
    expect(allAcs(scenarios(COLOCATED_FEATURE)).size).toBe(41);
  });

  it("every capability is proven by a driven scenario, a unit spec or a consumer proof — or declared @todo/@moved with a reason", () => {
    const list = scenarios(COLOCATED_FEATURE);
    const proven = provenAcs(list);
    const exempt = exemptOnlyAcs(list);
    const unproven = [...allAcs(list)].filter(
      ac => !proven.has(ac) && !exempt.has(ac)
    );

    expect(
      unproven,
      `Capabilities with no proof and no @todo/@moved: ${unproven.join(", ")}`
    ).toEqual([]);
  });

  it("every AC a unit spec names is a capability the feature actually tags", () => {
    const tagged = allAcs(scenarios(COLOCATED_FEATURE));
    const orphaned = [...unitTestAcs(), ...Object.keys(CONSUMER_PROOFS)].filter(
      ac => !tagged.has(ac)
    );

    expect(
      orphaned,
      `Proof(s) name an AC the feature does not tag: ${orphaned.join(", ")}`
    ).toEqual([]);
  });

  it("every declared consumer proof still exists, by file and by test title", () => {
    const broken: string[] = [];
    for (const [ac, proofs] of Object.entries(CONSUMER_PROOFS)) {
      for (const proof of proofs) {
        const path = join(REPO_ROOT, proof.file);
        if (!existsSync(path)) {
          broken.push(`${ac}: missing file ${proof.file}`);
          continue;
        }
        if (!readFileSync(path, "utf-8").includes(proof.title)) {
          broken.push(`${ac}: "${proof.title}" no longer in ${proof.file}`);
        }
      }
    }

    expect(broken).toEqual([]);
  });
});
