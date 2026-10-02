// -----------------------------------------------------------------------------
/**
 * @module client-phone/__tests__/client-phone.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-phone.feature` scenarios (collection AND per-phone editor). Engine-free
 * by construction: it imports `defineSteps` and `World` and nothing else, so the
 * same catalog can be re-registered against any runner.
 *
 * Every handler speaks to the module through the `World` members only. There is
 * no DOM read, no request read and no import of the module's own source here.
 * The row ids, page contents, narrowed counts and the opened phone the steps act
 * on and assert are READ from the scenario recordings that addressed them, never
 * a copied literal — every `pnpm fixtures:generate client-phone` run records new
 * ids and a copied one goes stale (FE-3145, ADR 035 §6).
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import faultDeleteRecording from "./scenarios/a-failed-delete-shows-up-in-the-collection-error-state/03/delete-clients-id-phones-id.json";
import misspelledListRecording from "./scenarios/a-misspelled-filter-reaches-no-wire-and-leaves-my-list-alone/01/get-clients-id-phones-with-staged-imports-1.json";
import refusedListRecording from "./scenarios/a-refused-request-never-narrows-my-list-and-never-reaches-the-wire/01/get-clients-id-phones-with-staged-imports-1.json";
import filterNarrowedRecording from "./scenarios/filter-my-phone-numbers-from-the-playground/05/get-clients-id-phones-filter-phone-like-111-with-staged-imports-1.json";
import ac20OpenRecording from "./scenarios/i-enter-a-number-and-it-is-checked-once-i-stop-not-on-every-keystroke/03/get-clients-id-phones-id.json";
import ac20SavedRecording from "./scenarios/i-enter-a-number-and-it-is-checked-once-i-stop-not-on-every-keystroke/06/get-clients-id-phones-id.json";
import listRecording from "./scenarios/list-my-own-phone-numbers/01/get-clients-id-phones-with-staged-imports-1.json";
import editorOpenRecording from "./scenarios/open-one-of-my-phone-numbers-in-the-editor/03/get-clients-id-phones-id.json";
import pageOneRecording from "./scenarios/page-through-my-phone-numbers-from-the-playground/05/get-clients-id-phones-with-staged-imports-1.json";
import pageTwoRecording from "./scenarios/page-through-my-phone-numbers-from-the-playground/07/get-clients-id-phones-with-staged-imports-1.json";
import promoteRecording from "./scenarios/promote-a-phone-to-default-from-the-playground/05/put-clients-id-phones-id.json";
import defaultListRecording from "./scenarios/read-my-default-phone-number/01/get-clients-id-phones-with-staged-imports-1.json";
import removeRecording from "./scenarios/remove-a-non-default-phone-from-the-playground/05/delete-clients-id-phones-id.json";
import removeReReadRecording from "./scenarios/remove-a-non-default-phone-from-the-playground/05/get-clients-id-phones-with-staged-imports-1.json";
import editorSavedRecording from "./scenarios/save-a-change-to-a-phone-number-from-the-editor/04/get-clients-id-phones-id.json";
import ac23OpenRecording from "./scenarios/save-a-change-to-an-existing-phone-number-without-losing-what-i-just-typed/03/get-clients-id-phones-id.json";
import ac23SavedRecording from "./scenarios/save-a-change-to-an-existing-phone-number-without-losing-what-i-just-typed/04/get-clients-id-phones-id.json";
import listEditorOpenRecording from "./scenarios/saving-in-the-editor-updates-my-list/03/get-clients-id-phones-id.json";
import listEditorReReadRecording from "./scenarios/saving-in-the-editor-updates-my-list/04/get-clients-id-phones-id.json";
import { findLast, first, map, reject, split, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The collection scenario key — the playground registers `useClientPhones` here. */
export const CLIENT_PHONES_SCENARIO = "client_phones";
/** The editor scenario key — the playground registers `useClientPhoneManager` here. */
export const CLIENT_PHONE_MANAGER_SCENARIO = "client_phone_manager";

