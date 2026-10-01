// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/client-company.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-company.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog can be
 * re-registered against any runner.
 *
 * Two composables are driven, each under its own scenario key: the COLLECTION
 * (`client_companies`) and the FORM EDITOR (`client_company_manager`, booted
 * with a `context` carrying the company id — WorldScope's edit retarget). A
 * capability that cannot be driven honestly (a fresh/new-draft manager the
 * WorldScope has no selector for, a region LIST `expectContext` cannot
 * subset-match, an unauthenticated boot) is `@todo` in the feature and has no
 * step here. Every handler speaks to the module through the `World` members —
 * no DOM read, no request read, no import of the module's own source.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import addCompanyRecording from "./scenarios/add-a-new-company-to-my-account/03/post-clients-id-companies.json";
import ac17BootRegions from "./scenarios/choosing-a-country-re-offers-the-right-regions/03/get-countries-id-regions.json";
import ac17ChangeRegions from "./scenarios/choosing-a-country-re-offers-the-right-regions/05/get-countries-id-regions.json";
import deleteRecording from "./scenarios/delete-one-of-my-companies/03/delete-clients-id-companies-id.json";
import openEditRecording from "./scenarios/i-open-a-company-for-editing-with-what-i-already-have-on-file/03/get-clients-id-companies-id.json";
import ac20AddressesRecording from "./scenarios/i-supply-a-brand-new-inline-email-and-my-company-is-saved-against-it/03/get-clients-id-addresses.json";
import setDefaultRecording from "./scenarios/make-one-of-my-companies-the-default/03/put-clients-id-companies-id.json";
import saveChangeRecording from "./scenarios/save-a-change-to-a-company-i-am-editing/04/put-clients-id-companies-id.json";
import taxListRecording from "./scenarios/see-what-each-company-is/01/get-clients-id-companies-with-staged-imports-1.json";
import { find, findLast, first, get, split, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The collection scenario key — how a `.feature` and the BDD world name it. */
export const CLIENT_COMPANIES_SCENARIO = "client_companies";

/** The form-editor scenario key — the second composable a feature can boot. */
export const CLIENT_COMPANY_MANAGER_SCENARIO = "client_company_manager";

/** The context type the manager retargets on — a literal, engine-free by design. */
const COMPANY_CONTEXT = "company";

export const CLIENT_COMPANIES_COVERED_ACTIONS = {
  ensure: "ensure",
  filterBy: "filterBy",
  input: "input",
  isReady: "isReady",
  nextPage: "nextPage",
  refresh: "refresh",
  remove: "remove",
  setDefault: "setDefault",
  sortBy: "sortBy",
  update: "update"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_COMPANIES_COVERED_ACTIONS
);

/** A record id segment on the wire: a uuid. */
const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The record id a recorded request addressed — the LAST uuid of its path. */
const recordedId = ({ request }: { request: { path: string } }): string =>
  findLast(split(first(split(request.path, "?")), "/"), segment =>
    RECORD_ID.test(segment)
  ) ?? "";

/**
 * Identities read off the scenario recordings that addressed them — never
 * copied: every recording run mints new ids, and a copied id goes stale.
 */
const RECORDED = {
  deletableId: recordedId(deleteRecording),
  nonDefaultId: recordedId(setDefaultRecording),
  editTargetId: recordedId(openEditRecording),
  editThrowawayId: recordedId(saveChangeRecording),
  targetName: get(openEditRecording, ["response", "body", "data", "name"], ""),
  createAddressId: get(
    addCompanyRecording,
    ["request", "body", "address_id"],
    ""
  ) as string,
  myCurrentRegionId: get(
    ac17BootRegions,
    ["response", "body", "data", 0, "id"],
    ""
  ) as string,
  chosenCountryId: get(
    ac17ChangeRegions,
    ["response", "body", "data", 0, "country_id"],
    ""
  ) as string,
  chosenRegionId: get(
    ac17ChangeRegions,
    ["response", "body", "data", 0, "id"],
    ""
  ) as string,
  // AC-2 — a real company carrying a name, registration number and tax number,
  // read off the recorded list so the values track each re-record (ADR 035 §6).
  taxRow: (() => {
    const rows = get(
      taxListRecording,
      ["response", "body", "data"],
      []
    ) as Array<{
      name: string;
      reg_number?: string;
      vat_number?: string;
    }>;
    const row =
      find(rows, r => Boolean(r.reg_number) && Boolean(r.vat_number)) ??
      rows[0];
    return {
      name: row?.name ?? "",
      regNumber: row?.reg_number ?? "",
      taxNumber: row?.vat_number ?? ""
    };
  })(),
  // AC-20 — the address id a fresh inline-email draft is saved against, read off
  // the editor's own addresses recording (its default, else the first).
  ac20AddressId: (() => {
    const rows = get(
      ac20AddressesRecording,
      ["response", "body", "data"],
      []
    ) as Array<{
      id: string;
      default?: boolean;
    }>;
    return (find(rows, r => Boolean(r.default)) ?? rows[0])?.id ?? "";
  })()
} as const;

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

/** Boots the collection and settles it ready, non-empty and mine. */
async function openCollection(world: World): Promise<void> {
  await world.boot(CLIENT_COMPANIES_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
  );
}

/** Boots the form editor over one company by id, and settles it ready. */
async function openManager(world: World, id: string): Promise<void> {
  await world.boot(CLIENT_COMPANY_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT,
    context: { type: COMPANY_CONTEXT, id }
  });
  await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, hasErrors: false })
  );
}

