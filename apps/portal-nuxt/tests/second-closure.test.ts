// -----------------------------------------------------------------------------
/**
 * @module tests/second-closure
 * @description Plan §8 (phase F6): the five rows the post-F5 audit read as
 * partial. A thread points at one of the client's products (P1); a dashboard
 * product row leads with the function its provider highlighted and keeps the
 * rest in its menu (P2); a ledger with several unpaid documents offers to
 * bring them into one (P3); an address manages what it receives, and an
 * unverified default one takes the code by hand (P4); a payment still with
 * the gateway offers what the client must DO about it (N1).
 *
 * Every count, total and label is derived from the seed or computed in the
 * test — the mock layer is the server, so a figure that agrees with its own
 * selector proves nothing. The verbs run through `dispatchMockAction`, the one
 * door, and the refusals are read as the standing wordings rather than as
 * literals.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ContractStatusCodes,
  InvoiceStatus,
  InvoiceStatusGroups,
  TicketStatusCodes
} from "@upmind-automation/types";
import { boundRefId, rowBinding } from "./support/page-config";
import {
  assign,
  concat,
  every,
  filter,
  find,
  first,
  includes,
  map,
  reject,
  size,
  some,
  sumBy
} from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockDataset,
  MockEmail,
  MockInvoice,
  MockProduct,
  MockTicket
} from "~/portal/mock/types";
import type { DocumentModuleMessage } from "~/portal/modules/document/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import { useProseDialog } from "~/composables/useProseDialog";
import { billingPages } from "~/portal/config/billing-pages";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import * as ticketSchemas from "~/portal/mock/contracts/client-tickets.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  MOCK_RECEIPT_REASON,
  consolidatableInvoices,
  pendingInstruction
} from "~/portal/mock/facades";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import { ticketRelatedProductContext } from "~/portal/mock/forms/support-contexts";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import {
  MOCK_INVOICE_CATEGORY,
  MOCK_PAYMENT_STATUS
} from "~/portal/mock/types";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

/** Legacy's two labels for the one picker (`ticketProvider.ts` `add`/`change`). */
const ADD_PRODUCT = "Add related product";

const CHANGE_PRODUCT = "Change related product";

const MANAGE = "Manage";

const MANAGE_BILLING = "Manage billing";

const COMPLETE_SETUP = "Complete setup";

/** An id no seed mints — deliberately not the `<prefix>-<n>` spelling. */
const ABSENT_PRODUCT_ID = "no-such-product-4c7a";

type ActionLike = { readonly value: string; readonly label: string };

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function toastText(result: {
  toast?: { title: string; description?: string };
}): string {
  return `${result.toast?.title ?? ""} ${result.toast?.description ?? ""}`;
}

function payload(verb: string, id: string, model: unknown): string {
  return `${verb}:${id}:${JSON.stringify(model)}`;
}

function openFormValue(formId: string, entityId: string): string {
  return mockActionValue(MOCK_ACTION.OPEN_FORM, `${formId}:${entityId}`);
}

// -----------------------------------------------------------------------------
// P1 — the thread's related product
// -----------------------------------------------------------------------------

function ticketBy(
  data: MockDataset,
  trait: string,
  matches: (ticket: MockTicket) => boolean
): MockTicket {
  const ticket = find(data.tickets, matches);
  if (ticket === undefined) throw new Error(`seed carries no ${trait}`);
  return ticket;
}

function isSettable(ticket: MockTicket): boolean {
  return ticket.status !== TicketStatusCodes.CLOSED && ticket.locked !== true;
}

function manageActions(data: MockDataset, ticketId: string): ActionLike[] {
  return (
    ref<ActionLike[]>(data, DATA_REF_ID.TICKET_MANAGE_ACTIONS, {
      entityId: ticketId
    }) ?? []
  );
}

