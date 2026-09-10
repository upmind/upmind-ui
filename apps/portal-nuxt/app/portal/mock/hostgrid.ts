// -----------------------------------------------------------------------------
/**
 * @module portal/mock/hostgrid
 * @description hostgrid's seed dataset — the generic pilot (plan §2): one
 * "Products" bucket mixing subscriptions and one-time purchases, unpaid
 * invoices and open tickets so the gates and needs-attention paths render
 * their other branch somewhere (plan §2 — gates flipped against Host·Grid).
 * Every results list carries THREE pages (operator request 2026-08-27), with
 * varied statuses, dates and names so searching, filtering and sorting have
 * something to bite on — the hand-authored rows lead, `hostgrid.filler.ts`
 * pads the tail.
 */

import {
  AffiliatePayoutDestinationCode,
  BlueprintFieldsTypes,
  CancellationRequestStatusCodes,
  ClientTemplateSlotCodes,
  ContractStatusCodes,
  CustomFieldsTypes,
  GatewayTypes,
  NotificationChannelCodes,
  CreditNoteStatus,
  DelegateObjectTypes,
  FraudStatus,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes,
  InvoiceStatus,
  PriceDisplayTypes,
  ProvisionRequestActionTypes,
  ScheduledActionStatusTypes,
  ScheduledActionTypes,
  TicketStatusCodes,
  WalletTransactionTypes
} from "@upmind-automation/types";
import {
  INVOICE_STATUS_TAB,
  PRODUCT_STATUS_TAB,
  TICKET_STATUS_TAB,
  invoiceStatusTab,
  productStatusTab,
  ticketStatusTab
} from "./collection-defs";
import { CONSOLIDATION_WEEKDAY } from "./contracts/client-billing-settings.schemas";
import { grossBreakdown, settlement, shareTokenFor } from "./documents";
import {
  SEED_ALTERNATE_CURRENCY,
  SEED_BILLING_PARTY,
  SEED_CLIENT_ID,
  SEED_CURRENCY,
  fillerAffiliateReferral,
  fillerCatalogueItem,
  fillerAffiliateLink,
  fillerCommission,
  fillerTicketMessage,
  fillerCreditNote,
  fillerDelegate,
  fillerInvoice,
  fillerIpAddress,
  fillerLoginAttempt,
  fillerNotification,
  fillerOrder,
  fillerPaymentMethod,
  fillerPayout,
  fillerProduct,
  fillerProductCreditNote,
  fillerProductInvoice,
  fillerTicket,
  fillerVaultEntry,
  fillerWalletTransaction,
  money,
  padByStatus,
  padTo,
  seedPayment
} from "./hostgrid.filler";
import {
  MOCK_ADDRESS_TYPE,
  MOCK_BILLING_TERM,
  MOCK_BILLING_TYPE,
  MOCK_DELEGATE_STATUS,
  MOCK_EMAIL_TYPE,
  MOCK_ENTER_KEY_ACTION,
  MOCK_INVOICE_CATEGORY,
  MOCK_ORDER_STATUS,
  MOCK_PAYMENT_STATUS,
  MOCK_PAYOUT_STATUS,
  MOCK_PHONE_TYPE,
  MOCK_COMMISSION_STATUS,
  MOCK_TRIAL_END_ACTION,
  MOCK_PRODUCT_TAG,
  MOCK_RENEWAL_TERM,
  MOCK_VERIFIED_LEVEL
} from "./types";
import { assign, map, omit, range, sumBy } from "lodash-es";
import type {
  MockClientCustomField,
  MockCustomFieldValue,
  MockCreditNote,
  MockCustomField,
  MockDataset,
  MockDocumentPayment,
  MockEmailTopic,
  MockInvoice,
  MockInvoiceCategory,
  MockInvoiceLine,
  MockMigrationOption,
  MockMoney,
  MockProduct,
  MockProductLineItem,
  MockProvisioning,
  MockNotificationPreference,
  MockScheduledAction,
  MockAffiliateReferral,
  MockVaultAsset
} from "./types";

/**
 * The topics a SINGLE address may be subscribed to — legacy's per-address
 * opt-in list, which offers only the topics a client may opt out of at all.
 */
const EMAIL_TOPICS: readonly MockEmailTopic[] = [
  {
    id: "topic-renewals",
    label: "Renewal reminders",
    description:
      "A note before anything renews, so nothing charges by surprise."
  },
  {
    id: "topic-offers",
    label: "Offers and product news",
    description:
      "New products, and the occasional discount on the ones you have."
  },
  {
    id: "topic-maintenance",
    label: "Planned maintenance",
    description: "When we are working on the platform your products run on."
  }
];

/**
 * Legacy's notification preferences: one row per topic, one column per
 * channel, the mandatory rows locked (`contracts/user-notifications.ts`). The
 * brand publishes the topics, so they are DATA here rather than a hand-drawn
 * table in a config.
 */
const NOTIFICATION_PREFERENCES: readonly MockNotificationPreference[] = [
  {
    topic: "topic-billing",
    label: "Invoices and receipts",
    mandatory: true,
    channels: {
      [NotificationChannelCodes.EMAIL]: true,
      [NotificationChannelCodes.IN_APP]: true
    }
  },
  {
    topic: "topic-security",
    label: "Security alerts",
    mandatory: true,
    channels: {
      [NotificationChannelCodes.EMAIL]: true,
      [NotificationChannelCodes.IN_APP]: false
    }
  },
  {
    topic: "topic-renewals",
    label: "Renewal reminders",
    mandatory: false,
    channels: {
      [NotificationChannelCodes.EMAIL]: true,
      [NotificationChannelCodes.IN_APP]: true
    }
  },
  {
    topic: "topic-support",
    label: "Ticket replies",
    mandatory: false,
    channels: {
      [NotificationChannelCodes.EMAIL]: false,
      [NotificationChannelCodes.IN_APP]: true
    }
  },
  {
    topic: "topic-offers",
    label: "Offers and product news",
    mandatory: false,
    channels: {
      [NotificationChannelCodes.EMAIL]: false,
      [NotificationChannelCodes.IN_APP]: false
    }
  }
];

/**
 * What a client paying by transfer still has to do — legacy's payment
 * instructions, published by the gateway per transaction and read in their
 * own dialog.
 */
const BANK_TRANSFER_INSTRUCTIONS = [
  "Send **£8.00** to the account below, quoting **INV-0093** as the reference.",
  "",
  "- Account name: Host·Grid Ltd",
  "- Sort code: 04-00-75",
  "- Account number: 82914417",
  "",
  "Payments clear in one to two working days. This invoice settles itself once yours arrives."
].join("\n");

/**
 * The AUTHORED half of a seeded invoice: what a person decides. The rest of
 * the document — its tax split, what has landed against it, its share token —
 * is worked out from these by `seedInvoice`, so a hand-authored total and its
 * own subtotal can never disagree.
 */
type SeedInvoiceCore = {
  readonly id: string;
  readonly number: string;
  readonly issuedDate: string;
  readonly dueDate: string;
  readonly total: MockMoney;
  readonly status: InvoiceStatus;
  readonly datePaid?: string;
  readonly dateCancelled?: string;
  /** A quote rather than a demand — legacy's proforma flag, as the seed says it. */
  readonly proforma?: boolean;
  /** The payment is still with the gateway — the document's pending-payment message. */
  readonly paymentPending?: boolean;
  /**
   * Settled through the brand's OFFLINE method, which has not arrived yet —
   * legacy's `pending_payment_method` (`invoiceProvider.vue:91-95`). The
   * payments panel and the Pay controls come off the page while it holds.
   */
  readonly clearing?: boolean;
  /** The stored card this document names — absent is "No payment method selected". */
  readonly paymentDetailId?: string;
  /**
   * Part of the total already taken — legacy's partly-paid document, which is
   * what puts an order into its own `order_partly_paid` state. Absent leaves
   * the settlement to the status.
   */
  readonly paidPart?: MockMoney;
  /**
   * What the client still has to DO for that payment to land, as markdown —
   * legacy's awaiting-client gateways published one per transaction, and the
   * message's own control is what opens it.
   */
  readonly paymentInstructions?: string;
  /** Taken off the lines before tax; absent reads as none (`MockInvoice.discount`). */
  readonly discount?: MockMoney;
  readonly fraudStatus?: FraudStatus;
  readonly orderId?: string;
  /** The product this document bills for — the product billing area's own ledger. */
  readonly productId?: string;
  readonly lines?: readonly MockInvoiceLine[];
  /** When the money went back — the refunded document's own date. */
  readonly dateRefunded?: string;
  /** Why the brand cancelled it, where it recorded a reason. */
  readonly statusReason?: string;
  /** Standing behind an unpaid pro-rata change — legacy's `to_be_credited`. */
  readonly toBeCredited?: boolean;
  /** The public link is live, and what it permits. */
  readonly isShared?: boolean;
  readonly shareAllowsDownload?: boolean;
  readonly shareAllowsPayment?: boolean;
  /** Reached this client through a delegation — the delegated-document notice. */
  readonly isDelegated?: boolean;
  /** Whose document it is, where it is not the signed-in account's. */
  readonly ownerName?: string;
  /** The labelled facts printed under it — client fields, its own, the brand's meta. */
  readonly clientFields?: readonly MockCustomField[];
  readonly customFields?: readonly MockCustomField[];
  readonly metaData?: readonly MockCustomField[];
};

/**
 * What a PARTLY paid document has taken and still owes. The status alone
 * cannot say it — an unpaid document owes its whole total — so a seed that
 * names the part taken overrides the status-derived pair, and the payment row
 * beside it records what landed.
 */
function partSettlement(
  core: SeedInvoiceCore,
  total: MockMoney,
  settled: { paidAmount: MockMoney; unpaidAmount: MockMoney }
): { paidAmount: MockMoney; unpaidAmount: MockMoney } {
  if (core.paidPart === undefined) return settled;
  return {
    paidAmount: core.paidPart,
    unpaidAmount: money(total.amount - core.paidPart.amount, total.currency)
  };
}

/**
 * What the document comes to. A seed that itemises the document is telling us
 * what it is FOR, so the total follows the lines rather than standing beside
 * them: a hand-authored figure and a hand-authored list drift the moment one
 * of them is edited. A document with no lines keeps the figure it was given.
 */
function seedTotal(core: SeedInvoiceCore): MockMoney {
  if (core.lines === undefined) return core.total;
  return money(
    sumBy(core.lines, line => line.amount.amount),
    core.total.currency
  );
}

function seedInvoice(core: SeedInvoiceCore): MockInvoice {
  const total = seedTotal(core);
  const { subtotal, taxes } = grossBreakdown(total);
  // `subtotal` is what the LINES came to, so a discounted document's lines
  // stand above the net the tax was charged on: subtotal - discount = net.
  const lineTotal = money(
    subtotal.amount + (core.discount?.amount ?? 0),
    subtotal.currency
  );
  const settled = settlement(total, core.status);
  const { paidAmount, unpaidAmount } = partSettlement(core, total, settled);
  let category: MockInvoiceCategory = MOCK_INVOICE_CATEGORY.INVOICE;
  if (core.proforma === true) category = MOCK_INVOICE_CATEGORY.PROFORMA;
  let payments: MockDocumentPayment[] = [];
  if (core.datePaid !== undefined) {
    payments = [seedPayment("pay-1", core.datePaid, total)];
  }
  if (core.paidPart !== undefined) {
    payments = [seedPayment("pay-1", core.issuedDate, core.paidPart)];
  }
  if (core.clearing === true) {
    payments = [
      assign(
        seedPayment(
          "pay-1",
          core.issuedDate,
          total,
          MOCK_PAYMENT_STATUS.PENDING
        ),
        { gatewayType: GatewayTypes.OFFLINE }
      )
    ];
  }
  if (core.paymentPending === true) {
    payments = [
      assign(
        seedPayment(
          "pay-1",
          core.issuedDate,
          total,
          MOCK_PAYMENT_STATUS.PENDING
        ),
        { instructions: core.paymentInstructions }
      )
    ];
  }
  return {
    id: core.id,
    number: core.number,
    issuedDate: core.issuedDate,
    dueDate: core.dueDate,
    subtotal: lineTotal,
    discount: core.discount,
    taxes,
    total: total,
    paidAmount,
    unpaidAmount,
    payments,
    address: SEED_BILLING_PARTY,
    status: core.status,
    datePaid: core.datePaid,
    dateCancelled: core.dateCancelled,
    category,
    shareToken: shareTokenFor(core.id),
    fraudStatus: core.fraudStatus,
    orderId: core.orderId,
    productId: core.productId,
    lines: core.lines,
    paymentDetailId: core.paymentDetailId,
    dateRefunded: core.dateRefunded,
    statusReason: core.statusReason,
    toBeCredited: core.toBeCredited,
    isDelegated: core.isDelegated,
    ownerName: core.ownerName,
    clientFields: core.clientFields,
    customFields: core.customFields,
    metaData: core.metaData,
    isShared: core.isShared,
    shareAllowsDownload: core.shareAllowsDownload,
    shareAllowsPayment: core.shareAllowsPayment
  };
}

/** The authored half of a seeded credit note; `seedCreditNote` fills the rest. */
type SeedCreditNoteCore = {
  readonly id: string;
  readonly number: string;
  readonly issuedDate: string;
  readonly total: MockMoney;
  readonly status: CreditNoteStatus;
  readonly invoiceNumber: string;
  readonly invoiceId: string;
  /** The product this credit was raised against — the product's own ledger. */
  readonly productId?: string;
  readonly lines: readonly MockInvoiceLine[];
  /** Reached this client through a delegation — the document says whose it is. */
  readonly isDelegated?: boolean;
};

