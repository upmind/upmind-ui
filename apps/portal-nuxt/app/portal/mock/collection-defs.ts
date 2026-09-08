// -----------------------------------------------------------------------------
/**
 * @module portal/mock/collection-defs
 * @description One definition per paged panel (plan §3): each binds a
 * `MockDataset` array to the four-layer collection generic, with the panel's
 * preset narrowing and its named runtime filters. The exemplar —
 * `receivedEmailsCollection` — is typed member-for-member against the REAL
 * `useClientReceivedEmails` module's exported types, so the go-real swap is a
 * source change, never a template change. Sibling status panels are separate
 * instances (plan R6), as legacy's tabs were separate list requests.
 *
 * `DataRouteContext` reaches a definition two ways, deliberately together:
 * the `make` closure narrows ROWS by it, and the `contextKey` discriminator
 * keys PAGE STATE by it — one without the other leaks rows or page indexes
 * across contexts.
 */

import {
  ContractStatusCodes,
  FraudStatus,
  InvoiceStatusGroups,
  SentEmailStatus,
  TicketStatusCodes
} from "@upmind-automation/types";
import {
  AMOUNT_BAND_OPTIONS,
  COUNT_BAND_OPTIONS,
  MOCK_ACCESS_TYPE,
  MOCK_FILTER_FLAG,
  dateRangeFilter,
  flagOptions,
  matchesAmountBand,
  matchesAny,
  matchesCountBand,
  matchesContains,
  matchesDateRange,
  matchesFrom,
  matchesUntil,
  matchesExact,
  matchesFlag,
  optionsPresent,
  presentControls,
  selectFilter,
  toggleFilter
} from "./collection-filters";
import { defineMockCollection } from "./collections";
import {
  CREDIT_NOTE_STATUS_LABEL,
  creditNoteState,
  FRAUD_STATUS_LABEL,
  INVOICE_STATUS_LABEL,
  PRODUCT_STATUS_LABEL,
  TICKET_STATUS_LABEL
} from "./status-labels";
import { MOCK_DELEGATE_STATUS, MOCK_INVOICE_CATEGORY } from "./types";
import { pinnedFirst } from "./vault-order";
import { filter, flatMap, includes, map } from "lodash-es";
import type { MockFilterControl } from "./collection-filters";
import type {
  MockCollectionDefinition,
  MockFilterCriteria,
  MockSortOption,
  MockSortOptionDescriptor
} from "./collections";
import type {
  AffiliateCommissionsFilters,
  AffiliateLinksFilters,
  AffiliatePayoutsFilters,
  AffiliateReferralsFilters,
  ClientChildAccountsFilters,
  UserNotificationsFilters,
  ClientContractProductsFilters,
  ClientDelegatesFilters,
  ClientCreditNotesFilters,
  ClientInvoicesFilters,
  ClientLoginAttemptsFilters,
  ClientTicketsFilters,
  ClientWalletStatementsFilters
} from "./contracts";
import type { DataRouteContext } from "./injection";
import type {
  MockAffiliateCommission,
  MockAffiliateLink,
  MockAffiliatePayout,
  MockAffiliateReferral,
  MockChildAccount,
  MockCreditNote,
  MockCreditStatement,
  MockDataset,
  MockDelegate,
  MockEmail,
  MockInvoice,
  MockIpAddress,
  MockLoginAttempt,
  MockNotification,
  MockNotificationPreference,
  MockProduct,
  MockTicket,
  MockVaultAsset
} from "./types";
import type { PaginationInfo } from "@upmind-automation/headless";
import type { InvoiceStatus } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

type NoFilters = Record<string, never>;

/**
 * What a panel's control band offers, resolved per instance: the same route
 * context that narrows the ROWS words the controls, so a status the showing
 * tab cannot contain never appears as a choice.
 */
type MockPanelOptions<TRow> = {
  /** Items per page; the platform default when absent. */
  readonly limit?: number;
  /** Props the core's `criteria.query` narrowing reads (plan §3). */
  readonly searchProps?: readonly string[];
  /** The named orders this panel's controls offer (plan §3). */
  readonly sortOptions?: readonly MockSortOption<TRow>[];
  /** The narrowings the band offers; each key is a criteria key `source` reads (R5). */
  readonly filterControls?: readonly MockFilterControl[];
};

type MockPanel<TRow> = (
  data: MockDataset,
  context: DataRouteContext
) => MockPanelOptions<TRow>;

type MockSource<TRow> = (
  data: MockDataset,
  context: DataRouteContext,
  criteria: MockFilterCriteria
) => readonly TRow[];

/** A definition with no runtime filter map — the panel's narrowing is preset, or absent. */
function simpleCollection<TRow>(
  source: MockSource<TRow>,
  contextKey?: (context: DataRouteContext) => string,
  panel?: MockPanel<TRow>
): MockCollectionDefinition<TRow, NoFilters> {
  return defineMockCollection<TRow, NoFilters>((data, context) => {
    const options = panel?.(data, context);
    return {
      source: criteria => source(data, context, criteria),
      filters: () => ({}),
      limit: options?.limit,
      searchProps: options?.searchProps,
      sortOptions: options?.sortOptions,
      filterControls: options?.filterControls
    };
  }, contextKey);
}

/**
 * A definition carrying its module's OWN named filter map, typed from the
 * contract (`contracts/`) the future module will export — the headless
 * mirror. The band writes the same criteria keys through
 * `applyNamedFilter`, in the mock's own string spelling; the typed map is
 * recorded, and inert, exactly as `sort` is (plan R5, S3).
 */
function filteredCollection<TRow, TFilters>(
  source: MockSource<TRow>,
  filters: (apply: (patch: MockFilterCriteria) => void) => TFilters,
  contextKey?: (context: DataRouteContext) => string,
  panel?: MockPanel<TRow>
): MockCollectionDefinition<TRow, TFilters> {
  return defineMockCollection<TRow, TFilters>((data, context) => {
    const options = panel?.(data, context);
    return {
      source: criteria => source(data, context, criteria),
      filters,
      limit: options?.limit,
      searchProps: options?.searchProps,
      sortOptions: options?.sortOptions,
      filterControls: options?.filterControls
    };
  }, contextKey);
}

// --- account pillar

/**
 * Legacy's All / Sent / Failed / Bounced email tabs. "Failed" is legacy's
 * word for the ERROR state — the enum's own spelling stays on the wire.
 */
export const EMAIL_STATUS_TAB = {
  ALL: "all",
  SENT: SentEmailStatus.SENT,
  FAILED: SentEmailStatus.ERROR,
  BOUNCED: SentEmailStatus.BOUNCED
} as const;

/** Legacy's dropdown rail, as the verb spells its choices. */
export const NOTIFICATION_FILTER = {
  ALL: "all",
  READ: "read",
  UNREAD: "unread"
} as const;

export type NotificationFilter =
  (typeof NOTIFICATION_FILTER)[keyof typeof NOTIFICATION_FILTER];

/**
 * The rail's choice, as the collection's own `read` criteria. "All" clears
 * the key, which is how every declared filter spells "narrows nothing".
 */
export const NOTIFICATION_FILTER_KEY = "read";

export const NOTIFICATION_FILTER_CRITERIA: Readonly<
  Record<NotificationFilter, string>
> = {
  [NOTIFICATION_FILTER.ALL]: "",
  [NOTIFICATION_FILTER.READ]: MOCK_FILTER_FLAG.YES,
  [NOTIFICATION_FILTER.UNREAD]: MOCK_FILTER_FLAG.NO
};

/** Legacy's dropdown rail: everything, only what has been read, or only what has not. */
const NOTIFICATION_FILTER_CONTROLS: readonly MockFilterControl[] = [
  toggleFilter(
    NOTIFICATION_FILTER_KEY,
    "Showing",
    flagOptions("Read", "Unread")
  )
];

/** Newest first — the seed order stands in for the module's `created_at` DESC. */
function newestNotifications(data: MockDataset): MockNotification[] {
  return [...data.notifications].sort((a, b) =>
    b.sentAt.localeCompare(a.sentAt)
  );
}