function pickerAction(
  data: MockDataset,
  ticketId: string
): ActionLike | undefined {
  return find(manageActions(data, ticketId), {
    value: openFormValue(FORM_ID.TICKET_SET_PRODUCT, ticketId)
  });
}

describe("P1 — pointing a thread at one of the client's products", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("offers the picker on every open, unlocked thread and on no other", () => {
    const data = hostgrid();

    expect(size(data.tickets)).toBeGreaterThan(0);
    for (const ticket of data.tickets) {
      expect([ticket.id, pickerAction(data, ticket.id) !== undefined]).toEqual([
        ticket.id,
        isSettable(ticket)
      ]);
    }
  });

  it("wears Add where the thread is about nothing and Change where it is about something", () => {
    const data = hostgrid();
    const settable = filter(data.tickets, isSettable);

    expect(some(settable, ticket => ticket.productId === undefined)).toBe(true);
    expect(some(settable, ticket => ticket.productId !== undefined)).toBe(true);
    for (const ticket of settable) {
      expect([ticket.id, pickerAction(data, ticket.id)?.label]).toEqual([
        ticket.id,
        ticket.productId === undefined ? ADD_PRODUCT : CHANGE_PRODUCT
      ]);
    }
  });

  it("lists exactly the products this client holds, and opens on the thread's own", () => {
    const data = hostgrid();
    const named = ticketBy(
      data,
      "open, unlocked thread about a product",
      ticket => isSettable(ticket) && ticket.productId !== undefined
    );
    const blank = ticketBy(
      data,
      "open, unlocked thread about no product",
      ticket => isSettable(ticket) && ticket.productId === undefined
    );

    const opened = dispatchMockAction(
      data,
      NO_CONTEXT,
      openFormValue(FORM_ID.TICKET_SET_PRODUCT, named.id)
    );
    expect(opened?.form).toEqual({
      id: FORM_ID.TICKET_SET_PRODUCT,
      entityId: named.id
    });

    const entry = resolveMockForm(data, FORM_ID.TICKET_SET_PRODUCT, named.id);
    expect(entry?.schema).toEqual(
      ticketSchemas.useRelatedProductSchema(
        ticketRelatedProductContext(data, named)
      )
    );
    expect(
      (entry?.schema as { properties?: { productId?: { enum?: string[] } } })
        .properties?.productId?.enum
    ).toEqual(map(data.products, "id"));
    expect(entry?.model).toEqual({ productId: named.productId });
    expect(entry?.submit).toBe(`${MOCK_ACTION.TICKET_SET_PRODUCT}:${named.id}`);

    const fresh = resolveMockForm(data, FORM_ID.TICKET_SET_PRODUCT, blank.id);
    expect(fresh?.model).toEqual({ productId: "" });
  });

  it("writes the product onto the thread, says so, and leaves every other thread alone", () => {
    const data = hostgrid();
    const ticket = ticketBy(
      data,
      "open, unlocked thread about no product",
      candidate => isSettable(candidate) && candidate.productId === undefined
    );
    const chosen = find(
      data.products,
      candidate => candidate.id !== ticket.productId
    );
    if (chosen === undefined) throw new Error("seed carries no product");
    const others = map(reject(data.tickets, { id: ticket.id }), candidate => ({
      id: candidate.id,
      productId: candidate.productId
    }));
    const messages = size(ticket.messages);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.TICKET_SET_PRODUCT, ticket.id, {
        productId: chosen.id
      })
    );

    const saved = find(data.tickets, { id: ticket.id });
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(result?.formDone).toBe(true);
    expect(saved?.productId).toBe(chosen.id);
    expect(saved?.status).toBe(ticket.status);
    expect(size(saved?.messages)).toBe(messages);
    expect(
      map(reject(data.tickets, { id: ticket.id }), candidate => ({
        id: candidate.id,
        productId: candidate.productId
      }))
    ).toEqual(others);
  });

  it("refuses a product this account does not hold, and changes nothing", () => {
    const data = hostgrid();
    const ticket = ticketBy(data, "open, unlocked thread", isSettable);
    const before = ticket.productId;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.TICKET_SET_PRODUCT, ticket.id, {
        productId: ABSENT_PRODUCT_ID
      })
    );

    expect(result?.toast?.intent).not.toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_FOUND]
    );
    expect(find(data.tickets, { id: ticket.id })?.productId).toBe(before);
  });

  it("refuses a locked thread and a closed one, in each one's own words", () => {
    const data = hostgrid();
    const locked = ticketBy(
      data,
      "locked, open thread",
      ticket =>
        ticket.locked === true && ticket.status !== TicketStatusCodes.CLOSED
    );
    const closed = ticketBy(
      data,
      "closed thread",
      ticket => ticket.status === TicketStatusCodes.CLOSED
    );
    const held = first(data.products);
    if (held === undefined) throw new Error("seed carries no product");
    const before = { locked: locked.productId, closed: closed.productId };

    const onLocked = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.TICKET_SET_PRODUCT, locked.id, {
        productId: held.id
      })
    );
    const onClosed = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.TICKET_SET_PRODUCT, closed.id, {
        productId: held.id
      })
    );

    expect(toastText(onLocked ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.LOCKED]
    );
    expect(toastText(onClosed ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.ALREADY_CLOSED]
    );
    expect(find(data.tickets, { id: locked.id })?.productId).toBe(
      before.locked
    );
    expect(find(data.tickets, { id: closed.id })?.productId).toBe(
      before.closed
    );
  });

  it("moves the Summary's related-product row onto the product just named", () => {
    const data = hostgrid();
    const ticket = ticketBy(
      data,
      "open, unlocked thread about no product",
      candidate => isSettable(candidate) && candidate.productId === undefined
    );
    const chosen = first(data.products);
    if (chosen === undefined) throw new Error("seed carries no product");
    const summary = (): SpecModuleItem[] =>
      ref<SpecModuleItem[]>(data, DATA_REF_ID.TICKET_SPEC_ITEMS, {
        entityId: ticket.id
      }) ?? [];

    expect(map(summary(), "value")).not.toContain(chosen.name);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.TICKET_SET_PRODUCT, ticket.id, {
        productId: chosen.id
      })
    );

    expect(map(summary(), "value")).toContain(chosen.name);
  });
});

