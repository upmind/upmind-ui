// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockInvoice
 * @description ONE invoice, managed — the mock stand-in for the
 * `useClientInvoice` manager §3 hands to the factory. `pay()` is legacy's
 * pay-invoice outcome, optimistic and in memory only: it records the payment,
 * moves what has landed against what is still owed, and settles the document.
 *
 * The one place invoice money is worked out (plan R6): the store IS the mock's
 * server, and a facade is where its writes live.
 */

import {
  GatewayTypes,
  InvoiceStatus,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { grossBreakdown, shareTokenFor, zeroOf } from "../documents";
import { mockMoney } from "../money";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE } from "../status-labels";
import { nextId } from "../store";
import { MOCK_INVOICE_CATEGORY, MOCK_PAYMENT_STATUS } from "../types";
import { defineMockFacade, MOCK_RECEIPT_REASON, mockId } from "./facade";
import {
  assign,
  compact,
  filter,
  find,
  first,
  flatMap,
  includes,
  map,
  max,
  min,
  padStart,
  replace,
  size,
  some,
  sumBy,
  toNumber
} from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { DocumentModuleMessage } from "../../modules/document/types";
import type { StatusTone } from "../status-labels";
import type {
  MockDataset,
  MockDocumentPayment,
  MockInvoice,
  MockInvoiceLine,
  MockMoney,
  MockPaymentMethod
} from "../types";
import type { FormModel } from "@upmind/ui";

export const useMockInvoice = defineMockFacade(
  (data, invoiceId): MockInvoice | undefined =>
    find(data.invoices, { id: invoiceId }),
  (data, invoiceId) => ({
    /** The public link this document is shared by — the token is the dataset's, so the link is too. */
    share: (): MockActionReceipt<MockInvoice> | undefined => {
      const invoice = find(data.invoices, { id: invoiceId });
      if (invoice === undefined) return undefined;
      const refused = whyNotShareable(invoice);
      if (refused !== undefined) return refused;
      return { ok: true, entity: invoice };
    },

    /** Saves the sharing switch and its two permissions. */
    saveShare: (model: FormModel): MockActionReceipt<MockInvoice> => {
      const invoice = find(data.invoices, { id: invoiceId });
      if (invoice === undefined) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.NOT_FOUND };
      }
      const refused = whyNotShareable(invoice);
      if (refused !== undefined) return refused;
      assign(invoice, {
        isShared: model["isShared"] === true,
        shareAllowsDownload: model["allowDownload"] === true,
        // A settled document is never payable over the link, whatever was
        // ticked before it settled — the same gate the schema withholds on.
        shareAllowsPayment:
          isInvoiceOwed(invoice) && model["allowPayment"] === true
      });
      return { ok: true, entity: invoice };
    },

    /** Mints a new link, which retires the one already handed out. */
    regenerateShare: (): MockActionReceipt<MockInvoice> => {
      const invoice = find(data.invoices, { id: invoiceId });
      if (invoice === undefined) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.NOT_FOUND };
      }
      const refused = whyNotShareable(invoice);
      if (refused !== undefined) return refused;
      // Minted off the store's own sequence rather than the day, so two
      // regenerations in one afternoon retire each other rather than colliding.
      assign(invoice, {
        shareToken: shareTokenFor(nextId(invoiceId))
      });
      return { ok: true, entity: invoice };
    },

    /**
     * What the client still has to do for the payment in flight to land —
     * legacy's `paymentInstructionsModal`, which it fetched per pending
     * transaction. A document with nothing in flight, or a gateway that asks
     * nothing, has no instructions to show.
     */
    instructions: (): MockActionReceipt<MockDocumentPayment> | undefined => {
      const invoice = find(data.invoices, { id: invoiceId });
      if (invoice === undefined) return undefined;
      const awaiting = pendingInstruction(invoice);
      if (awaiting === undefined) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.NO_PAYMENT_INSTRUCTIONS
        };
      }
      return { ok: true, entity: awaiting };
    }
  })
);

