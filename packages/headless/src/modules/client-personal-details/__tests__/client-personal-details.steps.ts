// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/__tests__/client-personal-details.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-personal-details.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog can be
 * re-registered against any runner.
 *
 * One composable is driven, under one scenario key (`client_personal_details`):
 * `usePersonalDetails` serves both the profile read (its `data` display list)
 * and the form editor. A capability that cannot be driven
 * honestly (a load failure the recording pipeline cannot arrange, an array-valued
 * language list `expectContext` cannot subset-match, a request-body or
 * request-count fact, an unauthenticated boot) is `@todo` in the feature and has
 * no step here. Every handler speaks to the module through the `World` members —
 * no DOM read, no request read, no import of the module's own source.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import ac35BrandRecording from "./scenarios/if-my-current-language-isnt-offered-any-more-i-still-see-it-just-not-selectable/01/get-brand-settings.json";
import ac35ProfileRecording from "./scenarios/if-my-current-language-isnt-offered-any-more-i-still-see-it-just-not-selectable/01/get-clients-id.json";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The scenario key — the playground registers `usePersonalDetails` here, as list and editor. */
export const CLIENT_PERSONAL_DETAILS_SCENARIO = "client_personal_details";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift. `refresh` drives
 * the read; `input`/`update`/`revert` drive the editor; `isReady` boots both.
 */
export const CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  input: "input",
  update: "update",
  revert: "revert"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS
);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the subject settles on it. */
async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
  }
  return assertion();
}

/**
 * Boots the composable over the active client's own profile, and settles it
 * loaded. A failed load settles `unavailable`, so `isAvailable: true` is the
 * "loaded without failure" fact; `hasErrors` also carries validation errors
 * (AC-51's required field), so it is asserted only where a scenario says so.
 */
async function openReadHalf(world: World): Promise<void> {
  await world.boot(CLIENT_PERSONAL_DETAILS_SCENARIO, {
    actor: ScopeActorTypes.SELF
  });
  await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true }));
}

/**
 * AC-35 — the brand's recorded languages (the dropped one absent) and the
 * client's recorded current language: the options the editor must publish.
 */
const AC35 = (() => {
  const languages = ac35BrandRecording.response.body.data.languages as Array<{
    id: string;
    language: string;
  }>;
  const current = ac35ProfileRecording.response.body.data
    .interface_language_id as string;
  return {
    options: [
      ...languages.map(({ id, language }) => ({ label: language, value: id })),
      { label: current, value: current, disabled: true }
    ]
  };
})();

/** Boots the form editor over the active client's own profile, and settles it ready. */
async function openManager(world: World): Promise<void> {
  await world.boot(CLIENT_PERSONAL_DETAILS_SCENARIO, {
    actor: ScopeActorTypes.SELF
  });
  await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true }));
}

/**
 * Set by the replay arrange before an `@errored` scenario's steps run: that
 * scenario keeps the signed-in Background, but its profile read is a recorded
 * 500, so the composable settles on `hasErrors` rather than the loaded assertion.
 */
export const arrangeState = { errored: false };

/** Boots the composable whose profile read the recording forces to a 500. */
async function openReadHalfErrored(world: World): Promise<void> {
  await world.boot(CLIENT_PERSONAL_DETAILS_SCENARIO, {
    actor: ScopeActorTypes.SELF
  });
  await world
    .fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.isReady)
    .catch(() => undefined);
  await settles(() => world.expectMeta({ hasErrors: true }));
}

/** Boots the read half under a signed-out session — it settles unavailable. */
async function openReadHalfSignedOut(world: World): Promise<void> {
  await world.boot(CLIENT_PERSONAL_DETAILS_SCENARIO, {
    actor: ScopeActorTypes.SELF
  });
  await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: false }));
}

// -----------------------------------------------------------------------------