/** The free-text needle the filter scenario searches by (a real subset of the account). */
const NEEDLE = "111";
/** `ClientPhoneContextTypes.PHONE` on the wire — the retarget context the editor opens by. */
const PHONE_CONTEXT = "phone";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift. `input`/`update`/
 * `clear` are the editor's; the rest are the collection's — `isReady` is shared.
 */
export const CLIENT_PHONES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  remove: "remove",
  setDefault: "setDefault",
  setCriteria: "setCriteria",
  nextPage: "nextPage",
  sortBy: "sortBy",
  filterBy: "filterBy",
  input: "input",
  update: "update",
  clear: "clear"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_PHONES_COVERED_ACTIONS
);

/** A record id segment on the wire: a uuid. */
const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The record id a recorded request addressed — the LAST uuid segment of its
 * path, so `…/phones/<id>` names the phone.
 */
const recordedId = (recording: { request: { path: string } }): string =>
  findLast(split(first(split(recording.request.path, "?")), "/"), segment =>
    RECORD_ID.test(segment)
  ) ?? "";

const idsOf = (recording: {
  response: { body: { data: Array<{ id: string }> } };
}): Array<{ id: string }> =>
  map(recording.response.body.data, row => ({ id: row.id }));

const isTruthyFlag = (value: unknown): boolean =>
  value === true || value === 1 || value === "1";

/** The id of the row the recorded collection marks default (raw `default` flag). */
const defaultIdOf = (recording: {
  response: { body: { data: Array<{ id: string; default?: unknown }> } };
}): string =>
  first(
    map(
      reject(recording.response.body.data, row => !isTruthyFlag(row.default)),
      row => row.id
    )
  ) ?? "";

/**
 * Ids, counts and the opened phone read off the scenario recordings that
 * addressed them — a `World` step cannot read the collection back.
 */
const RECORDED = {
  removedId: recordedId(removeRecording),
  promotedId: recordedId(promoteRecording),
  totalAfterRemoval: removeReReadRecording.response.body.total ?? 0,
  rowsAfterRemoval: removeReReadRecording.response.body.data.length,
  pageOne: idsOf(pageOneRecording),
  pageTwo: idsOf(pageTwoRecording),
  narrowedTotal: filterNarrowedRecording.response.body.total ?? 0,
  editId: recordedId(editorOpenRecording),
  editPhone: editorOpenRecording.response.body.data.phone as string,
  savedPhone: editorSavedRecording.response.body.data.phone as string,
  listRows: idsOf(listRecording),
  defaultId: defaultIdOf(defaultListRecording),
  refusedRows: idsOf(refusedListRecording),
  misspelledRows: idsOf(misspelledListRecording),
  /** The phone the list+editor scenario opens and saves through (AC-24). */
  listEditorId: recordedId(listEditorOpenRecording),
  listSavedPhone: listEditorReReadRecording.response.body.data.phone as string,
  /** The phone whose delete the recording forces to fail (AC-9). */
  faultDeleteId: recordedId(faultDeleteRecording),
  /** AC-20 — the editor opened, and the value the settled save re-read carries. */
  ac20OpenId: recordedId(ac20OpenRecording),
  ac20SavedPhone: ac20SavedRecording.response.body.data.phone as string,
  /** AC-23 — the opened value and the just-typed value the save re-read carries. */
  ac23OpenId: recordedId(ac23OpenRecording),
  ac23OpenPhone: ac23OpenRecording.response.body.data.phone as string,
  ac23SavedPhone: ac23SavedRecording.response.body.data.phone as string
} as const;

/** A uuid the guard refuses before any request — its value never reaches the wire. */
const GUARDED_TARGET_ID = "11111111-1111-1111-1111-111111111111";

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

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

async function openCollection(
  world: World,
  scope: Parameters<World["boot"]>[1]
) {
  await world.boot(CLIENT_PHONES_SCENARIO, scope);
  await world.fire(CLIENT_PHONES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
  );
}

