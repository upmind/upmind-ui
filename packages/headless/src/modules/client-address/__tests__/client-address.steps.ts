// -----------------------------------------------------------------------------
/**
 * @module client-address/__tests__/client-address.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-address.feature` scenarios. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog re-registers
 * against any runner (this repo's `playgrounds/labs-nuxt` Playwright lane does
 * exactly that).
 *
 * Every handler speaks to the module through the `World` members. There is no DOM
 * read, no request read and no import of the module's own source here. The row
 * ids the steps act on are READ from the scenario recordings that addressed them
 * (ADR 035 §6), never copied literals — every `pnpm fixtures:generate` run
 * records new ids.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import switchedRegionsRecording from "./scenarios/changing-the-country-gives-me-that-countrys-regions/04/get-countries-id-regions.json";
import lockEditorRecording from "./scenarios/i-cannot-change-the-country-of-an-address-i-already-saved/04/get-clients-id-addresses-id.json";
import regionGateRegionsRecording from "./scenarios/where-this-brand-requires-a-region-i-must-give-one/04/get-countries-id-regions.json";
import pageOneRecording from "./scenarios/i-can-page-through-a-long-list-of-addresses/03/get-clients-id-addresses.json";
import pageTwoRecording from "./scenarios/i-can-page-through-a-long-list-of-addresses/05/get-clients-id-addresses.json";
import editableOneRecording from "./scenarios/i-change-the-town-of-a-saved-address-and-save-it/03/get-clients-id-addresses-id.json";
import filteredRecording from "./scenarios/i-find-an-address-by-typing-part-of-it/03/get-clients-id-addresses-filter-name-like-scenario-filter-needle.json";
import editorOneRecording from "./scenarios/i-open-one-of-my-saved-addresses-in-the-editor/03/get-clients-id-addresses-id.json";
import regionEditorRecording from "./scenarios/the-form-offers-me-real-countries-and-regions/03/get-clients-id-addresses-id.json";
import setDefaultRecording from "./scenarios/the-playground-makes-a-non-default-address-the-default/04/put-clients-id-addresses-id.json";
import removeRecording from "./scenarios/the-playground-removes-a-non-default-address/04/delete-clients-id-addresses-id.json";
import removeListRecording from "./scenarios/the-playground-removes-a-non-default-address/04/get-clients-id-addresses.json";
import faultDeleteRecording from "./scenarios/when-a-change-to-my-addresses-fails-i-am-told-not-interrupted/04/delete-clients-id-addresses-id.json";
import { findLast, first, map, split, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url.
 */
export const CLIENT_ADDRESSES_SCENARIO = "client_addresses";

/** The scenario key the per-address editor (`useClientAddressManager`) boots under. */
export const CLIENT_ADDRESS_MANAGER_SCENARIO = "client_address_manager";

/**
 * The ADDRESS context type the editor is opened `.for()` — mirrors
 * `ClientAddressContextTypes.ADDRESS` as a literal so this catalog stays
 * engine-free (it imports no module source).
 */
