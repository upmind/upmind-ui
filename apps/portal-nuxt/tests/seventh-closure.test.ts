// -----------------------------------------------------------------------------
/**
 * @module tests/seventh-closure
 * @description Phase F11: the eleven leaf capabilities the seventh audit read
 * as open. A vault row is pinned to the top of its panel and says who wrote it
 * (C1, C2); credit notes and the affiliate's three tables carry the same
 * toolbars every other panel has (C3, C4); a document names the card that will
 * settle it and takes one that is clearing off the page (C5, C9); a parent
 * saves the appearance it lends (C6); the brand's mark leaves the portal where
 * the brand publishes a site (C7); an `?init=` link opens one door once (C8);
 * the account card stops repeating the sign-in address (C10); and the two
 * staff-only email verbs are gone (C11).
 *
 * Every figure is read off a facade output or off the seed — no amount is
 * added up here (plan R6) — and each gate is graded on BOTH seeds where the
 * seed or the gate applies. Facts that no seed carries (a staged import, a
 * delegated invoice, an account with no stored card) are graded on a clone of
 * the hostgrid seed with that ONE fact moved, so the branch is reached without
 * authoring a dataset.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BrandConfigKeys,
  CreditNoteStatus,
  GatewayTypes
} from "@upmind-automation/types";
import {
  assign,
  cloneDeep,
  filter,
  find,
  first,
  includes,
  intersection,
  last,
  map,
  maxBy,
  minBy,
  reject,
  size,
  some,
  sortBy,
  uniq
} from "lodash-es";
import type { PaginationInfo } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockAffiliatePayout,
  MockCreditNote,
  MockDataset,
  MockInvoice,
  MockVaultAsset
} from "~/portal/mock/types";
import type { BrandModuleProps } from "~/portal/modules/brand/types";
import type {
  DocumentModuleAction,
  DocumentModulePayment
} from "~/portal/modules/document/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  accountNotesCollection,
  accountSecretsCollection,
  affiliateCommissionsCollection,
  affiliateLinksCollection,
  affiliatePayoutsCollection,
  creditNotesCollection,
  productCreditNotesCollection
} from "~/portal/mock/collection-defs";
import * as brandingSchemas from "~/portal/mock/contracts/client-account.branding.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  isInvoiceClearing,
  useMockAccount,
  useMockVault
} from "~/portal/mock/facades";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import {
  BRAND_GATE_CONFIG_KEY,
  MOCK_PAYMENT_STATUS
} from "~/portal/mock/types";
import Brand from "~/portal/modules/brand/Brand.vue";
import { LIST_CONTROLS_RANGE_SEPARATOR } from "~/portal/modules/list-controls/types";
import { resolve } from "~/portal/resolve";
import { PRIMITIVE_ID } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

/** The showcase product both vault scopes and the product ledger hang off. */
const LEDGER_PRODUCT_ID = "prod-analytics";

/** Pinned and edited since it was written; author-only; loose. */
const EDITED_SECRET_ID = "v1";
const AUTHOR_ONLY_NOTE_ID = "v2";
const LOOSE_SECRET_ID = "v6";
const PINNED_PRODUCT_NOTE_ID = "v4";

/** The document that names its own card, and the one clearing by bank transfer. */
const NAMED_METHOD_INVOICE_ID = "inv-88";
const NAMED_METHOD_ID = "pm-visa-42";
const CLEARING_INVOICE_ID = "inv-96";

const initRoute: { query: Record<string, unknown> } = { query: {} };
const initReplace = vi.fn();

vi.mock("vue-router", async () => {
  const actual =
    await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => initRoute,
    useRouter: () => ({ replace: initReplace })
  };
});

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