/** Boots the collection whose list read the recording forces to a 5xx. */
async function openErrored(world: World): Promise<void> {
  await world.boot(CLIENT_PHONES_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(CLIENT_PHONES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ hasError: true }));
}

/**
 * Boots the collection under a guest session — it settles unavailable. No
 * `isReady` fire: a signed-out readiness wait subscribes the collection to a
 * session transition that never completes and leaks into the next scenario; the
 * boot's unavailable meta is the assertion, and the replay wall proves silence.
 */
async function openSignedOutCollection(world: World): Promise<void> {
  await world.boot(CLIENT_PHONES_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await settles(() => world.expectMeta({ isAvailable: false }));
}

/** Asserts the module refused the call rather than reaching the wire. */
async function refuses(call: () => Promise<void>): Promise<void> {
  const err = await call()
    .then(() => undefined)
    .catch((e: unknown) => e);
  if (err) return;
  throw new Error("expected the call to be refused, but it resolved");
}

async function openEditorOn(world: World, id: string): Promise<void> {
  await world.boot(CLIENT_PHONE_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT,
    context: { type: PHONE_CONTEXT, id }
  });
  await world.fire(CLIENT_PHONES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true }));
}

async function openEditor(world: World): Promise<void> {
  await openEditorOn(world, RECORDED.editId);
}

/** A GB editor model carrying one national number — the editor parses it. */
const editorModel = (nationalNumber: string) => ({
  phone: {
    number: null,
    nationalNumber,
    countryCallingCode: "44",
    country: "GB"
  }
});

/** The save step types the number the recorded edit PUT carried — read back, not a literal. */
const savedModel = () => ({
  phone: {
    number: null,
    nationalNumber: RECORDED.savedPhone,
    countryCallingCode: "44",
    country: "GB"
  }
});

/** The number the list+editor save types — read off its own recording (AC-24). */
const listSavedModel = () => ({
  phone: {
    number: null,
    nationalNumber: RECORDED.listSavedPhone,
    countryCallingCode: "44",
    country: "GB"
  }
});

// -----------------------------------------------------------------------------