/** What the client hands over on one payment (legacy's `invoicePaymentModal` payload). */
export type MockPayTender = {
  /** How much of the balance to settle; absent settles all of it. */
  readonly amount?: number;
  /** How much of that comes off the account's credit; absent takes none. */
  readonly credit?: number;
  /**
   * A card typed into the form rather than chosen off the account — legacy's
   * own gateway entry inside the pay modal. Absent settles on a stored card.
   */
  readonly newCard?: FormModel;
  /** Whether that card is kept on file afterwards — legacy's "Save payment details". */
  readonly saveCard?: boolean;
};

/** What the pay dialog may offer against this document, in the currency being handed over. */
export type MockPayableTender = {
  /** The balance still owed, converted into the currency the client chose. */
  readonly owed: MockMoney;
  /** The credit this account holds in that currency, where it holds any. */
  readonly credit?: MockMoney;
  /**
   * The most of that credit one payment may absorb — the same three-term cap
   * the write applies, so the bound the form offers is the bound the write
   * takes. Absent where there is no credit to draw on.
   */
  readonly creditCap?: number;
  /** What the credit line says — legacy's own three sentences. Absent where there is no credit. */
  readonly creditSummary?: string;
  /** Whether the brand takes part of what is owed — `PARTIAL_PAYMENTS_ENABLED`. */
  readonly canChangeAmount: boolean;
};

/**
 * The stored card this document will be settled with: the one it names, and
 * the account's default until it names one. Legacy read the same fallback at
 * pay time, so the message and the Pay control agree about what is charged.
 */
export function invoicePaymentMethod(
  data: MockDataset,
  invoice: MockInvoice
): MockPaymentMethod | undefined {
  const chosen = find(data.paymentMethods, { id: invoice.paymentDetailId });
  if (chosen !== undefined) return chosen;
  return find(data.paymentMethods, { isDefault: true });
}

/**
 * Whether money the system has recorded has not actually ARRIVED yet —
 * legacy's `isClearing` (`invoiceProvider.vue:91-95`): the invoice was
 * settled through the brand's offline "pending arrival" method, so the funds
 * are still in the post. Legacy hid the amounts and the paid stamp from a
 * client while it held (`invoiceItems.vue:357-361`).
 */
export function isInvoiceClearing(invoice: MockInvoice): boolean {
  return some(invoice.payments, payment => {
    const isOffline = payment.gatewayType === GatewayTypes.OFFLINE;
    return isOffline && payment.status === MOCK_PAYMENT_STATUS.PENDING;
  });
}

/**
 * Whether this document may be PAID — owed, and not already carrying money
 * the system has recorded but not received. ONE derivation, and every reader
 * defers to it: the document's own controls, the list row's Pay, and the
 * write itself. A row offering what the document withholds is how the same
 * invoice came to be settled twice.
 */
export function isInvoicePayable(invoice: MockInvoice): boolean {
  return isInvoiceOwed(invoice) && !isInvoiceClearing(invoice);
}

/**
 * Whether this document has taken something and still wants more — legacy's
 * `hasPartialPayment`, which is what put "Make additional payment" on it.
 */
export function isPartlyPaid(invoice: MockInvoice): boolean {
  return isInvoiceOwed(invoice) && invoice.paidAmount.amount > 0;
}

/** Whether an invoice is still owed — what every Pay affordance on the document hangs off. */
export function isInvoiceOwed(invoice: MockInvoice): boolean {
  return includes(InvoiceStatusGroups.UNPAID, invoice.status);
}

/**
 * How this document STANDS, in the words legacy's own status map published
 * (`data/enums/invoice.ts:41-205`, rendered by `invoiceStatusMsg.vue`). Six
 * states, each with the wording a PROFORMA takes instead — a quote is not a
 * demand, and legacy said so on every line.
 *
 * `toBeCredited` is NOT read here. Legacy's map takes it as a parameter
 * (`InvoiceStatusMap(invoice, showToBeCredited = false)`), and the document's
 * own banner passes the default — only the compact ROWS pass true
 * (`invoiceStatusMsg.vue:109` against `invoiceRowItem.vue:317`), which is why
 * `invoiceRowStanding` below reads it and this does not.
 *
 * Derived HERE rather than in the selector: the figure it quotes is money,
 * and money is the facade's (plan R6).
 */
