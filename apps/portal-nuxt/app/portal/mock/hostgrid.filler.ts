// -----------------------------------------------------------------------------
/**
 * @module portal/mock/hostgrid.filler
 * @description Deterministic filler rows for hostgrid's collections. Every
 * results list carries THREE pages at the platform's page size, and enough
 * variation — statuses, dates spanning months, distinct names and amounts —
 * that searching, filtering and sorting have something to bite on.
 *
 * Hand-authored hero rows stay at the head of each list (the ones the
 * dashboards, the needs-attention line and the tests read by id); these pad
 * the tail. Nothing here is random: every value is a pure function of its
 * index, so a refresh reseeds the identical dataset.
 *
 * Money is data (plan R6): every amount is a figure and a currency, cycled
 * from an authored table, and its display string comes from the layer's ONE
 * formatter — never summed here (feedback: no client money math).
 *
 * The status-split lists pad by their TAB spelling, not by the wire enum: a
 * tab is what a client sees, and it keeps the generated ids readable
 * (`inv-unpaid-3`) where an enum member would spell them `inv-invoice_unpaid-3`.
 */

import {
  AffiliatePayoutDestinationCode,
  ContractStatusCodes,
  CreditNoteStatus,
  FraudStatus,
  InvoiceConsolidationTypes,
  InvoiceStatus,
  SentEmailStatus,
  TicketStatusCodes,
  WalletTransactionTypes
} from "@upmind-automation/types";
import {
  INVOICE_STATUS_TAB,
  PRODUCT_STATUS_TAB,
  TICKET_STATUS_TAB
} from "./collection-defs";
import { grossBreakdown, settlement, shareTokenFor } from "./documents";
import { mockMoney } from "./money";
import {
  MOCK_BILLING_TERM,
  MOCK_BILLING_TYPE,
  MOCK_DELEGATE_STATUS,
  MOCK_INVOICE_CATEGORY,
  MOCK_ORDER_STATUS,
  MOCK_PAYMENT_STATUS,
  MOCK_COMMISSION_STATUS,
  MOCK_PAYOUT_STATUS,
  MOCK_RENEWAL_TERM
} from "./types";
import { assign, filter, kebabCase } from "lodash-es";
import type {
  InvoiceStatusTab,
  ProductStatusTab,
  TicketStatusTab
} from "./collection-defs";
import type {
  MockAffiliate,
  MockAffiliateLink,
  MockAffiliateReferral,
  MockCatalogueItem,
  MockChildAccount,
  MockCreditNote,
  MockDelegate,
  MockDelegateStatus,
  MockDocumentPayment,
  MockInvoice,
  MockInvoiceCategory,
  MockIpAddress,
  MockLoginAttempt,
  MockMoney,
  MockNotification,
  MockOrder,
  MockParty,
  MockPaymentMethod,
  MockPaymentStatus,
  MockProduct,
  MockSentEmail,
  MockTicket,
  MockVaultAsset,
  MockWalletTransaction
} from "./types";
// -----------------------------------------------------------------------------

/**
 * Rows per results list — THREE pages at the platform's page size of 10
 * (`PAGINATION.limit`), so every pager has a middle page to land on rather
 * than a first and a last.
 */
export const SEED_ROWS_PER_LIST = 24;

/**
 * Pads a hand-authored list up to `target` with generated rows. Self-
 * maintaining: hero rows added later shrink the filler rather than pushing
 * the list past its target.
 */
export function padTo<T>(
  hero: readonly T[],
  make: (index: number) => T,
  target: number = SEED_ROWS_PER_LIST
): T[] {
  const filler: T[] = [];
  for (let index = 0; filler.length < target - hero.length; index += 1) {
    filler.push(make(index));
  }
  return [...hero, ...filler];
}

/**
 * Pads a list that serves SEVERAL results lists — invoices split by status,
 * tickets by open/closed, products by active/cancelled. Each status reaches
 * `target` on its own, because each is its own panel with its own pager.
 * Hero rows keep the head of the list, so the order-sensitive reads still
 * find them first.
 */
export function padByStatus<TRow, TStatus>(
  hero: readonly TRow[],
  statusOf: (row: TRow) => TStatus,
  statuses: readonly TStatus[],
  make: (status: TStatus, index: number) => TRow,
  target: number = SEED_ROWS_PER_LIST
): TRow[] {
  const rows = [...hero];
  for (const status of statuses) {
    const have = filter(hero, row => statusOf(row) === status).length;
    for (let index = 0; index < target - have; index += 1) {
      rows.push(make(status, index));
    }
  }
  return rows;
}

// --- deterministic primitives

/** Dates walk backwards from the dataset's "today", two rows per month, so a sort by date has a real spread. */
/** Which day of its month a padded row falls on — the ledger's pairing reads it too. */
function seedDay(index: number): number {
  return 4 + ((index * 7) % 24);
}

