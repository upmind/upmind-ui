// -----------------------------------------------------------------------------
/**
 * @module tests/eleventh-closure
 * @description Phase F15: the six client capabilities the eleventh audit read
 * as open. The invoice document states where it stands in the words legacy
 * used, proforma by proforma, with the reason a cancellation was recorded
 * under (O-1); a product row wears its trial, its delegation, its own
 * reference and the codes it was bought with, and offers a reference where
 * there is none (O-2); the allowlist is searched and each entry edited (O-3);
 * a top-up says which card funds it (O-4); a document is shared over a link
 * whose permissions are ruled on what it still owes (O-5); and a delegated
 * document says so (O-6).
 *
 * Every figure is the seed's own or the facade's own; nothing here sums.
 * Counts are hand-derived with lodash over the unnarrowed source, so a
 * narrowing and this file have to agree rather than agreeing with themselves.
 * The trial count is read DIFFERENTIALLY — a clone whose end date moves by a
 * known number of days must move the count by the same number — so the
 * assertion cannot be satisfied by echoing today's date back.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InvoiceStatus, InvoiceStatusGroups } from "@upmind-automation/types";
import {
  assign,
  every,
  filter,
  find,
  includes,
  intersection,
  map,
  reject,
  size,
  some,
  sortBy,
  uniq
} from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockDataset,
  MockInvoice,
  MockIpAddress,
  MockProduct
} from "~/portal/mock/types";
import type {
  DocumentModuleAction,
  DocumentModuleMessage
} from "~/portal/modules/document/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { ListControlsState } from "~/portal/modules/list-controls/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  INVOICE_STATUS_TAB,
  invoiceStatusTab,
  invoicesCollection,
  ipWhitelistCollection
} from "~/portal/mock/collection-defs";
import * as shareSchemas from "~/portal/mock/contracts/client-invoices.share.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  invoiceRowStanding,
  invoiceStandingMessage,
  whyNotShareable
} from "~/portal/mock/facades";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { walletTopUpContext } from "~/portal/mock/forms/billing-contexts";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { INVOICE_STATUS_LABEL } from "~/portal/mock/status-labels";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_INVOICE_CATEGORY } from "~/portal/mock/types";
import { LIST_CONTROLS_FILTER_ANY } from "~/portal/modules/list-controls/types";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const PRODUCTS_CONTEXT: DataRouteContext = { groupSlug: "products" };

/** An id no seed mints — the dispatcher's absent-subject tier. */
const ABSENT_ID = "no-such-row-9f3c";

/** One seeded document per state the standing message words. */
const STATE_SEEDS: Readonly<Record<string, string>> = {
  unpaid: "inv-95",
  overdue: "inv-96",
  paid: "inv-87",
  refunded: "inv-85",
  cancelled: "inv-79"
};

/** The document seeded as a proforma in each of the two states that carry one. */
const PROFORMA_SEEDS = ["inv-94", "inv-80"];

/** The one document standing behind a pro-rata change while it is still owed. */
const TO_BE_CREDITED = "inv-88";

/** The one document that reached this client through a delegation. */
const DELEGATED_INVOICE = "inv-93";

/** A document already shared, and one settled — the share gate's two sides. */
const SHARED_INVOICE = "inv-95";
const SETTLED_INVOICE = "inv-84";

/** The product carrying the client's own reference, and the delegated one. */
const LABELLED_PRODUCT = "prod-analytics";
const DELEGATED_PRODUCT = "prod-archive";

/** The two lists a product row is drawn on. */
const PRODUCT_ROW_REFS: readonly DataRefId[] = [
  DATA_REF_ID.ACTIVE_PRODUCT_ITEMS,
  DATA_REF_ID.GROUP_PRODUCT_ITEMS
];

const TRIAL_TAG = /free trial/i;

/** The trial tag's own two facts: how many days are left, and the day itself. */
const TRIAL_READING = /ends in (\d+) days? on (\d{4}-\d{2}-\d{2})/i;

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function bothSeeds(): void {
  resetMockData(MOCK_DATASET_ID.HOSTGRID);
  resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

/** A detached copy of the shipped brand — mutable where the live store is not. */
function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

function resolveRef<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = NO_CONTEXT
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function seededInvoice(data: MockDataset, id: string): MockInvoice {
  const invoice = find(data.invoices, { id });
  if (invoice === undefined) throw new Error(`seed carries no ${id}`);
  return invoice;
}

function seededProduct(data: MockDataset, id: string): MockProduct {
  const product = find(data.products, { id });
  if (product === undefined) throw new Error(`seed carries no ${id}`);
  return product;
}

function documentMessages(
  data: MockDataset,
  invoiceId: string
): DocumentModuleMessage[] {
  return resolveRef<DocumentModuleMessage[]>(
    data,
    DATA_REF_ID.INVOICE_DOCUMENT_MESSAGES,
    { entityId: invoiceId }
  );
}

function documentActions(
  data: MockDataset,
  invoiceId: string
): DocumentModuleAction[] {
  return resolveRef<DocumentModuleAction[]>(
    data,
    DATA_REF_ID.INVOICE_DOCUMENT_ACTIONS,
    { entityId: invoiceId }
  );
}

function noticeOf(
  data: MockDataset,
  invoiceId: string,
  id: string
): DocumentModuleMessage | undefined {
  return find(documentMessages(data, invoiceId), { id });
}

/** Owed as the PLATFORM groups it, not as any facade of ours decides. */
function isOwed(invoice: MockInvoice): boolean {
  return includes(InvoiceStatusGroups.UNPAID, invoice.status);
}

function productRows(data: MockDataset, id: DataRefId): ListModuleItem[] {
  const context =
    id === DATA_REF_ID.GROUP_PRODUCT_ITEMS ? PRODUCTS_CONTEXT : NO_CONTEXT;
  return resolveRef<ListModuleItem[]>(data, id, context);
}

/** The one tag on a row that opens the label form — an add or a reference. */
function labelTag(row: ListModuleItem) {
  return find(
    row.tags ?? [],
    tag =>
      tag.action?.value ===
      mockActionValue(
        MOCK_ACTION.OPEN_FORM,
        `${FORM_ID.PRODUCT_LABEL}:${row.id}`
      )
  );
}

function tagLabels(row: ListModuleItem | undefined): string[] {
  return map(row?.tags ?? [], "label");
}

function ipSaveValue(id: string, model: object): string {
  return `${MOCK_ACTION.IP_WHITELIST_SAVE}:${id}:${JSON.stringify(model)}`;
}

function topUpValue(model: object): string {
  return `${MOCK_ACTION.WALLET_TOPUP}:${JSON.stringify(model)}`;
}

function shareSaveValue(id: string, model: object): string {
  return `${MOCK_ACTION.INVOICE_SHARE_SAVE}:${id}:${JSON.stringify(model)}`;
}

/** Today, and the days after it, as the ISO dates the seed spells trials in. */
function isoDaysFromToday(days: number): string {
  const now = new Date();
  const day = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days)
  );
  return day.toISOString().slice(0, 10);
}

