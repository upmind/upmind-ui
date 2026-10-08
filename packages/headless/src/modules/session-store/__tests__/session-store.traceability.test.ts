/**
 * @fileoverview session-store traceability — the module feature is the contract
 *
 * ## Job To Be Done
 * Hold `session-store.feature` and the specs that prove it in step, in both
 * directions: every scenario the module promises is named by a test, and every
 * scenario id a test names is a scenario the feature still carries.
 *
 * ## What Breaks If These Fail
 * A capability the module promises quietly loses its only proof and nothing
 * goes red — the FE-2824 shape one level up. Or a test keeps asserting against
 * a scenario the contract dropped, so a green suite certifies a contract nobody
 * wrote any more.
 */

import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  compact,
  difference,
  filter,
  flatMap,
  forEach,
  includes,
  isEmpty,
  keys,
  map,
  reject,
  size,
  split,
  startsWith,
  trim,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const here = import.meta.dirname;

/**
 * Every feature file the module carries. The module's behaviour is described by
 * more than one contract — the session/guest capability in `session-store.feature`,
 * the delegate augment in `session-store.delegated.feature` — and traceability
 * holds across all of them at once, so a scenario cannot hide from the anchor by
 * living in the other file.
 */
const FEATURES = map(
  filter(readdirSync(here), name => /\.feature$/.test(name)),
  name => join(here, name)
);

/**
 * The specs outside the module that prove this feature, listed by hand because
 * guest capability is also proven where the auth module mints it; moving one is
 * a break this test is meant to report.
 */
const EXTERNAL_SPECS = [
  join(here, "../../auth/__tests__/auth.guest-session.int.test.ts")
];

/**
 * Scenarios describing capability that predates FE-3087, proven by standing
 * cases that carry no id. AC5 bars editing those cases, so each is bound here
 * by its exact title instead — a rename or deletion breaks this anchor.
 */
const STANDING_PROOFS: Record<string, { spec: string; title: string }> = {
  "AC-C1": {
    spec: "session-store.int.test.ts",
    title:
      "switches between cached users instantly with zero server round trips"
  },
  "AC-D2": {
    spec: "session-store.int.test.ts",
    title: "never activates a disallowed actor scope"
  },
  "AC-S1": {
    spec: "session-store.int.test.ts",
    title:
      "isAuthenticated() rejects for a guest session and resolves the user for a client session"
  }
};

const ID_TAG = /^@(AC-[A-Z]+\d+)$/;
const ID_IN_TITLE = /@(AC-[A-Z]+\d+)/g;
const TITLE_PATTERN = /\bit\(\s*"([^"]*)"/g;

type Scenario = { name: string; ids: string[]; isTodo: boolean };

/**
 * Reads the feature's scenarios with the tags each one carries.
 *
 * @param text - The raw feature file.
 * @returns One entry per `Scenario:`, in file order.
 */
function parseScenarios(text: string): Scenario[] {
  const scenarios: Scenario[] = [];
  let tags: string[] = [];

  forEach(split(text, "\n"), rawLine => {
    const line = trim(rawLine);
    if (!line || startsWith(line, "#")) return;
    if (startsWith(line, "@")) {
      tags = split(line, /\s+/);
      return;
    }
    if (startsWith(line, "Scenario:")) {
      scenarios.push({
        name: trim(line.slice("Scenario:".length)),
        ids: map(compact(map(tags, tag => ID_TAG.exec(tag)?.[1])), String),
        isTodo: includes(tags, "@todo")
      });
    }
    tags = [];
  });

  return scenarios;
}

/**
 * The scenario ids named by the test titles in one spec file.
 *
 * @param path - Absolute path to a spec file.
 * @returns Every id appearing in an `it(...)` title, deduped.
 */
function idsNamedBy(path: string): string[] {
  const text = readFileSync(path, "utf8");
  const titles = map(Array.from(text.matchAll(TITLE_PATTERN)), match =>
    String(match[1])
  );
  return uniq(
    flatMap(titles, title =>
      map(Array.from(title.matchAll(ID_IN_TITLE)), match => String(match[1]))
    )
  );
}

const scenarios = flatMap(FEATURES, path =>
  parseScenarios(readFileSync(path, "utf8"))
);

const specFiles = [
  ...map(
    filter(
      readdirSync(here),
      name =>
        /\.test\.ts$/.test(name) && name !== basename(import.meta.filename)
    ),
    name => join(here, name)
  ),
  ...EXTERNAL_SPECS
];

const namedIds = uniq(flatMap(specFiles, idsNamedBy));
const provenIds = uniq([...namedIds, ...keys(STANDING_PROOFS)]);

// -----------------------------------------------------------------------------

describe("session-store feature traceability", () => {
  it("finds every feature file the module carries", () => {
    expect(size(FEATURES)).toBeGreaterThan(0);
  });

  it("carries a scenario id on every scenario", () => {
    const untagged = filter(scenarios, scenario => isEmpty(scenario.ids));
    expect(map(untagged, "name")).toEqual([]);
    expect(size(scenarios)).toBeGreaterThan(0);
  });

  it("names a proving test for every scenario the feature carries", () => {
    const owed = flatMap(
      reject(scenarios, scenario => scenario.isTodo),
      scenario => difference(scenario.ids, provenIds)
    );
    expect(uniq(owed)).toEqual([]);
  });

  it("carries a scenario for every id the specs name", () => {
    const declared = flatMap(scenarios, "ids");
    expect(difference(namedIds, declared)).toEqual([]);
  });

  it("still finds the standing case each anchored scenario names", () => {
    forEach(keys(STANDING_PROOFS), id => {
      const anchor = STANDING_PROOFS[id] as { spec: string; title: string };
      const text = readFileSync(join(here, anchor.spec), "utf8");
      expect(text).toContain(`it("${anchor.title}"`);
    });
  });
});
