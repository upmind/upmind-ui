// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-email-history.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog re-registers
 * against any runner.
 *
 * Every handler speaks to the module through the `World` members. There is no
 * DOM read, no request read and no import of the module's own source here.
 *
 * Only the read-only COLLECTION (`useClientReceivedEmails`) is driven: it boots
 * `{ actor: client }` and its identity resolves from the session. The SINGLE
 * received email (`useClientReceivedEmail`) marks its record with `.withId(id)`
 * and refuses `.for()`, which the World scope seam ({ actor, context }) cannot
 * express — so its capabilities are proven by the mapper unit test (AC-13/14) or
 * declared `@todo` (AC-15/17). Those scenarios carry no steps and the replay
 * skips them by name.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import singleEmailRecording from "./scenarios/know-whether-that-email-is-loading-empty-or-errored-and-wait-for-it/03/get-emails-id.json";
import searchRecording from "./scenarios/search-my-history/03/get-self-email-history-filter-subject-like-invoice.json";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url.
 */
export const CLIENT_EMAIL_HISTORY_SCENARIO = "client_email_history";

/** The scenario key the single received email (`useClientReceivedEmail`) boots under. */
export const CLIENT_RECEIVED_EMAIL_SCENARIO = "client_received_email";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift.
 */
export const CLIENT_EMAIL_HISTORY_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  setCriteria: "setCriteria",
  nextPage: "nextPage",
  prevPage: "prevPage",
  destroy: "destroy"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_EMAIL_HISTORY_COVERED_ACTIONS
);

/**
 * The subject of the first row the search recording returned — read from that
 * recording, never copied, so the assertion follows a re-record. Asserting it
 * proves the search read LANDED (its result replaced the default list) rather
 * than only that the criteria was set, which keeps the debounced read in this
 * scenario instead of leaking into the next.
 */
const SEARCH_FIRST_SUBJECT = (
  searchRecording as { response: { body: { data: { subject: string }[] } } }
).response.body.data[0].subject;

/**
 * The id and subject of the ONE recorded email the single read fetches — read
 * from that read's own recording, never copied. The id is what the single read
 * boots `.withId(id)` against; the subject is the outcome AC-14 asserts.
 */
const SINGLE_EMAIL = (
  singleEmailRecording as {
    response: { body: { data: { id: string; subject: string } } };
  }
).response.body.data;

/** The single read's action ids — a query-backed read, no paging or criteria. */
const SINGLE = {
  isReady: "isReady",
  refresh: "refresh",
  destroy: "destroy"
} as const;

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the collection settles on it. */
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

async function open(world: World, scope: Parameters<World["boot"]>[1]) {
  await world.boot(CLIENT_EMAIL_HISTORY_SCENARIO, scope);
  await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/**
 * Set by the replay arrange before an `@errored` scenario's steps run: that
 * scenario keeps the signed-in Background, but its list read is a recorded 500,
 * so the boot settles on `hasError` rather than the loaded-list assertion.
 */
export const arrangeState = { errored: false };

/** Boots the collection whose boot list read the recording forces to a 500. */
async function openErrored(world: World): Promise<void> {
  await world.boot(CLIENT_EMAIL_HISTORY_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ hasError: true }));
}

/** Boots the collection under a signed-out session — it settles unavailable. */
async function openSignedOut(world: World): Promise<void> {
  await world.boot(CLIENT_EMAIL_HISTORY_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: false }));
}

/** Boots the single read onto one email, by the id its own recording addressed. */
async function openSingleEmail(world: World): Promise<void> {
  await world.boot(CLIENT_RECEIVED_EMAIL_SCENARIO, {
    actor: ScopeActorTypes.CLIENT,
    id: SINGLE_EMAIL.id
  });
  await world.fire(SINGLE.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

// -----------------------------------------------------------------------------

export const clientEmailHistorySteps = defineSteps(({ Given, When, Then }) => {
  Given("I am an authenticated client reading my own account", world =>
    arrangeState.errored
      ? openErrored(world)
      : open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make is addressed to my own email history as that client",
    world =>
      arrangeState.errored
        ? Promise.resolve()
        : world.expectMeta({ isAvailable: true })
  );

  When("I sort my history by subject", world =>
    world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.setCriteria, {
      sort: [{ field: "subject", dir: "desc" }]
    })
  );

  When("I search my history for a word", world =>
    world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.setCriteria, {
      filters: { subject: { like: "invoice" } }
    })
  );

  When("I narrow my history to the emails that were sent", world =>
    world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.setCriteria, {
      filters: { sent: { eq: true } }
    })
  );

  When("I go to the next page of my history", world =>
    world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.nextPage)
  );

  When("I come back to the previous page", world =>
    world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.prevPage)
  );

  When("I refresh my history", world =>
    world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.refresh)
  );

  When("I discard the collection", world =>
    world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.destroy)
  );

  Then("I see my email history", world =>
    settles(() => world.expectMeta({ isEmpty: false, hasError: false }))
  );

  Then("my history is ordered by subject", world =>
    settles(() =>
      world.expectContext({
        query: { sort: [{ field: "subject", dir: "desc" }] }
      })
    )
  );

  Then("my search narrows the history", world =>
    settles(() =>
      world.expectContext({ data: [{ subject: SEARCH_FIRST_SUBJECT }] })
    )
  );

  Then("only sent emails are returned", world =>
    settles(() => world.expectContext({ data: [{ meta: { isSent: true } }] }))
  );

  Then("no email-history failure is reported", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  // --- the single received email (useClientReceivedEmail) -------------------

  When("I open one of my emails", world => openSingleEmail(world));

  Given("I have opened one of my emails", world => openSingleEmail(world));

  Then("I see that email's subject", world =>
    settles(() =>
      world.expectContext({ data: { subject: SINGLE_EMAIL.subject } })
    )
  );

  Then("that email becomes available to read", world =>
    settles(() => world.expectMeta({ isAvailable: true, isEmpty: false }))
  );

  When("I refresh that email", world => world.fire(SINGLE.refresh));

  Then("when I discard that email it is released", world =>
    world.fire(SINGLE.destroy)
  );

  // --- the errored collection (AC-4, AC-21) ---------------------------------

  Then("my history reports that it errored", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  When("I inspect my history after a read has failed", async () => {});

  Then("I can read that my history errored", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  // --- the signed-out guard (AC-5/AC-16) ------------------------------------
  // The replay wall proves the absence: this scenario arms no recording, so any
  // request the collection made against the resource is an unmatched request the
  // cleanup surfaces as a capture gap and fails the scenario by name.

  Given(
    "there is no authenticated client session for my email history",
    world => openSignedOut(world)
  );

  When("my email history is used while signed out", world =>
    world
      .fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.refresh)
      .catch(() => undefined)
  );

  Then("my email history reports itself unavailable", world =>
    world.expectMeta({ isAvailable: false })
  );

  Then("no request is made against any email-history resource", world =>
    world.expectMeta({ isAvailable: false })
  );
});

export default clientEmailHistorySteps;
