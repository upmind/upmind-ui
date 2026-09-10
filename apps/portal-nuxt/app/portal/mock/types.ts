// -----------------------------------------------------------------------------
/**
 * @module portal/mock/types
 * @description The mock domain dataset contract (plan §4) — the typed shape
 * every brand seed fills and every selector reads. Statuses are the platform's
 * own enums (plan R7) and money is data (plan R6): the mock layer stands in
 * for the SERVER, so it carries the amount AND the display string, and
 * nothing downstream computes a figure (feedback: no client money math).
 */

import { BrandConfigKeys, OrgFeatureKeys } from "@upmind-automation/types";
import type { ClientAccount } from "./contracts/client-account";
import type { ConsolidationWeekday } from "./contracts/client-billing-settings.schemas";
import type { NewLineKey } from "./contracts/client-tickets";
import type {
  Address,
  Company,
  CustomField,
  Email,
  Phone,
  ProfileRecord
} from "@upmind-automation/headless";
import type {
  AffiliatePayoutDestinationCode,
  BlueprintFieldsTypes,
  IIpAddress,
  INotificationTopic,
  NotificationChannelCodes,
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  CreditNoteStatus,
  DelegateObjectTypes,
  FraudStatus,
  IChildAccount,
  IClientTemplateSlot,
  ICustomPage,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes,
  InvoiceStatus,
  ITicketDepartment,
  IVaultAsset,
  PriceDisplayTypes,
  ProvisionRequestActionTypes,
  ScheduledActionStatusTypes,
  ScheduledActionTypes,
  TicketStatusCodes,
  WalletTransactionTypes,
  GatewayTypes
} from "@upmind-automation/types";

/**
 * The product tags this layer WRITES rather than merely carries. A tag that
 * reports a state has to go when the state does, so the fact and the write
 * that ends it name the same constant instead of two matching strings.
 */
/**
 * What the end of a trial does — legacy's `TrialEndActionTypes`, plus the
 * PENDING reading a trial that has not started yet takes
 * (`cProdTrialMsg.vue:47-48`: an awaiting-activation product).
 */
export const MOCK_TRIAL_END_ACTION = {
  PENDING: "pending",
  MIGRATE: "migrate",
  CANCEL: "cancel",
  CONTINUE: "continue"
} as const;

export type MockTrialEndAction =
  (typeof MOCK_TRIAL_END_ACTION)[keyof typeof MOCK_TRIAL_END_ACTION];

export const MOCK_PRODUCT_TAG = {
  /** Worn while a product awaits its setup blueprint (`ContractStatusCodes.AWAITING_ACTIVATION`). */
  SETUP_PENDING: "Setup pending"
} as const;

/** Legacy split its products into SUBSCRIPTIONS and ONE_TIME_PURCHASES route groups; this is that axis. */
export const MOCK_BILLING_TYPE = {
  SUBSCRIPTION: "subscription",
  ONE_TIME: "one-time"
} as const;

export type MockBillingType =
  (typeof MOCK_BILLING_TYPE)[keyof typeof MOCK_BILLING_TYPE];

/** How often a recurring price recurs — legacy's billing-cycle name, as the seeds spell it. */
export const MOCK_BILLING_TERM = {
  MONTHLY: "Monthly",
  ANNUALLY: "Annually"
} as const;

export type MockBillingTerm =
  (typeof MOCK_BILLING_TERM)[keyof typeof MOCK_BILLING_TERM];

/** How often a subscription RENEWS, in the words legacy's summary used. */
export const MOCK_RENEWAL_TERM = {
  MONTHLY: "1 month",
  ANNUALLY: "12 months"
} as const;

export type MockRenewalTerm =
  (typeof MOCK_RENEWAL_TERM)[keyof typeof MOCK_RENEWAL_TERM];

/** One amount, as the server would hand it over: the figure, its currency, and how it reads (plan R6). */
export type MockMoney = {
  readonly amount: number;
  readonly currency: string;
  readonly formatted: string;
};

/**
 * One account a sign-in may act for — the REAL `client-account` contract's own
 * row (`contracts/client-account.ts`), as `MockAddress` is the real `Address`.
 * Legacy's tenancy switcher listed these and marked the one in play.
 */
export type MockPersonaAccount = ClientAccount;

/**
 * The signed-in fixture identity — the app boots as this person (plan §1.4).
 * The four profile fields are the REAL `ProfileRecord`'s own members
 * (`client-personal-details`), so the profile page's display rows read what
 * `usePersonalDetails` will one day hand over, under the same names.
 */
export type MockPersona = Pick<
  ProfileRecord,
  "firstName" | "lastName" | "publicName" | "language"
> & {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly company?: string;
  readonly avatarSrc?: string;
  /**
   * The accounts this sign-in may act for — legacy's tenancy list
   * (`selectAccountList.vue`). One of them, or none, offers nothing to switch.
   */
  readonly accounts?: readonly MockPersonaAccount[];
  /** Which of `accounts` is being acted for. Moved by the switch-account form. */
  readonly activeAccountId?: string;
  /** What the client signs in with — the account card's link to security. */
  readonly username?: string;
  /**
   * The one password the logged-out login screen accepts (plan F11). A seed
   * fact rather than a stored credential: the mock has no session and nothing
   * to hash against, so the only honest refusal it can offer is "that is not
   * the password this account was seeded with".
   */
  readonly password?: string;
  /** When this account last signed in (ISO datetime). */
  readonly lastLoginAt?: string;
  /** The day the account was opened (ISO date) — the card's "client since". */
  readonly clientSince?: string;
  /** Standing facts the brand keeps about the account — the card's chips. */
  readonly tags?: readonly string[];
  /** The client's own support PIN — data, not a gate; `SUPPORT_PIN_ENABLED` decides whether it shows. */
  readonly supportPin?: string;
  /**
   * How this client composes replies. Absent until they answer the composer's
   * post-options form, which is what leaves the brand's own default standing.
   */
  supportPreferences?: MockSupportPreferences;
  /**
   * An account still being imported — legacy's `client.staged_import`, which
   * `useBrandAppearance.ts:44` reads as `isStaged` and every vault control
   * hangs off (`clientVaultAssetsModal.vue:10`). Absent reads as settled.
   */
  readonly stagedImport?: boolean;
};

/**
 * One line of what a configured product actually charges for — legacy's
 * billing breakdown, where the base plan and each chosen option carry their
 * own amount. The product's own `price` stays the fact; these explain it.
 */
export type MockProductLineItem = {
  readonly id: string;
  readonly description: string;
  readonly amount: MockMoney;
};

/**
 * One provisioning config field the provider hands back
 * (`IProvisionFieldValue`), plus the three facts the SETUP form needs from
 * the blueprint behind it: how the field is answered, whether the provider
 * insists on it, and the choices it offers. Absent on a field the provider
 * merely reports — those are read, never asked.
 */
export type MockProvisionField = {
  /** The provider's own key for it — stable where the label is not. */
  readonly code: string;
  readonly label: string;
  /** Moved by the setup form, which is the one thing that answers a blueprint. */
  value: MockCustomFieldValue;
  /** Masked until revealed — a password, an API key. */
  readonly secret?: boolean;
  /** How the setup form asks for it; absent reads as free text. */
  readonly type?: BlueprintFieldsTypes;
  /** The product will not provision without it. */
  readonly required?: boolean;
  /** The fixed choices it offers, where it offers any. */
  readonly options?: readonly {
    readonly label: string;
    readonly value: string;
  }[];
};

/** One provider function a client may run (`IProvisionRequestAction`). */
export type MockProvisionFunction = {
  /** The wire's `designation` — what `run()` is asked for. */
  readonly code: string;
  readonly label: string;
  /** What running it DOES — the wire's own outcome vocabulary. */
  readonly kind: ProvisionRequestActionTypes;
  /** Where a redirect goes, or which document a frame loads; absent on the rest. */
  readonly url?: string;
  /** Legacy's featured functions — the sidebar's quick actions. */
  readonly highlighted?: boolean;
};

