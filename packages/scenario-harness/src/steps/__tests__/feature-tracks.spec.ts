/**
 * @module steps/__tests__/feature-tracks.spec
 * @description The two additive exports the replay harness plays a feature
 * with (design §3.1, `AC2.5`): a feature is a playlist, its scenarios are
 * tracks, its steps are scenes. `parseFeatureScenarios` must therefore hand
 * back ONE ENTRY PER SCENARIO — its own name, its own tags, its own line and
 * its steps in run order — not the flat step list `createTraceabilityCheck`
 * needs; and `createStepMatcher` must hand back the compiled args a scene's
 * handler is called with.
 *
 * The client-email feature is the corpus, and every expectation is DERIVED from
 * its own source lines by the reader below rather than pinned to a count. Under
 * one `.feature` per module the file grows whenever a capability is written
 * down, so a hardcoded arity dates the spec to the day it was authored and
 * fails the next merge instead of the next defect. It is reached by path rather
 * than specifier because `headless` is not a dependency of this package — the
 * technique `playgrounds/labs-nuxt/tests/e2e/catalogs.ts` already uses for the
 * same file.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fixtureSteps } from "../../__fixtures__/fixture.steps";
import { STEP_KIND } from "../steps.types";
import { createStepMatcher, parseFeatureScenarios } from "../traceability";
import {
  compact,
  every,
  filter,
  flatMap,
  intersection,
  map,
  sortBy,
  times,
  trim,
  uniq
} from "lodash-es";
import type { StepCatalog, StepDef } from "../steps.types";

// -----------------------------------------------------------------------------

const clientEmailFeatureText = readFileSync(
  fileURLToPath(
    new URL(
      "../../../../headless/src/modules/client-email/__tests__/client-email.feature",
      import.meta.url
    )
  ),
  "utf-8"
);

const fixtureText = readFileSync(
  fileURLToPath(new URL("../../__fixtures__/fixture.feature", import.meta.url)),
  "utf-8"
);

const SCENARIO_LINE = /^\s*Scenario(?: Outline| Template)?:\s*(.+?)\s*$/;
const TAG_LINE = /^\s*(@\S.*?)\s*$/;
const FEATURE_LINE = /^\s*Feature:/;
const EXAMPLES_LINE = /^\s*Examples:/;
const TABLE_ROW = /^\s*\|/;
const STEP_LINE = /^\s*(Given|When|Then|And|But)\s+(.+?)\s*$/;

type DeclaredScenario = {
  name: string;
  tags: string[];
  line: number;
  /** One per Examples row for an Outline; one for a plain Scenario. */
  expansions: number;
};

/**
 * The feature read as its own author wrote it — an oracle taken off the source
 * lines, never off the parser under test.
 */
function readDeclarations(text: string): {
  featureTags: string[];
  scenarios: DeclaredScenario[];
  background: string[];
} {
  const lines = text.split("\n");
  const scenarios: DeclaredScenario[] = [];
  const background: string[] = [];

  let pendingTags: string[] = [];
  let featureTags: string[] = [];
  let inBackground = false;

  lines.forEach((source, index) => {
    const tags = TAG_LINE.exec(source);
    if (tags && !source.trimStart().startsWith("#")) {
      pendingTags = compact(tags[1].split(/\s+/));
      return;
    }

    if (FEATURE_LINE.test(source)) {
      featureTags = pendingTags;
      pendingTags = [];
      return;
    }

    if (/^\s*Background:/.test(source)) {
      inBackground = true;
      pendingTags = [];
      return;
    }

    const scenario = SCENARIO_LINE.exec(source);
    if (scenario) {
      inBackground = false;
      scenarios.push({
        name: scenario[1],
        tags: pendingTags,
        line: index + 1,
        expansions: 1
      });
      pendingTags = [];
      return;
    }

    const step = STEP_LINE.exec(source);
    if (step && inBackground) background.push(step[2]);
  });

  // A second pass counts each Outline's Examples rows, which is what decides how
  // many tracks that one declaration becomes.
  let current: DeclaredScenario | undefined;
  let inExamples = false;
  let headerSeen = false;

  lines.forEach((source, index) => {
    const declared = filter(scenarios, { line: index + 1 })[0];
    if (declared) {
      current = /Scenario (?:Outline|Template):/.test(source)
        ? declared
        : undefined;
      if (current) current.expansions = 0;
      inExamples = false;
      headerSeen = false;
      return;
    }

    if (!current) return;

    if (EXAMPLES_LINE.test(source)) {
      inExamples = true;
      headerSeen = false;
      return;
    }

    if (inExamples && TABLE_ROW.test(source)) {
      if (headerSeen) current.expansions += 1;
      headerSeen = true;
    }
  });

  return { featureTags, scenarios, background };
}

const clientEmail = readDeclarations(clientEmailFeatureText);
const clientEmailLines = clientEmailFeatureText.split("\n");

const expectedTrackNames = flatMap(clientEmail.scenarios, declared =>
  times(declared.expansions, () => declared.name)
);

const tagsByScenarioName = new Map(
  map(clientEmail.scenarios, declared => [declared.name, declared.tags])
);

const OUTLINE_FEATURE = `
Feature: Outline expansion
  Background:
    Given a fresh fixture switch

  @tagged
  Scenario Outline: Labelling the switch with different values
    When the switch is labelled "<label>"
    Then the switch reports a label is set

    Examples:
      | label |
      | demo  |
      | other |
`;