/** What a trial tag reads on one product row, on the group listing. */
function trialReadingFor(data: MockDataset, productId: string) {
  const row = find(productRows(data, DATA_REF_ID.GROUP_PRODUCT_ITEMS), {
    id: productId
  });
  const tag = find(row?.tags ?? [], candidate =>
    TRIAL_TAG.test(candidate.label)
  );
  const parsed = TRIAL_READING.exec(tag?.label ?? "");
  if (parsed === null) return undefined;
  return { days: Number(parsed[1]), date: parsed[2], label: tag?.label ?? "" };
}

// -----------------------------------------------------------------------------
// O-1 — where a document stands, in legacy's own words
// -----------------------------------------------------------------------------

describe("O-1 — the invoice document says where it stands", () => {
  beforeEach(bothSeeds);

  it("words a proforma's standing as a proforma, in every state", () => {
    const data = clone();
    const titles: string[] = [];

    for (const [state, id] of Object.entries(STATE_SEEDS)) {
      const invoice = seededInvoice(data, id);
      const proforma: MockInvoice = assign({}, invoice, {
        category: MOCK_INVOICE_CATEGORY.PROFORMA
      });
      const plain = invoiceStandingMessage(invoice);
      const quoted = invoiceStandingMessage(proforma);
      titles.push(plain.title ?? "");

      expect({ state, category: invoice.category }).toEqual({
        state,
        category: MOCK_INVOICE_CATEGORY.INVOICE
      });
      // The only fact that moved is what the document IS, so the sentence
      // has to move with it while the state it reports stays put.
      expect({ state, proforma: /proforma/i.test(plain.message) }).toEqual({
        state,
        proforma: false
      });
      expect({ state, proforma: /proforma/i.test(quoted.message) }).toEqual({
        state,
        proforma: true
      });
      expect({ state, title: quoted.title, tone: quoted.tone }).toEqual({
        state,
        title: plain.title,
        tone: plain.tone
      });
      expect(quoted.message).not.toBe(plain.message);
    }

    // Five states, five different standings — one sentence for all of them
    // would pass every line above.
    expect(size(uniq(titles))).toBe(size(titles));

    // And the seed's OWN proformas read the same way, so the wording is not
    // reachable only through a clone this file built.
    for (const id of PROFORMA_SEEDS) {
      const seeded = seededInvoice(hostgrid(), id);
      expect({ id, category: seeded.category }).toEqual({
        id,
        category: MOCK_INVOICE_CATEGORY.PROFORMA
      });
      expect(invoiceStandingMessage(seeded).message).toMatch(/proforma/i);
    }
  });

  it("states the reason recorded against a cancelled invoice", () => {
    const data = clone();
    const withReason = seededInvoice(data, "inv-79");
    const withoutReason = seededInvoice(data, "inv-80");
    const reason = withReason.statusReason ?? "";

    expect(reason).toBeTruthy();
    expect(withReason.status).toBe(InvoiceStatus.CANCELLED);
    expect(withoutReason.status).toBe(InvoiceStatus.CANCELLED);
    expect(withoutReason.statusReason).toBeUndefined();

    expect(invoiceStandingMessage(withReason).message).toContain(
      `Cancellation reason: "${reason}".`
    );
    expect(invoiceStandingMessage(withoutReason).message).not.toMatch(
      /cancellation reason/i
    );

    // The reason rides the CANCELLED standing alone: seeded onto a document
    // in any other state, it is not printed.
    for (const [state, id] of Object.entries(STATE_SEEDS)) {
      if (id === "inv-79") continue;
      const carried: MockInvoice = assign({}, seededInvoice(data, id), {
        statusReason: reason
      });
      expect({
        state,
        printed: includes(invoiceStandingMessage(carried).message, reason)
      }).toEqual({ state, printed: false });
    }
  });

  it("the document banner words a to-be-credited invoice as unpaid, with its due date and balance", () => {
    const data = hostgrid();
    const invoice = seededInvoice(data, TO_BE_CREDITED);
    const standing = noticeOf(data, invoice.id, "standing");

    expect(invoice.toBeCredited).toBe(true);
    expect(invoice.status).toBe(InvoiceStatus.UNPAID);

    expect(standing?.title).toBe(INVOICE_STATUS_LABEL[InvoiceStatus.UNPAID]);
    expect(standing?.message).toContain(invoice.dueDate);
    expect(standing?.message).toContain(invoice.unpaidAmount.formatted);
    expect(standing?.message).not.toMatch(/credited/i);

    // The document ignores the flag outright: the same document with it off
    // reads word for word the same.
    const without: MockInvoice = assign({}, invoice, { toBeCredited: false });
    expect(invoiceStandingMessage(without)).toEqual(
      invoiceStandingMessage(invoice)
    );

    // And the ROW, on that very invoice, does read it — so this is a
    // difference of surface, not of fact.
    expect(invoiceRowStanding(invoice).label).toMatch(/to be credited/i);
    expect(invoiceRowStanding(invoice).label).not.toBe(standing?.title);
  });
});