/** One provider panel embedded in the product overview. */
export type MockProductIframe = {
  readonly title: string;
  readonly url: string;
};

/** A product's whole provisioning surface — the three things legacy's overview showed. */
export type MockProvisioning = {
  readonly fields: readonly MockProvisionField[];
  readonly functions: readonly MockProvisionFunction[];
  readonly iframes: readonly MockProductIframe[];
  /** Automated provisioning is held while the account is under review — legacy's fraud-status pause. */
  readonly paused?: boolean;
  /** How many provision requests are still unresolved; absent reads as none. */
  readonly unresolvedRequests?: number;
};

/**
 * A cancellation the client has ASKED for — the wire
 * `IContractCancellationRequest`, narrowed to what a client's own banners
 * read. Lodged is not accepted: a lodged request may still be called off,
 * an accepted one only reports its dates and the reason given.
 */
export type MockCancellationRequest = {
  readonly status: CancellationRequestStatusCodes;
  readonly requestedAt: string;
  /** When the brand accepted it; absent while it is only lodged. */
  readonly acceptedAt?: string;
  readonly reason: string;
  /** The day the product actually stops. */
  readonly cancelAt?: string;
  /** The answers to the brand's own cancellation questions, as asked. */
  readonly fields?: readonly MockCustomField[];
};

/** One product this product may be moved onto — legacy's upgrade/downgrade picker. */
export type MockMigrationOption = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly price: MockMoney;
  readonly billingTerm: string;
  /** The one line the picker's row carries — the catalogue's `short_description`. */
  readonly shortDescription: string;
  /** What the change actually buys, as markdown — the catalogue's `description`. */
  readonly description: string;
};

/**
 * One future billing action standing against a product — `IScheduledAction`
 * narrowed to what the automation timeline renders. `type` is the wire's own
 * `action_code`; `label` is what the brand says it will do.
 */
export type MockScheduledAction = {
  readonly id: string;
  readonly type: ScheduledActionTypes;
  readonly label: string;
  readonly scheduledAt: string;
  readonly status: ScheduledActionStatusTypes;
};

/**
 * Where a closed contract went — legacy's `moved_to_contract`, which a change
 * of currency or ownership leaves behind. The product itself stops; this
 * names the one that replaced it.
 */
export type MockProductMove = {
  readonly productId: string;
  readonly name: string;
};

/** A price this product moves to on a future renewal — legacy's scheduled price change. */
export type MockScheduledPriceChange = {
  readonly price: MockMoney;
  /** The day the new price takes effect (ISO date). */
  readonly effectiveAt: string;
};

export type MockProduct = {
  readonly id: string;
  /** The product group this belongs to — a `PortalConfig.groups` slug. */
  readonly groupSlug: string;
  /** Moved by the migrate action, which puts the chosen product's own facts here. */
  name: string;
  /** The client's own category for this product — legacy's "Browse by category" list is derived from these. */
  category: string;
  readonly billingType: MockBillingType;
  status: ContractStatusCodes;
  /** When the client acquired it (ISO date) — the platform's own `created_at`, and the order a listing opens in. */
  readonly createdAt: string;
  /**
   * When the contract ENDED (ISO date) — the Cancelled tab's own order. A
   * cancellation still ahead of the client is `cancellationRequest`, never
   * this: a date here means the product has already stopped.
   */
  cancelledAt?: string;
  /** What this product IS on the wire — `IContractProduct.service_identifier`: a hostname, a domain, an account name. */
  readonly serviceIdentifier?: string;
  /** Moved by the end-trial action, which brings the next charge forward to today. */
  nextDueDate?: string;
  /** The recurring rate or the one-time price — the period is `billingTerm`, never part of the money. */
  price?: MockMoney;
  /** How often `price` recurs ("Monthly", "Annually"); absent on a one-time purchase. */
  billingTerm?: string;
  readonly imageSrc?: string;
  /** The contract this product runs under — `IContractProduct.contract_id`. */
  readonly contractId: string;
  /** The order it was bought on — what the summary's purchase date links to. */
  readonly orderId: string;
  /** The day it was bought — `IContractProduct.purchased_at`, the wire's name for `createdAt`. */
  readonly purchasedAt: string;
  /**
   * The day the brand suspended it — absent on a product that never was, and
   * on one suspended before the brand recorded when. The day it was BOUGHT is
   * a different fact and never stands in for this one.
   */
  readonly suspendedAt?: string;
  /** How long each renewal buys ("1 month", "12 months"); absent on a one-time purchase. */
  readonly renewalTerm?: string;
  /** When a free trial runs out (ISO date) — absent on a product not on one. Cleared by the end-trial action. */
  trialEndsAt?: string;
  /**
   * What happens WHEN the trial ends — legacy's `trial_end_action`
   * (`cProdTrialMsg.vue:45-56`), which decided both the banner's sentence and
   * what the early-end control commits the client to.
   */
  readonly trialEndAction?: MockTrialEndAction;
  /** Renews itself when the term is up. Moved by the auto-renew action. */
  autoRenew: boolean;
  /** The cancellation the client has asked for; cleared by the abort action. */
  cancellationRequest?: MockCancellationRequest;
  /**
   * The day this product cancels itself (ISO date) — legacy's auto-expire,
   * set where a trial simply runs out rather than renewing. Cleared by the
   * disable-auto-expire action.
   */
  autoExpireAt?: string;
  /** The brand lets this product be moved onto another — legacy's `can_modify`. */
  readonly canModify: boolean;
  /** The brand lets automatic renewal be turned off; false renders the reason instead of the switch. */
  readonly canDisableAutoRenew: boolean;
  /** A pro-rata adjustment for a recent change is still being applied. Set by the migrate action. */
  pendingProRata: boolean;
  /** What this product may be moved onto — empty where the brand offers nothing. */
  readonly migrationOptions: readonly MockMigrationOption[];
  /** The automation timeline's own events — future billing actions standing against this product. */
  readonly scheduledActions: readonly MockScheduledAction[];
  /** Whether this product's invoices join the account's consolidated one. Moved by the consolidation form. */
  invoiceConsolidation: InvoiceConsolidationTypes;
  /** The brand's own words about this product, as markdown — legacy's "About this product". */
  readonly description?: string;
  /** What the configured product charges for, line by line. */
  readonly lineItems: readonly MockProductLineItem[];
  /** The provider surface: config fields, runnable functions and embedded panels. */
  readonly provisioning: MockProvisioning;
  /**
   * Standing facts about the product beside its status —
   * `IContractProductTag`. Moved by the writes that end the state a tag
   * reports: a product that has gone live no longer awaits its setup.
   */
  tags?: readonly string[];
  /** How the price says it is charged ("inc. VAT") — absent where the brand quotes net. */
  readonly taxLabel?: string;
  /** The card this product renews on; absent falls back to the account's default. Moved by the settings picker. */
  paymentDetailId?: string;
  /** The address this product is invoiced to (`MockDataset.addresses`). Moved by the settings picker. */
  billingAddressId?: string;
  /**
   * The company this product's invoices are raised TO — legacy's billing
   * panel offered the account's companies beside its addresses. Absent is
   * invoiced as the person.
   */
  billingCompanyId?: string;
  /** The client's own name for this product — legacy's custom label. Moved by the label form. */
  customLabel?: string;
  /** The promo codes this product was bought with — legacy's row tags. */
  readonly promotionCodes?: readonly string[];
  /** Managed on someone else's behalf — legacy's delegated-object marker. */
  readonly isDelegated?: boolean;
  /** The name the product carried before the brand renamed it — legacy shows it beside the new one. */
  readonly originalName?: string;
  /** Closed and replaced — the product that took this one's place. */
  readonly movedTo?: MockProductMove;
  /** The price waiting on the next renewal invoice; absent means the price stands. */
  readonly scheduledPriceChange?: MockScheduledPriceChange;
};

