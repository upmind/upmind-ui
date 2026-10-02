// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/offer
 * @description What a page OFFERS, and what it OWES — the two halves of the
 * same reading, kept in one file so neither can drift from the other.
 *
 * The states are the FEATURE's (`states.ts`): one per transport condition a
 * scenario names, labelled by that scenario's own title. Whether each can be
 * ANSWERED is the recordings' question (`capabilities.ts`), asked per recipe.
 * A derived state the corpus cannot answer is never quietly dropped — it is a
 * capture gap, named out loud, exactly as the preset-era gap report named one
 * (`AC5`).
 *
 * Nothing here measures a state the feature does not declare, and nothing here
 * declares a state the feature does not name — with ONE state that needs no
 * naming: every module that reads from the API is loading until that read
 * lands (its `isReady` waits on exactly that), so a page that reads is offered
 * `Loading` whether or not a scenario spelt the word. The module's own
 * `.feature` is the source of truth for every OTHER state a page can be forced
 * into, and its recordings for WHETHER it can be (operator ruling, 2026-09-12).
 */

import { answersRecipe } from "./capabilities";
import {
  featureForcedStates,
  forcedStateLabel,
  forcedStateRecipeId
} from "./states";
import { FORCE_RECIPE_KIND, FORCE_RECIPE_TARGET } from "./states.types";
import { concat, filter, reject, some, uniqBy } from "lodash-es";
import type { RecordedFixture } from "./corpus.source.types";
import type { ForcedState, ForceRecipe } from "./states.types";

// -----------------------------------------------------------------------------

/** A read still in flight — the one state every reading module has. */
const LOADING: ForceRecipe = {
  kind: FORCE_RECIPE_KIND.PENDING,
  target: FORCE_RECIPE_TARGET.READ
};

/**
 * The state a reading page has before its read lands. It comes from no
 * scenario, so it carries no line, and its slug is the recipe's own id — the
 * one `force=` value that is the same on every page.
 */
const IMPLICIT_LOADING: ForcedState = {
  slug: forcedStateRecipeId(LOADING),
  title: "Loading",
  label: forcedStateLabel(LOADING),
  phrase: "loading",
  line: 0,
  recipe: LOADING
};

const isLoading = (state: ForcedState) =>
  forcedStateRecipeId(state.recipe) === forcedStateRecipeId(LOADING);

/**
 * The states this page may be put into: declared by its feature AND answerable
 * from its own recordings, plus `Loading` for any page whose recordings show it
 * reads. A module whose feature names no transport condition and holds no
 * read offers none, and is left Live (`S12`) — as is one whose recordings
 * answer none of what it names.
 *
 * @param feature The module's committed `.feature` text.
 * @param bodies That module's own recordings, keyed by fixture name.
 * @param without The lane tags this page leaves out — a scenario tagged with
 * one is another page's, so its states are not this page's to offer.
 */
export function offeredForcedStates(
  feature: string,
  bodies: Record<string, RecordedFixture>,
  without?: readonly string[]
): ForcedState[] {
  // One entry per RECIPE: three scenarios that each say "loading" are one
  // state on the picker, named by the first of them.
  const declared = uniqBy(
    filter(featureForcedStates(feature, without), state =>
      answersRecipe(state.recipe, bodies)
    ),
    state => forcedStateRecipeId(state.recipe)
  );

  return some(declared, isLoading) || !answersRecipe(LOADING, bodies)
    ? declared
    : concat(declared, IMPLICIT_LOADING);
}

/**
 * The states its feature declares that its own recordings CANNOT answer, named
 * so a capture that never happened reads as missing EVIDENCE rather than as
 * absent capability (`AC5`). Every debt is filled in the module's own
 * `.fixtures.ts`, never borrowed from another's and never written by hand.
 *
 * @param feature The module's committed `.feature` text.
 * @param bodies That module's own recordings, keyed by fixture name.
 * @param without The lane tags this page leaves out — a gap on another page's
 * scenario is not this page's to report.
 */
export function forcedStateGaps(
  feature: string,
  bodies: Record<string, RecordedFixture>,
  without?: readonly string[]
): ForcedState[] {
  return reject(featureForcedStates(feature, without), state =>
    answersRecipe(state.recipe, bodies)
  );
}