// -----------------------------------------------------------------------------
// P2 — the dashboard's product rows
// -----------------------------------------------------------------------------

function activeRows(data: MockDataset): ListModuleItem[] {
  const rows = ref<ListModuleItem[]>(data, DATA_REF_ID.ACTIVE_PRODUCT_ITEMS);
  if (size(rows) === 0) throw new Error("seed shows no active products");
  return rows;
}

function productOf(data: MockDataset, row: ListModuleItem): MockProduct {
  const product = find(data.products, { id: row.id });
  if (product === undefined) throw new Error(`no product behind row ${row.id}`);
  return product;
}

function highlightedFunction(product: MockProduct) {
  return first(
    filter(product.provisioning?.functions ?? [], ["highlighted", true])
  );
}

/** Where the row's own Manage leads — read back through the door, not restated. */
function detailRoute(data: MockDataset, productId: string): string {
  const to = dispatchMockAction(
    data,
    NO_CONTEXT,
    mockActionValue(MOCK_ACTION.VIEW_PRODUCT, productId)
  )?.to;
  if (to === undefined)
    throw new Error(`Manage leads nowhere for ${productId}`);
  return to;
}

describe("P2 — a dashboard product row leads with what its provider highlighted", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("carries the highlighted function as the row's own button", () => {
    const data = hostgrid();
    const rows = activeRows(data);
    const withHighlight = filter(
      rows,
      row => highlightedFunction(productOf(data, row)) !== undefined
    );

    expect(size(withHighlight)).toBeGreaterThan(0);
    for (const row of withHighlight) {
      const fn = highlightedFunction(productOf(data, row));
      expect([row.id, row.action]).toEqual([
        row.id,
        {
          value: `${MOCK_ACTION.RUN_PROVISION_FUNCTION}:${row.id}:${fn?.code}`,
          label: fn?.label
        }
      ]);
    }
  });

  it("falls back to Manage where the provider highlighted nothing", () => {
    const data = hostgrid();
    const plain = filter(
      activeRows(data),
      row =>
        highlightedFunction(productOf(data, row)) === undefined &&
        productOf(data, row).status !== ContractStatusCodes.AWAITING_ACTIVATION
    );

    expect(size(plain)).toBeGreaterThan(0);
    for (const row of plain) {
      expect([row.id, row.action]).toEqual([
        row.id,
        {
          value: mockActionValue(MOCK_ACTION.VIEW_PRODUCT, row.id),
          label: MANAGE
        }
      ]);
    }
  });

  it("asks a product still awaiting activation for its setup instead", () => {
    const data = hostgrid();
    const rows = activeRows(data);
    const awaiting = filter(
      rows,
      row =>
        productOf(data, row).status === ContractStatusCodes.AWAITING_ACTIVATION
    );

    expect(size(awaiting)).toBeGreaterThan(0);
    for (const row of rows) {
      const isAwaiting =
        productOf(data, row).status === ContractStatusCodes.AWAITING_ACTIVATION;
      expect([row.id, row.action?.label === COMPLETE_SETUP]).toEqual([
        row.id,
        isAwaiting
      ]);
    }
    // The way in lands on the Setup tab while setup is owed (`productRootRedirect`).
    for (const row of awaiting) {
      expect(row.action?.value).toBe(
        mockActionValue(MOCK_ACTION.VIEW_PRODUCT, row.id)
      );
    }
  });

  it("keeps every function, then Manage, then Manage billing, in the menu in that order", () => {
    const data = hostgrid();

    for (const row of activeRows(data)) {
      const product = productOf(data, row);
      const functions = map(
        product.provisioning?.functions ?? [],
        fn => `${MOCK_ACTION.RUN_PROVISION_FUNCTION}:${row.id}:${fn.code}`
      );

      expect([row.id, map(row.moreActions, "value")]).toEqual([
        row.id,
        concat(functions, [
          mockActionValue(MOCK_ACTION.VIEW_PRODUCT, row.id),
          mockActionValue(
            MOCK_ACTION.NAVIGATE,
            `${detailRoute(data, row.id)}/billing`
          )
        ])
      ]);
    }
  });

  it("labels the two standing menu rows as legacy did, and the functions as the provider does", () => {
    const data = hostgrid();
    const row = find(
      activeRows(data),
      candidate => size(productOf(data, candidate).provisioning?.functions) > 0
    );
    if (row === undefined)
      throw new Error("seed shows no product with functions");
    const product = productOf(data, row);

    expect(map(row.moreActions, "label")).toEqual(
      concat(map(product.provisioning?.functions ?? [], "label"), [
        MANAGE,
        MANAGE_BILLING
      ])
    );
  });
});