function seedCreditNote(core: SeedCreditNoteCore): MockCreditNote {
  // A credit already applied to an invoice has been sent back; one still
  // sitting on the account has not, so it carries no refund row.
  let refunds: MockDocumentPayment[] = [];
  if (core.status === CreditNoteStatus.ALLOCATED) {
    refunds = [seedPayment("ref-1", core.issuedDate, core.total)];
  }
  return {
    id: core.id,
    number: core.number,
    issuedDate: core.issuedDate,
    total: core.total,
    status: core.status,
    isDelegated: core.isDelegated,
    invoiceNumber: core.invoiceNumber,
    invoiceId: core.invoiceId,
    productId: core.productId,
    lines: core.lines,
    refunds,
    address: SEED_BILLING_PARTY
  };
}

/** How this brand's prices are quoted — the note under a product's price. */
const SEED_TAX_LABEL = "inc. VAT";

/** Two pages and a little over — the thread the Show-more control exists for. */
const LONG_THREAD_MESSAGES = 22;

/** The day of the month this brand's rule would fall on, were it monthly rather than weekly. */
const HOSTGRID_CONSOLIDATION_DATE = 1;

/** The product whose own billing ledgers the seed fills — the provisioning showcase. */
const SEED_LEDGER_PRODUCT_ID = "prod-analytics";

/** The authored half of a vault row; the rest is the wire's own bookkeeping. */
type SeedVaultCore = {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  /** A SECRET rather than a note — absent reads as a note. */
  readonly encrypted?: boolean;
  readonly created_at: string;
  /** Scoped to one product; absent is account-wide. */
  readonly contractProductId?: string;
  /** Kept at the top of its panel — legacy's pin. */
  readonly pinned?: boolean;
  /** Who wrote it; absent leaves the row without an author line. */
  readonly authorName?: string;
  /** Who last changed it, and when — absent means nobody has since. */
  readonly editorName?: string;
  readonly updated_at?: string;
};

function seedVaultAsset(core: SeedVaultCore): MockVaultAsset {
  return {
    id: core.id,
    label: core.label,
    note: core.note,
    encrypted: core.encrypted === true,
    client_id: SEED_CLIENT_ID,
    contract_product_id: core.contractProductId ?? null,
    created_at: core.created_at,
    updated_at: core.updated_at ?? core.created_at,
    pinned: core.pinned,
    authorName: core.authorName,
    editorName: core.editorName
  };
}

/** The authored half of a brand question; the rest is the wire's own bookkeeping. */
type SeedCustomFieldCore = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly order: number;
  readonly isRequired: boolean;
  /** The client's answer — the wire carries it on the definition. */
  readonly value: MockCustomFieldValue;
  /** Absent reads as free text. */
  readonly typeId?: CustomFieldsTypes;
  readonly typeCode?: string;
  readonly options?: readonly { label: string; value: string }[];
  /** Asked on the way IN as well as on the profile — legacy's `show_on_order_form` filter. */
  readonly showOnOrderForm?: boolean;
};

function customFieldSeed(core: SeedCustomFieldCore): MockClientCustomField {
  const showOnOrderForm = core.showOnOrderForm ?? false;
  return {
    id: core.id,
    code: core.code,
    name: core.name,
    type: core.typeCode ?? "text",
    typeId: core.typeId ?? CustomFieldsTypes.TEXT,
    options: [...(core.options ?? [])],
    order: core.order,
    value: core.value,
    meta: {
      isRequired: core.isRequired,
      isReadOnly: false,
      isDisabled: false,
      isHidden: false,
      isUserOnly: false,
      isEditable: true,
      showOnOrderForm,
      showOnInvoice: false,
      displayContexts: { invoice: false, order_form: showOnOrderForm }
    }
  };
}

/** A product with no provider surface at all — most of them. */
const NO_PROVISIONING: MockProvisioning = {
  fields: [],
  functions: [],
  iframes: []
};

/** What the analytics add-on may be moved onto — one step down, one across, one up. */
const ANALYTICS_MIGRATIONS: readonly MockMigrationOption[] = [
  {
    id: "cat-analytics-lite",
    name: "Analytics Lite",
    category: "Subscription",
    price: money(6),
    billingTerm: MOCK_BILLING_TERM.MONTHLY,
    shortDescription: "The essentials, at half the price.",
    description:
      "**Analytics Lite** keeps the dashboards and the weekly digest.\n\nRetention drops from twelve months to three, and the export API is not included. Everything already collected stays where it is."
  },
  {
    id: "cat-analytics-annual",
    name: "Analytics Add-on (annual)",
    category: "Subscription",
    price: money(120),
    billingTerm: MOCK_BILLING_TERM.ANNUALLY,
    shortDescription: "The same add-on, paid once a year.",
    description:
      "**Analytics Add-on (annual)** is the add-on you already have, billed twelve months at a time.\n\nNothing about the service changes; the saving is in the term."
  },
  {
    id: "cat-analytics-pro",
    name: "Analytics Pro",
    category: "Subscription",
    price: money(29),
    billingTerm: MOCK_BILLING_TERM.MONTHLY,
    shortDescription: "Everything, plus the export API.",
    description:
      "**Analytics Pro** adds the export API, twenty-four months of retention and custom dashboards.\n\nYour existing dashboards move across untouched."
  },
  // Listed LAST and quoted CHEAPEST per month (£48 over twelve months is
  // £4.00), so the picker's order is observable: a brand quoting monthly
  // puts this one first, and one quoting each cycle leaves it here.
  {
    id: "cat-analytics-team",
    name: "Analytics Team (annual)",
    category: "Subscription",
    price: money(48),
    billingTerm: MOCK_BILLING_TERM.ANNUALLY,
    shortDescription: "The whole team, billed annually.",
    description:
      "**Analytics Team (annual)** covers every seat on the account rather than one, billed twelve months at a time.\n\nIt carries Pro's retention and the export API."
  }
];

/** The mailbox pack's own two steps — the product that carries the DISABLED picker branch. */
const MAILBOX_MIGRATIONS: readonly MockMigrationOption[] = [
  {
    id: "cat-mailbox-lite",
    name: "Mailbox Lite",
    category: "Subscription",
    price: money(3),
    billingTerm: MOCK_BILLING_TERM.MONTHLY,
    shortDescription: "Three mailboxes instead of ten.",
    description:
      "**Mailbox Lite** keeps three mailboxes on your own domain, with webmail and IMAP.\n\nMail already delivered stays; you choose which three addresses continue."
  },
  {
    id: "cat-mailbox-pro",
    name: "Mailbox Pro",
    category: "Subscription",
    price: money(14),
    billingTerm: MOCK_BILLING_TERM.MONTHLY,
    shortDescription: "Fifty mailboxes, with archiving.",
    description:
      "**Mailbox Pro** raises the limit to fifty mailboxes and adds seven years of archiving.\n\nExisting mailboxes are unaffected."
  }
];

/** The automation standing against the analytics add-on — one of each outcome the timeline words. */
const ANALYTICS_SCHEDULED_ACTIONS: readonly MockScheduledAction[] = [
  {
    id: "sa-1",
    type: ScheduledActionTypes.PRICE_CHANGE,
    label: "Price rises to £14.00 a month",
    scheduledAt: "2026-10-05",
    status: ScheduledActionStatusTypes.STATUS_SCHEDULED
  },
  {
    id: "sa-2",
    type: ScheduledActionTypes.INTERVAL_CHANGE,
    label: "Billing moves to annually",
    scheduledAt: "2026-09-05",
    status: ScheduledActionStatusTypes.STATUS_SCHEDULED
  },
  {
    id: "sa-3",
    type: ScheduledActionTypes.MANUAL_RENEW,
    label: "Renewal invoice raised manually",
    scheduledAt: "2026-08-05",
    status: ScheduledActionStatusTypes.STATUS_EXECUTED
  },
  {
    id: "sa-4",
    type: ScheduledActionTypes.PRICE_CHANGE,
    label: "Retention discount applied",
    scheduledAt: "2026-07-05",
    status: ScheduledActionStatusTypes.STATUS_CANCELLED
  }
];

/** What a renewal buys, per billing cycle — the summary's own words. */
const RENEWAL_TERM_BY_BILLING_TERM: Readonly<Record<string, string>> = {
  [MOCK_BILLING_TERM.MONTHLY]: MOCK_RENEWAL_TERM.MONTHLY,
  [MOCK_BILLING_TERM.ANNUALLY]: MOCK_RENEWAL_TERM.ANNUALLY
};

/**
 * The AUTHORED half of a seeded product: what a person decides. The contract
 * it runs under, the wire's own name for the day it was bought, whether it
 * renews and what it bills for all follow from those, so a plain product
 * still satisfies the model without repeating them. The lifecycle facts a
 * client's own pages gate on follow the same rule: a product the brand lets
 * be changed, whose renewal may be turned off, with nothing pro-rata pending
 * and no automation standing against it, is the ORDINARY product.
 */
type SeedProductCore = Omit<
  MockProduct,
  | "contractId"
  | "purchasedAt"
  | "autoRenew"
  | "lineItems"
  | "provisioning"
  | "canModify"
  | "canDisableAutoRenew"
  | "pendingProRata"
  | "migrationOptions"
  | "scheduledActions"
  | "invoiceConsolidation"
> & {
  readonly autoRenew?: boolean;
  readonly lineItems?: readonly MockProductLineItem[];
  readonly provisioning?: MockProvisioning;
  readonly canModify?: boolean;
  readonly canDisableAutoRenew?: boolean;
  readonly pendingProRata?: boolean;
  readonly migrationOptions?: readonly MockMigrationOption[];
  readonly scheduledActions?: readonly MockScheduledAction[];
  readonly invoiceConsolidation?: InvoiceConsolidationTypes;
};

/** A product billing one thing charges one line for it; a free one charges none. */
function seedProductLines(
  core: SeedProductCore
): readonly MockProductLineItem[] {
  if (core.price === undefined) return [];
  return [{ id: "li-base", description: core.name, amount: core.price }];
}

function seedProduct(core: SeedProductCore): MockProduct {
  // A subscription renews itself unless the seed says otherwise; a one-time
  // purchase has nothing to renew.
  let autoRenew = core.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION;
  if (core.autoRenew !== undefined) autoRenew = core.autoRenew;
  let renewalTerm = core.renewalTerm;
  if (renewalTerm === undefined && core.billingTerm !== undefined) {
    renewalTerm = RENEWAL_TERM_BY_BILLING_TERM[core.billingTerm];
  }
  return assign(
    omit(core, [
      "autoRenew",
      "lineItems",
      "provisioning",
      "canModify",
      "canDisableAutoRenew",
      "pendingProRata",
      "migrationOptions",
      "scheduledActions",
      "invoiceConsolidation"
    ]),
    {
      contractId: `ctr-${core.id}`,
      purchasedAt: core.createdAt,
      renewalTerm,
      autoRenew,
      lineItems: core.lineItems ?? seedProductLines(core),
      provisioning: core.provisioning ?? NO_PROVISIONING,
      canModify: core.canModify ?? true,
      canDisableAutoRenew: core.canDisableAutoRenew ?? true,
      pendingProRata: core.pendingProRata ?? false,
      migrationOptions: core.migrationOptions ?? [],
      scheduledActions: core.scheduledActions ?? [],
      invoiceConsolidation:
        core.invoiceConsolidation ?? InvoiceConsolidationTypes.INHERIT
    }
  );
}

/**
 * The hand-authored rows — the ones the dashboards, the needs-attention line
 * and the tests read by id. `HOSTGRID_MOCK_DATASET` below pads every list
 * behind them to three pages (`hostgrid.filler.ts`).
 */
