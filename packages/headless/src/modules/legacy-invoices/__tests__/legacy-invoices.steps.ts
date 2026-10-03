// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/__tests__/legacy-invoices.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * DRIVEN `legacy-invoices.feature` scenarios use. Engine-free by construction:
 * it imports `defineSteps` and `World` and nothing else, so the same catalog
 * re-registers against any runner.
 *
 * The COLLECTION (`useLegacyInvoices`) is booted under `LEGACY_INVOICES_SCENARIO`;
 * the single read (`useLegacyInvoice`, a `.withId(id)` read) boots under
 * `LEGACY_INVOICE_SCENARIO` — `world.boot(key, { actor, id })` resolves to
 * `.as(actor).withId(id)` (WorldScope.id), the `invoices.steps.ts` precedent.
 *
 * A client-self archive is recorded the legacy "login as" way — the STAFF token
 * lists `api/admin/import_invoice_data`, picks a row's owning client, and mints
 * that client's own token via `POST api/admin/clients/${clientId}/access_token`
 * (vue-app `impersonateClient`). States staging does not already hold — a
 * multi-page archive (ordering / paging / reset / clamp) and an overdue row — are
 * ARRANGED through the staging import factory (`tests/fixtures/imports/`): ONE
 * dedicated synthetic client is imported committed and KEPT, found each run by
 * the `LI-` number marker (`legacy-invoices.import-fixture.ts`). Availability is
 * driven off the module's own client availability read. All these scenarios are
 * REGISTERED and driven here. The one capability no import can carry — a credited
 * row — keeps a `@todo` scenario with its verified blocker; staged, proforma and
 * the un-built-PDF scenarios were CUT (operator rulings 2026-10-02).
 *
 * Every handler speaks to the module through the `World` members only — no DOM
 * read, no request read, no import of the module's own source. Ids, totals and
 * states a step asserts are READ from the scenario recording that addressed
 * them (ADR 035 §6), never a copied literal that goes stale on re-record.
 *
 * @reference `packages/headless/src/modules/invoices/__tests__/invoices.steps.ts`
 * and `client-email.steps.ts` — public test-infrastructure of sibling modules,
 * read while authoring this one, not this module's own implementation source.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import ac7PaidRecording from "./scenarios/a-paid-imported-invoice-reports-itself-paid/02/get-import-invoice-data-id-with-staged-imports-1.json";