/** A detached copy of the shipped seed, for the facts no dataset carries. */
function clone(): MockDataset {
  return cloneDeep(HOSTGRID_MOCK_DATASET);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function rowsOf(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): ListModuleItem[] {
  return ref<ListModuleItem[]>(data, id, context) ?? [];
}

function rowFor(rows: readonly ListModuleItem[], id: string): ListModuleItem {
  const row = find(rows, { id });
  if (row === undefined) throw new Error(`no row ${id}`);
  return row;
}

function offeredValues(row: ListModuleItem): string[] {
  return map(
    [row.action, ...(row.moreActions ?? [])],
    entry => entry?.value ?? ""
  );
}

function labelFor(row: ListModuleItem, verb: string): string | undefined {
  return find(row.moreActions ?? [], entry => entry.value.startsWith(verb))
    ?.label;
}

function invoiceOf(data: MockDataset, id: string): MockInvoice {
  const invoice = find(data.invoices, { id });
  if (invoice === undefined) throw new Error(`seed carries no invoice ${id}`);
  return invoice;
}

function vaultRow(data: MockDataset, id: string): MockVaultAsset {
  const row = find(data.vault, { id });
  if (row === undefined) throw new Error(`seed carries no vault row ${id}`);
  return row;
}

function pinValue(id: string): string {
  return mockActionValue(MOCK_ACTION.VAULT_PIN, id);
}

/**
 * One collection instance's whole set, by widening its page. Typed off the
 * members it uses rather than off `MockCollectionDefinition`, so every
 * definition's own row and filter types are carried through.
 */
function wholeOf<TRow>(instance: {
  useActions: () => { setLimit: (value: number) => void };
  useContext: () => {
    data: ComputedRef<TRow[]>;
    pagination: ComputedRef<PaginationInfo>;
  };
}): TRow[] {
  const view = instance.useContext();
  instance.useActions().setLimit(Math.max(view.pagination.value.total, 1));
  return view.data.value;
}

function filterValue(collectionId: string, key: string, value: string): string {
  return `${mockActionValue(MOCK_ACTION.COLLECTION_FILTER, collectionId)}:${key}:${value}`;
}

function searchValue(collectionId: string, text: string): string {
  return `${mockActionValue(MOCK_ACTION.COLLECTION_SEARCH, collectionId)}:${text}`;
}

function sortValue(collectionId: string, value: string): string {
  return `${mockActionValue(MOCK_ACTION.COLLECTION_SORT, collectionId)}:${value}`;
}

function range(from: string, to: string): string {
  return `${from}${LIST_CONTROLS_RANGE_SEPARATOR}${to}`;
}

/** Whether a list of dates never rises — the shape a "newest first" order has. */
function neverRises(dates: readonly string[]): boolean {
  return dates.every(
    (date, index) => index === 0 || (dates[index - 1] ?? "") >= date
  );
}

function neverFalls(dates: readonly string[]): boolean {
  return dates.every(
    (date, index) => index === 0 || (dates[index - 1] ?? "") <= date
  );
}

function neverRisesBy(values: readonly number[]): boolean {
  return values.every(
    (value, index) => index === 0 || (values[index - 1] ?? 0) >= value
  );
}

// -----------------------------------------------------------------------------
// C1 — the row a client keeps at the top
// -----------------------------------------------------------------------------

describe("C1 — pinning a vault row to the top of its panel", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("lifts a row to the head of its panel, and lets it back down where it was", () => {
    const data = hostgrid();
    const before = map(rowsOf(data, DATA_REF_ID.ACCOUNT_NOTE_ITEMS), "id");
    const target = before[4];
    if (target === undefined) throw new Error("the notes panel is too short");

    const pinned = dispatchMockAction(data, NO_CONTEXT, pinValue(target));

    expect(vaultRow(data, target).pinned).toBe(true);
    expect(pinned?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(first(map(rowsOf(data, DATA_REF_ID.ACCOUNT_NOTE_ITEMS), "id"))).toBe(
      target
    );

    const loosed = dispatchMockAction(data, NO_CONTEXT, pinValue(target));

    expect(vaultRow(data, target).pinned).toBe(false);
    expect(loosed?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(map(rowsOf(data, DATA_REF_ID.ACCOUNT_NOTE_ITEMS), "id")).toEqual(
      before
    );
  });

  it("offers Unpin on a held row and Pin on a loose one, and tags the held one", () => {
    const data = hostgrid();
    const secrets = rowsOf(data, DATA_REF_ID.ACCOUNT_SECRET_ITEMS);
    const held = rowFor(secrets, EDITED_SECRET_ID);
    const loose = rowFor(secrets, LOOSE_SECRET_ID);

    expect(vaultRow(data, EDITED_SECRET_ID).pinned).toBe(true);
    expect(vaultRow(data, LOOSE_SECRET_ID).pinned).toBeUndefined();
    expect(offeredValues(held)).toContain(pinValue(EDITED_SECRET_ID));
    expect(offeredValues(loose)).toContain(pinValue(LOOSE_SECRET_ID));
    expect(labelFor(held, MOCK_ACTION.VAULT_PIN)).toBe("Unpin");
    expect(labelFor(loose, MOCK_ACTION.VAULT_PIN)).toBe("Pin");
    expect(map(held.tags ?? [], "label")).toContain("Pinned");
    expect(map(loose.tags ?? [], "label")).not.toContain("Pinned");
  });

  it("keeps every held row above every loose one, on both account panels", () => {
    const data = hostgrid();
    const held = (rows: readonly MockVaultAsset[]): string[] =>
      map(filter(rows, { pinned: true }), "id");
    const loose = (rows: readonly MockVaultAsset[]): string[] =>
      map(reject(rows, { pinned: true }), "id");

    // The seed pins one SECRET and no note, so each panel is graded once as it
    // ships and once with a trailing row pinned.
    expect(first(wholeOf(accountSecretsCollection.resolve(data)))?.id).toBe(
      EDITED_SECRET_ID
    );

    for (const panel of [accountNotesCollection, accountSecretsCollection]) {
      const before = wholeOf(panel.resolve(data));
      const trailing = last(before);
      if (trailing === undefined) throw new Error("the panel is empty");
      expect(map(before, "id")).toEqual([...held(before), ...loose(before)]);

      dispatchMockAction(data, NO_CONTEXT, pinValue(trailing.id));
      const rows = wholeOf(panel.resolve(data));

      expect(size(held(rows))).toBeGreaterThan(0);
      expect(size(loose(rows))).toBeGreaterThan(0);
      expect(map(rows, "id")).toEqual([...held(rows), ...loose(rows)]);
      expect(held(rows)).toContain(trailing.id);
      // Only the pinned row moved — the rest keep the order the vault holds.
      expect(loose(rows)).toEqual(
        map(
          reject(before, row => row.id === trailing.id || row.pinned === true),
          "id"
        )
      );
    }
  });

  it("seats the rows the seed pinned at the head of their panels, before any write", () => {
    const data = hostgrid();
    const scoped = clone();
    const context: DataRouteContext = { productId: LEDGER_PRODUCT_ID };
    // A second note moved onto the product so its panel has an order at all;
    // no pin is written here — this is the seed's own arrangement.
    assign(vaultRow(scoped, AUTHOR_ONLY_NOTE_ID), {
      contract_product_id: LEDGER_PRODUCT_ID
    });

    expect(vaultRow(data, EDITED_SECRET_ID).pinned).toBe(true);
    expect(vaultRow(scoped, PINNED_PRODUCT_NOTE_ID).pinned).toBe(true);
    expect(vaultRow(scoped, AUTHOR_ONLY_NOTE_ID).pinned).toBeUndefined();

    expect(first(rowsOf(data, DATA_REF_ID.ACCOUNT_SECRET_ITEMS))?.id).toBe(
      EDITED_SECRET_ID
    );
    expect(
      map(rowsOf(scoped, DATA_REF_ID.PRODUCT_NOTE_ITEMS, context), "id")
    ).toEqual([PINNED_PRODUCT_NOTE_ID, AUTHOR_ONLY_NOTE_ID]);
  });

  it("keeps the held row above the loose one on a product's panels too", () => {
    const scoped = clone();
    const context: DataRouteContext = { productId: LEDGER_PRODUCT_ID };
    // The seed scopes one note and one secret to this product, so a second of
    // each is moved onto it rather than authored.
    assign(vaultRow(scoped, AUTHOR_ONLY_NOTE_ID), {
      contract_product_id: LEDGER_PRODUCT_ID
    });
    assign(vaultRow(scoped, LOOSE_SECRET_ID), {
      contract_product_id: LEDGER_PRODUCT_ID
    });

    const secretsBefore = map(
      rowsOf(scoped, DATA_REF_ID.PRODUCT_SECRET_ITEMS, context),
      "id"
    );
    dispatchMockAction(scoped, context, pinValue(LOOSE_SECRET_ID));

    expect(last(secretsBefore)).toBe(LOOSE_SECRET_ID);
    expect(
      first(
        map(rowsOf(scoped, DATA_REF_ID.PRODUCT_SECRET_ITEMS, context), "id")
      )
    ).toBe(LOOSE_SECRET_ID);
  });

  it("refuses the pin while the account is still being imported, and says so first", () => {
    const staged = clone();
    assign(staged.persona, { stagedImport: true });
    const settled = clone();

    const refusal = useMockVault(staged).useActions().whyNotEditable();
    const row = rowFor(
      rowsOf(staged, DATA_REF_ID.ACCOUNT_NOTE_ITEMS),
      AUTHOR_ONLY_NOTE_ID
    );
    const offer = find(row.moreActions ?? [], entry =>
      entry.value.startsWith(MOCK_ACTION.VAULT_PIN)
    );

    expect(useMockVault(settled).useActions().whyNotEditable()).toBeUndefined();
    expect(refusal?.reason).toBe(MOCK_RECEIPT_REASON.STAGED_IMPORT);
    // Asked before the control is offered, not after it is pressed.
    expect(offer?.disabledReason).toBeTruthy();

    const write = useMockVault(staged)
      .useActions()
      .setPinned(AUTHOR_ONLY_NOTE_ID);
    const dispatched = dispatchMockAction(
      staged,
      NO_CONTEXT,
      pinValue(AUTHOR_ONLY_NOTE_ID)
    );

    expect(write?.ok).toBe(false);
    expect(write?.reason).toBe(MOCK_RECEIPT_REASON.STAGED_IMPORT);
    expect(dispatched?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(dispatched?.toast?.title).toBe(offer?.disabledReason);
    expect(vaultRow(staged, AUTHOR_ONLY_NOTE_ID).pinned).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// C2 — who wrote a vault row, and who last changed it
// -----------------------------------------------------------------------------

describe("C2 — the author line a vault row carries", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("names the writer and the day, and the editor and the day, where the seed has both", () => {
    const data = hostgrid();
    const seeded = vaultRow(data, EDITED_SECRET_ID);
    const line =
      rowFor(rowsOf(data, DATA_REF_ID.ACCOUNT_SECRET_ITEMS), EDITED_SECRET_ID)
        .category ?? "";

    expect(seeded.authorName).toBeTruthy();
    expect(seeded.editorName).toBeTruthy();
    expect(seeded.editorName).not.toBe(seeded.authorName);
    expect(line).toContain(seeded.authorName);
    expect(line).toContain(seeded.created_at);
    expect(line).toContain(seeded.editorName);
    expect(line).toContain(seeded.updated_at);
    // The writer is named before the editor, as legacy's summary read.
    expect(line.indexOf(seeded.authorName ?? "")).toBeLessThan(
      line.indexOf(seeded.editorName ?? "")
    );
  });

  it("names only the writer where nobody has changed it since", () => {
    const data = hostgrid();
    const seeded = vaultRow(data, AUTHOR_ONLY_NOTE_ID);
    const line =
      rowFor(rowsOf(data, DATA_REF_ID.ACCOUNT_NOTE_ITEMS), AUTHOR_ONLY_NOTE_ID)
        .category ?? "";

    expect(seeded.authorName).toBeTruthy();
    expect(seeded.editorName).toBeUndefined();
    expect(line).toContain(seeded.authorName);
    expect(line).toContain(seeded.created_at);
    expect(line).not.toMatch(/edited/i);
  });

  it("says nothing at all on a row the seed names nobody for", () => {
    const data = hostgrid();
    const anonymous = filter(
      rowsOf(data, DATA_REF_ID.ACCOUNT_NOTE_ITEMS),
      row => vaultRow(data, row.id).authorName === undefined
    );

    expect(size(anonymous)).toBeGreaterThan(0);
    for (const row of anonymous) {
      expect(row.category).toBeUndefined();
    }
  });
});

// -----------------------------------------------------------------------------
// C3 — the credit notes toolbar
// -----------------------------------------------------------------------------

const CREDIT_NOTE_BANDS = ["under-25", "25-100", "100-500", "500-plus"];

function creditNotes(data: MockDataset): MockCreditNote[] {
  return wholeOf(creditNotesCollection.resolve(data));
}

function creditNotesView(data: MockDataset) {
  return creditNotesCollection.resolve(data).useContext();
}

describe("C3 — the credit notes panel narrows like every other panel", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("offers a search, an amount band, a status switch, an issued range and four orders", () => {
    const view = creditNotesView(hostgrid());
    const controls = view.filterControls;

    expect(view.isSearchable).toBe(true);
    expect(map(controls, "key")).toEqual(["total", "status", "dateCreated"]);
    expect(
      map(find(controls, { key: "total" })?.options ?? [], "value")
    ).toEqual(expect.arrayContaining(CREDIT_NOTE_BANDS));
    expect(
      map(find(controls, { key: "status" })?.options ?? [], "label")
    ).toEqual(["Allocated", "Unallocated"]);
    expect(find(controls, { key: "dateCreated" })?.kind).toBe("date-range");
    expect(size(view.sortOptions)).toBe(4);
    expect(map(view.sortOptions, "value")).toContain("number");
  });

  it("finds one credit note by the number the client typed", () => {
    const data = hostgrid();
    const view = creditNotesView(data);
    const wanted = rowFor(
      rowsOf(data, DATA_REF_ID.CREDIT_NOTE_LIST_ITEMS),
      "cn-13"
    );
    const seeded = find(data.creditNotes, { id: "cn-13" });

    dispatchMockAction(
      data,
      NO_CONTEXT,
      searchValue(PAGED_COLLECTION_ID.CREDIT_NOTES, seeded?.number ?? "")
    );

    expect(view.pagination.value.total).toBe(1);
    expect(map(view.data.value, "id")).toEqual([wanted.id]);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      searchValue(PAGED_COLLECTION_ID.CREDIT_NOTES, "")
    );
    expect(view.pagination.value.total).toBe(size(data.creditNotes));
  });

  it("splits the whole set across its four amount bands, and no note falls in two", () => {
    const data = hostgrid();
    const everyNote = map(creditNotes(data), "id");
    const banded: Record<string, string[]> = {};

    for (const band of CREDIT_NOTE_BANDS) {
      dispatchMockAction(
        data,
        NO_CONTEXT,
        filterValue(PAGED_COLLECTION_ID.CREDIT_NOTES, "total", band)
      );
      banded[band] = map(creditNotes(data), "id");
    }
    dispatchMockAction(
      data,
      NO_CONTEXT,
      filterValue(PAGED_COLLECTION_ID.CREDIT_NOTES, "total", "")
    );

    const gathered = Object.values(banded).flat();
    expect(size(everyNote)).toBeGreaterThan(0);
    expect(sortBy(gathered)).toEqual(sortBy(everyNote));
    expect(size(uniq(gathered))).toBe(size(gathered));
    expect(some(CREDIT_NOTE_BANDS, band => size(banded[band] ?? []) > 0)).toBe(
      true
    );
    // The bands are ordered by the figures they hold, not merely disjoint.
    const cheapest = filter(data.creditNotes, note =>
      includes(banded["under-25"] ?? [], note.id)
    );
    const next = filter(data.creditNotes, note =>
      includes(banded["25-100"] ?? [], note.id)
    );
    expect(
      maxBy(cheapest, note => note.total.amount)?.total.amount
    ).toBeLessThan(minBy(next, note => note.total.amount)?.total.amount ?? 0);
  });

  it("narrows to one standing, and to the window the client picked", () => {
    const data = hostgrid();
    const view = creditNotesView(data);
    const allocated = filter(data.creditNotes, {
      status: CreditNoteStatus.ALLOCATED
    });
    const august = filter(
      data.creditNotes,
      note => note.issuedDate >= "2026-08-01" && note.issuedDate <= "2026-08-31"
    );

    expect(size(allocated)).toBeGreaterThan(0);
    expect(size(allocated)).toBeLessThan(size(data.creditNotes));
    dispatchMockAction(
      data,
      NO_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.CREDIT_NOTES,
        "status",
        CreditNoteStatus.ALLOCATED
      )
    );
    expect(view.pagination.value.total).toBe(size(allocated));
    expect(sortBy(map(creditNotes(data), "id"))).toEqual(
      sortBy(map(allocated, "id"))
    );
    dispatchMockAction(
      data,
      NO_CONTEXT,
      filterValue(PAGED_COLLECTION_ID.CREDIT_NOTES, "status", "")
    );

    expect(size(august)).toBeGreaterThan(0);
    expect(size(august)).toBeLessThan(size(data.creditNotes));
    dispatchMockAction(
      data,
      NO_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.CREDIT_NOTES,
        "dateCreated",
        range("2026-08-01", "2026-08-31")
      )
    );
    expect(sortBy(map(creditNotes(data), "id"))).toEqual(
      sortBy(map(august, "id"))
    );
  });

  it("orders them by number, by day and by size", () => {
    const data = hostgrid();
    const view = creditNotesView(data);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      sortValue(PAGED_COLLECTION_ID.CREDIT_NOTES, "number")
    );
    expect(map(view.data.value, "id")).toEqual(
      map(
        sortBy(data.creditNotes, "number").slice(0, size(view.data.value)),
        "id"
      )
    );

    dispatchMockAction(
      data,
      NO_CONTEXT,
      sortValue(PAGED_COLLECTION_ID.CREDIT_NOTES, "newest")
    );
    expect(
      neverRises(
        map(creditNotes(data), (note: MockCreditNote) => note.issuedDate)
      )
    ).toBe(true);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      sortValue(PAGED_COLLECTION_ID.CREDIT_NOTES, "oldest")
    );
    expect(
      neverFalls(
        map(creditNotes(data), (note: MockCreditNote) => note.issuedDate)
      )
    ).toBe(true);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      sortValue(PAGED_COLLECTION_ID.CREDIT_NOTES, "total")
    );
    expect(
      neverRisesBy(map(creditNotes(data), note => note.total.amount))
    ).toBe(true);
  });

  it("asks a product's own credit notes the same questions, and narrows them the same way", () => {
    const data = hostgrid();
    const context: DataRouteContext = { productId: LEDGER_PRODUCT_ID };
    const account = creditNotesView(data);
    const product = productCreditNotesCollection
      .resolve(data, context)
      .useContext();

    expect(product.filterControls).toEqual(account.filterControls);
    expect(product.sortOptions).toEqual(account.sortOptions);
    expect(product.isSearchable).toBe(account.isSearchable);

    const allocated = filter(data.creditNotes, {
      status: CreditNoteStatus.ALLOCATED,
      productId: LEDGER_PRODUCT_ID
    });
    expect(size(allocated)).toBeGreaterThan(0);

    dispatchMockAction(
      data,
      context,
      filterValue(
        PAGED_COLLECTION_ID.PRODUCT_CREDIT_NOTES,
        "status",
        CreditNoteStatus.ALLOCATED
      )
    );

    expect(product.pagination.value.total).toBe(size(allocated));
    expect(
      sortBy(
        map(wholeOf(productCreditNotesCollection.resolve(data, context)), "id")
      )
    ).toEqual(sortBy(map(allocated, "id")));
    // The account's own panel is untouched by the product tab's narrowing.
    expect(account.pagination.value.total).toBe(size(data.creditNotes));
  });
});

