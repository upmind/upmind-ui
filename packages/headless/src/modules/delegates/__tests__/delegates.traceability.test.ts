/**
 * @fileoverview delegates traceability — the module feature is the contract
 *
 * ## Job To Be Done
 * Hold `delegates.feature` and the specs that prove it in step, in both
 * directions: every capability the module promises is named by a test, and
 * every scenario id a test names is a scenario the feature still carries.
 *
 * ## What Breaks If These Fail
 * A capability the module promises quietly loses its only proof and nothing
 * goes red — the FE-2824 shape one level up. Or a test keeps asserting against
 * a scenario the contract dropped, so a green suite certifies a contract nobody
 * wrote any more.
 */

import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compact,
  difference,
  filter,
  flatMap,
  forEach,
  includes,
  isEmpty,
  map,
  size,
  split,
  startsWith,
  trim,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const here = import.meta.dirname;

const FEATURES = map(
  filter(readdirSync(here), name => /\.feature$/.test(name)),
  name => join(here, name)
);

const ID_TAG = /^@(AC-[A-Z]+\d+)$/;
const ID_IN_TITLE = /@?(AC-[A-Z]+\d+)/g;
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

const specFiles = map(
  filter(
    readdirSync(here),
    name =>
      /\.(int\.)?test\.ts$/.test(name) &&
      name !== basename(import.meta.filename)
  ),
  name => join(here, name)
);

const namedIds = uniq(flatMap(specFiles, idsNamedBy));

// -----------------------------------------------------------------------------

describe("delegates feature traceability", () => {
  it("finds the feature file the module carries", () => {
    expect(size(FEATURES)).toBeGreaterThan(0);
    expect(size(scenarios)).toBeGreaterThan(0);
  });

  it("carries a scenario id on every scenario", () => {
    const untagged = filter(scenarios, scenario => isEmpty(scenario.ids));
    expect(map(untagged, "name")).toEqual([]);
  });

  it("names a proving test for every scenario the feature promises today", () => {
    const owed = flatMap(
      filter(scenarios, scenario => !scenario.isTodo),
      scenario => difference(scenario.ids, namedIds)
    );
    expect(uniq(owed)).toEqual([]);
  });

  it("carries a scenario for every id the specs name", () => {
    const declared = flatMap(scenarios, "ids");
    expect(difference(namedIds, declared)).toEqual([]);
  });
});