// -----------------------------------------------------------------------------
// O-6 — the document that reached this client through a delegation
// -----------------------------------------------------------------------------

describe("O-6 — a delegated document says so", () => {
  beforeEach(bothSeeds);

  it("renders the delegated notice on a delegated invoice, and on no other", () => {
    const data = hostgrid();
    const delegated = map(
      filter(data.invoices, invoice => invoice.isDelegated === true),
      "id"
    );
    const noticed = map(
      filter(
        data.invoices,
        invoice => noticeOf(data, invoice.id, "delegated") !== undefined
      ),
      "id"
    );

    expect(delegated).toEqual([DELEGATED_INVOICE]);
    expect(size(data.invoices)).toBeGreaterThan(size(delegated));
    expect(noticed).toEqual(delegated);
    expect(
      noticeOf(data, DELEGATED_INVOICE, "delegated")?.message
    ).toBeTruthy();

    // The gate reads the FLAG rather than the row: raised on a document that
    // never carried it, the notice follows.
    const copy = clone();
    const plain = seededInvoice(copy, SHARED_INVOICE);
    expect(noticeOf(copy, plain.id, "delegated")).toBeUndefined();
    copy.invoices = map(copy.invoices, invoice =>
      invoice.id === plain.id
        ? assign({}, invoice, { isDelegated: true })
        : invoice
    );
    expect(noticeOf(copy, plain.id, "delegated")?.message).toBe(
      noticeOf(data, DELEGATED_INVOICE, "delegated")?.message
    );
  });
});

// -----------------------------------------------------------------------------
// O-1 (rows) — what a row says about a document standing behind a change
// -----------------------------------------------------------------------------

describe("O-1 — the rows read the pro-rata standing the document ignores", () => {
  beforeEach(bothSeeds);

  it("an invoice row reads To be credited while it is owed and standing behind a pro-rata change", () => {
    const data = clone();
    const owed = seededInvoice(data, TO_BE_CREDITED);

    expect(isOwed(owed)).toBe(true);
    expect(owed.toBeCredited).toBe(true);
    expect(invoiceRowStanding(owed).label).toMatch(/to be credited/i);

    // Each of the two facts alone is not enough, and the standing falls back
    // to the document's own status when either is missing.
    const settled: MockInvoice = assign({}, owed, {
      status: InvoiceStatus.PAID
    });
    const plain: MockInvoice = assign({}, owed, { toBeCredited: false });
    expect(invoiceRowStanding(settled).label).toBe(
      INVOICE_STATUS_LABEL[InvoiceStatus.PAID]
    );
    expect(invoiceRowStanding(plain).label).toBe(
      INVOICE_STATUS_LABEL[InvoiceStatus.UNPAID]
    );
    // Overdue is owed too, so it reads the same as unpaid does.
    const overdue: MockInvoice = assign({}, owed, {
      status: InvoiceStatus.OVERDUE
    });
    expect(invoiceRowStanding(overdue).label).toMatch(/to be credited/i);

    // The ledger's own row carries it, and no other row does.
    const rows = resolveRef<ListModuleItem[]>(data, DATA_REF_ID.INVOICE_ITEMS);
    const reading = filter(rows, row =>
      /to be credited/i.test(row.status?.label ?? "")
    );
    expect(map(reading, "id")).toEqual([TO_BE_CREDITED]);
  });

  it("an order's invoice rows read it too, and drop it once the document settles", () => {
    const data = clone();
    const invoice = seededInvoice(data, "inv-94");
    const orderId = invoice.orderId ?? "";
    const rowFor = (source: MockDataset) =>
      find(
        resolveRef<ListModuleItem[]>(source, DATA_REF_ID.ORDER_INVOICE_ITEMS, {
          entityId: orderId
        }),
        { id: invoice.id }
      );

    expect(orderId).toBeTruthy();
    expect(rowFor(data)?.status?.label).toBe(
      INVOICE_STATUS_LABEL[invoice.status]
    );

    data.invoices = map(data.invoices, candidate =>
      candidate.id === invoice.id
        ? assign({}, candidate, { toBeCredited: true })
        : candidate
    );
    expect(rowFor(data)?.status?.label).toMatch(/to be credited/i);

    data.invoices = map(data.invoices, candidate =>
      candidate.id === invoice.id
        ? assign({}, candidate, { status: InvoiceStatus.PAID })
        : candidate
    );
    expect(rowFor(data)?.status?.label).toBe(
      INVOICE_STATUS_LABEL[InvoiceStatus.PAID]
    );
  });
});

// -----------------------------------------------------------------------------
// O-2 — the product row's tag strip
// -----------------------------------------------------------------------------