const HOSTGRID_HERO_DATASET: MockDataset = {
  persona: {
    id: SEED_CLIENT_ID,
    name: "Jonah Reyes",
    email: "jonah@fieldnotes.app",
    company: "Fieldnotes",
    firstName: "Jonah",
    lastName: "Reyes",
    publicName: "Fieldnotes",
    language: "en",
    username: "jonah@fieldnotes.app",
    // The one password the logged-out login screen accepts; anything else is
    // the INVALID_CREDENTIALS refusal (plan F11).
    password: "hostgrid",
    avatarSrc: "https://i.pravatar.cc/160?u=jonah-reyes",
    lastLoginAt: "2026-08-27T08:41:00Z",
    clientSince: "2024-11-06",
    tags: ["Priority support", "Reseller"],
    supportPin: "4821",
    // TWO accounts, so the switcher has something to switch BETWEEN; the
    // minimal dataset keeps one, which is what takes the control away.
    accounts: [
      { id: SEED_CLIENT_ID, name: "Jonah Reyes", brandName: "Host·Grid" },
      { id: "acc-kestrel", name: "Kestrel Works", brandName: "Host·Grid" }
    ],
    activeAccountId: SEED_CLIENT_ID
  },
  // Who the brand IS on the documents it raises — the party block opposite
  // the client's on every invoice and credit note.
  brand: {
    name: "Host·Grid",
    company: "Host·Grid Limited",
    taxNumber: "GB 883 4021 55",
    registrationNumber: "09221847",
    lines: [
      "Sixth Floor, Ludgate House",
      "107 Fleet Street",
      "London EC4A 2AB",
      "United Kingdom"
    ]
  },
  features: {
    CLIENT_NOTES_AND_SECRETS_ENABLED: true,
    SUPPORT_PIN_ENABLED: true,
    DISABLE_SUPPORT_SYSTEM: false,
    DEFAULT_CLIENT_HOMEPAGE: "/",
    UPMIND_BRANDING_ENABLED: true,
    UPMIND_AFFILIATES_ENABLED: true,
    UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED: true,
    showStore: true,
    hideOneTimePurchases: false,
    REQUIRE_REGION_IN_ADDRESS: true,
    CLIENT_ALLOW_ADDRESS_UPDATE: true,
    BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED: true,
    // The brand leaves automatic settlement to the client, and keeps their
    // last card: the two card gates on opposite branches to the minimal seed.
    BILLING_GATEWAY_FORCE_AUTO_PAYMENT: false,
    // The client decides whether a card is kept; the minimal brand keeps it
    // whatever they say, which is the other branch of legacy's own gate.
    BILLING_GATEWAY_FORCE_CARD_STORAGE: false,
    PREVENT_CARD_REMOVAL_IF_LAST: true,
    CLIENT_TICKET_SCHEDULING_ENABLED: true,
    AFFILIATES_WITHDRAW_REQUEST: true,
    INVOICE_CONSOLIDATION_ENABLED: true,
    INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF: false,
    // What a client following the brand is following: the WEEKLY rule, so
    // the day of the week is the one of the two day settings that reads.
    INVOICE_CONSOLIDATION_BASE_RULE: InvoiceConsolidationRuleTypes.DAY_OF_WEEK,
    INVOICE_CONSOLIDATION_WEEK_DAY: CONSOLIDATION_WEEKDAY.MONDAY,
    INVOICE_CONSOLIDATION_DATE: HOSTGRID_CONSOLIDATION_DATE,
    // Prices are quoted as the lowest MONTHLY figure a term works out to,
    // which is what an annual option reads as beside a monthly one. `abs_min`
    // is the spelling legacy's own picker read (`migrationsListModal.vue`).
    PRICE_DISPLAY_TYPE: PriceDisplayTypes.MONTHLY_FROM,
    SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION: true,
    // The brand takes part of what is owed, checks tax numbers with the
    // registry, lends its appearance to the accounts it manages, and sends a
    // reply on Enter — all four on the minimal seed's other branch.
    PARTIAL_PAYMENTS_ENABLED: true,
    TAX_NUMBER_VALIDATION_ENABLED: true,
    UI_PARENT_BRANDING_ENABLED: true,
    UI_ENTER_KEY_ACTION: MOCK_ENTER_KEY_ACTION.SUBMIT,
    // The brand publishes its own site behind the header mark, so the logo
    // LEAVES the portal (`clientHeader.vue:36-42`). Minimal leaves it unset,
    // where the mark stays the link home.
    UI_LOGO_URL: "https://hostgrid.example",
    // Where a new referral link points before the client changes it. Every
    // redirect has to sit on this brand's own domain, so the default is one
    // (`addEditAffiliateLinkModal.vue:16-27`). Minimal leaves it unset.
    AFFILIATES_DEFAULT_REDIRECT_LINK: "https://hostgrid.example/pricing",
    walletTopUpEnabled: true,
    CLIENT_REGISTRATION_ENABLED: true,
    REQUIRE_PHONE_ON_REGISTRATION: true,
    UI_WHITELABEL_LOGIN: false,
    registrationPasswordRequired: true,
    recaptchaEnabled: true,
    isUpmindOrgContext: true,
    termsUrl: "https://hostgrid.example/terms"
  },
  security: {
    passwordChangedAt: "2026-08-01",
    twoFactorEnabled: false,
    // Base32, as an authenticator app reads it — the one fact the enrolment
    // dialog states, since the mock ships no QR image.
    twoFactorSecret: "JBSWY3DPEHPK3PXP"
  },
  // Notes and secrets, in the wire's own spelling: `encrypted` splits the two
  // panels, `contract_product_id` scopes a row to one product (null is
  // account-wide). Two of each, either side of both axes.
  vault: map<SeedVaultCore, MockVaultAsset>(
    [
      {
        // Pinned, and edited since it was written — the ON branch of both the
        // pin order and legacy's editor half of the author line.
        id: "v1",
        label: "Office door code",
        note: "2244#",
        encrypted: true,
        created_at: "2026-07-04",
        updated_at: "2026-08-21",
        pinned: true,
        authorName: "Jonah Reyes",
        editorName: "Mara Ellis"
      },
      {
        // Written and never touched since — the author-only branch of the line.
        id: "v2",
        label: "Registrar account email",
        note: "ops@fieldnotes.app",
        created_at: "2026-07-11",
        authorName: "Jonah Reyes"
      },
      {
        id: "v3",
        label: "Guest Wi-Fi password",
        note: "fieldnotes-guest",
        encrypted: true,
        created_at: "2026-07-18"
      },
      {
        // A product row pinned to the top of ITS panel, so the order holds on
        // both scopes rather than only on the account's.
        id: "v4",
        label: "Renewal reminder",
        note: "Ask about the two-year rate before this renews.",
        created_at: "2026-08-02",
        contractProductId: "prod-analytics",
        pinned: true,
        authorName: "Jonah Reyes"
      },
      {
        id: "v5",
        label: "Control panel recovery key",
        note: "XR-2291-KESTREL",
        encrypted: true,
        created_at: "2026-08-09",
        contractProductId: "prod-analytics"
      },
      {
        id: "v6",
        label: "Warehouse alarm code",
        note: "7761#",
        encrypted: true,
        created_at: "2026-08-15"
      }
    ],
    seedVaultAsset
  ),
  // The contact data, in the REAL scoped modules' own row models (plan R1 (a)):
  // `useClientEmails`, `useClientPhones`, `useClientAddresses` and
  // `useClientCompanies` each hand over exactly these, so the go-real swap
  // changes the source and nothing else. Two of each, either side of every
  // tag the profile page renders.
  emails: [
    {
      id: "eml-addr-1",
      email: "jonah@fieldnotes.app",
      title: "jonah@fieldnotes.app",
      description: "Account",
      type: MOCK_EMAIL_TYPE.ACCOUNT,
      topicOptIns: ["topic-renewals", "topic-offers"],
      meta: {
        isDefault: true,
        canDelete: false,
        // Not confirmed yet: legacy offered "Enter verification code" on the
        // address the account signs in with, and only while it stood here.
        isVerified: false,
        isBounced: false
      }
    },
    {
      id: "eml-addr-2",
      email: "billing@fieldnotes.app",
      title: "billing@fieldnotes.app",
      description: "Account",
      type: MOCK_EMAIL_TYPE.ACCOUNT,
      topicOptIns: ["topic-renewals"],
      bouncedAt: { date: "12 Aug 2026", relative: "2 weeks ago" },
      meta: {
        isDefault: false,
        canDelete: true,
        isVerified: true,
        isBounced: true
      }
    },
    {
      id: "eml-addr-3",
      email: "ops@fieldnotes.app",
      title: "ops@fieldnotes.app",
      description: "Account",
      type: MOCK_EMAIL_TYPE.ACCOUNT,
      // Subscribed to nothing, which is what makes the row read as
      // receiving nothing — that answer is derived, never stored beside it.
      topicOptIns: [],
      meta: {
        isDefault: false,
        canDelete: true,
        isVerified: false,
        isBounced: false
      }
    }
  ],
  phones: [
    {
      id: "tel-1",
      title: "+44 7700 900412",
      description: "Mobile",
      phone: {
        number: "+447700900412",
        nationalNumber: "07700 900412",
        countryCallingCode: "44",
        country: "GB"
      },
      type: MOCK_PHONE_TYPE.MOBILE,
      meta: { canDelete: false, isVerified: true, isDefault: true }
    },
    {
      id: "tel-2",
      title: "+44 20 7946 0918",
      description: "Office",
      phone: {
        number: "+442079460918",
        nationalNumber: "020 7946 0918",
        countryCallingCode: "44",
        country: "GB"
      },
      type: MOCK_PHONE_TYPE.OFFICE,
      meta: { canDelete: true, isVerified: false, isDefault: false }
    }
  ],
  // The addresses this client is invoiced at (`contracts/client-address` is
  // real); adding and editing one stay form-phase work.
  addresses: [
    {
      id: "addr-hq",
      clientId: SEED_CLIENT_ID,
      name: "Head office",
      title: "Head office",
      description: "Unit 4, Kestrel Works, London EC1V 4AB",
      countryName: "United Kingdom",
      type: MOCK_ADDRESS_TYPE.OFFICE,
      verifiedLevel: MOCK_VERIFIED_LEVEL.VERIFIED,
      address: {
        address1: "Unit 4, Kestrel Works",
        address2: "18 Provost Street",
        city: "London",
        countryId: "GB",
        postcode: "EC1V 4AB"
      },
      meta: { canDelete: false, isDefault: true, isVerified: true }
    },
    {
      id: "addr-studio",
      clientId: SEED_CLIENT_ID,
      name: "Studio",
      title: "Studio",
      description: "2 Ferry Lane, Bristol BS1 6TL",
      countryName: "United Kingdom",
      type: MOCK_ADDRESS_TYPE.HOME,
      verifiedLevel: MOCK_VERIFIED_LEVEL.NONE,
      address: {
        address1: "2 Ferry Lane",
        city: "Bristol",
        countryId: "GB",
        postcode: "BS1 6TL"
      },
      meta: { canDelete: true, isDefault: false, isVerified: false }
    }
  ],
  // One company whose tax number the registry recognises and one whose it
  // does not — the two branches the Validate control answers with.
  // One link that still works and one already spent — the accepted and the
  // expired readings of legacy's own `acceptInviteModal`.
  delegateInvites: [
    {
      hash: "inv-9f3a2c",
      objectType: DelegateObjectTypes.CONTRACT_PRODUCT,
      objectId: "prod-analytics",
      objectName: "Analytics Add-on"
    },
    {
      hash: "inv-1b7e40",
      objectType: DelegateObjectTypes.CLIENT,
      productCount: 3,
      isExpired: true
    }
  ],
  companies: [
    {
      id: "co-fieldnotes",
      emailId: "eml-addr-1",
      phoneId: "tel-1",
      addressId: "addr-hq",
      title: "Fieldnotes Ltd",
      description: "Unit 4, Kestrel Works, London EC1V 4AB",
      name: "Fieldnotes Ltd",
      default: true,
      regNumber: "11480921",
      tax: {
        valid: 1,
        percent: "20",
        number: "GB 412 8890 24",
        reason: null,
        checked: { date: "2026-06-02", relative: "3 months ago" },
        with: "VIES"
      },
      meta: {
        isDefault: true,
        canDelete: false,
        isVerified: true,
        hasTax: true,
        hasTaxValidation: true,
        hasValidTax: true
      }
    },
    {
      id: "co-kestrel",
      emailId: "eml-addr-2",
      phoneId: "tel-2",
      addressId: "addr-studio",
      title: "Kestrel Studio",
      description: "2 Ferry Lane, Bristol BS1 6TL",
      name: "Kestrel Studio",
      default: false,
      regNumber: "13002774",
      tax: {
        valid: 0,
        percent: null,
        number: "GB 000 0000 00",
        reason: "The number is not registered.",
        checked: { date: "2026-07-19", relative: "6 weeks ago" },
        with: "VIES"
      },
      meta: {
        isDefault: false,
        canDelete: true,
        isVerified: false,
        hasTax: true,
        hasTaxValidation: true,
        hasValidTax: false
      }
    }
  ],
  // The brand's own questions, each carrying its answer — the REAL
  // `client-custom-fields` definition shape, so the inline form's schema is
  // parsed from these rather than from a second, form-only copy. One of each
  // arm the schema parser branches on: free text, a fixed choice, a tick box
  // and a number, so every type the save stores round-trips somewhere.
  customFields: [
    customFieldSeed({
      id: "cf-industry",
      code: "industry",
      name: "Industry",
      order: 1,
      isRequired: true,
      showOnOrderForm: true,
      value: "Software"
    }),
    customFieldSeed({
      id: "cf-referral",
      code: "referral_source",
      name: "How did you hear about us?",
      order: 2,
      isRequired: false,
      typeId: CustomFieldsTypes.SELECT,
      typeCode: "select",
      options: [
        { label: "A colleague", value: "A colleague" },
        { label: "A search engine", value: "A search engine" },
        { label: "An advert", value: "An advert" }
      ],
      value: "A colleague"
    }),
    customFieldSeed({
      id: "cf-po",
      code: "po_reference",
      name: "Purchase order reference",
      order: 3,
      isRequired: false,
      value: "PO-2026-114"
    }),
    customFieldSeed({
      id: "cf-newsletter",
      code: "newsletter_optin",
      name: "Send me product news",
      order: 4,
      isRequired: false,
      typeCode: "checkbox",
      showOnOrderForm: true,
      value: true
    }),
    customFieldSeed({
      id: "cf-seats",
      code: "seat_count",
      name: "How many people use your account?",
      order: 5,
      isRequired: false,
      typeId: CustomFieldsTypes.NUMBER,
      typeCode: "number",
      value: 12
    })
  ],
  // Two addresses this account may sign in from — legacy's whitelist. Adding
  // one is a form (gap doc tier B); removing one is not.
  ipWhitelist: [
    {
      id: "ip-1",
      ip_address: "82.14.210.7",
      name: "London office",
      created_at: "2026-02-11T09:30:00Z",
      updated_at: "2026-02-11T09:30:00Z"
    },
    {
      id: "ip-2",
      ip_address: "51.140.88.19",
      name: "Bristol studio",
      created_at: "2026-05-03T16:12:00Z",
      updated_at: "2026-05-03T16:12:00Z"
    }
  ],
  // The preference matrix legacy's notifications page IS (the mock's list is
  // the header dropdown's). Read-only: the switches are a form.
  notificationPreferences: NOTIFICATION_PREFERENCES,
  emailTopics: EMAIL_TOPICS,
  // Enrolled and in good standing. The NOT-ENROLLED and DISABLED branches
  // render off the same page, gated on these two flags — the test layer
  // drives them on clones of this seed, since one dataset can only ever be on
  // one side of a flag.
  affiliate: {
    enrolled: true,
    disabled: false,
    since: "2025-09-18",
    referralLink: "https://hostgrid.example/r/jonah",
    balance: money(42),
    stats: {
      visits: 1284,
      referrals: 37,
      pendingBalance: money(18),
      availableBalance: money(42),
      withdrawnBalance: money(120)
    },
    links: [
      {
        id: "lnk-1",
        name: "Newsletter footer",
        url: "https://hostgrid.example/r/jonah",
        redirectUrl: "https://hostgrid.example/",
        clicks: 812,
        signups: 21,
        createdAt: "2025-09-18"
      },
      {
        id: "lnk-2",
        name: "Conference talk",
        url: "https://hostgrid.example/r/jonah-talk",
        redirectUrl: "https://hostgrid.example/pricing",
        clicks: 344,
        signups: 11,
        createdAt: "2026-02-04"
      },
      {
        id: "lnk-3",
        name: "Client handbook",
        url: "https://hostgrid.example/r/jonah-handbook",
        redirectUrl: "https://hostgrid.example/hosting",
        clicks: 128,
        signups: 5,
        createdAt: "2026-06-11"
      }
    ],
    // Anonymised, as legacy's table showed them: an affiliate is told that
    // somebody signed up, never who.
    referrals: [
      {
        id: "ref-1",
        client: "s***@studionorth.example",
        linkId: "lnk-1",
        date: "2026-08-10"
      },
      {
        id: "ref-2",
        client: "b***@atlaslabs.example",
        linkId: "lnk-2",
        date: "2026-08-02"
      },
      {
        id: "ref-3",
        client: "a***@harbormedia.example",
        linkId: "lnk-1",
        date: "2026-07-14"
      },
      {
        id: "ref-4",
        client: "h***@quill-labs.example",
        linkId: "lnk-3",
        date: "2026-06-20"
      }
    ],
    payoutDestination: {
      code: AffiliatePayoutDestinationCode.PAYPAL,
      detail: "jonah@fieldnotes.app"
    },
    commissions: [
      {
        id: "com-1",
        description: "Referral: studio-north signup",
        earnedAt: "2026-07-14",
        amount: money(30),
        status: MOCK_COMMISSION_STATUS.APPROVED,
        approvedAt: "2026-07-28"
      },
      {
        id: "com-2",
        description: "Referral: atlas-labs signup",
        earnedAt: "2026-08-02",
        amount: money(12),
        status: MOCK_COMMISSION_STATUS.PENDING_APPROVAL,
        payoutCalculatedAt: "2026-09-16"
      },
      {
        id: "com-3",
        description: "Referral: harbor-media signup",
        earnedAt: "2026-08-10",
        amount: money(30),
        status: MOCK_COMMISSION_STATUS.AWAITING_PAYMENT
      },
      {
        id: "com-4",
        description: "Referral: quill-labs signup",
        earnedAt: "2026-06-20",
        amount: money(12),
        // Rejected WITH a reason — legacy's second plural branch.
        status: MOCK_COMMISSION_STATUS.REJECTED,
        rejectedAt: "2026-07-01",
        rejectReason: "The referred account closed inside its first month."
      },
      {
        id: "com-5",
        description: "Referral: nordic-crafts signup",
        earnedAt: "2026-05-30",
        amount: money(30),
        status: MOCK_COMMISSION_STATUS.ON_HOLD
      },
      {
        // The sixth reading, and the only one with nothing to date: a
        // commission the brand called off before it was ever calculated.
        id: "com-6",
        description: "Referral: dockside-print signup",
        earnedAt: "2026-05-11",
        amount: money(9),
        status: MOCK_COMMISSION_STATUS.CANCELLED
      },
      {
        // Rejected with NO reason — legacy's first plural branch, which reads
        // "(no reason)" where the desk recorded none.
        id: "com-7",
        description: "Referral: fenwick-audio signup",
        earnedAt: "2026-04-22",
        amount: money(6),
        status: MOCK_COMMISSION_STATUS.REJECTED,
        rejectedAt: "2026-05-04"
      }
    ],
    payouts: [
      {
        id: "pay-1",
        requestedAt: "2026-06-30",
        paidAt: "2026-06-30",
        amount: money(25),
        destination: AffiliatePayoutDestinationCode.PAYPAL,
        status: MOCK_PAYOUT_STATUS.PAID
      },
      {
        id: "pay-2",
        requestedAt: "2026-05-31",
        paidAt: "2026-05-31",
        amount: money(40),
        destination: AffiliatePayoutDestinationCode.PAYPAL,
        status: MOCK_PAYOUT_STATUS.PAID
      },
      {
        id: "pay-3",
        // Asked for and not yet settled, so it carries no paid date at all.
        requestedAt: "2026-04-30",
        amount: money(18),
        destination: AffiliatePayoutDestinationCode.WALLET,
        status: MOCK_PAYOUT_STATUS.PENDING
      },
      {
        id: "pay-4",
        requestedAt: "2026-03-31",
        paidAt: "2026-03-31",
        amount: money(25),
        destination: AffiliatePayoutDestinationCode.PAYPAL,
        status: MOCK_PAYOUT_STATUS.FAILED,
        error:
          "PayPal rejected the transfer: the recipient account is unconfirmed."
      },
      {
        id: "pay-5",
        requestedAt: "2026-02-28",
        paidAt: "2026-02-28",
        amount: money(12),
        destination: AffiliatePayoutDestinationCode.OFFLINE,
        status: MOCK_PAYOUT_STATUS.PAID
      }
    ]
  },
  products: map<SeedProductCore, MockProduct>(
    [
      {
        id: "prod-team",
        groupSlug: "products",
        serviceIdentifier: "team.fieldnotes.app",
        createdAt: "2026-08-26",
        orderId: "ord-31",
        name: "Team Plan",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        // The one product awaiting setup — no due date until it goes live.
        status: ContractStatusCodes.AWAITING_ACTIVATION,
        // A trial that has not STARTED: the product is still awaiting its setup,
        // which is the reading legacy checked before the action at all.
        trialEndsAt: "2026-10-01",
        trialEndAction: MOCK_TRIAL_END_ACTION.CONTINUE,
        price: money(49),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        taxLabel: SEED_TAX_LABEL,
        tags: [MOCK_PRODUCT_TAG.SETUP_PENDING],
        description:
          "The **Team Plan** carries your whole workspace: shared projects, per-seat permissions and the audit trail.\n\nSetup takes a minute — tell us the hostname you want and we do the rest.",
        billingAddressId: "addr-hq",
        // The setup blueprint the client answers before it goes live — one
        // field per type the setup parser branches on, so text, a number, a
        // fixed choice and a tick box each round-trip through the form.
        provisioning: {
          fields: [
            {
              code: "hostname",
              label: "Hostname",
              value: "team.fieldnotes.app",
              type: BlueprintFieldsTypes.INPUT_TEXT,
              required: true
            },
            {
              code: "seats",
              label: "Seats",
              value: 10,
              type: BlueprintFieldsTypes.INPUT_NUMBER,
              required: true
            },
            {
              code: "region",
              label: "Data region",
              value: "eu-west",
              type: BlueprintFieldsTypes.SELECT,
              required: true,
              options: [
                { label: "Europe (London)", value: "eu-west" },
                { label: "United States (Virginia)", value: "us-east" },
                { label: "Australia (Sydney)", value: "ap-southeast" }
              ]
            },
            {
              code: "audit_trail",
              label: "Keep an audit trail",
              value: true,
              type: BlueprintFieldsTypes.CHECKBOX
            },
            {
              // The one field the provider left for the client to give — an
              // unanswered required field is what the needs-attention card
              // names (legacy's `cProdWithFieldsGridItem`).
              code: "admin_email",
              label: "Admin email",
              value: "",
              type: BlueprintFieldsTypes.INPUT_TEXT,
              required: true
            }
          ],
          functions: [],
          iframes: [],
          // Held while the account is under review — legacy's
          // `cProdPausedProvisionMsg`, which only ever showed on a product
          // still awaiting activation.
          paused: true
        }
      },
      {
        // The provisioning showcase: six config fields (one a secret), a
        // function per provider outcome — two of them featured, which is what
        // the sidebar's quick actions are — and two embedded panels.
        id: "prod-analytics",
        groupSlug: "products",
        serviceIdentifier: "analytics.fieldnotes.app",
        createdAt: "2026-08-23",
        orderId: "ord-31",
        name: "Analytics Add-on",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.ACTIVE,
        nextDueDate: "2026-09-05",
        price: money(12),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        taxLabel: SEED_TAX_LABEL,
        tags: ["Renews monthly", "Managed"],
        paymentDetailId: "pm-amex",
        billingAddressId: "addr-hq",
        customLabel: "Workspace analytics",
        // Bought in a promotion — legacy tagged the row with the code.
        promotionCodes: ["WELCOME20"],
        migrationOptions: ANALYTICS_MIGRATIONS,
        scheduledActions: ANALYTICS_SCHEDULED_ACTIONS,
        invoiceConsolidation: InvoiceConsolidationTypes.ENABLED,
        description:
          "Traffic, funnels and retention for every project in your workspace.\n\nData is kept for **13 months** and exports as CSV whenever you ask.",
        lineItems: [
          { id: "li-base", description: "Analytics Add-on", amount: money(9) },
          {
            id: "li-retention",
            description: "13-month retention",
            amount: money(3)
          }
        ],
        provisioning: {
          fields: [
            {
              code: "hostname",
              label: "Hostname",
              value: "analytics.fieldnotes.app"
            },
            { code: "ip_address", label: "IP address", value: "203.0.113.24" },
            {
              code: "username",
              label: "Control panel user",
              value: "fieldnotes"
            },
            {
              code: "password",
              label: "Control panel password",
              value: "n7-Kestrel-Loop",
              secret: true
            },
            {
              code: "nameservers",
              label: "Nameservers",
              value: "ns1.hostgrid.example, ns2.hostgrid.example"
            },
            { code: "disk", label: "Disk allowance", value: "50 GB" }
          ],
          functions: [
            {
              code: "login_panel",
              label: "Log in to the control panel",
              kind: ProvisionRequestActionTypes.REDIRECT,
              url: "https://panel.hostgrid.example/sso/analytics",
              highlighted: true
            },
            {
              code: "reset_password",
              label: "Reset the panel password",
              kind: ProvisionRequestActionTypes.FORM_POST,
              highlighted: true
            },
            {
              code: "refresh_details",
              label: "Refresh these details",
              kind: ProvisionRequestActionTypes.REFRESH_FIELDS
            },
            {
              code: "webmail",
              label: "Open webmail",
              kind: ProvisionRequestActionTypes.RENDER_IFRAME,
              url: "https://webmail.hostgrid.example/analytics"
            },
            {
              code: "usage_report",
              label: "Open the usage report",
              kind: ProvisionRequestActionTypes.REDIRECT,
              url: "https://panel.hostgrid.example/usage/analytics"
            }
          ],
          iframes: [
            {
              title: "Server status",
              url: "https://status.hostgrid.example/embed/analytics"
            },
            {
              title: "Traffic this month",
              url: "https://analytics.hostgrid.example/embed/traffic"
            }
          ],
          // Two provider calls came back unanswered — legacy's
          // `cProdUnresolvedProvisionRequestsMsg`.
          unresolvedRequests: 2
        }
      },
      {
        // On a free trial that simply RUNS OUT rather than renewing — the
        // end-trial branch, and the auto-expire banner beside it.
        id: "prod-seats",
        groupSlug: "products",
        serviceIdentifier: "seats.fieldnotes.app",
        createdAt: "2026-08-20",
        orderId: "ord-33",
        name: "Team Seats Pack",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.ACTIVE,
        nextDueDate: "2026-09-12",
        trialEndsAt: "2026-09-12",
        trialEndAction: MOCK_TRIAL_END_ACTION.MIGRATE,
        autoExpireAt: "2026-09-12",
        autoRenew: false,
        price: money(29),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        taxLabel: SEED_TAX_LABEL,
        tags: ["Free trial"],
        description: "Five extra seats, billed with the rest of your workspace."
      },
      {
        // Suspended, with the unpaid invoice that suspended it — the "View
        // invoices" branch of the condition banner. Also the one product
        // whose pro-rata change is still landing, so the migration picker's
        // REFUSED branch renders somewhere.
        id: "prod-mail",
        groupSlug: "products",
        serviceIdentifier: "mail.fieldnotes.app",
        createdAt: "2026-08-13",
        orderId: "ord-31",
        name: "Mailbox Pack",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.SUSPENDED,
        // The day the brand suspended it, which is not the day it was bought.
        suspendedAt: "2026-08-21",
        // Renewal off and the date GONE — the invoice this raises is late.
        autoRenew: false,
        nextDueDate: "2026-08-19",
        price: money(6),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        taxLabel: SEED_TAX_LABEL,
        tags: ["Payment overdue"],
        pendingProRata: true,
        migrationOptions: MAILBOX_MIGRATIONS,
        description: "Ten mailboxes on your own domain, with webmail and IMAP."
      },
      {
        // Bought but not yet paid for — the "Go to order" branch, and the one
        // product whose order is still owed.
        id: "prod-domains",
        groupSlug: "products",
        serviceIdentifier: "fieldnotes.app",
        createdAt: "2026-08-10",
        orderId: "ord-33",
        name: "Domain Registration",
        category: "One-time purchase",
        billingType: MOCK_BILLING_TYPE.ONE_TIME,
        status: ContractStatusCodes.PENDING,
        price: money(14),
        description: "One year of fieldnotes.app, renewable from here."
      },
      {
        // A SUBSCRIPTION that has not started — the branch the immediate
        // -cancellation warning is withheld on (legacy's `isHardCancellation
        // && !isPendingContract`): stopping a contract that never began takes
        // nothing away, so it is not warned about.
        id: "prod-vault",
        groupSlug: "products",
        serviceIdentifier: "vault.fieldnotes.app",
        createdAt: "2026-08-09",
        orderId: "ord-33",
        name: "Secrets Vault",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.PENDING,
        // The trial that simply stops when it ends.
        trialEndsAt: "2026-09-30",
        trialEndAction: MOCK_TRIAL_END_ACTION.CANCEL,
        price: money(11),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        taxLabel: SEED_TAX_LABEL,
        // Renewal OFF with the date still ahead — the "issue next invoice"
        // half of the pair `prod-mail` carries the late half of.
        autoRenew: false,
        nextDueDate: "2027-01-11",
        description: "Shared credentials for the team, encrypted at rest."
      },
      {
        // Still running, with a cancellation LODGED against it — legacy's
        // pending request, which the client may still call off. The brand
        // holds this one's renewal on, so the settings area's "why you cannot
        // turn it off" branch has a product too.
        id: "prod-archive",
        groupSlug: "products",
        serviceIdentifier: "archive.fieldnotes.app",
        createdAt: "2026-08-17",
        orderId: "ord-34",
        name: "Archive Storage",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.ACTIVE,
        cancellationRequest: {
          status:
            CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION,
          requestedAt: "2026-08-28",
          reason: "Moving the archive in-house",
          cancelAt: "2026-09-15"
        },
        // Reached this client through a delegation — the row says so.
        isDelegated: true,
        canDisableAutoRenew: false,
        nextDueDate: "2026-09-15",
        price: money(8),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        taxLabel: SEED_TAX_LABEL,
        // The price waiting on the next renewal invoice — legacy's
        // `cProdScheduledPriceChangeMsg`.
        scheduledPriceChange: { price: money(10), effectiveAt: "2026-09-15" }
      },
      {
        id: "prod-workshop",
        groupSlug: "products",
        serviceIdentifier: "workshop.fieldnotes.app",
        createdAt: "2026-08-14",
        orderId: "ord-35",
        name: "Team Workshop Day",
        category: "One-time purchase",
        billingType: MOCK_BILLING_TYPE.ONE_TIME,
        status: ContractStatusCodes.ACTIVE,
        price: money(450)
      },
      {
        id: "prod-onboarding",
        groupSlug: "products",
        serviceIdentifier: "onboarding.fieldnotes.app",
        createdAt: "2026-08-11",
        orderId: "ord-30",
        name: "Guided Onboarding",
        category: "One-time purchase",
        billingType: MOCK_BILLING_TYPE.ONE_TIME,
        status: ContractStatusCodes.ACTIVE,
        price: money(300)
      },
      {
        // The request the brand ACCEPTED, and the product it took with it —
        // the accepted-cancellation banner reports its dates and reason and
        // offers nothing to do about it.
        id: "prod-starter",
        groupSlug: "products",
        serviceIdentifier: "starter.fieldnotes.app",
        createdAt: "2026-08-08",
        orderId: "ord-31",
        name: "Starter Plan",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.CANCELLED,
        cancelledAt: "2026-08-19",
        cancellationRequest: {
          status: CancellationRequestStatusCodes.REQUEST_ACCEPTED,
          requestedAt: "2026-08-12",
          acceptedAt: "2026-08-15",
          reason: "Upgraded to the Team Plan",
          cancelAt: "2026-08-19"
        },
        autoRenew: false,
        price: money(15),
        billingTerm: MOCK_BILLING_TERM.MONTHLY
      },
      {
        id: "prod-solo",
        groupSlug: "products",
        serviceIdentifier: "solo.fieldnotes.app",
        createdAt: "2026-08-05",
        orderId: "ord-31",
        name: "Solo Plan",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.CANCELLED,
        cancelledAt: "2026-07-28",
        autoRenew: false,
        price: money(9),
        billingTerm: MOCK_BILLING_TERM.MONTHLY
      },
      {
        // Closed and REPLACED rather than simply stopped: the contract moved,
        // and the notice points at the product that took it over (legacy's
        // `cProdMovedMsg`). `prod-analytics` is a real row, so the link the
        // banner offers resolves to a product page.
        id: "prod-cdn",
        groupSlug: "products",
        serviceIdentifier: "cdn.fieldnotes.app",
        createdAt: "2026-08-02",
        orderId: "ord-31",
        name: "Media CDN",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.CANCELLED,
        cancelledAt: "2026-06-30",
        autoRenew: false,
        price: money(19),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        movedTo: { productId: "prod-analytics", name: "Analytics Add-on" }
      },
      {
        id: "prod-reports",
        groupSlug: "products",
        serviceIdentifier: "reports.fieldnotes.app",
        createdAt: "2026-07-30",
        orderId: "ord-31",
        name: "Weekly Reports Add-on",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.CANCELLED,
        cancelledAt: "2026-05-22",
        autoRenew: false,
        price: money(6),
        billingTerm: MOCK_BILLING_TERM.MONTHLY
      },
      {
        id: "prod-trial",
        groupSlug: "products",
        serviceIdentifier: "trial.fieldnotes.app",
        createdAt: "2026-07-27",
        orderId: "ord-30",
        name: "Trial Boost",
        category: "One-time purchase",
        billingType: MOCK_BILLING_TYPE.ONE_TIME,
        status: ContractStatusCodes.CANCELLED,
        cancelledAt: "2026-04-14",
        price: money(49)
      },
      {
        // A SECOND product waiting on the client, with TWO fields still to
        // give: the needs-attention card's two-field wording, and the second
        // row that makes the panel's cap of two reachable at all. Bought
        // BEFORE every other hand-authored row and still not answered, which
        // is both why the reminder panel exists and what keeps these two off
        // the listing's own first page.
        id: "prod-relay",
        groupSlug: "products",
        serviceIdentifier: "relay.fieldnotes.app",
        createdAt: "2026-07-26",
        orderId: "ord-31",
        name: "Mail Relay",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.AWAITING_ACTIVATION,
        price: money(9),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        taxLabel: SEED_TAX_LABEL,
        tags: [MOCK_PRODUCT_TAG.SETUP_PENDING],
        provisioning: {
          fields: [
            {
              code: "relay_host",
              label: "Relay hostname",
              value: "",
              type: BlueprintFieldsTypes.INPUT_TEXT,
              required: true
            },
            {
              code: "relay_user",
              label: "Relay username",
              value: "",
              type: BlueprintFieldsTypes.INPUT_TEXT,
              required: true
            },
            {
              // Answered already, and not insisted on either way — the field
              // the card must NOT name, which is what proves it names the
              // outstanding ones rather than the whole blueprint.
              code: "relay_port",
              label: "Relay port",
              value: 587,
              type: BlueprintFieldsTypes.INPUT_NUMBER
            }
          ],
          functions: [],
          iframes: []
        }
      },
      {
        // A THIRD, with three fields outstanding — the card's "and a few
        // other details" wording, and the row that takes the panel past its
        // cap so the Show-more control has something to reveal.
        id: "prod-edge",
        groupSlug: "products",
        serviceIdentifier: "edge.fieldnotes.app",
        createdAt: "2026-07-25",
        orderId: "ord-31",
        name: "Edge Workers",
        category: "Subscription",
        billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
        status: ContractStatusCodes.AWAITING_ACTIVATION,
        price: money(15),
        billingTerm: MOCK_BILLING_TERM.MONTHLY,
        taxLabel: SEED_TAX_LABEL,
        tags: [MOCK_PRODUCT_TAG.SETUP_PENDING],
        provisioning: {
          fields: [
            {
              code: "worker_name",
              label: "Worker name",
              value: "",
              type: BlueprintFieldsTypes.INPUT_TEXT,
              required: true
            },
            {
              code: "origin_url",
              label: "Origin URL",
              value: "",
              type: BlueprintFieldsTypes.INPUT_TEXT,
              required: true
            },
            {
              code: "edge_token",
              label: "Edge token",
              value: "",
              type: BlueprintFieldsTypes.INPUT_TEXT,
              secret: true,
              required: true
            }
          ],
          functions: [],
          iframes: []
        }
      }
    ],
    seedProduct
  ),
  catalogue: [
    {
      id: "cat-pro",
      groupSlug: "products",
      name: "Pro Plan",
      category: "Subscription",
      billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
      description: "Unlimited projects and priority processing.",
      price: money(99),
      billingTerm: MOCK_BILLING_TERM.MONTHLY,
      chargeTotal: money(99)
    },
    {
      id: "cat-support",
      groupSlug: "products",
      name: "Priority Support Add-on",
      category: "Subscription",
      billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
      description: "A dedicated queue with four-hour responses.",
      price: money(19),
      billingTerm: MOCK_BILLING_TERM.MONTHLY,
      chargeTotal: money(19)
    },
    {
      id: "cat-seats",
      groupSlug: "products",
      name: "Team Seats Pack",
      category: "Subscription",
      billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
      description: "Five extra seats for your workspace.",
      price: money(29),
      billingTerm: MOCK_BILLING_TERM.MONTHLY,
      chargeTotal: money(29)
    },
    {
      id: "cat-archive",
      groupSlug: "products",
      name: "Archive Storage",
      category: "Subscription",
      billingType: MOCK_BILLING_TYPE.SUBSCRIPTION,
      description: "Cold storage for finished projects.",
      price: money(8),
      billingTerm: MOCK_BILLING_TERM.MONTHLY,
      chargeTotal: money(8)
    },
    {
      id: "cat-workshop",
      groupSlug: "products",
      name: "Team Workshop Day",
      category: "One-time purchase",
      billingType: MOCK_BILLING_TYPE.ONE_TIME,
      description: "A day of hands-on training with our team.",
      price: money(450),
      chargeTotal: money(450)
    }
  ],
  // Newest first; each status group renders its own list, so every group
  // carries five. The type arguments are explicit so the literals below are
  // checked against the authored core — inferred, lodash reads `seedInvoice`
  // as a property name and checks nothing.
  invoices: map<SeedInvoiceCore, MockInvoice>(
    [
      {
        id: "inv-95",
        number: "INV-0095",
        issuedDate: "2026-08-22",
        dueDate: "2026-09-05",
        total: money(12),
        status: InvoiceStatus.UNPAID,
        // One document carrying all three sets, so the footer well has each
        // kind to print (`invoiceDetails.vue:161-184`).
        clientFields: [{ label: "Cost centre", value: "Workspace / Ops" }],
        customFields: [{ label: "Purchase order", value: "PO-4471" }],
        metaData: [{ label: "Raised by", value: "Automated billing run" }],
        // Already shared, with the download permitted and payment not — the
        // dialog's other branch is every invoice that has never been shared.
        isShared: true,
        shareAllowsDownload: true,
        shareAllowsPayment: false,
        productId: "prod-analytics",
        // Twenty-four rows, so the document's own line cap has something to
        // collapse: legacy hid nothing until the table ran past cap + 1.
        // Each seat is priced so the document still comes to its £12 —
        // the total follows the lines (`seedTotal`), and this is the small
        // owed document the credit-cap seeds sit either side of.
        lines: [
          {
            id: "l1",
            description: "Analytics seat 1",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l2",
            description: "Analytics seat 2",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l3",
            description: "Analytics seat 3",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l4",
            description: "Analytics seat 4",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l5",
            description: "Analytics seat 5",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l6",
            description: "Analytics seat 6",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l7",
            description: "Analytics seat 7",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l8",
            description: "Analytics seat 8",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l9",
            description: "Analytics seat 9",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l10",
            description: "Analytics seat 10",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l11",
            description: "Analytics seat 11",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l12",
            description: "Analytics seat 12",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l13",
            description: "Analytics seat 13",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l14",
            description: "Analytics seat 14",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l15",
            description: "Analytics seat 15",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l16",
            description: "Analytics seat 16",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l17",
            description: "Analytics seat 17",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l18",
            description: "Analytics seat 18",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l19",
            description: "Analytics seat 19",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l20",
            description: "Analytics seat 20",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l21",
            description: "Analytics seat 21",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l22",
            description: "Analytics seat 22",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l23",
            description: "Analytics seat 23",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          },
          {
            id: "l24",
            description: "Analytics seat 24",
            quantity: 1,
            unitPrice: money(0.5),
            amount: money(0.5)
          }
        ]
      },
      {
        // Discounted, in the £25-£100 band — the Discount filter needs two
        // documents on two different bands to narrow between.
        id: "inv-94",
        number: "INV-0094",
        issuedDate: "2026-08-20",
        dueDate: "2026-09-03",
        total: money(450),
        discount: money(60),
        status: InvoiceStatus.UNPAID,
        proforma: true,
        // Half taken and half still owed, so the order it belongs to reads
        // legacy's own partly-paid sentence.
        paidPart: money(200),
        orderId: "ord-35",
        lines: [
          { id: "l1", description: "Team Workshop Day", amount: money(450) }
        ]
      },
      {
        id: "inv-93",
        number: "INV-0093",
        issuedDate: "2026-08-15",
        dueDate: "2026-08-29",
        total: money(8),
        status: InvoiceStatus.UNPAID,
        isDelegated: true,
        ownerName: "Harbor Media",
        paymentPending: true,
        paymentInstructions: BANK_TRANSFER_INSTRUCTIONS,
        fraudStatus: FraudStatus.REVIEW,
        orderId: "ord-34",
        lines: [{ id: "l1", description: "Archive Storage", amount: money(8) }]
      },
      {
        id: "inv-92",
        number: "INV-0092",
        issuedDate: "2026-08-12",
        dueDate: "2026-08-26",
        total: money(29),
        status: InvoiceStatus.UNPAID,
        // A CHILD account's document: the row names whose it is without any
        // delegation being involved (`invoiceRowItem.vue:333-341`).
        ownerName: "Studio North",
        proforma: true,
        fraudStatus: FraudStatus.FRAUD,
        orderId: "ord-33",
        lines: [{ id: "l1", description: "Team Seats Pack", amount: money(29) }]
      },
      {
        // Discounted too, but under £25 — the other side of that filter.
        id: "inv-88",
        number: "INV-0088",
        issuedDate: "2026-08-05",
        dueDate: "2026-08-19",
        total: money(61),
        discount: money(12),
        status: InvoiceStatus.UNPAID,
        toBeCredited: true,
        orderId: "ord-31",
        // Names its OWN card rather than the account's default — the branch
        // where legacy's message reads "Selected payment method" with Change.
        paymentDetailId: "pm-visa-42",
        lines: [
          { id: "l1", description: "Team Plan", amount: money(49) },
          { id: "l2", description: "Analytics Add-on", amount: money(12) }
        ]
      },
      {
        // The invoice that suspended prod-mail — the condition banner's
        // "View invoices" branch has something to send the client to.
        id: "inv-96",
        number: "INV-0096",
        issuedDate: "2026-08-05",
        dueDate: "2026-08-19",
        total: money(6),
        status: InvoiceStatus.OVERDUE,
        // Settled by bank transfer that has not landed: the payments panel and
        // every Pay control come off this document while it clears
        // (`invoiceProvider.vue:91-95`).
        clearing: true,
        productId: "prod-mail",
        lines: [{ id: "l1", description: "Mailbox Pack", amount: money(6) }]
      },
      {
        id: "inv-87",
        number: "INV-0087",
        issuedDate: "2026-07-05",
        dueDate: "2026-07-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2026-07-08",
        orderId: "ord-31",
        productId: "prod-analytics"
      },
      {
        id: "inv-86",
        number: "INV-0086",
        issuedDate: "2026-06-21",
        dueDate: "2026-07-05",
        total: money(300),
        status: InvoiceStatus.PAID,
        datePaid: "2026-06-24",
        orderId: "ord-30"
      },
      {
        id: "inv-85",
        number: "INV-0085",
        issuedDate: "2026-06-05",
        dueDate: "2026-06-19",
        total: money(15),
        status: InvoiceStatus.REFUNDED,
        dateCancelled: "2026-06-15",
        dateRefunded: "2026-06-15"
      },
      {
        id: "inv-84",
        number: "INV-0084",
        issuedDate: "2026-05-05",
        dueDate: "2026-05-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2026-05-08",
        orderId: "ord-31",
        productId: "prod-analytics"
      },
      {
        id: "inv-83",
        number: "INV-0083",
        issuedDate: "2026-04-05",
        dueDate: "2026-04-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2026-04-08",
        orderId: "ord-31",
        productId: "prod-analytics"
      },
      {
        id: "inv-82",
        number: "INV-0082",
        issuedDate: "2026-03-05",
        dueDate: "2026-03-19",
        total: money(15),
        status: InvoiceStatus.PAID,
        datePaid: "2026-03-08"
      },
      // TWELVE paid rows so the paid-invoices pager has a real second page
      // (plan §3 — the billing showcase pillar pages too; monthly Team Plan
      // renewals carry the history back).
      {
        id: "inv-77",
        number: "INV-0077",
        issuedDate: "2026-02-05",
        dueDate: "2026-02-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2026-02-08",
        orderId: "ord-31"
      },
      {
        id: "inv-76",
        number: "INV-0076",
        issuedDate: "2026-01-05",
        dueDate: "2026-01-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2026-01-08",
        orderId: "ord-31"
      },
      {
        id: "inv-75",
        number: "INV-0075",
        issuedDate: "2025-12-05",
        dueDate: "2025-12-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2025-12-08",
        orderId: "ord-31"
      },
      {
        id: "inv-74",
        number: "INV-0074",
        issuedDate: "2025-11-05",
        dueDate: "2025-11-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2025-11-08",
        orderId: "ord-31"
      },
      {
        id: "inv-73",
        number: "INV-0073",
        issuedDate: "2025-10-05",
        dueDate: "2025-10-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2025-10-08",
        orderId: "ord-31"
      },
      {
        id: "inv-72",
        number: "INV-0072",
        issuedDate: "2025-09-05",
        dueDate: "2025-09-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2025-09-08",
        orderId: "ord-31"
      },
      {
        id: "inv-71",
        number: "INV-0071",
        issuedDate: "2025-08-05",
        dueDate: "2025-08-19",
        total: money(61),
        status: InvoiceStatus.PAID,
        datePaid: "2025-08-08",
        orderId: "ord-31"
      },
      {
        id: "inv-81",
        number: "INV-0081",
        issuedDate: "2026-02-10",
        dueDate: "2026-02-24",
        total: money(9),
        status: InvoiceStatus.REFUNDED,
        dateCancelled: "2026-02-20"
      },
      {
        id: "inv-80",
        number: "INV-0080",
        issuedDate: "2026-01-12",
        dueDate: "2026-01-26",
        total: money(6),
        status: InvoiceStatus.CANCELLED,
        proforma: true,
        dateCancelled: "2026-01-22"
      },
      {
        id: "inv-79",
        number: "INV-0079",
        issuedDate: "2025-12-08",
        dueDate: "2025-12-22",
        total: money(19),
        status: InvoiceStatus.CANCELLED,
        statusReason: "Raised against a product that never went live.",
        dateCancelled: "2025-12-18"
      },
      {
        id: "inv-78",
        number: "INV-0078",
        issuedDate: "2025-11-15",
        dueDate: "2025-11-29",
        total: money(12),
        status: InvoiceStatus.REFUNDED,
        dateCancelled: "2025-11-25"
      }
    ],
    seedInvoice
  ),
  orders: [
    // Still processing and unpaid, so this is the one the Cancel action can
    // reach — the other branch of legacy's cancellable gate.
    {
      id: "ord-35",
      number: "ORD-0035",
      placedDate: "2026-08-20",
      total: money(450),
      status: MOCK_ORDER_STATUS.PROCESSING,
      productNames: ["Team Workshop Day"],
      items: [
        {
          id: "oi-1",
          name: "Team Workshop Day",
          categoryName: "One-time purchase",
          unitPrice: money(450),
          quantity: 1,
          total: money(450)
        }
      ],
      dates: { created: "2026-08-20", due: "2026-09-03" },
      notes: "Please schedule for a Thursday if you can.",
      customFields: [
        { label: "Preferred start", value: "September 2026" },
        { label: "Attendees", value: "6" }
      ]
    },
    {
      id: "ord-34",
      number: "ORD-0034",
      placedDate: "2026-08-15",
      total: money(8),
      status: MOCK_ORDER_STATUS.ACTIVE,
      productNames: ["Archive Storage"],
      items: [
        {
          id: "oi-1",
          name: "Archive Storage",
          serviceIdentifier: "archive.fieldnotes.app",
          categoryName: "Subscription",
          unitPrice: money(8),
          quantity: 1,
          total: money(8)
        }
      ],
      dates: { created: "2026-08-15", paid: "2026-08-16" }
    },
    // The one order priced in a second currency too — legacy's
    // pay-in-alternative-currency row.
    {
      id: "ord-33",
      number: "ORD-0033",
      // Reached this client through a delegation — the order says so.
      isDelegated: true,
      placedDate: "2026-08-12",
      total: money(29),
      alternateTotal: money(37, SEED_ALTERNATE_CURRENCY),
      status: MOCK_ORDER_STATUS.PENDING,
      productNames: ["Team Seats Pack"],
      items: [
        {
          id: "oi-1",
          name: "Team Seats Pack",
          serviceIdentifier: "seats.fieldnotes.app",
          categoryName: "Subscription",
          unitPrice: money(29),
          quantity: 1,
          total: money(29)
        }
      ],
      dates: { created: "2026-08-12", due: "2026-08-26" }
    },
    {
      id: "ord-31",
      number: "ORD-0031",
      placedDate: "2026-06-21",
      total: money(61),
      status: MOCK_ORDER_STATUS.ACTIVE,
      productNames: ["Team Plan", "Analytics Add-on"],
      items: [
        {
          id: "oi-1",
          name: "Team Plan",
          serviceIdentifier: "team.fieldnotes.app",
          categoryName: "Subscription",
          imageSrc: "/hostgrid/product-team.jpg",
          unitPrice: money(49),
          quantity: 1,
          total: money(49)
        },
        {
          id: "oi-2",
          name: "Analytics Add-on",
          serviceIdentifier: "analytics.fieldnotes.app",
          categoryName: "Subscription",
          unitPrice: money(12),
          quantity: 1,
          total: money(12)
        }
      ],
      dates: { created: "2026-06-21", paid: "2026-06-24" }
    },
    // Cancelled, so its own reason renders — the branch a live order never shows.
    {
      id: "ord-30",
      number: "ORD-0030",
      placedDate: "2026-06-21",
      total: money(300),
      status: MOCK_ORDER_STATUS.CANCELLED,
      productNames: ["Guided Onboarding"],
      items: [
        {
          id: "oi-1",
          name: "Guided Onboarding",
          categoryName: "One-time purchase",
          unitPrice: money(300),
          quantity: 1,
          total: money(300)
        }
      ],
      dates: {
        created: "2026-06-21",
        cancelled: "2026-06-28",
        refunded: "2026-06-30"
      },
      cancellationReason: "Ordered in error — replaced by the workshop day."
    }
  ],
  creditNotes: map<SeedCreditNoteCore, MockCreditNote>(
    [
      {
        // Raised against ord-31's own invoice, so the order detail's credit-note
        // row has something to draw — legacy shows an order's credit notes there.
        id: "cn-13",
        number: "CN-0013",
        // Reached this client through a delegation — the document says so.
        isDelegated: true,
        issuedDate: "2026-08-08",
        status: CreditNoteStatus.ALLOCATED,
        total: money(6),
        invoiceNumber: "INV-0088",
        invoiceId: "inv-88",
        productId: "prod-analytics",
        lines: [
          {
            id: "l1",
            description: "Analytics Add-on — part month",
            amount: money(6),
            quantity: 1,
            unitPrice: money(6)
          }
        ]
      },
      {
        id: "cn-12",
        number: "CN-0012",
        issuedDate: "2026-06-08",
        status: CreditNoteStatus.UNALLOCATED,
        total: money(15),
        invoiceNumber: "INV-0085",
        invoiceId: "inv-85",
        lines: [
          {
            id: "l1",
            description: "Content Delivery — cancelled early",
            amount: money(15),
            quantity: 1,
            unitPrice: money(15)
          }
        ]
      },
      {
        id: "cn-11",
        number: "CN-0011",
        issuedDate: "2026-02-12",
        status: CreditNoteStatus.ALLOCATED,
        total: money(9),
        invoiceNumber: "INV-0081",
        invoiceId: "inv-81",
        lines: [
          {
            id: "l1",
            description: "Reporting Pack — goodwill credit",
            amount: money(9),
            quantity: 1,
            unitPrice: money(9)
          }
        ]
      },
      {
        id: "cn-10",
        number: "CN-0010",
        issuedDate: "2026-01-14",
        status: CreditNoteStatus.UNALLOCATED,
        total: money(6),
        invoiceNumber: "INV-0080",
        invoiceId: "inv-80",
        lines: [
          {
            id: "l1",
            description: "Archive Storage — overcharge",
            amount: money(6),
            quantity: 1,
            unitPrice: money(6)
          }
        ]
      },
      {
        id: "cn-9",
        number: "CN-0009",
        issuedDate: "2025-12-10",
        status: CreditNoteStatus.ALLOCATED,
        total: money(19),
        invoiceNumber: "INV-0079",
        invoiceId: "inv-79",
        lines: [
          {
            id: "l1",
            description: "Priority Support Add-on — downgrade",
            amount: money(19),
            quantity: 1,
            unitPrice: money(19)
          }
        ]
      },
      {
        id: "cn-8",
        number: "CN-0008",
        issuedDate: "2025-11-17",
        status: CreditNoteStatus.UNALLOCATED,
        total: money(12),
        invoiceNumber: "INV-0078",
        invoiceId: "inv-78",
        lines: [
          {
            id: "l1",
            description: "Analytics Add-on — service credit",
            amount: money(12),
            quantity: 1,
            unitPrice: money(12)
          }
        ]
      }
    ],
    seedCreditNote
  ),
  paymentMethods: [
    {
      id: "pm-amex",
      ownerClientId: SEED_CLIENT_ID,
      brand: "Amex",
      last4: "1005",
      expiry: "11/27",
      displayName: "Company card",
      gatewayName: "Stripe",
      autoPayment: true,
      verified: true,
      isDefault: true
    },
    {
      id: "pm-visa-42",
      ownerClientId: SEED_CLIENT_ID,
      brand: "Visa",
      last4: "4242",
      expiry: "08/28",
      displayName: "Personal Visa",
      gatewayName: "Stripe",
      autoPayment: false,
      verified: true,
      isDefault: false
    },
    {
      id: "pm-mc-44",
      ownerClientId: SEED_CLIENT_ID,
      brand: "Mastercard",
      last4: "4444",
      expiry: "03/29",
      gatewayName: "Braintree",
      autoPayment: false,
      verified: true,
      isDefault: false
    },
    // Unconfirmed and NOT confirmable: legacy greyed its retry control out on
    // exactly this row, which is the other branch of the one below.
    {
      id: "pm-visa-98",
      ownerClientId: SEED_CLIENT_ID,
      brand: "Visa",
      last4: "9821",
      expiry: "01/27",
      gatewayName: "Stripe",
      autoPayment: false,
      verified: false,
      isVerifiable: false,
      isDefault: false
    },
    {
      id: "pm-disc-60",
      ownerClientId: SEED_CLIENT_ID,
      brand: "Discover",
      last4: "6011",
      expiry: "05/28",
      gatewayName: "Braintree",
      autoPayment: false,
      verified: false,
      isVerifiable: true,
      isDefault: false
    },
    // The CHILD account's own cards. Reached through the login-as swap they
    // carry their controls, while the parent's above read as inherited; the
    // parent's own page never shows these at all
    // (`payment-methods/index.vue:47-68`).
    {
      id: "pm-child-visa",
      ownerClientId: "md-client-2",
      brand: "Visa",
      last4: "3310",
      expiry: "09/29",
      displayName: "Studio card",
      gatewayName: "Stripe",
      autoPayment: true,
      verified: true,
      // The child has added cards and not yet chosen one to charge first: the
      // account's single default is the PARENT's, and defaulting stays the
      // whole-account write it already is.
      isDefault: false
    },
    {
      id: "pm-child-mc",
      ownerClientId: "md-client-2",
      brand: "Mastercard",
      last4: "7712",
      expiry: "12/28",
      gatewayName: "Braintree",
      autoPayment: false,
      verified: true,
      isDefault: false
    }
  ],
  // What a pound buys in the two other currencies the brand takes payment in
  // — the choice legacy's Pay dropdown offered where the brand allowed one.
  currencyRates: { USD: 1.27, EUR: 1.17 },
  // Two price lists, so the settings form has a choice to offer (the minimal
  // brand publishes one, which is a fact rather than a choice).
  priceLists: [
    { id: "pl-standard", name: "Standard", currency: SEED_CURRENCY },
    { id: "pl-partner", name: "Partner", currency: SEED_CURRENCY }
  ],
  // Consolidation ON, on a weekly rule — the branch that renders the rule and
  // its day-of-week field; the minimal brand carries the other one.
  billingSettings: {
    currency: SEED_CURRENCY,
    paymentCurrency: SEED_ALTERNATE_CURRENCY,
    priceListId: "pl-standard",
    consolidation: InvoiceConsolidationTypes.ENABLED,
    rule: InvoiceConsolidationRuleTypes.DAY_OF_WEEK,
    dayOfWeek: "monday",
    dueDateDay: 14
  },
  // What the brand asks a client who cancels — one required free-text answer
  // and one optional choice, so the cancellation form exercises both arms of
  // the custom-field parser it shares with the profile page.
  cancellationFields: [
    customFieldSeed({
      id: "cxf-destination",
      code: "moving_to",
      name: "Where are you moving to?",
      order: 1,
      isRequired: false,
      typeId: CustomFieldsTypes.SELECT,
      typeCode: "select",
      options: [
        { label: "Another provider", value: "Another provider" },
        { label: "In-house", value: "In-house" },
        { label: "Nowhere — we are winding down", value: "Winding down" }
      ],
      value: ""
    }),
    customFieldSeed({
      id: "cxf-improve",
      code: "what_would_help",
      name: "What would have kept you with us?",
      order: 2,
      isRequired: true,
      value: ""
    })
  ],
  // Two gateways, one of which keeps cards on file — the branch that lets the
  // brand offer "Add card" at all (the minimal dataset has neither).
  gateways: [
    { id: "gw-stripe", name: "Stripe", supportsStoredCards: true },
    { id: "gw-paypal", name: "PayPal", supportsStoredCards: false }
  ],
  // Credit in both trading currencies, with the limit the brand grants this
  // client — legacy's per-currency wallet table and its credit-limit panel.
  wallet: {
    balances: [money(48.5), money(120, SEED_ALTERNATE_CURRENCY)],
    creditLimit: { allowance: money(500), used: money(140) },
    // Three closed-off periods over the movements below. Only the periods are
    // seeded: opening, credits, debits and closing are the facade's to work
    // out from the ledger (plan R6).
    statements: [
      {
        id: "cs-2026-08",
        fromDate: "2026-08-01",
        toDate: "2026-08-31",
        createdAt: "2026-09-01"
      },
      {
        id: "cs-2026-07",
        fromDate: "2026-07-01",
        toDate: "2026-07-31",
        createdAt: "2026-08-01"
      },
      {
        id: "cs-2026-06",
        fromDate: "2026-06-01",
        toDate: "2026-06-30",
        createdAt: "2026-07-01"
      },
      {
        id: "cs-2026-05",
        fromDate: "2026-05-01",
        toDate: "2026-05-31",
        createdAt: "2026-06-01"
      },
      {
        id: "cs-2026-04",
        fromDate: "2026-04-01",
        toDate: "2026-04-30",
        createdAt: "2026-05-01"
      },
      {
        id: "cs-2026-03",
        fromDate: "2026-03-01",
        toDate: "2026-03-31",
        createdAt: "2026-04-01"
      },
      {
        id: "cs-2026-02",
        fromDate: "2026-02-01",
        toDate: "2026-02-28",
        createdAt: "2026-03-01"
      },
      {
        id: "cs-2026-01",
        fromDate: "2026-01-01",
        toDate: "2026-01-31",
        createdAt: "2026-02-01"
      },
      {
        id: "cs-2025-12",
        fromDate: "2025-12-01",
        toDate: "2025-12-31",
        createdAt: "2026-01-01"
      }
    ],
    transactions: [
      {
        id: "wt-9",
        date: "2026-08-18",
        type: WalletTransactionTypes.SPEND,
        description: "Applied to INV-0093",
        amount: money(-8)
      },
      {
        id: "wt-8",
        date: "2026-08-08",
        type: WalletTransactionTypes.REFUND_TO_WALLET,
        description: "Credit note CN-0013",
        amount: money(6)
      },
      {
        id: "wt-7",
        date: "2026-07-30",
        type: WalletTransactionTypes.ADD,
        description: "Top-up by card",
        amount: money(50)
      },
      {
        id: "wt-6",
        date: "2026-07-12",
        type: WalletTransactionTypes.SPEND,
        description: "Applied to INV-0087",
        amount: money(-24)
      },
      {
        id: "wt-5",
        date: "2026-06-30",
        type: WalletTransactionTypes.OVERPAID_CREDIT_NOTE,
        description: "Overpayment on INV-0086",
        amount: money(4.5)
      },
      {
        id: "wt-4",
        date: "2026-06-15",
        type: WalletTransactionTypes.REFUND_TO_GATEWAY,
        description: "Refund to Visa ···· 4242",
        amount: money(-15)
      },
      {
        id: "wt-3",
        date: "2026-05-28",
        type: WalletTransactionTypes.ADD,
        description: "Top-up by bank transfer",
        amount: money(25)
      },
      {
        id: "wt-2",
        date: "2026-05-02",
        type: WalletTransactionTypes.WITHDRAW,
        description: "Withdrawal to bank account",
        amount: money(-40)
      },
      {
        id: "wt-1",
        date: "2026-04-18",
        type: WalletTransactionTypes.ADD,
        description: "Opening top-up",
        amount: money(50)
      }
    ]
  },
  // The desks a client may raise a thread with — legacy's public departments.
  // Seeded threads also name "Accounts", a desk the brand keeps to itself, so
  // the form offers three of the four names the list shows.
  departments: [
    { id: "dep-billing", name: "Billing" },
    { id: "dep-support", name: "Product support" },
    { id: "dep-sales", name: "Sales" }
  ],
  // Open first (newest first), then closed (newest first) — the two status
  // lists read in data order.
  tickets: [
    {
      id: "tkt-211",
      reference: "#48211",
      subject: "Renewal date question",
      department: "Billing",
      status: TicketStatusCodes.OPEN,
      createdAt: "2026-08-25T09:12:00Z",
      scheduledAt: "2026-09-04T10:00:00Z",
      updatedAt: "2026-08-25T09:12:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-08-25T09:12:00Z",
          body: "Can I move all my renewals to the 1st of the month?"
        }
      ]
    },
    {
      id: "tkt-210",
      reference: "#48210",
      productId: "prod-team",
      subject: "Team Plan seat limit",
      department: "Product support",
      status: TicketStatusCodes.OPEN,
      createdAt: "2026-08-24T16:40:00Z",
      isDelegated: true,
      updatedAt: "2026-08-24T16:40:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-08-24T16:40:00Z",
          body: "We hit the seat limit — does the Seats Pack stack twice?"
        }
      ]
    },
    {
      id: "tkt-209",
      reference: "#48209",
      productId: "prod-archive",
      subject: "Archive Storage upload errors",
      department: "Product support",
      status: TicketStatusCodes.OPEN,
      createdAt: "2026-08-23T14:05:00Z",
      locked: true,
      assignedAgent: "Ada Whitfield",
      updatedAt: "2026-08-23T14:05:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-08-23T14:05:00Z",
          body: "Large uploads to the archive fail at around 2GB."
        },
        {
          id: "msg-2",
          author: "Ada (Host·Grid support)",
          authorType: "agent",
          sentAt: "2026-08-23T15:20:00Z",
          body: "We are looking into this — could you share one failing file name?"
        },
        // A LONG thread: the run behind these two takes it past one page, so
        // the feed's Show-more has something to fetch and the Attachments tab
        // has more than one row (`ticketMessages.vue:105-112`).
        ...map(range(LONG_THREAD_MESSAGES), fillerTicketMessage)
      ]
    },
    {
      id: "tkt-208",
      reference: "#48208",
      subject: "Invoice PDF formatting",
      department: "Billing",
      status: TicketStatusCodes.OPEN,
      createdAt: "2026-08-23T10:30:00Z",
      updatedAt: "2026-08-23T10:30:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-08-23T10:30:00Z",
          body: "The PDF cuts off our VAT number — can that field be widened?",
          // An OPEN thread carrying a file the client named, so the message
          // menu's Edit, Delete and Remove-file entries all render somewhere.
          attachments: ["invoice-0093.pdf"]
        }
      ]
    },
    {
      id: "tkt-207",
      reference: "#48207",
      productId: "prod-analytics",
      subject: "Exporting analytics to CSV",
      department: "Product support",
      status: TicketStatusCodes.OPEN,
      createdAt: "2026-08-22T15:40:00Z",
      updatedAt: "2026-08-22T15:40:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-08-22T15:40:00Z",
          body: "Is there a way to export the monthly analytics view as CSV?"
        }
      ]
    },
    {
      id: "tkt-198",
      reference: "#48198",
      subject: "Invoice copy for accounting",
      department: "Billing",
      status: TicketStatusCodes.CLOSED,
      createdAt: "2026-07-29T16:20:00Z",
      closedAt: "2026-07-30T11:05:00Z",
      assignedAgent: "Ada Whitfield",
      updatedAt: "2026-07-30T11:05:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-07-29T16:20:00Z",
          body: "Could you resend INV-0087 as a PDF?",
          // The same message shape on a CLOSED thread: the menu is withheld
          // outright, which is the other branch of legacy's own gate.
          attachments: ["accounts-request.pdf"]
        },
        {
          id: "msg-2",
          author: "Ada (Host·Grid support)",
          authorType: "agent",
          sentAt: "2026-07-30T11:05:00Z",
          body: "Sent to your billing address — let us know if anything else is missing."
        }
      ],
      // The standing moved twice while it ran, and the feed interleaves both
      // entries with the messages by WHEN they happened.
      statusLog: [
        {
          id: "tsc-1",
          status: TicketStatusCodes.IN_PROGRESS,
          at: "2026-07-29T16:25:00Z"
        },
        {
          id: "tsc-2",
          status: TicketStatusCodes.CLOSED,
          at: "2026-07-30T11:05:00Z"
        }
      ]
    },
    {
      id: "tkt-197",
      reference: "#48197",
      productId: "prod-onboarding",
      subject: "Onboarding scheduling",
      department: "Product support",
      status: TicketStatusCodes.CLOSED,
      createdAt: "2026-07-21T09:00:00Z",
      updatedAt: "2026-07-22T13:45:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-07-21T09:00:00Z",
          body: "Can we move the onboarding session to a Friday?"
        },
        {
          id: "msg-2",
          author: "Ada (Host·Grid support)",
          authorType: "agent",
          sentAt: "2026-07-22T13:45:00Z",
          body: "Done — you are booked for the first Friday after setup completes."
        }
      ]
    },
    {
      id: "tkt-196",
      reference: "#48196",
      subject: "Password reset loop",
      department: "Accounts",
      status: TicketStatusCodes.CLOSED,
      createdAt: "2026-07-09T18:10:00Z",
      updatedAt: "2026-07-10T08:25:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-07-09T18:10:00Z",
          body: "The reset email keeps sending me back to the login page."
        },
        {
          id: "msg-2",
          author: "Ada (Host·Grid support)",
          authorType: "agent",
          sentAt: "2026-07-10T08:25:00Z",
          body: "That link had expired — a fresh one is on its way."
        }
      ]
    },
    {
      id: "tkt-195",
      reference: "#48195",
      subject: "Upgrade path from Solo",
      department: "Sales",
      status: TicketStatusCodes.CLOSED,
      createdAt: "2026-06-27T15:30:00Z",
      updatedAt: "2026-06-28T12:00:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-06-27T15:30:00Z",
          body: "What does moving from Solo to Team look like mid-cycle?"
        },
        {
          id: "msg-2",
          author: "Ada (Host·Grid support)",
          authorType: "agent",
          sentAt: "2026-06-28T12:00:00Z",
          body: "We prorate the difference — the switch takes effect immediately."
        }
      ]
    },
    {
      id: "tkt-194",
      reference: "#48194",
      productId: "prod-analytics",
      subject: "Analytics export limits",
      department: "Product support",
      status: TicketStatusCodes.CLOSED,
      createdAt: "2026-06-14T17:05:00Z",
      updatedAt: "2026-06-15T10:50:00Z",
      messages: [
        {
          id: "msg-1",
          author: "Jonah Reyes",
          authorType: "client",
          sentAt: "2026-06-14T17:05:00Z",
          body: "Is there a row limit on analytics exports?"
        },
        {
          id: "msg-2",
          author: "Ada (Host·Grid support)",
          authorType: "agent",
          sentAt: "2026-06-15T10:50:00Z",
          body: "100k rows per export — split by month for anything larger."
        }
      ]
    }
  ],
  notifications: [
    {
      // Past the 150-character cut, so the row truncates and offers the
      // control that opens the whole of it (`userNotification.vue:58`).
      id: "ntf-7",
      title: "Planned maintenance in London",
      body: "Our data centre in London is scheduled for planned maintenance on the evening of 12 September, between 22:00 and 02:00 UTC. During that window your services may be unreachable for up to fifteen minutes at a time while we move traffic onto the replacement hardware. No action is needed from you, and no data will be lost; we will post an update here once the work has finished.",
      sentAt: "2026-08-27T09:00:00Z",
      read: false
    },
    {
      id: "ntf-1",
      title: "Invoice INV-0088 is due",
      body: "Your August invoice is awaiting payment.",
      sentAt: "2026-08-19T08:00:00Z",
      read: false
    },
    {
      id: "ntf-2",
      title: "Onboarding session scheduled",
      body: "Your guided onboarding starts once setup completes.",
      sentAt: "2026-08-10T12:00:00Z",
      read: false
    },
    {
      id: "ntf-3",
      title: "New sign-in to your account",
      body: "Firefox on Linux, from 198.51.100.23.",
      sentAt: "2026-08-22T15:36:00Z",
      read: true
    },
    {
      id: "ntf-4",
      title: "Archive Storage is active",
      body: "Cold storage is ready — start moving finished projects.",
      sentAt: "2026-08-16T09:00:00Z",
      read: true
    },
    {
      id: "ntf-5",
      title: "Payment received for INV-0087",
      body: "Thanks — your July invoice is settled.",
      sentAt: "2026-07-06T08:00:00Z",
      read: true
    },
    {
      id: "ntf-6",
      title: "Team Workshop Day booked",
      body: "Your order ORD-0035 is being scheduled.",
      sentAt: "2026-08-21T11:30:00Z",
      read: true
    }
  ],
  // Both sides of both delegate axes: whole-account against per-object
  // access, and an invitation taken up against one still outstanding. The
  // per-object rows carry a grant on the showcase product, so a product's own
  // settings area opens with the switch on for one delegate and off for the
  // next.
  delegates: [
    {
      id: "dlg-1",
      invitedAt: "2026-05-14",
      name: "Sasha Kim",
      email: "sasha@fieldnotes.app",
      isFullDelegate: false,
      status: MOCK_DELEGATE_STATUS.ACCEPTED,
      objects: [
        { type: DelegateObjectTypes.CONTRACT_PRODUCT, id: "prod-analytics" }
      ],
      permissions: ["View invoices"]
    },
    {
      id: "dlg-2",
      invitedAt: "2026-07-02",
      name: "Priya Nand",
      email: "priya@fieldnotes.app",
      isFullDelegate: true,
      status: MOCK_DELEGATE_STATUS.ACCEPTED,
      objects: [],
      permissions: ["View invoices", "Pay invoices"]
    },
    {
      id: "dlg-3",
      invitedAt: "2026-08-21",
      name: "Marcus Webb",
      email: "marcus@fieldnotes.app",
      isFullDelegate: false,
      status: MOCK_DELEGATE_STATUS.PENDING,
      objects: [],
      permissions: ["Manage products"]
    },
    {
      id: "dlg-4",
      invitedAt: "2026-06-09",
      name: "Elin Sorensen",
      email: "elin@fieldnotes.app",
      isFullDelegate: true,
      status: MOCK_DELEGATE_STATUS.ACCEPTED,
      objects: [],
      permissions: ["View tickets", "Reply to tickets"]
    },
    {
      id: "dlg-5",
      invitedAt: "2026-08-03",
      name: "Tomas Rivera",
      email: "tomas@fieldnotes.app",
      isFullDelegate: false,
      status: MOCK_DELEGATE_STATUS.ACCEPTED,
      objects: [{ type: DelegateObjectTypes.TICKET, id: "tkt-1" }],
      permissions: ["View invoices"]
    }
  ],
  // The persona is a PARENT (plan R9): three relations, so the login-as flow,
  // the refusal branch and each relation switch all render on this brand.
  childAccounts: [
    {
      id: "rel-1",
      child_client_id: "md-client-2",
      parent_client_id: "md-client-1",
      created_at: "2026-03-04T09:12:00Z",
      name: "Studio North",
      email: "ops@studionorth.example",
      allow_impersonation: true,
      inherit_payment_details: true,
      use_parent_branding: true
    },
    {
      id: "rel-2",
      child_client_id: "md-client-3",
      parent_client_id: "md-client-1",
      created_at: "2026-05-19T14:40:00Z",
      name: "Atlas Labs",
      email: "billing@atlaslabs.example",
      allow_impersonation: false,
      inherit_payment_details: false,
      use_parent_branding: false
    },
    {
      id: "rel-3",
      child_client_id: "md-client-4",
      parent_client_id: "md-client-1",
      created_at: "2026-07-02T08:05:00Z",
      name: "Harbor Media",
      // Sorted LAST by address while it is first by day and second by name,
      // so the panel's three orders are told apart from one another.
      email: "zoe@harbormedia.example",
      allow_impersonation: true,
      inherit_payment_details: false,
      use_parent_branding: true
    }
  ],
  // The appearance the two branding-on children wear — legacy's brand
  // appearance panel, which renders only while some relation inherits it.
  parentBranding: {
    name: "Fieldnotes",
    colour: "#1F5EFF",
    font: "Inter",
    logoSrc: "https://placehold.co/160x160/1F5EFF/FFFFFF?text=F"
  },
  // The brand is running behind on mail, which is what raises legacy's
  // delivery-delay notice over the email history.
  emailDeliveryDelayed: true,
  // Rows carry the headless `SentEmail` model (plan R2), newest first — the
  // seed order stands in for the module's default `created_at` DESC sort
  // (plan R5). TWELVE rows so the email-history pager has a real second page
  // (plan §3 — the in-repo receipt: legacy pages this list at 10).
  loginAttempts: [
    {
      id: "log-1",
      at: "2026-08-22T15:35:00Z",
      ip: "198.51.100.23",
      device: "Firefox on Linux",
      succeeded: true
    },
    {
      id: "log-2",
      at: "2026-08-20T09:14:00Z",
      ip: "198.51.100.23",
      device: "Safari on macOS",
      succeeded: true
    },
    {
      id: "log-3",
      at: "2026-08-18T22:41:00Z",
      ip: "203.0.113.9",
      device: "Chrome on Windows",
      succeeded: false
    },
    {
      id: "log-4",
      at: "2026-08-18T22:39:00Z",
      ip: "203.0.113.9",
      device: "Chrome on Windows",
      succeeded: false
    },
    {
      id: "log-5",
      at: "2026-08-12T07:58:00Z",
      ip: "198.51.100.23",
      device: "Firefox on Linux",
      succeeded: true
    },
    // TWELVE rows so the login-attempts pager has a real second page
    // (plan §3 — legacy's logs view pages at the platform's 10).
    {
      id: "log-6",
      at: "2026-08-06T19:22:00Z",
      ip: "198.51.100.23",
      device: "Firefox on Linux",
      succeeded: true
    },
    {
      id: "log-7",
      at: "2026-08-01T08:03:00Z",
      ip: "192.0.2.44",
      device: "Safari on iOS",
      succeeded: true
    },
    {
      id: "log-8",
      at: "2026-07-28T13:47:00Z",
      ip: "198.51.100.23",
      device: "Firefox on Linux",
      succeeded: true
    },
    {
      id: "log-9",
      at: "2026-07-19T21:05:00Z",
      ip: "203.0.113.77",
      device: "Edge on Windows",
      succeeded: false
    },
    {
      id: "log-10",
      at: "2026-07-19T21:03:00Z",
      ip: "203.0.113.77",
      device: "Edge on Windows",
      succeeded: false
    },
    {
      id: "log-11",
      at: "2026-07-11T06:40:00Z",
      ip: "198.51.100.23",
      device: "Safari on macOS",
      succeeded: true
    },
    {
      id: "log-12",
      at: "2026-07-02T17:26:00Z",
      ip: "192.0.2.44",
      device: "Safari on iOS",
      succeeded: true
    }
  ],
  // The brand's own words on the pages that carry a slot (plan R12). Short by
  // design: a slot is a note above the page, never a second page. The dashboard
  // slot stays blank: that page opens on the client's own data.
  templates: [
    {
      code: ClientTemplateSlotCodes.INVOICES_OVERVIEW,
      body: "Invoices are raised **14 days before** the due date and settled automatically where you have told us to. Anything unpaid can be paid from its own page."
    },
    {
      code: ClientTemplateSlotCodes.SUPPORT_OVERVIEW,
      body: "Before you open a ticket, our [status page](https://status.hostgrid.example) says whether we already know. Quote your support PIN if you call."
    },
    {
      code: ClientTemplateSlotCodes.AFFILIATES_OVERVIEW,
      body: "Commission is paid on the **first of each month** once your balance clears the payout threshold."
    },
    {
      code: ClientTemplateSlotCodes.CONTRACT_PRODUCT_OVERVIEW,
      body: "Changes to a running product take effect immediately; anything you are owed comes back as account credit."
    },
    {
      code: ClientTemplateSlotCodes.FOOTER,
      body: "Host·Grid Ltd · Registered in England 08842211 · [Terms](https://hostgrid.example/terms) · [Privacy](https://hostgrid.example/privacy)"
    },
    {
      code: ClientTemplateSlotCodes.LOGIN_PAGE,
      body: "Signing in gets you your products, invoices and tickets in one place. Trouble getting in? Our [status page](https://status.hostgrid.example) says whether it is us."
    },
    {
      code: ClientTemplateSlotCodes.REGISTER_PAGE,
      body: "Opening an account takes a minute. You are billed only for what you order — there is no charge for the account itself."
    }
  ],
  // Two, one of each kind legacy served: authored markdown in the primary nav,
  // and an embedded page that stays out of it.
  customPages: [
    {
      slug: "getting-started",
      title: "Getting started",
      showOnMenu: true,
      body: "Three steps stand between you and a working setup.\n\n1. **Point your domain** at `ns1.hostgrid.example`. Changes take up to an hour to reach everyone.\n2. **Add the mailboxes you need** from the Mail Relay page.\n3. **Turn on automatic backups**, so a bad day costs you nothing.\n\nNeed a hand? [Open a ticket](/support/tickets/new) and we will walk you through it."
    },
    {
      slug: "network-status",
      title: "Network status",
      showOnMenu: false,
      iframeUrl: "https://status.hostgrid.example/embed"
    }
  ]
};

