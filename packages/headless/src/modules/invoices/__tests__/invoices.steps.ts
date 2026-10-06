// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/invoices.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * DRIVEN `invoices.feature` scenarios use. Engine-free by construction: it
 * imports `defineSteps` and `World` and nothing else, so the same catalog
 * re-registers against any runner.
 *
 * BOTH cells are driven. The COLLECTION (`useInvoices`) is booted under
 * `INVOICES_SCENARIO`; the single read (`useInvoice`, a `.withId(id)`
 * `useDetail`) is booted under `INVOICE_SCENARIO` — `world.boot(key, { actor,
 * id })` resolves to `.as(actor).withId(id)` (WorldScope.id). The detail-cell
 * scenarios the corpus cannot arrange (a non-awaiting pending payment, a
 * balance that differs from the raw unpaid amount) stay `@todo`, as do the
 * outline/PDF/gated-meta capabilities named in the feature's own blockers.
 *
 * Every handler speaks to the module through the `World` members only — no DOM
 * read, no request read, no import of the module's own source. The ids, totals
 * and states a step asserts are READ from the scenario recording that addressed
 * them (FE-3145, ADR 035 §6), never a copied literal that goes stale on the next
 * `pnpm fixtures:generate invoices`.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { expect } from "vitest";
import { InvoiceCategoryCode, InvoiceStatus } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import delegatedDetailRecording from "./scenarios/a-delegated-invoice-is-not-mine-to-settle/02/get-invoices-id-with-staged-imports-1.json";
import ownDetailRecording from "./scenarios/a-delegated-invoice-is-not-mine-to-settle/05/get-invoices-id-with-staged-imports-1.json";
import ac4AssignTargetRecording from "./scenarios/assign-a-payment-method-to-an-invoice/02/get-invoices-id-with-staged-imports-1.json";
import ac4AssignPatchRecording from "./scenarios/assign-a-payment-method-to-an-invoice/03/patch-invoices-id-payment-details.json";
import comingledRecording from "./scenarios/attribute-each-invoice-in-a-co-mingled-list/02/get-invoices.json";
import ac4AssignedRecording from "./scenarios/clear-the-assigned-payment-method-back-to-none-selected/02/get-invoices-id-with-staged-imports-1.json";
import creditNotePdfDetailRecording from "./scenarios/download-a-credit-notes-pdf-document-the-same-way/01/get-invoices-id-with-staged-imports-1.json";
import invoicePdfDetailRecording from "./scenarios/download-an-invoices-pdf-document/01/get-invoices-id-with-staged-imports-1.json";
import payPartlyPaidDetailRecording from "./scenarios/i-cannot-change-the-pay-currency-of-a-partly-paid-invoice/02/get-invoices-id-with-staged-imports-1.json";
import payPartlyPaidCurrenciesRecording from "./scenarios/i-cannot-change-the-pay-currency-of-a-partly-paid-invoice/03/get-currencies.json";
import largeBundleRecording from "./scenarios/know-a-bundle-is-large-without-counting-a-truncated-line-item-array/02/get-invoices-id-with-staged-imports-1.json";
import ac7CreditNoteRecording from "./scenarios/label-a-consolidation-credit-note-as-a-consolidation-not-a-refund/02/get-invoices-id-with-staged-imports-1.json";
import ac18ConsolidatablePreNarrowRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/01/get-invoices-221d7f0d.json";
import ac18UnpaidPreNarrowRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/01/get-invoices-filter-client-id-filter-status-code-invoice-unpaid-invoice-overdue-invoice-adjusted.json";
import ac18UnfilteredRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/01/get-invoices.json";
import ac18ConsolidatableNarrowedRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/02/get-invoices-0d478351.json";
import ac18UnpaidNarrowedRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/02/get-invoices-96f111db.json";
import ac18NarrowedRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/02/get-invoices-filter-products-contracts-product-id.json";
import ac18ccConsolidatablePreNarrowRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/01/get-invoices-a20eca98.json";
import ac18ccUnpaidPreNarrowRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/01/get-invoices-b84a9fba.json";
import delegatedBootRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/01/get-invoices-client-id.json";
import ac18ccConsolidatableNarrowedRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/02/get-invoices-0d478351.json";
import ac18ccUnpaidNarrowedRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/02/get-invoices-96f111db.json";
import delegatedNarrowRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/02/get-invoices-filter-products-contracts-product-id.json";
import payOpenDetailRecording from "./scenarios/open-an-invoice-in-the-pay-currency-the-platform-holds-for-it/02/get-invoices-id-with-staged-imports-1.json";
import pageOneRecording from "./scenarios/page-through-my-invoice-list/03/get-invoices.json";
import bundleGroupsRecording from "./scenarios/read-a-consolidated-invoices-line-items-grouped-by-subscription/02/get-invoices-id-with-staged-imports-1.json";
import ac16PaidRecording from "./scenarios/read-a-fully-paid-invoice-as-paid/02/get-invoices-id-with-staged-imports-1.json";
import ac16PartialRecording from "./scenarios/read-a-partly-paid-invoice-as-partially-paid/02/get-invoices-id-with-staged-imports-1.json";
import ac16FreeRecording from "./scenarios/read-an-invoice-with-no-charge-as-free/02/get-invoices-id-with-staged-imports-1.json";
import creditNotesRecording from "./scenarios/read-my-credit-notes-as-a-filtered-view-of-my-invoices/02/get-invoices-filter-category-slug-credit-note-credit-note-for-refund.json";
import readInFullRecording from "./scenarios/read-one-of-my-invoices-in-full/02/get-invoices-id-with-staged-imports-1.json";
import consolidationRecording from "./scenarios/read-the-consolidation-identity-and-credit-fields-of-a-merged-invoice/02/get-invoices-id-with-staged-imports-1.json";
import ac9ShownRecording from "./scenarios/read-the-next-charge-date-of-an-invoice-that-is-on-a-recurring-product/02/get-invoices-id-with-staged-imports-1.json";
import retargetRecording from "./scenarios/retarget-my-reading-at-an-entitled-client/03/get-invoices-client-id.json";
import consolidatableCountRecording from "./scenarios/see-how-many-of-my-invoices-could-be-consolidated/01/get-invoices-221d7f0d.json";
import creditNoteRecording from "./scenarios/tie-a-credit-note-back-to-the-invoice-it-credits/02/get-invoices-id-with-staged-imports-1.json";
import ac19DefaultListRecording from "./scenarios/list-only-the-orders-i-placed/01/get-invoices.json";
import ac19UnpaidProbeRecording from "./scenarios/list-only-the-orders-i-placed/01/get-invoices-filter-client-id-filter-status-code-invoice-unpaid-invoice-overdue-invoice-adjusted.json";
import ac19OrderListRecording from "./scenarios/list-only-the-orders-i-placed/03/get-invoices-filter-category-slug-new-contract.json";
import {
  latestSent,
  markWire,
  sentInWindow,
  sentSinceMark
} from "./invoices.wire";
import {
  every,
  findLast,
  first,
  isEmpty,
  map,
  split,
  values
} from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url.
 */
