// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades
 * @description The manager facades (plan R3) — one per entity the mock
 * WRITES. The dispatcher (`actions.ts`) is their only caller: it resolves a
 * facade and calls a method, so there is one pattern for reads and writes
 * alike rather than a collection generic beside a bag of store functions.
 */

export {
  defineMockFacade,
  defineScopedInstance,
  MOCK_RECEIPT_REASON,
  mockFacadeLifecycle,
  mockId,
  submittedNumber,
  submittedText
} from "./facade";
export type {
  MockActionReceipt,
  MockFacade,
  MockFacadeContext,
  MockFacadeInternals,
  MockFacadeLifecycle,
  MockFacadeMeta,
  MockReceiptReason
} from "./facade";
export {
  activePersonaAccount,
  hasAccountChoice,
  personaAccounts,
  useMockAccount
} from "./useMockAccount";
export { useMockAffiliate } from "./useMockAffiliate";
export {
  offersPaymentCurrency,
  offersPriceList,
  useMockBillingSettings
} from "./useMockBillingSettings";
export type { MockBillingSettingsView } from "./useMockBillingSettings";
export { useMockCatalogue } from "./useMockCatalogue";
export {
  templateSlotBody,
  useMockClientTemplate
} from "./useMockClientTemplate";
export {
  canOfferMigration,
  isTrialAhead,
  trialDaysRemaining,
  trialEndConfirmation,
  trialNotice,
  migrationPriceLabel,
  orderedMigrationOptions,
  productLifecycleEvents,
  migrationRefusal,
  renewalInvoiceRefusal,
  useMockContractProduct
} from "./useMockContractProduct";
export type { MockProductEvent } from "./useMockContractProduct";
export {
  hasDelegateObject,
  useMockDelegate,
  useMockDelegates
} from "./useMockDelegate";
export {
  consolidatableInvoices,
  hasPendingPayment,
  isInvoiceOwed,
  invoiceRowStanding,
  invoiceStandingMessage,
  isPartlyPaid,
  pendingInstruction,
  useMockInvoice,
  useMockInvoices,
  whyNotConsolidatable
} from "./useMockInvoice";
export {
  invoicePaymentMethod,
  isInvoiceClearing,
  isInvoicePayable,
  whyNotShareable
} from "./useMockInvoice";
export type { MockPayableTender, MockPayTender } from "./useMockInvoice";
export { useMockNotifications } from "./useMockNotifications";
export {
  composerSubmitKey,
  newLineKey,
  submitsWithShortcut,
  useMockPersonalDetails
} from "./useMockPersonalDetails";
export { useMockProvisioning } from "./useMockProvisioning";
export { useMockSecurity } from "./useMockSecurity";
export type { MockProvisioningView } from "./useMockProvisioning";
export { useMockIpWhitelist } from "./useMockIpWhitelist";
export { useMockRelation } from "./useMockRelation";
export { isSupportPinRevealed, useMockSupportPin } from "./useMockSupportPin";
export {
  canCloseTicket,
  canManageTicketMessage,
  canReplyToTicket,
  canDelegateTicket,
  canDetachTicketProduct,
  canRenameTicket,
  canSetTicketProduct,
  hasTicketProduct,
  isOwnTicketMessage,
  isTicketClosed,
  isTicketLocked,
  isTicketMessageDeleted,
  useMockTicket,
  useMockTickets
} from "./useMockTicket";
export { isStagedImport, useMockVault } from "./useMockVault";
export {
  creditLimitBannerTone,
  creditLimitPanelCopy,
  creditLimitRemainingPercent,
  creditLimitSummary,
  creditLimitTone,
  useMockWallet,
  walletBalanceIn
} from "./useMockWallet";
export type {
  MockCreditStatementFile,
  MockCreditStatementView,
  MockWalletCreditLimit,
  MockWalletView
} from "./useMockWallet";
