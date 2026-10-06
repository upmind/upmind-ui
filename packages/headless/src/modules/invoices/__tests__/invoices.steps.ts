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
import { InvoiceCategoryCode, InvoiceStatus } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  check,
  containsAll,
  differs,
  latestSent,
  markWire,
  same,
  sentInWindow,
  sentSinceMark
} from "./invoices.wire";
import delegatedDetailRecording from "./scenarios/a-delegated-invoice-is-not-mine-to-settle/02/get-invoices-id-with-staged-imports-1.json";
import ownDetailRecording from "./scenarios/a-delegated-invoice-is-not-mine-to-settle/05/get-invoices-id-with-staged-imports-1.json";
import ac4AssignTargetRecording from "./scenarios/assign-a-payment-method-to-an-invoice/02/get-invoices-id-with-staged-imports-1.json";
import ac4AssignPatchRecording from "./scenarios/assign-a-payment-method-to-an-invoice/03/patch-invoices-id-payment-details.json";
import comingledRecording from "./scenarios/attribute-each-invoice-in-a-co-mingled-list/02/get-invoices.json";
import ac4AssignedRecording from "./scenarios/clear-the-assigned-payment-method-back-to-none-selected/02/get-invoices-id-with-staged-imports-1.json";
import creditNotePdfDetailRecording from "./scenarios/download-a-credit-notes-pdf-document-the-same-way/01/get-invoices-id-with-staged-imports-1.json";
import invoicePdfDetailRecording from "./scenarios/download-an-invoices-pdf-document/01/get-invoices-id-with-staged-imports-1.json";
import ac22NoneRecording from "./scenarios/go-back-to-the-first-page-when-my-page-has-no-orders/02/get-invoices-filter-category-slug-new-contract-filter-number-eq-fe3237-no-such-order.json";
import payPartlyPaidDetailRecording from "./scenarios/i-cannot-change-the-pay-currency-of-a-partly-paid-invoice/02/get-invoices-id-with-staged-imports-1.json";
import payPartlyPaidCurrenciesRecording from "./scenarios/i-cannot-change-the-pay-currency-of-a-partly-paid-invoice/03/get-currencies.json";
import ac29BootRecording from "./scenarios/keep-my-order-history-to-the-orders-i-placed/02/get-invoices-filter-category-slug-new-contract.json";
import ac29PaidRecording from "./scenarios/keep-my-order-history-to-the-orders-i-placed/03/get-invoices-filter-category-slug-new-contract-filter-status-code-eq-invoice-paid.json";
import largeBundleRecording from "./scenarios/know-a-bundle-is-large-without-counting-a-truncated-line-item-array/02/get-invoices-id-with-staged-imports-1.json";
import ac7CreditNoteRecording from "./scenarios/label-a-consolidation-credit-note-as-a-consolidation-not-a-refund/02/get-invoices-id-with-staged-imports-1.json";
import ac19UnpaidProbeRecording from "./scenarios/list-only-the-orders-i-placed/01/get-invoices-filter-client-id-filter-status-code-invoice-unpaid-invoice-overdue-invoice-adjusted.json";
import ac19DefaultListRecording from "./scenarios/list-only-the-orders-i-placed/01/get-invoices.json";
import ac19OrderListRecording from "./scenarios/list-only-the-orders-i-placed/03/get-invoices-filter-category-slug-new-contract.json";
import ac18ConsolidatablePreNarrowRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/01/get-invoices-221d7f0d.json";
import ac18UnpaidPreNarrowRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/01/get-invoices-filter-client-id-filter-status-code-invoice-unpaid-invoice-overdue-invoice-adjusted.json";
import ac18UnfilteredRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/01/get-invoices.json";
import ac18ConsolidatableNarrowedRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/02/get-invoices-0d478351.json";
import ac18UnpaidNarrowedRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/02/get-invoices-96f111db.json";
import ac18NarrowedRecording from "./scenarios/narrow-my-invoice-list-to-one-contract-products-invoices/02/get-invoices-filter-products-contracts-product-id.json";
import ac24PageTwoRecording from "./scenarios/narrow-my-orders-by-item-category-service-number-and-amount/02/get-invoices-filter-category-slug-new-contract.json";
import ac26UnpaidRecording from "./scenarios/narrow-my-orders-by-status/03/get-invoices-filter-category-slug-new-contract-filter-status-code-eq-invoice-unpaid-invoice-adjusted.json";
import ac26NotPaidRecording from "./scenarios/narrow-my-orders-by-status/03/get-invoices-filter-category-slug-new-contract-filter-status-code-neq-invoice-paid.json";
import ac25PlacedRecording from "./scenarios/narrow-my-orders-by-when-i-placed-or-paid-them/03/get-invoices-filter-category-slug-new-contract-filter-create-datetime-after-7-days.json";
import ac18ccConsolidatablePreNarrowRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/01/get-invoices-a20eca98.json";
import ac18ccUnpaidPreNarrowRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/01/get-invoices-b84a9fba.json";
import delegatedBootRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/01/get-invoices-client-id.json";
import ac18ccConsolidatableNarrowedRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/02/get-invoices-0d478351.json";
import ac18ccUnpaidNarrowedRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/02/get-invoices-96f111db.json";
import delegatedNarrowRecording from "./scenarios/narrowing-to-a-product-does-not-re-widen-a-retargeted-reading/02/get-invoices-filter-products-contracts-product-id.json";
import payOpenDetailRecording from "./scenarios/open-an-invoice-in-the-pay-currency-the-platform-holds-for-it/02/get-invoices-id-with-staged-imports-1.json";
import pageOneRecording from "./scenarios/page-through-my-invoice-list/03/get-invoices.json";
import ac21BootRecording from "./scenarios/page-through-my-orders-and-choose-the-page-size/02/get-invoices-filter-category-slug-new-contract.json";
import ac21FiveRecording from "./scenarios/page-through-my-orders-and-choose-the-page-size/03/get-invoices-filter-category-slug-new-contract.json";
import bundleGroupsRecording from "./scenarios/read-a-consolidated-invoices-line-items-grouped-by-subscription/02/get-invoices-id-with-staged-imports-1.json";
import ac16PaidRecording from "./scenarios/read-a-fully-paid-invoice-as-paid/02/get-invoices-id-with-staged-imports-1.json";
import ac16PartialRecording from "./scenarios/read-a-partly-paid-invoice-as-partially-paid/02/get-invoices-id-with-staged-imports-1.json";
import ac21EmptyBootRecording from "./scenarios/read-a-search-of-my-orders-that-matches-nothing-as-empty/02/get-invoices-filter-category-slug-new-contract.json";
import ac21EmptyRecording from "./scenarios/read-a-search-of-my-orders-that-matches-nothing-as-empty/03/get-invoices-filter-category-slug-new-contract-filter-number-eq-fe3237-no-such-order.json";
import ac16FreeRecording from "./scenarios/read-an-invoice-with-no-charge-as-free/02/get-invoices-id-with-staged-imports-1.json";
import creditNotesRecording from "./scenarios/read-my-credit-notes-as-a-filtered-view-of-my-invoices/02/get-invoices-filter-category-slug-credit-note-credit-note-for-refund.json";
import ac20OrderListRecording from "./scenarios/read-my-order-list-with-its-brand-and-item-counts/03/get-invoices-filter-category-slug-new-contract.json";
import readInFullRecording from "./scenarios/read-one-of-my-invoices-in-full/02/get-invoices-id-with-staged-imports-1.json";
import consolidationRecording from "./scenarios/read-the-consolidation-identity-and-credit-fields-of-a-merged-invoice/02/get-invoices-id-with-staged-imports-1.json";
import ac9ShownRecording from "./scenarios/read-the-next-charge-date-of-an-invoice-that-is-on-a-recurring-product/02/get-invoices-id-with-staged-imports-1.json";
import ac26RefuseUnpaidRecording from "./scenarios/refuse-an-equal-and-a-not-equal-status-narrowing-together/02/get-invoices-filter-category-slug-new-contract-filter-status-code-eq-invoice-unpaid-invoice-adjusted.json";
import retargetRecording from "./scenarios/retarget-my-reading-at-an-entitled-client/03/get-invoices-client-id.json";
import consolidatableCountRecording from "./scenarios/see-how-many-of-my-invoices-could-be-consolidated/01/get-invoices-221d7f0d.json";
import ac27PageTwoRecording from "./scenarios/sort-my-orders-and-stay-on-my-page/02/get-invoices-filter-category-slug-new-contract.json";
import ac27SortedRecording from "./scenarios/sort-my-orders-and-stay-on-my-page/03/get-invoices-filter-category-slug-new-contract.json";
import creditNoteRecording from "./scenarios/tie-a-credit-note-back-to-the-invoice-it-credits/02/get-invoices-id-with-staged-imports-1.json";
import {
  every,
  filter,
  findLast,
  first,
  includes,
  last,
  map,
  size,
  some,
  split,
  values,
  zipObject
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

/** A second single-read key, so a missing order lives beside an open one. */
export const MISSING_INVOICE_SCENARIO = "missing-invoice";

/**
 * The action ids these steps drive, ALL on the `useInvoices` collection cell —
 * exported as the gate's `coveredActionIds` so the covered set and the calls
 * that cover it cannot drift.
 */
export const INVOICES_COVERED_ACTIONS = {
  isReady: "isReady",
  setCriteria: "setCriteria",
  sortBy: "sortBy",
  filterBy: "filterBy",
  setPage: "setPage",
  setLimit: "setLimit",
  search: "search",
  nextPage: "nextPage",
  prevPage: "prevPage",
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

const AC19 = {
  defaultTotal: (ac19DefaultListRecording as ListRecording).response.body.total,
  order: ac19OrderListRecording as ListRecording,
  unpaidTotal: (ac19UnpaidProbeRecording as ListRecording).response.body.total
} as const;

/** Every list recording of the module's scenarios, by its path. */
const LIST_RECORDINGS = import.meta.glob<ListRecording>(
  "./scenarios/*/*/get-invoices*.json",
  { eager: true, import: "default" }
);

/**
 * The one list recording of a scenario step whose request `match` selects. A
 * value-bearing file name changes on each re-record, so the step reads the
 * recording by its request, never by its name.
 */
function listRecording(
  slug: string,
  step: string,
  match: (params: URLSearchParams) => boolean
): ListRecording {
  const found = filter(
    map(LIST_RECORDINGS, (recording, path) => ({ recording, path })),
    ({ recording, path }) =>
      includes(path, `/scenarios/${slug}/${step}/`) &&
      match(new URL(recording.request.path, "http://localhost").searchParams)
  );
  if (size(found) !== 1)
    throw new Error(
      `expected one recording in ${slug}/${step}, found ${size(found)}; re-record.`
    );
  return found[0].recording;
}

const hasAll =
  (...keys: string[]) =>
  (params: URLSearchParams): boolean =>
    every(keys, key => params.has(key));

const filterKeys = (params: URLSearchParams): string[] =>
  filter([...params.keys()], key => key.startsWith("filter["));

/** One param of a recorded request path, decoded. */
const recordedParam = (recording: ListRecording, key: string): string =>
  paramOf(recording.request.path, key);

/** The rows of a recorded list read as `{ id }` subsets, in order. */
const rowIds = (recording: ListRecording) =>
  map(recording.response.body.data, ({ id }) => ({ id }));

/** Waits until the context holds this recorded read: its rows and its total. */
const holdsRead = (world: World, recording: ListRecording) =>
  settles(() =>
    world.expectContext({
      data: rowIds(recording),
      pagination: { total: recording.response.body.total }
    })
  );

/** A boolean meta member's live value, read through the World. */
const metaIs = (world: World, flag: string): Promise<boolean> =>
  world.expectMeta({ [flag]: true }).then(
    () => true,
    () => false
  );

const PAGE_FLAGS = ["hasNextPage", "hasPrevPage", "hasPages"] as const;

type PageMove = {
  page: number;
  limit: number;
  flags: Record<(typeof PAGE_FLAGS)[number], boolean>;
};

/** Fires one page move and waits until the context sits on its page. */
async function movePage(
  world: World,
  actionId: string,
  input: unknown,
  page: number,
  limit: number
): Promise<PageMove> {
  await world.fire(actionId, input);
  await settles(() => world.expectContext({ pagination: { page, limit } }));
  const flags = await Promise.all(map(PAGE_FLAGS, flag => metaIs(world, flag)));
  return {
    page,
    limit,
    flags: zipObject(PAGE_FLAGS, flags) as PageMove["flags"]
  };
}

/** The page flags the design promises for a page of a given total. */
const expectedFlags = (
  page: number,
  limit: number,
  total: number
): PageMove["flags"] => ({
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
  hasPages: total > limit
});

const listOffsets = (requests: URL[]) =>
  map(requests, request => ({
    offset: request.searchParams.get("offset"),
    limit: request.searchParams.get("limit")
  }));

/** The number leaves of a request, in every spelling the wire could carry. */
const numberLeaves = (request: URL): string[] => [
  ...request.searchParams.getAll("filter[number|eq]"),
  ...request.searchParams.getAll("filter[number]")
];

/** Per-scenario observations a `When` keeps for its `Then` steps. */
const observed: {
  moves: PageMove[];
  readsPerWrite: number[];
  narrowedRead: boolean[];
  conditionRow?: "paid" | "unpaid" | "partlyPaid" | "overdue" | "cancelled";
} = { moves: [], readsPerWrite: [], narrowedRead: [] };

function resetObserved(): void {
  observed.moves = [];
  observed.readsPerWrite = [];
  observed.narrowedRead = [];
  observed.conditionRow = undefined;
}

/** The default list narrowed by status, then category, then amount (AC-2). */
const INVOICE_FILTER = (() => {
  const final = listRecording(
    "filter-my-invoice-list-to-what-i-need",
    "02",
    hasAll("filter[total_amount]")
  );
  return {
    final,
    amount: Number(recordedParam(final, "filter[total_amount]"))
  };
})();

const AC21 = {
  boot: ac21BootRecording as ListRecording,
  five: ac21FiveRecording as ListRecording
} as const;

const AC21_EMPTY = {
  boot: ac21EmptyBootRecording as ListRecording,
  empty: ac21EmptyRecording as ListRecording,
  term: recordedParam(ac21EmptyRecording as ListRecording, "filter[number|eq]")
} as const;

const AC22 = (() => {
  const threePages = listRecording(
    "land-on-the-last-page-when-i-ask-for-a-page-past-it",
    "02",
    hasAll("filter[create_datetime|gte]")
  );
  return {
    none: ac22NoneRecording as ListRecording,
    term: recordedParam(
      ac22NoneRecording as ListRecording,
      "filter[number|eq]"
    ),
    threePages,
    from: recordedParam(threePages, "filter[create_datetime|gte]")
  };
})();

const AC24 = (() => {
  const slug = "narrow-my-orders-by-item-category-service-number-and-amount";
  const NAME = "filter[products.product.name|like]";
  const final = listRecording(slug, "03", hasAll("filter[total_amount|eq]"));
  const like = (recording: ListRecording, key: string) =>
    recordedParam(recording, key).replace(/^%|%$/g, "");
  const name = like(final, NAME);
  const firstNameRead = listRecording(
    slug,
    "03",
    params => size(filterKeys(params)) === 2 && params.get(NAME) !== `%${name}%`
  );
  return {
    pageTwo: ac24PageTwoRecording as ListRecording,
    final,
    firstName: like(firstNameRead, NAME),
    name,
    category: like(final, "filter[products.product.category.name|like]"),
    service: like(final, "filter[products.service_identifier|like]"),
    number: recordedParam(final, "filter[number|eq]"),
    total: recordedParam(final, "filter[total_amount|eq]")
  };
})();

const AC25 = (() => {
  const paid = listRecording(
    "narrow-my-orders-by-when-i-placed-or-paid-them",
    "03",
    hasAll("filter[paid_datetime|gte]")
  );
  return {
    placed: ac25PlacedRecording as ListRecording,
    paid,
    paidFrom: recordedParam(paid, "filter[paid_datetime|gte]")
  };
})();

const UNPAID_CHOICE = "invoice_unpaid,invoice_adjusted";

const AC26 = {
  unpaid: ac26UnpaidRecording as ListRecording,
  notPaid: ac26NotPaidRecording as ListRecording,
  refuseUnpaid: ac26RefuseUnpaidRecording as ListRecording
} as const;

const AC27 = {
  pageTwo: ac27PageTwoRecording as ListRecording,
  sorted: ac27SortedRecording as ListRecording
} as const;

const AC28 = (() => {
  const slug = "find-one-order-by-its-number-while-a-filter-is-on";
  const found = listRecording(
    slug,
    "03",
    hasAll("filter[number|eq]", "filter[status.code|eq]")
  );
  return {
    found,
    category: recordedParam(
      found,
      "filter[products.product.category.name|like]"
    ).replace(/^%|%$/g, ""),
    number: recordedParam(found, "filter[number|eq]")
  };
})();

const AC29 = (() => {
  const slug = "keep-my-order-history-to-the-orders-i-placed";
  const search = listRecording(slug, "03", hasAll("filter[number|eq]"));
  const total = listRecording(slug, "03", hasAll("filter[total_amount|eq]"));
  return {
    boot: ac29BootRecording as ListRecording,
    paid: ac29PaidRecording as ListRecording,
    search,
    total,
    number: recordedParam(search, "filter[number|eq]"),
    amount: Number(recordedParam(total, "filter[total_amount|eq]"))
  };
})();

const AC36 = (() => {
  const slug = "only-my-last-number-search-or-number-filter-narrows-my-orders";
  const [first, second] = listRecording(
    slug,
    "02",
    params =>
      params.get("filter[category.slug]") === ORDER_CATEGORY &&
      !params.has("filter[number|eq]")
  ).response.body.data;
  const read = (number: string) =>
    listRecording(
      slug,
      "03",
      params => params.get("filter[number|eq]") === number
    );
  return {
    a: read(first.number),
    b: read(second.number),
    numberA: first.number,
    numberB: second.number
  };
})();

// --- one order (FE-3237 AC13-AC19), read off each scenario's own recordings --

type OrderItemRecording = {
  id: string;
  name?: string;
  service_identifier?: string | null;
  client_label?: string | null;
  quantity?: number;
  billing_cycle_months?: number;
  billing_cycle_days?: number;
  options?: unknown[];
  product?: {
    id?: string;
    name_translated?: string;
    billing_cycle_months?: number;
    image?: { full_url?: string } | null;
  };
};

type OrderRecording = {
  request: { path: string };
  response: {
    status: number;
    body: {
      data: {
        id: string;
        number: string;
        status?: { code?: string };
        paid_amount?: number;
        unpaid_amount_converted?: number;
        delegate_related?: boolean;
        current_data?: { content?: { products?: OrderItemRecording[] } } | null;
        products?: OrderItemRecording[];
      };
    };
  };
};

type ImagesRecording = {
  request: { path: string };
  response: {
    body: { data: Array<{ id: string; image?: { full_url?: string } | null }> };
  };
};

const ORDER_RECORDINGS = import.meta.glob<OrderRecording>(
  "./scenarios/*/*/get-invoices-id-with-staged-imports-1.json",
  { eager: true, import: "default" }
);

const IMAGE_RECORDINGS = import.meta.glob<ImagesRecording>(
  "./scenarios/*/*/get-products-filter-id*.json",
  { eager: true, import: "default" }
);

/** The one recording of a scenario step out of a glob of recordings. */
function stepRecording<T>(
  recordings: Record<string, T>,
  slug: string,
  step: string
): T {
  const found = filter(
    map(recordings, (recording, path) => ({ recording, path })),
    ({ path }) => includes(path, `/scenarios/${slug}/${step}/`)
  );
  if (size(found) !== 1)
    throw new Error(
      `expected one recording in ${slug}/${step}, found ${size(found)}; re-record.`
    );
  return found[0].recording;
}

const orderRecording = (slug: string, step = "02") =>
  stepRecording(ORDER_RECORDINGS, slug, step);

/** The id an order read addressed, read off its recorded path. */
const orderId = (recording: OrderRecording): string =>
  recordedId(recording as unknown as DetailRecording);

/** The conditions of one row of the design 8.5 truth table. */
type ConditionsRow = {
  isDue: boolean;
  isCancellable: boolean;
  isOverdue: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  isPartiallyPaid: boolean;
  canPay: boolean;
  canCancel: boolean;
};

const CONDITION_ROWS: Record<
  "paid" | "unpaid" | "partlyPaid" | "overdue" | "cancelled",
  ConditionsRow
> = {
  paid: {
    isDue: false,
    isCancellable: false,
    isOverdue: false,
    isPaid: true,
    isCancelled: false,
    isPartiallyPaid: false,
    canPay: false,
    canCancel: false
  },
  unpaid: {
    isDue: true,
    isCancellable: true,
    isOverdue: false,
    isPaid: false,
    isCancelled: false,
    isPartiallyPaid: false,
    canPay: true,
    canCancel: true
  },
  partlyPaid: {
    isDue: true,
    isCancellable: true,
    isOverdue: false,
    isPaid: false,
    isCancelled: false,
    isPartiallyPaid: true,
    canPay: true,
    canCancel: true
  },
  overdue: {
    isDue: true,
    isCancellable: true,
    isOverdue: true,
    isPaid: false,
    isCancelled: false,
    isPartiallyPaid: false,
    canPay: true,
    canCancel: true
  },
  cancelled: {
    isDue: false,
    isCancellable: false,
    isOverdue: false,
    isPaid: false,
    isCancelled: true,
    isPartiallyPaid: false,
    canPay: false,
    canCancel: false
  }
};

/** The order each condition scenario opens, and the truth-table row it reads. */
const CONDITION_ORDERS = {
  unpaid: orderRecording("read-an-unpaid-order-as-due-and-payable"),
  overdue: orderRecording("read-an-overdue-order-as-overdue"),
  paid: orderRecording("read-a-paid-order-as-paid"),
  partlyPaid: orderRecording("read-a-partly-paid-order-as-partly-paid"),
  cancelled: orderRecording("read-a-cancelled-order-as-cancelled")
} as const;

/** Guards that a recorded order holds the state of its truth-table row. */
function assertRecordedState(
  row: keyof typeof CONDITION_ROWS,
  recording: OrderRecording
): void {
  const {
    status,
    paid_amount: paid,
    unpaid_amount_converted: owed
  } = recording.response.body.data;
  const holds = {
    paid: status?.code === InvoiceStatus.PAID && Number(paid) > 0,
    unpaid:
      status?.code === InvoiceStatus.UNPAID &&
      !Number(paid) &&
      Number(owed) > 0,
    partlyPaid:
      status?.code === InvoiceStatus.UNPAID &&
      Number(paid) > 0 &&
      Number(owed) > 0,
    overdue:
      status?.code === InvoiceStatus.OVERDUE &&
      !Number(paid) &&
      Number(owed) > 0,
    cancelled: status?.code === InvoiceStatus.CANCELLED && !Number(paid)
  }[row];
  if (!holds)
    throw new Error(
      `the ${row} order recording does not hold its state; re-record.`
    );
}

/** Opens one condition order and reads every condition of its row. */
async function readsAsRow(
  world: World,
  row: keyof typeof CONDITION_ROWS
): Promise<void> {
  const conditions = CONDITION_ROWS[row];
  await settles(() =>
    world.expectMeta({ ...conditions, isPayable: conditions.isDue })
  );
}

const AC30 = {
  missingId: orderId(orderRecording("open-one-of-my-orders", "02")),
  order: orderRecording("open-one-of-my-orders", "03")
};

const AC32 = orderRecording("read-the-items-of-one-of-my-orders");

const AC33 = {
  order: orderRecording("see-the-catalogue-image-of-each-item-i-ordered"),
  images: stepRecording(
    IMAGE_RECORDINGS,
    "see-the-catalogue-image-of-each-item-i-ordered",
    "02"
  )
};

const AC35_DELEGATED = orderRecording(
  "read-an-order-of-a-client-who-delegated-to-me-as-delegated"
);

/** The items of a recorded order: the snapshot first, the live products second. */
const snapshotItems = (recording: OrderRecording): OrderItemRecording[] =>
  recording.response.body.data.current_data?.content?.products ||
  recording.response.body.data.products ||
  [];

/** Is this a read of the given order's single read? */
const isOrderRead =
  (id: string) =>
  (request: URL): boolean =>
    request.pathname.endsWith(`/api/invoices/${id}`);

async function openOrderHistory(world: World): Promise<void> {
  resetObserved();
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

  // === AC-2: FILTER (FE-3237 AC11 — each filter keeps the ones before it) ====

  When(
    "I filter my invoice list by status, then add a category filter, then an amount or a date filter",
    async world => {
      markWire();
      const writes = [
        { "status.code": InvoiceStatus.PAID },
        { "category.slug": [InvoiceCategoryCode.RECURRENT] },
        { total_amount: INVOICE_FILTER.amount }
      ];
      for (const [index, intent] of writes.entries()) {
        await world.fire(INVOICES_COVERED_ACTIONS.filterBy, intent);
        await settles(async () => {
          same(
            size(sentSinceMark(isListRead)),
            index + 1,
            "size(sentSinceMark(isListRead))"
          );
        });
      }
    }
  );

  Then(
    "only the invoices matching every filter I set are returned",
    async world => {
      if (
        !INVOICE_FILTER.final.response.body.total ||
        !every(
          INVOICE_FILTER.final.response.body.data,
          row =>
            row.status?.code === InvoiceStatus.PAID &&
            row.category?.slug === InvoiceCategoryCode.RECURRENT
        )
      )
        throw new Error(
          "the filtered recording must hold paid recurring invoices."
        );
      await holdsRead(world, INVOICE_FILTER.final);
    }
  );

  Then("each new filter keeps the filters I set before it", () => {
    const [statusRead, categoryRead, amountRead] = sentSinceMark(isListRead);
    same(
      filterKeys(statusRead.searchParams),
      ["filter[status.code]"],
      "filterKeys(statusRead.searchParams)"
    );
    same(
      categoryRead.searchParams.get("filter[status.code]"),
      InvoiceStatus.PAID,
      "categoryRead.searchParams.get('filter[status.code]')"
    );
    same(
      categoryRead.searchParams.get("filter[category.slug]"),
      InvoiceCategoryCode.RECURRENT,
      "categoryRead.searchParams.get('filter[category.slug]')"
    );
    same(
      amountRead.searchParams.get("filter[status.code]"),
      InvoiceStatus.PAID,
      "amountRead.searchParams.get('filter[status.code]')"
    );
    same(
      amountRead.searchParams.get("filter[category.slug]"),
      InvoiceCategoryCode.RECURRENT,
      "amountRead.searchParams.get('filter[category.slug]')"
    );
    same(
      amountRead.searchParams.get("filter[total_amount]"),
      String(INVOICE_FILTER.amount),
      "amountRead.searchParams.get('filter[total_amount]')"
    );
  });

  // === AC-2: SORT (FE-3237 AC10 — a sort keeps my page) ======================

  Given(
    "I am on page two of my invoice list, most recently created first",
    async world => {
      await world.fire(INVOICES_COVERED_ACTIONS.setPage, 2);
      await settles(() =>
        world.expectContext({
          pagination: { page: 2 },
          query: { sort: [{ field: "create_datetime", dir: "desc" }] }
        })
      );
      markWire();
    }
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

  Then("I stay on page two", async world => {
    await settles(() => world.expectContext({ pagination: { page: 2 } }));
    const sorted = latestSent(isListRead);
    same(
      sorted?.searchParams.get("order"),
      "-due_date",
      "sorted?.searchParams.get('order')"
    );
    same(
      sorted?.searchParams.get("offset"),
      "10",
      "sorted?.searchParams.get('offset')"
    );
  });

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
      same(
        list?.searchParams.get("filter[category.slug]"),
        ORDER_CATEGORY,
        "list?.searchParams.get('filter[category.slug]')"
      );
      same(
        list?.searchParams.get("limit"),
        "10",
        "list?.searchParams.get('limit')"
      );
    }
  );

  Then("no client identifier is sent with the list", () => {
    const lists = sentSinceMark(isListRead);
    check(size(lists) !== 0, "lists has length 0");
    for (const request of lists) {
      same(
        request.searchParams.has("client_id"),
        false,
        "request.searchParams.has('client_id')"
      );
      same(
        request.searchParams.has("filter[client_id]"),
        false,
        "request.searchParams.has('filter[client_id]')"
      );
    }
  });

  // === FE-3237 AC2 — EACH ORDER CARRIES ITS BRAND AND ITEM COUNT ============

  Given("I have placed orders with several items", () => {
    const rows = (
      ac20OrderListRecording as {
        response: { body: { data: Array<{ products_count?: number }> } };
      }
    ).response.body.data;
    if (!some(rows, row => Number(row.products_count) > 1))
      throw new Error("no recorded order holds several items; re-record.");
  });

  Then("each order carries its brand and its item count", async world => {
    const rows = (
      ac20OrderListRecording as {
        response: {
          body: {
            data: Array<{
              id: string;
              products_count: number;
              brand: { name: string };
            }>;
          };
        };
      }
    ).response.body.data;
    await settles(() =>
      world.expectContext({
        data: map(rows, row => ({
          id: row.id,
          brandName: row.brand.name,
          bundle: { productCount: row.products_count }
        }))
      })
    );
    const list = latestSent(isListRead);
    containsAll(
      split(list?.searchParams.get("with") ?? "", ","),
      ["brand", "tags"],
      "split(list?.searchParams.get('with') ?? '', ',')"
    );
    same(
      list?.searchParams.get("with_count"),
      "products",
      "list?.searchParams.get('with_count')"
    );
  });

  // === FE-3237 AC3 — PAGE THROUGH MY ORDERS ==================================

  Given("I have more orders than fit on one page", async world => {
    await openOrderHistory(world);
    if (AC21.boot.response.body.total <= 30)
      throw new Error("the order history must span more than three pages.");
    await holdsRead(world, AC21.boot);
  });

  When(
    "I go to the next page, then to page three, then back one page, then choose five orders a page",
    async world => {
      markWire();
      observed.moves = [
        await movePage(world, "nextPage", undefined, 2, 10),
        await movePage(world, "setPage", 3, 3, 10),
        await movePage(world, "prevPage", undefined, 2, 10),
        await movePage(world, "setLimit", 5, 1, 5)
      ];
    }
  );

  Then(
    "each move gives me the orders of that page and keeps my page size",
    async world => {
      same(
        map(observed.moves, ({ page, limit }) => ({ page, limit })),
        [
          { page: 2, limit: 10 },
          { page: 3, limit: 10 },
          { page: 2, limit: 10 },
          { page: 1, limit: 5 }
        ],
        "map(observed.moves, ({ page, limit }) => ({ page, limit }))"
      );
      const reads = listOffsets(sentSinceMark(isListRead));
      containsAll(
        reads,
        [
          { offset: "10", limit: "10" },
          { offset: "20", limit: "10" },
          { offset: "0", limit: "5" }
        ],
        "reads"
      );
      await holdsRead(world, AC21.five);
    }
  );

  Then(
    "at each step I am told if a next page, a previous page and more than one page exist",
    () => {
      const total = AC21.boot.response.body.total;
      same(
        map(observed.moves, "flags"),
        map(observed.moves, ({ page, limit }) =>
          expectedFlags(page, limit, total)
        ),
        "map(observed.moves, 'flags')"
      );
    }
  );

  Then("choosing a page size takes me back to page one", async world => {
    same(
      listOffsets([last(sentSinceMark(isListRead))!]),
      [{ offset: "0", limit: "5" }],
      "listOffsets([last(sentSinceMark(isListRead))!])"
    );
    await settles(() =>
      world.expectContext({ pagination: { page: 1, limit: 5 } })
    );
  });

  Given("no order of mine has the number I search for", async world => {
    await openOrderHistory(world);
    await holdsRead(world, AC21_EMPTY.boot);
    if (some(AC21_EMPTY.boot.response.body.data, ["number", AC21_EMPTY.term]))
      throw new Error("the searched number belongs to an order; re-record.");
  });

  When("I search my orders for that number", async world => {
    markWire();
    await world.fire("search", AC21_EMPTY.term);
  });

  Then("my order history is empty, with a total of zero", async world => {
    if (AC21_EMPTY.empty.response.body.total !== 0)
      throw new Error("the search recording must hold no order; re-record.");
    await settles(() => world.expectContext({ pagination: { total: 0 } }));
    for (const { id } of AC21_EMPTY.boot.response.body.data)
      await world.expectAbsent!(id);
    same(
      latestSent(isListRead)?.searchParams.get("filter[number|eq]"),
      AC21_EMPTY.term,
      "latestSent(isListRead)?.searchParams.get('filter[number|eq]')"
    );
  });

  // === FE-3237 AC4 — AN EMPTY PAGE GOES BACK TO PAGE ONE =====================

  Given("my orders are narrowed to none", async world => {
    await openOrderHistory(world);
    await world.fire("search", AC22.term);
    await settles(() =>
      world.expectContext({ pagination: { page: 1, total: 0 } })
    );
  });

  When("I ask for page two", async world => {
    markWire();
    await world.fire("setPage", 2);
  });

  Then("I am taken back to page one", async world => {
    await settles(() =>
      world.expectContext({ pagination: { page: 1, total: 0 } })
    );
    // Page one of this narrowing is already held fresh, so going back to it
    // reads from the cache and sends no second request.
    same(
      first(listOffsets(sentSinceMark(isListRead))),
      {
        offset: "10",
        limit: "10"
      },
      "first(listOffsets(sentSinceMark(isListRead)))"
    );
  });

  // === FE-3237 AC24, divergence 3 — PAST THE LAST PAGE =======================

  Given("I have orders on three pages", async world => {
    const total = AC22.threePages.response.body.total;
    if (total < 21 || total > 30)
      throw new Error("the narrowing must hold three pages of ten; re-record.");
    await openOrderHistory(world);
    await world.fire("filters.dateCreated", AC22.from);
    await holdsRead(world, AC22.threePages);
  });

  When("I ask for page nine", async world => {
    markWire();
    await world.fire("setPage", 9);
  });

  Then("I am given the last page of my orders", async world => {
    await settles(() =>
      world.expectContext({
        pagination: {
          page: 3,
          total: AC22.threePages.response.body.total
        }
      })
    );
    const reads = listOffsets(sentSinceMark(isListRead));
    same(first(reads), { offset: "80", limit: "10" }, "first(reads)");
    same(last(reads), { offset: "20", limit: "10" }, "last(reads)");
  });

  // === FE-3237 AC7, AC24 divergence 1 — NARROW BY TEXT, NUMBER AND AMOUNT ====

  Given(
    "I am on page two of my orders of several products and amounts",
    async world => {
      await openOrderHistory(world);
      await world.fire("setPage", 2);
      await settles(() => world.expectContext({ pagination: { page: 2 } }));
      await holdsRead(world, AC24.pageTwo);
    }
  );

  When(
    "I narrow my orders by item name, product category, service, number or total",
    async world => {
      markWire();
      const writes: Array<[string, unknown]> = [
        ["filters.itemName", AC24.firstName],
        ["filters.itemName", AC24.name],
        ["filters.categoryName", AC24.category],
        ["filters.serviceIdentifier", AC24.service],
        ["search", AC24.number],
        ["filters.total", Number(AC24.total)]
      ];
      for (const [index, [id, input]] of writes.entries()) {
        await world.fire(id, input);
        await settles(async () => {
          same(
            size(sentSinceMark(isListRead)),
            index + 1,
            "size(sentSinceMark(isListRead))"
          );
        });
      }
    }
  );

  Then(
    "only the orders that match each filter I set are returned",
    async world => {
      await holdsRead(world, AC24.final);
      const final = latestSent(isListRead)!;
      same(
        final.searchParams.get("filter[products.product.name|like]"),
        `%${AC24.name}%`,
        "final.searchParams.get('filter[products.product.name|like]')"
      );
      same(
        final.searchParams.get("filter[products.product.category.name|like]"),
        `%${AC24.category}%`,
        "final.searchParams.get('filter[products.product.category.name|like]')"
      );
      same(
        final.searchParams.get("filter[products.service_identifier|like]"),
        `%${AC24.service}%`,
        "final.searchParams.get('filter[products.service_identifier|like]')"
      );
    }
  );

  Then("each narrowing takes me back to page one", async world => {
    const reads = sentSinceMark(isListRead);
    check(reads.length >= 6, "reads.length >= 6");
    same(
      every(listOffsets(reads), ["offset", "0"]),
      true,
      "every(listOffsets(reads), ['offset', '0'])"
    );
    await settles(() => world.expectContext({ pagination: { page: 1 } }));
  });

  Then("each equal comparison is sent with its explicit equal operator", () => {
    const final = latestSent(isListRead)!;
    same(
      final.searchParams.get("filter[number|eq]"),
      AC24.number,
      "final.searchParams.get('filter[number|eq]')"
    );
    same(
      final.searchParams.get("filter[total_amount|eq]"),
      AC24.total,
      "final.searchParams.get('filter[total_amount|eq]')"
    );
    same(
      final.searchParams.has("filter[number]"),
      false,
      "final.searchParams.has('filter[number]')"
    );
    same(
      final.searchParams.has("filter[total_amount]"),
      false,
      "final.searchParams.has('filter[total_amount]')"
    );
  });

  Then("a second filter on one text column replaces the first", () => {
    const [firstRead, secondRead] = sentSinceMark(isListRead);
    same(
      firstRead.searchParams.getAll("filter[products.product.name|like]"),
      [`%${AC24.firstName}%`],
      "firstRead.searchParams.getAll('filter[products.product.name|like]')"
    );
    same(
      secondRead.searchParams.getAll("filter[products.product.name|like]"),
      [`%${AC24.name}%`],
      "secondRead.searchParams.getAll('filter[products.product.name|like]')"
    );
  });

  // === FE-3237 AC8 — NARROW BY WHEN AN ORDER WAS PLACED OR PAID ==============

  Given("I have orders placed and paid on different dates", async world => {
    await openOrderHistory(world);
    if (
      AC25.paid.response.body.total >= AC25.placed.response.body.total ||
      AC25.placed.response.body.total === 0
    )
      throw new Error("the two date narrowings must differ; re-record.");
  });

  When(
    "I narrow my orders to the last seven days, or to a date I give",
    async world => {
      markWire();
      await world.fire("filters.dateCreated", "-7_days");
      observed.narrowedRead.push(
        await holdsRead(world, AC25.placed).then(
          () => true,
          () => false
        )
      );
      await world.fire("filters.datePaid", AC25.paidFrom);
    }
  );

  Then(
    "only the orders placed or paid in that period are returned",
    async world => {
      same(observed.narrowedRead, [true], "observed.narrowedRead");
      await holdsRead(world, AC25.paid);
      const final = latestSent(isListRead)!;
      same(
        final.searchParams.get("filter[create_datetime|after]"),
        "-7_days",
        "final.searchParams.get('filter[create_datetime|after]')"
      );
      same(
        final.searchParams.get("filter[paid_datetime|gte]"),
        AC25.paidFrom,
        "final.searchParams.get('filter[paid_datetime|gte]')"
      );
    }
  );

  // === FE-3237 AC9 — NARROW BY STATUS ========================================

  Given("I have paid, unpaid and adjusted orders", async world => {
    await openOrderHistory(world);
    if (
      !AC26.unpaid.response.body.total ||
      !some(AC26.notPaid.response.body.data, [
        "status.code",
        InvoiceStatus.UNPAID
      ])
    )
      throw new Error("the status recordings hold no unpaid order; re-record.");
  });

  When(
    "I narrow my orders to the unpaid ones, then to all but the paid ones",
    async world => {
      markWire();
      await world.fire("filters.status", [UNPAID_CHOICE]);
      observed.narrowedRead.push(
        await holdsRead(world, AC26.unpaid).then(
          () => true,
          () => false
        )
      );
      await world.fire("filterBy", {
        "status.code": { neq: [InvoiceStatus.PAID] }
      });
    }
  );

  Then(
    "the unpaid choice gives the unpaid and the adjusted orders together",
    () => {
      same(observed.narrowedRead, [true], "observed.narrowedRead");
      const [unpaidRead] = sentSinceMark(isListRead);
      same(
        unpaidRead.searchParams.getAll("filter[status.code|eq]"),
        [UNPAID_CHOICE],
        "unpaidRead.searchParams.getAll('filter[status.code|eq]')"
      );
      same(
        every(AC26.unpaid.response.body.data, row =>
          includes(split(UNPAID_CHOICE, ","), row.status?.code)
        ),
        true,
        "every(AC26.unpaid.response.body.data, row => includes(split(UNPAID_..."
      );
    }
  );

  Then("the second choice replaces the first", async world => {
    await holdsRead(world, AC26.notPaid);
    const final = latestSent(isListRead)!;
    same(
      final.searchParams.get("filter[status.code|neq]"),
      InvoiceStatus.PAID,
      "final.searchParams.get('filter[status.code|neq]')"
    );
    same(
      final.searchParams.has("filter[status.code|eq]"),
      false,
      "final.searchParams.has('filter[status.code|eq]')"
    );
  });

  Given("my orders are narrowed to the unpaid ones", async world => {
    await openOrderHistory(world);
    await world.fire("filters.status", [UNPAID_CHOICE]);
    await holdsRead(world, AC26.refuseUnpaid);
  });

  When(
    "I ask for the unpaid ones and all but the paid ones in one narrowing",
    async world => {
      markWire();
      await world
        .fire("filterBy", {
          "status.code": { eq: [UNPAID_CHOICE], neq: [InvoiceStatus.PAID] }
        })
        .catch(() => undefined);
    }
  );

  Then("the narrowing is refused and nothing is read", async world => {
    await settles(() =>
      world.expectContext({
        error: { status: 422, data: [{ keyword: "maxProperties" }] }
      })
    );
    same(
      size(sentSinceMark(isListRead)),
      0,
      "length of sentSinceMark(isListRead)"
    );
  });

  Then("my orders stay narrowed to the unpaid ones", async world => {
    await holdsRead(world, AC26.refuseUnpaid);
    same(
      latestSent(isListRead)?.searchParams.get("filter[status.code|eq]"),
      UNPAID_CHOICE,
      "latestSent(isListRead)?.searchParams.get('filter[status.code|eq]')"
    );
  });

  // === FE-3237 AC10 — SORT AND STAY ON MY PAGE ===============================

  Given("I am on page two of my orders, newest first", async world => {
    await openOrderHistory(world);
    await world.fire("setPage", 2);
    await settles(() =>
      world.expectContext({
        pagination: { page: 2 },
        query: { sort: [{ field: "create_datetime", dir: "desc" }] }
      })
    );
    await holdsRead(world, AC27.pageTwo);
  });

  When(
    "I sort my orders by total, then by status, then by order number",
    async world => {
      markWire();
      for (const field of ["total_amount", "status_id", "id"]) {
        await world.fire("sortBy", [{ field, dir: "asc" }]);
        await settles(async () => {
          same(
            latestSent(isListRead)?.searchParams.get("order"),
            field,
            "latestSent(isListRead)?.searchParams.get('order')"
          );
        });
      }
    }
  );

  Then(
    "each sort gives me page two of my orders in that order",
    async world => {
      const reads = sentSinceMark(isListRead);
      same(
        map(reads, request => ({
          order: request.searchParams.get("order"),
          offset: request.searchParams.get("offset"),
          limit: request.searchParams.get("limit")
        })),
        [
          { order: "total_amount", offset: "10", limit: "10" },
          { order: "status_id", offset: "10", limit: "10" },
          { order: "id", offset: "10", limit: "10" }
        ],
        "map(reads, request => ({ order: request.searchParams.get('order'), ..."
      );
      await settles(() =>
        world.expectContext({
          pagination: { page: 2 },
          query: { sort: [{ field: "id", dir: "asc" }] }
        })
      );
      await holdsRead(world, AC27.sorted);
    }
  );

  // === FE-3237 AC11 — SEARCH WHILE A FILTER IS ON ============================

  Given(
    "my orders are narrowed to the unpaid ones and then to one product category, and I am on page two",
    async world => {
      await openOrderHistory(world);
      await world.fire("filterBy", {
        "status.code": { eq: [UNPAID_CHOICE] }
      });
      await world.fire("filterBy", {
        "products.product.category.name": { like: AC28.category }
      });
      await world.fire("setLimit", 2);
      await world.fire("setPage", 2);
      await settles(() =>
        world.expectContext({ pagination: { page: 2, limit: 2 } })
      );
    }
  );

  When("I search for one order number", async world => {
    markWire();
    await world.fire("search", AC28.number);
  });

  Then("I get that order on page one", async world => {
    await holdsRead(world, AC28.found);
    await settles(() =>
      world.expectContext({
        data: [{ number: AC28.number }],
        pagination: { page: 1 }
      })
    );
  });

  Then("both filters stay on", () => {
    const final = latestSent(isListRead)!;
    same(
      final.searchParams.get("filter[status.code|eq]"),
      UNPAID_CHOICE,
      "final.searchParams.get('filter[status.code|eq]')"
    );
    same(
      final.searchParams.get("filter[products.product.category.name|like]"),
      `%${AC28.category}%`,
      "final.searchParams.get('filter[products.product.category.name|like]')"
    );
    same(
      final.searchParams.get("filter[number|eq]"),
      AC28.number,
      "final.searchParams.get('filter[number|eq]')"
    );
  });

  // === FE-3237 AC11, AC24 divergence 2 — ONE NUMBER LEAF =====================

  Given("I have two orders, A and B", async world => {
    await openOrderHistory(world);
    if (
      AC36.a.response.body.total !== 1 ||
      AC36.b.response.body.total !== 1 ||
      AC36.numberA === AC36.numberB
    )
      throw new Error("A and B must each match one order; re-record.");
  });

  When(
    "I filter my orders to the number of A, then search for B, then filter to the number of A again",
    async world => {
      markWire();
      const writes = [
        {
          id: "filterBy",
          input: { number: { eq: AC36.numberA } },
          read: AC36.a
        },
        { id: "search", input: AC36.numberB, read: AC36.b },
        {
          id: "filterBy",
          input: { number: { eq: AC36.numberA } },
          read: AC36.a
        }
      ];
      for (const write of writes) {
        await world.fire(write.id, write.input);
        observed.narrowedRead.push(
          await holdsRead(world, write.read).then(
            () => true,
            () => false
          )
        );
      }
    }
  );

  Then("after each write only the number of that write is sent", () => {
    const reads = sentSinceMark(isListRead);
    check(reads.length >= 2, "reads.length >= 2");
    same(
      map(reads, numberLeaves),
      map(reads, (_, index) => (index === 1 ? [AC36.numberB] : [AC36.numberA])),
      "map(reads, numberLeaves)"
    );
  });

  Then("after each write only that order is returned", () => {
    same(observed.narrowedRead, [true, true, true], "observed.narrowedRead");
  });

  // === FE-3237 AC12 — THE FORCED CATEGORY HOLDS UNDER EVERY WRITER ===========

  Given("my order history is open", async world => {
    await openOrderHistory(world);
    await holdsRead(world, AC29.boot);
  });

  When(
    "I narrow it by a filter, then by the credit-notes narrowing, then by a search, then by a raw criteria write that names another category",
    async world => {
      markWire();
      const writes: Array<[string, unknown, ListRecording]> = [
        ["filters.status", [InvoiceStatus.PAID], AC29.paid],
        ["filterCreditNotes", undefined, AC29.boot],
        ["search", AC29.number, AC29.search],
        [
          "setCriteria",
          {
            filters: {
              "category.slug": InvoiceCategoryCode.RECURRENT,
              total_amount: { eq: AC29.amount }
            }
          },
          AC29.total
        ]
      ];
      for (const [id, input, read] of writes) {
        const before = size(sentSinceMark(isListRead));
        await world.fire(id, input);
        await holdsRead(world, read);
        await settles(async () => {
          check(
            size(sentSinceMark(isListRead)) > before,
            "size(sentSinceMark(isListRead)) > before"
          );
        }).catch(() => undefined);
        observed.readsPerWrite.push(size(sentSinceMark(isListRead)) - before);
        if (id === "filterCreditNotes" || id === "setCriteria")
          observed.narrowedRead.push(
            await world.expectAbsent!(
              id === "setCriteria"
                ? InvoiceCategoryCode.RECURRENT
                : InvoiceCategoryCode.CREDIT_NOTE_FOR_REFUND
            ).then(
              () => true,
              () => false
            )
          );
      }
    }
  );

  // The credit-notes write drops its column and returns the criteria to the
  // boot read, which the list still holds fresh (design 8.4), so it reads from
  // the cache: no request.
  Then("each write sends one new read", () => {
    same(observed.readsPerWrite, [1, 0, 1, 1], "observed.readsPerWrite");
  });

  Then("each read still asks for my placed orders only", () => {
    const reads = sentInWindow(isListRead);
    const orderReads = filter(reads, request =>
      request.searchParams.has("filter[category.slug]")
    );
    check(size(orderReads) >= 4, "size(orderReads) >= 4");
    for (const request of sentSinceMark(isListRead))
      same(
        request.searchParams.getAll("filter[category.slug]"),
        [ORDER_CATEGORY],
        "request.searchParams.getAll('filter[category.slug]')"
      );
  });

  Then(
    "the narrowing to credit notes or to another category is dropped",
    () => {
      const [, , rawRead] = sentSinceMark(isListRead);
      same(observed.narrowedRead, [true, true], "observed.narrowedRead");
      same(
        rawRead.searchParams.getAll("filter[category.slug]"),
        [ORDER_CATEGORY],
        "rawRead.searchParams.getAll('filter[category.slug]')"
      );
      same(
        rawRead.searchParams.get("filter[total_amount|eq]"),
        String(AC29.amount),
        "rawRead.searchParams.get('filter[total_amount|eq]')"
      );
    }
  );

  Then("no error is reported", world =>
    settles(() => world.expectMeta({ hasError: false, isAvailable: true }))
  );

  // === FE-3237 AC13 — OPEN ONE ORDER =========================================

  Given(
    "one of my orders and an order number that does not exist",
    async world => {
      resetObserved();
      markWire();
      await world.boot(MISSING_INVOICE_SCENARIO, {
        actor: ScopeActorTypes.CLIENT,
        id: AC30.missingId
      });
      await settles(() =>
        world.expectMeta({ isLoading: false }, MISSING_INVOICE_SCENARIO)
      );
    }
  );

  When("I open each of them, then reload the first", async world => {
    const id = orderId(AC30.order);
    await openDetail(world, id);
    await settles(() =>
      world.expectContext({ model: { id } }, INVOICE_SCENARIO)
    );
    const opened = size(sentInWindow(isOrderRead(id)));
    await world.fire("refresh", undefined, INVOICE_SCENARIO);
    await settles(async () => {
      check(
        size(sentInWindow(isOrderRead(id))) > opened,
        "size(sentInWindow(isOrderRead(id))) > opened"
      );
    });
  });

  Then(
    "the first opens with its staged imports and is read again on reload",
    async world => {
      const id = orderId(AC30.order);
      const reads = sentInWindow(isOrderRead(id));
      check(size(reads) >= 2, "size(reads) >= 2");
      for (const read of reads) {
        same(
          read.searchParams.get("with_staged_imports"),
          "1",
          "read.searchParams.get('with_staged_imports')"
        );
        check(
          includes(
            split(read.searchParams.get("with") ?? "", ","),
            "contract_product_tags"
          ),
          "split(read.searchParams.get('with') ?? '', ',') contains 'contract_product_tags'"
        );
      }
      await settles(() =>
        world.expectContext(
          {
            model: {
              id,
              number: AC30.order.response.body.data.number
            }
          },
          INVOICE_SCENARIO
        )
      );
    }
  );

  Then("the second is reported as not available", world =>
    settles(() =>
      world.expectMeta(
        { isUnavailable: true, isLoading: false },
        MISSING_INVOICE_SCENARIO
      )
    )
  );

  // === FE-3237 AC15 — THE ITEMS OF ONE ORDER =================================

  Given(
    "one of my orders with a subscription, options and a snapshot",
    world => {
      const snapshot = snapshotItems(AC32);
      const live = AC32.response.body.data.products ?? [];
      if (
        !some(snapshot, item => Number(item.billing_cycle_months) > 0) ||
        !some(snapshot, item => size(item.options) > 0) ||
        !some(
          snapshot,
          (item, index) =>
            item.billing_cycle_months !== live[index]?.billing_cycle_months
        )
      )
        throw new Error(
          "the order recording must hold a subscription with options whose snapshot differs from its live items; re-record."
        );
      return openDetail(world, orderId(AC32));
    }
  );

  When("I open that order", world =>
    settles(() => world.expectMeta({ isLoading: false }))
  );

  Then(
    "I see each item from the snapshot, with its term, billing cycle name, tags and sub-items",
    world =>
      settles(() =>
        world.expectContext({
          items: map(snapshotItems(AC32), item => {
            const months =
              item.billing_cycle_months ||
              item.product?.billing_cycle_months ||
              0;
            return {
              id: item.id,
              billingCycleMonths: months,
              isSubscription: !!item.billing_cycle_days || !!months,
              billingCycle: months ? { months } : undefined,
              reference: item.client_label || "",
              tags: [],
              hasSubItems: size(item.options) > 0
            };
          })
        })
      )
  );

  // === FE-3237 AC16 — THE CATALOGUE IMAGE OF EACH ITEM =======================

  Given(
    "one of my orders whose snapshot items have catalogue images",
    world => {
      if (!some(AC33.images.response.body.data, row => !!row.image?.full_url))
        throw new Error(
          "the image recording must hold a catalogue image; re-record."
        );
      return openDetail(world, orderId(AC33.order));
    }
  );

  Then(
    "each item shows its catalogue image, or its product image when it has none",
    async world => {
      const catalogue = new Map(
        map(AC33.images.response.body.data, row => [
          row.id,
          row.image?.full_url
        ])
      );
      await settles(() =>
        world.expectContext({
          items: map(snapshotItems(AC33.order), item => ({
            id: item.id,
            image:
              catalogue.get(item.product?.id ?? "") ??
              item.product?.image?.full_url ??
              undefined
          }))
        })
      );
      const images = sentInWindow(request =>
        request.pathname.endsWith("/api/products")
      );
      same(size(images), 1, "size(images)");
      same(
        images[0].searchParams.get("with"),
        "image",
        "images[0].searchParams.get('with')"
      );
    }
  );

  // === FE-3237 AC18 — THE ORDER CONDITIONS (design 8.5 truth table) ==========

  Given("one of my orders is unpaid", world => {
    assertRecordedState("unpaid", CONDITION_ORDERS.unpaid);
    observed.conditionRow = "unpaid";
    return openDetail(world, orderId(CONDITION_ORDERS.unpaid));
  });

  Given("one of my orders is overdue", world => {
    assertRecordedState("overdue", CONDITION_ORDERS.overdue);
    observed.conditionRow = "overdue";
    return openDetail(world, orderId(CONDITION_ORDERS.overdue));
  });

  Given("one of my orders is paid", world => {
    assertRecordedState("paid", CONDITION_ORDERS.paid);
    observed.conditionRow = "paid";
    return openDetail(world, orderId(CONDITION_ORDERS.paid));
  });

  Given("one of my orders is partly paid", world => {
    assertRecordedState("partlyPaid", CONDITION_ORDERS.partlyPaid);
    observed.conditionRow = "partlyPaid";
    return openDetail(world, orderId(CONDITION_ORDERS.partlyPaid));
  });

  Given("one of my orders is cancelled", world => {
    assertRecordedState("cancelled", CONDITION_ORDERS.cancelled);
    observed.conditionRow = "cancelled";
    return openDetail(world, orderId(CONDITION_ORDERS.cancelled));
  });

  Then(
    "it reads as due, payable and cancellable, the pay gate is open and the cancel gate is open",
    world =>
      settles(() =>
        world.expectMeta({
          isDue: true,
          isPayable: true,
          isCancellable: true,
          canPay: true,
          canCancel: true
        })
      )
  );

  Then("it reads as overdue, due, payable and cancellable", world =>
    settles(() =>
      world.expectMeta({
        isOverdue: true,
        isDue: true,
        isPayable: true,
        isCancellable: true
      })
    )
  );

  Then(
    "it reads as paid, the pay gate is closed and the cancel gate is closed",
    world =>
      settles(() =>
        world.expectMeta({ isPaid: true, canPay: false, canCancel: false })
      )
  );

  Then("it reads as partly paid, due, payable and cancellable", world =>
    settles(() =>
      world.expectMeta({
        isPartiallyPaid: true,
        isDue: true,
        isPayable: true,
        isCancellable: true
      })
    )
  );

  Then(
    "it reads as cancelled, the pay gate is closed and the cancel gate is closed",
    world =>
      settles(() =>
        world.expectMeta({ isCancelled: true, canPay: false, canCancel: false })
      )
  );

  Then("every other condition reads as its truth-table row", world => {
    if (!observed.conditionRow)
      throw new Error("no condition order was opened.");
    return readsAsRow(world, observed.conditionRow);
  });

  // === FE-3237 AC19 — THE DELEGATED MARKER ===================================

  Given("a client delegated one of their orders to me", world => {
    if (!AC35_DELEGATED.response.body.data.delegate_related)
      throw new Error(
        "the order recording must be delegated to me; re-record."
      );
    return openDetail(world, orderId(AC35_DELEGATED));
  });

  Then("it reads as delegated", world =>
    settles(() => world.expectMeta({ isDelegated: true }))
  );

  // === FE-3237 AC6, AC14, AC19 — @todo, named blockers in the feature ========
  // Each reads its recording when it runs, so a scenario staging cannot hold
  // yet costs the catalog nothing until it is recorded.

  Given(
    "I have a paid, a cancelled, a delegated and a refund-changed order",
    () => {
      const rows = listRecording(
        "read-the-row-of-each-of-my-orders",
        "03",
        params => params.get("filter[category.slug]") === ORDER_CATEGORY
      ).response.body.data as Array<{
        status?: { code?: string };
        delegate_related?: boolean;
        refund_changed?: string | null;
      }>;
      if (
        !some(rows, ["status.code", InvoiceStatus.PAID]) ||
        !some(rows, ["status.code", InvoiceStatus.CANCELLED]) ||
        !some(rows, row => !!row.delegate_related) ||
        !some(rows, row => !!row.refund_changed)
      )
        throw new Error(
          "the first page must hold the four kinds of order; re-record."
        );
    }
  );

  Then(
    "each row carries its number, total, items, dates, status, brand and markers",
    world => {
      const rows = listRecording(
        "read-the-row-of-each-of-my-orders",
        "03",
        params => params.get("filter[category.slug]") === ORDER_CATEGORY
      ).response.body.data as Array<{
        id: string;
        number: string;
        products_count: number;
        status: { code: string };
        brand: { name: string };
        refund_changed?: string | null;
        delegate_related?: boolean;
        pending_payment_method?: unknown;
      }>;
      return settles(() =>
        world.expectContext({
          data: map(rows, row => ({
            id: row.id,
            number: row.number,
            status: row.status.code,
            brandName: row.brand.name,
            bundle: { productCount: row.products_count },
            refundChanged: row.refund_changed ?? undefined,
            hasPendingPaymentMethod: !!row.pending_payment_method
          }))
        })
      );
    }
  );

  Given("one of my orders with notes, custom fields and a referrer", world => {
    const order = orderRecording("read-the-details-of-one-of-my-orders");
    return openDetail(world, orderId(order));
  });

  Then(
    "I see its number, status, totals, dates, contract, notes, custom fields and referrer",
    world => {
      const order = orderRecording("read-the-details-of-one-of-my-orders")
        .response.body.data as {
        number: string;
        status?: { code?: string };
        contract_id?: string;
        notes?: string;
        custom_fields?: unknown;
        account?: {
          affiliate_referral?: {
            affiliate_account?: {
              account?: { client?: Array<{ id: string }> };
            };
          };
        };
      };
      return settles(() =>
        world.expectContext({
          model: {
            number: order.number,
            status: order.status?.code,
            contractId: order.contract_id,
            notes: order.notes,
            customFields: order.custom_fields,
            referrer: {
              id: order.account?.affiliate_referral?.affiliate_account?.account
                ?.client?.[0]?.id
            }
          }
        })
      );
    }
  );

  Given("one of my orders has a payment that has not settled", world =>
    openDetail(
      world,
      orderId(
        orderRecording("read-an-order-with-a-payment-in-flight-as-pending")
      )
    )
  );

  Then("it reads as having a pending payment", world =>
    settles(() => world.expectMeta({ hasPendingPayment: true }))
  );

  Then("my unpaid check counts only my own invoices", async world => {
    await settles(() =>
      world.expectMeta({ hasUnpaid: AC19.unpaidTotal > 0, hasError: false })
    );
    const probes = sentSinceMark(isProbe);
    check(size(probes) !== 0, "probes has length 0");
    for (const probe of probes) {
      same(
        probe.searchParams.get("filter[client_id]"),
        SESSION_CLIENT_ID,
        "probe.searchParams.get('filter[client_id]')"
      );
      differs(
        probe.searchParams.get("filter[category.slug]"),
        ORDER_CATEGORY,
        "probe.searchParams.get('filter[category.slug]')"
      );
    }
  });
});

export default invoicesSteps;