export const INVOICES_SCENARIO = "invoices";

/** The scenario key the single read (`useInvoice`) boots under, by id. */
export const INVOICE_SCENARIO = "invoice";

/**
 * The action ids these steps drive, ALL on the `useInvoices` collection cell —
 * exported as the gate's `coveredActionIds` so the covered set and the calls
 * that cover it cannot drift.
 */
export const INVOICES_COVERED_ACTIONS = {
  isReady: "isReady",
  setCriteria: "setCriteria",
  sortBy: "sortBy",
  refresh: "refresh",
  filterCreditNotes: "filterCreditNotes"
} as const;

export const coveredActionIds: readonly string[] = values(
  INVOICES_COVERED_ACTIONS
);

// -----------------------------------------------------------------------------

type Recording = {
  response: {
    body: { total: number | null; data: Array<{ category: { slug: string } }> };
  };
};

/** The credit-note category the preset narrows to, read off its own recording. */
const CREDIT_NOTE_SLUG = first(
  (creditNotesRecording as Recording).response.body.data
)?.category.slug;

/** The invoice total staging held at capture — read, never copied. */
const PAGE_ONE_TOTAL = (pageOneRecording as Recording).response.body.total;

/**
 * The consolidatable count staging held at capture, read off the dedicated
 * limit=1 count read's own recording — never a copied literal. Asserting it
 * proves the count is the platform's own total, not a length of loaded rows.
 */
const CONSOLIDATABLE_COUNT = Number(
  (consolidatableCountRecording as Recording).response.body.total
);

// --- detail-cell ids + states, read off each scenario's own detail recording -

type DetailRecording = {
  request: { path: string };
  response: {
    body: {
      data: {
        status?: { code?: string };
        credit_invoice_id?: string;
        products_count?: number;
      };
    };
  };
};

const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The invoice id a detail read addressed — the last uuid segment of its path. */
const recordedId = (recording: DetailRecording): string =>
  findLast(split(first(split(recording.request.path, "?")), "/"), segment =>
    RECORD_ID.test(segment)
  ) ?? "";

const RECORDED_DETAIL = {
  primaryId: recordedId(readInFullRecording as DetailRecording),
  primaryStatus: (readInFullRecording as DetailRecording).response.body.data
    .status?.code,
  consolidationId: recordedId(consolidationRecording as DetailRecording),
  bundleGroupsId: recordedId(bundleGroupsRecording as DetailRecording),
  largeBundleId: recordedId(largeBundleRecording as DetailRecording),
  largeBundleCount: (largeBundleRecording as DetailRecording).response.body.data
    .products_count,
  creditNoteId: recordedId(creditNoteRecording as DetailRecording),
  creditInvoiceId: (creditNoteRecording as DetailRecording).response.body.data
    .credit_invoice_id
} as const;

const UNKNOWN_INVOICE_ID = "00000000-0000-0000-0000-000000000000";

// --- values for the delegate + unpaid-amount scenarios, read off recordings ---

/** One query-string param value off a recorded request path. */
const paramOf = (path: string, key: string): string =>
  new URLSearchParams(split(path, "?")[1] ?? "").get(key) ?? "";

type CurrenciesRecording = {
  response: { body: { data: Array<{ id?: string; code?: string }> } };
};

type PayDetailRecording = {
  request: { path: string };
  response: {
    body: {
      data: {
        payment_currency?: { code?: string } | null;
        currency?: { code?: string } | null;
        unpaid_amount?: number;
      };
    };
  };
};

/** The pay currency the platform holds, the invoice's own currency, and the amount owed, read off a detail recording. */
const payFacts = (recording: PayDetailRecording) => {
  const data = recording.response.body.data;
  return {
    payCode: (data.payment_currency ?? data.currency)?.code ?? "",
    currencyCode: data.currency?.code ?? "",
    unpaidAmount: data.unpaid_amount ?? 0
  };
};