describe("O-2 — a product row wears what is true of it", () => {
  beforeEach(bothSeeds);

  it("counts the days a trial has left from its own end date", () => {
    const data = clone();
    const trialling = filter(
      data.products,
      product => product.trialEndsAt !== undefined
    );
    expect(size(trialling)).toBeGreaterThan(0);

    const [product] = trialling;
    const seeded = trialReadingFor(data, product?.id ?? "");
    expect(seeded?.date).toBe(product?.trialEndsAt);
    expect(seeded?.days).toBeGreaterThan(0);

    // Moved three days out, the same product has exactly three more days —
    // a count read off anything but its own end date cannot follow.
    const shifted = isoDaysFromToday((seeded?.days ?? 0) + 3);
    if (product !== undefined) product.trialEndsAt = shifted;
    const moved = trialReadingFor(data, product?.id ?? "");
    expect(moved?.date).toBe(shifted);
    expect(moved?.days).toBe((seeded?.days ?? 0) + 3);

    // And an absolute reading, on a clone whose end this test chose: ten
    // days out reads ten days, on that day.
    const chosen = isoDaysFromToday(10);
    if (product !== undefined) product.trialEndsAt = chosen;
    expect(trialReadingFor(data, product?.id ?? "")).toEqual({
      days: 10,
      date: chosen,
      label: expect.stringMatching(TRIAL_TAG)
    });

    // A product off trial wears no such tag at all.
    if (product !== undefined) product.trialEndsAt = undefined;
    expect(trialReadingFor(data, product?.id ?? "")).toBeUndefined();
  });

  it("the reference tag opens the label form", () => {
    for (const refId of PRODUCT_ROW_REFS) {
      const data = hostgrid();
      const rows = productRows(data, refId);
      const row = find(rows, { id: LABELLED_PRODUCT });
      const product = seededProduct(data, LABELLED_PRODUCT);
      const tag = labelTag(row ?? { id: "", title: "" });

      expect(product.customLabel).toBeTruthy();
      expect(row).toBeDefined();
      // The tag NAMES the reference and opens the form that changes it.
      expect(tag?.label).toContain(product.customLabel ?? "");
      expect(tag?.action?.value).toBe(
        mockActionValue(
          MOCK_ACTION.OPEN_FORM,
          `${FORM_ID.PRODUCT_LABEL}:${LABELLED_PRODUCT}`
        )
      );
      expect(tag?.action?.label).toBeTruthy();

      // And pressing it reaches the registered form for THAT product.
      expect(
        dispatchMockAction(data, PRODUCTS_CONTEXT, tag?.action?.value ?? "")
          ?.form
      ).toEqual({ id: FORM_ID.PRODUCT_LABEL, entityId: LABELLED_PRODUCT });
      expect(
        resolveMockForm(data, FORM_ID.PRODUCT_LABEL, LABELLED_PRODUCT)?.submit
      ).toBe(`${MOCK_ACTION.PRODUCT_LABEL_SAVE}:${LABELLED_PRODUCT}`);
    }
  });

  it("offers Add label on a product with no reference", () => {
    for (const refId of PRODUCT_ROW_REFS) {
      const data = hostgrid();
      const rows = productRows(data, refId);
      const named = (row: ListModuleItem) =>
        find(data.products, { id: row.id })?.customLabel;

      expect(size(rows)).toBeGreaterThan(1);
      const withLabel = filter(rows, row => named(row) !== undefined);
      const without = reject(rows, row => named(row) !== undefined);
      expect(size(withLabel)).toBeGreaterThan(0);
      expect(size(without)).toBeGreaterThan(0);

      // Every row offers exactly ONE way into the label form; which way it
      // is, is the only thing the reference changes.
      for (const row of rows) {
        const tag = labelTag(row);
        expect({ id: row.id, offered: tag !== undefined }).toEqual({
          id: row.id,
          offered: true
        });
      }
      for (const row of without) {
        expect({ id: row.id, label: labelTag(row)?.label }).toEqual({
          id: row.id,
          label: expect.stringMatching(/add label/i)
        });
      }
      for (const row of withLabel) {
        expect({
          id: row.id,
          adds: /add label/i.test(labelTag(row)?.label ?? "")
        }).toEqual({
          id: row.id,
          adds: false
        });
      }
    }
  });

  it("marks a delegated product, and the codes another was bought with", () => {
    const data = hostgrid();
    const rows = productRows(data, DATA_REF_ID.GROUP_PRODUCT_ITEMS);
    const wearing = (pattern: RegExp) =>
      map(
        filter(rows, row => some(tagLabels(row), label => pattern.test(label))),
        "id"
      );

    const delegated = map(
      filter(
        rows,
        row => find(data.products, { id: row.id })?.isDelegated === true
      ),
      "id"
    );
    expect(delegated).toEqual([DELEGATED_PRODUCT]);
    expect(wearing(/^delegated$/i)).toEqual(delegated);

    const promoted = seededProduct(data, LABELLED_PRODUCT);
    expect(size(promoted.promotionCodes ?? [])).toBeGreaterThan(0);
    for (const code of promoted.promotionCodes ?? []) {
      expect(tagLabels(find(rows, { id: LABELLED_PRODUCT }))).toEqual(
        expect.arrayContaining([expect.stringContaining(code)])
      );
      // No row that was not bought with it claims it.
      expect(wearing(new RegExp(code))).toEqual([LABELLED_PRODUCT]);
    }
  });
});

// -----------------------------------------------------------------------------
// O-3 — the sign-in allowlist, searched and edited
// -----------------------------------------------------------------------------