// -----------------------------------------------------------------------------
// C4 — the affiliate's three tables
// -----------------------------------------------------------------------------

function linksView(data: MockDataset) {
  return affiliateLinksCollection.resolve(data).useContext();
}

/** The day a payout reads under — the day it settled, else the day it was asked for. */
function payoutDay(payout: MockAffiliatePayout): string {
  return payout.paidAt ?? payout.requestedAt;
}

describe("C4 — the affiliate tables carry their own toolbars", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("pages the padded links and opens on the newest of them", () => {
    const data = hostgrid();
    const view = linksView(data);
    const links = data.affiliate?.links ?? [];
    const firstPage = map(view.data.value, "id");

    expect(size(links)).toBeGreaterThan(view.pagination.value.limit);
    expect(view.pagination.value.total).toBe(size(links));
    expect(view.pagination.value.pages).toBeGreaterThan(1);
    expect(neverRises(map(view.data.value, link => link.createdAt))).toBe(true);
    expect(first(view.data.value)?.createdAt).toBe(
      maxBy(links, link => link.createdAt)?.createdAt
    );

    dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(
        MOCK_ACTION.PAGE_NEXT,
        PAGED_COLLECTION_ID.AFFILIATE_LINKS
      )
    );

    expect(intersection(firstPage, map(view.data.value, "id"))).toEqual([]);
    expect(map(rowsOf(data, DATA_REF_ID.AFFILIATE_LINK_ITEMS), "id")).toEqual(
      map(view.data.value, "id")
    );
  });

  it("finds a link by its name and by where following it lands", () => {
    const data = hostgrid();
    const view = linksView(data);
    const links = data.affiliate?.links ?? [];
    const named = find(links, { id: "lnk-2" });
    const byName = filter(links, link =>
      includes(link.name, named?.name ?? "no-such-link")
    );
    const byRedirect = filter(links, link =>
      includes(link.redirectUrl, named?.redirectUrl ?? "no-such-link")
    );

    expect(named).toBeDefined();
    dispatchMockAction(
      data,
      NO_CONTEXT,
      searchValue(PAGED_COLLECTION_ID.AFFILIATE_LINKS, named?.name ?? "")
    );
    expect(sortBy(map(view.data.value, "id"))).toEqual(
      sortBy(map(byName, "id"))
    );

    expect(size(byRedirect)).toBeGreaterThan(1);
    dispatchMockAction(
      data,
      NO_CONTEXT,
      searchValue(PAGED_COLLECTION_ID.AFFILIATE_LINKS, named?.redirectUrl ?? "")
    );
    expect(sortBy(map(view.data.value, "id"))).toEqual(
      sortBy(map(byRedirect, "id"))
    );
    expect(map(view.data.value, "id")).toContain(named?.id);
  });

  it("orders the links by visits and by referrals", () => {
    const data = hostgrid();
    const view = linksView(data);
    const links = data.affiliate?.links ?? [];

    dispatchMockAction(
      data,
      NO_CONTEXT,
      sortValue(PAGED_COLLECTION_ID.AFFILIATE_LINKS, "visits")
    );
    expect(neverRisesBy(map(view.data.value, link => link.clicks))).toBe(true);
    expect(first(view.data.value)?.clicks).toBe(
      maxBy(links, link => link.clicks)?.clicks
    );

    dispatchMockAction(
      data,
      NO_CONTEXT,
      sortValue(PAGED_COLLECTION_ID.AFFILIATE_LINKS, "referrals")
    );
    expect(neverRisesBy(map(view.data.value, link => link.signups))).toBe(true);
    expect(first(view.data.value)?.signups).toBe(
      maxBy(links, link => link.signups)?.signups
    );
  });

  it("narrows the commissions to a window, and orders them both ways round", () => {
    const data = hostgrid();
    const view = affiliateCommissionsCollection.resolve(data).useContext();
    const commissions = data.affiliate?.commissions ?? [];
    const august = filter(
      commissions,
      entry => entry.earnedAt >= "2026-08-01" && entry.earnedAt <= "2026-08-31"
    );

    expect(map(view.filterControls, "kind")).toContain("date-range");
    expect(size(august)).toBeGreaterThan(0);
    expect(size(august)).toBeLessThan(size(commissions));

    dispatchMockAction(
      data,
      NO_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.AFFILIATE_COMMISSIONS,
        first(map(view.filterControls, "key")) ?? "",
        range("2026-08-01", "2026-08-31")
      )
    );
    expect(sortBy(map(view.data.value, "id"))).toEqual(
      sortBy(map(august, "id"))
    );

    dispatchMockAction(
      data,
      NO_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.AFFILIATE_COMMISSIONS,
        first(map(view.filterControls, "key")) ?? "",
        ""
      )
    );
    dispatchMockAction(
      data,
      NO_CONTEXT,
      sortValue(PAGED_COLLECTION_ID.AFFILIATE_COMMISSIONS, "oldest")
    );
    expect(
      neverFalls(
        map(
          wholeOf(affiliateCommissionsCollection.resolve(data)),
          entry => entry.earnedAt
        )
      )
    ).toBe(true);
  });

  it("narrows the payouts to a window, and orders them both ways round", () => {
    const data = hostgrid();
    const view = affiliatePayoutsCollection.resolve(data).useContext();
    const payouts = data.affiliate?.payouts ?? [];
    const june = filter(
      payouts,
      payout =>
        (payout.paidAt ?? "") >= "2026-06-01" &&
        (payout.paidAt ?? "") <= "2026-06-30"
    );

    expect(map(view.filterControls, "kind")).toContain("date-range");
    expect(size(june)).toBeGreaterThan(0);
    expect(size(june)).toBeLessThan(size(payouts));

    dispatchMockAction(
      data,
      NO_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.AFFILIATE_PAYOUTS,
        first(map(view.filterControls, "key")) ?? "",
        range("2026-06-01", "2026-06-30")
      )
    );
    expect(sortBy(map(view.data.value, "id"))).toEqual(sortBy(map(june, "id")));

    dispatchMockAction(
      data,
      NO_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.AFFILIATE_PAYOUTS,
        first(map(view.filterControls, "key")) ?? "",
        ""
      )
    );
    expect(
      neverRises(
        map(wholeOf(affiliatePayoutsCollection.resolve(data)), payoutDay)
      )
    ).toBe(true);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      sortValue(PAGED_COLLECTION_ID.AFFILIATE_PAYOUTS, "oldest")
    );
    expect(
      neverFalls(
        map(wholeOf(affiliatePayoutsCollection.resolve(data)), payoutDay)
      )
    ).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// C5 — which card settles one document