/**
 * The topbar dropdown's own feed — a SECOND instance over the same rows, not
 * the page's. The two are different surfaces with different controls: the
 * dropdown narrows by its rail and accumulates on load-more, the page pages.
 * Sharing one instance made the dropdown's Load more advance the page behind
 * it (plan R6 — one instance per surface).
 */
export const notificationFeedCollection = filteredCollection<
  MockNotification,
  UserNotificationsFilters
>(
  (data, context, criteria) =>
    filter(newestNotifications(data), notification =>
      matchesFlag(notification.read, criteria.read)
    ),
  apply => ({ read: value => apply({ read: value }) }),
  undefined,
  () => ({ filterControls: NOTIFICATION_FILTER_CONTROLS })
);

/** The notifications PAGE's own list — paged, with no rail of its own. */
export const notificationsCollection = simpleCollection(newestNotifications);

/** Legacy's whitelist — read and removed here; adding one is a form (tier B). */
/**
 * The addresses sign-in is restricted to. Searched by the address itself and
 * by the name the client knows it by — legacy's own two columns
 * (`ipWhitelistTags.vue:10-17`).
 */
export const ipWhitelistCollection = filteredCollection<
  MockIpAddress,
  NoFilters
>(
  (data): readonly MockIpAddress[] => data.ipWhitelist,
  () => ({}),
  undefined,
  () => ({ searchProps: ["ip_address", "name"] })
);

/** The preference matrix, as the page's read-only table (plan §3). */
export const notificationPreferencesCollection = simpleCollection(
  (data): readonly MockNotificationPreference[] => data.notificationPreferences
);

// --- contact data: the client's emails, the one contact collection the token
// opt-ins page still reads (the rest is client-vue's).

export const clientEmailsCollection = filteredCollection<
  MockEmail,
  { query: (value: string) => void }
>(
  (data): readonly MockEmail[] => data.emails,
  apply => ({ query: value => apply({ query: value }) }),
  undefined,
  () => ({ searchProps: ["email", "title"] })
);

/**
 * The vault, split the way legacy's panels are: notes on one side, secrets on
 * the other, and the account's own rows are those scoped to no product
 * (`contracts/client-vault.ts` — `contract_product_id` is that axis).
 */
function accountVaultAssets(
  data: MockDataset,
  encrypted: boolean
): MockVaultAsset[] {
  // Pinned first, as legacy's own back end ordered them (`vaultProvider.vue:164`).
  return pinnedFirst(
    filter(
      data.vault,
      asset =>
        asset.contract_product_id === null && asset.encrypted === encrypted
    )
  );
}

export const accountNotesCollection = simpleCollection(data =>
  accountVaultAssets(data, false)
);

export const accountSecretsCollection = simpleCollection(data =>
  accountVaultAssets(data, true)
);

/** Legacy's one delegate control: everything on the account, or only what is named for them. */
const DELEGATE_FILTER_CONTROLS: readonly MockFilterControl[] = [
  toggleFilter("accessType", "Access", [
    { value: MOCK_ACCESS_TYPE.FULL, label: "Full access" },
    { value: MOCK_ACCESS_TYPE.SPECIFIC, label: "Specific" }
  ]),
  // Legacy's own two (`data/filters/clientDelegates.ts`): whether the
  // invitation has been taken up, and whether the grant is the whole account.
  // Both are its Yes/No radios, and the contract types both as booleans, so
  // both ride `flagOptions` — `accessType` stays beside them, the same fact
  // `is_full_delegate` states in the words the rows already wear.
  toggleFilter("active", "Invitation", flagOptions("Accepted", "Pending")),
  toggleFilter("isFullDelegate", "Full access", flagOptions("Yes", "No"))
];

/**
 * Legacy's three sorters (`data/sorters/clientDelegates.ts`). Its own file
 * lists full access first, but that is the MENU's order, not the order the
 * table opened in — the opening order here is the first declared option
 * (`collections.ts`), and every other listing in this build opens newest
 * first. A client meeting their delegates wants the one they just invited.
 */
const DELEGATE_SORT_OPTIONS: readonly MockSortOption<MockDelegate>[] = [
  {
    value: "invited",
    label: "Recently invited",
    compare: (a, b) => b.invitedAt.localeCompare(a.invitedAt)
  },
  {
    value: "full-access",
    label: "Full access first",
    compare: (a, b) =>
      Number(b.isFullDelegate === true) - Number(a.isFullDelegate === true)
  },
  {
    value: "active",
    label: "Accepted first",
    compare: (a, b) =>
      Number(b.status === MOCK_DELEGATE_STATUS.ACCEPTED) -
      Number(a.status === MOCK_DELEGATE_STATUS.ACCEPTED)
  }
];

function delegateAccessType(delegate: MockDelegate): string {
  if (delegate.isFullDelegate) return MOCK_ACCESS_TYPE.FULL;
  return MOCK_ACCESS_TYPE.SPECIFIC;
}

export const accountDelegatesCollection = filteredCollection<
  MockDelegate,
  ClientDelegatesFilters
>(
  (data, context, criteria) =>
    filter(
      data.delegates,
      delegate =>
        matchesExact(delegateAccessType(delegate), criteria.accessType) &&
        matchesFlag(
          delegate.status === MOCK_DELEGATE_STATUS.ACCEPTED,
          criteria.active
        ) &&
        matchesFlag(delegate.isFullDelegate === true, criteria.isFullDelegate)
    ),
  apply => ({
    query: value => apply({ query: value }),
    active: value => apply({ active: value }),
    isFullDelegate: value => apply({ isFullDelegate: value })
  }),
  undefined,
  () => ({
    // Legacy's `invite_email` CONTAINS filter is the band's own search here,
    // as every other listing spells free text; the name goes with it, since
    // the row states both.
    searchProps: ["email", "name"],
    sortOptions: DELEGATE_SORT_OPTIONS,
    filterControls: DELEGATE_FILTER_CONTROLS
  })
);

/**
 * The products and threads ONE delegate may be granted — legacy's own grant
 * pickers (`delegateCProdListing.vue:5-30`,
 * `clientDelegateTicketsListing.vue:5-30`), each of which mounted the listing
 * it grants from, toolbar and all. A quick search is what a client reaches
 * for on a long shelf before any filter.
 */
export const delegateProductsCollection = simpleCollection(
  data => data.products,
  context => context.entityId ?? "",
  () => ({
    searchProps: ["name", "category", "serviceIdentifier"],
    sortOptions: DELEGATE_GRANT_PRODUCT_SORTS
  })
);

const DELEGATE_GRANT_PRODUCT_SORTS: readonly MockSortOption<MockProduct>[] = [
  {
    value: "name",
    label: "By name",
    compare: (a, b) => a.name.localeCompare(b.name)
  },
  {
    value: "newest",
    label: "Newest first",
    compare: (a, b) => b.createdAt.localeCompare(a.createdAt)
  }
];

export const delegateTicketsCollection = simpleCollection(
  data => data.tickets,
  context => context.entityId ?? "",
  () => ({
    searchProps: ["reference", "subject", "department"],
    sortOptions: DELEGATE_GRANT_TICKET_SORTS
  })
);

const DELEGATE_GRANT_TICKET_SORTS: readonly MockSortOption<MockTicket>[] = [
  {
    value: "newest",
    label: "Newest first",
    compare: (a, b) => b.createdAt.localeCompare(a.createdAt)
  },
  {
    value: "subject",
    label: "By subject",
    compare: (a, b) => a.subject.localeCompare(b.subject)
  }
];

/** Legacy's child rows split on the switch that decides whether "Log in as" appears at all. */
const CHILD_ACCOUNT_FILTER_CONTROLS: readonly MockFilterControl[] = [
  toggleFilter(
    "allowImpersonation",
    "Log in as",
    flagOptions("Allowed", "Not allowed")
  ),
  // Legacy's own pair beside it (`data/filters/childAccounts.ts:18-32`).
  toggleFilter(
    "inheritPaymentDetails",
    "Payment details",
    flagOptions("Inherited", "Their own")
  ),
  dateRangeFilter("dateCreated", "Added")
];