// -----------------------------------------------------------------------------
// P3 — bringing several unpaid documents into one
// -----------------------------------------------------------------------------

/**
 * The NECESSARY conditions the plan states — still owed, nothing paid against
 * it, not itself a consolidation, one currency. Used to guard the seed and to
 * build the one-document ledger; which further clauses legacy's
 * `getConsolidatableTotal` adds is the selector's own business, so no count is
 * graded against this.
 */
function gatherable(data: MockDataset): MockInvoice[] {
  const owed = filter(
    data.invoices,
    invoice =>
      includes(InvoiceStatusGroups.UNPAID, invoice.status) &&
      invoice.paidAmount.amount === 0 &&
      invoice.isConsolidation !== true &&
      invoice.replacedBy === undefined
  );
  const currency = first(owed)?.total.currency;
  return filter(owed, invoice => invoice.total.currency === currency);
}

/** The seeded document whose payment is already with the gateway. */
function committedInvoice(data: MockDataset): MockInvoice {
  const invoice = find(data.invoices, candidate =>
    some(candidate.payments, { status: MOCK_PAYMENT_STATUS.PENDING })
  );
  if (invoice === undefined) {
    throw new Error("seed carries no invoice with a payment in flight");
  }
  return invoice;
}

/** A quote the client owes nothing on yet — legacy gathers demands, never these. */
function quote(data: MockDataset): MockInvoice {
  const invoice = find(
    data.invoices,
    candidate =>
      candidate.category === MOCK_INVOICE_CATEGORY.PROFORMA &&
      includes(InvoiceStatusGroups.UNPAID, candidate.status) &&
      candidate.paidAmount.amount === 0
  );
  if (invoice === undefined) throw new Error("seed carries no unpaid quote");
  return invoice;
}