// -----------------------------------------------------------------------------

function documentActions(
  data: MockDataset,
  invoiceId: string
): DocumentModuleAction[] {
  return (
    ref<DocumentModuleAction[]>(data, DATA_REF_ID.INVOICE_DOCUMENT_ACTIONS, {
      entityId: invoiceId
    }) ?? []
  );
}

/** Every value a document's Pay control offers, its currency options included. */
function payValues(actions: readonly DocumentModuleAction[]): string[] {
  return actions.flatMap(action => [
    action.value,
    ...map(action.options ?? [], "value")
  ]);
}

describe("C5 — the card a document will be settled with", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("charges that card on every Pay control the document offers", () => {
    const data = hostgrid();
    const offered = payValues(documentActions(data, NAMED_METHOD_INVOICE_ID));
    const spare = find(
      data.paymentMethods,
      method => method.id !== NAMED_METHOD_ID
    );

    expect(
      filter(offered, value => value.startsWith(MOCK_ACTION.PAY_INVOICE))
    ).not.toEqual([]);
    for (const value of offered) {
      if (!includes(value, "pm-")) continue;
      expect(value).toContain(NAMED_METHOD_ID);
      expect(value).not.toContain(spare?.id);
    }
  });
});

// -----------------------------------------------------------------------------
// C6 — the appearance a parent lends
// -----------------------------------------------------------------------------