import ac7OverdueRecording from "./scenarios/an-overdue-imported-invoice-reports-itself-overdue/02/get-import-invoice-data-id-with-staged-imports-1.json";
import ac14LastRecording from "./scenarios/asking-beyond-my-archives-last-page-lands-me-on-the-last-page/03/get-import-invoice-data.json";
import ac4Page1Recording from "./scenarios/i-am-given-one-page-of-my-archive-at-a-time-with-the-servers-total/01/get-import-invoice-data.json";
import ac4Page2Recording from "./scenarios/i-am-given-one-page-of-my-archive-at-a-time-with-the-servers-total/04/get-import-invoice-data.json";
import ac8Recording from "./scenarios/i-download-an-imported-invoices-document/02/get-import-invoice-data-id-with-staged-imports-1.json";
import ac6OpenRecording from "./scenarios/i-open-one-of-my-imported-invoices/02/get-import-invoice-data-id-with-staged-imports-1.json";
import ac1ListRecording from "./scenarios/i-read-my-archive-of-imported-invoices/01/get-import-invoice-data.json";
import ac2MatchRecording from "./scenarios/narrowing-my-archive-returns-only-the-invoices-that-match/02/get-import-invoice-data-filter-number-like-00001.json";
import ac2ShortfallRecording from "./scenarios/narrowing-my-archive-returns-only-the-invoices-that-match/04/get-import-invoice-data-filter-number-like-zzznope.json";
import ac14ResetRecording from "./scenarios/narrowing-or-re-ordering-my-archive-returns-it-to-its-first-page/03/get-import-invoice-data.json";
import ac3DefaultRecording from "./scenarios/ordering-my-archive-reorders-the-invoices-i-am-given/01/get-import-invoice-data.json";
import ac3AmountRecording from "./scenarios/ordering-my-archive-reorders-the-invoices-i-am-given/03/get-import-invoice-data.json";
import { first, last, split, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** One recorded list read: the rows staging returned and its own total. */
type ListRecording = {
  request: { path: string };
  response: { body: { total: number | null; data: Array<{ id: string }> } };
};

/** The row and total a recorded archive read addressed — read, never copied. */
function archiveFacts(recording: ListRecording): {
  total: number;
  firstId: string;
} {
  const body = recording.response.body;
  return {
    total: Number(body.total ?? 0),
    firstId: first(body.data)?.id ?? ""
  };
}

/**
 * The CONTAINS value a recorded `filter[number|like]` request narrowed by — the
 * `%value%` the module serialises, unwrapped back to what the reader asked for.
 */
function likeValueOf(recording: ListRecording): string {
  const query = split(recording.request.path, "?")[1] ?? "";
  const wrapped = new URLSearchParams(query).get("filter[number|like]") ?? "";
  return wrapped.replace(/^%/, "").replace(/%$/, "");
}

/** AC-1 — the client's own first row and the server total, off the recording. */
const AC1 = archiveFacts(ac1ListRecording as ListRecording);

/** AC-2 — the contains value and matched row, and the shortfall value, off recordings. */
const AC2_MATCH = {
  like: likeValueOf(ac2MatchRecording as ListRecording),
  ...archiveFacts(ac2MatchRecording as ListRecording)
};
const AC2_SHORTFALL = {
  like: likeValueOf(ac2ShortfallRecording as ListRecording),
  total: archiveFacts(ac2ShortfallRecording as ListRecording).total
};

/** One recorded single read: the record id it addressed and the record it returned. */
type SingleRecording = {
  request: { path: string };
  response: { body: { data: { id: string; staged_import?: boolean } | null } };
};

/** The record id a single-read recording addressed — the last path segment. */
function recordedOneId(recording: SingleRecording): string {
  return last(split(first(split(recording.request.path, "?")), "/")) ?? "";
}

/** AC-6 / AC-7 / AC-8 — the record id each single-read scenario opens, off its recording. */
const AC6_OPEN_ID = recordedOneId(ac6OpenRecording as SingleRecording);
const AC7_PAID_ID = recordedOneId(ac7PaidRecording as SingleRecording);
const AC7_OVERDUE_ID = recordedOneId(ac7OverdueRecording as SingleRecording);

/** One recorded page/order list: its server total and the number of its first row. */
type PageRecording = {
  response: { body: { total: number | null; data: Array<{ number: string }> } };
};
function pageFacts(recording: PageRecording): {
  total: number;
  firstNumber: string;
} {
  const body = recording.response.body;
  return {
    total: Number(body.total ?? 0),
    firstNumber: first(body.data)?.number ?? ""
  };
}

/** AC-3 / AC-4 / AC-14 — the row the top of each page/order carries, off its recording. */
const AC4_PAGE1 = pageFacts(ac4Page1Recording as PageRecording);
const AC4_PAGE2 = pageFacts(ac4Page2Recording as PageRecording);
const AC3_DEFAULT = pageFacts(ac3DefaultRecording as PageRecording);
const AC3_AMOUNT = pageFacts(ac3AmountRecording as PageRecording);
const AC14_LAST = pageFacts(ac14LastRecording as PageRecording);
const AC14_RESET_PAGE1 = pageFacts(ac14ResetRecording as PageRecording);
const AC8_ID = recordedOneId(ac8Recording as SingleRecording);
const UNKNOWN_RECORD_ID = "00000000-0000-0000-0000-000000000000";

// -----------------------------------------------------------------------------

/** The scenario key the collection (`useLegacyInvoices`) is driven under. */
export const LEGACY_INVOICES_SCENARIO = "legacy-invoices";

/** The scenario key the single read (`useLegacyInvoice`) boots under, by id. */
export const LEGACY_INVOICE_SCENARIO = "legacy-invoice";

/**
 * The action ids these steps drive, ALL on the `useLegacyInvoices` collection
 * cell — exported as the gate's `coveredActionIds` so the covered set and the
 * calls that cover it cannot drift.
 */
export const LEGACY_INVOICES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  setCriteria: "setCriteria"
} as const;

export const coveredActionIds: readonly string[] = values(
  LEGACY_INVOICES_COVERED_ACTIONS
);

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