/** One line of the invoice document — the document's own total is the sum of these (the store is the mock's server). */
export type MockInvoiceLine = {
  readonly id: string;
  readonly description: string;
  readonly amount: MockMoney;
  /** How many of it the line charges for; absent reads as one. */
  readonly quantity?: number;
  /** What ONE of them costs — the line's amount is the quantity at this rate. */
  readonly unitPrice?: MockMoney;
};

/** One tax band on a document — the rate is the FIGURE, the label is how the band reads ("VAT"). */
export type MockTaxLine = {
  readonly label: string;
  /** The percentage charged, as a figure — the selector words it, the module never does. */
  readonly rate: number;
  readonly amount: MockMoney;
};

/** Where a payment or a refund stands with the gateway. */
export const MOCK_PAYMENT_STATUS = {
  PENDING: "pending",
  SUCCESSFUL: "successful",
  FAILED: "failed"
} as const;

export type MockPaymentStatus =
  (typeof MOCK_PAYMENT_STATUS)[keyof typeof MOCK_PAYMENT_STATUS];

/** One movement of money against a document — a payment on an invoice, a refund on a credit note. */
export type MockDocumentPayment = {
  readonly id: string;
  readonly date: string;
  /** How it was taken, in the client's words ("Visa ···· 4242", "Account credit"). */
  readonly method: string;
  readonly amount: MockMoney;
  readonly status: MockPaymentStatus;
  /**
   * Which kind of gateway took it — the platform's own `GatewayTypes`. An
   * OFFLINE one pending is money the system has recorded but not received,
   * which is what legacy read as `pending_payment_method`
   * (`invoiceProvider.vue:91-95`).
   */
  readonly gatewayType?: GatewayTypes;
  /**
   * What the client still has to DO for this payment to land, as markdown —
   * a bank transfer's reference, a cash-office address. Legacy fetched it per
   * transaction and showed it in its own modal; absent means the gateway asks
   * nothing of the client.
   */
  readonly instructions?: string;
};

/**
 * The billing party a document was RAISED for, snapshotted onto it — legacy
 * printed the address as it stood the day the invoice was issued, never the
 * address book's current row.
 */
export type MockParty = {
  readonly name: string;
  readonly company?: string;
  readonly taxNumber?: string;
  readonly registrationNumber?: string;
  readonly lines: readonly string[];
};

/** Legacy's invoice category — a demand, or the quote that precedes one. */
export const MOCK_INVOICE_CATEGORY = {
  INVOICE: "Invoice",
  PROFORMA: "Proforma"
} as const;

export type MockInvoiceCategory =
  (typeof MOCK_INVOICE_CATEGORY)[keyof typeof MOCK_INVOICE_CATEGORY];

export type MockInvoice = {
  readonly id: string;
  readonly number: string;
  readonly issuedDate: string;
  readonly dueDate: string;
  /** What the lines come to before tax. */
  readonly subtotal: MockMoney;
  /** Each tax band charged on the subtotal; empty where the brand charges none. */
  readonly taxes: readonly MockTaxLine[];
  /** Taken off the subtotal before tax; absent reads as none. */
  readonly discount?: MockMoney;
  readonly total: MockMoney;
  /** How much of the total has been received. Moved by the pay action. */
  paidAmount: MockMoney;
  /** What is still owed. Moved by the pay action. */
  unpaidAmount: MockMoney;
  /** Every payment taken against it, oldest first. Appended by the pay action. */
  payments: MockDocumentPayment[];
  /** The billing party this was raised for, as it stood when it was issued. */
  readonly address: MockParty;
  status: InvoiceStatus;
  /** When it was settled (ISO date) — absent while it is not. Set by the pay action. */
  datePaid?: string;
  /** When it was credited or written off (ISO date) — the Credited tab's own filter. */
  readonly dateCancelled?: string;
  /** When the money went back (ISO date) — the wire's `refund_changed`. */
  readonly dateRefunded?: string;
  /** Why it was cancelled, where the brand recorded one — legacy's `cancellation_reason`. */
  readonly statusReason?: string;
  /**
   * Standing behind a pro-rata change that has not been paid yet: the document
   * will be credited once the migration invoices settle (legacy's
   * `to_be_credited`, which overrode the unpaid and overdue wording).
   */
  readonly toBeCredited?: boolean;
  /** A quote rather than a demand — legacy's invoice category. */
  readonly category: MockInvoiceCategory;
  /** The opaque token the public share link carries — data, so the link is the dataset's. */
  readonly shareToken: string;
  /** The platform's fraud review state; absent reads as `FraudStatus.NOT_FRAUD`. */
  readonly fraudStatus?: FraudStatus;
  readonly orderId?: string;
  /** The product this document bills for — the product billing area's own ledger (plan R6 discriminator). */
  readonly productId?: string;
  readonly lines?: readonly MockInvoiceLine[];
  /**
   * The consolidated invoice that took this one's place — legacy's manual
   * consolidation closes the originals and raises one document for the lot.
   * Set by the consolidation write; a seeded invoice never carries it.
   */
  replacedBy?: string;
  /** Raised BY a consolidation, so it is never gathered into another one. */
  readonly isConsolidation?: boolean;
  /**
   * The stored card this document will be settled with — legacy's
   * `invoice.payment_details` (`invoicePaymentMethodMsg.vue`). Absent is the
   * "No payment method selected" branch. Moved by the invoice's own
   * change-method form.
   */
  paymentDetailId?: string;
  /** Reached this client through a delegation — legacy withheld the change control on one. */
  readonly isDelegated?: boolean;
  /**
   * Whose document this is, where it is not the signed-in account's — a child
   * account's, or the account a delegation reaches. The row names them
   * (`invoiceRowItem.vue:163-167,333-341`).
   */
  readonly ownerName?: string;
  /**
   * The labelled facts printed under the document — the client's own custom
   * fields, the document's, and the brand's meta-data
   * (`invoiceDetails.vue:161-184`, `invoiceMetaData.vue`). A credit note
   * prints none, which is legacy's own `!isCreditNote` gate.
   */
  readonly clientFields?: readonly MockCustomField[];
  readonly customFields?: readonly MockCustomField[];
  readonly metaData?: readonly MockCustomField[];
  /** Whether the public link is live — legacy's own sharing switch. */
  isShared?: boolean;
  /** Whether whoever holds the link may download the PDF. */
  shareAllowsDownload?: boolean;
  /** Whether whoever holds the link may pay it — offered only while it is owed. */
  shareAllowsPayment?: boolean;
};

/** Legacy's order lifecycle — the states a client's own order moves through. */
export const MOCK_ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  ACTIVE: "active",
  CANCELLED: "cancelled"
} as const;

export type MockOrderStatus =
  (typeof MOCK_ORDER_STATUS)[keyof typeof MOCK_ORDER_STATUS];

/** One product an order was placed for — legacy's order items table. */
export type MockOrderItem = {
  readonly id: string;
  readonly name: string;
  readonly imageSrc?: string;
  readonly unitPrice: MockMoney;
  readonly quantity: number;
  readonly total: MockMoney;
  /** What the item was provisioned as — the wire's `products.service_identifier`. */
  readonly serviceIdentifier?: string;
  /** The catalogue category it was bought from — the wire's `products.product.category.name`. */
  readonly categoryName?: string;
};

/** The dates an order collected as it moved — legacy showed every one it had. */
export type MockOrderDates = {
  readonly created: string;
  readonly paid?: string;
  readonly due?: string;
  readonly refunded?: string;
  readonly cancelled?: string;
};

/** One labelled fact the brand collected with the order — legacy's order custom fields. */
export type MockCustomField = {
  readonly label: string;
  readonly value: string;
};