export function invoiceStandingMessage(
  invoice: MockInvoice
): DocumentModuleMessage {
  const standing = invoiceStanding(invoice);
  return {
    id: "standing",
    tone: standing.tone,
    title: standing.title,
    message: standing.message
  };
}

/**
 * How a compact ROW reports this document's standing. Legacy's rows asked for
 * the to-be-credited reading (`invoiceRowItem.vue:317`,
 * `relativeInvoiceStatus.vue:44`, `orderRowItem.vue:277` all pass
 * `showToBeCredited` true), and legacy applied it inside the OVERDUE and
 * UNPAID/ADJUSTED arms alone — a settled or cancelled document is not waiting
 * on a pro-rata change.
 */
export function invoiceRowStanding(invoice: MockInvoice): {
  readonly label: string;
  readonly tone: StatusTone;
} {
  if (invoice.toBeCredited === true && isInvoiceOwed(invoice)) {
    return { label: "To be credited", tone: "info" };
  }
  return {
    label: INVOICE_STATUS_LABEL[invoice.status],
    tone: INVOICE_STATUS_TONE[invoice.status]
  };
}

/** The reason the brand recorded against the standing, as a sentence of its own. */
function statusReasonLine(invoice: MockInvoice): string | undefined {
  if (invoice.statusReason === undefined) return undefined;
  return `Cancellation reason: "${invoice.statusReason}".`;
}

/** What a document of this kind is CALLED in the sentence that reports it. */
function documentNoun(invoice: MockInvoice): string {
  if (invoice.category === MOCK_INVOICE_CATEGORY.PROFORMA) {
    return "proforma invoice";
  }
  return "invoice";
}

type InvoiceStanding = {
  readonly tone: DocumentModuleMessage["tone"];
  readonly title: string;
  readonly message: string;
};

function invoiceStanding(invoice: MockInvoice): InvoiceStanding {
  const noun = documentNoun(invoice);
  const owed = invoice.unpaidAmount.formatted;
  if (invoice.status === InvoiceStatus.CANCELLED) {
    // The reason rides the CANCELLED arm alone — legacy appended
    // `object_cancelled_reason_msg` inside that branch and nowhere else
    // (`data/enums/invoice.ts:96-103`).
    return {
      tone: "neutral",
      title: "Cancelled",
      message: compact([
        `This ${noun} was cancelled ${invoice.dateCancelled ?? invoice.issuedDate}.`,
        statusReasonLine(invoice)
      ]).join(" ")
    };
  }
  if (invoice.status === InvoiceStatus.REFUNDED) {
    return {
      tone: "info",
      title: "Refunded",
      message: `This ${noun} was refunded ${invoice.dateRefunded ?? invoice.dateCancelled ?? invoice.issuedDate}. Refunds can take up to 7 working days to show in your bank account.`
    };
  }
  if (invoice.status === InvoiceStatus.PAID) {
    return {
      tone: "success",
      title: "Paid",
      message: `This ${noun} was fully paid on ${invoice.datePaid ?? invoice.dueDate}.`
    };
  }
  if (invoice.status === InvoiceStatus.OVERDUE) {
    return {
      tone: "danger",
      title: "Overdue",
      message: `Payment for this ${noun} was due ${invoice.dueDate}. The outstanding balance is ${owed}.`
    };
  }
  return {
    tone: "warning",
    title: "Unpaid",
    message: `Payment for this ${noun} is due by ${invoice.dueDate}. The outstanding balance is ${owed}.`
  };
}

/**
 * Why this document's sharing cannot be changed, or undefined when it can. A
 * DELEGATED invoice belongs to the account that raised it: legacy withheld
 * its own controls on one, and the link is the owner's to hand out.
 */
