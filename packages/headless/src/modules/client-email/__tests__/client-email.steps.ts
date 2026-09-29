// -----------------------------------------------------------------------------
/**
 * @module client-email/__tests__/client-email.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-email.feature`. Engine-free by construction: it imports `defineSteps`
 * and `World` and nothing else, so the same catalog can be re-registered
 * against any runner (this repo's `playgrounds/labs-nuxt` Playwright lane does
 * exactly that).
 *
 * Every handler speaks to the module through the five `World` members. There is
 * no DOM read, no request read and no import of the module's own source here.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import deleteRecording from "./scenarios/a-client-deletes-an-email-address/03/delete-clients-id-emails-id.json";
import editorOpenRecording from "./scenarios/a-client-opens-one-of-their-saved-addresses-in-the-editor/03/get-clients-id-emails-id.json";
import sendVerifyRecording from "./scenarios/a-client-resends-a-verification-email/03/patch-clients-id-emails-id-send-verify.json";
import editorChangeRecording from "./scenarios/a-client-saves-a-change-to-one-of-their-addresses/03/get-clients-id-emails-id.json";
import setDefaultRecording from "./scenarios/a-client-sets-a-default-email/03/put-clients-id-emails-id.json";
import listEditorOpenRecording from "./scenarios/saving-in-the-editor-updates-my-list/03/get-clients-id-emails-id.json";
import { findLast, first, split, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url.
 */
export const CLIENT_EMAILS_SCENARIO = "client_emails";

/** The scenario key the per-email editor (`useClientEmailManager`) boots under. */
export const CLIENT_EMAIL_MANAGER_SCENARIO = "client_email_manager";

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

export const coveredActionIds: readonly string[] = values(
  CLIENT_EMAILS_COVERED_ACTIONS
);

/** A record id segment on the wire: a uuid. */
const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The record id a recorded request addressed — the LAST id segment of its
 * path, so `…/emails/<id>/send_verify` names the email, not the verb.
 */
const recordedId = ({ request }: { request: { path: string } }): string =>
  findLast(split(first(split(request.path, "?")), "/"), segment =>
    RECORD_ID.test(segment)
  ) ?? "";

/**
 * Row identities, read off the scenario recordings that addressed them,
 * because a `World` step cannot read the collection back. Read, never copied:
 * every `pnpm fixtures:generate client-email` run records new ids, and a
 * copied id goes stale on the next run.
 */
const RECORDED = {
  deletableId: recordedId(deleteRecording),
  unverifiedId: recordedId(sendVerifyRecording),
  nonDefaultId: recordedId(setDefaultRecording),
  /** The address the editor opens by id — id and email off its own recording. */
  editId: recordedId(editorOpenRecording),
  editEmail: (
    editorOpenRecording as { response: { body: { data: { email: string } } } }
  ).response.body.data.email,
  /** The address the change scenario opens for editing — off its own recording. */
  editChangeId: recordedId(editorChangeRecording),
  /** The address the list+editor scenario opens — id off its own recording. */
  listEditorId: recordedId(listEditorOpenRecording)
} as const;

/**
 * The address the list+editor scenario saves through the editor (AC-20). A
 * literal input, not a server id: the recorded list re-read is the proof staging
 * returned this value, so the list assertion reads it back from real wire.
 */
const LIST_EDITOR_SAVED = "client-email-list-editor@example.com";

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

/** Asserts the module refused the call rather than guessing an answer. */
async function refuses(call: () => Promise<void>): Promise<void> {
  const err = await call()
    .then(() => undefined)
    .catch((e: unknown) => e);
  if (err) return;
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

/**
 * Set by the replay arrange before a scenario's steps run: whether the scenario
 * booted with NO authenticated client session (`@signed-out`). The Background
 * boots the collection either way; a signed-out boot settles on unavailable
 * rather than asserting the signed-in list loaded.
 */
/**
 * Set by the replay arrange before an `@errored` scenario's steps run. That
 * scenario keeps the signed-in Background, but its list read is a recorded 500,
 * so the boot settles on `hasError` rather than the loaded-list assertion.
 */
export const arrangeState = { errored: false };

/** Boots the collection under a signed-out session — it settles unavailable. */
async function openSignedOut(world: World): Promise<void> {
  await world.boot(CLIENT_EMAILS_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(CLIENT_EMAILS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: false }));
}