/** Boots the collection on the client cell and waits for it to be addressable. */
async function openArchive(world: World): Promise<void> {
  await world.boot(LEGACY_INVOICES_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(LEGACY_INVOICES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/** Boots the collection under a signed-out session — it settles unavailable. */
async function openArchiveSignedOut(world: World): Promise<void> {
  await world.boot(LEGACY_INVOICES_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(LEGACY_INVOICES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: false }));
}

/** Boots the single read on one imported invoice by id and waits for it to settle. */
async function openOne(world: World, id: string): Promise<void> {
  await world.boot(LEGACY_INVOICE_SCENARIO, {
    actor: ScopeActorTypes.CLIENT,
    id
  });
  await settles(() =>
    world.expectMeta({ isLoading: false }, LEGACY_INVOICE_SCENARIO)
  );
}

// -----------------------------------------------------------------------------

export const legacyInvoicesSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND ============================================================

  Given(
    "I am an authenticated client reading my archive of imported invoices",
    openArchive
  );

  // === AC-1: THE ARCHIVE READ ================================================
  // The archive read happens at boot; the re-read the `When` fires is answered
  // by the Background recording (the same identity), so the outcome is the rows
  // staging returned and its own total, both read off that recording.

  When("I open my archive of imported invoices", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.refresh)
  );

  Then(
    "I am given my own imported invoices, with the server's own total",
    world =>
      settles(() =>
        world.expectContext({ total: AC1.total, data: [{ id: AC1.firstId }] })
      )
  );

  // === AC-2: NARROWING (the `like` CONTAINS operator) ========================
  // The narrowing value is read off the recording that answered it, so the
  // request the module builds matches the identity staging recorded for it.

  When("I narrow my archive to part of one invoice's number", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.setCriteria, {
      filters: { number: { like: AC2_MATCH.like } }
    })
  );

  Then(
    "I am given only imported invoices whose number contains what I asked for",
    world =>
      settles(() =>
        world.expectContext({
          total: AC2_MATCH.total,
          data: [{ id: AC2_MATCH.firstId }]
        })
      )
  );

  When("I narrow my archive to something no number contains", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.setCriteria, {
      filters: { number: { like: AC2_SHORTFALL.like } }
    })
  );

  Then("I am given no imported invoices", world =>
    settles(() => world.expectContext({ total: AC2_SHORTFALL.total }))
  );

  // === AC-3: ORDERING ========================================================
  // The default order and the amount order are separate recordings; their top
  // rows differ (newest-first vs lowest-amount-first), so the data the module
  // publishes after each is the outcome, read off that order's own recording.

  Then(
    "before I set an order, my archive is ordered by issue date, newest first",
    world =>
      settles(() =>
        world.expectContext({ data: [{ number: AC3_DEFAULT.firstNumber }] })
      )
  );

  When("I order my archive by total amount", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.setCriteria, {
      sort: [{ field: "total_amount", dir: "asc" }]
    })
  );

  Then("my archive comes back ordered by total amount", world =>
    settles(() =>
      world.expectContext({ data: [{ number: AC3_AMOUNT.firstNumber }] })
    )
  );

  // === AC-4: THE PAGE WINDOW AND THE SERVER'S TOTAL ==========================

  When("I open my archive, landing on its first page", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.refresh)
  );

  Then(
    "I am given the first page of my archive, and the server's own total",
    world =>
      settles(() =>
        world.expectContext({
          total: AC4_PAGE1.total,
          data: [{ number: AC4_PAGE1.firstNumber }]
        })
      )
  );

  When("I ask for the next page of my archive", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.setCriteria, {
      pagination: { offset: 10 }
    })
  );

  Then("I am given that next page of my archive", world =>
    settles(() =>
      world.expectContext({ data: [{ number: AC4_PAGE2.firstNumber }] })
    )
  );

  // === AC-14: AN OVER-SHOT PAGE CLAMPS ONTO THE LAST PAGE ====================

  Given("my archive holds more than one page", world =>
    settles(() => world.expectContext({ total: AC14_LAST.total }))
  );

  When("I ask for a page beyond my archive's last page", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.setCriteria, {
      pagination: { offset: 1000 }
    })
  );

  Then("my archive recovers onto its last page", world =>
    settles(() =>
      world.expectContext({ data: [{ number: AC14_LAST.firstNumber }] })
    )
  );

  // --- AC-14: re-ordering a non-first page resets to the first page ----------
  // The reset is the module's OWN published page, not the wire offset (offset is
  // out of fixture identity): on page two, a re-order returns `pagination.page`
  // to one, with the re-ordered page-one rows.

  Given("my archive is not on its first page", async world => {
    await world.fire(LEGACY_INVOICES_COVERED_ACTIONS.setCriteria, {
      pagination: { offset: 10 }
    });
    await settles(() => world.expectContext({ pagination: { page: 2 } }));
  });

  When("I narrow or re-order my archive", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.setCriteria, {
      sort: [{ field: "total_amount", dir: "asc" }]
    })
  );

  Then("my archive returns to its first page", world =>
    settles(() =>
      world.expectContext({
        pagination: { page: 1 },
        data: [{ number: AC14_RESET_PAGE1.firstNumber }]
      })
    )
  );

  // === AC-6: OPEN ONE RECORD, AND THE ABSENT-RECORD BRANCH ===================
  // Each Given opens the single read by the id its own recording addressed; the
  // shared `When` settles the already-loaded read.

  Given("one of my imported invoices", world => openOne(world, AC6_OPEN_ID));

  Given("an imported invoice id that does not resolve", world =>
    openOne(world, UNKNOWN_RECORD_ID)
  );

  When("I open that imported-invoice record", world =>
    settles(() =>
      world.expectMeta({ isLoading: false }, LEGACY_INVOICE_SCENARIO)
    )
  );

  Then(
    "I am given that imported invoice, with its staged-import state",
    world =>
      settles(() =>
        world.expectMeta({ isStaged: false }, LEGACY_INVOICE_SCENARIO)
      )
  );

  Then("no record is published", world =>
    settles(() => world.expectMeta({ hasError: true }, LEGACY_INVOICE_SCENARIO))
  );

  // === AC-7: THE PAID CONDITION, AS AN ARRANGED STATE ========================

  Given("one of my imported invoices that is paid", world =>
    openOne(world, AC7_PAID_ID)
  );

  Then("it reports itself paid", world =>
    settles(() => world.expectMeta({ isPaid: true }, LEGACY_INVOICE_SCENARIO))
  );

  Given("one of my imported invoices that is overdue", world =>
    openOne(world, AC7_OVERDUE_ID)
  );

  Then("it reports itself overdue", world =>
    settles(() =>
      world.expectMeta({ isOverdue: true }, LEGACY_INVOICE_SCENARIO)
    )
  );

  // === AC-8: DOWNLOAD THE PDF DOCUMENT =======================================
  // The download condition is raised while the download runs and cleared once
  // it settles — the whole capability, asserted on the single read's own meta.

  Given("one of my imported invoices with a built document", world =>
    openOne(world, AC8_ID)
  );

  When("I download its document", async world => {
    await world.fireHold!("downloadPdf", undefined, LEGACY_INVOICE_SCENARIO);
    await settles(() =>
      world.expectMeta({ isDownloading: true }, LEGACY_INVOICE_SCENARIO)
    );
  });

  Then(
    "the download condition is raised while it runs, and cleared once it completes",
    async world => {
      await world.settle!(LEGACY_INVOICE_SCENARIO);
      await settles(() =>
        world.expectMeta({ isDownloading: false }, LEGACY_INVOICE_SCENARIO)
      );
    }
  );

  // === AC-5: AVAILABILITY ====================================================
  // The owning client's session is seeded from its own recorded `/self`; the
  // archive's availability reads `GET /api/clients/{clientId}?with=legacy_invoices`
  // (`has_legacy_invoices:true`), so `hasLegacyInvoices` reports available.

  Given("my client record carries an imported-invoice history", world =>
    settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );

  Then("my archive reports itself available", world =>
    settles(() => world.expectMeta({ hasLegacyInvoices: true }))
  );

  // === AC-5: THE EMPTY ARCHIVE ===============================================
  // The staging test client really holds no imported invoices, and its `/self`
  // carries the availability flag false, so both the empty result and the
  // availability-condition-false outcome are read off real recorded state.

  Given("my archive holds no imported invoices", world =>
    settles(() => world.expectMeta({ isEmpty: true, hasError: false }))
  );

  When("I open my empty archive", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.refresh)
  );

  Then(
    "I am given an empty result, and my archive reports itself unavailable",
    world =>
      settles(() =>
        world.expectMeta({ isEmpty: true, hasLegacyInvoices: false })
      )
  );

  // === AC-13: THE SIGNED-OUT GUARD ===========================================
  // Arms no recording: the wall surfaces any archive request as a capture gap
  // and fails the scenario by name, proving the absence.

  Given(
    "there is no authenticated client session for my imported-invoice archive",
    openArchiveSignedOut
  );

  When("any read of my imported-invoice archive is attempted", world =>
    world.fire(LEGACY_INVOICES_COVERED_ACTIONS.refresh).catch(() => undefined)
  );

  Then("my imported-invoice archive reports itself unavailable", world =>
    world.expectMeta({ isAvailable: false })
  );

  Then(
    "no request is made against any client's imported-invoice resource",
    world => world.expectMeta({ isAvailable: false })
  );
});

export default legacyInvoicesSteps;