// -----------------------------------------------------------------------------

describe("T1.7 parseFeatureScenarios — a feature is a playlist of tracks", () => {
  it("returns one track per scenario the file declares, Outline rows expanded, never one flat step list", () => {
    const tracks = parseFeatureScenarios(clientEmailFeatureText);

    expect(map(tracks, "name")).toStrictEqual(expectedTrackNames);
    expect(every(tracks, track => track.steps.length > 0)).toBe(true);
  });

  it("lines each track at its own declaration, or at the Examples row it expanded from", () => {
    const misplaced = filter(
      parseFeatureScenarios(clientEmailFeatureText),
      track => {
        const source = clientEmailLines[track.line - 1] ?? "";

        return !(
          SCENARIO_LINE.exec(source)?.[1] === track.name ||
          TABLE_ROW.test(source)
        );
      }
    );

    expect(
      map(misplaced, track => `${track.line}: ${track.name}`)
    ).toStrictEqual([]);
  });

  it("carries each scenario's own tags, and never inherits the feature's", () => {
    const tracks = parseFeatureScenarios(clientEmailFeatureText);

    expect(clientEmail.featureTags.length).toBeGreaterThan(0);
    expect(
      flatMap(tracks, track =>
        intersection(track.tags, clientEmail.featureTags)
      )
    ).toStrictEqual([]);
    expect(
      filter(
        tracks,
        track =>
          sortBy(track.tags).join(" ") !==
          sortBy(tagsByScenarioName.get(track.name)).join(" ")
      )
    ).toStrictEqual([]);
  });

  it("prefixes every track with the Background's steps, in run order", () => {
    const tracks = parseFeatureScenarios(clientEmailFeatureText);

    expect(clientEmail.background.length).toBeGreaterThan(0);
    expect(uniq(map(tracks, "backgroundStepCount"))).toStrictEqual([
      clientEmail.background.length
    ]);
    expect(
      uniq(
        map(tracks, track =>
          map(track.steps.slice(0, track.backgroundStepCount), "text").join("|")
        )
      )
    ).toStrictEqual([map(clientEmail.background, trim).join("|")]);
  });

  it("expands a Scenario Outline into one track per Examples row", () => {
    const tracks = parseFeatureScenarios(OUTLINE_FEATURE);

    expect(tracks).toHaveLength(2);
    expect(map(tracks, track => map(track.steps, "text"))).toStrictEqual([
      [
        "a fresh fixture switch",
        'the switch is labelled "demo"',
        "the switch reports a label is set"
      ],
      [
        "a fresh fixture switch",
        'the switch is labelled "other"',
        "the switch reports a label is set"
      ]
    ]);
    expect(map(tracks, "tags")).toStrictEqual([["@tagged"], ["@tagged"]]);
  });

  it("keeps a feature with no Background whole, one track per scenario", () => {
    const tracks = parseFeatureScenarios(fixtureText);

    expect(map(tracks, "name")).toStrictEqual(
      map(readDeclarations(fixtureText).scenarios, "name")
    );
    expect(map(tracks[2].steps, "kind")).toStrictEqual([
      STEP_KIND.GIVEN,
      STEP_KIND.WHEN,
      STEP_KIND.THEN
    ]);
  });
});

describe("T1.7 createStepMatcher — the compiled args a scene is run with", () => {
  it("returns the matching definition and its compiled args for a step text", () => {
    const matched = createStepMatcher(fixtureSteps).match(
      'the switch is labelled "demo"'
    );

    expect(matched?.args).toStrictEqual(["demo"]);
    expect(matched?.def.pattern).toBe("the switch is labelled {string}");
    expect(fixtureSteps.steps[matched!.index]).toBe(matched!.def);
  });

  it("returns no args for a pattern that takes none, and nothing at all for an unregistered step", () => {
    const matcher = createStepMatcher(fixtureSteps);

    expect(matcher.match("the switch is turned on")?.args).toStrictEqual([]);
    expect(matcher.match("a step nobody registered anywhere")).toBeUndefined();
  });

  it("reports every matching definition in catalog order", () => {
    const duplicate: StepDef = {
      kind: STEP_KIND.WHEN,
      pattern: "the switch is turned {word}",
      handler: () => {}
    };
    const catalog: StepCatalog = {
      steps: [...fixtureSteps.steps, duplicate]
    };

    const all = createStepMatcher(catalog).matchAll("the switch is turned on");

    expect(map(all, "index")).toStrictEqual(sortBy(map(all, "index")));
    expect(map(all, "args")).toStrictEqual([[], ["on"]]);
  });

  it("surfaces an uncompilable pattern as data, and still matches the rest", () => {
    const malformed: StepDef = {
      kind: STEP_KIND.GIVEN,
      pattern: "a value of {unregisteredCustomParameterType}",
      handler: () => {}
    };
    const catalog: StepCatalog = { steps: [...fixtureSteps.steps, malformed] };

    let matcher: ReturnType<typeof createStepMatcher> | undefined;
    expect(() => {
      matcher = createStepMatcher(catalog);
    }).not.toThrow();

    expect(matcher?.malformedStepDefs).toContainEqual(
      expect.objectContaining({ pattern: malformed.pattern })
    );
    expect(matcher?.compiledIndexes.has(catalog.steps.length - 1)).toBe(false);
    expect(matcher?.match("the switch is turned on")).toBeDefined();
  });
});