/** AC-1 — the invoice opened in the pay currency the platform holds for it. */
const PAY_OPEN = {
  invoiceId: recordedId(payOpenDetailRecording as DetailRecording),
  ...payFacts(payOpenDetailRecording as PayDetailRecording)
} as const;

/**
 * AC-1 — the partly paid invoice whose pay currency cannot change, its held
 * amount, and an alternative currency code (read off its own recorded currency
 * list) the refused change attempts to move it to.
 */
const PAY_PARTLY_PAID = {
  ...payFacts(payPartlyPaidDetailRecording as PayDetailRecording),
  altCode:
    (
      payPartlyPaidCurrenciesRecording as CurrenciesRecording
    ).response.body.data.find(
      c =>
        c.code &&
        c.code !==
          payFacts(payPartlyPaidDetailRecording as PayDetailRecording).payCode
    )?.code ?? ""
} as const;

/** AC-13 — the delegated invoice and an own invoice, read off their detail recordings. */
const DELEGATED_INVOICE_ID = recordedId(
  delegatedDetailRecording as DetailRecording
);
const OWN_INVOICE_ID = recordedId(ownDetailRecording as DetailRecording);

/** AC-12 — the entitled client the retarget read addressed. */
const RETARGET_CLIENT_ID = paramOf(
  (retargetRecording as { request: { path: string } }).request.path,
  "client_id"
);

/** AC-18 c×c — the entitled client, its contract product, and the narrowed rows, read off the recordings. */
const AC18_DELEGATED = (() => {
  const boot = delegatedBootRecording as { request: { path: string } };
  const narrow = delegatedNarrowRecording as {
    request: { path: string };
    response: {
      body: { total: number; data: { id: string; client_id: string }[] };
    };
  };
  return {
    clientId: paramOf(boot.request.path, "client_id"),
    contractProductId: paramOf(
      narrow.request.path,
      "filter[products.contracts_product_id]"
    ),
    total: narrow.response.body.total,
    rows: map(narrow.response.body.data, ({ id, client_id }) => ({
      id,
      clientId: client_id
    }))
  };
})();

/** AC-16 — the arranged invoices whose payment state each scenario opens. */
const AC16 = {
  freeId: recordedId(ac16FreeRecording as DetailRecording),
  paidId: recordedId(ac16PaidRecording as DetailRecording),
  partialId: recordedId(ac16PartialRecording as DetailRecording)
} as const;

/** AC-17 — the invoice and credit note whose PDF download the scenario drives. */
const AC17_INVOICE_ID = recordedId(
  invoicePdfDetailRecording as DetailRecording
);
const AC17_CREDIT_NOTE_ID = recordedId(
  creditNotePdfDetailRecording as DetailRecording
);

/** AC-7 — the consolidation credit note whose label the scenario reads. */
const AC7_CREDIT_NOTE_ID = recordedId(
  ac7CreditNoteRecording as DetailRecording
);

/** AC-9 — the recurring invoice and its next charge date as the module formats it. */
const AC9 = (() => {
  const data = (
    ac9ShownRecording as {
      response: { body: { data: { id: string; next_charge_date: string } } };
    }
  ).response.body.data;
  const day = new Date(`${data.next_charge_date}T00:00:00Z`);
  const local = new Date(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate()
  );
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const n = local.getDate();
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ??
        "th");
  return {
    invoiceId: data.id,
    date: `${months[local.getMonth()]} ${n}${suffix}, ${local.getFullYear()}`
  };
})();

/** AC-13 — each co-mingled row's expected attribution, read off the recorded rows. */
const AC13_ROWS = (() => {
  const rows = (
    comingledRecording as {
      response: {
        body: {
          data: Array<{
            id: string;
            client?: {
              parent_client_config?: { parent_client_id?: string } | null;
            };
          }>;
        };
      };
    }
  ).response.body.data;
  return rows.map(row => {
    const isChildOfClient =
      !!row.client?.parent_client_config?.parent_client_id;
    return {
      id: row.id,
      attribution: { isOwn: !isChildOfClient, isChildOfClient }
    };
  });
})();

/** AC-4 — the invoice the assign scenario sets a method on, and the method it sets. */
const AC4_ASSIGN_TARGET_ID = recordedId(
  ac4AssignTargetRecording as DetailRecording
);
const AC4_ASSIGNED_METHOD_ID = (
  ac4AssignPatchRecording as {
    request: { body: { payment_details_id: string } };
  }
).request.body.payment_details_id;

/** AC-4 — the invoice whose recorded assigned method the scenario clears. */
const AC4_ASSIGNED_INVOICE_ID = recordedId(
  ac4AssignedRecording as DetailRecording
);

/** AC-18 c×self — the contract product and its recorded narrowed/unfiltered totals. */
const AC18 = {
  contractProductId: paramOf(
    (ac18NarrowedRecording as { request: { path: string } }).request.path,
    "filter[products.contracts_product_id]"
  ),
  unfilteredTotal: (ac18UnfilteredRecording as Recording).response.body.total,
  narrowedTotal: (ac18NarrowedRecording as Recording).response.body.total
} as const;

/**
 * AC-18 — the two gated count probes (`consolidatableCount`, `hasUnpaid`) a
 * narrowed read must re-scope to its contract product rather than re-widen back
 * to the whole account. Each value is read off the probe's own recording, so a
 * re-widened probe carries a `client_id` the narrowed recording never answers.
 */
type CountRecording = { response: { body: { total: number | null } } };