export function whyNotShareable(
  invoice: MockInvoice
): MockActionReceipt<MockInvoice> | undefined {
  if (invoice.isDelegated !== true) return undefined;
  return {
    ok: false,
    reason: MOCK_RECEIPT_REASON.NOT_PERMITTED,
    entity: invoice
  };
}

/** Whether a payment against this invoice is still with the gateway. */
export function hasPendingPayment(invoice: MockInvoice): boolean {
  return some(invoice.payments, { status: MOCK_PAYMENT_STATUS.PENDING });
}

/**
 * The payment this invoice is waiting on the CLIENT for — one still with the
 * gateway that published something to follow, on a document that is still
 * owed. A settled or cancelled invoice asks nothing of anybody, whatever its
 * payments still say. Exported through the selectors so the document's own
 * message offers the control on exactly what the write will answer.
 */
export function pendingInstruction(
  invoice: MockInvoice
): MockDocumentPayment | undefined {
  if (!isInvoiceOwed(invoice)) return undefined;
  return find(
    invoice.payments,
    payment =>
      payment.status === MOCK_PAYMENT_STATUS.PENDING &&
      payment.instructions !== undefined
  );
}

/**
 * The invoices the brand would gather into one — legacy's own
 * `getConsolidatableTotal` filter, clause for clause: still owed, nothing
 * paid against it yet, a recurrent demand rather than a quote, and not itself
 * the product of a consolidation. Narrowed to ONE currency (the first
 * candidate's), because a total across two of them is not a total.
 */
/**
 * Legacy's consolidated document falls due on the client's chosen day of the
 * month where one is set; otherwise with the SOONEST of the documents it
 * replaced — gathering them buys no extra time.
 */
function consolidatedDueDate(
  dueDay: number | undefined,
  gathered: readonly MockInvoice[],
  raised: string
): string {
  if (dueDay === undefined) return min(map(gathered, "dueDate")) ?? raised;
  const on = new Date(`${raised}T00:00:00Z`);
  const candidate = new Date(
    Date.UTC(on.getUTCFullYear(), on.getUTCMonth(), dueDay)
  );
  if (candidate < on) candidate.setUTCMonth(candidate.getUTCMonth() + 1);
  return candidate.toISOString().slice(0, raised.length);
}

export function consolidatableInvoices(data: MockDataset): MockInvoice[] {
  const candidates = filter(data.invoices, invoice => {
    const isOwed = isInvoiceOwed(invoice);
    const isUntouched = invoice.paidAmount.amount === 0;
    // Legacy narrowed to `category.slug = RECURRENT`: a proforma is a quote,
    // and nothing is gathered on the strength of one.
    const isDemand = invoice.category === MOCK_INVOICE_CATEGORY.INVOICE;
    // A payment already with the gateway settles this document on its own.
    // Cancelling it out from under one would strand the money in flight and
    // leave a closed invoice still asking the client to complete a transfer.
    const isUncommitted = !hasPendingPayment(invoice);
    const isGatherable =
      invoice.isConsolidation !== true && invoice.replacedBy === undefined;
    return isOwed && isUntouched && isDemand && isUncommitted && isGatherable;
  });
  const currency = first(candidates)?.total.currency;
  if (currency === undefined) return [];
  return filter(candidates, invoice => invoice.total.currency === currency);
}

/** Legacy's own bound: one document replaces several, so several is where it starts. */
const CONSOLIDATION_MINIMUM = 2;

/**
 * Why these invoices cannot be gathered, or undefined when they can — asked
 * BEFORE the confirmation is offered (plan R4), so a client with one document
 * is refused outright rather than behind a dialog whose accept then refuses.
 */
export function whyNotConsolidatable(
  data: MockDataset
): MockActionReceipt<MockInvoice> | undefined {
  if (size(consolidatableInvoices(data)) >= CONSOLIDATION_MINIMUM) {
    return undefined;
  }
  return { ok: false, reason: MOCK_RECEIPT_REASON.NOTHING_TO_CONSOLIDATE };
}