export type MockOrder = {
  readonly id: string;
  readonly number: string;
  readonly placedDate: string;
  readonly total: MockMoney;
  /** The same total in the brand's second trading currency — legacy's pay-in-alternative-currency row. */
  readonly alternateTotal?: MockMoney;
  status: MockOrderStatus;
  readonly productNames: readonly string[];
  readonly items: readonly MockOrderItem[];
  readonly dates: MockOrderDates;
  /** What the client said when they ordered. */
  readonly notes?: string;
  readonly customFields?: readonly MockCustomField[];
  /** Why it was cancelled — set with the status by the cancel action. */
  cancellationReason?: string;
  /** Reached this client through a delegation — the order says whose it is. */
  readonly isDelegated?: boolean;
};

export type MockCreditNote = {
  readonly id: string;
  /** Reached this client through a delegation — the document says whose it is. */
  readonly isDelegated?: boolean;
  readonly number: string;
  readonly issuedDate: string;
  readonly total: MockMoney;
  /** Whether the credit has been applied to an invoice; absent reads as unallocated. */
  readonly status?: CreditNoteStatus;
  readonly invoiceNumber?: string;
  /** The invoice this credit offsets — the document's link row. */
  readonly invoiceId?: string;
  readonly lines?: readonly MockInvoiceLine[];
  /** The product this credit was raised against — the product billing area's own ledger. */
  readonly productId?: string;
  /** What was actually sent back, and how — the credit note's own payments list. */
  readonly refunds: readonly MockDocumentPayment[];
  /** The billing party it was raised for, as the invoice carried it. */
  readonly address: MockParty;
};

export type MockPaymentMethod = {
  readonly id: string;
  /**
   * The client that OWNS the card — legacy's `payment_method.client_id`. A
   * child account reached through the login-as swap sees its own cards with
   * their controls and the parent's read-only beside them
   * (`payment-methods/index.vue:47-68`), told apart on this axis alone.
   * Absent reads as the signed-in account's own.
   */
  readonly ownerClientId?: string;
  readonly brand: string;
  readonly last4: string;
  readonly expiry: string;
  isDefault: boolean;
  /** The client's own name for the card; absent reads as the brand and its last four. */
  readonly displayName?: string;
  /** Who processes it — legacy showed the gateway beside the card. */
  readonly gatewayName?: string;
  /** Charged automatically at renewal; absent reads as off. */
  autoPayment?: boolean;
  /** Confirmed with the gateway; absent reads as verified, which is the ordinary case. Moved by the verify write. */
  verified?: boolean;
  /** Whether the gateway will take a second confirmation attempt; absent reads as no. */
  readonly isVerifiable?: boolean;
};

/** One movement on the account-credit ledger — legacy's credit statements. */
export type MockWalletTransaction = {
  readonly id: string;
  readonly date: string;
  readonly type: WalletTransactionTypes;
  readonly description: string;
  readonly amount: MockMoney;
  /**
   * What the balance stood at once this movement landed — the server's own
   * running total, so a SEED never authors it: `mock/ledger.ts` chains it
   * across the whole ledger and every reader takes it from there. The writes
   * that mint a movement (`topUp`, `spend`) do know it, and set it.
   */
  readonly balanceAfter?: MockMoney;
};

/**
 * How far into the red the brand lets this client run, and how much of it is
 * spent — the remaining headroom is the facade's to work out
 * (`useMockWallet`), never a selector's.
 */
export type MockCreditLimit = {
  readonly allowance: MockMoney;
  /** How much of that allowance has been DRAWN — what is left is `allowance - used`. */
  readonly used: MockMoney;
};

/**
 * One period the brand has closed off and filed as a credit statement — the
 * wire `ICreditStatement` narrowed to the three facts legacy's row printed
 * (`creditStatementRowItem.vue`). The figures are NOT seeded: opening,
 * credits, debits and closing are the facade's to work out from the movements
 * that fall in the period (plan R6).
 */
export type MockCreditStatement = {
  readonly id: string;
  /** The first day the period covers, inclusive. */
  readonly fromDate: string;
  /** The last day the period covers, inclusive. */
  readonly toDate: string;
  /** When the desk filed it — legacy's "Created on" line. */
  readonly createdAt: string;
};

/** The account-credit wallet — per-currency balances, the statements behind them, and the limit (`contracts/client-wallet.ts`). */
export type MockWallet = {
  /** One balance per currency the client holds credit in. Moved by the top-up form. */
  readonly balances: MockMoney[];
  /** Every movement on the ledger, newest first. Appended by the top-up form. */
  readonly transactions: MockWalletTransaction[];
  /** Absent where the brand grants this client none. */
  readonly creditLimit?: MockCreditLimit;
  /** The periods the brand has closed off; empty where it files none. */
  readonly statements?: readonly MockCreditStatement[];
};

/** One price list the brand publishes — what a client may be quoted from. */
export type MockPriceList = {
  readonly id: string;
  readonly name: string;
  /** The currency its prices are held in. */
  readonly currency: string;
};

/**
 * How this client is billed — legacy's billing-settings page, both halves of
 * it (`contracts/client-billing-settings.ts`). Every member moves: the
 * settings form writes the lot in one save.
 */
export type MockBillingSettings = {
  /** The currency this client is quoted in. */
  currency: string;
  /** The currency this client pays in; absent falls back to the quoted one. */
  paymentCurrency?: string;
  /** Which of the brand's price lists this client buys from. */
  priceListId?: string;
  consolidation: InvoiceConsolidationTypes;
  /** When the consolidated invoice is raised; absent while consolidation is off. */
  rule?: InvoiceConsolidationRuleTypes;
  /** The day a weekly rule falls on. */
  dayOfWeek?: string;
  /** The day of the month a monthly rule falls on. */
  dayOfMonth?: number;
  /** How many days after it is raised the consolidated invoice falls due. */
  dueDateDay?: number;
};

/** One payment gateway the brand has enabled — legacy gated its "Add card" on there being one that stores them. */
export type MockGateway = {
  readonly id: string;
  readonly name: string;
  /** Whether it can keep a card on file; a brand with none of these stores nothing. */
  readonly supportsStoredCards: boolean;
};

/** One entry in the thread's status history — what it became, and when. */
export type MockTicketStatusChange = {
  readonly id: string;
  readonly status: TicketStatusCodes;
  readonly at: string;
};

export type MockTicketMessage = {
  readonly id: string;
  readonly author: string;
  readonly authorType: "client" | "agent";
  readonly sentAt: string;
  /** Moved by the client's own edit; kept on a deleted message, which still holds what was said. */
  body: string;
  /** The files named on the message — names only, never content (plan F9). Removed one at a time. */
  attachments?: readonly string[];
  /** When the client last rewrote it; absent means it reads as it was sent. */
  editedAt?: string;
  /** Withdrawn by the client — the thread prints a notice where the body was. */
  isDeleted?: boolean;
};

/**
 * One desk a ticket may be raised with — the wire `ITicketDepartment` narrowed
 * to the two members a client's own form offers. A brand with one department
 * asks nobody to choose it (`client-tickets.schemas.ts`).
 */
export type MockTicketDepartment = Pick<ITicketDepartment, "id" | "name">;

export type MockTicket = {
  readonly id: string;
  /** The client-facing thread number legacy led its rows with (`#48213`). */
  readonly reference?: string;
  /** The product this ticket concerns, when it concerns one (legacy cProdTickets). Detached by the client. */
  productId?: string;
  readonly subject: string;
  readonly department: string;
  status: TicketStatusCodes;
  /** When the thread was raised — legacy's own Created row. */
  readonly createdAt: string;
  updatedAt: string;
  /** When it was finished; absent while it is open. */
  closedAt?: string;
  /** Whoever on the desk owns it — absent until somebody picks it up. */
  readonly assignedAgent?: string;
  /** The desk has locked the thread: it takes no more client-side changes. */
  readonly locked?: boolean;
  /** Somebody else has been given access to this thread (legacy's delegated marker). */
  isDelegated?: boolean;
  /** A call the client booked about it — legacy's scheduled-open marker. */
  readonly scheduledAt?: string;
  readonly messages: MockTicketMessage[];
  /**
   * Every time the thread's standing changed — legacy interleaved these with
   * the messages, oldest first (`ticketFeedProvider.vue:228-249`). Appended by
   * every write that moves the status.
   */
  statusLog?: MockTicketStatusChange[];
};