describe("O-3 — the allowlist is searched, and each entry edited", () => {
  beforeEach(bothSeeds);

  it("searches the allowlist by address and by name", () => {
    const data = hostgrid();
    const seam = ipWhitelistCollection.resolve(data, NO_CONTEXT);
    const whole = size(data.ipWhitelist);
    const byName = (text: string) =>
      filter(data.ipWhitelist, entry =>
        includes((entry.name ?? "").toLowerCase(), text.toLowerCase())
      );
    const byAddress = (text: string) =>
      filter(data.ipWhitelist, entry => includes(entry.ip_address, text));
    const showing = () => map(seam.useContext().data.value, "id");
    const total = () => seam.useContext().pagination.value.total;

    // The two hand-authored entries anchor this: their address and their
    // name are the seed's own, where the filler rows are generated.
    const [hero] = data.ipWhitelist;
    const other = data.ipWhitelist[1];
    expect(hero?.name).toBeTruthy();
    expect(other?.ip_address).toBeTruthy();

    const nameWord = (hero?.name ?? "").split(" ")[0] ?? "";
    expect(size(byName(nameWord))).toBe(1);
    // The word lives in a NAME and in no address, so a hit names the field.
    expect(byAddress(nameWord)).toEqual([]);
    seam.useActions().search(nameWord);
    expect(total()).toBe(1);
    expect(showing()).toEqual(map(byName(nameWord), "id"));

    const address = other?.ip_address ?? "";
    expect(size(byAddress(address))).toBe(1);
    expect(byName(address)).toEqual([]);
    seam.useActions().search(address);
    expect(total()).toBe(1);
    expect(showing()).toEqual([other?.id]);

    // A word neither field carries returns nothing, and clearing returns all.
    seam.useActions().search("no-such-site-9f3c");
    expect(total()).toBe(0);
    seam.useActions().search("");
    expect(total()).toBe(whole);

    // The brand restricting nothing has nothing to search.
    const bare = ipWhitelistCollection.resolve(minimal(), NO_CONTEXT);
    expect(minimal().ipWhitelist).toEqual([]);
    expect(bare.useContext().pagination.value.total).toBe(0);
  });

  it("the allowlist page offers a search over addresses and names", () => {
    const data = hostgrid();
    const page = accountPages()[PAGE_KEY.ACCOUNT_SECURITY];
    const band = resolveRef<ListControlsState>(
      data,
      DATA_REF_ID.IP_WHITELIST_CONTROLS
    );
    const rowIds = () =>
      map(
        resolveRef<ListModuleItem[]>(data, DATA_REF_ID.IP_WHITELIST_ITEMS),
        "id"
      );

    expect(JSON.stringify(page)).toContain(DATA_REF_ID.IP_WHITELIST_CONTROLS);
    expect(band.searchAction).toBe(
      mockActionValue(MOCK_ACTION.COLLECTION_SEARCH, "ip-whitelist")
    );
    expect(band.searchValue).toBe("");
    // The collection declares no sorts and no filters, so the band is the
    // search and nothing else.
    expect(band.filters ?? []).toEqual([]);
    expect(band.sortOptions ?? []).toEqual([]);

    const [hero] = data.ipWhitelist;
    const word = (hero?.name ?? "").split(" ")[0] ?? "";
    dispatchMockAction(data, NO_CONTEXT, `${band.searchAction}:${word}`);

    expect(rowIds()).toEqual([hero?.id]);
    expect(
      resolveRef<ListControlsState>(data, DATA_REF_ID.IP_WHITELIST_CONTROLS)
        .searchValue
    ).toBe(word);

    dispatchMockAction(data, NO_CONTEXT, `${band.searchAction}:`);
    expect(size(rowIds())).toBeGreaterThan(1);
  });

  it("refuses an edit onto an address already listed", () => {
    const data = clone();
    const [held, taken] = data.ipWhitelist;
    const before = JSON.stringify(data.ipWhitelist);

    expect(held?.ip_address).toBeTruthy();
    expect(taken?.ip_address).toBeTruthy();
    expect(held?.ip_address).not.toBe(taken?.ip_address);

    const refused = dispatchMockAction(
      data,
      NO_CONTEXT,
      ipSaveValue(held?.id ?? "", {
        ipAddress: taken?.ip_address,
        description: "Somewhere else"
      })
    );

    expect(refused?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(refused?.toast?.title).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.DUPLICATE_CONTACT]
    );
    expect(refused?.formDone).toBeUndefined();
    expect(JSON.stringify(data.ipWhitelist)).toBe(before);

    // An entry keeping its OWN address is not a duplicate of itself.
    const renamed = dispatchMockAction(
      data,
      NO_CONTEXT,
      ipSaveValue(held?.id ?? "", {
        ipAddress: held?.ip_address,
        description: "Renamed only"
      })
    );
    expect(renamed?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(find(data.ipWhitelist, { id: held?.id })?.name).toBe("Renamed only");
  });

  it("leads each entry with Edit, keeps Delete in the overflow, and writes the change through", () => {
    const data = clone();
    const rows = resolveRef<ListModuleItem[]>(
      data,
      DATA_REF_ID.IP_WHITELIST_ITEMS
    );
    const [target] = data.ipWhitelist;
    const editValue = mockActionValue(
      MOCK_ACTION.OPEN_FORM,
      `${FORM_ID.IP_WHITELIST_EDIT}:${target?.id}`
    );

    expect(size(rows)).toBeGreaterThan(0);
    for (const row of rows) {
      expect({ id: row.id, action: row.action?.value }).toEqual({
        id: row.id,
        action: mockActionValue(
          MOCK_ACTION.OPEN_FORM,
          `${FORM_ID.IP_WHITELIST_EDIT}:${row.id}`
        )
      });
      expect(map(row.moreActions ?? [], "value")).toEqual([
        mockActionValue(MOCK_ACTION.IP_WHITELIST_REMOVE, row.id)
      ]);
    }

    // The dialog opens on the entry as it stands, and submits against it.
    const entry = resolveMockForm(
      data,
      FORM_ID.IP_WHITELIST_EDIT,
      target?.id ?? ""
    );
    expect(dispatchMockAction(data, NO_CONTEXT, editValue)?.form).toEqual({
      id: FORM_ID.IP_WHITELIST_EDIT,
      entityId: target?.id
    });
    expect(entry?.model).toEqual({
      ipAddress: target?.ip_address,
      description: target?.name
    });
    expect(entry?.submit).toBe(
      `${MOCK_ACTION.IP_WHITELIST_SAVE}:${target?.id}`
    );

    // An id the dataset does not hold reaches no dialog, and writes nothing.
    expect(
      resolveMockForm(data, FORM_ID.IP_WHITELIST_EDIT, ABSENT_ID)
    ).toBeUndefined();
    const before = JSON.stringify(data.ipWhitelist);
    const missing = dispatchMockAction(
      data,
      NO_CONTEXT,
      ipSaveValue(ABSENT_ID, { ipAddress: "10.11.12.13" })
    );
    expect(missing?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(missing?.toast?.title).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_FOUND]
    );
    expect(JSON.stringify(data.ipWhitelist)).toBe(before);

    // A real edit moves that entry, in place, and adds no second row.
    const count = size(data.ipWhitelist);
    const saved = dispatchMockAction(
      data,
      NO_CONTEXT,
      ipSaveValue(target?.id ?? "", {
        ipAddress: "10.11.12.13",
        description: "Barcelona desk"
      })
    );
    const after: MockIpAddress | undefined = find(data.ipWhitelist, {
      id: target?.id
    });
    expect(saved?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(after?.ip_address).toBe("10.11.12.13");
    expect(after?.name).toBe("Barcelona desk");
    expect(size(data.ipWhitelist)).toBe(count);
  });
});