const ADDRESS_CONTEXT = "address";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds` so
 * the covered set and the calls that cover it cannot drift.
 */
export const CLIENT_ADDRESSES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  remove: "remove",
  setDefault: "setDefault",
  setCriteria: "setCriteria",
  nextPage: "nextPage",
  input: "input",
  update: "update",
  clear: "clear"
} as const;

/** The unique name the filter scenario arranged and narrows by (matches the generator). */
const FILTER_NEEDLE = "scenario-filter-needle";

export const coveredActionIds: readonly string[] = values(
  CLIENT_ADDRESSES_COVERED_ACTIONS
);

/** A record id segment on the wire: a uuid. */
const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The record id a recorded request addressed — the LAST uuid segment of its path. */
const recordedId = ({ request }: { request: { path: string } }): string =>
  findLast(split(first(split(request.path, "?")), "/"), segment =>
    RECORD_ID.test(segment)
  ) ?? "";

/** The row ids a list recording returned, as `{ id }` shapes for a membership match. */
const idsOf = (recording: {
  response: { body: { data: Array<{ id: string }> } };
}): Array<{ id: string }> =>
  map(recording.response.body.data, row => ({ id: row.id }));

/** The first row id a recording returned. */
const firstRowId = (recording: {
  response: { body: { data: Array<{ id: string }> } };
}): string => first(recording.response.body.data)?.id ?? "";

/**
 * Row identities and totals, read off the scenario recordings that addressed
 * them, because a `World` step cannot read the collection back.
 */
const RECORDED = {
  removedId: recordedId(removeRecording),
  defaultedId: recordedId(setDefaultRecording),
  /** The address the editor scenario opens — read off its own per-step recording. */
  editId: recordedId(editorOneRecording),
  /** The throwaway address the editor save/validate/abandon scenarios edit. */
  editableId: recordedId(editableOneRecording),
  /** The collection total AFTER the recorded remove — the post-delete count. */
  totalAfterRemove: (
    removeListRecording as { response: { body: { total: number } } }
  ).response.body.total,
  /** The narrowed total the name filter returned — the search's OUTCOME. */
  narrowedTotal: (
    filteredRecording as { response: { body: { total: number } } }
  ).response.body.total,
  /** Page-one and page-two rows — different ids, so the walk is proven to move. */
  pageOne: idsOf(pageOneRecording),
  pageTwo: idsOf(pageTwoRecording),
  /** The region-bearing address the lookups/country-switch editor opens. */
  regionEditId: recordedId(regionEditorRecording),
  /** That address's own country and region — the members AC-18 reads back. */
  regionAddrCountryId: (
    regionEditorRecording as {
      response: { body: { data: { country_id: string } } };
    }
  ).response.body.data.country_id,
  regionAddrRegionId: (
    regionEditorRecording as {
      response: { body: { data: { region_id: string } } };
    }
  ).response.body.data.region_id,
  /** The country AC-19 switches to, and a region it carries — read off the switch recording. */
  switchedCountryId: recordedId(switchedRegionsRecording),
  switchedRegionId: firstRowId(switchedRegionsRecording),
  /** The address whose delete the recording forces to fail (AC-14). */
  faultDeleteId: recordedId(faultDeleteRecording),
  /** The saved address the lock scenario (AC-21) opens. */
  lockEditId: recordedId(lockEditorRecording),
  /** The country the region-required draft (AC-20) sits on — off its own regions read. */
  regionGateCountryId: recordedId(regionGateRegionsRecording)
} as const;

/**
 * Set by the replay arrange before an `@errored` scenario's steps run. That
 * scenario keeps the signed-in Background, but its list read is a recorded 5xx,
 * so the boot settles on `hasError` rather than the loaded-list assertion.
 */
export const arrangeState = { errored: false };

/** A uuid the guard refuses before any request — its value never reaches the wire. */
const GUARDED_TARGET_ID = "11111111-1111-1111-1111-111111111111";

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
  await world.boot(CLIENT_ADDRESSES_SCENARIO, scope);
  await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
  );
}

/** Boots the collection whose list read the recording forces to a 5xx. */
async function openErrored(world: World): Promise<void> {
  await world.boot(CLIENT_ADDRESSES_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ hasError: true }));
}

/** Boots the collection under a guest session — it settles unavailable. */
async function openSignedOutCollection(world: World): Promise<void> {
  await world.boot(CLIENT_ADDRESSES_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.isReady);
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

/** The editor input is debounced; a save fired before it settles drops the value. */
const DEBOUNCE_MS = 900;
/** The town the save track types — the value this scenario's capture recorded. */
const EDITED_TOWN = { city: "Manchester" } as const;
/** The address type the save track chooses — Office, the recorded PUT value. */
const EDITED_TYPE = 2;

/** Opens the per-address editor over one of the client's own saved addresses. */
async function openEditor(world: World, id: string): Promise<void> {
  await world.boot(CLIENT_ADDRESS_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT,
    context: { type: ADDRESS_CONTEXT, id }
  });
  await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true }));
}

/** Opens a blank draft — the manager booted with no context resolves `.fresh()`. */
async function openDraft(world: World): Promise<void> {
  await world.boot(CLIENT_ADDRESS_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true }));
}

/** Types a partial model into the editor, lets the debounce settle, and saves. */
async function saveEdit(
  world: World,
  patch: Record<string, unknown>
): Promise<void> {
  await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.input, patch);
  await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
  await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.update);
  await settles(() => world.expectMeta({ isAvailable: true }));
}

// -----------------------------------------------------------------------------

export const clientAddressesSteps = defineSteps(({ Given, When, Then }) => {
  Given("I am signed in as a client managing my addresses", world =>
    arrangeState.errored
      ? openErrored(world)
      : open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given("my account has saved postal addresses", world =>
    arrangeState.errored
      ? Promise.resolve()
      : world.expectMeta({ isEmpty: false })
  );

  Given("I am an authenticated client on the addresses page", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  When("I refresh the address collection", world =>
    world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.refresh)
  );

  When("I remove a non-default address", world =>
    world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.remove, RECORDED.removedId)
  );

  When("I make the non-default address my default", world =>
    world.fire(
      CLIENT_ADDRESSES_COVERED_ACTIONS.setDefault,
      RECORDED.defaultedId
    )
  );

  Then("the collection shows the address I removed is gone", world =>
    settles(() =>
      world.expectContext({ pagination: { total: RECORDED.totalAfterRemove } })
    )
  );

  Then("the newly defaulted address is now the default", world =>
    settles(() =>
      world.expectContext({
        data: [{ id: RECORDED.defaultedId, meta: { isDefault: true } }]
      })
    )
  );

  Then("no failure is reported", world =>
    world.expectMeta({ hasError: false })
  );

  // --- the per-address editor (AC-17) ---------------------------------------

  Given("I am editing one of my saved addresses", world =>
    openEditor(world, RECORDED.editId)
  );

  Then(
    "the editor shows that saved address and reports it is not new",
    async world => {
      await settles(() => world.expectMeta({ isNew: false }));
      if (!world.expectContext)
        throw new Error("this World cannot read context — no model to assert");
      await settles(() =>
        world.expectContext!({ model: { id: RECORDED.editId } })
      );
    }
  );

  // --- the editor save / validate / abandon (AC-22/23/25/28) -----------------

  Given("I am editing a saved address of mine", world =>
    openEditor(world, RECORDED.editableId)
  );

  When("I change the town and save", world =>
    saveEdit(world, { address: EDITED_TOWN })
  );

  Then("the editor shows the town I saved", world =>
    settles(() =>
      world.expectContext!({ model: { address: { city: EDITED_TOWN.city } } })
    )
  );

  When("I change the address type and save", world =>
    saveEdit(world, { type: EDITED_TYPE })
  );

  Then("the editor shows the type I saved", world =>
    settles(() => world.expectContext!({ model: { type: EDITED_TYPE } }))
  );

  When("I clear the postcode", async world => {
    await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.input, {
      address: { postcode: "" }
    });
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
  });

  Then("the editor refuses to save an incomplete address", async world => {
    await settles(() => world.expectMeta({ isValid: false }));
    await Promise.resolve(
      world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.update)
    ).catch(() => undefined);
    await settles(() => world.expectMeta({ isValid: false }));
  });

  When("I change the town and then discard my changes", async world => {
    await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.input, {
      address: { city: EDITED_TOWN.city }
    });
    await settles(() => world.expectMeta({ isDirty: true }));
    // Let the debounced input fully drain before discarding: a clear() issued
    // while a debounced write is still pending re-dirties the model after it.
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS * 2));
    await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.clear);
  });

  Then("the editor shows the address as it was loaded", world =>
    settles(() => world.expectMeta({ isDirty: false }))
  );

  // --- the editor for a brand new address (AC-16/AC-24) ----------------------

  Given("I am starting a brand new address", world => openDraft(world));

  Then("the editor gives me an empty form that reports itself new", world =>
    settles(() => world.expectMeta({ isNew: true, isAvailable: true }))
  );

  When("I provide a new address and save it", world =>
    saveEdit(world, {
      name: "Prover New Address",
      address: { address1: "1 Prover Way", city: "Leeds", postcode: "LS1 1AA" }
    })
  );

  Then("the new address is added and the editor is no longer new", world =>
    settles(() => world.expectMeta({ isNew: false }))
  );

  // --- the collection: default, filter, pagination (AC-5/7/8/9) --------------

  Then("one of my addresses is shown as my default", world =>
    settles(() =>
      world.expectContext({ data: [{ meta: { isDefault: true } }] })
    )
  );

  When("I search my addresses for part of one", world =>
    world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.setCriteria, {
      filters: { name: { like: FILTER_NEEDLE } }
    })
  );

  Then("only the addresses matching my search remain", async world => {
    await settles(() =>
      world.expectContext({
        query: { filters: { name: { like: FILTER_NEEDLE } } }
      })
    );
    await settles(() =>
      world.expectContext({ pagination: { total: RECORDED.narrowedTotal } })
    );
  });

  When("I set my address page size to one", world =>
    world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: 1 }
    })
  );

  Then("I am shown the first page of my addresses", world =>
    settles(() => world.expectContext({ data: RECORDED.pageOne }))
  );

  When("I move to the next page of addresses", async world => {
    // The page fetch settles a tick after setCriteria resolves; nextPage read
    // before that tick is inert, so wait for page one before advancing.
    await settles(() => world.expectContext({ data: RECORDED.pageOne }));
    await new Promise(resolve => setTimeout(resolve, 300));
    await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.nextPage);
  });

  Then("I am shown the next page of my addresses", world =>
    settles(() => world.expectContext({ data: RECORDED.pageTwo }))
  );

  // --- the editor: lookups, dependent fields, schema (AC-18/19/27) -----------

  Given("I am editing an address that has a region", world =>
    openEditor(world, RECORDED.regionEditId)
  );

  Then("the form offers me countries and regions to choose from", world =>
    settles(() =>
      world.expectContext!({
        countries: [{ id: RECORDED.regionAddrCountryId }],
        regions: [{ id: RECORDED.regionAddrRegionId }]
      })
    )
  );

  When("I change the country to another", async world => {
    await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.input, {
      address: { countryId: RECORDED.switchedCountryId }
    });
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  Then("I am offered the new country's regions", world =>
    settles(() =>
      world.expectContext!({ regions: [{ id: RECORDED.switchedRegionId }] })
    )
  );

  Then("the region I had chosen is cleared", world =>
    settles(() =>
      world.expectContext!({ model: { address: { regionId: null } } })
    )
  );

  Then("the address editor offers its form schema and UI definition", world =>
    settles(() =>
      world.expectContext!({
        schema: { type: "object" },
        uischema: { type: "VerticalLayout" }
      })
    )
  );

  // --- the brand-gated editor: region required (AC-20), country locked (AC-21) --
  // The forbidding brand config is armed over the Background by the replay arrange
  // (@region-gate / @lock-gate), so these Givens only mark the state the arrange set.

  Given("this brand requires a region on every address", () =>
    Promise.resolve()
  );

  When("I complete the address form without a region", async world => {
    await openDraft(world);
    await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.input, {
      name: "Prover Region Gate",
      address: {
        address1: "1 Region Way",
        city: "Guildford",
        postcode: "GU1 1AA",
        countryId: RECORDED.regionGateCountryId
      }
    });
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
  });

  Then("a region is required of me", world =>
    settles(() => world.expectMeta({ isValid: false }))
  );

  Given("this brand does not allow saved addresses to be changed freely", () =>
    Promise.resolve()
  );

  When("I open one of my existing addresses to edit", world =>
    openEditor(world, RECORDED.lockEditId)
  );

  // "Shown but locked": the country Control is still drawn (its saved value is
  // visible), but the addresses-locked brand gate disables it — the editor's
  // uischema carries an always-on DISABLE rule on the country field. The lock
  // lives in the uischema, not the model, so this reads the uischema.
  Then("the country is shown but locked", world =>
    settles(() =>
      world.expectContext!({
        uischema: {
          elements: [
            {
              options: {
                detail: {
                  elements: [
                    {
                      scope: "#/properties/countryId",
                      rule: { effect: "DISABLE" }
                    }
                  ]
                }
              }
            }
          ]
        }
      })
    )
  );

  // --- the collection's published filter-bar/sort schema channel (AC-41/43) ---

  Then(
    "I am offered a filter-bar description and the sort choices from one place",
    world =>
      world.expectContext({
        schemas: {
          query: {
            uischema: {
              type: "FilterBar",
              elements: [
                {
                  scope: "#/properties/filters/properties/name/properties/like"
                }
              ]
            },
            sortUischema: { scope: "#/properties/sort" }
          }
        }
      })
  );

  Then("my address list opens with the declared sort and paging", world =>
    world.expectContext({ query: { pagination: { limit: 0, offset: 0 } } })
  );

  // --- the errored collection (AC-4 list half) -------------------------------

  Then("the address collection reports it errored", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  // --- a change that fails (AC-14) -------------------------------------------

  Given("deleting an address will fail", async () => {
    // The recording forces the DELETE to a 5xx; nothing to arrange in the World.
  });

  When("I delete that address", world =>
    world
      .fire(CLIENT_ADDRESSES_COVERED_ACTIONS.remove, RECORDED.faultDeleteId)
      .catch(() => undefined)
  );

  Then("I am shown why it failed, by the addresses themselves", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  Then("nothing I was doing is thrown off course", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  // --- the signed-out collection guard (AC-3/11/13/34) -----------------------

  Given("I am not signed in", world => openSignedOutCollection(world));

  When("something tries to open my saved addresses", world =>
    refuses(() => world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.refresh))
  );

  Then("no lookup of my addresses happens", world =>
    world.expectMeta({ isAvailable: false })
  );

  Then("my addresses are reported as unavailable", world =>
    world.expectMeta({ isAvailable: false })
  );

  When("something tries to delete an address of mine", world =>
    refuses(() =>
      world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.remove, GUARDED_TARGET_ID)
    )
  );

  Then("no deletion is attempted at all", world =>
    world.expectMeta({ isAvailable: false })
  );

  When("something tries to change my default address", world =>
    refuses(() =>
      world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.setDefault, GUARDED_TARGET_ID)
    )
  );

  Then("no change is attempted at all", world =>
    world.expectMeta({ isAvailable: false })
  );

  // The editor booted under a guest session: no `isReady` fire, whose readiness
  // gate never settles without a client identity — the boot's unavailable meta
  // is the assertion, and the replay wall proves no address request escaped.
  When(
    "a signed-out visitor tries to open an address to manage",
    async world => {
      await world.boot(CLIENT_ADDRESS_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT
      });
      await settles(() =>
        world.expectMeta(
          { isAvailable: false },
          CLIENT_ADDRESS_MANAGER_SCENARIO
        )
      );
    }
  );

  Then("the address editor is not theirs to open", world =>
    world.expectMeta({ isAvailable: false }, CLIENT_ADDRESS_MANAGER_SCENARIO)
  );

  // --- the signed-out form guard (AC-26 form half) ---------------------------

  Given(
    "I open the address form without an authenticated client session",
    async world => {
      await world.boot(CLIENT_ADDRESS_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT
      });
      await settles(() =>
        world.expectMeta(
          { isAvailable: false },
          CLIENT_ADDRESS_MANAGER_SCENARIO
        )
      );
    }
  );

  Then("the form reports itself unavailable", world =>
    world.expectMeta({ isAvailable: false }, CLIENT_ADDRESS_MANAGER_SCENARIO)
  );

  Then("no request is made against any address resource", world =>
    world.expectMeta({ isAvailable: false }, CLIENT_ADDRESS_MANAGER_SCENARIO)
  );
});

export default clientAddressesSteps;