export type MockNotification = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly sentAt: string;
  read: boolean;
};

/** Whether the person invited has taken the invitation up — legacy's "Pending" tag. */
export const MOCK_DELEGATE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted"
} as const;

export type MockDelegateStatus =
  (typeof MOCK_DELEGATE_STATUS)[keyof typeof MOCK_DELEGATE_STATUS];

/** One object a specific-access delegate has been granted — the wire `IDelegate`'s own pair. */
export type MockDelegateObject = {
  readonly type: DelegateObjectTypes;
  readonly id: string;
};

export type MockDelegate = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly permissions: readonly string[];
  /** Everything on the account, rather than the objects named for them; absent reads as specific. */
  isFullDelegate?: boolean;
  readonly status: MockDelegateStatus;
  /** The day the invitation went out — legacy's `created_at`, which its own listing ordered by. */
  readonly invitedAt: string;
  /** What a specific-access delegate reaches, one grant per row. Moved by the grant toggle. */
  objects: MockDelegateObject[];
};

/**
 * One parent/child relation — the wire `IChildAccount`'s own switches, plus
 * the child's display fields (the wire carries those on its `child_client`
 * relation, which is a whole `IClient` a mock has no honest way to fill) and
 * the parent-branding switch no config key carries
 * (`contracts/client-child-accounts.ts`).
 */
export type MockChildAccount = Pick<
  IChildAccount,
  | "id"
  | "child_client_id"
  | "parent_client_id"
  | "created_at"
  | "allow_impersonation"
  | "inherit_payment_details"
> & {
  readonly name: string;
  readonly email: string;
  use_parent_branding: boolean;
};

/**
 * The appearance a parent lends the children that inherit it — legacy's
 * brand-appearance panel. Portal-local: the wire's brand appearance hangs off
 * a whole `IBrand`, which a mock has no honest way to fill.
 */
export type MockParentBranding = {
  readonly name: string;
  /** The brand's primary colour, as authored — the swatch's own value. */
  readonly colour: string;
  readonly font: string;
  readonly logoSrc: string;
};

// Email history rows are the REAL headless model (plan R2): the exemplar
// collection that proves the mock layer carries the factory contract, so the
// go-real swap changes the source, never the templates. Values stay
// display-ready (`date`/`relative` are authored strings).

export type MockLoginAttempt = {
  readonly id: string;
  readonly at: string;
  readonly ip: string;
  readonly device: string;
  readonly succeeded: boolean;
};

/** A product the brand SELLS — legacy's storefront catalogue, per group. */
export type MockCatalogueItem = {
  readonly id: string;
  readonly groupSlug: string;
  readonly name: string;
  readonly category: string;
  readonly billingType: MockBillingType;
  readonly description: string;
  /** The recurring RATE; how often it recurs is `billingTerm`. */
  readonly price: MockMoney;
  /** How often `price` recurs ("Monthly", "Annually"); absent on a one-time purchase. */
  readonly billingTerm?: string;
  /** The amount an order for this item charges NOW — the rate on an invoice total reads as a bug. */
  readonly chargeTotal: MockMoney;
};

/**
 * What the Enter key does in the reply composer where the client has not said
 * otherwise — the brand's own `UI_ENTER_KEY_ACTION`. Legacy spelled the same
 * fact the other way round (which key inserts the NEWLINE); the mock names the
 * action because that is what the composer and the preference both read.
 */
export const MOCK_ENTER_KEY_ACTION = {
  /** Enter sends the reply; Shift+Enter inserts a newline. */
  SUBMIT: "submit",
  /** Enter inserts a newline; the reply is sent from the control. */
  NEWLINE: "newline"
} as const;

export type MockEnterKeyAction =
  (typeof MOCK_ENTER_KEY_ACTION)[keyof typeof MOCK_ENTER_KEY_ACTION];

/**
 * How this client composes support replies — legacy's
 * `supportPreferencesModal`, whose client half is its new-line picker and its
 * shortcut question (only the signature block was staff-only). Absent on the
 * persona means the brand's own `UI_ENTER_KEY_ACTION` still stands: the
 * preference is only stored once the client has answered it.
 */
export type MockSupportPreferences = {
  readonly submitWithShortcut: boolean;
  readonly newLineKey: NewLineKey;
};

/**
 * The gates the platform's own brand config answers, each named for the
 * `BrandConfigKeys` / `OrgFeatureKeys` member it reads
 * (`BRAND_GATE_CONFIG_KEY`). Headless maps its brand config through
 * `defaultsDeep` into an untyped object (`brand.mappers.ts`), so the record
 * `MockBrandFeatures` picks from is declared here rather than imported.
 */
type BrandConfigGates = {
  readonly CLIENT_NOTES_AND_SECRETS_ENABLED: boolean;
  readonly SUPPORT_PIN_ENABLED: boolean;
  readonly DISABLE_SUPPORT_SYSTEM: boolean;
  readonly UPMIND_BRANDING_ENABLED: boolean;
  /** The route a signed-in client lands on. */
  readonly DEFAULT_CLIENT_HOMEPAGE: string;
  /** Whether an address must name a region to be saved. */
  readonly REQUIRE_REGION_IN_ADDRESS: boolean;
  /** Whether a client may change an address that already exists. */
  readonly CLIENT_ALLOW_ADDRESS_UPDATE: boolean;
  /** Whether a client may be invoiced in one currency and pay in another. */
  readonly BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED: boolean;
  /** Whether every stored card settles automatically, with no say in it. */
  readonly BILLING_GATEWAY_FORCE_AUTO_PAYMENT: boolean;
  /** Whether a card used to pay is kept on file whatever the client says. */
  readonly BILLING_GATEWAY_FORCE_CARD_STORAGE: boolean;
  /** Whether the brand keeps a client's LAST card on file — true refuses its removal. */
  readonly PREVENT_CARD_REMOVAL_IF_LAST: boolean;
  /** Whether a client may book a ticket to open at a time of their choosing. */
  readonly CLIENT_TICKET_SCHEDULING_ENABLED: boolean;
  /** Whether the brand takes withdrawal requests against a cleared affiliate balance. */
  readonly AFFILIATES_WITHDRAW_REQUEST: boolean;
  /** Whether the brand consolidates invoices at all. */
  readonly INVOICE_CONSOLIDATION_ENABLED: boolean;
  /** Whether only staff may set consolidation — true takes the choice off the client. */
  readonly INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF: boolean;
  /** When the brand itself raises the consolidated invoice — what INHERIT follows. */
  readonly INVOICE_CONSOLIDATION_BASE_RULE: InvoiceConsolidationRuleTypes;
  /** The day the brand's WEEKLY rule falls on. */
  readonly INVOICE_CONSOLIDATION_WEEK_DAY: ConsolidationWeekday;
  /** The day of the month the brand's MONTHLY rule falls on. */
  readonly INVOICE_CONSOLIDATION_DATE: number;
  /** How the brand quotes a recurring price — per cycle, or as a lowest monthly figure. */
  readonly PRICE_DISPLAY_TYPE: PriceDisplayTypes;
  /** Whether a client may ask for a cancellation that takes effect at once. */
  readonly SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION: boolean;
  /** Whether anybody may open an account themselves — legacy's `brand/hasRegistrationEnabled`. */
  readonly CLIENT_REGISTRATION_ENABLED: boolean;
  /** Whether the registration form asks for a phone number. */
  readonly REQUIRE_PHONE_ON_REGISTRATION: boolean;
  /** Whether the logged-out screens carry no platform identity at all. */
  readonly UI_WHITELABEL_LOGIN: boolean;
  /** Whether a CLIENT works the affiliate programme themselves, beside the programme being on at all. */
  readonly UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED: boolean;
  /** Whether a client may settle part of an invoice rather than all of it. */
  readonly PARTIAL_PAYMENTS_ENABLED: boolean;
  /** Whether the brand has tax numbers checked against the registry at all. */
  readonly TAX_NUMBER_VALIDATION_ENABLED: boolean;
  /** Whether a parent account may lend its appearance to the accounts it manages. */
  readonly UI_PARENT_BRANDING_ENABLED: boolean;
  /** What the Enter key does in the reply composer, before the client says otherwise. */
  readonly UI_ENTER_KEY_ACTION: MockEnterKeyAction;
  /**
   * Where the header's logo goes. Set = the mark is an EXTERNAL anchor to
   * this address (legacy's `brandLogoArgs`, `clientHeader.vue:36-42`); unset
   * leaves it the link home.
   */
  readonly UI_LOGO_URL?: string;
  /**
   * Where a NEW referral link points before the client changes it — legacy's
   * `AFFILIATES_DEFAULT_REDIRECT_LINK`, read straight into the form's own
   * `redirect_url` (`addEditAffiliateLinkModal.vue:163-166`). Unset opens the
   * field empty.
   */
  readonly AFFILIATES_DEFAULT_REDIRECT_LINK?: string;
};