// -----------------------------------------------------------------------------
// O-4 — which card funds a top-up
// -----------------------------------------------------------------------------

describe("O-4 — the top-up says which card funds it", () => {
  beforeEach(bothSeeds);

  it("the top-up offers the stored cards, with the default preselected", () => {
    const data = hostgrid();
    const entry = resolveMockForm(data, FORM_ID.WALLET_TOPUP, undefined);
    const schema = entry?.schema as {
      properties?: Record<string, { enum?: string[] }>;
    };
    const held = find(data.paymentMethods, { isDefault: true });

    expect(size(data.paymentMethods)).toBeGreaterThan(1);
    expect(held?.id).toBeTruthy();
    expect(schema.properties?.paymentDetailId?.enum).toEqual(
      map(data.paymentMethods, "id")
    );
    expect(walletTopUpContext(data).defaultMethodId).toBe(held?.id);
    expect(entry?.model.paymentDetailId).toBe(held?.id);
    expect(JSON.stringify(entry?.uischema)).toContain(
      "#/properties/paymentDetailId"
    );

    // An account holding no card is asked nothing — there is no choice.
    const cardless = clone();
    cardless.paymentMethods = [];
    const bare = resolveMockForm(cardless, FORM_ID.WALLET_TOPUP, undefined);
    const bareSchema = bare?.schema as { properties?: Record<string, unknown> };
    expect(bareSchema.properties?.paymentDetailId).toBeUndefined();
    expect(bare?.model.paymentDetailId).toBeUndefined();
    expect(JSON.stringify(bare?.uischema)).not.toContain(
      "#/properties/paymentDetailId"
    );
  });

  it("records the chosen card on the invoice the top-up raises", () => {
    const data = clone();
    const chosen = find(
      data.paymentMethods,
      method => method.isDefault !== true
    );
    const fallback = find(data.paymentMethods, { isDefault: true });

    expect(chosen?.id).toBeTruthy();
    expect(chosen?.id).not.toBe(fallback?.id);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      topUpValue({ currency: "GBP", amount: 25, paymentDetailId: chosen?.id })
    );
    const raised = data.invoices[0];

    expect(raised?.paymentDetailId).toBe(chosen?.id);
    expect(raised?.payments[0]?.method).toContain(chosen?.displayName ?? "");
    expect(raised?.payments[0]?.method).not.toContain(
      fallback?.displayName ?? "no-fallback"
    );
    expect(raised?.payments[0]?.amount).toEqual(raised?.total);

    // A second top-up on a DIFFERENT card records that one — the field is
    // not the account's default under another name.
    const second = find(
      data.paymentMethods,
      method => method.id !== chosen?.id && method.displayName !== undefined
    );
    dispatchMockAction(
      data,
      NO_CONTEXT,
      topUpValue({ currency: "GBP", amount: 5, paymentDetailId: second?.id })
    );
    expect(data.invoices[0]?.paymentDetailId).toBe(second?.id);
    expect(data.invoices[0]?.payments[0]?.method).toContain(
      second?.displayName ?? ""
    );

    // With no card on the account, the raised document names none, and the
    // payment row reads as the top-up itself.
    const cardless = clone();
    cardless.paymentMethods = [];
    dispatchMockAction(
      cardless,
      NO_CONTEXT,
      topUpValue({ currency: "GBP", amount: 25 })
    );
    expect(cardless.invoices[0]?.paymentDetailId).toBeUndefined();
    expect(cardless.invoices[0]?.payments[0]?.method).toBeTruthy();
  });
});

// -----------------------------------------------------------------------------
// O-5 — the share dialog
// -----------------------------------------------------------------------------