/** Boots a collection whose list read the recording forces to a 500. */
async function openErrored(world: World): Promise<void> {
  await world.boot(CLIENT_EMAILS_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(CLIENT_EMAILS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ hasError: true }));
}

/** The editor action ids the manager steps drive. */
const MANAGER = {
  isReady: "isReady",
  input: "input",
  update: "update",
  clear: "clear"
} as const;

/** Boots a fresh (new-address) editor and waits for it to accept input. */
async function openNewEditor(world: World): Promise<void> {
  await world.boot(CLIENT_EMAIL_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(MANAGER.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, isNew: true }));
}

/**
 * The context type the editor is opened `.for()` — a literal, mirroring
 * `ClientEmailContextTypes.EMAIL`, so this catalog stays engine-free.
 */
const EMAIL_CONTEXT = "email";

/** Boots the editor onto one existing address, by the id its recording addressed. */
async function openExistingEditor(world: World, id: string): Promise<void> {
  await world.boot(CLIENT_EMAIL_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT,
    context: { type: EMAIL_CONTEXT, id }
  });
  await world.fire(MANAGER.isReady);
  await settles(() => world.expectMeta({ isAvailable: true }));
}

// -----------------------------------------------------------------------------

export const clientEmailsSteps = defineSteps(({ Given, When, Then }) => {
  Given("I am an authenticated client managing my own account", world =>
    arrangeState.errored
      ? openErrored(world)
      : open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make is addressed to my own email collection as that client",
    world =>
      arrangeState.errored
        ? Promise.resolve()
        : world.expectMeta({ isAvailable: true })
  );

  When("the client adds the address {string}", (world, email) =>
    world.fire(CLIENT_EMAILS_COVERED_ACTIONS.ensure, { email })
  );

  When(
    "the client deletes the address the server allows them to delete",
    world =>
      world.fire(CLIENT_EMAILS_COVERED_ACTIONS.remove, RECORDED.deletableId)
  );

  When(
    "the client resends the verification for their unverified address",
    world =>
      world.fire(CLIENT_EMAILS_COVERED_ACTIONS.verify, RECORDED.unverifiedId)
  );

  When("the client makes their non-default address the default", world =>
    world.fire(CLIENT_EMAILS_COVERED_ACTIONS.setDefault, RECORDED.nonDefaultId)
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

  Then("I see my email addresses", world =>
    settles(() => world.expectMeta({ isEmpty: false, hasError: false }))
  );

  Then("{string} is listed", (world, email) =>
    settles(() => world.expectContext({ data: [{ email }] }))
  );

  Then("the address I chose is now my default", world =>
    settles(() =>
      world.expectContext({
        data: [{ id: RECORDED.nonDefaultId, meta: { isDefault: true } }]
      })
    )
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

  // --- the per-email editor (manager), booted fresh (a new address) ---------

  Given("I open a new email address in the editor", world =>
    openNewEditor(world)
  );

  Given(
    "I have typed a change into a new email address editor",
    async world => {
      await openNewEditor(world);
      await world.fire(MANAGER.input, { email: "prover-draft@example.com" });
      await settles(() => world.expectMeta({ isDirty: true }));
    }
  );

  When("I give the editor the address {string}", (world, email) =>
    world.fire(MANAGER.input, { email })
  );

  When("I clear the editor", world => world.fire(MANAGER.clear));

  Then("the editor accepts the address", world =>
    settles(() => world.expectMeta({ isValid: true }))
  );

  Then("the editor refuses the address", world =>
    settles(() => world.expectMeta({ isValid: false }))
  );

  Then("the editor reports it is editing a brand-new address", world =>
    settles(() => world.expectMeta({ isNew: true }))
  );

  Then("the email editor offers its form schema and UI definition", world =>
    settles(() =>
      world.expectContext!({
        schema: { type: "object" },
        uischema: { type: "VerticalLayout" }
      })
    )
  );

  Then("the editor reports no unsaved change", world =>
    settles(() => world.expectMeta({ isDirty: false }))
  );

  When("I enter {string} and save it in the editor", async (world, email) => {
    await world.fire(MANAGER.input, { email });
    await world.fire(MANAGER.update, { email });
  });

  Then("the editor reports the address saved", world =>
    settles(() => world.expectMeta({ isComplete: true }))
  );

  Given("I open one of my saved addresses in the editor", world =>
    openExistingEditor(world, RECORDED.editId)
  );

  Then("the editor is populated with that address", world =>
    settles(() =>
      world.expectContext!({ model: { email: RECORDED.editEmail } })
    )
  );

  Given("I open my saved address for a change in the editor", world =>
    openExistingEditor(world, RECORDED.editChangeId)
  );

  When("I change the address to {string} and save it", async (world, email) => {
    await world.fire(MANAGER.input, { email });
    await world.fire(MANAGER.update, { email });
  });

  // --- the errored collection (AC-3) -----------------------------------------

  Then("the email collection reports it errored", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  // --- the list and editor together (AC-20) ----------------------------------

  Given(
    "my email addresses are open in one place and the editor in another",
    async world => {
      await world.boot(CLIENT_EMAIL_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT,
        context: { type: EMAIL_CONTEXT, id: RECORDED.listEditorId }
      });
      await world.fire(
        MANAGER.isReady,
        undefined,
        CLIENT_EMAIL_MANAGER_SCENARIO
      );
      await settles(() =>
        world.expectMeta({ isAvailable: true }, CLIENT_EMAIL_MANAGER_SCENARIO)
      );
    }
  );

  When("I save a change in the editor", async world => {
    await world.fire(
      MANAGER.input,
      { email: LIST_EDITOR_SAVED },
      CLIENT_EMAIL_MANAGER_SCENARIO
    );
    await world.fire(
      MANAGER.update,
      { email: LIST_EDITOR_SAVED },
      CLIENT_EMAIL_MANAGER_SCENARIO
    );
  });

  Then("my list of addresses shows the saved value", world =>
    settles(() =>
      world.expectContext(
        { data: [{ email: LIST_EDITOR_SAVED }] },
        CLIENT_EMAILS_SCENARIO
      )
    )
  );

  // --- the signed-out guard --------------------------------------------------

  Given("there is no authenticated client session", world =>
    openSignedOut(world)
  );

  When("my client-email collection is used", world =>
    refuses(() => world.fire(CLIENT_EMAILS_COVERED_ACTIONS.refresh))
  );

  Then("the collection reports itself unavailable", world =>
    world.expectMeta({ isAvailable: false })
  );

  // No `isReady` fire here: the editor's readiness gate never settles under a
  // guest session (it waits on a client identity that never resolves), so the
  // guard asserts the unavailable meta the boot already publishes.
  Given(
    "I open the editor without an authenticated client session",
    async world => {
      await world.boot(CLIENT_EMAIL_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT
      });
      await settles(() => world.expectMeta({ isAvailable: false }));
    }
  );

  Then("the editor reports itself unavailable", world =>
    world.expectMeta({ isAvailable: false })
  );

  // The replay wall proves the absence: this scenario arms no email recording,
  // so any request the collection made against the resource is an unmatched
  // request the cleanup surfaces as a capture gap and fails the scenario by name.
  Then("no request is made against any client's email resource", world =>
    world.expectMeta({ isAvailable: false })
  );
});

export default clientEmailsSteps;