/** The gates legacy read off its own brand getters, in legacy's spelling. */
type LegacyBrandGates = {
  readonly UPMIND_AFFILIATES_ENABLED: boolean;
  readonly showStore: boolean;
  /** Whether a client may add credit themselves — legacy's own top-up gate. */
  readonly walletTopUpEnabled: boolean;
  /** Set = the brand sells from its own storefront, so "Place new order" leaves the portal. */
  readonly customStorefrontUrl?: string;
  readonly hideOneTimePurchases: boolean;
  /** Whether registration insists on a password — legacy's `passwordRequired` prop, defaulted true. */
  readonly registrationPasswordRequired: boolean;
  /** Whether the registration form carries Google's reCAPTCHA statement. */
  readonly recaptchaEnabled: boolean;
  /** The brand's own terms, where it publishes them; absent names them without a link. */
  readonly termsUrl?: string;
  /**
   * Whether this brand opens ORGANISATIONS as well as client accounts —
   * legacy served `/register-org` from the Upmind org context alone.
   */
  readonly isUpmindOrgContext: boolean;
};

/** The brand's gate facts — legacy's own `if:` predicates, as per-brand data (plan R8). */
export type MockBrandFeatures = Pick<
  BrandConfigGates,
  | "CLIENT_NOTES_AND_SECRETS_ENABLED"
  | "SUPPORT_PIN_ENABLED"
  | "DISABLE_SUPPORT_SYSTEM"
  | "DEFAULT_CLIENT_HOMEPAGE"
  | "UPMIND_BRANDING_ENABLED"
  | "REQUIRE_REGION_IN_ADDRESS"
  | "CLIENT_ALLOW_ADDRESS_UPDATE"
  | "BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED"
  | "BILLING_GATEWAY_FORCE_AUTO_PAYMENT"
  | "BILLING_GATEWAY_FORCE_CARD_STORAGE"
  | "PREVENT_CARD_REMOVAL_IF_LAST"
  | "CLIENT_TICKET_SCHEDULING_ENABLED"
  | "AFFILIATES_WITHDRAW_REQUEST"
  | "INVOICE_CONSOLIDATION_ENABLED"
  | "INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF"
  | "INVOICE_CONSOLIDATION_BASE_RULE"
  | "INVOICE_CONSOLIDATION_WEEK_DAY"
  | "INVOICE_CONSOLIDATION_DATE"
  | "PRICE_DISPLAY_TYPE"
  | "SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION"
  | "CLIENT_REGISTRATION_ENABLED"
  | "REQUIRE_PHONE_ON_REGISTRATION"
  | "UI_WHITELABEL_LOGIN"
  | "UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED"
  | "PARTIAL_PAYMENTS_ENABLED"
  | "TAX_NUMBER_VALIDATION_ENABLED"
  | "UI_PARENT_BRANDING_ENABLED"
  | "UI_ENTER_KEY_ACTION"
  | "UI_LOGO_URL"
  | "AFFILIATES_DEFAULT_REDIRECT_LINK"
> &
  LegacyBrandGates;

/**
 * Which platform key each gate reads — a rename upstream fails here rather
 * than drifting silently in a seed. `customStorefrontUrl`,
 * `hideOneTimePurchases`, `walletTopUpEnabled`, `registrationPasswordRequired`,
 * `recaptchaEnabled`, `termsUrl` and `isUpmindOrgContext` are absent: no
 * `BrandConfigKeys` member carries them, which is the gap plan R8 records.
 */
export const BRAND_GATE_CONFIG_KEY = {
  CLIENT_NOTES_AND_SECRETS_ENABLED:
    BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED,
  SUPPORT_PIN_ENABLED: BrandConfigKeys.SUPPORT_PIN_ENABLED,
  DISABLE_SUPPORT_SYSTEM: BrandConfigKeys.UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM,
  DEFAULT_CLIENT_HOMEPAGE: BrandConfigKeys.DEFAULT_CLIENT_HOMEPAGE,
  // Org-level, and inverted upstream: the platform asks whether the branding is REMOVED.
  UPMIND_BRANDING_ENABLED: OrgFeatureKeys.REMOVE_UPMIND_BRANDING_ENABLED,
  UPMIND_AFFILIATES_ENABLED: BrandConfigKeys.UPMIND_AFFILIATES_ENABLED,
  UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED:
    BrandConfigKeys.UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED,
  showStore: BrandConfigKeys.SHOW_CLIENT_STORE,
  REQUIRE_REGION_IN_ADDRESS: BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
  CLIENT_ALLOW_ADDRESS_UPDATE: BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE,
  BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED:
    BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED,
  BILLING_GATEWAY_FORCE_AUTO_PAYMENT:
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
  BILLING_GATEWAY_FORCE_CARD_STORAGE:
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
  PREVENT_CARD_REMOVAL_IF_LAST: BrandConfigKeys.PREVENT_CARD_REMOVAL_IF_LAST,
  CLIENT_TICKET_SCHEDULING_ENABLED:
    BrandConfigKeys.CLIENT_TICKET_SCHEDULING_ENABLED,
  AFFILIATES_WITHDRAW_REQUEST: BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST,
  INVOICE_CONSOLIDATION_ENABLED: BrandConfigKeys.INVOICE_CONSOLIDATION_ENABLED,
  INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF:
    BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF,
  INVOICE_CONSOLIDATION_BASE_RULE:
    BrandConfigKeys.INVOICE_CONSOLIDATION_BASE_RULE,
  INVOICE_CONSOLIDATION_WEEK_DAY:
    BrandConfigKeys.INVOICE_CONSOLIDATION_WEEK_DAY,
  INVOICE_CONSOLIDATION_DATE: BrandConfigKeys.INVOICE_CONSOLIDATION_DATE,
  PRICE_DISPLAY_TYPE: BrandConfigKeys.PRICE_DISPLAY_TYPE,
  SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION:
    BrandConfigKeys.SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION,
  // Inverted upstream, as UPMIND_BRANDING_ENABLED is: the platform asks
  // whether the registration forms are HIDDEN.
  CLIENT_REGISTRATION_ENABLED: BrandConfigKeys.DISABLE_CLIENT_REGISTRATION,
  REQUIRE_PHONE_ON_REGISTRATION: BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION,
  UI_WHITELABEL_LOGIN: BrandConfigKeys.UI_WHITELABEL_LOGIN,
  PARTIAL_PAYMENTS_ENABLED: BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
  TAX_NUMBER_VALIDATION_ENABLED: BrandConfigKeys.TAX_NUMBER_VALIDATION_ENABLED,
  UI_PARENT_BRANDING_ENABLED: BrandConfigKeys.UI_PARENT_BRANDING_ENABLED,
  UI_ENTER_KEY_ACTION: BrandConfigKeys.UI_ENTER_KEY_ACTION,
  UI_LOGO_URL: BrandConfigKeys.UI_LOGO_URL,
  AFFILIATES_DEFAULT_REDIRECT_LINK:
    BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK
} as const satisfies Partial<
  Record<keyof MockBrandFeatures, BrandConfigKeys | OrgFeatureKeys>