// -----------------------------------------------------------------------------

const HERO_AFFILIATE = HOSTGRID_HERO_DATASET.affiliate;

/**
 * The brand's dataset: every results list padded to three pages, with the
 * hand-authored rows still at the head. Status-split lists (invoices,
 * tickets, products) reach three pages PER STATUS, because each status is
 * its own panel with its own pager.
 */
export const HOSTGRID_MOCK_DATASET: MockDataset = assign(
  {},
  HOSTGRID_HERO_DATASET,
  {
    products: padByStatus(
      HOSTGRID_HERO_DATASET.products,
      product => productStatusTab(product.status),
      [PRODUCT_STATUS_TAB.ACTIVE, PRODUCT_STATUS_TAB.CANCELLED],
      fillerProduct
    ),
    catalogue: padTo(HOSTGRID_HERO_DATASET.catalogue, fillerCatalogueItem),
    // Padded twice: once per STATUS TAB, then once for the showcase product's
    // own ledger, which is its own results list with its own pager.
    invoices: padByStatus(
      padByStatus(
        HOSTGRID_HERO_DATASET.invoices,
        invoice => invoiceStatusTab(invoice.status),
        [
          INVOICE_STATUS_TAB.UNPAID,
          INVOICE_STATUS_TAB.PAID,
          INVOICE_STATUS_TAB.CREDITED
        ],
        fillerInvoice
      ),
      invoice => invoice.productId ?? "",
      [SEED_LEDGER_PRODUCT_ID],
      fillerProductInvoice
    ),
    orders: padTo(HOSTGRID_HERO_DATASET.orders, fillerOrder),
    creditNotes: padByStatus(
      padTo(HOSTGRID_HERO_DATASET.creditNotes, fillerCreditNote),
      note => note.productId ?? "",
      [SEED_LEDGER_PRODUCT_ID],
      fillerProductCreditNote
    ),
    paymentMethods: padTo(
      HOSTGRID_HERO_DATASET.paymentMethods,
      fillerPaymentMethod
    ),
    tickets: padByStatus(
      HOSTGRID_HERO_DATASET.tickets,
      ticket => ticketStatusTab(ticket.status),
      [TICKET_STATUS_TAB.ACTIVE, TICKET_STATUS_TAB.CLOSED],
      fillerTicket
    ),
    notifications: padTo(
      HOSTGRID_HERO_DATASET.notifications,
      fillerNotification
    ),
    // Two panels on one page, so each pads on its own side of the axis.
    vault: padByStatus(
      HOSTGRID_HERO_DATASET.vault,
      asset => asset.encrypted,
      [false, true],
      fillerVaultEntry
    ),
    // The wallet's own list is its STATEMENTS; the balances and the limit
    // beside them are single facts, so only the ledger pads.
    wallet: assign({}, HOSTGRID_HERO_DATASET.wallet, {
      transactions: padTo(
        HOSTGRID_HERO_DATASET.wallet.transactions,
        fillerWalletTransaction
      )
    }),
    delegates: padTo(HOSTGRID_HERO_DATASET.delegates, fillerDelegate),
    // NOT padded: the parent's three relations are hand-authored, one per
    // branch of the switches. The minimal dataset proves the "no children"
    // branch of legacy's data-driven nav gate (hostgrid-minimal.ts).
    childAccounts: HOSTGRID_HERO_DATASET.childAccounts,
    // Padded PER STATUS: each of legacy's four tabs narrows this one list,
    // so each needs its own three pages.
    loginAttempts: padTo(
      HOSTGRID_HERO_DATASET.loginAttempts,
      fillerLoginAttempt
    ),
    ipWhitelist: padTo(HOSTGRID_HERO_DATASET.ipWhitelist, fillerIpAddress),
    affiliate:
      HERO_AFFILIATE === null
        ? null
        : assign({}, HERO_AFFILIATE, {
            links: padTo(HERO_AFFILIATE.links, fillerAffiliateLink),
            commissions: padTo(HERO_AFFILIATE.commissions, fillerCommission),
            payouts: padTo(HERO_AFFILIATE.payouts, fillerPayout),
            referrals: padTo(
              HERO_AFFILIATE.referrals,
              (index): MockAffiliateReferral =>
                fillerAffiliateReferral(index, HERO_AFFILIATE.links)
            )
          })
  }
);
