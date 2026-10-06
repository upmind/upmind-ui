// -----------------------------------------------------------------------------
/**
 * @module portal/type-tests/contracts
 * @description Compile-only proof for plan R2: every list contract in
 * `mock/contracts/` is satisfiable by the mock collection generic, so a facade
 * declared against a contract can be built from `defineMockCollection` without
 * drift. Domain verbs (`dismiss`, `remove`, `convert`…) are the facade's own
 * addition and are omitted from the actions arm; internals are exempt per
 * facades plan R9. Each contract family also carries a negative arm — a
 * context missing `pagination` (or its own required member) must not
 * typecheck. Checked by `pnpm --filter @upmind-automation/portal-nuxt
 * type-check`; vitest never runs this file.
 */

import { defineMockCollection } from "../mock/collections";
import { mockFacadeLifecycle } from "../mock/facades";
import { noop, omit } from "lodash-es";
import type {
  MockCollection,
  MockCollectionOptions
} from "../mock/collections";
import type {
  AffiliateCommissionsFilters,
  AffiliateCommissionsSortableProperties,
  AffiliateLinksFilters,
  AffiliateLinksSortableProperties,
  AffiliatePayout,
  AffiliatePayoutsFilters,
  AffiliatePayoutsSortableProperties,
  AffiliateReferralsFilters,
  AffiliateReferralsSortableProperties,
  ClientChildAccountsFilters,
  ClientChildAccountsSortableProperties,
  ClientContractProductsFilters,
  ClientContractProductsSortableProperties,
  ClientCreditNotesFilters,
  ClientCreditNotesSortableProperties,
  ClientCustomPagesFilters,
  ClientCustomPagesSortableProperties,
  ClientDelegateObjectsFilters,
  ClientDelegatesFilters,
  ClientDelegatesSortableProperties,
  ClientInvoicesFilters,
  ClientInvoicesSortableProperties,
  InvoicePaymentContext,
  ClientIpWhitelistFilters,
  ClientIpWhitelistSortableProperties,
  ClientLoginAttemptsFilters,
  ClientLoginAttemptsSortableProperties,
  ClientTicketsFilters,
  ClientTicketsSortableProperties,
  ClientVaultFilters,
  ClientVaultSortableProperties,
  ClientWalletTransactionsFilters,
  ClientWalletTransactionsSortableProperties,
  ContractProductScheduledActionsFilters,
  ContractProductScheduledActionsSortableProperties,
  UseAffiliateCommissionsActions,
  UseAffiliateCommissionsContext,
  UseAffiliateCommissionsMeta,
  UseAffiliateLinksActions,
  UseAffiliateLinksContext,
  UseAffiliateLinksMeta,
  UseAffiliatePayoutsActions,
  UseAffiliatePayoutsContext,
  UseAffiliatePayoutsMeta,
  UseAffiliateReferralsActions,
  UseAffiliateReferralsContext,
  UseAffiliateReferralsMeta,
  UseClientAffiliateActions,
  UseClientAffiliateContext,
  UseClientAffiliateMeta,
  UseClientBillingSettingsActions,
  UseClientBillingSettingsContext,
  UseClientBillingSettingsMeta,
  UseClientChildAccountsActions,
  UseClientChildAccountsContext,
  UseClientChildAccountsMeta,
  UseClientContractProductsActions,
  UseClientContractProductsContext,
  UseClientContractProductsMeta,
  UseClientCreditNotesActions,
  UseClientCreditNotesContext,
  UseClientCreditNotesMeta,
  UseClientCustomPagesActions,
  UseClientCustomPagesContext,
  UseClientCustomPagesMeta,
  UseClientDelegateProductsActions,
  UseClientDelegateProductsContext,
  UseClientDelegateProductsMeta,
  UseClientDelegatesActions,
  UseClientDelegatesContext,
  UseClientDelegatesMeta,
  UseClientDelegateTicketsActions,
  UseClientDelegateTicketsContext,
  UseClientDelegateTicketsMeta,
  UseClientInvoiceActions,
  UseClientInvoicesActions,
  UseClientInvoicesContext,
  UseClientInvoicesMeta,
  UseClientIpWhitelistActions,
  UseClientIpWhitelistContext,
  UseClientIpWhitelistMeta,
  UseClientLoginAttemptsActions,
  UseClientLoginAttemptsContext,
  UseClientLoginAttemptsMeta,
  SecurityTwoFactorModel,
  UseClientSecurityActions,
  UseClientSecurityContext,
  UseClientSecurityMeta,
  UseClientAccountActions,
  UseClientAccountContext,
  UseClientAccountMeta,
  UseClientSupportPinContext,
  UseClientTicketActions,
  UseClientTicketsActions,
  UseClientTicketsContext,
  UseClientTicketsMeta,
  UseClientVaultActions,
  UseClientVaultContext,
  UseClientVaultMeta,
  ClientWalletStatementsFilters,
  UseClientWalletActions,
  UseClientWalletTransactionsActions,
  UseClientWalletTransactionsContext,
  UseClientWalletTransactionsMeta,
  UseContractProductProvisioningContext,
  UseContractProductScheduledActionsActions,
  UseContractProductScheduledActionsContext,
  UseContractProductScheduledActionsMeta,
  UserNotificationsFilters,
  UserNotificationsSortableProperties,
  UseNotificationPreferencesActions,
  UseNotificationPreferencesContext,
  UseNotificationPreferencesMeta,
  UseUserNotificationsActions,
  UseUserNotificationsContext,
  UseUserNotificationsMeta
} from "../mock/contracts";
import type { MockDataset } from "../mock/types";
import type { Invoice } from "@upmind-automation/headless";
import type {
  IAffiliateCommission,
  IAffiliateLink,
  IAffiliateReferral,
  IChildAccount,
  IClientDelegate,
  IContractProduct,
  ICustomPage,
  IInvoice,
  IIpAddress,
  ILoginAttempt,
  IScheduledAction,
  ITicket,
  IUserNotification,
  IVaultAsset,
  IWalletTransaction
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------

/**
 * The dataset a facade resolves against. Declared rather than seeded: this
 * file proves TYPES, and minting one would couple the proof to the store's
 * seed shape.
 */
declare const dataset: MockDataset;

/** Mints one instance of the mock generic at a contract's own row/filter/sort types. */
function mintCollection<TRow, TFilters, TSort extends string>(
  filters: TFilters
): MockCollection<TRow, TFilters, TSort> {
  const options: MockCollectionOptions<TRow, TFilters, TSort> = {
    source: () => [],
    filters: () => filters
  };
  return defineMockCollection<TRow, TFilters, TSort>(() => options).resolve(
    dataset
  );
}

// -----------------------------------------------------------------------------
// client-invoices
// -----------------------------------------------------------------------------

const clientInvoices = mintCollection<
  Invoice,
  ClientInvoicesFilters,
  ClientInvoicesSortableProperties
>({
  query: noop,
  status: noop,
  number: noop,
  dateCreated: noop,
  dateDue: noop,
  total: noop,
  netAmount: noop,
  discountAmount: noop,
  isProforma: noop,
  contractProductId: noop
});

export const clientInvoicesContext: UseClientInvoicesContext =
  clientInvoices.useContext();
export const clientInvoicesMeta: UseClientInvoicesMeta =
  clientInvoices.useMeta();
// `consolidate` is the collection's own WRITE, which no minted collection
// carries — the same omission the ticket collection's `create` needs below.
export const clientInvoicesActions: Omit<
  UseClientInvoicesActions,
  "consolidate"
> = clientInvoices.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientInvoicesNeedsPagination: UseClientInvoicesContext = omit(
  clientInvoices.useContext(),
  "pagination"
);

// The per-invoice MANAGER. `pay` and `share` are OMITTED for the reason every
// other write is: the contract declares them `Promise`-returning, as the real
// module will, while the facade answers with a receipt the dispatcher renders
// (`useMockInvoice`). What the arms below bind is the TENDER those writes
// take — contract data, which the mock and the real module share whole.
declare const invoiceActions: Omit<UseClientInvoiceActions, "pay" | "share">;
declare const invoicePaymentContext: InvoicePaymentContext;

export const clientInvoiceActions: Omit<
  UseClientInvoiceActions,
  "pay" | "share"
> = invoiceActions;

// @ts-expect-error — `owed` is a required member: a context that cannot say
// what is left to pay cannot bound the amount the form offers.
export const invoicePaymentNeedsOwed: InvoicePaymentContext = omit(
  invoicePaymentContext,
  "owed"
);

// @ts-expect-error — `canChangeAmount` is a required member: a form that
// cannot say whether the amount is the client's would offer it either way.
export const invoicePaymentNeedsGate: InvoicePaymentContext = omit(
  invoicePaymentContext,
  "canChangeAmount"
);

// client-credit-notes
// -----------------------------------------------------------------------------

const clientCreditNotes = mintCollection<
  IInvoice,
  ClientCreditNotesFilters,
  ClientCreditNotesSortableProperties
>({ query: noop, status: noop, total: noop, dateCreated: noop });

export const clientCreditNotesContext: UseClientCreditNotesContext =
  clientCreditNotes.useContext();
export const clientCreditNotesMeta: UseClientCreditNotesMeta =
  clientCreditNotes.useMeta();
export const clientCreditNotesActions: UseClientCreditNotesActions =
  clientCreditNotes.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientCreditNotesNeedsPagination: UseClientCreditNotesContext =
  omit(clientCreditNotes.useContext(), "pagination");

// client-wallet
// -----------------------------------------------------------------------------

const clientWalletTransactions = mintCollection<
  IWalletTransaction,
  ClientWalletTransactionsFilters,
  ClientWalletTransactionsSortableProperties
>({ type: noop, currencyCode: noop });

export const clientWalletTransactionsContext: UseClientWalletTransactionsContext =
  clientWalletTransactions.useContext();
export const clientWalletTransactionsMeta: UseClientWalletTransactionsMeta =
  clientWalletTransactions.useMeta();
export const clientWalletTransactionsActions: UseClientWalletTransactionsActions =
  clientWalletTransactions.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientWalletNeedsPagination: UseClientWalletTransactionsContext =
  omit(clientWalletTransactions.useContext(), "pagination");

// The wallet's own statement download. It is declared rather than minted for
// the reason every other write here is: the contract says `Promise`, as the
// real module will, while the facade answers with a receipt.
declare const walletActions: UseClientWalletActions;

export const clientWalletActions: UseClientWalletActions = walletActions;

// @ts-expect-error — `statementFile` is a required member: a wallet that cannot
// hand over a filed period cannot answer legacy's `download_csv` entry.
export const clientWalletNeedsStatementFile: UseClientWalletActions = omit(
  walletActions,
  "statementFile"
);

// The statement collection's own named filters — legacy's `FromDateFilter` /
// `ToDateFilter`. The panel's period band writes `criteria.period`; these
// setters write `fromDate` / `toDate`, and the collection reads all three.
declare const walletStatementFilters: ClientWalletStatementsFilters;

export const clientWalletStatementsFilters: ClientWalletStatementsFilters =
  walletStatementFilters;

// @ts-expect-error — `toDate` is a required filter: a period narrowed only at
// its opening end cannot answer legacy's two-ended control.
export const clientWalletStatementsNeedToDate: ClientWalletStatementsFilters =
  omit(walletStatementFilters, "toDate");

// -----------------------------------------------------------------------------
// client-contract-products
// -----------------------------------------------------------------------------

const clientContractProducts = mintCollection<
  IContractProduct,
  ClientContractProductsFilters,
  ClientContractProductsSortableProperties
>({
  query: noop,
  datePurchased: noop,
  nextDueDate: noop,
  price: noop,
  name: noop,
  category: noop,
  status: noop,
  tag: noop
});

export const clientContractProductsContext: UseClientContractProductsContext =
  clientContractProducts.useContext();
export const clientContractProductsMeta: UseClientContractProductsMeta =
  clientContractProducts.useMeta();
export const clientContractProductsActions: UseClientContractProductsActions =
  clientContractProducts.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientContractProductsNeedsPagination: UseClientContractProductsContext =
  omit(clientContractProducts.useContext(), "pagination");

// -----------------------------------------------------------------------------
// client-contract-product (its collection half — the manager has no list)
// -----------------------------------------------------------------------------

const scheduledActions = mintCollection<
  IScheduledAction,
  ContractProductScheduledActionsFilters,
  ContractProductScheduledActionsSortableProperties
>({ status: noop });

export const scheduledActionsContext: UseContractProductScheduledActionsContext =
  scheduledActions.useContext();
export const scheduledActionsMeta: UseContractProductScheduledActionsMeta =
  scheduledActions.useMeta();
export const scheduledActionsActions: UseContractProductScheduledActionsActions =
  scheduledActions.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const scheduledActionsNeedsPagination: UseContractProductScheduledActionsContext =
  omit(scheduledActions.useContext(), "pagination");

// -----------------------------------------------------------------------------
// contract-product-provisioning (no collection — three arrays and a verb)
// -----------------------------------------------------------------------------

declare const provisioning: UseContractProductProvisioningContext;

// @ts-expect-error — `fields` is a required member of the provisioning context.
export const provisioningNeedsFields: UseContractProductProvisioningContext =
  omit(provisioning, "fields");

// -----------------------------------------------------------------------------
// client-vault
// -----------------------------------------------------------------------------

const clientVault = mintCollection<
  IVaultAsset,
  ClientVaultFilters,
  ClientVaultSortableProperties
>({ query: noop, encrypted: noop, contractProductId: noop });

export const clientVaultContext: UseClientVaultContext =
  clientVault.useContext();
export const clientVaultMeta: UseClientVaultMeta = clientVault.useMeta();
export const clientVaultActions: Omit<
  UseClientVaultActions,
  "create" | "update" | "remove" | "convert" | "setPinned"
> = clientVault.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientVaultNeedsPagination: UseClientVaultContext = omit(
  clientVault.useContext(),
  "pagination"
);

// The vault's own writes, declared rather than minted for the reason every
// other write here is: the contract says `Promise`, as the real module will,
// while the facade answers with a receipt.
declare const vaultActions: UseClientVaultActions;

export const clientVaultWrites: UseClientVaultActions = vaultActions;

// @ts-expect-error — `setPinned` is a required member: a vault that cannot pin
// a row cannot order its panels the way legacy's back end did.
export const clientVaultNeedsSetPinned: UseClientVaultActions = omit(
  vaultActions,
  "setPinned"
);

// -----------------------------------------------------------------------------
// client-delegates
// -----------------------------------------------------------------------------

const clientDelegates = mintCollection<
  IClientDelegate,
  ClientDelegatesFilters,
  ClientDelegatesSortableProperties
>({ query: noop, active: noop, isFullDelegate: noop });

export const clientDelegatesContext: UseClientDelegatesContext =
  clientDelegates.useContext();
export const clientDelegatesMeta: UseClientDelegatesMeta =
  clientDelegates.useMeta();
export const clientDelegatesActions: Omit<UseClientDelegatesActions, "invite"> =
  clientDelegates.useActions();

const delegateProducts = mintCollection<
  IContractProduct,
  ClientDelegateObjectsFilters,
  string
>({});

export const delegateProductsContext: UseClientDelegateProductsContext =
  delegateProducts.useContext();
export const delegateProductsMeta: UseClientDelegateProductsMeta =
  delegateProducts.useMeta();
export const delegateProductsActions: UseClientDelegateProductsActions =
  delegateProducts.useActions();

const delegateTickets = mintCollection<
  ITicket,
  ClientDelegateObjectsFilters,
  string
>({});

export const delegateTicketsContext: UseClientDelegateTicketsContext =
  delegateTickets.useContext();
export const delegateTicketsMeta: UseClientDelegateTicketsMeta =
  delegateTickets.useMeta();
export const delegateTicketsActions: UseClientDelegateTicketsActions =
  delegateTickets.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientDelegatesNeedsPagination: UseClientDelegatesContext = omit(
  clientDelegates.useContext(),
  "pagination"
);

// -----------------------------------------------------------------------------
// client-child-accounts
// -----------------------------------------------------------------------------

const clientChildAccounts = mintCollection<
  IChildAccount,
  ClientChildAccountsFilters,
  ClientChildAccountsSortableProperties
>({
  query: noop,
  allowImpersonation: noop,
  inheritPaymentDetails: noop,
  dateCreated: noop
});

export const clientChildAccountsContext: UseClientChildAccountsContext =
  clientChildAccounts.useContext();
export const clientChildAccountsMeta: UseClientChildAccountsMeta =
  clientChildAccounts.useMeta();
export const clientChildAccountsActions: UseClientChildAccountsActions =
  clientChildAccounts.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientChildAccountsNeedsPagination: UseClientChildAccountsContext =
  omit(clientChildAccounts.useContext(), "pagination");

// -----------------------------------------------------------------------------
// user-notifications
// -----------------------------------------------------------------------------

const userNotifications = mintCollection<
  IUserNotification,
  UserNotificationsFilters,
  UserNotificationsSortableProperties
>({ read: noop });

export const userNotificationsContext: UseUserNotificationsContext =
  userNotifications.useContext();
export const userNotificationsMeta: UseUserNotificationsMeta =
  userNotifications.useMeta();
export const userNotificationsActions: Omit<
  UseUserNotificationsActions,
  "dismiss" | "markAllRead"
> = userNotifications.useActions();

// The preference matrix is its own composable in the contract: one read, one
// write, no collection. `save` is OMITTED on the standing mock-seam deviation
// — the contract declares it `Promise`-returning, as the real module will,
// while every mock facade answers with a receipt.
declare const notificationPreferences: UseNotificationPreferencesContext;
declare const notificationPreferencesMeta: UseNotificationPreferencesMeta;

export const notificationPreferencesContext: UseNotificationPreferencesContext =
  notificationPreferences;
export const notificationPreferencesMetaLayer: UseNotificationPreferencesMeta =
  notificationPreferencesMeta;
export const notificationPreferencesActions: Omit<
  UseNotificationPreferencesActions,
  "save"
> = mockFacadeLifecycle(noop);

// @ts-expect-error — `preferences` is a required member of the matrix context.
export const notificationPreferencesNeedsCells: UseNotificationPreferencesContext =
  omit(notificationPreferences, "preferences");

// @ts-expect-error — `pagination` is a required member of a collection context.
export const userNotificationsNeedsPagination: UseUserNotificationsContext =
  omit(userNotifications.useContext(), "pagination");

// -----------------------------------------------------------------------------
// client-login-attempts
// -----------------------------------------------------------------------------

const clientLoginAttempts = mintCollection<
  ILoginAttempt,
  ClientLoginAttemptsFilters,
  ClientLoginAttemptsSortableProperties
>({ query: noop, successful: noop, dateCreated: noop });

export const clientLoginAttemptsContext: UseClientLoginAttemptsContext =
  clientLoginAttempts.useContext();
export const clientLoginAttemptsMeta: UseClientLoginAttemptsMeta =
  clientLoginAttempts.useMeta();
export const clientLoginAttemptsActions: UseClientLoginAttemptsActions =
  clientLoginAttempts.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientLoginAttemptsNeedsPagination: UseClientLoginAttemptsContext =
  omit(clientLoginAttempts.useContext(), "pagination");

// -----------------------------------------------------------------------------
// client-affiliate
// -----------------------------------------------------------------------------

const affiliateLinks = mintCollection<
  IAffiliateLink,
  AffiliateLinksFilters,
  AffiliateLinksSortableProperties
>({
  query: noop,
  visits: noop,
  referrals: noop,
  dateCreated: noop
});

export const affiliateLinksContext: UseAffiliateLinksContext =
  affiliateLinks.useContext();
export const affiliateLinksMeta: UseAffiliateLinksMeta =
  affiliateLinks.useMeta();
export const affiliateLinksActions: Omit<
  UseAffiliateLinksActions,
  "create" | "update" | "remove"
> = affiliateLinks.useActions();

const affiliateReferrals = mintCollection<
  IAffiliateReferral,
  AffiliateReferralsFilters,
  AffiliateReferralsSortableProperties
>({ linkId: noop, dateCreated: noop });

export const affiliateReferralsContext: UseAffiliateReferralsContext =
  affiliateReferrals.useContext();
export const affiliateReferralsMeta: UseAffiliateReferralsMeta =
  affiliateReferrals.useMeta();
export const affiliateReferralsActions: UseAffiliateReferralsActions =
  affiliateReferrals.useActions();

const affiliateCommissions = mintCollection<
  IAffiliateCommission,
  AffiliateCommissionsFilters,
  AffiliateCommissionsSortableProperties
>({ dateCreated: noop });

export const affiliateCommissionsContext: UseAffiliateCommissionsContext =
  affiliateCommissions.useContext();
export const affiliateCommissionsMeta: UseAffiliateCommissionsMeta =
  affiliateCommissions.useMeta();
export const affiliateCommissionsActions: UseAffiliateCommissionsActions =
  affiliateCommissions.useActions();

const affiliatePayouts = mintCollection<
  AffiliatePayout,
  AffiliatePayoutsFilters,
  AffiliatePayoutsSortableProperties
>({ datePaid: noop });

export const affiliatePayoutsContext: UseAffiliatePayoutsContext =
  affiliatePayouts.useContext();
export const affiliatePayoutsMeta: UseAffiliatePayoutsMeta =
  affiliatePayouts.useMeta();
export const affiliatePayoutsActions: UseAffiliatePayoutsActions =
  affiliatePayouts.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const affiliateLinksNeedsPagination: UseAffiliateLinksContext = omit(
  affiliateLinks.useContext(),
  "pagination"
);

// The affiliate ACCOUNT is its own composable: one read, and three writes. The
// two the form phase added are OMITTED on the standing mock-seam deviation —
// the contract declares them `Promise`-returning, as the real module will,
// while every mock facade answers with a receipt.
declare const affiliateAccount: UseClientAffiliateContext;
declare const affiliateAccountMeta: UseClientAffiliateMeta;

export const clientAffiliateContext: UseClientAffiliateContext =
  affiliateAccount;
export const clientAffiliateMeta: UseClientAffiliateMeta = affiliateAccountMeta;
export const clientAffiliateActions: Omit<
  UseClientAffiliateActions,
  "enrol" | "requestWithdrawal" | "savePayoutDestination"
> = mockFacadeLifecycle(noop);

// @ts-expect-error — `balances` is a required member of the account context.
export const clientAffiliateNeedsBalances: UseClientAffiliateContext = omit(
  affiliateAccount,
  "balances"
);

// -----------------------------------------------------------------------------
// client-tickets
// -----------------------------------------------------------------------------

const clientTickets = mintCollection<
  ITicket,
  ClientTicketsFilters,
  ClientTicketsSortableProperties
>({
  reference: noop,
  subject: noop,
  department: noop,
  status: noop,
  dateCreated: noop
});

export const clientTicketsContext: UseClientTicketsContext =
  clientTickets.useContext();
export const clientTicketsMeta: UseClientTicketsMeta = clientTickets.useMeta();
export const clientTicketsActions: Omit<UseClientTicketsActions, "create"> =
  clientTickets.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientTicketsNeedsPagination: UseClientTicketsContext = omit(
  clientTickets.useContext(),
  "pagination"
);

// The per-ticket MANAGER's own write. `setRelatedProduct` is OMITTED for the
// reason the account and security writes are: the contract declares it
// `Promise`-returning, as the real module will, while the facade answers with
// a receipt the dispatcher renders (`useMockTicket`). Every lifecycle member
// beside it stays asserted.
declare const ticketActions: Omit<UseClientTicketActions, "setRelatedProduct">;
declare const ticketFilters: ClientTicketsFilters;

export const clientTicketActions: Omit<
  UseClientTicketActions,
  "setRelatedProduct"
> = ticketActions;

// @ts-expect-error — `dateCreated` is a required filter: legacy's own ticket
// listing narrowed by the day the thread was raised.
export const clientTicketsNeedDateCreated: ClientTicketsFilters = omit(
  ticketFilters,
  "dateCreated"
);

// @ts-expect-error — `setSubject` is a required member: a manager that cannot
// rename the thread cannot answer legacy's own edit-subject modal.
export const clientTicketNeedsSetSubject: Omit<
  UseClientTicketActions,
  "setRelatedProduct"
> = omit(ticketActions, "setSubject");

// @ts-expect-error — `editMessage` is a required member: a manager that cannot
// rewrite the client's own message cannot answer legacy's inline editor.
export const clientTicketNeedsEditMessage: Omit<
  UseClientTicketActions,
  "setRelatedProduct"
> = omit(ticketActions, "editMessage");

// @ts-expect-error — `deleteMessage` is a required member: a manager that
// cannot withdraw the client's own message cannot answer legacy's own delete.
export const clientTicketNeedsDeleteMessage: Omit<
  UseClientTicketActions,
  "setRelatedProduct"
> = omit(ticketActions, "deleteMessage");

// @ts-expect-error — `deleteAttachment` is a required member: legacy hung a
// per-file delete off the same gate the message menu ran on.
export const clientTicketNeedsDeleteAttachment: Omit<
  UseClientTicketActions,
  "setRelatedProduct"
> = omit(ticketActions, "deleteAttachment");

// -----------------------------------------------------------------------------
// client-account (no collection — one identity and two writes)
// -----------------------------------------------------------------------------

declare const account: UseClientAccountContext;
declare const accountMeta: UseClientAccountMeta;

export const clientAccountContext: UseClientAccountContext = account;
export const clientAccountMeta: UseClientAccountMeta = accountMeta;

// @ts-expect-error — `activeAccount` is a required member: a context that
// cannot say which account is in play cannot head a card or a menu with it.
export const accountNeedsActive: UseClientAccountContext = omit(
  account,
  "activeAccount"
);

// `switchAccount` is OMITTED for the same reason the security ones are: the
// contract declares it `Promise`-returning, as the real module will, while the
// facade answers with a receipt the dispatcher renders. `saveAvatar` is
// omitted because the facade no longer carries one — legacy served no
// client-facing change-photo, and the platform takes an uploaded image
// relation rather than an address the client types. `destroy` is the REAL
// `UseAccountActions` member, so it stays asserted.
declare const accountActions: Omit<
  UseClientAccountActions,
  "switchAccount" | "saveAvatar"
>;

export const clientAccountActions: Omit<
  UseClientAccountActions,
  "switchAccount" | "saveAvatar"
> = accountActions;

// -----------------------------------------------------------------------------
// client-support-pin (no collection — a single read and two verbs)
// -----------------------------------------------------------------------------

declare const supportPin: UseClientSupportPinContext;

// @ts-expect-error — `pin` is a required member of the support-pin context.
export const supportPinNeedsPin: UseClientSupportPinContext = omit(
  supportPin,
  "pin"
);

// -----------------------------------------------------------------------------
// client-security (no collection — one posture and three writes)
// -----------------------------------------------------------------------------

declare const security: UseClientSecurityContext;
declare const securityMeta: UseClientSecurityMeta;

export const clientSecurityContext: UseClientSecurityContext = security;
export const clientSecurityMeta: UseClientSecurityMeta = securityMeta;

// The three writes are OMITTED, not asserted: the contract declares them
// `Promise`-returning, as the real module will, while every mock facade
// answers with a receipt the dispatcher renders (facades/facade.ts). That is
// the standing mock-seam deviation, recorded here rather than papered over.
export const clientSecurityActions: Omit<
  UseClientSecurityActions,
  "changePassword" | "enableTwoFactor" | "disableTwoFactor"
> = mockFacadeLifecycle(noop);

// The disable write asks for the CODE, as the enable one does — legacy posted
// `auth_code` on its DELETE as well as its POST
// (`configure2faModal.vue:112-124`). Binding a one-argument implementation to
// the contract's own member is what proves the parameter is still declared: a
// member that went back to taking none would refuse this assignment.
declare const disableWithCode: (model: SecurityTwoFactorModel) => Promise<void>;

export const clientSecurityDisable: UseClientSecurityActions["disableTwoFactor"] =
  disableWithCode;

// @ts-expect-error — `twoFactorEnabled` is a required member of the security context.
export const clientSecurityNeedsTwoFactor: UseClientSecurityContext = omit(
  security,
  "twoFactorEnabled"
);

// client-billing-settings (no collection — one record and one write)
// -----------------------------------------------------------------------------

declare const billingSettings: UseClientBillingSettingsContext;
declare const billingSettingsMeta: UseClientBillingSettingsMeta;

// The Meta is graded by the NEGATIVE arm alone: `const x: T = declaredT` is a
// tautology that no rename can redden, which is why the two that stood here
// were dropped rather than kept.
// @ts-expect-error — `hasPriceListChoice` is a required member of the settings meta.
export const clientBillingSettingsNeedsPriceListChoice: UseClientBillingSettingsMeta =
  omit(billingSettingsMeta, "hasPriceListChoice");

// `save` is OMITTED, not asserted, on the same standing mock-seam deviation
// the security contract records: the contract declares it `Promise`-returning,
// as the real module will, while every mock facade answers with a receipt.
export const clientBillingSettingsActions: Omit<
  UseClientBillingSettingsActions,
  "save"
> = mockFacadeLifecycle(noop);

// @ts-expect-error — `priceLists` is a required member of the settings context.
export const clientBillingSettingsNeedsPriceLists: UseClientBillingSettingsContext =
  omit(billingSettings, "priceLists");

// -----------------------------------------------------------------------------
// client-ip-whitelist
// -----------------------------------------------------------------------------

const clientIpWhitelist = mintCollection<
  IIpAddress,
  ClientIpWhitelistFilters,
  ClientIpWhitelistSortableProperties
>({ query: noop });

export const clientIpWhitelistContext: UseClientIpWhitelistContext =
  clientIpWhitelist.useContext();
export const clientIpWhitelistMeta: UseClientIpWhitelistMeta =
  clientIpWhitelist.useMeta();
export const clientIpWhitelistActions: Omit<
  UseClientIpWhitelistActions,
  "remove" | "create"
> = clientIpWhitelist.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientIpWhitelistNeedsPagination: UseClientIpWhitelistContext =
  omit(clientIpWhitelist.useContext(), "pagination");

// -----------------------------------------------------------------------------
// client-custom-pages
// -----------------------------------------------------------------------------

const clientCustomPages = mintCollection<
  ICustomPage,
  ClientCustomPagesFilters,
  ClientCustomPagesSortableProperties
>({ showOnMenu: noop, slug: noop });

export const clientCustomPagesContext: UseClientCustomPagesContext =
  clientCustomPages.useContext();
export const clientCustomPagesMeta: UseClientCustomPagesMeta =
  clientCustomPages.useMeta();
export const clientCustomPagesActions: UseClientCustomPagesActions =
  clientCustomPages.useActions();

// @ts-expect-error — `pagination` is a required member of a collection context.
export const clientCustomPagesNeedsPagination: UseClientCustomPagesContext =
  omit(clientCustomPages.useContext(), "pagination");