function consolidationRow(): unknown {
  const page = billingPages()[PAGE_KEY.BILLING_INVOICES];
  const row = rowBinding(page, DATA_REF_ID.INVOICE_CONSOLIDATION_MESSAGE);
  if (row === undefined) throw new Error("the invoices page binds no banner");
  return row;
}

function withInvoices(data: MockDataset, invoices: MockInvoice[]): MockDataset {
  return assign({}, data, { invoices });
}

describe("P3 — the invoices ledger offers to bring what is owed into one document", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("shows the banner on a ledger with more than one unpaid document", () => {
    const data = hostgrid();

    expect(size(gatherable(data))).toBeGreaterThan(1);
    expect(ref<boolean>(data, DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE)).toBe(
      true
    );
    expect(boundRefId(consolidationRow() as never, "visible")).toBe(
      DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE
    );
  });

  it("names the count of what it would gather, and gathers exactly that many", () => {
    const data = hostgrid();
    const promised = size(consolidatableInvoices(data));
    const owedBefore = filter(consolidatableInvoices(data), invoice =>
      includes(InvoiceStatusGroups.UNPAID, invoice.status)
    );

    expect(promised).toBeGreaterThan(1);
    expect(size(owedBefore)).toBe(promised);
    expect(
      ref<string>(data, DATA_REF_ID.INVOICE_CONSOLIDATION_MESSAGE)
    ).toContain(String(promised));

    dispatchMockAction(
      data,
      NO_CONTEXT,
      MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED
    );

    const raised = find(data.invoices, { isConsolidation: true });
    expect(size(filter(data.invoices, { replacedBy: raised?.id }))).toBe(
      promised
    );
  });

  it("asks before it gathers anything, and gathers nothing on the asking", () => {
    const data = hostgrid();
    const action = ref<ActionLike>(
      data,
      DATA_REF_ID.INVOICE_CONSOLIDATION_ACTION
    );
    const before = size(data.invoices);

    const result = dispatchMockAction(data, NO_CONTEXT, action.value);

    expect(action.value).toBe(MOCK_ACTION.CONSOLIDATE_INVOICES);
    // Legacy asks WHICH invoices, so the ask is the picker form.
    expect(result?.form?.id).toBe("consolidate-invoices");
    expect(result?.confirm).toBeUndefined();
    expect(result?.toast).toBeUndefined();
    expect(size(data.invoices)).toBe(before);
    expect(
      some(data.invoices, invoice => invoice.replacedBy !== undefined)
    ).toBe(false);
  });

  it("raises one unpaid document for the sum of the lot, and closes the originals against it", () => {
    const data = hostgrid();
    // Snapshotted BEFORE the write, so the sum is this test's arithmetic over
    // the documents the write itself closed — not over a set the selector and
    // the write might disagree about.
    const ledger = map(data.invoices, invoice => ({
      id: invoice.id,
      owed: invoice.unpaidAmount.amount,
      currency: invoice.total.currency,
      lines: size(invoice.lines)
    }));
    const before = size(data.invoices);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED
    );

    const raised = find(data.invoices, { isConsolidation: true });
    const closed = filter(data.invoices, { replacedBy: raised?.id });
    const was = (invoice: MockInvoice) => find(ledger, { id: invoice.id });

    expect(size(data.invoices)).toBe(before + 1);
    expect(size(closed)).toBeGreaterThan(1);
    expect(raised?.status).toBe(InvoiceStatus.UNPAID);
    expect(raised?.total.amount).toBe(
      sumBy(closed, invoice => was(invoice)?.owed ?? 0)
    );
    expect(raised?.total.currency).toBe(
      was(first(closed) as MockInvoice)?.currency
    );
    expect(size(raised?.lines)).toBe(
      sumBy(closed, invoice => was(invoice)?.lines ?? 0)
    );
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(map(closed, "status")).toEqual(
      map(closed, () => InvoiceStatus.CANCELLED)
    );
  });

  it("refuses a second gathering — one document is already one", () => {
    const data = hostgrid();

    dispatchMockAction(
      data,
      NO_CONTEXT,
      MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED
    );
    const raised = size(data.invoices);
    const again = dispatchMockAction(
      data,
      NO_CONTEXT,
      MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED
    );

    expect(toastText(again ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOTHING_TO_CONSOLIDATE]
    );
    expect(size(data.invoices)).toBe(raised);
    expect(ref<boolean>(data, DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE)).toBe(
      false
    );
  });

  it("leaves a document whose payment is already with the gateway out of it", () => {
    const data = hostgrid();
    const committed = committedInvoice(data);

    // It clears every condition the banner's own words state, so only the
    // money in flight can be what keeps it out.
    expect(includes(InvoiceStatusGroups.UNPAID, committed.status)).toBe(true);
    expect(committed.paidAmount.amount).toBe(0);
    expect(map(consolidatableInvoices(data), "id")).not.toContain(committed.id);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED
    );

    const after = find(data.invoices, { id: committed.id });
    expect(after?.replacedBy).toBeUndefined();
    expect(includes(InvoiceStatusGroups.UNPAID, after?.status)).toBe(true);
    // Cancelling it would strand the transfer: the client would still owe the
    // bank the money and have nowhere left to read how to send it.
    expect(instructionAction(data, committed.id)).toBeDefined();
  });

  it("leaves a quote out of it — nothing is gathered on the strength of one", () => {
    const data = hostgrid();
    const proforma = quote(data);

    expect(includes(InvoiceStatusGroups.UNPAID, proforma.status)).toBe(true);
    expect(proforma.paidAmount.amount).toBe(0);
    expect(map(consolidatableInvoices(data), "id")).not.toContain(proforma.id);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED
    );

    const after = find(data.invoices, { id: proforma.id });
    expect(after?.replacedBy).toBeUndefined();
    expect(includes(InvoiceStatusGroups.UNPAID, after?.status)).toBe(true);
  });

  it("hides the banner from a brand that has consolidation switched off", () => {
    const data = hostgrid();
    const switchedOff = assign({}, data, {
      features: assign({}, data.features, {
        INVOICE_CONSOLIDATION_ENABLED: false,
        INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF: false
      })
    });

    expect(size(gatherable(switchedOff))).toBeGreaterThan(1);
    expect(
      ref<boolean>(switchedOff, DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE)
    ).toBe(false);
    expect(
      ref<string>(switchedOff, DATA_REF_ID.INVOICE_CONSOLIDATION_MESSAGE)
    ).toBe("");
    expect(
      ref<ActionLike | undefined>(
        switchedOff,
        DATA_REF_ID.INVOICE_CONSOLIDATION_ACTION
      )
    ).toBeUndefined();
    // The minimal brand IS this case, so the gate is graded on a real dataset
    // and not only on a clone.
    expect(minimal().features.INVOICE_CONSOLIDATION_ENABLED).toBe(false);
    expect(minimal().features.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF).toBe(
      false
    );
  });

  it("hides the banner from a brand that keeps consolidation to its staff", () => {
    const data = hostgrid();
    const staffOnly = assign({}, data, {
      features: assign({}, data.features, {
        INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF: true
      })
    });

    expect(size(gatherable(staffOnly))).toBeGreaterThan(1);
    expect(
      ref<boolean>(staffOnly, DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE)
    ).toBe(false);
    expect(
      ref<string>(staffOnly, DATA_REF_ID.INVOICE_CONSOLIDATION_MESSAGE)
    ).toBe("");
    expect(
      ref<ActionLike | undefined>(
        staffOnly,
        DATA_REF_ID.INVOICE_CONSOLIDATION_ACTION
      )
    ).toBeUndefined();
  });

  it("hides the banner from a ledger with fewer than two unpaid documents, and from the minimal brand", () => {
    const data = hostgrid();
    const one = first(gatherable(data));
    if (one === undefined) throw new Error("seed carries no unpaid invoice");
    const settled = filter(
      data.invoices,
      invoice => !includes(InvoiceStatusGroups.UNPAID, invoice.status)
    );

    const lone = withInvoices(data, concat([one], settled));
    const none = withInvoices(data, settled);

    expect(ref<boolean>(lone, DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE)).toBe(
      false
    );
    expect(ref<boolean>(none, DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE)).toBe(
      false
    );
    expect(
      ref<boolean>(minimal(), DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE)
    ).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// P4 — what an address receives, and confirming one by hand
// -----------------------------------------------------------------------------

function emailBy(
  data: MockDataset,
  trait: string,
  matches: (entry: MockEmail) => boolean
): MockEmail {
  const entry = find(data.emails, matches);
  if (entry === undefined) throw new Error(`seed carries no ${trait}`);
  return entry;
}

function isVerified(entry: MockEmail): boolean {
  return entry.meta?.isVerified === true;
}

describe("P4 — an address manages what it receives, and takes its code by hand", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("writes the topics the client moved back onto that address alone", () => {
    const data = hostgrid();
    const entry = emailBy(data, "verified address", isVerified);
    const others = map(
      reject(data.emails, { id: entry.id }),
      candidate => candidate.topicOptIns
    );
    const model: Record<string, boolean> = {};
    for (const topic of data.emailTopics) {
      model[topic.id] = !includes(entry.topicOptIns, topic.id);
    }
    const wanted = map(
      filter(data.emailTopics, topic => model[topic.id]),
      "id"
    );

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.EMAIL_OPT_INS_SAVE, entry.email ?? "", model)
    );

    const saved = find(data.emails, { id: entry.id });
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(result?.formDone).toBe(true);
    expect([...(saved?.topicOptIns ?? [])].sort()).toEqual([...wanted].sort());
    expect(
      map(
        reject(data.emails, { id: entry.id }),
        candidate => candidate.topicOptIns
      )
    ).toEqual(others);
  });
});

