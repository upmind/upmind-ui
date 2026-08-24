// -----------------------------------------------------------------------------
/**
 * @fileoverview client-address traceability — every scenario has a proving test
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `client-address.feature`'s `@AC-*` scenario tags and
 * every sibling spec's `AC-<n>` title mentions, then enforce the link BOTH
 * ways: a non-`@todo` scenario with no proving test fails, and a test naming an
 * AC the feature does not tag fails. Nothing here reads a planning artefact —
 * `docs/story-bundles/**` is not a deliverable and is absent from a fresh clone
 * and from CI, so the co-located copy is the single source of truth
 * (design.md §8).
 *
 * Per ADR-020 the `.feature` is spec-only and non-executable — nothing runs it,
 * and there is no steps file. This test is the whole of its enforcement.
 *
 * ## The three consumer scenarios
 * AC-37, AC-38 and AC-39 are proven by the Playwright suite, which lives
 * outside this module and cannot name an AC in a vitest title. They are
 * declared in {@link CONSUMER_PROOFS} and MACHINE-CHECKED: the named spec file
 * must exist and must still carry the named test title. A renamed or deleted
 * e2e proof fails this file — the declaration is a pointer, never a promise.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-address.feature");
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

/** The `@AC-*` tags on every scenario in a feature file, `@todo` excluded. */
function featureAcTags(path: string): Set<string> {
  const lines = readFileSync(path, "utf-8").split("\n");
  const tagged = new Set<string>();

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/@AC-(\d+)/);
    if (!match) continue;

    let cursor = index;
    let isTodo = false;
    while (cursor < lines.length && !/^\s*Scenario/.test(lines[cursor])) {
      if (/@todo/.test(lines[cursor])) isTodo = true;
      cursor++;
    }
    if (!isTodo) tagged.add(`AC-${match[1]}`);
  }

  return tagged;
}

/** AC ids named by a sibling spec's `describe`/`it` titles → the files naming them. */
function provingTests(): Map<string, string[]> {
  const files = readdirSync(TEST_DIR).filter(
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== "client-address.traceability.test.ts"
  );

  const mentions = new Map<string, string[]>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    // An AC named on the enclosing `describe` is as valid a claim as one
    // repeated on every `it` title.
    for (const title of content.matchAll(
      /(?:describe|it)\(\s*["'`]([^"'`]*)["'`]/g
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

/** Every AC with a proof: a colocated spec, or a live Playwright title. */
function provenAcs(): Set<string> {
  return new Set([...provingTests().keys(), ...Object.keys(CONSUMER_PROOFS)]);
}

// -----------------------------------------------------------------------------

describe("client-address traceability — co-located feature vs proving tests", () => {
  it("the co-located feature is present and tags every scenario in the module's own tree", () => {
    expect(existsSync(COLOCATED_FEATURE)).toBe(true);
    expect(featureAcTags(COLOCATED_FEATURE).size).toBe(44);
  });

  it("every non-@todo scenario has at least one proving test", () => {
    const proven = provenAcs();
    const unproven = [...featureAcTags(COLOCATED_FEATURE)].filter(
      ac => !proven.has(ac)
    );

    expect(
      unproven,
      `Unproven scenarios (no test names this AC): ${unproven.join(", ")}`
    ).toEqual([]);
  });

  it("every AC a test names is a scenario the feature actually tags", () => {
    const tagged = featureAcTags(COLOCATED_FEATURE);
    const orphaned = [...provenAcs()].filter(ac => !tagged.has(ac));

    expect(
      orphaned,
      "Test(s) name an AC the feature does not tag (the feature gains the " +
        `scenario — coverage never falls): ${orphaned.join(", ")}`
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

  it("the coverage map names a proving file or a consumer proof for all 40 scenarios", () => {
    const tests = provingTests();
    const map = [...featureAcTags(COLOCATED_FEATURE)]
      .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
      .map(ac => ({
        ac,
        files: tests.get(ac) ?? [],
        e2e: (CONSUMER_PROOFS[ac] ?? []).map(proof => proof.title)
      }));

    expect(map).toHaveLength(44);
    expect(
      map.filter(entry => entry.files.length === 0 && entry.e2e.length === 0)
    ).toEqual([]);
  });
});