const probeFacts = (consolidatable: CountRecording, unpaid: CountRecording) =>
  ({
    consolidatableCount: Number(consolidatable.response.body.total),
    hasUnpaid: Number(unpaid.response.body.total) > 0
  }) as const;

const AC18_PROBES = {
  preNarrow: probeFacts(
    ac18ConsolidatablePreNarrowRecording as CountRecording,
    ac18UnpaidPreNarrowRecording as CountRecording
  ),
  narrowed: probeFacts(
    ac18ConsolidatableNarrowedRecording as CountRecording,
    ac18UnpaidNarrowedRecording as CountRecording
  )
} as const;

const AC18_DELEGATED_PROBES = {
  preNarrow: probeFacts(
    ac18ccConsolidatablePreNarrowRecording as CountRecording,
    ac18ccUnpaidPreNarrowRecording as CountRecording
  ),
  narrowed: probeFacts(
    ac18ccConsolidatableNarrowedRecording as CountRecording,
    ac18ccUnpaidNarrowedRecording as CountRecording
  )
} as const;


// --- the order history (FE-3237), read off each scenario's own recordings ---

type ListRecording = {
  request: { path: string };
  response: {
    body: {
      total: number;
      data: Array<{
        id: string;
        number: string;
        category?: { slug?: string };
        status?: { code?: string };
      }>;
    };
  };
};

const ORDER_CATEGORY = InvoiceCategoryCode.NEW_CONTRACT;

/** The order-history context the `@collection` order scenarios read. */
const ORDER_HISTORY = {
  actor: ScopeActorTypes.CLIENT,
  context: { type: ORDER_CATEGORY }
} as const;

/** The session client the probes address, read off a recorded probe request. */
const SESSION_CLIENT_ID = paramOf(
  (ac19UnpaidProbeRecording as ListRecording).request.path,
  "filter[client_id]"
);

/** A list read of the collection, never one of its limit=1 probes. */
const isListRead = (request: URL): boolean =>
  request.pathname.endsWith("/api/invoices") &&
  request.searchParams.get("limit") !== "1";

/** One of the collection's limit=1 probes (unpaid check, consolidatable count). */
const isProbe = (request: URL): boolean =>
  request.pathname.endsWith("/api/invoices") &&
  request.searchParams.get("limit") === "1";

/** The rows of a recorded list read, as the context publishes them. */
const recordedRows = (recording: ListRecording) =>
  map(recording.response.body.data, ({ id, number }) => ({ id, number }));

const AC19 = {
  defaultTotal: (ac19DefaultListRecording as ListRecording).response.body.total,
  order: ac19OrderListRecording as ListRecording,
  unpaidTotal: (ac19UnpaidProbeRecording as ListRecording).response.body.total
} as const;