// -----------------------------------------------------------------------------
// N1 — what a payment still with the gateway asks of the client
// -----------------------------------------------------------------------------

function documentMessages(
  data: MockDataset,
  invoiceId: string
): DocumentModuleMessage[] {
  return (
    ref<DocumentModuleMessage[]>(data, DATA_REF_ID.INVOICE_DOCUMENT_MESSAGES, {
      entityId: invoiceId
    }) ?? []
  );
}

function instructionAction(
  data: MockDataset,
  invoiceId: string
): ActionLike | undefined {
  return find(
    map(documentMessages(data, invoiceId), message => message.action),
    action =>
      action?.value ===
      mockActionValue(MOCK_ACTION.OPEN_INSTRUCTIONS, invoiceId)
  );
}

function awaitingInvoice(data: MockDataset): MockInvoice {
  const invoice = find(
    data.invoices,
    candidate => pendingInstruction(candidate) !== undefined
  );
  if (invoice === undefined) {
    throw new Error("seed carries no payment with instructions");
  }
  return invoice;
}

describe("N1 — the payment instructions a pending payment publishes", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    useProseDialog().close();
  });

  it("offers the control on exactly the documents with instructions to follow", () => {
    const data = hostgrid();
    const mine = filter(data.invoices, invoice =>
      some(
        invoice.payments,
        payment =>
          payment.status === MOCK_PAYMENT_STATUS.PENDING &&
          payment.instructions !== undefined
      )
    );

    expect(size(mine)).toBeGreaterThan(0);
    for (const invoice of data.invoices) {
      expect([
        invoice.id,
        instructionAction(data, invoice.id) !== undefined
      ]).toEqual([invoice.id, pendingInstruction(invoice) !== undefined]);
    }
    expect(map(mine, "id")).toEqual(
      map(
        filter(
          data.invoices,
          invoice => pendingInstruction(invoice) !== undefined
        ),
        "id"
      )
    );
  });

  it("withholds it from a pending payment the gateway published nothing for", () => {
    const data = hostgrid();
    const invoice = find(
      data.invoices,
      candidate =>
        includes(InvoiceStatusGroups.UNPAID, candidate.status) &&
        size(candidate.payments) === 0
    );
    if (invoice === undefined)
      throw new Error("seed carries no bare unpaid invoice");

    invoice.payments.push({
      id: "pay-silent-gateway",
      date: "2026-08-30",
      method: "Bank transfer",
      amount: invoice.total,
      status: MOCK_PAYMENT_STATUS.PENDING
    });

    expect(size(documentMessages(data, invoice.id))).toBeGreaterThan(0);
    expect(instructionAction(data, invoice.id)).toBeUndefined();

    const refused = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.OPEN_INSTRUCTIONS, invoice.id)
    );

    expect(toastText(refused ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NO_PAYMENT_INSTRUCTIONS]
    );
  });

  it("answers with the seeded markdown under a title, and asks nothing back", () => {
    const data = hostgrid();
    const invoice = awaitingInvoice(data);
    const seeded = pendingInstruction(invoice);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.OPEN_INSTRUCTIONS, invoice.id)
    );

    expect(result?.prose?.markdown).toBe(seeded?.instructions);
    expect(result?.prose?.title).toEqual(expect.any(String));
    expect(size(result?.prose?.title)).toBeGreaterThan(0);
    expect(result?.to).toBeUndefined();
    expect(result?.toast).toBeUndefined();
    expect(result?.confirm).toBeUndefined();
    expect(result?.form).toBeUndefined();
  });

  it("refuses a document with no payment in flight at all", () => {
    const data = hostgrid();
    const settled = find(data.invoices, invoice =>
      every(
        invoice.payments,
        payment => payment.status !== MOCK_PAYMENT_STATUS.PENDING
      )
    );
    if (settled === undefined)
      throw new Error("seed carries no settled invoice");

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.OPEN_INSTRUCTIONS, settled.id)
    );

    expect(result?.prose).toBeUndefined();
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NO_PAYMENT_INSTRUCTIONS]
    );
  });

  it("opens the shell's read-only dialog on it, and closes on its own close", () => {
    const data = hostgrid();
    const invoice = awaitingInvoice(data);
    const dialog = useProseDialog();

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.OPEN_INSTRUCTIONS, invoice.id)
    );

    expect(dialog.pending.value).toBeUndefined();
    if (result?.prose === undefined) throw new Error("no prose to open on");
    dialog.open(result.prose);

    expect(dialog.pending.value?.markdown).toBe(
      pendingInstruction(invoice)?.instructions
    );

    dialog.close();

    expect(dialog.pending.value).toBeUndefined();
  });
});