describe("O-5 — a document is shared over a link with its own permissions", () => {
  beforeEach(bothSeeds);

  it("offers Allow payment only while the invoice is still owed", () => {
    const data = hostgrid();
    const owed = seededInvoice(data, SHARED_INVOICE);
    const settled = seededInvoice(data, SETTLED_INVOICE);
    const offers = (invoice: MockInvoice) => {
      const entry = resolveMockForm(data, FORM_ID.INVOICE_SHARE, invoice.id);
      const schema = entry?.schema as {
        properties?: Record<string, unknown>;
      };
      return {
        field: schema?.properties?.allowPayment !== undefined,
        control: includes(
          JSON.stringify(entry?.uischema),
          "#/properties/allowPayment"
        )
      };
    };

    expect(isOwed(owed)).toBe(true);
    expect(isOwed(settled)).toBe(false);
    expect(offers(owed)).toEqual({ field: true, control: true });
    expect(offers(settled)).toEqual({ field: false, control: false });

    // Across the whole ledger the question is asked of exactly the documents
    // the platform groups as still owed.
    const asked = map(
      filter(
        reject(data.invoices, invoice => invoice.isDelegated === true),
        invoice => offers(invoice).field
      ),
      "id"
    );
    const owing = map(
      filter(
        reject(data.invoices, invoice => invoice.isDelegated === true),
        isOwed
      ),
      "id"
    );
    expect(sortBy(asked)).toEqual(sortBy(owing));
    expect(size(owing)).toBeGreaterThan(0);
    expect(size(owing)).toBeLessThan(size(data.invoices));

    // The contract's own gate is what the schema reads.
    expect(
      shareSchemas.useSchema({
        link: "",
        isShared: false,
        allowDownload: false,
        allowPayment: false,
        offersPayment: false
      }).properties?.allowPayment
    ).toBeUndefined();
  });

  it("never stores payment permission on a settled invoice", () => {
    const data = clone();
    const settled = seededInvoice(data, SETTLED_INVOICE);
    const owed = seededInvoice(data, SHARED_INVOICE);
    const granting = {
      isShared: true,
      allowDownload: true,
      allowPayment: true
    };

    expect(isOwed(settled)).toBe(false);
    expect(owed.shareAllowsPayment).toBe(false);

    const kept = dispatchMockAction(
      data,
      NO_CONTEXT,
      shareSaveValue(settled.id, granting)
    );
    const after = seededInvoice(data, SETTLED_INVOICE);

    expect(kept?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    // Everything else the payload asked for landed — only the permission the
    // document cannot hold was dropped.
    expect(after.isShared).toBe(true);
    expect(after.shareAllowsDownload).toBe(true);
    expect(after.shareAllowsPayment).toBe(false);

    // The same payload on a document that IS owed stores it.
    dispatchMockAction(data, NO_CONTEXT, shareSaveValue(owed.id, granting));
    expect(seededInvoice(data, SHARED_INVOICE).shareAllowsPayment).toBe(true);
  });

  it("opens no share dialog on a delegated invoice", () => {
    const data = clone();
    const delegated = seededInvoice(data, DELEGATED_INVOICE);
    const shareable = seededInvoice(data, SHARED_INVOICE);
    const before = JSON.stringify(data.invoices);

    expect(delegated.isDelegated).toBe(true);
    expect(whyNotShareable(delegated)?.reason).toBe(
      MOCK_RECEIPT_REASON.NOT_PERMITTED
    );
    expect(whyNotShareable(shareable)).toBeUndefined();

    // No dialog is built for it, and the document offers no way to ask.
    expect(
      resolveMockForm(data, FORM_ID.INVOICE_SHARE, DELEGATED_INVOICE)
    ).toBeUndefined();
    const values = map(documentActions(data, DELEGATED_INVOICE), "value");
    expect(some(values, value => includes(value, FORM_ID.INVOICE_SHARE))).toBe(
      false
    );
    expect(
      some(values, value => includes(value, MOCK_ACTION.SHARE_INVOICE))
    ).toBe(false);
    expect(map(documentActions(data, SHARED_INVOICE), "value")).toEqual(
      expect.arrayContaining([
        mockActionValue(
          MOCK_ACTION.OPEN_FORM,
          `${FORM_ID.INVOICE_SHARE}:${SHARED_INVOICE}`
        )
      ])
    );

    // Every write behind the dialog refuses out loud, and moves nothing.
    for (const value of [
      shareSaveValue(DELEGATED_INVOICE, { isShared: true }),
      mockActionValue(MOCK_ACTION.INVOICE_SHARE_REGENERATE, DELEGATED_INVOICE)
    ]) {
      const refused = dispatchMockAction(data, NO_CONTEXT, value);
      expect(refused?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
      expect(refused?.confirm).toBeUndefined();
      expect(refused?.form).toBeUndefined();
    }
    expect(JSON.stringify(data.invoices)).toBe(before);
  });

  it("opens on the document's own sharing state, and offers regenerating and copying beside saving", () => {
    const data = hostgrid();
    const invoice = seededInvoice(data, SHARED_INVOICE);
    const entry = resolveMockForm(data, FORM_ID.INVOICE_SHARE, invoice.id);

    expect(invoice.isShared).toBe(true);
    expect(entry?.model).toEqual({
      isShared: invoice.isShared,
      link: expect.stringContaining(invoice.shareToken),
      allowDownload: invoice.shareAllowsDownload,
      allowPayment: invoice.shareAllowsPayment
    });
    expect(entry?.submit).toBe(
      `${MOCK_ACTION.INVOICE_SHARE_SAVE}:${invoice.id}`
    );
    expect(map(entry?.extraActions ?? [], "value")).toEqual([
      mockActionValue(MOCK_ACTION.INVOICE_SHARE_REGENERATE, invoice.id),
      mockActionValue(MOCK_ACTION.SHARE_INVOICE, invoice.id)
    ]);
    // The link is stated rather than asked: readonly, and never required.
    expect((entry?.schema as { required?: string[] }).required).not.toContain(
      "link"
    );
  });

  it("asks before a new link, and mints a different one each time", () => {
    const data = clone();
    const invoice = seededInvoice(data, SHARED_INVOICE);
    const minted: string[] = [invoice.shareToken];

    for (let round = 0; round < 2; round += 1) {
      const asked = dispatchMockAction(
        data,
        NO_CONTEXT,
        mockActionValue(MOCK_ACTION.INVOICE_SHARE_REGENERATE, invoice.id)
      );
      expect(asked?.confirm?.destructive).toBe(true);
      expect(asked?.confirm?.then).toBe(
        mockActionValue(
          MOCK_ACTION.INVOICE_SHARE_REGENERATE_CONFIRMED,
          invoice.id
        )
      );
      // Asking is not doing: the link still standing is the one handed out.
      expect(seededInvoice(data, SHARED_INVOICE).shareToken).toBe(
        minted[minted.length - 1]
      );

      const done = dispatchMockAction(
        data,
        NO_CONTEXT,
        asked?.confirm?.then ?? ""
      );
      expect(done?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
      minted.push(seededInvoice(data, SHARED_INVOICE).shareToken);
    }

    expect(size(uniq(minted))).toBe(size(minted));
  });
});

// -----------------------------------------------------------------------------
// The over-build the closure removed
// -----------------------------------------------------------------------------

describe("what the eleventh closure took away", () => {
  beforeEach(bothSeeds);

  it("publishes no data reference for any of the four admin-only product notices", () => {
    const retired = [
      "PRODUCT_HAS_MOVED",
      "PRODUCT_MOVED_MESSAGE",
      "PRODUCT_MOVED_ACTION",
      "PRODUCT_HAS_PAUSED_PROVISIONING",
      "PRODUCT_PAUSED_PROVISIONING_MESSAGE",
      "PRODUCT_HAS_UNRESOLVED_REQUESTS",
      "PRODUCT_UNRESOLVED_REQUESTS_MESSAGE",
      "PRODUCT_HAS_SCHEDULED_PRICE_CHANGE",
      "PRODUCT_SCHEDULED_PRICE_CHANGE_MESSAGE"
    ];
    const data = hostgrid();

    expect(intersection(Object.keys(DATA_REF_ID), retired)).toEqual([]);
    // The seed facts they described are all still there.
    expect(
      every(
        [
          some(data.products, product => product.provisioning.paused === true),
          some(
            data.products,
            product => (product.provisioning.unresolvedRequests ?? 0) > 0
          ),
          some(
            data.products,
            product => product.scheduledPriceChange !== undefined
          ),
          some(data.products, product => product.movedTo !== undefined)
        ],
        Boolean
      )
    ).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// The doors that now refuse before they open
// -----------------------------------------------------------------------------

describe("a form door with a published guard asks it before it opens", () => {
  beforeEach(bothSeeds);

  it("refuses the share dialog on a delegated invoice, with a warning and no form", () => {
    const data = clone();
    const delegated = seededInvoice(data, DELEGATED_INVOICE);
    const shareable = seededInvoice(data, SHARED_INVOICE);
    const before = JSON.stringify(data.invoices);
    const door = (id: string) =>
      dispatchMockAction(
        data,
        NO_CONTEXT,
        mockActionValue(MOCK_ACTION.OPEN_FORM, `${FORM_ID.INVOICE_SHARE}:${id}`)
      );

    expect(delegated.isDelegated).toBe(true);
    expect(whyNotShareable(delegated)?.reason).toBe(
      MOCK_RECEIPT_REASON.NOT_PERMITTED
    );

    const refused = door(DELEGATED_INVOICE);
    expect(refused?.form).toBeUndefined();
    expect(refused?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(refused?.toast?.title).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_PERMITTED]
    );

    // A document nobody holds refuses at the same door, in the dispatcher's
    // own absent-subject words rather than the delegation's.
    const missing = door(ABSENT_ID);
    expect(missing?.form).toBeUndefined();
    expect(missing?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(missing?.toast?.title).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_FOUND]
    );
    expect(missing?.toast?.title).not.toBe(refused?.toast?.title);

    // And a document that may be shared still opens, so the door refuses
    // rather than being shut.
    expect(door(shareable.id)?.form).toEqual({
      id: FORM_ID.INVOICE_SHARE,
      entityId: shareable.id
    });
    expect(door(shareable.id)?.toast).toBeUndefined();
    expect(JSON.stringify(data.invoices)).toBe(before);
  });

  it("refuses the allowlist edit dialog for an address nobody holds, with a warning and no form", () => {
    const data = clone();
    const [held] = data.ipWhitelist;
    const before = JSON.stringify(data.ipWhitelist);
    const door = (id: string) =>
      dispatchMockAction(
        data,
        NO_CONTEXT,
        mockActionValue(
          MOCK_ACTION.OPEN_FORM,
          `${FORM_ID.IP_WHITELIST_EDIT}:${id}`
        )
      );

    expect(map(data.ipWhitelist, "id")).not.toContain(ABSENT_ID);

    const missing = door(ABSENT_ID);
    expect(missing?.form).toBeUndefined();
    expect(missing?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(missing?.toast?.title).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_FOUND]
    );

    // The entry the account does hold opens on itself.
    expect(door(held?.id ?? "")?.form).toEqual({
      id: FORM_ID.IP_WHITELIST_EDIT,
      entityId: held?.id
    });
    expect(door(held?.id ?? "")?.toast).toBeUndefined();
    expect(JSON.stringify(data.ipWhitelist)).toBe(before);
  });
});

// -----------------------------------------------------------------------------
// One narrowing rule on every tab
// -----------------------------------------------------------------------------

describe("a status tab offers the statuses its own rows carry", () => {
  beforeEach(bothSeeds);

  it("the Credited invoice tab asks which of the two statuses it gathers", () => {
    const data = hostgrid();
    const tabbed = (tab: string) =>
      filter(
        data.invoices,
        invoice => invoiceStatusTab(invoice.status) === tab
      );
    const offered = (tab: string) => {
      const controls = invoicesCollection
        .resolve(data, { status: tab })
        .useContext().filterControls;
      return map(
        reject(
          find(controls, { key: "status" })?.options ?? [],
          option => option.value === LIST_CONTROLS_FILTER_ANY
        ),
        "value"
      );
    };

    const gathered = uniq(
      map(tabbed(INVOICE_STATUS_TAB.CREDITED), invoice => invoice.status)
    );
    expect(sortBy(gathered)).toEqual(
      sortBy([InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED])
    );
    expect(sortBy(offered(INVOICE_STATUS_TAB.CREDITED))).toEqual(
      sortBy(gathered)
    );

    // Each option answers with exactly the documents that carry it, and the
    // count is hand-taken off the seed rather than read back off the panel.
    const seam = invoicesCollection.resolve(data, {
      status: INVOICE_STATUS_TAB.CREDITED
    });
    for (const value of offered(INVOICE_STATUS_TAB.CREDITED)) {
      const wanted = filter(
        tabbed(INVOICE_STATUS_TAB.CREDITED),
        invoice => invoice.status === value
      );
      seam.useActions().applyNamedFilter("status", value);
      expect({
        value,
        total: seam.useContext().pagination.value.total
      }).toEqual({ value, total: size(wanted) });
      expect(size(wanted)).toBeGreaterThan(0);
    }
    seam.useActions().applyNamedFilter("status", "");
    expect(seam.useContext().pagination.value.total).toBe(
      size(tabbed(INVOICE_STATUS_TAB.CREDITED))
    );

    // One rule on every tab: each offers exactly what its own rows hold.
    for (const tab of [INVOICE_STATUS_TAB.UNPAID, INVOICE_STATUS_TAB.PAID]) {
      const holds = uniq(map(tabbed(tab), invoice => invoice.status));
      expect({ tab, offers: sortBy(offered(tab)) }).toEqual({
        tab,
        offers: size(holds) > 1 ? sortBy(holds) : []
      });
    }
  });
});