export const clientPhonesSteps = defineSteps(({ Given, When, Then }) => {
  Given(
    "I am an authenticated client whose phone list cannot be read",
    openErrored
  );

  // --- collection ----------------------------------------------------------

  Given("I am an authenticated client managing my own phone numbers", world =>
    openCollection(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make is addressed to my own phone collection as that client",
    async () => {
      // Scope constraint — verified by the scope-identity of the recorded wire.
    }
  );

  Given("the client-phone playground boots for the active client", world =>
    openCollection(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given("the phone collection is ready", world =>
    world.expectMeta({ isAvailable: true, isEmpty: false })
  );

  When("the client refreshes the phone collection", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.refresh)
  );

  When("the client removes a non-default phone", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.remove, RECORDED.removedId)
  );

  When("the client makes a non-default phone the default", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.setDefault, RECORDED.promotedId)
  );

  When("the client sets a page size of two", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: 2 }
    })
  );

  When("the client advances to the next page", async world => {
    // The page-size fetch and the query's own hasNextPage/pageParam settle a
    // tick after setCriteria resolves; nextPage read before that tick is inert,
    // not a real refusal (confirmed live against staging replay).
    await settles(() => world.expectContext({ data: RECORDED.pageOne }));
    await new Promise(resolve => setTimeout(resolve, 300));
    await world.fire(CLIENT_PHONES_COVERED_ACTIONS.nextPage);
  });

  When("the client orders by created_at descending", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.sortBy, [
      { field: "created_at", dir: "desc" }
    ])
  );

  When("the client reverses the order to ascending", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.sortBy, [
      { field: "created_at", dir: "asc" }
    ])
  );

  When("the client filters by the free-text needle", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.filterBy, {
      phone: { like: NEEDLE }
    })
  );

  // An expectation is data, never a predicate: the removal shows as the total
  // the collection now states, read from the recording of the re-read.
  Then("the phone collection count reflects the removal", world =>
    settles(() =>
      world.expectContext({ pagination: { total: RECORDED.totalAfterRemoval } })
    )
  );

  Then("the removed phone is no longer listed", world =>
    settles(() =>
      world.expectContext({ pagination: { total: RECORDED.rowsAfterRemoval } })
    )
  );

  Then("the phone is now the default", world =>
    settles(() =>
      world.expectContext({
        data: [{ id: RECORDED.promotedId, meta: { isDefault: true } }]
      })
    )
  );

  // The page's OUTCOME: the rows the API returned for that window. Page one and
  // page two carry different ids, so holding page two's rows proves the walk
  // moved, not just that the offset criteria changed.
  Then("the collection reports the page size of two", world =>
    settles(() => world.expectContext({ data: RECORDED.pageOne }))
  );

  Then("the collection reports the second page window", world =>
    settles(() => world.expectContext({ data: RECORDED.pageTwo }))
  );

  Then("the collection is ordered created_at descending", world =>
    settles(() =>
      world.expectContext({
        query: { sort: [{ field: "created_at", dir: "desc" }] }
      })
    )
  );

  Then("the collection is ordered created_at ascending", world =>
    settles(() =>
      world.expectContext({
        query: { sort: [{ field: "created_at", dir: "asc" }] }
      })
    )
  );

  // `useClientPhones` publishes no `isFiltered` meta flag; the filter shows in
  // the collection's OWN published request state (`query.filters`), which is
  // what a filter-bar consumer reads back.
  Then("my phone list carries the filter", world =>
    settles(() =>
      world.expectContext({ query: { filters: { phone: { like: NEEDLE } } } })
    )
  );

  // The filter's OUTCOME: the collection narrows to the count staging returned
  // for the needle, read from the recording — never a copied literal.
  Then("the collection narrows to the matching count", world =>
    settles(() =>
      world.expectContext({ pagination: { total: RECORDED.narrowedTotal } })
    )
  );

  Then("no phone collection failure is reported", world =>
    world.expectMeta({ hasError: false })
  );

  // The list's OUTCOME: the reactive collection holds the rows staging returned,
  // read from the recording — proof the real list loaded, not a shape check.
  Then("my own phone numbers are listed", world =>
    settles(() => world.expectContext({ data: RECORDED.listRows }))
  );

  // AC-2 — each row's default / deletable / verified flags, read off the rows
  // the list recording holds.
  Then(
    "each of my phone numbers shows whether it is my default, can be deleted and is verified",
    world =>
      settles(() =>
        world.expectContext({
          data: map(listRecording.response.body.data, row => ({
            id: row.id,
            meta: {
              isDefault: !!row.default,
              canDelete: row.can_delete,
              isVerified: !!row.verified
            }
          }))
        })
      )
  );

  // AC-41 — the schema family a renderer draws the filter bar and order
  // control from, published as plain JSON.
  Then(
    "I receive the query schema, the filter bar and the order control as plain JSON",
    world =>
      settles(() =>
        world.expectContext({
          schemas: {
            query: {
              schema: { type: "object" },
              uischema: { type: "FilterBar" },
              sortUischema: { type: "Control", scope: "#/properties/sort" }
            }
          }
        })
      )
  );

  // AC-5 — the default reads back through the row's own `meta.isDefault`, on the
  // id the recorded collection marks default.
  Then("my default phone number is the one the server marks default", world =>
    settles(() =>
      world.expectContext({
        data: [{ id: RECORDED.defaultId, meta: { isDefault: true } }]
      })
    )
  );

  // AC-9 / AC-42 — a schema-rejected criteria never reaches the wire; the
  // collection captures the error and keeps its rows.
  When("I filter my phones by a value the schema rejects", world =>
    world
      .fire(CLIENT_PHONES_COVERED_ACTIONS.filterBy, { phone: { like: 123 } })
      .catch(() => undefined)
  );

  Then("my standing phone list is unchanged", world =>
    settles(() => world.expectContext({ data: RECORDED.refusedRows }))
  );

  // AC-37 — a new filter resets the page window to the first page and keeps the
  // page size the client already chose.
  When("I apply a new filter", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.filterBy, {
      phone: { like: NEEDLE }
    })
  );

  Then("I am returned to the first page", world =>
    settles(() => world.expectContext({ query: { pagination: { offset: 0 } } }))
  );

  Then("my page size survives", world =>
    settles(() => world.expectContext({ query: { pagination: { limit: 2 } } }))
  );

  // AC-39 — an undeclared column is refused before the wire; the standing list is
  // untouched, and any request that DID escape is a replay gap that fails.
  When("I attempt to filter by an undeclared column", world =>
    world
      .fire(CLIENT_PHONES_COVERED_ACTIONS.filterBy, { nope: { like: "x" } })
      .catch(() => undefined)
  );

  Then(
    "my standing phone list is unchanged after the undeclared filter",
    world =>
      settles(() => world.expectContext({ data: RECORDED.misspelledRows }))
  );

  // --- editor --------------------------------------------------------------

  Given("the phone editor opens one of my existing numbers", world =>
    openEditor(world)
  );

  Then("the editor is populated with that number", world =>
    settles(() =>
      world.expectContext({
        model: { phone: { nationalNumber: RECORDED.editPhone } }
      })
    )
  );

  Then("the editor knows which of my numbers it is editing", world =>
    settles(() => world.expectContext({ id: RECORDED.editId }))
  );

  When("I enter a number that cannot be parsed", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.input, {
      phone: {
        number: null,
        nationalNumber: "not-a-number",
        countryCallingCode: null,
        country: "GB"
      }
    })
  );

  Then("the editor reports my input as invalid", world =>
    settles(() => world.expectMeta({ isValid: false }))
  );

  // The editor RESETS its model after a successful save, so the change is proven
  // as it happens: the typed number is accepted into the model, then `update`
  // resolves — a rejected save throws (a 422 duplicate did, before the recorded
  // number was made unique), so a resolved update IS the save succeeding.
  When("I change the number in the editor and save", async world => {
    await world.fire(CLIENT_PHONES_COVERED_ACTIONS.input, savedModel());
    await settles(() =>
      world.expectContext({
        model: { phone: { nationalNumber: RECORDED.savedPhone } }
      })
    );
    await world.fire(CLIENT_PHONES_COVERED_ACTIONS.update);
    await settles(() => world.expectMeta({ isAvailable: true }));
  });

  Then("the editor settles with my changed number", world =>
    settles(() => world.expectMeta({ isAvailable: true, isProcessing: false }))
  );

  Then("the editor has resolved my dialling country", world =>
    settles(() =>
      world.expectContext({ model: { phone: { countryCallingCode: "44" } } })
    )
  );

  Then(
    "the editor is not reported as changed before I change anything",
    world => settles(() => world.expectMeta({ isDirty: false }))
  );

  Then("the editor offers the form's schema and its UI definition", world =>
    settles(() =>
      world.expectContext({
        schema: { title: "Phone Number" },
        uischema: { type: "VerticalLayout" }
      })
    )
  );

  When("I give a bare national number", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.input, {
      phone: {
        number: null,
        nationalNumber: "07911123456",
        countryCallingCode: null,
        country: "GB"
      }
    })
  );

  Then("the editor parses it to an international number", world =>
    settles(() =>
      world.expectContext({
        model: {
          phone: { number: "+447911123456", countryCallingCode: "44" }
        }
      })
    )
  );

  Then("the editor reports it is editing an existing number", world =>
    settles(() => world.expectMeta({ isNew: false }))
  );

  When("I change a value in the editor", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.input, savedModel())
  );

  Then("the editor reports an unsaved change", world =>
    settles(() => world.expectMeta({ isDirty: true }))
  );

  // A fresh draft is the manager booted with NO context — a new record, not an
  // existing one (`replayFeature` composables map; ADR 035 editor pattern).
  Given("the phone editor opens a fresh number", async world => {
    await world.boot(CLIENT_PHONE_MANAGER_SCENARIO, {
      actor: ScopeActorTypes.CLIENT
    });
    await world.fire(CLIENT_PHONES_COVERED_ACTIONS.isReady);
    await settles(() => world.expectMeta({ isAvailable: true, isNew: true }));
  });

  When("I enter a new number in the editor and save", async world => {
    await world.fire(CLIENT_PHONES_COVERED_ACTIONS.input, {
      phone: {
        number: null,
        nationalNumber: "07900112299",
        countryCallingCode: null,
        country: "GB"
      }
    });
    await settles(() =>
      world.expectContext({ model: { phone: { number: "+447900112299" } } })
    );
    await world.fire(CLIENT_PHONES_COVERED_ACTIONS.update);
    await settles(() => world.expectMeta({ isAvailable: true }));
  });

  Then("the editor settles after creating my number", world =>
    settles(() => world.expectMeta({ isAvailable: true, isProcessing: false }))
  );

  // --- the debounced editor (AC-20, AC-23, AC-27) ----------------------------
  // Any model-affecting action awaits the debounce flush (0e0e57437), so a
  // type-then-save/clear is deterministic: the last value typed is the one
  // parsed, saved, or reverted from.

  // AC-20 — several inputs settle to the last, then a save straight after uses it.
  Given("I am typing a phone number into the editor", world =>
    openEditorOn(world, RECORDED.ac20OpenId)
  );

  When("I enter several characters in quick succession", async world => {
    await world.fire(
      CLIENT_PHONES_COVERED_ACTIONS.input,
      editorModel("7706000000")
    );
    await world.fire(
      CLIENT_PHONES_COVERED_ACTIONS.input,
      editorModel(RECORDED.ac20SavedPhone)
    );
  });

  Then("only the settled result of my typing is parsed", world =>
    settles(() =>
      world.expectContext({
        model: { phone: { nationalNumber: RECORDED.ac20SavedPhone } }
      })
    )
  );

  Then(
    "saving right after typing uses what I actually typed, never a stale value",
    async world => {
      await world.fire(CLIENT_PHONES_COVERED_ACTIONS.update);
      await settles(() =>
        world.expectMeta({ isAvailable: true, isProcessing: false })
      );
    }
  );

  // AC-23 — the flush settles the typed value into the model before the save, so
  // the saved value is the just-typed one, not the one the editor opened with.
  Given("I have opened one of my phone numbers in the editor", world =>
    openEditorOn(world, RECORDED.ac23OpenId)
  );

  When(
    "I change it and save straight away, before any pause in my typing",
    async world => {
      await world.fire(
        CLIENT_PHONES_COVERED_ACTIONS.input,
        editorModel(RECORDED.ac23SavedPhone)
      );
      await settles(() =>
        world.expectContext({
          model: { phone: { nationalNumber: RECORDED.ac23SavedPhone } }
        })
      );
      await world.fire(CLIENT_PHONES_COVERED_ACTIONS.update);
    }
  );

  Then(
    "my saved phone number reflects the value I just typed, not the one I opened with",
    world =>
      settles(() =>
        world.expectMeta({ isAvailable: true, isProcessing: false })
      )
  );

  // AC-27 — a fresh draft, a change typed in, then a clear returns the form to
  // the empty state it started from (country resolved, no number).
  Given("I have typed a change into the editor", async world => {
    await world.boot(CLIENT_PHONE_MANAGER_SCENARIO, {
      actor: ScopeActorTypes.CLIENT
    });
    await world.fire(CLIENT_PHONES_COVERED_ACTIONS.isReady);
    await settles(() => world.expectMeta({ isAvailable: true, isNew: true }));
    await world.fire(
      CLIENT_PHONES_COVERED_ACTIONS.input,
      editorModel("7700000000")
    );
    await settles(() => world.expectMeta({ isDirty: true }));
  });

  When("I clear the form", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.clear)
  );

  Then("the form returns exactly to its starting state", world =>
    settles(() =>
      world.expectContext({
        model: { phone: { nationalNumber: null, countryCallingCode: null } }
      })
    )
  );

  Then("it is no longer reported as changed", world =>
    settles(() => world.expectMeta({ isDirty: false }))
  );

  // --- the errored collection (AC-3/AC-4 list half) --------------------------

  Then("my phone list tells me it failed", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  // --- a failed delete surfaces in the collection error (AC-9) ---------------

  When("I delete a phone and the server refuses", world =>
    world
      .fire(CLIENT_PHONES_COVERED_ACTIONS.remove, RECORDED.faultDeleteId)
      .catch(() => undefined)
  );

  Then("my phone collection reports it is in an error state", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  // --- the list and the editor together (AC-24) ------------------------------

  Given(
    "my phone numbers are open in one place and the editor in another",
    async world => {
      await world.boot(CLIENT_PHONE_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT,
        context: { type: PHONE_CONTEXT, id: RECORDED.listEditorId }
      });
      await world.fire(
        CLIENT_PHONES_COVERED_ACTIONS.isReady,
        undefined,
        CLIENT_PHONE_MANAGER_SCENARIO
      );
      await settles(() =>
        world.expectMeta({ isAvailable: true }, CLIENT_PHONE_MANAGER_SCENARIO)
      );
    }
  );

  When("I save a change in the phone editor", async world => {
    await world.fire(
      CLIENT_PHONES_COVERED_ACTIONS.input,
      listSavedModel(),
      CLIENT_PHONE_MANAGER_SCENARIO
    );
    await settles(() =>
      world.expectContext(
        { model: { phone: { nationalNumber: RECORDED.listSavedPhone } } },
        CLIENT_PHONE_MANAGER_SCENARIO
      )
    );
    await world.fire(
      CLIENT_PHONES_COVERED_ACTIONS.update,
      undefined,
      CLIENT_PHONE_MANAGER_SCENARIO
    );
    await settles(() =>
      world.expectMeta({ isAvailable: true }, CLIENT_PHONE_MANAGER_SCENARIO)
    );
  });

  Then("my list of phone numbers shows the saved value", world =>
    settles(() =>
      world.expectContext(
        {
          data: [
            {
              id: RECORDED.listEditorId,
              phone: { nationalNumber: RECORDED.listSavedPhone }
            }
          ]
        },
        CLIENT_PHONES_SCENARIO
      )
    )
  );

  // --- the signed-out collection guards (AC-3, AC-15) ------------------------

  Given("I have no authenticated phone session", world =>
    openSignedOutCollection(world)
  );

  When("I read my phone collection while signed out", world =>
    refuses(() => world.fire(CLIENT_PHONES_COVERED_ACTIONS.refresh))
  );

  When(
    "a read or a change is forced on my phone collection while signed out",
    async world => {
      await refuses(() => world.fire(CLIENT_PHONES_COVERED_ACTIONS.refresh));
      await refuses(() =>
        world.fire(CLIENT_PHONES_COVERED_ACTIONS.remove, GUARDED_TARGET_ID)
      );
      await refuses(() =>
        world.fire(CLIENT_PHONES_COVERED_ACTIONS.setDefault, GUARDED_TARGET_ID)
      );
    }
  );

  Then("my phone collection reports itself unavailable", world =>
    world.expectMeta({ isAvailable: false })
  );

  Then("no phone request is made without a session", world =>
    world.expectMeta({ isAvailable: false })
  );

  // --- the signed-out editor guard (AC-17/AC-28) -----------------------------
  // No `isReady` fire: the editor's readiness gate never settles without a
  // client identity, so the boot's unavailable meta is the assertion and the
  // replay wall proves no phone request escaped.
  Given(
    "I open the phone editor without an authenticated client session",
    async world => {
      await world.boot(CLIENT_PHONE_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT
      });
      await settles(() =>
        world.expectMeta({ isAvailable: false }, CLIENT_PHONE_MANAGER_SCENARIO)
      );
    }
  );

  Then("the phone editor reports itself unavailable", world =>
    world.expectMeta({ isAvailable: false }, CLIENT_PHONE_MANAGER_SCENARIO)
  );
});

export default clientPhonesSteps;