>;

/**
 * The client's security posture — legacy account/security's facts. Both move:
 * the change-password form stamps the first, the two-factor dialog flips the
 * second (`facades/useMockSecurity.ts`).
 */
export type MockSecurity = {
  passwordChangedAt: string;
  twoFactorEnabled: boolean;
  /**
   * The enrolment secret an authenticator app is given — legacy's
   * `configure2faModal.vue:14-20`, which showed it as a QR image and as the
   * `otpauth://` link behind it. The mock ships no image, so the secret and
   * the URI are the two facts the dialog states.
   */
  readonly twoFactorSecret: string;
};

/**
 * One notes-and-secrets entry — the wire `IVaultAsset` narrowed to the members
 * a client's own panels read (`contracts/client-vault.ts`). `encrypted` is the
 * note/secret axis and `contract_product_id` is the scope axis: null is an
 * account-wide row, an id scopes it to that product. Wire spelling throughout,
 * as `MockChildAccount` is — the values stay plain, as a mock's must.
 */
export type MockVaultAsset = Pick<
  IVaultAsset,
  | "id"
  | "label"
  | "note"
  | "encrypted"
  | "client_id"
  | "contract_product_id"
  | "created_at"
  | "updated_at"
> & {
  /**
   * Kept at the top of its panel — legacy's `u-pin-control`, whose ordering
   * the SERVER did (`vaultProvider.vue:164` deletes the sort so the back end
   * can put pinned rows first). Absent reads as unpinned. Moved by the row's
   * own Pin control.
   */
  pinned?: boolean;
  /** Who wrote it, and who last changed it — legacy's `vaultAssetAuthorSummary`. */
  readonly authorName?: string;
  readonly editorName?: string;
};

/**
 * One postal address the client is invoiced at — the REAL headless `Address`
 * model, whole (plan R1 (a)). It was a `Pick` while nothing was declared
 * against `useClientAddresses`; the address facade is, so the rows are the
 * model the module hands over.
 */
export type MockAddress = Address;

/**
 * One email address the client holds — the REAL `useClientEmails` row, plus
 * the opt-ins its mapper drops.
 *
 * CHANGE (plan §3): legacy tags an address "Receiving notifications" from
 * `IEmail.receive_emails`; `Email.meta` carries no such flag, so the row keeps
 * the OPT-INS that answer derives from until the real module maps it.
 */
export type MockEmail = Email & {
  /**
   * Which `MockDataset.emailTopics` this address is subscribed to. Moved by
   * the opt-in form, and the ONE stored answer: legacy's own
   * `receive_emails` is derived from these server-side and never written, so
   * the facade derives it too (`isReceivingEmails`) rather than holding a
   * second copy to drift from.
   */
  topicOptIns: readonly string[];
};

/**
 * One topic an address may be subscribed to — `INotificationTopic` narrowed to
 * what a per-address opt-in list reads (legacy's `manageEmailTopicOptIns`).
 */
export type MockEmailTopic = {
  readonly id: INotificationTopic["id"];
  readonly label: string;
  /** What the topic covers, in the brand's own words — printed under the label. */
  readonly description?: string;
};

/**
 * The wire's own type codes for a contact row. Headless publishes these as
 * the runtime lists `AddressTypes` / `EmailTypes`, which the types-only fence
 * (facades R3) keeps out of reach — named once here so no seed carries a bare
 * number.
 */
export const MOCK_EMAIL_TYPE = { ACCOUNT: 1 } as const;
export const MOCK_PHONE_TYPE = { MOBILE: 1, OFFICE: 2 } as const;
export const MOCK_ADDRESS_TYPE = { HOME: 1, OFFICE: 2, COMPANY: 4 } as const;

/** How far a row's verification went — the wire's `verified` level, not a flag. */
export const MOCK_VERIFIED_LEVEL = { NONE: 0, VERIFIED: 1 } as const;

/** One phone number the client holds — the REAL `useClientPhones` row. */
export type MockPhone = Phone;

/** One company the client is invoiced as — the REAL `useClientCompanies` row. */
export type MockCompany = Company;

/**
 * One delegate invitation, as its LINK carries it — legacy's
 * `acceptInviteModal`, which read the hash out of the route and either
 * granted the access or said the link was spent.
 */
export type MockDelegateInvite = {
  /** The opaque hash the link carries; the route's own segment. */
  readonly hash: string;
  /** What the invite grants access to — a product, or the whole account. */
  readonly objectType: DelegateObjectTypes;
  /** Which object, where it names one. */
  readonly objectId?: string;
  /** What that object is CALLED, for the sentence to name. */
  readonly objectName?: string;
  /** How many products a whole-account invite reaches — legacy's plural. */
  readonly productCount?: number;
  /** A link already used or timed out reads as spent. */
  readonly isExpired?: boolean;
};

/**
 * One address the client restricts sign-in to — the wire `IIpAddress`
 * (`contracts/client-ip-whitelist.ts`), wire spelling as `MockVaultAsset` is.
 */
export type MockIpAddress = IIpAddress;

/**
 * One answer to a brand- or provider-defined field, in the type that field's
 * own schema declares — a checkbox saves a boolean and a number field a
 * number, so the value round-trips through the form rather than coming back
 * as text. Shared by the client's custom fields and a product's setup
 * blueprint, which are parsed by the same two parsers.
 */
export type MockCustomFieldValue = string | number | boolean;

/**
 * One brand-defined question about the client — the REAL `client-custom-fields`
 * DEFINITION, carrying the answer the wire carries on it (`ICustomField.value`).
 * The definitions feed the form's schema
 * (`contracts/client-custom-fields.schemas.ts`) and the answers are its model,
 * so both halves stay one row.
 */
export type MockClientCustomField = CustomField & {
  value: MockCustomFieldValue;
};

/**
 * One row of the notification preference matrix — a topic and whether the
 * client receives it on each channel (`contracts/user-notifications.ts`).
 * Read-only: editing is a form (gap doc tier B).
 */
export type MockNotificationPreference = {
  readonly topic: INotificationTopic["id"];
  readonly label: string;
  /** The client cannot opt out — legacy locked these rows. */
  readonly mandatory: INotificationTopic["mandatory"];
  /** One flag per channel the brand notifies on. Moved by the preferences form. */
  readonly channels: Record<
    NotificationChannelCodes.EMAIL | NotificationChannelCodes.IN_APP,
    boolean
  >;
};

/**
 * The six figures legacy's affiliate stats grid carries. Money is data
 * (plan R6): the balances are amounts the server already summed, never a
 * total this layer adds up.
 */
export type MockAffiliateStats = {
  readonly visits: number;
  readonly referrals: number;
  /** Earned, not yet cleared for payout. */
  readonly pendingBalance: MockMoney;
  /** Cleared and waiting to be withdrawn. Emptied by a withdrawal request. */
  availableBalance: MockMoney;
  /** Already paid out. */
  readonly withdrawnBalance: MockMoney;
};

/** One referral link the affiliate hands out, and what it has brought in. */
export type MockAffiliateLink = {
  readonly id: string;
  /** The client's own name for it; moved by the edit form. */
  name: string;
  /** The link itself — what the Copy control puts on the clipboard. */
  readonly url: string;
  /** Where following it lands — the brand page the link points at. */
  redirectUrl: string;
  readonly clicks: number;
  readonly signups: number;
  readonly createdAt: string;
};