function seedYmd(index: number): string {
  const monthsBack = Math.floor(index / 2);
  const day = seedDay(index);
  const anchorMonth = 6 - monthsBack; // 6 = July, zero-based
  const yearsBack = Math.ceil(Math.max(-anchorMonth, 0) / 12);
  const month = ((anchorMonth % 12) + 12) % 12;
  const year = 2026 - yearsBack;
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function seedStamp(index: number): string {
  const hour = 7 + (index % 12);
  const minute = (index * 13) % 60;
  return `${seedYmd(index)}T${pad2(hour)}:${pad2(minute)}:00Z`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** A product name as a hostname label — what the filler's items are provisioned under. */
function slug(name: string): string {
  return kebabCase(name);
}

/** Every table below is non-empty, so the modulo always lands on a member. */
function cycle<T>(table: readonly T[], index: number): T {
  return table[index % table.length];
}

/** The brand's home currency — what every document is raised in. */
export const SEED_CURRENCY = "GBP";

/** Whose account every seeded row belongs to — the persona's id, as the wire carries it. */
export const SEED_CLIENT_ID = "md-client-1";

/** The brand's second trading currency — the wallet's other balance, and an order's alternate total. */
export const SEED_ALTERNATE_CURRENCY = "USD";

/** The seed's own money author — amount and currency in, the layer's ONE formatter out. */
export function money(amount: number, currency = SEED_CURRENCY): MockMoney {
  return mockMoney(amount, currency);
}

/** The one payment a settled document carries — the card it was taken on, the day it landed. */
export function seedPayment(
  id: string,
  date: string,
  amount: MockMoney,
  status: MockPaymentStatus = MOCK_PAYMENT_STATUS.SUCCESSFUL
): MockDocumentPayment {
  return { id, date, method: "Visa ···· 4242", amount, status };
}

/** Authored amounts, cycled — never computed. */
const AMOUNTS = [9, 12, 19, 24, 29, 36, 49, 61, 88, 120, 240, 450] as const;

function cycledMoney(index: number): MockMoney {
  return money(cycle(AMOUNTS, index));
}

const FIRST_NAMES = [
  "Amara",
  "Bree",
  "Caleb",
  "Dita",
  "Emeka",
  "Farah",
  "Goran",
  "Hana",
  "Ines",
  "Joss",
  "Kaito",
  "Lena"
] as const;

const LAST_NAMES = [
  "Okonjo",
  "Salter",
  "Vance",
  "Ibrahim",
  "Novak",
  "Delgado",
  "Petrov",
  "Whitfield"
] as const;

function personName(index: number): string {
  return `${cycle(FIRST_NAMES, index)} ${cycle(LAST_NAMES, index * 3)}`;
}

function personEmail(index: number): string {
  const name = personName(index).toLowerCase().replace(" ", ".");
  return `${name}@fieldnotes.app`;
}

// --- billing

const INVOICE_LINE_DESCRIPTIONS = [
  "Team Plan renewal",
  "Analytics Add-on",
  "Archive Storage",
  "Team Seats Pack",
  "Priority Support Add-on",
  "Content Delivery",
  "Reporting Pack",
  "Workshop Day"
] as const;

/**
 * The wire status each invoice tab seeds. Credited has no member of its own —
 * `InvoiceStatusGroups.CREDITED` is `[REFUNDED, CANCELLED]`, and a credit note
 * against a paid invoice is the REFUNDED half.
 * @decision credited → InvoiceStatus.REFUNDED (2026-09-02, plan R7).
 */
const INVOICE_TAB_STATUS: Readonly<Record<InvoiceStatusTab, InvoiceStatus>> = {
  [INVOICE_STATUS_TAB.ALL]: InvoiceStatus.UNPAID,
  [INVOICE_STATUS_TAB.UNPAID]: InvoiceStatus.UNPAID,
  [INVOICE_STATUS_TAB.PAID]: InvoiceStatus.PAID,
  [INVOICE_STATUS_TAB.CREDITED]: InvoiceStatus.REFUNDED
};

/** The review states a fraud filter narrows by — cleared is the ordinary case, so it leads. */
const FRAUD_STATUSES = [
  FraudStatus.NOT_FRAUD,
  FraudStatus.NOT_FRAUD,
  FraudStatus.NOT_FRAUD,
  FraudStatus.REVIEW,
  FraudStatus.FRAUD
] as const;

/**
 * The billing party every seeded document was raised for — snapshotted onto
 * each one, as legacy printed the address that stood the day it was issued.
 */
export const SEED_BILLING_PARTY: MockParty = {
  name: "Jonah Reyes",
  company: "Fieldnotes Ltd",
  taxNumber: "GB 421 8834 02",
  registrationNumber: "10482210",
  lines: [
    "Unit 4, Chandler Yard",
    "18 Bevenden Street",
    "London N1 6BX",
    "United Kingdom"
  ]
};

/** One line per invoice, its amount the invoice total — the document's own sum of one line. */
export function fillerInvoice(
  tab: InvoiceStatusTab,
  index: number
): MockInvoice {
  const total = cycledMoney(index + tab.length);
  const issued = seedYmd(index + 2);
  const status = INVOICE_TAB_STATUS[tab];
  let datePaid: string | undefined = undefined;
  if (status === InvoiceStatus.PAID) datePaid = seedYmd(index + 1);
  let dateCancelled: string | undefined = undefined;
  if (status === InvoiceStatus.REFUNDED) dateCancelled = seedYmd(index);
  const id = `inv-${tab}-${index + 1}`;
  const { subtotal, taxes } = grossBreakdown(total);
  const { paidAmount, unpaidAmount } = settlement(total, status);
  // Every fourth row is a quote rather than a demand, so the proforma switch
  // has rows on both sides of it.
  const isQuote = index % 4 === 3;
  let category: MockInvoiceCategory = MOCK_INVOICE_CATEGORY.INVOICE;
  if (isQuote) category = MOCK_INVOICE_CATEGORY.PROFORMA;
  let payments: MockDocumentPayment[] = [];
  if (datePaid !== undefined)
    payments = [seedPayment("pay-1", datePaid, total)];
  return {
    id,
    number: `INV-${tab.toUpperCase()}-${pad2(index + 1)}`,
    issuedDate: issued,
    dueDate: seedYmd(index),
    subtotal,
    taxes,
    total,
    paidAmount,
    unpaidAmount,
    payments,
    address: SEED_BILLING_PARTY,
    status,
    datePaid,
    dateCancelled,
    category,
    shareToken: shareTokenFor(id),
    fraudStatus: cycle(FRAUD_STATUSES, index),
    lines: [
      {
        id: "l1",
        description: cycle(INVOICE_LINE_DESCRIPTIONS, index),
        amount: total,
        quantity: 1,
        unitPrice: total
      }
    ]
  };
}

const ORDER_STATUSES = [
  MOCK_ORDER_STATUS.ACTIVE,
  MOCK_ORDER_STATUS.PROCESSING,
  MOCK_ORDER_STATUS.PENDING,
  MOCK_ORDER_STATUS.CANCELLED
] as const;

/** One item per filler order, priced at the order's own total — the items table's smallest honest row. */
export function fillerOrder(index: number): MockOrder {
  const total = cycledMoney(index + 4);
  const placed = seedYmd(index);
  const status = cycle(ORDER_STATUSES, index);
  const name = cycle(INVOICE_LINE_DESCRIPTIONS, index + 1);
  let paid: string | undefined = undefined;
  if (status === MOCK_ORDER_STATUS.ACTIVE) paid = seedYmd(index + 1);
  let cancelled: string | undefined = undefined;
  if (status === MOCK_ORDER_STATUS.CANCELLED) cancelled = seedYmd(index + 2);
  return {
    id: `ord-f${index + 1}`,
    number: `ORD-F${pad2(index + 1)}`,
    placedDate: placed,
    total,
    status,
    productNames: [name],
    items: [
      {
        id: "item-1",
        name,
        unitPrice: total,
        quantity: 1,
        total,
        serviceIdentifier: `${slug(name)}.fieldnotes.app`,
        categoryName: cycle(PRODUCT_CATEGORIES, index)
      }
    ],
    dates: { created: placed, paid, cancelled }
  };
}

export function fillerCreditNote(index: number): MockCreditNote {
  let status = CreditNoteStatus.ALLOCATED;
  if (index % 3 === 2) status = CreditNoteStatus.UNALLOCATED;
  const total = cycledMoney(index);
  const issued = seedYmd(index + 1);
  // An allocated credit has already been sent back; an unallocated one is
  // still sitting on the account, so it has no refund row at all.
  let refunds: MockDocumentPayment[] = [];
  if (status === CreditNoteStatus.ALLOCATED) {
    refunds = [seedPayment("ref-1", issued, total)];
  }
  return {
    id: `cn-f${index + 1}`,
    number: `CN-F${pad2(index + 1)}`,
    issuedDate: issued,
    total,
    status,
    invoiceNumber: `INV-CREDITED-${pad2(index + 1)}`,
    lines: [
      {
        id: "l1",
        description: cycle(INVOICE_LINE_DESCRIPTIONS, index),
        amount: total,
        quantity: 1,
        unitPrice: total
      }
    ],
    refunds,
    address: SEED_BILLING_PARTY
  };
}

/** The movement types the ledger cycles through, so every type has rows to filter by. */
const WALLET_MOVEMENTS = [
  {
    type: WalletTransactionTypes.ADD,
    description: "Top-up by card",
    incoming: true
  },
  {
    type: WalletTransactionTypes.SPEND,
    description: "Applied to an invoice",
    incoming: false
  },
  {
    type: WalletTransactionTypes.REFUND_TO_WALLET,
    description: "Credit note refunded to credit",
    incoming: true
  },
  {
    type: WalletTransactionTypes.REFUND_TO_GATEWAY,
    description: "Refund to card",
    incoming: false
  },
  {
    type: WalletTransactionTypes.WITHDRAW,
    description: "Withdrawal to bank account",
    incoming: false
  },
  {
    type: WalletTransactionTypes.OVERPAID_CREDIT_NOTE,
    description: "Overpayment credited",
    incoming: true
  },
  {
    type: WalletTransactionTypes.REFUND_FROM_WALLET,
    description: "Refund taken from credit",
    incoming: false
  }
] as const;

/** The incoming half of the vocabulary above — money arriving in the wallet. */
const WALLET_CREDITS = filter(WALLET_MOVEMENTS, { incoming: true });

/** The outgoing half — money leaving it. */
const WALLET_DEBITS = filter(WALLET_MOVEMENTS, { incoming: false });

/**
 * One padded ledger row. The rows come in PAIRS — `seedYmd` puts two in each
 * month, the even index earlier — and each pair pays money in and then takes
 * the same amount back out, so a pair leaves the balance where it found it.
 *
 * That is what keeps the ledger honest rather than decorative. The running
 * balance is chained across the whole ledger from the balance the account
 * actually holds (`mock/ledger.ts`), so padding that did not reconcile would
 * push the opening figure up by everything it added and send the earliest
 * months into a negative balance — and account credit cannot go negative.
 * Paired, the padding nets to nothing and the hand-authored block keeps the
 * chain it was written with.
 *
 * The OLDEST row has no pair (there is an odd number of them). It draws down
 * the credit the account already held before this window, which is the one
 * shape that leaves the chain non-negative: the balance opens at its size and
 * the row takes it to nothing.
 */
export function fillerWalletTransaction(index: number): MockWalletTransaction {
  const size = cycle(AMOUNTS, Math.floor(index / 2));
  const isIncoming = paysInFirst(index);
  if (isIncoming) {
    const credit = cycle(WALLET_CREDITS, index);
    return {
      id: `wt-f${index + 1}`,
      date: seedYmd(index),
      type: credit.type,
      description: credit.description,
      amount: money(size)
    };
  }
  const debit = cycle(WALLET_DEBITS, index);
  return {
    id: `wt-f${index + 1}`,
    date: seedYmd(index),
    type: debit.type,
    description: debit.description,
    amount: money(-size)
  };
}

/**
 * The unpaired row at the far end of the padding. `padTo` fills to
 * `SEED_ROWS_PER_LIST`, and the hand-authored ledger leaves an odd number of
 * places, so exactly one row has no partner.
 */
const OLDEST_FILLER_INDEX = 14;

/** The other row of this one's month — `seedYmd` puts two in each. */
function pairedWith(index: number): number {
  if (index % 2 === 0) return index + 1;
  return index - 1;
}

/**
 * Whether this row is the paying-IN half of its pair. The money has to arrive
 * before it can leave, or the balance dips below zero on the way through the
 * month — and `seedYmd`'s day is not monotonic in the index (February's pair
 * falls on the 26th and the 9th, in that index order), so the question is
 * which row is EARLIER, never which index is even.
 */
function paysInFirst(index: number): boolean {
  if (index === OLDEST_FILLER_INDEX) return false;
  return seedDay(index) < seedDay(pairedWith(index));
}

const CARD_BRANDS = ["Visa", "Mastercard", "Amex", "Discover"] as const;

const GATEWAY_NAMES = ["Stripe", "Braintree", "Adyen"] as const;

export function fillerPaymentMethod(index: number): MockPaymentMethod {
  return {
    id: `pm-f${index + 1}`,
    brand: cycle(CARD_BRANDS, index),
    last4: String(4000 + index * 7).slice(0, 4),
    expiry: `${pad2((index % 12) + 1)}/${28 + (index % 4)}`,
    gatewayName: cycle(GATEWAY_NAMES, index),
    // Both branches of each tag: every third card renews itself, and every
    // fifth is still waiting on the gateway to confirm it.
    autoPayment: index % 3 === 0,
    verified: index % 5 !== 4,
    isDefault: false
  };
}

// --- products

const PRODUCT_NAMES = [
  "Static Hosting",
  "Object Storage",
  "Search Index",
  "Image Pipeline",
  "Edge Functions",
  "Audit Log Retention",
  "Sandbox Environment",
  "Custom Domain",
  "Backup Vault",
  "Queue Workers",
  "Webhook Relay",
  "Uptime Monitor"
] as const;

const PRODUCT_CATEGORIES = ["Subscription", "One-time purchase"] as const;

/** The wire status each product tab seeds; Active covers everything a Cancelled tab does not. */
const PRODUCT_TAB_STATUS: Readonly<
  Record<ProductStatusTab, ContractStatusCodes>
> = {
  [PRODUCT_STATUS_TAB.ALL]: ContractStatusCodes.ACTIVE,
  [PRODUCT_STATUS_TAB.ACTIVE]: ContractStatusCodes.ACTIVE,
  [PRODUCT_STATUS_TAB.CANCELLED]: ContractStatusCodes.CANCELLED
};

export function fillerProduct(
  tab: ProductStatusTab,
  index: number
): MockProduct {
  const isSubscription = index % 3 !== 2;
  const category = isSubscription
    ? PRODUCT_CATEGORIES[0]
    : PRODUCT_CATEGORIES[1];
  let billingTerm: string | undefined = undefined;
  if (isSubscription) billingTerm = MOCK_BILLING_TERM.MONTHLY;
  let cancelledAt: string | undefined = undefined;
  if (tab === PRODUCT_STATUS_TAB.CANCELLED) cancelledAt = seedYmd(index);
  return {
    id: `prod-${tab}-${index + 1}`,
    groupSlug: "products",
    name: `${cycle(PRODUCT_NAMES, index)} ${index + 1}`,
    serviceIdentifier: `${cycle(PRODUCT_NAMES, index).toLowerCase().replace(" ", "-")}-${index + 1}.fieldnotes.app`,
    cancelledAt,
    category,
    billingType: isSubscription
      ? MOCK_BILLING_TYPE.SUBSCRIPTION
      : MOCK_BILLING_TYPE.ONE_TIME,
    status: PRODUCT_TAB_STATUS[tab],
    // Behind every hand-authored product, so the seeded rows keep the head of
    // a listing that opens newest-first.
    createdAt: seedYmd(index + 2),
    purchasedAt: seedYmd(index + 2),
    contractId: `ctr-${tab}-${index + 1}`,
    orderId: "ord-31",
    nextDueDate: isSubscription ? seedYmd(index) : undefined,
    price: cycledMoney(index + 1),
    billingTerm,
    renewalTerm: isSubscription ? MOCK_RENEWAL_TERM.MONTHLY : undefined,
    autoRenew: isSubscription && tab !== PRODUCT_STATUS_TAB.CANCELLED,
    lineItems: [
      {
        id: "li-base",
        description: `${cycle(PRODUCT_NAMES, index)} ${index + 1}`,
        amount: cycledMoney(index + 1)
      }
    ],
    // A padded product carries no provider surface: provisioning is what the
    // hand-authored showcase product is for. Its lifecycle is the ordinary
    // one for the same reason — every gate's other branch is hand-authored.
    provisioning: { fields: [], functions: [], iframes: [] },
    canModify: true,
    canDisableAutoRenew: true,
    pendingProRata: false,
    migrationOptions: [],
    scheduledActions: [],
    invoiceConsolidation: InvoiceConsolidationTypes.INHERIT
  };
}

const CATALOGUE_BLURBS = [
  "Ship it without touching a server.",
  "Room to grow, billed by what you use.",
  "Built for teams that move quickly.",
  "The essentials, nothing you will not use.",
  "Add it today, remove it whenever."
] as const;

export function fillerCatalogueItem(index: number): MockCatalogueItem {
  const isSubscription = index % 3 !== 2;
  const charge = cycledMoney(index + 2);
  let billingTerm: string | undefined = undefined;
  if (isSubscription) billingTerm = MOCK_BILLING_TERM.MONTHLY;
  return {
    id: `cat-f${index + 1}`,
    groupSlug: "products",
    name: `${cycle(PRODUCT_NAMES, index + 4)} Plan`,
    category: isSubscription ? PRODUCT_CATEGORIES[0] : PRODUCT_CATEGORIES[1],
    billingType: isSubscription
      ? MOCK_BILLING_TYPE.SUBSCRIPTION
      : MOCK_BILLING_TYPE.ONE_TIME,
    description: cycle(CATALOGUE_BLURBS, index),
    price: charge,
    billingTerm,
    chargeTotal: charge
  };
}

// --- support

const TICKET_SUBJECTS = [
  "Invoice address looks wrong",
  "Cannot upload a large file",
  "Renewal date question",
  "Add a seat to my plan",
  "Password reset did not arrive",
  "Custom domain is not resolving",
  "Backup restore request",
  "Rate limit on the API",
  "Change billing contact",
  "Export my usage report",
  "Downgrade before renewal",
  "Duplicate charge on my card"
] as const;

const DEPARTMENTS = [
  "Billing",
  "Product support",
  "Accounts",
  "Sales"
] as const;

const TICKET_PRODUCT_IDS = ["prod-team", "prod-team", "prod-analytics"];

/** The wire status each ticket tab seeds — legacy's Active tab is the OPEN thread. */
const TICKET_TAB_STATUS: Readonly<Record<TicketStatusTab, TicketStatusCodes>> =
  {
    [TICKET_STATUS_TAB.ACTIVE]: TicketStatusCodes.OPEN,
    [TICKET_STATUS_TAB.CLOSED]: TicketStatusCodes.CLOSED
  };

function agentReply(tab: TicketStatusTab): string {
  if (tab === TICKET_STATUS_TAB.CLOSED) {
    return "All sorted — closing this off. Reopen any time.";
  }
  return "Thanks for flagging it, we are looking into this now.";
}

/** A finished thread carries the day it finished; an open one has none yet. */
function closedStamp(tab: TicketStatusTab, stamp: string): string | undefined {
  if (tab === TICKET_STATUS_TAB.CLOSED) return stamp;
  return undefined;
}

/**
 * One more message on a LONG thread — the run behind the hero exchange that
 * takes it past a page, so the feed's Show-more has something to fetch
 * (`ticketMessages.vue:105-112`). Every third one carries a file, so the
 * Attachments tab has more than one row to show.
 */
export function fillerTicketMessage(
  index: number
): MockTicket["messages"][number] {
  const isClient = index % 2 === 0;
  const hour = 8 + (index % 10);
  const sentAt = `2026-08-${pad2(1 + Math.floor(index / 2))}T${pad2(hour)}:15:00Z`;
  let attachments: string[] | undefined = undefined;
  if (index % 3 === 0) attachments = [`transcript-${pad2(index + 1)}.txt`];
  let author = "Jonah Reyes";
  let authorType: MockTicket["messages"][number]["authorType"] = "client";
  if (!isClient) {
    author = "Ada (Host·Grid support)";
    authorType = "agent";
  }
  return {
    id: `msg-f${index + 1}`,
    author,
    authorType,
    sentAt,
    body: `Follow-up ${index + 1} on the migration window.`,
    attachments
  };
}

export function fillerTicket(tab: TicketStatusTab, index: number): MockTicket {
  const stamp = seedStamp(index);
  const subject = cycle(TICKET_SUBJECTS, index + tab.length);
  return {
    id: `tkt-${tab}-${index + 1}`,
    reference: `#48${pad2(index + 1)}${tab.length}`,
    productId: cycle(TICKET_PRODUCT_IDS, index),
    subject,
    department: cycle(DEPARTMENTS, index),
    status: TICKET_TAB_STATUS[tab],
    createdAt: stamp,
    updatedAt: stamp,
    closedAt: closedStamp(tab, stamp),
    assignedAgent: cycle(FIRST_NAMES, index),
    messages: [
      {
        id: "msg-1",
        author: "Jonah Reyes",
        authorType: "client",
        sentAt: stamp,
        body: `${subject} — could you take a look when you get a moment?`
      },
      {
        id: "msg-2",
        author: cycle(FIRST_NAMES, index),
        authorType: "agent",
        sentAt: stamp,
        body: agentReply(tab)
      }
    ]
  };
}

// --- account

const NOTIFICATION_TITLES = [
  "Invoice ready to view",
  "Payment received",
  "Card expiring soon",
  "Renewal coming up",
  "New sign-in to your account",
  "Ticket updated",
  "Storage nearly full",
  "Plan change confirmed"
] as const;

export function fillerNotification(index: number): MockNotification {
  return {
    id: `ntf-f${index + 1}`,
    title: cycle(NOTIFICATION_TITLES, index),
    body: `${cycle(NOTIFICATION_TITLES, index)} — open your account to see the detail.`,
    sentAt: seedStamp(index + 1),
    read: index % 4 !== 0
  };
}

const VAULT_LABELS = [
  "Staging database URL",
  "SFTP credentials",
  "API sandbox key",
  "Legacy admin login",
  "DNS registrar PIN",
  "Backup passphrase",
  "Analytics service token",
  "Webhook signing secret"
] as const;

/**
 * Padded vault rows are made PER PANEL — notes and secrets are two lists on
 * one page, and a list of twenty-four notes beside a list of none would leave
 * the other's pager and its reveal control unexercised.
 */
export function fillerVaultEntry(
  encrypted: boolean,
  index: number
): MockVaultAsset {
  const created = seedYmd(index);
  let kind = "note";
  if (encrypted) kind = "secret";
  return {
    id: `vault-${kind}-${index + 1}`,
    label: `${cycle(VAULT_LABELS, index)} ${index + 1}`,
    note: `fieldnotes-${pad2(index + 1)}-${cycle(LAST_NAMES, index).toLowerCase()}`,
    encrypted,
    client_id: SEED_CLIENT_ID,
    contract_product_id: null,
    created_at: created,
    updated_at: created
  };
}

/**
 * One product's OWN ledgers pad the same way its listing does: a settled
 * invoice and a credit note against it, dated well behind the hand-authored
 * rows so the recent ones keep the head of both lists.
 */
export function fillerProductInvoice(
  productId: string,
  index: number
): MockInvoice {
  const issued = seedYmd(index + SEED_ROWS_PER_LIST);
  const total = cycledMoney(index);
  const { subtotal, taxes } = grossBreakdown(total);
  const id = `inv-${productId}-${index + 1}`;
  return {
    id,
    number: id.toUpperCase(),
    issuedDate: issued,
    dueDate: issued,
    subtotal,
    taxes,
    total,
    paidAmount: total,
    unpaidAmount: money(0),
    payments: [seedPayment("pay-1", issued, total)],
    address: SEED_BILLING_PARTY,
    status: InvoiceStatus.PAID,
    datePaid: issued,
    category: MOCK_INVOICE_CATEGORY.INVOICE,
    shareToken: shareTokenFor(id),
    productId
  };
}

export function fillerProductCreditNote(
  productId: string,
  index: number
): MockCreditNote {
  const issued = seedYmd(index + SEED_ROWS_PER_LIST);
  const total = cycledMoney(index);
  const id = `cn-${productId}-${index + 1}`;
  return {
    id,
    number: id.toUpperCase(),
    issuedDate: issued,
    total,
    status: CreditNoteStatus.ALLOCATED,
    refunds: [seedPayment("ref-1", issued, total)],
    address: SEED_BILLING_PARTY,
    productId
  };
}

const PERMISSIONS = [
  ["View invoices"],
  ["Manage products", "View invoices"],
  ["View tickets", "Reply to tickets"],
  ["Manage products"],
  ["View invoices", "View tickets"]
] as const;

export function fillerDelegate(index: number): MockDelegate {
  let status: MockDelegateStatus = MOCK_DELEGATE_STATUS.ACCEPTED;
  if (index % 4 === 1) status = MOCK_DELEGATE_STATUS.PENDING;
  return {
    id: `dlg-f${index + 1}`,
    name: personName(index),
    email: personEmail(index),
    invitedAt: seedYmd(index),
    // Every third delegate holds the whole account, so the access switch has
    // rows on both sides of it.
    isFullDelegate: index % 3 === 0,
    status,
    objects: [],
    permissions: cycle(PERMISSIONS, index)
  };
}

export function fillerChildAccount(index: number): MockChildAccount {
  return {
    id: `child-f${index + 1}`,
    child_client_id: `md-client-f${index + 1}`,
    parent_client_id: "md-client-1",
    created_at: `2026-0${(index % 8) + 1}-1${index % 10}T09:00:00Z`,
    name: `${cycle(LAST_NAMES, index)} ${cycle(["Studio", "Labs", "Group", "Digital"], index)}`,
    email: personEmail(index + 2),
    // Every third relation refuses impersonation, so the filler carries both
    // branches of the switch the hand-authored rows already split.
    allow_impersonation: index % 3 !== 1,
    inherit_payment_details: index % 2 === 0,
    use_parent_branding: index % 2 === 1
  };
}

const COMMISSION_SOURCES = [
  "Referral — Pro Plan",
  "Referral — Team Plan",
  "Referral — Starter Plan",
  "Referral — Workshop Day",
  "Referral — Priority Support"
] as const;

export function fillerCommission(
  index: number
): MockAffiliate["commissions"][number] {
  return {
    id: `com-f${index + 1}`,
    description: `${cycle(COMMISSION_SOURCES, index)} (${personName(index)})`,
    earnedAt: seedYmd(index),
    amount: cycledMoney(index),
    // The filler is history: everything behind the hero rows has settled.
    status: MOCK_COMMISSION_STATUS.APPROVED,
    approvedAt: seedYmd(index)
  };
}

/**
 * A padded referral link. Legacy's own links table pages
 * (`affiliateLinksTable.vue`), so the seed carries enough for a client to
 * meet a second and a third page of them.
 */
export function fillerAffiliateLink(index: number): MockAffiliateLink {
  const slug = `${cycle(LAST_NAMES, index).toLowerCase()}-${index + 1}`;
  return {
    id: `lnk-f${index + 1}`,
    name: `${cycle(LINK_PLACEMENTS, index)} ${index + 1}`,
    url: `https://hostgrid.example/r/${slug}`,
    redirectUrl: `https://hostgrid.example/${cycle(LINK_TARGETS, index)}`,
    // Cycled figures, so the visit and referral orders both have something
    // to order by beyond the hand-authored three.
    clicks: 40 + ((index * 37) % 900),
    signups: 1 + ((index * 7) % 40),
    createdAt: seedYmd(index)
  };
}

/** Where a client puts a link — legacy's own examples, cycled. */
const LINK_PLACEMENTS = [
  "Newsletter footer",
  "Conference talk",
  "Client handbook",
  "Blog sidebar",
  "Podcast notes"
] as const;

/** Where following one lands. */
const LINK_TARGETS = ["", "pricing", "hosting", "domains"] as const;

/** Where a payout went, cycled — every destination the wire names, in turn. */
const PAYOUT_DESTINATIONS = [
  AffiliatePayoutDestinationCode.PAYPAL,
  AffiliatePayoutDestinationCode.WALLET,
  AffiliatePayoutDestinationCode.OFFLINE
] as const;

export function fillerPayout(index: number): MockAffiliate["payouts"][number] {
  // Every seventh transfer fails, so the history's error column has rows on
  // both sides of it beyond the hand-authored one.
  const hasFailed = index % 7 === 6;
  const payout: MockAffiliate["payouts"][number] = {
    id: `pay-f${index + 1}`,
    requestedAt: seedYmd(index + 1),
    paidAt: seedYmd(index + 1),
    amount: cycledMoney(index + 6),
    destination: cycle(PAYOUT_DESTINATIONS, index),
    status: MOCK_PAYOUT_STATUS.PAID
  };
  if (!hasFailed) return payout;
  return assign({}, payout, {
    status: MOCK_PAYOUT_STATUS.FAILED,
    error: "The transfer was returned by the receiving account."
  });
}

export function fillerAffiliateReferral(
  index: number,
  links: readonly MockAffiliateLink[]
): MockAffiliateReferral {
  const name = personName(index).toLowerCase().replace(" ", "-");
  return {
    id: `ref-f${index + 1}`,
    // Anonymised exactly as the hand-authored rows are: the first letter, then
    // the domain the account signed up under.
    client: `${name.slice(0, 1)}***@${cycle(REFERRAL_DOMAINS, index)}`,
    linkId: cycle(links, index).id,
    date: seedYmd(index)
  };
}

const REFERRAL_DOMAINS = [
  "northgate.example",
  "quill-labs.example",
  "harbormedia.example",
  "atlaslabs.example",
  "studionorth.example"
] as const;

// --- logs

const DEVICES = [
  "Firefox on Linux",
  "Safari on macOS",
  "Chrome on Windows",
  "Safari on iOS",
  "Edge on Windows",
  "Chrome on Android"
] as const;

const IPS = [
  "198.51.100.23",
  "203.0.113.9",
  "192.0.2.44",
  "203.0.113.77",
  "198.51.100.90"
] as const;

/**
 * The three blocks RFC 5737 reserves for documentation. A seed never carries a
 * routable address, so every filler row is drawn from one of these.
 */
const DOCUMENTATION_BLOCKS = ["192.0.2", "198.51.100", "203.0.113"] as const;

/** The lowest host the filler takes, clear of the addresses the sign-in log cycles. */
const FILLER_HOST_FROM = 11;

/** The places a client signs in from, as the allowlist names them. */
const ALLOWLIST_SITES = [
  "Manchester studio",
  "Leeds workshop",
  "Glasgow desk",
  "Cardiff annexe",
  "Belfast office",
  "Dublin hot desk"
] as const;

/**
 * One more allowlisted address. The BLOCK cycles the three reserved ranges and
 * the host walks once per full cycle, so every filler row carries an address of
 * its own inside RFC 5737 — a duplicate would be a row the facade's own guard
 * refuses to write, and a routable one would be an address somebody owns.
 */
export function fillerIpAddress(index: number): MockIpAddress {
  const stamped = seedStamp(index);
  const block = cycle(DOCUMENTATION_BLOCKS, index);
  const host =
    FILLER_HOST_FROM + Math.floor(index / DOCUMENTATION_BLOCKS.length);
  return {
    id: `ip-f${index + 1}`,
    ip_address: `${block}.${host}`,
    name: `${cycle(ALLOWLIST_SITES, index)} ${index + 1}`,
    created_at: stamped,
    updated_at: stamped
  };
}

/** The facts one sent email is authored from; everything else the model carries follows. */
export type SentEmailFacts = {
  readonly id: string;
  readonly subject: string;
  readonly to: string;
  readonly status: SentEmailStatus;
  /** When the brand sent it, ISO. */
  readonly at: string;
  readonly body: string;
  readonly cc?: string;
  readonly recipientName?: string;
};

const SENT_EMAIL_FROM = "Host-Grid <hello@hostgrid.example>";

/** A minute after the send — when the receiving server answered. */
function minuteAfter(iso: string): string {
  return new Date(new Date(iso).getTime() + 60_000).toISOString();
}

/**
 * One row of legacy's email history in the headless `SentEmail` shape. The
 * dates follow the status: a sent mail has a send date, a bounced one a
 * bounce after it, a failed one an error stamp and no send at all.
 */
export function sentEmailRow(facts: SentEmailFacts): MockSentEmail {
  const none: MockSentEmail["dateSent"] = { date: null, relative: null };
  const isSent = facts.status === SentEmailStatus.SENT;
  const isBounced = facts.status === SentEmailStatus.BOUNCED;
  const isError = facts.status === SentEmailStatus.ERROR;
  let dateSent = none;
  if (isSent || isBounced) dateSent = { date: facts.at, relative: null };
  let dateBounced = none;
  if (isBounced) dateBounced = { date: minuteAfter(facts.at), relative: null };
  let dateErrored = none;
  if (isError) dateErrored = { date: facts.at, relative: null };
  return {
    id: facts.id,
    body: facts.body,
    from: SENT_EMAIL_FROM,
    subject: facts.subject,
    to: facts.to,
    cc: facts.cc ?? "",
    dateBounced,
    dateErrored,
    dateSent,
    date: { date: facts.at, relative: null },
    dateCreated: { date: facts.at, relative: null },
    status: facts.status,
    recipient: {
      name: facts.recipientName ?? "Jonah Reyes",
      email: facts.to,
      imageUrl: ""
    },
    meta: { isBounced, isError, isSent }
  };
}

const SENT_EMAIL_SUBJECTS = [
  "Your invoice is ready",
  "Payment received",
  "Your product renews soon",
  "A reply to your ticket",
  "Your monthly usage report"
] as const;

/** Each outcome's filler starts elsewhere in the cycle, so three tabs never share a row. */
const SENT_EMAIL_OFFSET: Readonly<Record<SentEmailStatus, number>> = {
  [SentEmailStatus.SENT]: 0,
  [SentEmailStatus.BOUNCED]: 7,
  [SentEmailStatus.ERROR]: 13,
  [SentEmailStatus.SENDING]: 20
};

/** Filler for one status tab of the email history — dated behind the hero rows. */
export function fillerSentEmail(
  status: SentEmailStatus,
  index: number
): MockSentEmail {
  const slot = index + SENT_EMAIL_OFFSET[status];
  const subject = cycle(SENT_EMAIL_SUBJECTS, slot);
  return sentEmailRow({
    id: `mail-f-${kebabCase(status)}-${index + 1}`,
    subject: `${subject} (${slot + 1})`,
    to: "jonah@fieldnotes.app",
    status,
    at: seedStamp(slot + 30),
    body: `Hi Jonah,\n\n${subject}. Nothing to do unless we say otherwise.\n\nHost-Grid`
  });
}

export function fillerLoginAttempt(index: number): MockLoginAttempt {
  return {
    id: `log-f${index + 1}`,
    at: seedStamp(index),
    ip: cycle(IPS, index),
    device: cycle(DEVICES, index),
    succeeded: index % 5 !== 0
  };
}