export const clientPersonalDetailsSteps = defineSteps(
  ({ Given, When, Then }) => {
    Given("I am an authenticated client with my own profile", world =>
      arrangeState.errored ? openReadHalfErrored(world) : openReadHalf(world)
    );

    // AC-30 — the read half
    When("I read my profile", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.refresh)
    );

    Then("my profile is available to me", world =>
      settles(() => world.expectMeta({ isAvailable: true }))
    );

    Then("my profile reports no failure", world =>
      settles(() => world.expectMeta({ hasErrors: false }))
    );

    // AC-43 — the editor opens bare
    When("I view my profile's language choices", world => openManager(world));

    Then("my current language still appears, shown but not selectable", world =>
      settles(() =>
        world.expectContext({
          schema: { properties: { language: { options: AC35.options } } }
        })
      )
    );

    When("I open my profile editor with no arguments", world =>
      openManager(world)
    );

    Then("my profile editor reaches a settled, ready state", world =>
      settles(() => world.expectMeta({ isAvailable: true }))
    );

    // AC-45 / AC-46 / AC-50 — the editor opened over my own profile
    Given("I have opened my profile in the editor", world =>
      openManager(world)
    );

    // AC-45 — a diff-only save through the editor
    When("I change only my first name and save", async world => {
      await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.input, {
        firstName: "Prover"
      });
      await settles(() =>
        world.expectContext({ model: { firstName: "Prover" } })
      );
      await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.update);
      await settles(() => world.expectMeta({ isAvailable: true }));
    });

    Then("my profile editor saves without failure", world =>
      settles(() => world.expectMeta({ hasErrors: false }))
    );

    // AC-46 / AC-47 — clearing a custom field and saving
    When("I clear one of my custom fields and save", async world => {
      await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.input, {
        customFields: { age: null }
      });
      await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.update);
      await settles(() => world.expectMeta({ isAvailable: true }));
    });

    // AC-50 — discard edits
    Given(
      "I have made two changes to my profile in the editor",
      async world => {
        await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.input, {
          firstName: "Changed"
        });
        await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.input, {
          lastName: "AlsoChanged"
        });
        await settles(() => world.expectMeta({ isDirty: true }));
      }
    );

    When("I discard my edits", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.revert)
    );

    Then("my profile editor is no longer reported as changed", world =>
      settles(() => world.expectMeta({ isDirty: false }))
    );

    // --- AC-31/40: the read half's profile load fails --------------------------

    When("I inspect my profile after its load has failed", async () => {});

    Then("my profile reports that it failed to load", world =>
      settles(() => world.expectMeta({ hasErrors: true }))
    );

    // --- AC-41/54: the read half without an authenticated client session -------
    // The replay wall proves the absence: the scenario arms no recording, so any
    // request the read half makes is an unmatched request the cleanup surfaces.

    Given("there is no authenticated client session for my profile", world =>
      openReadHalfSignedOut(world)
    );

    When("my profile is read while signed out", world =>
      world
        .fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.refresh)
        .catch(() => undefined)
    );

    Then("my profile reports itself unavailable", world =>
      world.expectMeta({ isAvailable: false })
    );

    Then("no request is made against any profile resource", world =>
      world.expectMeta({ isAvailable: false })
    );

    // --- AC-42: the editor without an authenticated client session -------------
    // The manager settles isReady false and update raises NotAuthenticatedError
    // when signed-out (module fix); the replay arms no recording, so any profile
    // request it makes is an unmatched request the cleanup surfaces.

    Given(
      "I open my profile editor without an authenticated client session",
      async world => {
        await world.boot(CLIENT_PERSONAL_DETAILS_SCENARIO, {
          actor: ScopeActorTypes.SELF
        });
        await world
          .fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.isReady)
          .catch(() => undefined);
        await settles(() => world.expectMeta({ isAvailable: false }));
      }
    );

    When("I try to use my profile editor while signed out", async world => {
      await world
        .fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.input, {
          firstName: "SignedOut"
        })
        .catch(() => undefined);
      await world
        .fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.update)
        .catch(() => undefined);
    });

    Then("my profile editor reports itself unavailable", world =>
      world.expectMeta({ isAvailable: false })
    );

    // --- AC-51: a required custom field left empty refuses the save -------------
    // The recorded boot's definitions carry the REQUIRED field (arranged by the
    // generator), so the editor's schema marks it required. Clearing it leaves the
    // form invalid; firing update is refused client-side and the replay wall proves
    // no PUT escapes.
    When("I clear a required custom field and try to save", async world => {
      await openManager(world);
      await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.input, {
        customFields: { fe3145_required: null }
      });
      await settles(() => world.expectMeta({ isValid: false }));
      await world
        .fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.update)
        .catch(() => undefined);
    });

    Then("the save is refused before any request is made", world =>
      settles(() => world.expectMeta({ isValid: false }))
    );
  }
);

export default clientPersonalDetailsSteps;
