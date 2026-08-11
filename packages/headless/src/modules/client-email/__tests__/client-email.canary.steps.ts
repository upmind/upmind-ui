// -----------------------------------------------------------------------------
/**
 * @module client-email/__tests__/client-email.canary.steps
 * @description The executed half of the canary spec pair — the step catalog for
 * the colocated `client-email.canary.feature` (ADR-027 Am.2). Engine-free by
 * construction: it imports `defineSteps` and `World` and nothing else, so the
 * same catalog can be re-registered against any runner (this repo's
 * `playgrounds/labs-nuxt` Playwright lane does exactly that).
 *
 * Every handler speaks to the module through the five `World` members. There is
 * no DOM read, no request read and no import of the module's own source here.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url.
 */
export const CLIENT_EMAILS_SCENARIO = "client_emails";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift.
 */
export const CLIENT_EMAILS_COVERED_ACTIONS = {
  destroy: "destroy",
  ensure: "ensure",
  filterBy: "filterBy",
  isReady: "isReady",
  nextPage: "nextPage",
  prevPage: "prevPage",
  refresh: "refresh",
  remove: "remove",
  setDefault: "setDefault",
  sortBy: "sortBy",
  verify: "verify"
} as const;

export const coveredActionIds: readonly string[] = Object.values(
  CLIENT_EMAILS_COVERED_ACTIONS
);

/**
 * Row identities the recorded corpus carries, named here because a `World` step
 * cannot read the collection back.
 *
 * @see fixtures/get-clients-id-emails-case-page-1.json — the verified default,
 * the deletable unverified address, and the second unverified address.
 */
const RECORDED = {
  deletableId: "d7382485-0793-15e5-770b-81e642d59e06",
  unverifiedId: "d7382485-0793-15e5-770b-81e642d59e06",
  nonDefaultId: "4038696e-5472-1d69-285b-518d9305e7d2"
} as const;

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the collection settles on it. */
async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    try {
      return await assertion();
    } catch {
      await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
    }
  }
  return assertion();
}

/** Asserts the module refused the call rather than guessing an answer. */
async function refuses(call: () => Promise<void>): Promise<void> {
  try {
    await call();
  } catch {
    return;
  }
  throw new Error(
    "expected the collection to refuse the call, but it resolved"
  );
}

async function open(world: World, scope: Parameters<World["boot"]>[1]) {
  await world.boot(CLIENT_EMAILS_SCENARIO, scope);
  await world.fire(CLIENT_EMAILS_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
  );
}

// -----------------------------------------------------------------------------

export const clientEmailsSteps = defineSteps(({ Given, When, Then }) => {
  Given(
    "the client-emails playground is generated for the active client",
    world => open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given("a staff member acting for that client", world =>
    open(world, {
      actor: ScopeActorTypes.STAFF,
      context: { type: "client", id: "mock-uuid-1" }
    })
  );

  When("the client adds the address {string}", (world, email) =>
    world.fire(CLIENT_EMAILS_COVERED_ACTIONS.ensure, { email })
  );

  When(
    "the client deletes the address the server allows them to delete",
    world =>
      world.fire(CLIENT_EMAILS_COVERED_ACTIONS.remove, {
        id: RECORDED.deletableId
      })
  );

  When(
    "the client resends the verification for their unverified address",
    world =>
      world.fire(CLIENT_EMAILS_COVERED_ACTIONS.verify, {
        id: RECORDED.unverifiedId
      })
  );

  When("the client makes their non-default address the default", world =>
    world.fire(CLIENT_EMAILS_COVERED_ACTIONS.setDefault, {
      id: RECORDED.nonDefaultId
    })
  );

  When("the client refreshes the collection", world =>
    world.fire(CLIENT_EMAILS_COVERED_ACTIONS.refresh)
  );

  When("the client asks for a next page they do not have", world =>
    refuses(() => world.fire(CLIENT_EMAILS_COVERED_ACTIONS.nextPage))
  );

  When("the client asks for a previous page they do not have", world =>
    refuses(() => world.fire(CLIENT_EMAILS_COVERED_ACTIONS.prevPage))
  );

  When("the client discards the collection", world =>
    world.fire(CLIENT_EMAILS_COVERED_ACTIONS.destroy)
  );

  When("the client filters to unverified addresses only", world =>
    world.fire(CLIENT_EMAILS_COVERED_ACTIONS.filterBy, {
      verified: { eq: false }
    })
  );

  When("the client sorts the collection by address descending", world =>
    world.fire(CLIENT_EMAILS_COVERED_ACTIONS.sortBy, [
      { field: "email", dir: "desc" }
    ])
  );

  Then("the collection holds {int} addresses", (world, total) =>
    settles(() => world.expectContext({ pagination: { total } }))
  );

  Then("{string} is listed", (world, email) =>
    settles(() => world.expectContext({ data: [{ email }] }))
  );

  Then("the collection reports no failure", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  Then("the collection reports that it is filtered", world =>
    settles(() => world.expectMeta({ isFiltered: true }))
  );

  Then("the collection is sorted by {string} descending", (world, field) =>
    settles(() =>
      world.expectContext({ query: { sort: [{ field, dir: "desc" }] } })
    )
  );
});

export default clientEmailsSteps;