/** How wide a minted invoice number reads — the seeds' own four figures. */
const INVOICE_NUMBER_DIGITS = 4;

/** The next document number the ledger hands out — one past the highest on file. */
function nextInvoiceNumber(data: MockDataset): string {
  const held = map(data.invoices, invoice =>
    toNumber(replace(invoice.number, /\D/g, ""))
  );
  const highest = max(filter(held, Number.isFinite)) ?? 0;
  return `INV-${padStart(String(highest + 1), INVOICE_NUMBER_DIGITS, "0")}`;
}

/**
 * Every gathered document's lines, re-keyed by the invoice they came off.
 * Line ids are unique WITHIN a document, so a straight concatenation would
 * put `l1` on the new one twice.
 */
function gatheredLines(gathered: readonly MockInvoice[]): MockInvoiceLine[] {
  return flatMap(gathered, invoice =>
    map(invoice.lines ?? [], line =>
      assign({}, line, {
        id: `${invoice.id}-${line.id}`
      })
    )
  );
}

/**
 * The invoice COLLECTION, managed — the mock stand-in for `useClientInvoices`
 * (`contracts/client-invoices.ts`). Consolidation is a collection write: it
 * closes several documents and raises one, so no per-invoice scope owns it.
 */
export const useMockInvoices = defineMockFacade(
  (data): readonly MockInvoice[] => data.invoices,
  data => ({
    /** Why the gather would refuse — the guard the control and the write share. */
    whyNotConsolidatable: (): MockActionReceipt<MockInvoice> | undefined =>
      whyNotConsolidatable(data),

    /**
     * Gathers every consolidatable invoice into one — legacy's manual
     * consolidation. The lines move across, the originals are cancelled
     * against the document that replaced them, and the money is worked out
     * here, where the mock's writes live (plan R6).
     */
    consolidate: (
      picked?: readonly string[]
    ): MockActionReceipt<MockInvoice> => {
      const gathered = filter(
        consolidatableInvoices(data),
        invoice => picked === undefined || includes(picked, invoice.id)
      );
      const opening = first(gathered);
      const refusal = whyNotConsolidatable(data);
      if (refusal !== undefined) return refusal;
      // Legacy's modal will not fire below two ticks: one invoice is already one document.
      if (opening === undefined || gathered.length < 2) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.NOTHING_TO_CONSOLIDATE
        };
      }

      const currency = opening.total.currency;
      const total = mockMoney(sumBy(gathered, "total.amount"), currency);
      const discounted = sumBy(
        gathered,
        invoice => invoice.discount?.amount ?? 0
      );
      const { subtotal, taxes } = grossBreakdown(total);
      const raised = new Date().toISOString().slice(0, "0000-00-00".length);
      const id = mockId("inv", map(data.invoices, "id"));

      let discount: MockMoney | undefined = undefined;
      if (discounted > 0) discount = mockMoney(discounted, currency);

      const created: MockInvoice = {
        id,
        number: nextInvoiceNumber(data),
        issuedDate: raised,
        dueDate: consolidatedDueDate(
          data.billingSettings.dueDateDay,
          gathered,
          raised
        ),
        subtotal: mockMoney(subtotal.amount + discounted, currency),
        discount,
        taxes,
        total,
        paidAmount: zeroOf(currency),
        unpaidAmount: total,
        payments: [],
        address: opening.address,
        status: InvoiceStatus.UNPAID,
        category: MOCK_INVOICE_CATEGORY.INVOICE,
        shareToken: shareTokenFor(id),
        lines: gatheredLines(gathered),
        isConsolidation: true
      };

      for (const replaced of gathered) {
        assign(replaced, {
          status: InvoiceStatus.CANCELLED,
          replacedBy: created.id,
          unpaidAmount: zeroOf(replaced.total.currency)
        });
      }
      data.invoices.unshift(created);
      return { ok: true, entity: created };
    }
  })
);