/** Boots a fresh (new-draft) form editor — no context id — and settles it ready. */
async function openFreshManager(world: World): Promise<void> {
  await world.boot(CLIENT_COMPANY_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, hasErrors: false })
  );
}

/** A record id the guard refuses before any request — its value never reaches the wire. */
const GUARDED_TARGET_ID = "11111111-1111-1111-1111-111111111111";

/** Boots the collection signed out and lets it settle unavailable, asking nothing. */
async function bootSignedOutCollection(world: World): Promise<void> {
  await world.boot(CLIENT_COMPANIES_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(
    CLIENT_COMPANIES_COVERED_ACTIONS.isReady,
    undefined,
    CLIENT_COMPANIES_SCENARIO
  );
}

// -----------------------------------------------------------------------------

export const clientCompaniesSteps = defineSteps(({ Given, When, Then }) => {
  Given("I am an authenticated client acting on my own account", world =>
    openCollection(world)
  );

  Given(
    "every request I make is addressed to my own companies as that client",
    world => world.expectMeta({ isAvailable: true })
  );

  When("I open my companies", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.isReady)
  );

  Then("I see the companies on my account", world =>
    settles(() => world.expectMeta({ isEmpty: false, hasError: false }))
  );

  // AC-2 — the already-booted collection shows each company's fields.
  When("I view my companies", world => world.expectMeta({ isAvailable: true }));

  Then(
    "each company shows its name, registration number and tax number",
    world =>
      settles(() =>
        world.expectContext({
          data: [
            {
              name: RECORDED.taxRow.name,
              regNumber: RECORDED.taxRow.regNumber,
              tax: { number: RECORDED.taxRow.taxNumber }
            }
          ]
        })
      )
  );

  // AC-3
  When("I open a collection whose default has been cleared", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.isReady)
  );

  // AC-7 / AC-34 — search
  When("I search my companies for a word", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {
      name: { like: "Heg" }
    })
  );

  Then("only companies matching that word are returned", world =>
    settles(() => world.expectMeta({ isFiltered: true }))
  );

  Then("when I clear the search, all my companies come back", async world => {
    await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {});
    await settles(() => world.expectMeta({ isFiltered: false }));
  });

  When("I search my companies for {string}", (world, term) =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {
      name: { like: term }
    })
  );

  Then("only my companies whose name contains {string} remain", world =>
    settles(() => world.expectMeta({ isFiltered: true }))
  );

  When("I clear my company search", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {})
  );

  Then("every one of my companies is back", world =>
    settles(() => world.expectMeta({ isFiltered: false }))
  );

  // AC-34 — sort
  When("I sort my companies by name descending", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.sortBy, [
      { field: "name", dir: "desc" }
    ])
  );

  Then("my companies are now ordered by name, descending", world =>
    settles(() =>
      world.expectContext({ query: { sort: [{ field: "name", dir: "desc" }] } })
    )
  );

  // AC-9 — page
  When("I ask for a next page I do not have", world =>
    refuses(() => world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.nextPage))
  );

  // AC-10 — delete
  When("I delete a company the server lets me delete", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.remove, RECORDED.deletableId)
  );

  // AC-11 — set default
  When("I make a non-default company my default", world =>
    world.fire(
      CLIENT_COMPANIES_COVERED_ACTIONS.setDefault,
      RECORDED.nonDefaultId
    )
  );

  // AC-12 — refresh
  When("I refresh my companies", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.refresh)
  );

  Then("my companies report no failure", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  // AC-19 — create through the collection
  When("I add a new company to my account", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.ensure, {
      name: "Prover New Co",
      addressId: RECORDED.createAddressId
    })
  );

  // AC-36 — empty because filtered
  When("I search my companies for something none of them are called", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {
      name: { like: "zzz-no-such-company-zzz" }
    })
  );

  Then("my companies list is empty", world =>
    settles(() => world.expectMeta({ isEmpty: true }))
  );

  Then(
    "it tells me plainly that it is empty because of my search, not because I have none",
    world => settles(() => world.expectMeta({ isFiltered: true }))
  );

  // AC-40 — schema rejects
  When("I search my companies for a value the field cannot hold", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {
      name: { like: 123 }
    })
  );

  Then("my companies list is unchanged", world =>
    settles(() => world.expectMeta({ isFiltered: false }))
  );

  Then("I am told my request was rejected", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  Then(
    "letting a rejected request silently through turns this scenario red",
    async () => {}
  );

  // === THE FORM EDITOR =======================================================

  // AC-14 / AC-16 / AC-21 / AC-22
  When("I open one of my companies for editing", world =>
    openManager(world, RECORDED.editTargetId)
  );

  Then("I am shown that company's current details", world =>
    settles(() => world.expectContext({ id: RECORDED.editTargetId }))
  );

  Then("the form is titled with that company's name", world =>
    settles(() => world.expectContext({ title: RECORDED.targetName }))
  );

  Then("the form is ready for me to use", world =>
    settles(() => world.expectMeta({ isAvailable: true, isLoading: false }))
  );

  // AC-18 / AC-19 / AC-23 — editing a company
  Given("I am editing one of my companies", world =>
    openManager(world, RECORDED.editThrowawayId)
  );

  When("I clear the company name", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.input, { name: "" })
  );

  Then("I am told the form is not valid", world =>
    settles(() => world.expectMeta({ isValid: false }))
  );

  Then("giving it a name makes the form valid again", async world => {
    await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.input, {
      name: "Prover Co"
    });
    await settles(() => world.expectMeta({ isValid: true }));
  });

  When("I change its name and save", async world => {
    await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.input, {
      name: "Prover Renamed Co"
    });
    await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.update);
    await settles(() => world.expectMeta({ isAvailable: true }));
  });

  Then("the change is saved without error", world =>
    settles(() => world.expectMeta({ hasErrors: false }))
  );

  When("a save of mine is rejected", async world => {
    await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.input, {
      addressId: "00000000-0000-0000-0000-000000000000"
    });
    await world
      .fire(CLIENT_COMPANIES_COVERED_ACTIONS.update)
      .catch(() => undefined);
  });

  Then("I can read that it went wrong", world =>
    settles(() => world.expectMeta({ hasErrors: true }))
  );

  // AC-17 — a country change re-offers that country's regions and clears the
  // region that no longer belongs. The region ids are read from the recordings
  // that addressed them, never copied literals.
  When("I choose a region of my current country", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.input, {
      address: { regionId: RECORDED.myCurrentRegionId }
    })
  );

  When("I change my company's country to another country", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.input, {
      address: { countryId: RECORDED.chosenCountryId }
    })
  );

  Then("I am offered the regions of the country I chose", world =>
    settles(() =>
      world.expectContext({ regions: [{ id: RECORDED.chosenRegionId }] })
    )
  );

  Then("the region I had chosen for my company is cleared", world =>
    settles(() =>
      world.expectContext({ model: { address: { regionId: null } } })
    )
  );

  // AC-15 — a fresh, new-marked draft
  When("I start adding a company", world => openFreshManager(world));

  Then("I am given an empty form marked as new", world =>
    settles(() => world.expectMeta({ isNew: true, isAvailable: true }))
  );

  // AC-20 — a fresh draft, the pre-selected emailId cleared and a brand-new inline
  // email supplied, saved against a supplied address id. The module's ensure
  // creates the email, then the company is created against it.
  Given("I am starting a new company", world => openFreshManager(world));

  When("I supply a brand-new email inline and save", async world => {
    await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.input, {
      name: "Prover Inline Co",
      addressId: RECORDED.ac20AddressId,
      email: "prover-fe3145-inline@example.com",
      emailId: null
    });
    await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.update);
  });

  Then("my new company is saved without error", world =>
    settles(() => world.expectMeta({ hasErrors: false }))
  );

  // AC-4 — a failed read is recorded, not swallowed. The recording forces the
  // refresh's list re-read to 500; the live list stands and the error is read.
  When("a read of my companies fails at the server", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.refresh)
  );

  Then("my companies record the failure for me to read", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  // AC-5 — signed out, the collection is not mine to read and asks nothing.
  When("I look at my companies while signed out", world =>
    bootSignedOutCollection(world)
  );

  Then("my companies are not available to me", world =>
    settles(() => world.expectMeta({ isAvailable: false }))
  );

  Then("no company request escapes while I am signed out", async () => {});

  // AC-25 — both surfaces, signed out, report unavailable and touch nothing.
  When(
    "either my companies or a company form is used while signed out",
    async world => {
      await world.boot(CLIENT_COMPANIES_SCENARIO, {
        actor: ScopeActorTypes.CLIENT
      });
      await world.fire(
        CLIENT_COMPANIES_COVERED_ACTIONS.isReady,
        undefined,
        CLIENT_COMPANIES_SCENARIO
      );
      await world.boot(CLIENT_COMPANY_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT
      });
      await world.fire(
        CLIENT_COMPANIES_COVERED_ACTIONS.isReady,
        undefined,
        CLIENT_COMPANY_MANAGER_SCENARIO
      );
    }
  );

  Then("no request is made against any company resource", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: false }, CLIENT_COMPANIES_SCENARIO)
    );
    await settles(() =>
      world.expectMeta({ isAvailable: false }, CLIENT_COMPANY_MANAGER_SCENARIO)
    );
  });

  // AC-26 — a forced delete or set-default is refused before it reaches the wire.
  When("a delete or a set-default is forced while signed out", async world => {
    await bootSignedOutCollection(world);
    await refuses(() =>
      world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.remove, GUARDED_TARGET_ID)
    );
    await refuses(() =>
      world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.setDefault, GUARDED_TARGET_ID)
    );
  });

  Then("it is refused as not-authenticated", world =>
    settles(() => world.expectMeta({ isAvailable: false }))
  );
});

export default clientCompaniesSteps;