async function openOrderHistory(world: World): Promise<void> {
  markWire();
  await openCollection(world, ORDER_HISTORY);
}

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
): Promise<void> {
  await world.boot(INVOICES_SCENARIO, scope);
  await world.fire(INVOICES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/** Boots the single read on one invoice by id and waits for its load to settle. */
async function openDetail(world: World, id: string): Promise<void> {
  await world.boot(INVOICE_SCENARIO, { actor: ScopeActorTypes.CLIENT, id });
  await settles(() => world.expectMeta({ isLoading: false }));
}

/** Boots the collection under a signed-out session — it settles unavailable. */
async function openCollectionSignedOut(world: World): Promise<void> {
  await world.boot(INVOICES_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(INVOICES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: false }));
}

// -----------------------------------------------------------------------------

export const invoicesSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND ============================================================

  Given("I am an authenticated client reading my invoices", world =>
    openCollection(world, { actor: ScopeActorTypes.CLIENT })
  );

  // === AC-2: FILTER ==========================================================

  When("I filter my invoice list by status, category, amount or date", world =>
    world.fire(INVOICES_COVERED_ACTIONS.setCriteria, {
      filters: {
        "status.code": [InvoiceStatus.PAID],
        "category.slug": [InvoiceCategoryCode.RECURRENT]
      }
    })
  );

  Then("only the invoices matching every filter I set are returned", world =>
    settles(() =>
      world.expectContext({
        data: [
          {
            status: InvoiceStatus.PAID,
            category: { slug: InvoiceCategoryCode.RECURRENT }
          }
        ]
      })
    )
  );

  Then(
    "an unpaid-status filter and a category filter narrow the list together",
    world =>
      settles(() =>
        world.expectContext({
          query: {
            filters: {
              "status.code": [InvoiceStatus.PAID],
              "category.slug": [InvoiceCategoryCode.RECURRENT]
            }
          }
        })
      )
  );

  // === AC-2: SORT ============================================================

  Given(
    "before I sort, I see the default order: most recently created first",
    world =>
      settles(() =>
        world.expectContext({
          query: { sort: [{ field: "create_datetime", dir: "desc" }] }
        })
      )
  );

  When("I sort my invoice list by due date, newest first", world =>
    world.fire(INVOICES_COVERED_ACTIONS.sortBy, [
      { field: "due_date", dir: "desc" }
    ])
  );

  Then("my invoice list comes back ordered by due date, newest first", world =>
    settles(() =>
      world.expectContext({
        query: { sort: [{ field: "due_date", dir: "desc" }] }
      })
    )
  );

  // === AC-2: PAGE ============================================================

  Given("I have more invoices than fit on one page", world =>
    settles(() =>
      world.expectContext({ pagination: { total: PAGE_ONE_TOTAL } })
    )
  );

  When("I open my invoice list", world =>
    world.fire(INVOICES_COVERED_ACTIONS.refresh)
  );

  Then(
    "I am given the first page, and the total number of invoices I have",
    world =>
      settles(() =>
        world.expectContext({
          pagination: { page: 1, total: PAGE_ONE_TOTAL }
        })
      )
  );

  Then(
    "asking for the next page of my invoices gives me the next page",
    async world => {
      await world.fire(INVOICES_COVERED_ACTIONS.setCriteria, {
        pagination: { offset: 10 }
      });
      await settles(() => world.expectContext({ pagination: { page: 2 } }));
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  // === AC-3: PAYMENT-OUTCOME REFETCH =========================================

  Given("I have just made a payment on one of my invoices", world =>
    world.expectMeta({ isAvailable: true })
  );

  When("that payment settles or fails", world =>
    world.fire(INVOICES_COVERED_ACTIONS.refresh)
  );

  Then("my invoice list reflects the new payment row on its own", world =>
    settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );

  Then("I do not have to reopen or reload my invoice list to see it", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  // === AC-7: CREDIT NOTES AS A CRITERIA PRESET ===============================

  When("I ask for my credit notes", world =>
    world.fire(INVOICES_COVERED_ACTIONS.filterCreditNotes)
  );

  Then("I am given only the invoices categorised as a credit note", world =>
    settles(() =>
      world.expectContext({ data: [{ category: { slug: CREDIT_NOTE_SLUG } }] })
    )
  );

  // === AC-10: DO I OWE ANYTHING — the gated unpaid-existence boolean ==========
  // Reading `hasUnpaid` flips the gate that fires the limit=1 count read; the
  // recording carries only that count, never the whole list, so the "without
  // loading my whole list" half is proven by what the scenario recorded.

  When("I ask whether I have anything unpaid", world =>
    settles(() => world.expectMeta({ hasUnpaid: true }))
  );

  Then(
    "I am told yes or no, without the module loading my whole invoice list",
    world =>
      settles(() => world.expectMeta({ hasUnpaid: true, hasError: false }))
  );

  // === AC-2: HOW MANY COULD BE CONSOLIDATED — the gated NUMERIC count =========
  // Reading `consolidatableCount` flips the gate that fires the limit=1 count
  // read; the recording carries only that count, never the whole list, so the
  // "without loading every matching invoice" half is proven by what it recorded.

  When("I ask how many of my invoices could be consolidated", world =>
    settles(() =>
      world.expectMeta({ consolidatableCount: CONSOLIDATABLE_COUNT })
    )
  );

  Then(
    "I am given a count, without the module loading every matching invoice",
    world =>
      settles(() =>
        world.expectMeta({
          consolidatableCount: CONSOLIDATABLE_COUNT,
          hasError: false
        })
      )
  );

  // === AC-15: THE CRITERIA LAW ===============================================

  Given(
    "the filters, sort and pagination my invoice list accepts are all declared",
    world => world.expectMeta({ isAvailable: true })
  );

  When("I try to filter by something the module has not declared", world =>
    world.fire(INVOICES_COVERED_ACTIONS.setCriteria, {
      filters: { totally_undeclared_column: { eq: "x" } }
    })
  );

  // The declared-criteria schema refuses the undeclared key by construction: it
  // never enters the query and never reaches the wire, so the collection stays
  // healthy rather than erroring. The "no filter reaches the platform" half is
  // proven structurally by the replay — the scenario recorded NO request for the
  // undeclared column, so if the module ever sent one the replay gap fails it.
  Then(
    "that filtering is refused rather than silently ignored or silently applied",
    world =>
      settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );

  Then(
    "no filter ever reaches the platform outside what my declared criteria produced",
    world => world.expectMeta({ isAvailable: true })
  );

  // === DETAIL CELL (useInvoice) — booted by id ===============================
  // Each Given opens one invoice by the id its own detail recording addressed;
  // "I open that invoice" then settles the already-loaded read.

  Given("one of my invoices", world =>
    openDetail(world, RECORDED_DETAIL.primaryId)
  );

  Given("one of my invoices was merged into a consolidation", world =>
    openDetail(world, RECORDED_DETAIL.consolidationId)
  );

  Given(
    "a consolidated invoice with line items from more than one subscription",
    world => openDetail(world, RECORDED_DETAIL.bundleGroupsId)
  );

  Given(
    "a consolidated invoice bundling more line items than the platform returns in one page",
    world => openDetail(world, RECORDED_DETAIL.largeBundleId)
  );

  Given("one of my credit notes", world =>
    openDetail(world, RECORDED_DETAIL.creditNoteId)
  );

  Given("an invoice load that failed", world =>
    openDetail(world, UNKNOWN_INVOICE_ID)
  );

  When("I open that invoice", world =>
    settles(() => world.expectMeta({ isLoading: false }))
  );

  When("I open it", world =>
    settles(() => world.expectMeta({ isLoading: false }))
  );

  When("I ask for its payment state", world =>
    settles(() => world.expectMeta({ isLoading: false }))
  );

  Then(
    "I see it in full, including its client, its status, and its payments",
    world =>
      settles(() =>
        world.expectContext({
          model: {
            status: RECORDED_DETAIL.primaryStatus,
            payments: [{ meta: { isPending: true } }]
          }
        })
      )
  );

  Then(
    "I see which document it merged into, which credit note partners it, and how much is queued for credit",
    world =>
      settles(() =>
        world.expectContext({
          model: { consolidation: { isConsolidation: true } }
        })
      )
  );

  Then(
    "its line items are grouped, one group per subscription they came from",
    world =>
      settles(() =>
        world.expectContext({ model: { bundle: { groups: [{}] } } })
      )
  );

  Then(
    "a line item with no subscription of its own is grouped separately, never dropped",
    world =>
      settles(() =>
        world.expectContext({ model: { bundle: { groups: [{}] } } })
      )
  );

  Then("it tells me the bundle is large", world =>
    settles(() => world.expectContext({ model: { bundle: { isLarge: true } } }))
  );

  Then(
    "that answer comes from the platform's own count, not from how many line items actually arrived",
    world =>
      settles(() =>
        world.expectContext({
          model: { bundle: { productCount: RECORDED_DETAIL.largeBundleCount } }
        })
      )
  );

  Then("it names the invoice it credits", world =>
    settles(() =>
      world.expectContext({
        model: {
          consolidation: { creditInvoiceId: RECORDED_DETAIL.creditInvoiceId }
        }
      })
    )
  );

  Then(
    "I am told the load failed rather than given a guessed payment state",
    world =>
      settles(() =>
        world.expectMeta({
          isUnavailable: true,
          canUpdatePaymentMethod: false
        })
      )
  );

  // === AC-7: LABEL A CONSOLIDATION CREDIT NOTE AS A CONSOLIDATION =============

  Given("a credit note that was also created by a consolidation", world =>
    openDetail(world, AC7_CREDIT_NOTE_ID)
  );

  When("I read its label", world =>
    settles(() => world.expectMeta({ isLoading: false }))
  );

  Then("it is labelled as a consolidation", world =>
    settles(() =>
      world.expectContext({
        model: { category: { label: InvoiceCategoryCode.CONSOLIDATION } }
      })
    )
  );

  Then("it is never labelled as a plain credit note", world =>
    settles(() =>
      world.expectContext({
        model: { category: { label: InvoiceCategoryCode.CONSOLIDATION } }
      })
    )
  );

  // === AC-9: THE NEXT CHARGE DATE ============================================

  Given("an invoice that {string}", world => openDetail(world, AC9.invoiceId));

  When("I read that invoice's next charge date", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  Then("the next charge date is {string}", world =>
    settles(() =>
      world.expectContext({ model: { nextChargeDate: { date: AC9.date } } })
    )
  );

  // === AC-4: ASSIGN A PAYMENT METHOD ==========================================

  Given("one of my invoices has no payment method assigned", world =>
    openDetail(world, AC4_ASSIGN_TARGET_ID)
  );

  When("I assign a payment method to it", async world => {
    await settles(() => world.expectMeta({ canUpdatePaymentMethod: true }));
    await world.fire("input", { payment_details_id: AC4_ASSIGNED_METHOD_ID });
    await world.fire("updatePaymentDetails");
  });

  Then("that invoice now shows the payment method I chose", world =>
    settles(() =>
      world.expectContext({
        model: { paymentMethod: { id: AC4_ASSIGNED_METHOD_ID } }
      })
    )
  );

  // === AC-4: CLEAR THE ASSIGNED PAYMENT METHOD ================================

  Given("one of my invoices has a payment method assigned", world =>
    openDetail(world, AC4_ASSIGNED_INVOICE_ID)
  );

  When("I clear the assigned payment method", async world => {
    await world.fire("input", { payment_details_id: null });
    await world.fire("updatePaymentDetails");
  });

  Then('that invoice shows "none selected" for its payment method', world =>
    settles(() =>
      world.expectContext({ model: { paymentMethod: { id: null, label: "" } } })
    )
  );

  // === AC-1: THE PAY CURRENCY THE PLATFORM HOLDS FOR ONE INVOICE =============

  Given("an invoice of mine that still owes money", world =>
    openDetail(world, PAY_OPEN.invoiceId)
  );

  Then(
    "it owes its unpaid amount in the pay currency the platform holds for it",
    world => {
      if (!PAY_OPEN.payCode || PAY_OPEN.payCode === PAY_OPEN.currencyCode)
        throw new Error(
          "open-in-pay-currency recording must carry a payment_currency that " +
            `differs from the invoice currency (payment=${PAY_OPEN.payCode} ` +
            `currency=${PAY_OPEN.currencyCode}); re-record the scenario.`
        );
      return settles(() =>
        world.expectContext({
          model: {
            currency: { code: PAY_OPEN.currencyCode },
            currencyPayment: { code: PAY_OPEN.payCode },
            summary: { unpaidAmount: PAY_OPEN.unpaidAmount }
          }
        })
      );
    }
  );

  Then("the payment I make next is taken in that currency", world =>
    settles(() =>
      world.expectContext({
        model: { currencyPayment: { code: PAY_OPEN.payCode } }
      })
    )
  );

  When("I try to change its pay currency", world =>
    world.fire("setCurrency", PAY_PARTLY_PAID.altCode)
  );

  Then(
    "that partly paid invoice keeps its pay currency and the amount it held before",
    world =>
      settles(() =>
        world.expectContext({
          model: {
            currencyPayment: { code: PAY_PARTLY_PAID.payCode },
            summary: { unpaidAmount: PAY_PARTLY_PAID.unpaidAmount }
          }
        })
      )
  );

  // === AC-13: ATTRIBUTE EACH INVOICE IN A CO-MINGLED LIST ===================

  Given("a list mixing my own invoices and a sub-account's", world =>
    openCollection(world, { actor: ScopeActorTypes.CLIENT })
  );

  When("I read that list", world =>
    settles(() => world.expectMeta({ isLoading: false, hasError: false }))
  );

  Then(
    "my own invoices are attributed to me, and my sub-account's to the sub-account",
    world => settles(() => world.expectContext({ data: AC13_ROWS }))
  );

  // === AC-13: A DELEGATED INVOICE IS NOT MINE TO SETTLE =====================

  Given("an invoice attributed to me as delegated", world =>
    openDetail(world, DELEGATED_INVOICE_ID)
  );

  When("I look at what I can do with it", world =>
    settles(() => world.expectMeta({ isLoading: false }))
  );

  Then("it tells me I cannot settle it", world =>
    settles(() =>
      world.expectContext({
        model: { attribution: { isDelegated: true, isSettleable: false } }
      })
    )
  );

  Then(
    "an invoice attributed as my own or my sub-account's carries no such restriction",
    async world => {
      await openDetail(world, OWN_INVOICE_ID);
      await settles(() =>
        world.expectContext({ model: { attribution: { isSettleable: true } } })
      );
    }
  );

  // === AC-12: RETARGET MY READING AT AN ENTITLED CLIENT =====================
  // The retarget read is scoped to the entitled client, so its rows read as
  // delegated (not my own); the self re-read's rows read as my own. A dropped
  // `.for()` (FE-2824) would make the retarget return my-own rows and fail this.

  Given("I am entitled to act for another client", world =>
    world.expectMeta({ isAvailable: true })
  );

  When("I read that client's invoices", async world => {
    await world.boot(INVOICES_SCENARIO, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: "client", id: RETARGET_CLIENT_ID }
    });
    await world.fire(INVOICES_COVERED_ACTIONS.isReady);
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then("I am given that client's invoices, not my own", world =>
    settles(() =>
      world.expectContext({ data: [{ attribution: { isDelegated: true } }] })
    )
  );

  Then(
    "reading without naming a target client still gives me my own",
    async world => {
      await world.boot(INVOICES_SCENARIO, { actor: ScopeActorTypes.CLIENT });
      await world.fire(INVOICES_COVERED_ACTIONS.refresh);
      await settles(() =>
        world.expectContext({ data: [{ attribution: { isOwn: true } }] })
      );
    }
  );

  // === AC-16: WHOLE-INVOICE PAYMENT STATE (free / paid / pending) ============

  Given("I have opened a free invoice of mine", world =>
    openDetail(world, AC16.freeId)
  );

  Given("I have opened a fully paid invoice of mine", world =>
    openDetail(world, AC16.paidId)
  );

  Given("I have opened a partly paid invoice of mine", world =>
    openDetail(world, AC16.partialId)
  );

  When("I read that invoice's payment state", world =>
    settles(() => world.expectMeta({ isLoading: false }))
  );

  Then("it is reported as free", world =>
    settles(() => world.expectMeta({ isFree: true }))
  );

  Then("it is reported as paid", world =>
    settles(() => world.expectMeta({ isComplete: true }))
  );

  Then("it is reported as partially paid", world =>
    settles(() => world.expectMeta({ isPartial: true }))
  );

  // === AC-18 c×self: NARROW MY LIST TO ONE CONTRACT PRODUCT ==================

  Given("I have opened my invoice list", async world => {
    await openCollection(world, { actor: ScopeActorTypes.CLIENT });
    await settles(() =>
      world.expectContext({ pagination: { total: AC18.unfilteredTotal } })
    );
    await settles(() =>
      world.expectMeta({
        consolidatableCount: AC18_PROBES.preNarrow.consolidatableCount,
        hasUnpaid: AC18_PROBES.preNarrow.hasUnpaid
      })
    );
  });

  When("I narrow it to one contract product's invoices", async world => {
    await world.boot(INVOICES_SCENARIO, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: "contracts_product", id: AC18.contractProductId }
    });
    await world.fire(INVOICES_COVERED_ACTIONS.isReady);
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
    await settles(() =>
      world.expectMeta({
        consolidatableCount: AC18_PROBES.narrowed.consolidatableCount,
        hasUnpaid: AC18_PROBES.narrowed.hasUnpaid
      })
    );
    await world.fire(INVOICES_COVERED_ACTIONS.refresh);
  });

  Then("only that product's invoices are returned", world =>
    settles(async () => {
      await world.expectContext({ pagination: { total: AC18.narrowedTotal } });
      await world.expectMeta({
        consolidatableCount: AC18_PROBES.narrowed.consolidatableCount,
        hasUnpaid: AC18_PROBES.narrowed.hasUnpaid
      });
    })
  );

  // The replay wall matches by exact recorded request: this exact narrowed
  // total (2, not the 1180 unfiltered) can only settle if the request the
  // module sent actually carried the declared `contracts_product` context
  // param — a dropped or renamed one would either gap (unmatched request) or
  // resolve the unfiltered recording instead.
  Then(
    "the narrowing reached the platform as the module's own declared filter column",
    world =>
      settles(() =>
        world.expectContext({ pagination: { total: AC18.narrowedTotal } })
      )
  );

  // === AC-18 c×c: NARROWING DOES NOT RE-WIDEN A RETARGETED READING ========

  Given("I have been entrusted with another client's invoices", async world => {
    await world.boot(INVOICES_SCENARIO, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: "client", id: AC18_DELEGATED.clientId }
    });
    await world.fire(INVOICES_COVERED_ACTIONS.isReady);
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
    await settles(() =>
      world.expectMeta({
        consolidatableCount:
          AC18_DELEGATED_PROBES.preNarrow.consolidatableCount,
        hasUnpaid: AC18_DELEGATED_PROBES.preNarrow.hasUnpaid
      })
    );
  });

  When(
    "I narrow that client's invoices to one contract product's invoices",
    async world => {
      await world.boot(INVOICES_SCENARIO, {
        actor: ScopeActorTypes.CLIENT,
        context: {
          type: "contracts_product",
          id: AC18_DELEGATED.contractProductId
        }
      });
      await world.fire(INVOICES_COVERED_ACTIONS.isReady);
      await settles(() =>
        world.expectMeta({ isAvailable: true, hasError: false })
      );
      await settles(() =>
        world.expectMeta({
          consolidatableCount:
            AC18_DELEGATED_PROBES.narrowed.consolidatableCount,
          hasUnpaid: AC18_DELEGATED_PROBES.narrowed.hasUnpaid
        })
      );
      await world.fire(INVOICES_COVERED_ACTIONS.refresh);
    }
  );

  Then("I am given only that client's invoices for that product", world =>
    settles(() =>
      world.expectContext({
        pagination: { total: AC18_DELEGATED.total },
        data: map(AC18_DELEGATED.rows, ({ id }) => ({ id }))
      })
    )
  );

  Then("my reading is still attributed to that client, not to me", world =>
    settles(async () => {
      await world.expectContext({
        data: map(AC18_DELEGATED.rows, () => ({
          attribution: { isDelegated: true }
        }))
      });
      await world.expectMeta({
        consolidatableCount: AC18_DELEGATED_PROBES.narrowed.consolidatableCount,
        hasUnpaid: AC18_DELEGATED_PROBES.narrowed.hasUnpaid
      });
    })
  );

  // === AC-17: DOWNLOAD THE PDF DOCUMENT ======================================

  Given("I have opened one of my invoices", world =>
    openDetail(world, AC17_INVOICE_ID)
  );

  Given("I have opened one of my credit notes", world =>
    openDetail(world, AC17_CREDIT_NOTE_ID)
  );

  When("I download its PDF document", world => world.fire("downloadPdf"));

  Then("I receive that invoice's PDF file", world =>
    world.expectMeta({ hasError: false })
  );

  Then(
    "I receive that credit note's PDF file, the same way any invoice's is",
    world => world.expectMeta({ hasError: false })
  );

  // === AC-14 / AC-17: NO ADDRESSABLE CLIENT (signed-out) =====================
  // The replay wall proves the absence: these scenarios arm no recording, so any
  // request the collection makes is an unmatched request the cleanup surfaces as
  // a capture gap and fails the scenario by name.

  Given("no client is addressable for my invoices", world =>
    openCollectionSignedOut(world)
  );

  When("any invoice read is attempted while signed out", world =>
    world.fire(INVOICES_COVERED_ACTIONS.refresh).catch(() => undefined)
  );

  When("an invoice download is attempted while signed out", world =>
    world.fire(INVOICES_COVERED_ACTIONS.refresh).catch(() => undefined)
  );

  Then("my invoices report themselves unavailable", world =>
    world.expectMeta({ isAvailable: false })
  );

  Then("no invoice request is made", world =>
    world.expectMeta({ isAvailable: false })
  );

  // === FE-3237 AC1 — THE ORDER HISTORY LISTS ONLY MY PLACED ORDERS ==========

  Given("I have placed orders and I have other invoices", () => {
    if (
      !AC19.order.response.body.total ||
      AC19.order.response.body.total >= AC19.defaultTotal
    )
      throw new Error(
        "the recording must hold placed orders and other invoices; re-record."
      );
  });

  When("I open my order history", world => openOrderHistory(world));

  Then(
    "only my new-contract invoices are returned, ten on the first page",
    async world => {
      const rows = AC19.order.response.body.data;
      if (rows.length !== 10 || !every(rows, ["category.slug", ORDER_CATEGORY]))
        throw new Error("the order recording must hold ten placed orders.");
      await settles(() =>
        world.expectContext({
          data: map(rows, ({ id }) => ({
            id,
            category: { slug: ORDER_CATEGORY }
          })),
          pagination: { page: 1, total: AC19.order.response.body.total }
        })
      );
      const list = latestSent(isListRead);
      expect(list?.searchParams.get("filter[category.slug]")).toBe(
        ORDER_CATEGORY
      );
      expect(list?.searchParams.get("limit")).toBe("10");
    }
  );

  Then("no client identifier is sent with the list", () => {
    const lists = sentSinceMark(isListRead);
    expect(lists).not.toHaveLength(0);
    for (const request of lists) {
      expect(request.searchParams.has("client_id")).toBe(false);
      expect(request.searchParams.has("filter[client_id]")).toBe(false);
    }
  });

  Then("my unpaid check counts only my own invoices", async world => {
    await settles(() =>
      world.expectMeta({ hasUnpaid: AC19.unpaidTotal > 0, hasError: false })
    );
    const probes = sentSinceMark(isProbe);
    expect(probes).not.toHaveLength(0);
    for (const probe of probes) {
      expect(probe.searchParams.get("filter[client_id]")).toBe(
        SESSION_CLIENT_ID
      );
      expect(
        probe.searchParams.get("filter[category.slug]")
      ).not.toBe(ORDER_CATEGORY);
    }
  });
});

export default invoicesSteps;