describe("C6 — the parent's brand appearance form", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("opens on the appearance on file, and asks for a name, a colour and a font", () => {
    const data = hostgrid();
    const entry = resolveMockForm(data, FORM_ID.PARENT_BRANDING, undefined);
    const branding = data.parentBranding;

    expect(branding).not.toBeNull();
    expect(entry?.model).toEqual({
      name: branding?.name,
      colour: branding?.colour,
      font: branding?.font
    });
    expect(entry?.schema.required).toEqual(["name", "colour", "font"]);
    expect(entry?.submit).toBe(MOCK_ACTION.PARENT_BRANDING_SAVE);
    expect(map(entry?.schema.properties?.["font"]?.enum ?? [], String)).toEqual(
      [...brandingSchemas.PARENT_BRANDING_FONTS]
    );
    expect(
      map(
        ref<SpecModuleItem[]>(data, DATA_REF_ID.PARENT_BRANDING_ACTIONS),
        "value"
      )
    ).toEqual([
      mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.PARENT_BRANDING)
    ]);
  });

  it("saves it through its own verb, and the appearance panel reads what was saved", () => {
    const data = hostgrid();
    const before = ref<SpecModuleItem[]>(
      data,
      DATA_REF_ID.PARENT_BRANDING_ITEMS
    );
    const model = {
      name: "Northwind",
      colour: "#0A0A0A",
      font: last([...brandingSchemas.PARENT_BRANDING_FONTS])
    };

    const saved = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.PARENT_BRANDING_SAVE}:${JSON.stringify(model)}`
    );
    const after = ref<SpecModuleItem[]>(
      data,
      DATA_REF_ID.PARENT_BRANDING_ITEMS
    );

    expect(saved?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(data.parentBranding).toEqual(
      assign({}, model, { logoSrc: data.parentBranding?.logoSrc })
    );
    expect(map(after, "value")).toEqual([model.name, model.colour, model.font]);
    expect(map(after, "value")).not.toEqual(map(before, "value"));
    expect(useMockAccount(data).useContext().data.value.id).toBeTruthy();
  });

  it("refuses a colour that is not a six-digit hex, and a face off the list", () => {
    const validate = usePortalAjv().compile(
      brandingSchemas.useBrandingSchema()
    );
    const face = first([...brandingSchemas.PARENT_BRANDING_FONTS]);

    expect(validate({ name: "Northwind", colour: "#1F5EFF", font: face })).toBe(
      true
    );
    expect(validate({ name: "Northwind", colour: "1F5EFF", font: face })).toBe(
      false
    );
    expect(validate({ name: "Northwind", colour: "#1F5EF", font: face })).toBe(
      false
    );
    expect(validate({ name: "Northwind", colour: "blue", font: face })).toBe(
      false
    );
    expect(
      validate({ name: "Northwind", colour: "#1F5EFF", font: "Comic Sans" })
    ).toBe(false);
    expect(validate({ name: "", colour: "#1F5EFF", font: face })).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// C7 — where the brand's mark goes
// -----------------------------------------------------------------------------

/**
 * The SHIPPED sidebar's brand props, resolved against one dataset. Only the
 * three that decide where the mark goes are carried over; the mark's own
 * presentation renders inside the same anchor either way.
 */
function brandProps(data: MockDataset): BrandModuleProps {
  Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
  const top =
    resolve(hostgridConfig).primitives[PRIMITIVE_ID.SIDEBAR]?.slots.top;
  Reflect.deleteProperty(globalThis, "useRoute");
  if (top?.status !== "module") throw new Error("the sidebar heads no brand");
  const resolved = resolveDataRefProps(top.props ?? {}, data, {});
  if (resolved === undefined)
    throw new Error("the brand props resolved to nothing");
  return {
    label: text(resolved["label"]) ?? "",
    to: text(resolved["to"]),
    href: text(resolved["href"])
  };
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value;
}

describe("C7 — the logo address the brand publishes", () => {
  it("reads the platform's own key for it", () => {
    expect(BRAND_GATE_CONFIG_KEY.UI_LOGO_URL).toBe(BrandConfigKeys.UI_LOGO_URL);
    expect(HOSTGRID_MOCK_DATASET.features.UI_LOGO_URL).toBe(
      "https://hostgrid.example"
    );
    expect(HOSTGRID_MINIMAL_MOCK_DATASET.features.UI_LOGO_URL).toBeUndefined();
  });

  it("sends the mark to that address where a brand publishes one, and home where it does not", () => {
    const published = brandProps(HOSTGRID_MOCK_DATASET);
    const unset = brandProps(HOSTGRID_MINIMAL_MOCK_DATASET);

    expect(published.href).toBe(HOSTGRID_MOCK_DATASET.features.UI_LOGO_URL);
    expect(unset.href).toBeUndefined();

    const away = mount(Brand, { props: published });
    const home = mount(Brand, { props: unset });

    expect(away.get("a").attributes("href")).toBe(
      HOSTGRID_MOCK_DATASET.features.UI_LOGO_URL
    );
    expect(away.get("a").attributes("rel")).toContain("noopener");
    expect(home.get("a").attributes("href")).toBe(published.to);
    expect(home.get("a").attributes("rel")).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// C8 — the door an `?init=` link opens
// -----------------------------------------------------------------------------

describe("C8 — the deep link that opens one door once", () => {
  beforeEach(() => {
    initReplace.mockReset();
    initReplace.mockResolvedValue(undefined);
  });

  it("opens the Pay door and drops the param, keeping the rest of the query", async () => {
    const { useInitAction } = await import("~/composables/useInitAction");
    const run = vi.fn().mockResolvedValue(undefined);
    initRoute.query = { init: "pay", tab: "unpaid" };

    useInitAction(run);
    await vi.waitFor(() => expect(run).toHaveBeenCalled());

    expect(run.mock.calls).toEqual([[MOCK_ACTION.INIT_PAY]]);
    expect(initReplace.mock.calls).toEqual([[{ query: { tab: "unpaid" } }]]);
    // The param goes first, so the door cannot be opened a second time.
    expect(initReplace.mock.invocationCallOrder[0]).toBeLessThan(
      run.mock.invocationCallOrder[0] ?? 0
    );
  });

  it("opens the migration door for an upgrade link", async () => {
    const { useInitAction } = await import("~/composables/useInitAction");
    const run = vi.fn().mockResolvedValue(undefined);
    initRoute.query = { init: "upgrade" };

    useInitAction(run);
    await vi.waitFor(() => expect(run).toHaveBeenCalled());

    expect(run.mock.calls).toEqual([[MOCK_ACTION.INIT_UPGRADE]]);
    expect(initReplace.mock.calls).toEqual([[{ query: {} }]]);
  });

  it("opens nothing, and moves nothing, for a value this build does not know", async () => {
    const { useInitAction } = await import("~/composables/useInitAction");
    const run = vi.fn().mockResolvedValue(undefined);

    for (const query of [{ init: "delete-everything" }, { init: 7 }, {}]) {
      initRoute.query = query;
      useInitAction(run);
      await Promise.resolve();
    }

    expect(run).not.toHaveBeenCalled();
    expect(initReplace).not.toHaveBeenCalled();
  });
});

// -----------------------------------------------------------------------------
// C9 — a document whose money is still in transit
// -----------------------------------------------------------------------------

describe("C9 — the document that is clearing", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("reads clearing on a pending offline payment, and on no other document", () => {
    const data = hostgrid();
    const clearing = invoiceOf(data, CLEARING_INVOICE_ID);
    const payment = first(clearing.payments);

    expect(payment?.status).toBe(MOCK_PAYMENT_STATUS.PENDING);
    expect(payment?.gatewayType).toBe(GatewayTypes.OFFLINE);
    expect(isInvoiceClearing(clearing)).toBe(true);
    for (const invoice of data.invoices) {
      expect([invoice.id, isInvoiceClearing(invoice)]).toEqual([
        invoice.id,
        some(
          invoice.payments,
          entry =>
            entry.status === MOCK_PAYMENT_STATUS.PENDING &&
            entry.gatewayType === GatewayTypes.OFFLINE
        )
      ]);
    }
    // A pending payment on an ONLINE gateway is not the same fact.
    expect(
      some(
        data.invoices,
        invoice =>
          !isInvoiceClearing(invoice) &&
          some(invoice.payments, {
            status: MOCK_PAYMENT_STATUS.PENDING
          })
      )
    ).toBe(true);
  });

  it("takes the payments panel and the document's Pay controls off while it holds", () => {
    const data = hostgrid();
    const clearing = invoiceOf(data, CLEARING_INVOICE_ID);
    const settled = invoiceOf(data, NAMED_METHOD_INVOICE_ID);

    expect(size(clearing.payments)).toBeGreaterThan(0);
    expect(
      ref<DocumentModulePayment[]>(
        data,
        DATA_REF_ID.INVOICE_DOCUMENT_PAYMENTS,
        {
          entityId: CLEARING_INVOICE_ID
        }
      )
    ).toEqual([]);
    expect(clearing.unpaidAmount.amount).toBeGreaterThan(0);
    expect(
      ref<boolean>(data, DATA_REF_ID.INVOICE_IS_PAYABLE, {
        entityId: CLEARING_INVOICE_ID
      })
    ).toBe(false);
    expect(
      filter(payValues(documentActions(data, CLEARING_INVOICE_ID)), value =>
        value.startsWith(MOCK_ACTION.PAY_INVOICE)
      )
    ).toEqual([]);

    // The same document's neighbour, owed and not clearing, keeps all of it.
    expect(settled.unpaidAmount.amount).toBeGreaterThan(0);
    expect(
      filter(payValues(documentActions(data, NAMED_METHOD_INVOICE_ID)), value =>
        value.startsWith(MOCK_ACTION.PAY_INVOICE)
      )
    ).not.toEqual([]);
  });

  it("takes the Pay control off the invoice's own row while it holds", () => {
    const data = hostgrid();
    const row = rowFor(
      rowsOf(data, DATA_REF_ID.INVOICE_ITEMS),
      CLEARING_INVOICE_ID
    );

    expect(isInvoiceClearing(invoiceOf(data, CLEARING_INVOICE_ID))).toBe(true);
    expect(
      filter(offeredValues(row), value =>
        value.startsWith(MOCK_ACTION.PAY_INVOICE)
      )
    ).toEqual([]);
    expect(
      filter(offeredValues(row), value =>
        includes(value, FORM_ID.INVOICE_PAY_AMOUNT)
      )
    ).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// C10 — the username row on the account card
// -----------------------------------------------------------------------------

describe("C10 — the username the account card states", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("states it only where it differs from the address the client signs in with", () => {
    const data = hostgrid();
    const bare = minimal();
    const stated = (dataset: MockDataset): SpecModuleItem | undefined =>
      find(
        ref<SpecModuleItem[]>(dataset, DATA_REF_ID.ACCOUNT_CARD_SPEC_ITEMS),
        { id: "username" }
      );

    expect(data.persona.username).toBe(data.persona.email);
    expect(stated(data)).toBeUndefined();

    expect(bare.persona.username).toBeTruthy();
    expect(bare.persona.username).not.toBe(bare.persona.email);
    expect(stated(bare)?.value).toBe(bare.persona.username);
  });
});

// -----------------------------------------------------------------------------
// C11 — the two staff-only verbs, gone
// -----------------------------------------------------------------------------