/**
 * Legacy's `DefaultSorters` for the relations listing, in its own order:
 * the child's name and the day the relation was made
 * (`data/sorters/childAccounts.ts:5-9`). Legacy sorted a PERSON — first name
 * then last name — and a relation here names the ACCOUNT, one string, so its
 * two name sorters are this one. There is no address sorter: legacy published
 * none, and a control the table never offered is a control nobody asked for.
 */
const CHILD_ACCOUNT_SORT_OPTIONS: readonly MockSortOption<MockChildAccount>[] =
  [
    {
      value: "name",
      label: "By name",
      compare: (a, b) => a.name.localeCompare(b.name)
    },
    {
      value: "added",
      label: "Recently added",
      compare: (a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")
    }
  ];

export const childAccountsCollection = filteredCollection<
  MockChildAccount,
  ClientChildAccountsFilters
>(
  (data, context, criteria) =>
    filter(
      data.childAccounts,
      child =>
        matchesFlag(child.allow_impersonation, criteria.allowImpersonation) &&
        matchesFlag(
          child.inherit_payment_details,
          criteria.inheritPaymentDetails
        ) &&
        matchesDateRange(child.created_at, criteria.dateCreated)
    ),
  apply => ({
    query: value => apply({ query: value }),
    allowImpersonation: value => apply({ allowImpersonation: value }),
    inheritPaymentDetails: value => apply({ inheritPaymentDetails: value }),
    dateCreated: value => apply({ dateCreated: value })
  }),
  undefined,
  () => ({
    // Legacy narrowed the child's own name and address
    // (`data/filters/childAccounts.ts`: firstname, lastname, default email),
    // which the band spells as one search box.
    searchProps: ["name", "email"],
    sortOptions: CHILD_ACCOUNT_SORT_OPTIONS,
    filterControls: CHILD_ACCOUNT_FILTER_CONTROLS
  })
);

/**
 * Legacy's commissions toolbar (`commissionsHistoryTable.vue:10-16`) — over
 * what period it was earned, and which end of that period to read from.
 */
const AFFILIATE_COMMISSION_CONTROLS: readonly MockFilterControl[] = [
  dateRangeFilter("dateCreated", "Earned")
];

const AFFILIATE_COMMISSION_SORTS: readonly MockSortOption<MockAffiliateCommission>[] =
  [
    {
      value: "newest",
      label: "Newest first",
      compare: (a, b) => b.earnedAt.localeCompare(a.earnedAt)
    },
    {
      value: "oldest",
      label: "Oldest first",
      compare: (a, b) => a.earnedAt.localeCompare(b.earnedAt)
    },
    // Legacy's own `amount` sorter (`AffiliateCommissionsSorters`). Money is
    // DATA here (plan R6), so the largest is a comparison of figures rather
    // than a parse of a display string.
    {
      value: "amount",
      label: "Largest first",
      compare: (a, b) => b.amount.amount - a.amount.amount
    }
  ];

export const affiliateCommissionsCollection = filteredCollection<
  MockAffiliateCommission,
  AffiliateCommissionsFilters
>(
  (data, context, criteria) =>
    filter(data.affiliate?.commissions ?? [], commission =>
      matchesDateRange(commission.earnedAt, criteria.dateCreated)
    ),
  apply => ({ dateCreated: value => apply({ dateCreated: value }) }),
  undefined,
  () => ({
    sortOptions: AFFILIATE_COMMISSION_SORTS,
    filterControls: AFFILIATE_COMMISSION_CONTROLS
  })
);

/**
 * Legacy's payouts toolbar (`payoutsHistoryTable.vue:10-16`) — when it
 * settled, and the same two ends to read it from. A payout still pending has
 * no settled day, so the window never catches one.
 */
const AFFILIATE_PAYOUT_CONTROLS: readonly MockFilterControl[] = [
  dateRangeFilter("datePaid", "Paid")
];

const AFFILIATE_PAYOUT_SORTS: readonly MockSortOption<MockAffiliatePayout>[] = [
  {
    value: "newest",
    label: "Newest first",
    compare: (a, b) => b.requestedAt.localeCompare(a.requestedAt)
  },
  {
    value: "oldest",
    label: "Oldest first",
    compare: (a, b) => a.requestedAt.localeCompare(b.requestedAt)
  },
  // Legacy's own `amount` sorter (`AffiliatePayoutSorters`).
  {
    value: "amount",
    label: "Largest first",
    compare: (a, b) => b.amount.amount - a.amount.amount
  }
];

export const affiliatePayoutsCollection = filteredCollection<
  MockAffiliatePayout,
  AffiliatePayoutsFilters
>(
  (data, context, criteria) =>
    filter(data.affiliate?.payouts ?? [], payout =>
      matchesDateRange(payout.paidAt, criteria.datePaid)
    ),
  apply => ({ datePaid: value => apply({ datePaid: value }) }),
  undefined,
  () => ({
    sortOptions: AFFILIATE_PAYOUT_SORTS,
    filterControls: AFFILIATE_PAYOUT_CONTROLS
  })
);

/**
 * Legacy's links table (`affiliateLinksTable.vue:10-15,237`) — searched by
 * name and redirect, ordered by how well each one has done.
 */
const AFFILIATE_LINK_SORTS: readonly MockSortOption<MockAffiliateLink>[] = [
  // Newest FIRST, as every other listing here opens: the panel's opening
  // order is the first declared option (`collections.ts`), and a client
  // meeting their links wants the one they just made, not the one that has
  // been collecting clicks longest.
  {
    value: "newest",
    label: "Newest first",
    compare: (a, b) => b.createdAt.localeCompare(a.createdAt)
  },
  {
    value: "visits",
    label: "Most visits",
    compare: (a, b) => b.clicks - a.clicks
  },
  {
    value: "referrals",
    label: "Most referrals",
    compare: (a, b) => b.signups - a.signups
  }
];

/**
 * Legacy's link filters (`filters/affiliate.ts:6-34`): the two counts and the
 * day it was made. The counts band rather than match a figure exactly.
 */
const AFFILIATE_LINK_FILTER_CONTROLS: readonly MockFilterControl[] = [
  selectFilter("visits", "Visits", "Any visits", COUNT_BAND_OPTIONS),
  selectFilter("referrals", "Referrals", "Any referrals", COUNT_BAND_OPTIONS),
  dateRangeFilter("dateCreated", "Created")
];

export const affiliateLinksCollection = filteredCollection<
  MockAffiliateLink,
  AffiliateLinksFilters
>(
  (data, context, criteria) =>
    filter(data.affiliate?.links ?? [], link =>
      matchesLinkCriteria(link, criteria)
    ),
  apply => ({
    query: value => apply({ query: value }),
    visits: value => apply({ visits: value }),
    referrals: value => apply({ referrals: value }),
    dateCreated: value => apply({ dateCreated: value })
  }),
  undefined,
  () => ({
    searchProps: ["name", "redirectUrl"],
    sortOptions: AFFILIATE_LINK_SORTS,
    filterControls: AFFILIATE_LINK_FILTER_CONTROLS
  })
);

function matchesLinkCriteria(
  link: MockAffiliateLink,
  criteria: MockFilterCriteria
): boolean {
  return (
    matchesCountBand(link.clicks, criteria.visits) &&
    matchesCountBand(link.signups, criteria.referrals) &&
    matchesDateRange(link.createdAt, criteria.dateCreated)
  );
}

/**
 * Legacy's referrals filters: which link brought them in, and over what
 * period. The link options are the affiliate's OWN links, so a link deleted
 * from the table stops being a choice.
 */
function affiliateReferralControls(data: MockDataset): MockFilterControl[] {
  return presentControls([
    selectFilter(
      "linkId",
      "Link",
      "Every link",
      map(data.affiliate?.links ?? [], link => ({
        value: link.id,
        label: link.name
      }))
    ),
    dateRangeFilter("dateCreated", "When")
  ]);
}

export const affiliateReferralsCollection = filteredCollection<
  MockAffiliateReferral,
  AffiliateReferralsFilters
>(
  (data, context, criteria) =>
    filter(
      data.affiliate?.referrals ?? [],
      referral =>
        matchesExact(referral.linkId, criteria.linkId) &&
        matchesDateRange(referral.date, criteria.dateCreated)
    ),
  apply => ({
    linkId: value => apply({ linkId: value }),
    dateCreated: value => apply({ dateCreated: value })
  }),
  undefined,
  data => ({
    searchProps: ["client"],
    sortOptions: AFFILIATE_REFERRAL_SORTS,
    filterControls: affiliateReferralControls(data)
  })
);

/**
 * Legacy's own referrals order (`affiliateReferralsTable.vue:9-21,269-275`):
 * the day the referral landed, read from either end. `date` is ISO in every
 * seed, so the string order IS the date order.
 */
const AFFILIATE_REFERRAL_SORTS: readonly MockSortOption<MockAffiliateReferral>[] =
  [
    {
      value: "newest",
      label: "Newest first",
      compare: (a, b) => b.date.localeCompare(a.date)
    },
    {
      value: "oldest",
      label: "Oldest first",
      compare: (a, b) => a.date.localeCompare(b.date)
    }
  ];

/** Legacy's sign-in log filters: which attempts, and over what period. */
/**
 * The band's controls write the SAME criteria keys the module's own named
 * filters do (`ClientLoginAttemptsFilters`). A control keyed differently from
 * the contract leaves the published seam inert: `filters.successful(...)`
 * would narrow nothing while the band beside it worked.
 */
const LOGIN_ATTEMPT_FILTER_CONTROLS: readonly MockFilterControl[] = [
  toggleFilter("successful", "Outcome", flagOptions("Succeeded", "Failed")),
  dateRangeFilter("dateCreated", "When")
];

/** Legacy's `DefaultSorters` for the sign-in log, in its own order. */
const LOGIN_ATTEMPT_SORT_OPTIONS: readonly MockSortOption<MockLoginAttempt>[] =
  [
    {
      value: "newest",
      label: "Newest first",
      compare: (a, b) => b.at.localeCompare(a.at)
    },
    {
      value: "ip",
      label: "By address",
      compare: (a, b) => a.ip.localeCompare(b.ip)
    },
    {
      value: "status",
      label: "Succeeded first",
      compare: (a, b) => Number(b.succeeded) - Number(a.succeeded)
    }
  ];

export const loginAttemptsCollection = filteredCollection<
  MockLoginAttempt,
  ClientLoginAttemptsFilters
>(
  (data, context, criteria) =>
    filter(
      data.loginAttempts,
      attempt =>
        matchesFlag(attempt.succeeded, criteria.successful) &&
        matchesDateRange(attempt.at, criteria.dateCreated)
    ),
  apply => ({
    query: value => apply({ query: value }),
    successful: value => apply({ successful: value }),
    dateCreated: value => apply({ dateCreated: value })
  }),
  undefined,
  () => ({
    // Legacy's `ip_address` CONTAINS filter — free text over the one column
    // it narrowed, which is what the band's search already is.
    searchProps: ["ip"],
    sortOptions: LOGIN_ATTEMPT_SORT_OPTIONS,
    filterControls: LOGIN_ATTEMPT_FILTER_CONTROLS
  })
);

// --- billing pillar

/**
 * Legacy's All / Unpaid / Paid / Credited invoice tabs, as one collection
 * narrowed by the route's `status`. Absent reads as ALL: unlike a cancelled
 * product, a paid invoice is not noise — it is the client's own record — so
 * the page opens on the whole ledger and the unpaid rows keep their Pay
 * action and warning tone wherever they appear.
 */
export const INVOICE_STATUS_TAB = {
  ALL: "all",
  UNPAID: "unpaid",
  PAID: "paid",
  CREDITED: "credited"
} as const;

export type InvoiceStatusTab =
  (typeof INVOICE_STATUS_TAB)[keyof typeof INVOICE_STATUS_TAB];

/**
 * Each tab's wire statuses — the platform's own grouping (`InvoiceStatusGroups`),
 * which is what legacy's tabs filtered on: Unpaid also carries overdue and
 * adjusted, Credited carries refunded and cancelled.
 */
const INVOICE_TAB_STATUSES: Readonly<
  Record<InvoiceStatusTab, readonly InvoiceStatus[]>
> = {
  [INVOICE_STATUS_TAB.ALL]: [],
  [INVOICE_STATUS_TAB.UNPAID]: InvoiceStatusGroups.UNPAID,
  [INVOICE_STATUS_TAB.PAID]: InvoiceStatusGroups.PAID,
  [INVOICE_STATUS_TAB.CREDITED]: InvoiceStatusGroups.CREDITED
};

/** Which tab a wire status belongs under — the row badge's word, and the seed's own padding key. */
export function invoiceStatusTab(status: InvoiceStatus): InvoiceStatusTab {
  if (includes(InvoiceStatusGroups.PAID, status)) {
    return INVOICE_STATUS_TAB.PAID;
  }
  if (includes(InvoiceStatusGroups.CREDITED, status)) {
    return INVOICE_STATUS_TAB.CREDITED;
  }
  return INVOICE_STATUS_TAB.UNPAID;
}

function isInvoiceStatusTab(value: string): value is InvoiceStatusTab {
  return value in INVOICE_TAB_STATUSES;
}

/** An unknown tab narrows to nothing, exactly as an unrecognised `?status=` did. */
function matchesInvoiceTab(
  status: InvoiceStatus,
  tab: string | undefined
): boolean {
  if (tab === undefined || tab === INVOICE_STATUS_TAB.ALL) return true;
  if (!isInvoiceStatusTab(tab)) return false;
  return includes(INVOICE_TAB_STATUSES[tab], status);
}

/**
 * `issuedDate` and `dueDate` are ISO `YYYY-MM-DD` in every seed, so the string
 * order IS the date order. Newest leads because it is the order the ledger is
 * already in, and the one a client reads a billing history in; due-soonest is
 * the other question they come here with — which of these must I pay next.
 */
const INVOICE_SORT_OPTIONS: readonly MockSortOption<MockInvoice>[] = [
  {
    value: "newest",
    label: "Newest first",
    compare: (a, b) => b.issuedDate.localeCompare(a.issuedDate)
  },
  {
    value: "oldest",
    label: "Oldest first",
    compare: (a, b) => a.issuedDate.localeCompare(b.issuedDate)
  },
  {
    value: "due-soonest",
    label: "Due soonest",
    compare: (a, b) => a.dueDate.localeCompare(b.dueDate)
  },
  {
    // Money is DATA (plan R6), so the largest bill is a comparison of figures,
    // never a parse of a display string.
    value: "total",
    label: "Largest first",
    compare: (a, b) => b.total.amount - a.total.amount
  },
  {
    value: "status",
    label: "Status",
    compare: (a, b) => a.status.localeCompare(b.status)
  },
  {
    // An invoice with no payment date has not been paid, so it ranks last.
    value: "date-paid",
    label: "Recently paid",
    compare: (a, b) => (b.datePaid ?? "").localeCompare(a.datePaid ?? "")
  }
];

/**
 * The runtime narrowings the band writes. `status` is the DOCUMENT's own
 * status, not the tab's — the tab is route state, and narrowing inside it is
 * a second question ("which of my unpaid invoices are overdue").
 */
function matchesInvoiceCriteria(
  invoice: MockInvoice,
  criteria: MockFilterCriteria
): boolean {
  const inStatus = matchesExact(invoice.status, criteria.status);
  // Legacy's own `number` CONTAINS filter (`data/filters/invoice.ts`).
  const inNumber = matchesContains(invoice.number, criteria.number);
  // Legacy scoped a product's own invoices by query param rather than by a
  // control; the module publishes the same narrowing as a named setter.
  const inProduct = matchesExact(
    invoice.productId ?? "",
    criteria.contractProductId
  );
  const inCreatedWindow = matchesDateRange(
    invoice.issuedDate,
    criteria.dateCreated
  );
  const inDueWindow = matchesDateRange(invoice.dueDate, criteria.dateDue);
  const inCancelledWindow = matchesDateRange(
    invoice.dateCancelled,
    criteria.dateCancelled
  );
  const inTotalBand = matchesAmountBand(invoice.total.amount, criteria.total);
  const inNetBand = matchesAmountBand(
    invoice.subtotal.amount,
    criteria.netAmount
  );
  // An invoice with nothing taken off is a ZERO discount, not an absent one —
  // the bands tile from zero up, so it belongs in the lowest of them.
  const inDiscountBand = matchesAmountBand(
    invoice.discount?.amount ?? 0,
    criteria.discountAmount
  );
  const isProformaMatch = matchesFlag(
    invoice.category === MOCK_INVOICE_CATEGORY.PROFORMA,
    criteria.isProforma
  );
  const inFraudStatus = matchesExact(
    String(invoice.fraudStatus ?? FraudStatus.NOT_FRAUD),
    criteria.fraudStatus
  );
  return (
    inStatus &&
    inNumber &&
    inProduct &&
    inCreatedWindow &&
    inDueWindow &&
    inCancelledWindow &&
    inTotalBand &&
    inNetBand &&
    inDiscountBand &&
    isProformaMatch &&
    inFraudStatus
  );
}

const FRAUD_STATUS_OPTIONS = map(
  [FraudStatus.NOT_FRAUD, FraudStatus.REVIEW, FraudStatus.FRAUD],
  status => ({ value: String(status), label: FRAUD_STATUS_LABEL[status] })
);

/**
 * The band a tab offers, on ONE rule: a control appears where the showing rows
 * offer a choice in it, and is dropped where they do not (`presentControls`).
 * So a tab holding a single status asks nothing about status, while the Unpaid
 * and Credited tabs — two statuses each — both ask which. The Credited tab also
 * asks the day the credit was raised, which is legacy's own Credited filter and
 * a question no other tab can answer.
 */
function invoiceFilterControls(
  data: MockDataset,
  context: DataRouteContext
): MockFilterControl[] {
  const showing = filter(data.invoices, invoice =>
    matchesInvoiceTab(invoice.status, context.status)
  );
  const isCredited = context.status === INVOICE_STATUS_TAB.CREDITED;
  return presentControls([
    // The status control rides ONE rule, the same on every tab: `presentControls`
    // drops a control the showing rows offer no choice in. A tab holding one
    // status renders none; the Unpaid and Credited tabs each gather two, so
    // both ask which.
    selectFilter(
      "status",
      "Status",
      "Any status",
      optionsPresent(
        map(showing, "status"),
        status => INVOICE_STATUS_LABEL[status]
      )
    ),
    dateRangeFilter("dateCreated", "Issued"),
    dateRangeFilter("dateDue", "Due"),
    isCredited && dateRangeFilter("dateCancelled", "Credited"),
    selectFilter("total", "Total", "Any total", AMOUNT_BAND_OPTIONS),
    // Legacy filtered on all three figures, under its own words for them
    // (`data/filters/invoice.ts`: Subtotal and Discount).
    selectFilter("netAmount", "Subtotal", "Any subtotal", AMOUNT_BAND_OPTIONS),
    selectFilter(
      "discountAmount",
      "Discount",
      "Any discount",
      AMOUNT_BAND_OPTIONS
    ),
    toggleFilter("isProforma", "Proforma", flagOptions("Proforma", "Invoice")),
    selectFilter("fraudStatus", "Review", "Any review", FRAUD_STATUS_OPTIONS)
  ]);
}

export const invoicesCollection = filteredCollection<
  MockInvoice,
  ClientInvoicesFilters
>(
  (data, context, criteria) =>
    filter(
      data.invoices,
      invoice =>
        matchesInvoiceTab(invoice.status, context.status) &&
        matchesInvoiceCriteria(invoice, criteria)
    ),
  apply => ({
    query: value => apply({ query: value }),
    status: value => apply({ status: value }),
    number: value => apply({ number: value }),
    dateCreated: value => apply({ dateCreated: value }),
    dateDue: value => apply({ dateDue: value }),
    total: value => apply({ total: value }),
    netAmount: value => apply({ netAmount: value }),
    discountAmount: value => apply({ discountAmount: value }),
    isProforma: value => apply({ isProforma: value }),
    contractProductId: value => apply({ contractProductId: value })
  }),
  context => context.status ?? "",
  (data, context) => ({
    searchProps: ["number"],
    sortOptions: INVOICE_SORT_OPTIONS,
    filterControls: invoiceFilterControls(data, context)
  })
);

/**
 * Legacy's credit-note toolbar (`creditNotesTable.vue:9-19`), off
 * `data/filters/creditNotes.ts`: what it came to, whether it has been applied
 * to a document yet, and when it was raised. Its `number` filter is the
 * band's own search here, as every other document listing spells it.
 */
function creditNoteFilterControls(data: MockDataset): MockFilterControl[] {
  return presentControls([
    selectFilter("total", "Amount", "Any amount", AMOUNT_BAND_OPTIONS),
    toggleFilter(
      "status",
      "Status",
      optionsPresent(
        map(data.creditNotes, creditNoteState),
        status => CREDIT_NOTE_STATUS_LABEL[status]
      )
    ),
    dateRangeFilter("dateCreated", "Issued")
  ]);
}

function matchesCreditNoteCriteria(
  note: MockCreditNote,
  criteria: MockFilterCriteria
): boolean {
  return (
    matchesAmountBand(note.total.amount, criteria.total) &&
    matchesExact(creditNoteState(note), criteria.status) &&
    matchesDateRange(note.issuedDate, criteria.dateCreated)
  );
}

export const creditNotesCollection = filteredCollection<
  MockCreditNote,
  ClientCreditNotesFilters
>(
  (data, context, criteria) =>
    filter(data.creditNotes, note => matchesCreditNoteCriteria(note, criteria)),
  apply => ({
    query: value => apply({ query: value }),
    status: value => apply({ status: value }),
    total: value => apply({ total: value }),
    dateCreated: value => apply({ dateCreated: value })
  }),
  undefined,
  data => ({
    searchProps: ["number", "invoiceNumber"],
    sortOptions: CREDIT_NOTE_SORT_OPTIONS,
    filterControls: creditNoteFilterControls(data)
  })
);

/**
 * A statement row carries five figures and two downloads, so the panel pages
 * shallower than a ledger does — legacy rendered three of them at a time on a
 * desktop (`creditStatementsListing.vue:47`). It is also what the seed can
 * honestly file: a period the brand closed off has movements behind it, and
 * the ledger only goes back so far.
 */
const CREDIT_STATEMENT_PAGE_LIMIT = 3;

/**
 * Legacy's credit-statement controls (`creditStatementsListing.vue:9-22`),
 * which drew its filter/sort band off `data/filters/creditStatements.ts` and
 * `data/sorters/creditStatements.ts`. The BAND offers the window as one range
 * control; the module's own named setters keep legacy's two separate ends
 * (`FromDateFilter`, `ToDateFilter`), and all three narrow the same rows.
 */
const CREDIT_STATEMENT_FILTER_CONTROLS: readonly MockFilterControl[] = [
  dateRangeFilter("period", "Period")
];

/** Legacy's `FromDateSorter` / `ToDateSorter` — the two ends of the period. */
const CREDIT_STATEMENT_SORT_OPTIONS: readonly MockSortOption<MockCreditStatement>[] =
  [
    {
      value: "newest",
      label: "Newest first",
      compare: (a, b) => b.fromDate.localeCompare(a.fromDate)
    },
    {
      value: "oldest",
      label: "Oldest first",
      compare: (a, b) => a.fromDate.localeCompare(b.fromDate)
    },
    {
      value: "closed",
      label: "By closing date",
      compare: (a, b) => b.toDate.localeCompare(a.toDate)
    }
  ];

/**
 * The filed credit PERIODS, as a collection. The rows here are the seed's own
 * periods rather than the facade's computed views: narrowing and ordering ask
 * only about the two dates a period carries, and the figures on it are the
 * facade's to work out (plan R6) — the selector pairs each paged period with
 * its view. A period overlaps the asked window when either end falls inside it.
 */
/**
 * Whether one filed period answers the narrowing asked of it. The band's own
 * `period` range catches a period that OVERLAPS the window at either end;
 * legacy's two named ends narrow one side each, so a module calling
 * `filters.fromDate('2026-06-01')` moves the same rows the band does.
 */
function matchesStatementCriteria(
  statement: MockCreditStatement,
  criteria: MockFilterCriteria
): boolean {
  const overlapsWindow =
    matchesDateRange(statement.fromDate, criteria.period) ||
    matchesDateRange(statement.toDate, criteria.period);
  const opensLateEnough = matchesFrom(statement.fromDate, criteria.fromDate);
  const closesEarlyEnough = matchesUntil(statement.toDate, criteria.toDate);
  return overlapsWindow && opensLateEnough && closesEarlyEnough;
}

export const creditStatementsCollection = filteredCollection<
  MockCreditStatement,
  ClientWalletStatementsFilters
>(
  (data, context, criteria) =>
    filter(data.wallet.statements ?? [], statement =>
      matchesStatementCriteria(statement, criteria)
    ),
  apply => ({
    fromDate: value => apply({ fromDate: value }),
    toDate: value => apply({ toDate: value })
  }),
  undefined,
  () => ({
    limit: CREDIT_STATEMENT_PAGE_LIMIT,
    sortOptions: CREDIT_STATEMENT_SORT_OPTIONS,
    filterControls: CREDIT_STATEMENT_FILTER_CONTROLS
  })
);

// --- support pillar

/**
 * Legacy's Active / Closed ticket tabs — it offered no "all", and a closed
 * conversation beside an open one reads as noise, so neither does this.
 * Absent reads as ACTIVE, the tickets still wanting an answer.
 */
export const TICKET_STATUS_TAB = {
  ACTIVE: "open",
  CLOSED: "closed"
} as const;

export type TicketStatusTab =
  (typeof TICKET_STATUS_TAB)[keyof typeof TICKET_STATUS_TAB];

/** Which tab a thread belongs under — everything not closed is still active. */
export function ticketStatusTab(status: TicketStatusCodes): TicketStatusTab {
  if (status === TicketStatusCodes.CLOSED) return TICKET_STATUS_TAB.CLOSED;
  return TICKET_STATUS_TAB.ACTIVE;
}

/** The showing tab — anything the rail does not name reads as Active, the list's default. */
function showingTicketTab(status: string | undefined): TicketStatusTab {
  if (status === TICKET_STATUS_TAB.CLOSED) return TICKET_STATUS_TAB.CLOSED;
  return TICKET_STATUS_TAB.ACTIVE;
}

// No sort options: the seed's `updatedAt` order is already the order a client
// wants — the conversation that moved most recently, first.
/** The narrowings a thread answers — the pillar's listing and the product tab share them. */
function matchesTicketCriteria(
  ticket: MockTicket,
  criteria: MockFilterCriteria
): boolean {
  return (
    matchesContains(ticket.reference, criteria.reference) &&
    matchesContains(ticket.subject, criteria.subject) &&
    matchesExact(ticket.department, criteria.department) &&
    matchesExact(ticket.status, criteria.status) &&
    matchesDateRange(ticket.createdAt, criteria.dateCreated)
  );
}

/** The module's own named filters — one map, both mounts. */
function ticketFilterMap(
  apply: (patch: MockFilterCriteria) => void
): ClientTicketsFilters {
  return {
    reference: value => apply({ reference: value }),
    subject: value => apply({ subject: value }),
    department: value => apply({ department: value }),
    status: value => apply({ status: value }),
    dateCreated: value => apply({ dateCreated: value })
  };
}

/** Legacy's two ticket controls — which queue, and where the thread stands inside the showing tab. */
function ticketFilterControls(
  data: MockDataset,
  context: DataRouteContext
): MockFilterControl[] {
  const wanted = showingTicketTab(context.status);
  const showing = filter(
    data.tickets,
    ticket => ticketStatusTab(ticket.status) === wanted
  );
  return presentControls([
    selectFilter(
      "department",
      "Department",
      "Any department",
      optionsPresent(map(showing, "department"), department => department)
    ),
    selectFilter(
      "status",
      "Status",
      "Any status",
      optionsPresent(
        map(showing, "status"),
        status => TICKET_STATUS_LABEL[status]
      )
    ),
    // Legacy's `CreatedAtFilter` (`data/filters/tickets.ts:72-76`). Without a
    // control the band draws, `criteria.dateCreated` is a key nothing can
    // write — the narrowing existed and no client could reach it.
    dateRangeFilter("dateCreated", "Raised")
  ]);
}

export const ticketsCollection = filteredCollection<
  MockTicket,
  ClientTicketsFilters
>(
  (data, context, criteria) => {
    const wanted = showingTicketTab(context.status);
    return filter(
      data.tickets,
      ticket =>
        ticketStatusTab(ticket.status) === wanted &&
        matchesTicketCriteria(ticket, criteria)
    );
  },
  apply => ticketFilterMap(apply),
  context => context.status ?? "",
  (data, context) => ({
    // Legacy filtered the reference and the subject through the same box the
    // search is here, so both are searchable props rather than controls.
    searchProps: ["reference", "subject", "department"],
    filterControls: ticketFilterControls(data, context)
  })
);

/**
 * A product's own threads. Legacy mounted the WHOLE tickets listing on the
 * tab (`cProdTicketsComp.vue:12`), so the tab carries the same search and the
 * same narrowings the support pillar's own listing does — over this product's
 * rows.
 */
export const productTicketsCollection = filteredCollection<
  MockTicket,
  ClientTicketsFilters
>(
  (data, context, criteria) => {
    if (context.productId === undefined) return [];
    return filter(
      data.tickets,
      ticket =>
        ticket.productId === context.productId &&
        matchesTicketCriteria(ticket, criteria)
    );
  },
  apply => ticketFilterMap(apply),
  context => context.productId ?? "",
  (data, context) => ({
    searchProps: ["reference", "subject", "department"],
    filterControls: productTicketFilterControls(data, context)
  })
);

/** The tab's own controls, over the threads this product actually carries. */
function productTicketFilterControls(
  data: MockDataset,
  context: DataRouteContext
): MockFilterControl[] {
  const showing = filter(data.tickets, { productId: context.productId ?? "" });
  return presentControls([
    selectFilter(
      "department",
      "Department",
      "Any department",
      optionsPresent(map(showing, "department"), department => department)
    ),
    selectFilter(
      "status",
      "Status",
      "Any status",
      optionsPresent(
        map(showing, "status"),
        status => TICKET_STATUS_LABEL[status]
      )
    ),
    dateRangeFilter("dateCreated", "Raised")
  ]);
}

/**
 * One product's own invoices and credit notes — the same rows the billing
 * ledgers hold, narrowed by the R6 discriminator the seeds carry. Separate
 * instances per product, so a pager on one product's panel never moves
 * another's.
 */
function productInvoices(
  data: MockDataset,
  context: DataRouteContext
): MockInvoice[] {
  if (context.productId === undefined) return [];
  return filter(data.invoices, { productId: context.productId });
}

/** The product ledger's band: which state, over what period, at what size. */
function productInvoiceFilterControls(
  showing: readonly MockInvoice[]
): MockFilterControl[] {
  return presentControls([
    selectFilter(
      "status",
      "Status",
      "Any status",
      optionsPresent(
        map(showing, "status"),
        status => INVOICE_STATUS_LABEL[status]
      )
    ),
    dateRangeFilter("dateCreated", "Issued"),
    selectFilter("total", "Total", "Any total", AMOUNT_BAND_OPTIONS)
  ]);
}

export const productInvoicesCollection = filteredCollection<
  MockInvoice,
  ClientInvoicesFilters
>(
  (data, context, criteria) =>
    filter(productInvoices(data, context), invoice =>
      matchesInvoiceCriteria(invoice, criteria)
    ),
  apply => ({
    query: value => apply({ query: value }),
    status: value => apply({ status: value }),
    number: value => apply({ number: value }),
    dateCreated: value => apply({ dateCreated: value }),
    dateDue: value => apply({ dateDue: value }),
    total: value => apply({ total: value }),
    netAmount: value => apply({ netAmount: value }),
    discountAmount: value => apply({ discountAmount: value }),
    isProforma: value => apply({ isProforma: value }),
    contractProductId: value => apply({ contractProductId: value })
  }),
  context => context.productId ?? "",
  (data, context) => ({
    searchProps: ["number"],
    sortOptions: INVOICE_SORT_OPTIONS,
    filterControls: productInvoiceFilterControls(productInvoices(data, context))
  })
);

/** `issuedDate` is ISO `YYYY-MM-DD` in every seed, so the string order IS the date order. */
const CREDIT_NOTE_SORT_OPTIONS: readonly MockSortOption<MockCreditNote>[] = [
  {
    value: "newest",
    label: "Newest first",
    compare: (a, b) => b.issuedDate.localeCompare(a.issuedDate)
  },
  {
    value: "oldest",
    label: "Oldest first",
    compare: (a, b) => a.issuedDate.localeCompare(b.issuedDate)
  },
  {
    value: "total",
    label: "Largest first",
    compare: (a, b) => b.total.amount - a.total.amount
  },
  // Legacy's fourth sorter — its own `number` field (`creditNotes.ts` sorters).
  {
    value: "number",
    label: "By credit note",
    compare: (a, b) => a.number.localeCompare(b.number)
  }
];

/** The product tab's own credit notes — the same toolbar, over its own rows. */
export const productCreditNotesCollection = filteredCollection<
  MockCreditNote,
  ClientCreditNotesFilters
>(
  (data, context, criteria) => {
    if (context.productId === undefined) return [];
    return filter(
      data.creditNotes,
      note =>
        note.productId === context.productId &&
        matchesCreditNoteCriteria(note, criteria)
    );
  },
  apply => ({
    query: value => apply({ query: value }),
    status: value => apply({ status: value }),
    total: value => apply({ total: value }),
    dateCreated: value => apply({ dateCreated: value })
  }),
  context => context.productId ?? "",
  data => ({
    searchProps: ["number", "invoiceNumber"],
    sortOptions: CREDIT_NOTE_SORT_OPTIONS,
    filterControls: creditNoteFilterControls(data)
  })
);

// --- products pillar

function groupProducts(
  data: MockDataset,
  context: DataRouteContext
): MockProduct[] {
  if (context.groupSlug === undefined) return [];
  return filter(data.products, { groupSlug: context.groupSlug });
}

function matchesProductFilters(
  product: MockProduct,
  context: DataRouteContext
): boolean {
  const typeOk =
    context.productType === undefined ||
    product.billingType === context.productType;
  const categoryOk =
    context.category === undefined || product.category === context.category;
  return typeOk && categoryOk;
}

/**
 * Group listings narrow by slug, the route-query filters AND the status tab,
 * so the key carries all four (plan R6). Page state is therefore per tab: a
 * switch never strands you on page 3 of a different filter.
 */
function groupListingKey(context: DataRouteContext): string {
  return [
    context.groupSlug ?? "",
    context.productType ?? "",
    context.category ?? "",
    context.status ?? ""
  ].join("|");
}

/**
 * Legacy's All / Active / Cancelled product tabs, as one collection narrowed
 * by the route's `status`. Absent reads as Active — the page's own default,
 * and what a client opens the listing to see.
 */
function matchesProductStatus(
  product: MockProduct,
  status: string | undefined
): boolean {
  if (status === PRODUCT_STATUS_TAB.ALL) return true;
  if (status === PRODUCT_STATUS_TAB.CANCELLED) {
    return product.status === ContractStatusCodes.CANCELLED;
  }
  return product.status !== ContractStatusCodes.CANCELLED;
}

/** The status tab vocabulary — the query values legacy's routes become. */
export const PRODUCT_STATUS_TAB = {
  ALL: "all",
  ACTIVE: "active",
  CANCELLED: "cancelled"
} as const;

export type ProductStatusTab =
  (typeof PRODUCT_STATUS_TAB)[keyof typeof PRODUCT_STATUS_TAB];

/** Which tab a product belongs under — a cancelled contract, or everything else. */
export function productStatusTab(
  status: ContractStatusCodes
): ProductStatusTab {
  if (status === ContractStatusCodes.CANCELLED) {
    return PRODUCT_STATUS_TAB.CANCELLED;
  }
  return PRODUCT_STATUS_TAB.ACTIVE;
}

/** A one-time product never renews, so it has no due date and sorts last under Renewal date. */
function renewalRank(product: MockProduct): string {
  return product.nextDueDate ?? "9999-12-31";
}

/**
 * Newest leads, as it does on every other dated list here: what a client bought
 * last is what they came back to look at, and `createdAt` is the one date every
 * product carries whatever its status — a cancelled product has no renewal to
 * sort by. Renewal date is the other question this list answers: what falls due
 * next. Price sorting arrives with the listing filters (plan Phase 1).
 */
const GROUP_PRODUCT_SORT_OPTIONS: readonly MockSortOption<MockProduct>[] = [
  {
    value: "newest",
    label: "Newest first",
    compare: (a, b) => b.createdAt.localeCompare(a.createdAt)
  },
  {
    value: "name-az",
    label: "Name A–Z",
    compare: (a, b) => a.name.localeCompare(b.name)
  },
  {
    value: "renewal-soonest",
    label: "Renewal date",
    compare: (a, b) => renewalRank(a).localeCompare(renewalRank(b))
  },
  {
    // Legacy's `StatusSorter` (`data/sorters/contractProducts.ts:4-7`), which
    // its own listing offered first — a shelf of products read by standing
    // puts everything still running together.
    value: "status",
    label: "By status",
    compare: (a, b) =>
      PRODUCT_STATUS_LABEL[a.status].localeCompare(
        PRODUCT_STATUS_LABEL[b.status]
      )
  }
];

/**
 * The Cancelled tab's own order — when the contract ended is the only question
 * a past product answers that a running one cannot.
 */
const CANCELLED_PRODUCT_SORT_OPTION: MockSortOption<MockProduct> = {
  value: "date-cancelled",
  label: "Recently cancelled",
  compare: (a, b) => (b.cancelledAt ?? "").localeCompare(a.cancelledAt ?? "")
};

/** The orders a tab offers: the Cancelled tab adds the date the contract ended. */
function productSortOptions(
  context: DataRouteContext
): readonly MockSortOption<MockProduct>[] {
  if (context.status !== PRODUCT_STATUS_TAB.CANCELLED) {
    return GROUP_PRODUCT_SORT_OPTIONS;
  }
  return [...GROUP_PRODUCT_SORT_OPTIONS, CANCELLED_PRODUCT_SORT_OPTION];
}

/** The runtime narrowings the band writes — legacy `src/data/filters/contractProducts.ts`. */
function matchesProductCriteria(
  product: MockProduct,
  criteria: MockFilterCriteria
): boolean {
  const inPurchaseWindow = matchesDateRange(
    product.createdAt,
    criteria.datePurchased
  );
  const inRenewalWindow = matchesDateRange(
    product.nextDueDate,
    criteria.nextDueDate
  );
  const inPriceBand = matchesAmountBand(product.price?.amount, criteria.price);
  const inCategory = matchesExact(product.category, criteria.category);
  const inStatus = matchesExact(product.status, criteria.status);
  // A product answers a tag narrowing when it wears that tag; legacy's own
  // filter is over a SET, so one match is enough.
  const inTag = matchesAny(product.tags, criteria.tag);
  // Legacy's own `products.product.name` CONTAINS filter (`data/filters/order.ts`).
  const inName = matchesContains(product.name, criteria.name);
  return (
    inPurchaseWindow &&
    inRenewalWindow &&
    inPriceBand &&
    inCategory &&
    inStatus &&
    inTag &&
    inName
  );
}

/**
 * The listing's band, worded from the rows the showing tab holds: the Cancelled
 * tab is all one status, so it offers no status control at all. Name is absent
 * as a control on purpose — the search field already asks that question.
 */
function productFilterControls(
  data: MockDataset,
  context: DataRouteContext
): MockFilterControl[] {
  const showing = filter(
    groupProducts(data, context),
    product =>
      matchesProductStatus(product, context.status) &&
      matchesProductFilters(product, context)
  );
  return presentControls([
    dateRangeFilter("datePurchased", "Purchased"),
    dateRangeFilter("nextDueDate", "Next due"),
    selectFilter("price", "Price", "Any price", AMOUNT_BAND_OPTIONS),
    selectFilter(
      "category",
      "Category",
      "Any category",
      optionsPresent(map(showing, "category"), category => category)
    ),
    selectFilter(
      "status",
      "Status",
      "Any status",
      optionsPresent(
        map(showing, "status"),
        status => PRODUCT_STATUS_LABEL[status]
      )
    ),
    // Legacy's `ProductTagsFilter` (`data/filters/contractProducts.ts:278-293`),
    // which it offered every actor (`if: () => true`). The choices are the
    // tags the SHOWING products actually wear, so a tab whose products share
    // one tag offers no choice at all.
    selectFilter(
      "tag",
      "Tag",
      "Any tag",
      optionsPresent(
        flatMap(showing, product => product.tags ?? []),
        tag => tag
      )
    )
  ]);
}

export const groupProductsCollection = filteredCollection<
  MockProduct,
  ClientContractProductsFilters
>(
  (data, context, criteria) =>
    filter(
      groupProducts(data, context),
      product =>
        matchesProductStatus(product, context.status) &&
        matchesProductFilters(product, context) &&
        matchesProductCriteria(product, criteria)
    ),
  apply => ({
    query: value => apply({ query: value }),
    datePurchased: value => apply({ datePurchased: value }),
    nextDueDate: value => apply({ nextDueDate: value }),
    price: value => apply({ price: value }),
    name: value => apply({ name: value }),
    category: value => apply({ category: value }),
    status: value => apply({ status: value }),
    tag: value => apply({ tag: value })
  }),
  groupListingKey,
  (data, context) => ({
    searchProps: ["name", "category", "serviceIdentifier"],
    sortOptions: productSortOptions(context),
    filterControls: productFilterControls(data, context)
  })
);

export const groupCatalogueCollection = simpleCollection(
  (data, context) => {
    if (context.groupSlug === undefined) return [];
    return filter(data.catalogue, { groupSlug: context.groupSlug });
  },
  context => context.groupSlug ?? ""
);

// -----------------------------------------------------------------------------
// The dispatcher's door (plan §2 pager wiring): PAGE_NEXT/PAGE_PREV action
// values carry one of these ids; `dispatchMockAction` resolves the instance
// with the LIVE route context it already receives.
// -----------------------------------------------------------------------------

/** The slice of a collection instance the pager and control seams need. */
export type PagedCollectionHandle = {
  useActions: () => {
    nextPage: () => void;
    prevPage: () => void;
    search: (text: string) => void;
    applySort: (value?: string) => void;
    applyNamedFilter: (key: string, value: string) => void;
    setLimit: (value: number) => void;
  };
  useContext: () => {
    pagination: ComputedRef<PaginationInfo>;
    appliedQuery: ComputedRef<string>;
    activeSort: ComputedRef<string | undefined>;
    sortOptions: readonly MockSortOptionDescriptor[];
    filterControls: readonly MockFilterControl[];
    appliedFilters: ComputedRef<Readonly<Record<string, string>>>;
    isSearchable: boolean;
  };
};

export const PAGED_COLLECTION_ID = {
  INVOICES: "invoices",
  CREDIT_NOTES: "credit-notes",
  CREDIT_STATEMENTS: "credit-statements",
  NOTIFICATIONS: "notifications",
  ACCOUNT_NOTES: "account-notes",
  ACCOUNT_SECRETS: "account-secrets",
  ACCOUNT_DELEGATES: "account-delegates",
  DELEGATE_PRODUCTS: "delegate-products",
  DELEGATE_TICKETS: "delegate-tickets",
  CHILD_ACCOUNTS: "child-accounts",
  AFFILIATE_COMMISSIONS: "affiliate-commissions",
  AFFILIATE_PAYOUTS: "affiliate-payouts",
  AFFILIATE_REFERRALS: "affiliate-referrals",
  AFFILIATE_LINKS: "affiliate-links",
  LOGIN_ATTEMPTS: "login-attempts",
  IP_WHITELIST: "ip-whitelist",
  TICKETS: "tickets",
  PRODUCT_TICKETS: "product-tickets",
  PRODUCT_INVOICES: "product-invoices",
  PRODUCT_CREDIT_NOTES: "product-credit-notes",
  GROUP_PRODUCTS: "group-products",
  GROUP_CATALOGUE: "group-catalogue"
} as const;

export type PagedCollectionId =
  (typeof PAGED_COLLECTION_ID)[keyof typeof PAGED_COLLECTION_ID];

const PAGED_COLLECTIONS: Record<
  PagedCollectionId,
  {
    resolve: (
      data: MockDataset,
      context?: DataRouteContext
    ) => PagedCollectionHandle;
  }
> = {
  [PAGED_COLLECTION_ID.INVOICES]: invoicesCollection,
  [PAGED_COLLECTION_ID.CREDIT_NOTES]: creditNotesCollection,
  [PAGED_COLLECTION_ID.CREDIT_STATEMENTS]: creditStatementsCollection,
  [PAGED_COLLECTION_ID.NOTIFICATIONS]: notificationsCollection,
  [PAGED_COLLECTION_ID.ACCOUNT_NOTES]: accountNotesCollection,
  [PAGED_COLLECTION_ID.ACCOUNT_SECRETS]: accountSecretsCollection,
  [PAGED_COLLECTION_ID.ACCOUNT_DELEGATES]: accountDelegatesCollection,
  [PAGED_COLLECTION_ID.DELEGATE_PRODUCTS]: delegateProductsCollection,
  [PAGED_COLLECTION_ID.DELEGATE_TICKETS]: delegateTicketsCollection,
  [PAGED_COLLECTION_ID.CHILD_ACCOUNTS]: childAccountsCollection,
  [PAGED_COLLECTION_ID.AFFILIATE_COMMISSIONS]: affiliateCommissionsCollection,
  [PAGED_COLLECTION_ID.AFFILIATE_PAYOUTS]: affiliatePayoutsCollection,
  [PAGED_COLLECTION_ID.AFFILIATE_REFERRALS]: affiliateReferralsCollection,
  [PAGED_COLLECTION_ID.AFFILIATE_LINKS]: affiliateLinksCollection,
  [PAGED_COLLECTION_ID.LOGIN_ATTEMPTS]: loginAttemptsCollection,
  [PAGED_COLLECTION_ID.IP_WHITELIST]: ipWhitelistCollection,
  [PAGED_COLLECTION_ID.TICKETS]: ticketsCollection,
  [PAGED_COLLECTION_ID.PRODUCT_TICKETS]: productTicketsCollection,
  [PAGED_COLLECTION_ID.PRODUCT_INVOICES]: productInvoicesCollection,
  [PAGED_COLLECTION_ID.PRODUCT_CREDIT_NOTES]: productCreditNotesCollection,
  [PAGED_COLLECTION_ID.GROUP_PRODUCTS]: groupProductsCollection,
  [PAGED_COLLECTION_ID.GROUP_CATALOGUE]: groupCatalogueCollection
};

function isPagedCollectionId(value: string): value is PagedCollectionId {
  return value in PAGED_COLLECTIONS;
}

/** Resolves a paged collection by its wire id — undefined for anything else, per the action seam's silent no-op contract. */
export function resolvePagedCollection(
  id: string,
  data: MockDataset,
  context: DataRouteContext
): PagedCollectionHandle | undefined {
  if (!isPagedCollectionId(id)) return undefined;
  return PAGED_COLLECTIONS[id].resolve(data, context);
}

/** The typed door for a KNOWN paged id — the pager-state selectors' resolve, total by construction. */
export function pagedCollectionHandle(
  id: PagedCollectionId,
  data: MockDataset,
  context: DataRouteContext
): PagedCollectionHandle {
  return PAGED_COLLECTIONS[id].resolve(data, context);
}
