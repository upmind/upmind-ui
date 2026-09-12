// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-states.spec
 * @description The forced states a page offers come from its feature — one per
 * transport condition a scenario NAMES, labelled by that scenario's own title
 * (operator ruling, 2026-09-12). Prints every module's derived set (the review
 * surface), and pins the readings the first cut got wrong.
 *
 * ## What Breaks If These Fail
 * The picker goes back to offering a fixed four states off two tags: a
 * single-record form is offered a collection's failure, a scenario about a
 * value the client clears becomes an empty READ, and a sentence naming three
 * conditions offers one.
 */

import { describe, expect, it } from "vitest";
import { availableModules, featureTextFor } from "../corpus.source";
import {
  featureForcedStates,
  forcedStateLabel,
  forcedStateRecipeId
} from "../states";
import { filter, find, map, some } from "lodash-es";
import type { ForcedState } from "../states.types";

// -----------------------------------------------------------------------------

const statesOf = (module: string) =>
  featureForcedStates(featureTextFor(module));

const kindsOf = (states: ForcedState[]) =>
  map(states, state => `${state.recipe.kind}/${state.recipe.target}`);

const titled = (states: ForcedState[], match: RegExp) =>
  filter(states, state => match.test(state.title));

// -----------------------------------------------------------------------------

describe("forced states are read off the feature", () => {
  it("prints what every module would offer", () => {
    for (const module of availableModules) {
      const states = statesOf(module);
      console.log(
        `FORCED ${module}: ${states.length}\n` +
          map(
            states,
            state =>
              `  - [${state.recipe.kind}/${state.recipe.target}] "${state.phrase}" ${state.slug}`
          ).join("\n")
      );
    }
    expect(availableModules.length).toBeGreaterThan(0);
  });

  it("labels the state by the sentence's own words for it, and a slug per recipe", () => {
    for (const module of availableModules) {
      for (const state of statesOf(module)) {
        expect(state.label).toBe(forcedStateLabel(state.recipe));
        expect(state.label).not.toContain(state.title);
        expect(state.slug).toMatch(/^[a-z0-9-]+$/);
        expect(state.slug).toContain(forcedStateRecipeId(state.recipe));
        expect(state.line).toBeGreaterThan(0);
      }
    }
  });

  it("never offers two states under one slug", () => {
    for (const module of availableModules) {
      const slugs = map(statesOf(module), state => state.slug);
      expect(new Set(slugs).size, `${module} offers a slug twice`).toBe(
        slugs.length
      );
    }
  });

  it("client-billing-settings: read failed + save in progress, never the client-side refusal", () => {
    const states = statesOf("client-billing-settings");
    const kinds = kindsOf(states);

    expect(kinds).toContain("refused/read");
    expect(kinds).toContain("pending/write");
    expect(
      find(states, state => /invalid value/i.test(state.title))
    ).toBeUndefined();
    expect(kinds).not.toContain("absent/read");
  });

  it("reads every condition a sentence names, not the first rule that matched", () => {
    const states = titled(
      statesOf("client-email"),
      /loading, empty, or errored/
    );

    expect(kindsOf(states).sort()).toEqual([
      "absent/read",
      "pending/read",
      "refused/read"
    ]);
    expect(map(states, state => state.label)).toEqual([
      ...new Set(map(states, state => state.label))
    ]);
    expect(
      some(states, state => state.label === "labs.force_preset_loading")
    ).toBe(true);
  });

  it("reads a value being cleared as no read state at all", () => {
    expect(
      titled(statesOf("client-custom-fields"), /Clearing a value/),
      "an explicit empty SIGNAL is a write, and never the read coming back empty"
    ).toEqual([]);
  });

  it("reads a DERIVED business state as no transport state at all", () => {
    expect(
      titled(statesOf("invoices"), /derives a pending state/),
      "a state the mapper computes is not one a fake network can answer"
    ).toEqual([]);
    expect(kindsOf(titled(statesOf("invoices"), /A failed load/))).toEqual([
      "refused/read"
    ]);
  });

  it("reads a condition the sentence DENIES as denied", () => {
    const states = titled(
      statesOf("payment-details"),
      /another client's methods/
    );

    expect(kindsOf(states)).toEqual(["refused/read"]);
    expect(kindsOf(states)).not.toContain("absent/read");
  });

  it("offers nothing for a feature that names no transport condition", () => {
    expect(featureForcedStates("")).toEqual([]);
    expect(
      featureForcedStates(
        "Feature: A thing\n\n  Scenario: I read it\n    Then I have read it\n"
      )
    ).toEqual([]);
  });
});