/**
 * One account this affiliate brought in. The client is ANONYMISED, as
 * legacy's table showed it — an affiliate is told that someone signed up,
 * never who.
 */
export type MockAffiliateReferral = {
  readonly id: string;
  readonly client: string;
  readonly linkId: string;
  readonly date: string;
};

/** How the outcome of a payout reads. */
export const MOCK_PAYOUT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed"
} as const;

export type MockPayoutStatus =
  (typeof MOCK_PAYOUT_STATUS)[keyof typeof MOCK_PAYOUT_STATUS];

/** One commission this affiliate has earned — legacy's commissions history row. */
/**
 * Where one commission stands — legacy's six readings
 * (`commissionSummary.vue:62-186`), which decide both the row's sentence and
 * the tone its amount wears (`commissionAmountTag.vue:45-58`).
 */
export const MOCK_COMMISSION_STATUS = {
  REJECTED: "rejected",
  AWAITING_PAYMENT: "awaiting-payment",
  PENDING_APPROVAL: "pending-approval",
  ON_HOLD: "on-hold",
  CANCELLED: "cancelled",
  APPROVED: "approved"
} as const;

export type MockCommissionStatus =
  (typeof MOCK_COMMISSION_STATUS)[keyof typeof MOCK_COMMISSION_STATUS];

export type MockAffiliateCommission = {
  readonly id: string;
  readonly description: string;
  readonly earnedAt: string;
  readonly amount: MockMoney;
  readonly status: MockCommissionStatus;
  /** When it was rejected — the rejected reading names the day. */
  readonly rejectedAt?: string;
  /** Why it was rejected; absent is legacy's "(no reason)" branch. */
  readonly rejectReason?: string;
  /** When approval is expected, or the day it was approved. */
  readonly payoutCalculatedAt?: string;
  readonly approvedAt?: string;
};

/** One transfer already requested — where it went, how it went, and why not. */
export type MockAffiliatePayout = {
  readonly id: string;
  /** The day it was asked for. */
  readonly requestedAt: string;
  /** The day it settled; absent while it is still pending. */
  readonly paidAt?: string;
  readonly amount: MockMoney;
  readonly destination: AffiliatePayoutDestinationCode;
  readonly status: MockPayoutStatus;
  /** The failure detail legacy printed beside a failed payout. */
  readonly error?: string;
  /** What the client said when they asked for it — legacy's withdrawal message. */
  readonly message?: string;
};

/** The affiliate programme's mock records — legacy affiliate overview/commissions/payouts (gated). */
export type MockAffiliate = {
  /** Whether the client has JOINED the programme; false renders the enrol screen. */
  enrolled: boolean;
  /** Whether the brand has suspended the account; true renders the notice and nothing else. */
  readonly disabled: boolean;
  /** The day the client joined (ISO date); absent until they do. Set by the enrol action. */
  since?: string;
  readonly referralLink: string;
  readonly balance: MockMoney;
  readonly stats: MockAffiliateStats;
  readonly links: MockAffiliateLink[];
  readonly referrals: readonly MockAffiliateReferral[];
  /** Where withdrawals are sent; moved by the payout-destination form. */
  payoutDestination: {
    code: AffiliatePayoutDestinationCode;
    /** The address or account the code resolves to — a PayPal email, a wallet. */
    detail: string;
  };
  readonly commissions: readonly MockAffiliateCommission[];
  /** Mutable: a withdrawal request lodges a pending transfer at the top. */
  readonly payouts: MockAffiliatePayout[];
};

/**
 * One brand-authored template slot, filled (plan R12). The CODE is the
 * platform's own slot vocabulary; the body is what
 * `ClientAreaTemplate["body"]` carries once the slot is rendered.
 *
 * CHANGE (plan §3): `system-client-area` publishes `ClientTemplateSlot` and
 * `ClientAreaTemplate` from its own files but the package root re-exports
 * neither, so the row keys off the wire model instead until it does.
 */
export type MockTemplateSlot = {
  readonly code: IClientTemplateSlot["code"];
  /** The authored markdown — the slot's rendered body. */
  readonly body: string;
};

/**
 * One brand-authored custom page — the wire `ICustomPage`'s own fields, plus
 * the BODY the client area renders (a template slot on the wire, plan R12,
 * which a mock has no second request to fetch it with).
 */
export type MockCustomPage = Pick<ICustomPage, "slug" | "title"> & {
  /** Authored markdown; absent on a page that embeds somebody else's. */
  readonly body?: string;
  /** The page this one embeds instead — legacy's iframe-typed custom page. */
  readonly iframeUrl?: string;
  readonly showOnMenu: ICustomPage["show_on_menu"];
};

/** One brand's whole mock world — seeded per brand, mutated in memory only. */
export type MockDataset = {
  /** Mutable: logging in as a child account swaps it, and ending that restores it (plan R10). */
  persona: MockPersona;
  /** Who the brand IS on a document it raises — the party block opposite the client's. */
  readonly brand: MockParty;
  readonly features: MockBrandFeatures;
  readonly security: MockSecurity;
  readonly vault: MockVaultAsset[];
  /** The client's own contact data — the four REAL scoped collections' rows. */
  readonly emails: MockEmail[];
  readonly phones: MockPhone[];
  readonly addresses: MockAddress[];
  readonly companies: MockCompany[];
  /** The delegate invitations outstanding against this account — one row per link sent. */
  readonly delegateInvites: readonly MockDelegateInvite[];
  /** The brand's own questions about this client, each carrying its answer. */
  readonly customFields: readonly MockClientCustomField[];
  /** Where this account may sign in from; empty means anywhere. */
  readonly ipWhitelist: MockIpAddress[];
  /** Which topics reach this client on which channel; moved by the preferences form. */
  readonly notificationPreferences: readonly MockNotificationPreference[];
  /** The topics ONE address may be subscribed to on its own — the opt-in page's choices. */
  readonly emailTopics: readonly MockEmailTopic[];
  readonly affiliate: MockAffiliate | null;
  readonly products: MockProduct[];
  readonly catalogue: readonly MockCatalogueItem[];
  readonly invoices: MockInvoice[];
  readonly orders: MockOrder[];
  readonly creditNotes: MockCreditNote[];
  readonly paymentMethods: MockPaymentMethod[];
  /** The gateways this brand has enabled; none means nothing can be stored. */
  readonly gateways: readonly MockGateway[];
  readonly wallet: MockWallet;
  /** How this client is billed — the settings page's one form. */
  readonly billingSettings: MockBillingSettings;
  /** The price lists this client may be quoted from; one means no choice. */
  readonly priceLists: readonly MockPriceList[];
  /**
   * What one unit of the brand's own currency (`billingSettings.currency`)
   * buys in each currency the brand takes payment in. Empty means the brand
   * publishes no rate, so nothing but the document's own currency is payable.
   */
  readonly currencyRates: Readonly<Record<string, number>>;
  /** The brand's own questions asked when a client cancels a product. */
  readonly cancellationFields: readonly MockClientCustomField[];
  readonly tickets: MockTicket[];
  /** The desks the brand publishes; one means the new-ticket form asks nobody to choose. */
  readonly departments: readonly MockTicketDepartment[];
  readonly notifications: MockNotification[];
  readonly delegates: MockDelegate[];
  readonly childAccounts: MockChildAccount[];
  /** The appearance children inherit; null where the brand lends none. */
  readonly parentBranding: MockParentBranding | null;
  /** Mutable: a resend appends a fresh row, and a retry moves an errored one. */
  /** The brand's own warning that mail is running behind — legacy's delivery-delay notice. */
  readonly emailDeliveryDelayed: boolean;
  readonly loginAttempts: MockLoginAttempt[];
  /** What the brand has written into each client-area slot (plan R12). */
  readonly templates: readonly MockTemplateSlot[];
  /** The brand's own extra pages, some of them in the primary nav. */
  readonly customPages: readonly MockCustomPage[];
};
