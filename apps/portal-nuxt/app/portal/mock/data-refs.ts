// -----------------------------------------------------------------------------
/**
 * @module portal/mock/data-refs
 * @description The seam between the STATIC config and the LIVE mock store
 * (plan §4, Phase C). A config prop may carry a `dataRef(id)` instead of a
 * literal; `PortalSlotContent` — the one place module props bind — resolves
 * every ref against the active brand's dataset through the selector registry
 * below, inside a computed, so a store mutation re-renders the module. The
 * module itself still renders only what it is GIVEN (the stage-5 mutant law):
 * the ref never reaches it, the selector output does.
 */

import { ClientTemplateSlotCodes } from "@upmind-automation/types";
import { LIST_MODULE_VARIANT } from "../modules/list/types";
import { MOCK_ACTION, mockActionValue } from "./actions";
import { PAGED_COLLECTION_ID, pagedCollectionHandle } from "./collection-defs";
import {
  composerSubmitKey,
  creditLimitBannerTone,
  creditLimitPanelCopy,
  creditLimitSummary,
  creditLimitTone,
  submitsWithShortcut
} from "./facades";
import {
  customFieldsFormModel,
  customFieldsFormSchema,
  customFieldsFormUischema
} from "./forms/custom-fields-context";
import {
  accountCardItems,
  accountCardSpecItems,
  accountDelegateItems,
  affiliateEnrolAction,
  affiliateIsDisabled,
  affiliateIsEnrolled,
  affiliateIsUnavailable,
  affiliateLinkHeadings,
  affiliateLinkItems,
  affiliateNeedsEnrolling,
  affiliatePayoutHeadings,
  affiliateReferralHeadings,
  affiliateReferralItems,
  affiliateStatItems,
  affiliateLinkHeaderActions,
  affiliateWithdrawalActions,
  affiliatePayoutFormSchema,
  affiliatePayoutFormUischema,
  affiliatePayoutFormModel,
  accountNoteItems,
  accountNoteActions,
  accountSecretItems,
  accountSecretActions,
  accountSectionNavItems,
  delegateInviteAction,
  delegateInviteMessage,
  delegateInviteTitle,
  delegateInviteTone,
  ipWhitelistItems,
  profileEmailItems,
  profilePhoneItems,
  billableEntityItems,
  billableEntityActions,
  isSupportPinEnabled,
  notificationFilterValue,
  notificationFilters,
  notificationLoadMore,
  notificationPreferenceHeadings,
  notificationPreferenceItems,
  notificationPreferencesFormSchema,
  notificationPreferencesFormUischema,
  notificationPreferencesFormModel,
  notificationTopicActions,
  ticketHasRelatedProductLinks,
  ticketRelatedProductLinks,
  emailOptInsFormSchema,
  emailOptInsFormUischema,
  emailOptInsFormModel,
  emailOptInsFormSubmit,
  emailOptInsIntro,
  hasEmailTopics,
  hasClientRegistration,
  hasCustomFields,
  hasRecaptcha,
  loginRecoverAction,
  passwordFormModel,
  passwordFormSchema,
  passwordFormUischema,
  twoFactorFormModel,
  twoFactorFormSchema,
  twoFactorFormUischema,
  verifyEmailFormModel,
  verifyEmailFormSchema,
  verifyEmailFormUischema,
  profileFormModel,
  profileFormSchema,
  profileFormUischema,
  securityTwoFactorActions,
  usernameFormModel,
  usernameFormSchema,
  usernameFormUischema,
  supportPinActions,
  supportPinPanelItems,
  activeProductItems,
  needsAttentionProductItems,
  hasProductsAwaitingSetup,
  areNotesEnabled,
  affiliateCommissionItems,
  affiliatePayoutItems,
  affiliateSpecItems,
  childAccountItems,
  delegateAccessItems,
  delegateHeaderActions,
  delegateIsSpecific,
  delegateProductItems,
  delegateSpecItems,
  delegateTicketItems,
  emailHeaderActions,
  hasParentBranding,
  isEmailDeliveryDelayed,
  parentBrandingActions,
  parentBrandingItems,
  parentBrandingLogoItems,
  relationHeaderActions,
  relationSpecItems,
  relationToggleItems,
  loginAttemptItems,
  sentEmailItems,
  resetPasswordFormSchema,
  resetPasswordFormUischema,
  resetPasswordFormModel,
  setPasswordFormSchema,
  setPasswordFormUischema,
  setPasswordFormModel,
  registerOrgFormSchema,
  registerOrgFormUischema,
  registerOrgFormModel,
  sentEmailTabs,
  sentEmailStatus,
  sentEmailSpecItems,
  sentEmailBody,
  notificationItems,
  notificationPageItems,
  brandLogoHref,
  hasPillarSubmenu,
  pillarNavItems,
  pillarSubmenuItems,
  placeOrderAction,
  profileSpecItems,
  securitySpecItems,
  supportPinSpecItems,
  accountMenuHeading,
  accountMenuItems,
  customPageFrames,
  customPageHasBody,
  customPageHasFrames,
  customPageMarkdown,
  hasTemplate,
  templateMarkdown,
  ticketCanDelegate,
  ticketDelegateItems,
  ticketHasStatusBanner,
  ticketIsOpen,
  ticketManageActions,
  newTicketFormSchema,
  newTicketFormUischema,
  newTicketFormModel,
  ticketManageVariant,
  ticketHasMoreMessages,
  ticketMessageItems,
  ticketThreadActiveTab,
  ticketThreadEmptyTitle,
  ticketThreadMoreActions,
  ticketThreadTabItems,
  ticketSpecItems,
  ticketStatusMessage,
  ticketStatusTitle,
  ticketStatusTone,
  unreadNotificationCount,
  creditNoteDocumentActions,
  creditNoteDocumentMessages,
  creditNoteDocumentHeader,
  creditNoteDocumentLines,
  creditNoteDocumentParty,
  creditNoteDocumentPayments,
  creditNoteDocumentTotals,
  creditNoteInvoiceItems,
  creditNoteListItems,
  creditNoteSpecItems,
  dashboardChildAccountItems,
  dashboardMetricItems,
  groupProductItems,
  groupProductStatus,
  groupProductTabs,
  groupCatalogueItems,
  hasChildAccounts,
  hasNoStoredGateways,
  hasOrderComplete,
  orderCompleteAction,
  orderCompleteDismiss,
  orderCompleteMessage,
  productAcceptedCancellationMessage,
  productAddressItems,
  productCompanyItems,
  productAutoRenewItems,
  productAutoRenewNotice,
  productBillingAddressSpecItems,
  productDelegateAccessItems,
  productHasAcceptedCancellation,
  productHasAutoRenewControls,
  productHasAutoRenewNotice,
  productHasMigrationOptions,
  productHasPendingProRata,
  productHasTimeline,
  productHasUnpaidInvoices,
  productUnpaidInvoiceTone,
  productIsSubscription,
  productLineItemSpecItems,
  productManageActions,
  productMigrationItems,
  productSetupFormSchema,
  productSetupFormUischema,
  productSetupFormModel,
  productSetupFormSubmit,
  productConsolidationFormSchema,
  productConsolidationFormUischema,
  productConsolidationFormModel,
  productConsolidationFormSubmit,
  productHasConsolidationForm,
  productLabelFormSchema,
  productLabelFormUischema,
  productLabelFormModel,
  productLabelFormSubmit,
  productTimelineItems,
  invoiceDocumentActions,
  invoiceDocumentHeader,
  invoiceDocumentLines,
  invoiceDocumentMessages,
  invoiceDocumentDetails,
  invoiceDocumentPaidStamp,
  invoiceDocumentParty,
  invoiceDocumentPayments,
  invoiceDocumentTotals,
  invoiceIsPayable,
  invoiceLineItems,
  invoiceSpecItems,
  needsAttentionAction,
  needsAttentionMessage,
  orderCreditNoteItems,
  orderDateSpecItems,
  orderDetailSpecItems,
  orderHasDetails,
  orderIsDelegated,
  orderDelegatedMessage,
  orderInvoiceItems,
  orderItemRows,
  orderSpecItems,
  isSupportEnabled,
  productAboutMarkdown,
  productAreaNavItems,
  productBackTo,
  productBillboardItems,
  productBillingSpecItems,
  productConditionAction,
  productConditionMessage,
  productHasTrialMessage,
  productTrialAction,
  productTrialMessage,
  productConditionTitle,
  productConditionTone,
  productCreditNoteItems,
  productDelegateItems,
  productHasAbout,
  productHasCondition,
  productHasProvisionActions,
  productHasProvisionFields,
  productHasProvisionFrames,
  productHasQuickActions,
  productInvoiceItems,
  productNoteItems,
  productNoteActions,
  productProvisionActions,
  productProvisionFieldItems,
  productProvisionFrames,
  productQuickActions,
  productSecretItems,
  productSecretActions,
  productSpecItems,
  productSupportAction,
  productTicketItems,
  recentInvoiceItems,
  recentTicketItems,
  invoiceConsolidationAction,
  invoiceConsolidationMessage,
  invoiceConsolidationVisible,
  invoiceItems,
  invoiceStatus,
  invoiceTabs,
  ticketItems,
  ticketStatus,
  ticketTabs,
  walletBalanceItems,
  walletCreditAllowance,
  walletCreditLimitSpecItems,
  walletCreditStatementItems,
  walletHasCreditStatements,
  creditStatementSpecItems,
  creditStatementMovementItems,
  walletCreditUsed,
  walletHasCreditLimit,
  walletHeaderActions,
  billingSettingsFormSchema,
  billingSettingsFormUischema,
  billingSettingsFormModel
} from "./selectors";
import { assign, isObject, isString, map, mapValues } from "lodash-es";
import type { PagedCollectionId } from "./collection-defs";
import type { DataRouteContext } from "./injection";
import type { MockDataset } from "./types";
import type { ListModuleVariant } from "../modules/list/types";
import type {
  ListControlsFilter,
  ListControlsState
} from "../modules/list-controls/types";
import type { PaginationModuleState } from "../modules/pagination/types";
import type { ListView } from "~/composables/useListViewPreference";
import {
  LIST_VIEW,
  useListViewPreference
} from "~/composables/useListViewPreference";

export const DATA_REF_ID = {
  ACTIVE_PRODUCT_ITEMS: "active-product-items",
  // --- the dashboard's needs-attention cards (plan F5 O7)
  NEEDS_ATTENTION_PRODUCT_ITEMS: "needs-attention-product-items",
  HAS_PRODUCTS_AWAITING_SETUP: "has-products-awaiting-setup",
  DASHBOARD_METRIC_ITEMS: "dashboard-metric-items",
  NEEDS_ATTENTION_MESSAGE: "needs-attention-message",
  NEEDS_ATTENTION_ACTION: "needs-attention-action",
  DASHBOARD_CHILD_ACCOUNT_ITEMS: "dashboard-child-account-items",
  HAS_CHILD_ACCOUNTS: "has-child-accounts",
  RECENT_INVOICE_ITEMS: "recent-invoice-items",
  RECENT_TICKET_ITEMS: "recent-ticket-items",
  GROUP_PRODUCT_ITEMS: "group-product-items",
  GROUP_PRODUCT_TABS: "group-product-tabs",
  GROUP_PRODUCT_STATUS: "group-product-status",
  GROUP_CATALOGUE_ITEMS: "group-catalogue-items",
  PRODUCT_SPEC_ITEMS: "product-spec-items",
  PRODUCT_BILLING_SPEC_ITEMS: "product-billing-spec-items",
  PRODUCT_AREA_NAV_ITEMS: "product-area-nav-items",
  PRODUCT_BACK_TO: "product-back-to",
  PRODUCT_TICKET_ITEMS: "product-ticket-items",
  PRODUCT_DELEGATE_ITEMS: "product-delegate-items",
  // --- the product detail's shared chrome (plan Phase 3)
  PRODUCT_BILLBOARD_ITEMS: "product-billboard-items",
  PRODUCT_HAS_CONDITION: "product-has-condition",
  PRODUCT_CONDITION_TITLE: "product-condition-title",
  PRODUCT_CONDITION_MESSAGE: "product-condition-message",
  PRODUCT_HAS_TRIAL_MESSAGE: "product-has-trial-message",
  PRODUCT_TRIAL_MESSAGE: "product-trial-message",
  PRODUCT_TRIAL_ACTION: "product-trial-action",
  PRODUCT_CONDITION_TONE: "product-condition-tone",
  PRODUCT_CONDITION_ACTION: "product-condition-action",
  PRODUCT_ABOUT_MARKDOWN: "product-about-markdown",
  PRODUCT_HAS_ABOUT: "product-has-about",
  PRODUCT_SUPPORT_ACTION: "product-support-action",
  IS_SUPPORT_ENABLED: "is-support-enabled",
  // --- the provider surface
  PRODUCT_PROVISION_FIELD_ITEMS: "product-provision-field-items",
  PRODUCT_HAS_PROVISION_FIELDS: "product-has-provision-fields",
  PRODUCT_PROVISION_ACTIONS: "product-provision-actions",
  PRODUCT_HAS_PROVISION_ACTIONS: "product-has-provision-actions",
  PRODUCT_QUICK_ACTIONS: "product-quick-actions",
  PRODUCT_HAS_QUICK_ACTIONS: "product-has-quick-actions",
  PRODUCT_PROVISION_FRAMES: "product-provision-frames",
  PRODUCT_HAS_PROVISION_FRAMES: "product-has-provision-frames",
  // --- this product's own notes, secrets and documents
  PRODUCT_NOTE_ITEMS: "product-note-items",
  PRODUCT_NOTE_ACTIONS: "product-note-actions",
  PRODUCT_SECRET_ITEMS: "product-secret-items",
  PRODUCT_SECRET_ACTIONS: "product-secret-actions",
  PRODUCT_INVOICE_ITEMS: "product-invoice-items",
  PRODUCT_CREDIT_NOTE_ITEMS: "product-credit-note-items",
  // --- the subscription lifecycle (plan Phase 3)
  PRODUCT_LINE_ITEM_SPEC_ITEMS: "product-line-item-spec-items",
  PRODUCT_IS_SUBSCRIPTION: "product-is-subscription",
  PRODUCT_MANAGE_ACTIONS: "product-manage-actions",
  PRODUCT_MIGRATION_ITEMS: "product-migration-items",
  PRODUCT_HAS_MIGRATION_OPTIONS: "product-has-migration-options",
  PRODUCT_HAS_ACCEPTED_CANCELLATION: "product-has-accepted-cancellation",
  PRODUCT_ACCEPTED_CANCELLATION_MESSAGE:
    "product-accepted-cancellation-message",
  PRODUCT_HAS_PENDING_PRO_RATA: "product-has-pending-pro-rata",
  PRODUCT_TIMELINE_ITEMS: "product-timeline-items",
  PRODUCT_HAS_TIMELINE: "product-has-timeline",
  PRODUCT_SETUP_FORM_SCHEMA: "product-setup-form-schema",
  PRODUCT_SETUP_FORM_UISCHEMA: "product-setup-form-uischema",
  PRODUCT_SETUP_FORM_MODEL: "product-setup-form-model",
  PRODUCT_SETUP_FORM_SUBMIT: "product-setup-form-submit",
  // --- the billing area's consolidation form
  PRODUCT_CONSOLIDATION_FORM_SCHEMA: "product-consolidation-form-schema",
  PRODUCT_CONSOLIDATION_FORM_UISCHEMA: "product-consolidation-form-uischema",
  PRODUCT_CONSOLIDATION_FORM_MODEL: "product-consolidation-form-model",
  PRODUCT_CONSOLIDATION_FORM_SUBMIT: "product-consolidation-form-submit",
  PRODUCT_HAS_CONSOLIDATION_FORM: "product-has-consolidation-form",
  // --- the settings area
  PRODUCT_LABEL_FORM_SCHEMA: "product-label-form-schema",
  PRODUCT_LABEL_FORM_UISCHEMA: "product-label-form-uischema",
  PRODUCT_LABEL_FORM_MODEL: "product-label-form-model",
  PRODUCT_LABEL_FORM_SUBMIT: "product-label-form-submit",
  PRODUCT_AUTO_RENEW_ITEMS: "product-auto-renew-items",
  PRODUCT_HAS_AUTO_RENEW_CONTROLS: "product-has-auto-renew-controls",
  PRODUCT_AUTO_RENEW_NOTICE: "product-auto-renew-notice",
  PRODUCT_HAS_AUTO_RENEW_NOTICE: "product-has-auto-renew-notice",
  PRODUCT_HAS_UNPAID_INVOICES: "product-has-unpaid-invoices",
  PRODUCT_UNPAID_INVOICE_TONE: "product-unpaid-invoice-tone",
  PRODUCT_BILLING_ADDRESS_SPEC_ITEMS: "product-billing-address-spec-items",
  PRODUCT_ADDRESS_ITEMS: "product-address-items",
  PRODUCT_COMPANY_ITEMS: "product-company-items",
  PRODUCT_DELEGATE_ACCESS_ITEMS: "product-delegate-access-items",
  // --- the order-complete band on the group listing
  HAS_ORDER_COMPLETE: "has-order-complete",
  ORDER_COMPLETE_MESSAGE: "order-complete-message",
  ORDER_COMPLETE_ACTION: "order-complete-action",
  ORDER_COMPLETE_DISMISS: "order-complete-dismiss",
  INVOICE_ITEMS: "invoice-items",
  INVOICE_TABS: "invoice-tabs",
  INVOICE_STATUS: "invoice-status",
  // --- legacy's consolidation message over the listing (plan F6 P3)
  INVOICE_CONSOLIDATION_VISIBLE: "invoice-consolidation-visible",
  INVOICE_CONSOLIDATION_MESSAGE: "invoice-consolidation-message",
  INVOICE_CONSOLIDATION_ACTION: "invoice-consolidation-action",
  INVOICE_SPEC_ITEMS: "invoice-spec-items",
  INVOICE_LINE_ITEMS: "invoice-line-items",
  // The invoice document's own seven parts — one ref per module prop, as
  // every other module's props are fed.
  INVOICE_DOCUMENT_HEADER: "invoice-document-header",
  INVOICE_DOCUMENT_PARTY: "invoice-document-party",
  INVOICE_DOCUMENT_LINES: "invoice-document-lines",
  INVOICE_DOCUMENT_TOTALS: "invoice-document-totals",
  INVOICE_DOCUMENT_PAYMENTS: "invoice-document-payments",
  INVOICE_DOCUMENT_MESSAGES: "invoice-document-messages",
  INVOICE_DOCUMENT_PAID_STAMP: "invoice-document-paid-stamp",
  INVOICE_DOCUMENT_DETAILS: "invoice-document-details",
  INVOICE_DOCUMENT_ACTIONS: "invoice-document-actions",
  INVOICE_IS_PAYABLE: "invoice-is-payable",
  ORDER_SPEC_ITEMS: "order-spec-items",
  ORDER_ITEM_ROWS: "order-item-rows",
  ORDER_DATE_SPEC_ITEMS: "order-date-spec-items",
  ORDER_DETAIL_SPEC_ITEMS: "order-detail-spec-items",
  ORDER_HAS_DETAILS: "order-has-details",
  ORDER_IS_DELEGATED: "order-is-delegated",
  ORDER_DELEGATED_MESSAGE: "order-delegated-message",
  ORDER_INVOICE_ITEMS: "order-invoice-items",
  ORDER_CREDIT_NOTE_ITEMS: "order-credit-note-items",
  CREDIT_NOTE_LIST_ITEMS: "credit-note-list-items",
  CREDIT_NOTE_SPEC_ITEMS: "credit-note-spec-items",
  CREDIT_NOTE_DOCUMENT_HEADER: "credit-note-document-header",
  CREDIT_NOTE_DOCUMENT_PARTY: "credit-note-document-party",
  CREDIT_NOTE_DOCUMENT_LINES: "credit-note-document-lines",
  CREDIT_NOTE_DOCUMENT_TOTALS: "credit-note-document-totals",
  CREDIT_NOTE_DOCUMENT_PAYMENTS: "credit-note-document-payments",
  CREDIT_NOTE_DOCUMENT_MESSAGES: "credit-note-document-messages",
  CREDIT_NOTE_DOCUMENT_ACTIONS: "credit-note-document-actions",
  CREDIT_NOTE_INVOICE_ITEMS: "credit-note-invoice-items",
  HAS_NO_STORED_GATEWAYS: "has-no-stored-gateways",
  WALLET_BALANCE_ITEMS: "wallet-balance-items",
  WALLET_CREDIT_LIMIT_SPEC_ITEMS: "wallet-credit-limit-spec-items",
  WALLET_CREDIT_USED: "wallet-credit-used",
  WALLET_CREDIT_ALLOWANCE: "wallet-credit-allowance",
  WALLET_CREDIT_TONE: "wallet-credit-tone",
  WALLET_CREDIT_BANNER_TONE: "wallet-credit-banner-tone",
  WALLET_CREDIT_SUMMARY: "wallet-credit-summary",
  WALLET_CREDIT_PANEL_COPY: "wallet-credit-panel-copy",
  WALLET_HAS_CREDIT_LIMIT: "wallet-has-credit-limit",
  WALLET_HEADER_ACTIONS: "wallet-header-actions",
  WALLET_CREDIT_STATEMENT_ITEMS: "wallet-credit-statement-items",
  WALLET_HAS_CREDIT_STATEMENTS: "wallet-has-credit-statements",
  CREDIT_STATEMENT_SPEC_ITEMS: "credit-statement-spec-items",
  CREDIT_STATEMENT_MOVEMENT_ITEMS: "credit-statement-movement-items",
  // --- the billing settings page's one form (plan F4)
  BILLING_SETTINGS_FORM_SCHEMA: "billing-settings-form-schema",
  BILLING_SETTINGS_FORM_UISCHEMA: "billing-settings-form-uischema",
  BILLING_SETTINGS_FORM_MODEL: "billing-settings-form-model",
  ACCOUNT_SECTION_NAV_ITEMS: "account-section-nav-items",
  // --- the account pillar's own aside card (plan Phase 4)
  ACCOUNT_CARD_ITEMS: "account-card-items",
  ACCOUNT_CARD_SPEC_ITEMS: "account-card-spec-items",
  IS_SUPPORT_PIN_ENABLED: "is-support-pin-enabled",
  SUPPORT_PIN_PANEL_ITEMS: "support-pin-panel-items",
  SUPPORT_PIN_ACTIONS: "support-pin-actions",
  // --- contact data, through the four REAL scoped collections
  PROFILE_SPEC_ITEMS: "profile-spec-items",
  PROFILE_FORM_SCHEMA: "profile-form-schema",
  PROFILE_FORM_UISCHEMA: "profile-form-uischema",
  PROFILE_FORM_MODEL: "profile-form-model",
  CUSTOM_FIELDS_FORM_SCHEMA: "custom-fields-form-schema",
  CUSTOM_FIELDS_FORM_UISCHEMA: "custom-fields-form-uischema",
  CUSTOM_FIELDS_FORM_MODEL: "custom-fields-form-model",
  HAS_CUSTOM_FIELDS: "has-custom-fields",
  SECURITY_SPEC_ITEMS: "security-spec-items",
  SECURITY_TWOFA_ACTIONS: "security-twofa-actions",
  USERNAME_FORM_SCHEMA: "username-form-schema",
  USERNAME_FORM_UISCHEMA: "username-form-uischema",
  USERNAME_FORM_MODEL: "username-form-model",
  PASSWORD_FORM_SCHEMA: "password-form-schema",
  PASSWORD_FORM_UISCHEMA: "password-form-uischema",
  PASSWORD_FORM_MODEL: "password-form-model",
  LOGIN_RECOVER_ACTION: "login-recover-action",
  HAS_CLIENT_REGISTRATION: "has-client-registration",
  VERIFY_EMAIL_FORM_SCHEMA: "verify-email-form-schema",
  VERIFY_EMAIL_FORM_UISCHEMA: "verify-email-form-uischema",
  VERIFY_EMAIL_FORM_MODEL: "verify-email-form-model",
  TWOFA_FORM_SCHEMA: "twofa-form-schema",
  TWOFA_FORM_UISCHEMA: "twofa-form-uischema",
  TWOFA_FORM_MODEL: "twofa-form-model",
  HAS_RECAPTCHA: "has-recaptcha",
  DELEGATE_INVITE_TITLE: "delegate-invite-title",
  DELEGATE_INVITE_MESSAGE: "delegate-invite-message",
  DELEGATE_INVITE_TONE: "delegate-invite-tone",
  DELEGATE_INVITE_ACTION: "delegate-invite-action",
  IP_WHITELIST_ITEMS: "ip-whitelist-items",
  // --- the profile page's contact lists
  PROFILE_EMAIL_ITEMS: "profile-email-items",
  PROFILE_PHONE_ITEMS: "profile-phone-items",
  BILLABLE_ENTITY_ITEMS: "billable-entity-items",
  BILLABLE_ENTITY_ACTIONS: "billable-entity-actions",
  BILLABLE_ENTITIES_CONTROLS: "billable-entities-controls",
  NOTIFICATION_ITEMS: "notification-items",
  NOTIFICATION_FILTERS: "notification-filters",
  NOTIFICATION_FILTER_VALUE: "notification-filter-value",
  NOTIFICATION_LOAD_MORE: "notification-load-more",
  NOTIFICATION_PAGE_ITEMS: "notification-page-items",
  NOTIFICATION_PREFERENCE_ITEMS: "notification-preference-items",
  NOTIFICATION_PREFERENCE_HEADINGS: "notification-preference-headings",
  // --- the notifications page's own matrix, as a form (plan F4)
  NOTIFICATION_PREFERENCES_FORM_SCHEMA: "notification-preferences-form-schema",
  NOTIFICATION_PREFERENCES_FORM_UISCHEMA:
    "notification-preferences-form-uischema",
  NOTIFICATION_PREFERENCES_FORM_MODEL: "notification-preferences-form-model",
  NOTIFICATION_TOPIC_ACTIONS: "notification-topic-actions",
  // --- the two logged-out token screens (plan F5 O2)
  EMAIL_OPT_INS_FORM_SCHEMA: "email-opt-ins-form-schema",
  EMAIL_OPT_INS_FORM_UISCHEMA: "email-opt-ins-form-uischema",
  EMAIL_OPT_INS_FORM_MODEL: "email-opt-ins-form-model",
  EMAIL_OPT_INS_FORM_SUBMIT: "email-opt-ins-form-submit",
  EMAIL_OPT_INS_INTRO: "email-opt-ins-intro",
  HAS_EMAIL_TOPICS: "has-email-topics",
  ARE_NOTES_ENABLED: "are-notes-enabled",
  ACCOUNT_NOTE_ITEMS: "account-note-items",
  ACCOUNT_NOTE_ACTIONS: "account-note-actions",
  ACCOUNT_SECRET_ITEMS: "account-secret-items",
  ACCOUNT_SECRET_ACTIONS: "account-secret-actions",
  ACCOUNT_DELEGATE_ITEMS: "account-delegate-items",
  DELEGATE_SPEC_ITEMS: "delegate-spec-items",
  DELEGATE_HEADER_ACTIONS: "delegate-header-actions",
  DELEGATE_ACCESS_ITEMS: "delegate-access-items",
  DELEGATE_IS_SPECIFIC: "delegate-is-specific",
  DELEGATE_PRODUCT_ITEMS: "delegate-product-items",
  DELEGATE_TICKET_ITEMS: "delegate-ticket-items",
  CHILD_ACCOUNT_ITEMS: "child-account-items",
  RELATION_SPEC_ITEMS: "relation-spec-items",
  RELATION_TOGGLE_ITEMS: "relation-toggle-items",
  RELATION_HEADER_ACTIONS: "relation-header-actions",
  HAS_PARENT_BRANDING: "has-parent-branding",
  PARENT_BRANDING_ITEMS: "parent-branding-items",
  PARENT_BRANDING_ACTIONS: "parent-branding-actions",
  PARENT_BRANDING_LOGO_ITEMS: "parent-branding-logo-items",
  AFFILIATE_SPEC_ITEMS: "affiliate-spec-items",
  AFFILIATE_IS_ENROLLED: "affiliate-is-enrolled",
  AFFILIATE_NEEDS_ENROLLING: "affiliate-needs-enrolling",
  AFFILIATE_IS_DISABLED: "affiliate-is-disabled",
  AFFILIATE_IS_UNAVAILABLE: "affiliate-is-unavailable",
  AFFILIATE_ENROL_ACTION: "affiliate-enrol-action",
  AFFILIATE_STAT_ITEMS: "affiliate-stat-items",
  AFFILIATE_LINK_ITEMS: "affiliate-link-items",
  AFFILIATE_LINK_HEADINGS: "affiliate-link-headings",
  AFFILIATE_LINK_HEADER_ACTIONS: "affiliate-link-header-actions",
  AFFILIATE_WITHDRAWAL_ACTIONS: "affiliate-withdrawal-actions",
  // --- where withdrawals are sent, as a form (plan F4)
  AFFILIATE_PAYOUT_FORM_SCHEMA: "affiliate-payout-form-schema",
  AFFILIATE_PAYOUT_FORM_UISCHEMA: "affiliate-payout-form-uischema",
  AFFILIATE_PAYOUT_FORM_MODEL: "affiliate-payout-form-model",
  AFFILIATE_REFERRAL_ITEMS: "affiliate-referral-items",
  AFFILIATE_REFERRAL_HEADINGS: "affiliate-referral-headings",
  AFFILIATE_PAYOUT_HEADINGS: "affiliate-payout-headings",
  AFFILIATE_COMMISSION_ITEMS: "affiliate-commission-items",
  AFFILIATE_PAYOUT_ITEMS: "affiliate-payout-items",
  IS_EMAIL_DELIVERY_DELAYED: "is-email-delivery-delayed",
  EMAIL_HEADER_ACTIONS: "email-header-actions",
  LOGIN_ATTEMPT_ITEMS: "login-attempt-items",
  // --- legacy's email history
  // --- the logged-out forms
  RESET_PASSWORD_FORM_SCHEMA: "reset-password-form-schema",
  RESET_PASSWORD_FORM_UISCHEMA: "reset-password-form-uischema",
  RESET_PASSWORD_FORM_MODEL: "reset-password-form-model",
  SET_PASSWORD_FORM_SCHEMA: "set-password-form-schema",
  SET_PASSWORD_FORM_UISCHEMA: "set-password-form-uischema",
  SET_PASSWORD_FORM_MODEL: "set-password-form-model",
  REGISTER_ORG_FORM_SCHEMA: "register-org-form-schema",
  REGISTER_ORG_FORM_UISCHEMA: "register-org-form-uischema",
  REGISTER_ORG_FORM_MODEL: "register-org-form-model",
  SENT_EMAIL_ITEMS: "sent-email-items",
  SENT_EMAIL_TABS: "sent-email-tabs",
  SENT_EMAIL_STATUS: "sent-email-status",
  SENT_EMAIL_SPEC_ITEMS: "sent-email-spec-items",
  SENT_EMAIL_BODY: "sent-email-body",
  TICKET_ITEMS: "ticket-items",
  TICKET_TABS: "ticket-tabs",
  TICKET_STATUS: "ticket-status",
  TICKET_SPEC_ITEMS: "ticket-spec-items",
  TICKET_MESSAGE_ITEMS: "ticket-message-items",
  TICKET_THREAD_TABS: "ticket-thread-tabs",
  TICKET_THREAD_ACTIVE_TAB: "ticket-thread-active-tab",
  TICKET_THREAD_EMPTY_TITLE: "ticket-thread-empty-title",
  TICKET_HAS_MORE_MESSAGES: "ticket-has-more-messages",
  TICKET_THREAD_MORE_ACTIONS: "ticket-thread-more-actions",
  TICKET_COMPOSER_SUBMIT_KEY: "ticket-composer-submit-key",
  TICKET_IS_OPEN: "ticket-is-open",
  TICKET_HAS_STATUS_BANNER: "ticket-has-status-banner",
  TICKET_STATUS_TITLE: "ticket-status-title",
  TICKET_STATUS_MESSAGE: "ticket-status-message",
  TICKET_STATUS_TONE: "ticket-status-tone",
  TICKET_MANAGE_ACTIONS: "ticket-manage-actions",
  TICKET_MANAGE_VARIANT: "ticket-manage-variant",
  TICKET_CAN_DELEGATE: "ticket-can-delegate",
  TICKET_DELEGATE_ITEMS: "ticket-delegate-items",
  TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT:
    "ticket-composer-submits-with-shortcut",
  TICKET_RELATED_PRODUCT_LINKS: "ticket-related-product-links",
  TICKET_HAS_RELATED_PRODUCT_LINKS: "ticket-has-related-product-links",
  // --- the new-ticket page's one form (plan F4)
  NEW_TICKET_FORM_SCHEMA: "new-ticket-form-schema",
  NEW_TICKET_FORM_UISCHEMA: "new-ticket-form-uischema",
  NEW_TICKET_FORM_MODEL: "new-ticket-form-model",
  SUPPORT_PIN_SPEC_ITEMS: "support-pin-spec-items",
  UNREAD_NOTIFICATION_COUNT: "unread-notification-count",
  PILLAR_NAV_ITEMS: "pillar-nav-items",
  BRAND_LOGO_HREF: "brand-logo-href",
  PILLAR_SUBMENU_ITEMS: "pillar-submenu-items",
  HAS_PILLAR_SUBMENU: "has-pillar-submenu",
  // --- the profile dropdown (gap doc §6)
  ACCOUNT_MENU_HEADING: "account-menu-heading",
  ACCOUNT_MENU_ITEMS: "account-menu-items",
  // --- brand-authored template slots (plan R12), one pair per slot code
  TEMPLATE_DASHBOARD_MARKDOWN: "template-dashboard-markdown",
  TEMPLATE_HAS_DASHBOARD: "template-has-dashboard",
  TEMPLATE_INVOICES_MARKDOWN: "template-invoices-markdown",
  TEMPLATE_HAS_INVOICES: "template-has-invoices",
  TEMPLATE_SUPPORT_MARKDOWN: "template-support-markdown",
  TEMPLATE_HAS_SUPPORT: "template-has-support",
  TEMPLATE_AFFILIATES_MARKDOWN: "template-affiliates-markdown",
  TEMPLATE_HAS_AFFILIATES: "template-has-affiliates",
  TEMPLATE_PRODUCT_MARKDOWN: "template-product-markdown",
  TEMPLATE_HAS_PRODUCT: "template-has-product",
  // --- the brand's own extra pages (gap doc X15)
  CUSTOM_PAGE_MARKDOWN: "custom-page-markdown",
  CUSTOM_PAGE_HAS_BODY: "custom-page-has-body",
  CUSTOM_PAGE_FRAMES: "custom-page-frames",
  CUSTOM_PAGE_HAS_FRAMES: "custom-page-has-frames",
  // --- pager-state refs (plan §2 pager wiring): one per paged panel, each
  // feeding the pagination module's single `state` prop from its collection
  // facade. Registered through `pagerState(...)` below.
  GROUP_PRODUCTS_PAGER: "group-products-pager",
  GROUP_CATALOGUE_PAGER: "group-catalogue-pager",
  PRODUCT_TICKETS_PAGER: "product-tickets-pager",
  TICKET_DELEGATES_PAGER: "ticket-delegates-pager",
  TICKET_DELEGATES_CONTROLS: "ticket-delegates-controls",
  PRODUCT_DELEGATE_ACCESS_PAGER: "product-delegate-access-pager",
  PRODUCT_DELEGATE_ACCESS_CONTROLS: "product-delegate-access-controls",
  PRODUCT_DELEGATES_PAGER: "product-delegates-pager",
  PRODUCT_DELEGATES_CONTROLS: "product-delegates-controls",
  DELEGATE_PRODUCTS_PAGER: "delegate-products-pager",
  DELEGATE_TICKETS_PAGER: "delegate-tickets-pager",
  DELEGATE_PRODUCTS_CONTROLS: "delegate-products-controls",
  DELEGATE_TICKETS_CONTROLS: "delegate-tickets-controls",
  INVOICES_PAGER: "invoices-pager",
  CREDIT_NOTES_PAGER: "credit-notes-pager",
  CREDIT_STATEMENTS_PAGER: "credit-statements-pager",
  NOTIFICATIONS_PAGER: "notifications-pager",
  ACCOUNT_NOTES_PAGER: "account-notes-pager",
  ACCOUNT_SECRETS_PAGER: "account-secrets-pager",
  PRODUCT_INVOICES_PAGER: "product-invoices-pager",
  PRODUCT_CREDIT_NOTES_PAGER: "product-credit-notes-pager",
  ACCOUNT_DELEGATES_PAGER: "account-delegates-pager",
  CHILD_ACCOUNTS_PAGER: "child-accounts-pager",
  AFFILIATE_COMMISSIONS_PAGER: "affiliate-commissions-pager",
  AFFILIATE_LINKS_PAGER: "affiliate-links-pager",
  AFFILIATE_LINKS_CONTROLS: "affiliate-links-controls",
  AFFILIATE_COMMISSIONS_CONTROLS: "affiliate-commissions-controls",
  AFFILIATE_PAYOUTS_CONTROLS: "affiliate-payouts-controls",
  AFFILIATE_PAYOUTS_PAGER: "affiliate-payouts-pager",
  AFFILIATE_REFERRALS_PAGER: "affiliate-referrals-pager",
  LOGIN_ATTEMPTS_PAGER: "login-attempts-pager",
  SENT_EMAILS_PAGER: "sent-emails-pager",
  IP_WHITELIST_PAGER: "ip-whitelist-pager",
  TICKETS_PAGER: "tickets-pager",
  // --- control-state refs: one per SEARCHABLE panel, each feeding the
  // list-controls module's single `state` prop from its collection facade. Registered
  // through `listControlsState(...)` below.
  GROUP_PRODUCTS_CONTROLS: "group-products-controls",
  INVOICES_CONTROLS: "invoices-controls",
  TICKETS_CONTROLS: "tickets-controls",
  CREDIT_STATEMENTS_CONTROLS: "credit-statements-controls",
  ACCOUNT_DELEGATES_CONTROLS: "account-delegates-controls",
  AFFILIATE_REFERRALS_CONTROLS: "affiliate-referrals-controls",
  CHILD_ACCOUNTS_CONTROLS: "child-accounts-controls",
  LOGIN_ATTEMPTS_CONTROLS: "login-attempts-controls",
  SENT_EMAILS_CONTROLS: "sent-emails-controls",
  IP_WHITELIST_CONTROLS: "ip-whitelist-controls",
  PRODUCT_INVOICES_CONTROLS: "product-invoices-controls",
  PRODUCT_CREDIT_NOTES_CONTROLS: "product-credit-notes-controls",
  PRODUCT_TICKETS_CONTROLS: "product-tickets-controls",
  CREDIT_NOTES_CONTROLS: "credit-notes-controls",
  /** The products listing's own layout — the preference, as the list module's variant. */
  GROUP_PRODUCT_VIEW: "group-product-view",
  /** The empty products/orders list's one CTA, behind the brand's store gate. */
  PLACE_ORDER_ACTION: "place-order-action"
} as const;

export type DataRefId = (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID];

const DATA_REF_KIND = "portal-data-ref" as const;

export type DataRef = {
  readonly kind: typeof DATA_REF_KIND;
  readonly id: DataRefId;
};

/** The config-side authoring function — the only way a prop names live data. */
export function dataRef(id: DataRefId): DataRef {
  return { kind: DATA_REF_KIND, id };
}

// `isObject` rather than `isPlainObject`: only its narrowing lets the fields be
// read without an assertion, and an array carries neither of them. The `id` is
// checked against the selector table too — a ref built by hand rather than
// through `dataRef()` would otherwise reach an undefined selector and throw
// mid-render, where an absent dataset merely degrades to `undefined`.
export function isDataRef(value: unknown): value is DataRef {
  return (
    isObject(value) &&
    "kind" in value &&
    value.kind === DATA_REF_KIND &&
    "id" in value &&
    isString(value.id) &&
    value.id in SELECTOR_BY_REF
  );
}

/**
 * One selector per paged panel: the pagination module's `state`, straight off
 * the facade's PaginationInfo. The arrows' action values carry the paged
 * collection's wire id, so `dispatchMockAction` can resolve the SAME instance
 * with the live route context.
 */
function pagerState(pagedId: PagedCollectionId) {
  return (
    data: MockDataset,
    context: DataRouteContext
  ): PaginationModuleState => {
    const { pagination } = pagedCollectionHandle(
      pagedId,
      data,
      context
    ).useContext();
    return {
      total: pagination.value.total,
      itemsPerPage: pagination.value.limit,
      page: pagination.value.page,
      prevValue: mockActionValue(MOCK_ACTION.PAGE_PREV, pagedId),
      nextValue: mockActionValue(MOCK_ACTION.PAGE_NEXT, pagedId),
      pageSizeValue: String(pagination.value.limit),
      pageSizeAction: mockActionValue(MOCK_ACTION.SET_PAGE_SIZE, pagedId),
      pageSizeLabel: "Rows per page",
      pageSizeOptions: PAGE_SIZE_OPTIONS
    };
  };
}

/** How many rows a panel shows — the platform's own page size, then two coarser reads of the same list. */
const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" }
];

/** The two layouts legacy's products listing offered. The copy lives here, with the tab labels. */
const LIST_VIEW_OPTIONS = [
  { value: LIST_VIEW.GRID, label: "Grid" },
  { value: LIST_VIEW.TABLE, label: "Table" }
];

/**
 * One selector per searchable panel: the list-controls module's `state`, straight off
 * the facade's own applied query and named sort options. The action values
 * carry the paged collection's wire id, so `dispatchMockAction` reaches the
 * SAME instance the list renders. A def with no sort options gets no select —
 * read off the handle, never off the panel's name.
 *
 * Every entry is a real order the collection can apply: there is no "Default"
 * row, because a client reading one cannot tell what order it means. The list
 * opens on the def's FIRST option and the select names it from the start.
 */
function listControlsState(
  pagedId: PagedCollectionId,
  options?: { readonly view?: boolean }
) {
  return (data: MockDataset, context: DataRouteContext): ListControlsState => {
    const {
      appliedQuery,
      activeSort,
      sortOptions,
      filterControls,
      appliedFilters,
      isSearchable
    } = pagedCollectionHandle(pagedId, data, context).useContext();

    function searchFields(): Partial<ListControlsState> {
      if (!isSearchable) return {};
      return {
        searchValue: appliedQuery.value,
        searchAction: mockActionValue(MOCK_ACTION.COLLECTION_SEARCH, pagedId)
      };
    }

    function filterFields(): Partial<ListControlsState> {
      if (filterControls.length === 0) return {};
      return {
        filters: map(
          filterControls,
          (control): ListControlsFilter => ({
            key: control.key,
            label: control.label,
            kind: control.kind,
            options: control.options,
            value: appliedFilters.value[control.key] ?? "",
            action: mockActionValue(
              MOCK_ACTION.COLLECTION_FILTER,
              `${pagedId}:${control.key}`
            )
          })
        )
      };
    }

    function sortFields(): Partial<ListControlsState> {
      if (sortOptions.length === 0) return {};
      return {
        sortValue: activeSort.value,
        sortAction: mockActionValue(MOCK_ACTION.COLLECTION_SORT, pagedId),
        // The copy lives here, with the tab labels — never in the module.
        sortOptions
      };
    }

    function viewFields(): Partial<ListControlsState> {
      if (options?.view !== true) return {};
      return {
        view: {
          value: useListViewPreference().view.value,
          action: MOCK_ACTION.SET_VIEW,
          label: "List layout",
          options: LIST_VIEW_OPTIONS
        }
      };
    }

    return assign(
      {},
      searchFields(),
      filterFields(),
      sortFields(),
      viewFields()
    );
  };
}

/**
 * The products listing's own layout, as the list module's variant: legacy
 * stored the pick against the user, so the panel opens in it and the band's
 * switch changes it (`composables/useListViewPreference.ts`).
 */
function groupProductView(): ListModuleVariant {
  return LIST_VARIANT_BY_VIEW[useListViewPreference().view.value];
}

const LIST_VARIANT_BY_VIEW: Readonly<Record<ListView, ListModuleVariant>> = {
  [LIST_VIEW.GRID]: LIST_MODULE_VARIANT.CARDS,
  [LIST_VIEW.TABLE]: LIST_MODULE_VARIANT.TABLE
};

const SELECTOR_BY_REF: Readonly<
  Record<DataRefId, (data: MockDataset, context: DataRouteContext) => unknown>
> = {
  [DATA_REF_ID.ACTIVE_PRODUCT_ITEMS]: activeProductItems,
  [DATA_REF_ID.NEEDS_ATTENTION_PRODUCT_ITEMS]: needsAttentionProductItems,
  [DATA_REF_ID.HAS_PRODUCTS_AWAITING_SETUP]: hasProductsAwaitingSetup,
  [DATA_REF_ID.DASHBOARD_METRIC_ITEMS]: dashboardMetricItems,
  [DATA_REF_ID.NEEDS_ATTENTION_MESSAGE]: needsAttentionMessage,
  [DATA_REF_ID.NEEDS_ATTENTION_ACTION]: needsAttentionAction,
  [DATA_REF_ID.DASHBOARD_CHILD_ACCOUNT_ITEMS]: dashboardChildAccountItems,
  [DATA_REF_ID.HAS_CHILD_ACCOUNTS]: hasChildAccounts,
  [DATA_REF_ID.RECENT_INVOICE_ITEMS]: recentInvoiceItems,
  [DATA_REF_ID.RECENT_TICKET_ITEMS]: recentTicketItems,
  [DATA_REF_ID.GROUP_PRODUCT_ITEMS]: groupProductItems,
  [DATA_REF_ID.GROUP_PRODUCT_TABS]: groupProductTabs,
  [DATA_REF_ID.GROUP_PRODUCT_STATUS]: groupProductStatus,
  [DATA_REF_ID.GROUP_CATALOGUE_ITEMS]: groupCatalogueItems,
  [DATA_REF_ID.PRODUCT_SPEC_ITEMS]: productSpecItems,
  [DATA_REF_ID.PRODUCT_BILLING_SPEC_ITEMS]: productBillingSpecItems,
  [DATA_REF_ID.PRODUCT_AREA_NAV_ITEMS]: productAreaNavItems,
  [DATA_REF_ID.PRODUCT_BACK_TO]: productBackTo,
  [DATA_REF_ID.PRODUCT_TICKET_ITEMS]: productTicketItems,
  [DATA_REF_ID.PRODUCT_DELEGATE_ITEMS]: productDelegateItems,
  [DATA_REF_ID.PRODUCT_BILLBOARD_ITEMS]: productBillboardItems,
  [DATA_REF_ID.PRODUCT_HAS_CONDITION]: productHasCondition,
  [DATA_REF_ID.PRODUCT_CONDITION_TITLE]: productConditionTitle,
  [DATA_REF_ID.PRODUCT_CONDITION_MESSAGE]: productConditionMessage,
  [DATA_REF_ID.PRODUCT_HAS_TRIAL_MESSAGE]: productHasTrialMessage,
  [DATA_REF_ID.PRODUCT_TRIAL_MESSAGE]: productTrialMessage,
  [DATA_REF_ID.PRODUCT_TRIAL_ACTION]: productTrialAction,
  [DATA_REF_ID.PRODUCT_CONDITION_TONE]: productConditionTone,
  [DATA_REF_ID.PRODUCT_CONDITION_ACTION]: productConditionAction,
  [DATA_REF_ID.PRODUCT_ABOUT_MARKDOWN]: productAboutMarkdown,
  [DATA_REF_ID.PRODUCT_HAS_ABOUT]: productHasAbout,
  [DATA_REF_ID.PRODUCT_SUPPORT_ACTION]: productSupportAction,
  [DATA_REF_ID.IS_SUPPORT_ENABLED]: isSupportEnabled,
  [DATA_REF_ID.PRODUCT_PROVISION_FIELD_ITEMS]: productProvisionFieldItems,
  [DATA_REF_ID.PRODUCT_HAS_PROVISION_FIELDS]: productHasProvisionFields,
  [DATA_REF_ID.PRODUCT_PROVISION_ACTIONS]: productProvisionActions,
  [DATA_REF_ID.PRODUCT_HAS_PROVISION_ACTIONS]: productHasProvisionActions,
  [DATA_REF_ID.PRODUCT_QUICK_ACTIONS]: productQuickActions,
  [DATA_REF_ID.PRODUCT_HAS_QUICK_ACTIONS]: productHasQuickActions,
  [DATA_REF_ID.PRODUCT_PROVISION_FRAMES]: productProvisionFrames,
  [DATA_REF_ID.PRODUCT_HAS_PROVISION_FRAMES]: productHasProvisionFrames,
  [DATA_REF_ID.PRODUCT_NOTE_ITEMS]: productNoteItems,
  [DATA_REF_ID.PRODUCT_NOTE_ACTIONS]: productNoteActions,
  [DATA_REF_ID.PRODUCT_SECRET_ITEMS]: productSecretItems,
  [DATA_REF_ID.PRODUCT_SECRET_ACTIONS]: productSecretActions,
  [DATA_REF_ID.PRODUCT_INVOICE_ITEMS]: productInvoiceItems,
  [DATA_REF_ID.PRODUCT_CREDIT_NOTE_ITEMS]: productCreditNoteItems,
  [DATA_REF_ID.PRODUCT_LINE_ITEM_SPEC_ITEMS]: productLineItemSpecItems,
  [DATA_REF_ID.PRODUCT_IS_SUBSCRIPTION]: productIsSubscription,
  [DATA_REF_ID.PRODUCT_MANAGE_ACTIONS]: productManageActions,
  [DATA_REF_ID.PRODUCT_MIGRATION_ITEMS]: productMigrationItems,
  [DATA_REF_ID.PRODUCT_HAS_MIGRATION_OPTIONS]: productHasMigrationOptions,
  [DATA_REF_ID.PRODUCT_HAS_ACCEPTED_CANCELLATION]:
    productHasAcceptedCancellation,
  [DATA_REF_ID.PRODUCT_ACCEPTED_CANCELLATION_MESSAGE]:
    productAcceptedCancellationMessage,
  [DATA_REF_ID.PRODUCT_HAS_PENDING_PRO_RATA]: productHasPendingProRata,
  [DATA_REF_ID.PRODUCT_TIMELINE_ITEMS]: productTimelineItems,
  [DATA_REF_ID.PRODUCT_HAS_TIMELINE]: productHasTimeline,
  [DATA_REF_ID.PRODUCT_SETUP_FORM_SCHEMA]: productSetupFormSchema,
  [DATA_REF_ID.PRODUCT_SETUP_FORM_UISCHEMA]: productSetupFormUischema,
  [DATA_REF_ID.PRODUCT_SETUP_FORM_MODEL]: productSetupFormModel,
  [DATA_REF_ID.PRODUCT_SETUP_FORM_SUBMIT]: productSetupFormSubmit,
  [DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_SCHEMA]:
    productConsolidationFormSchema,
  [DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_UISCHEMA]:
    productConsolidationFormUischema,
  [DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_MODEL]: productConsolidationFormModel,
  [DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_SUBMIT]:
    productConsolidationFormSubmit,
  [DATA_REF_ID.PRODUCT_HAS_CONSOLIDATION_FORM]: productHasConsolidationForm,
  [DATA_REF_ID.PRODUCT_LABEL_FORM_SCHEMA]: productLabelFormSchema,
  [DATA_REF_ID.PRODUCT_LABEL_FORM_UISCHEMA]: productLabelFormUischema,
  [DATA_REF_ID.PRODUCT_LABEL_FORM_MODEL]: productLabelFormModel,
  [DATA_REF_ID.PRODUCT_LABEL_FORM_SUBMIT]: productLabelFormSubmit,
  [DATA_REF_ID.PRODUCT_AUTO_RENEW_ITEMS]: productAutoRenewItems,
  [DATA_REF_ID.PRODUCT_HAS_AUTO_RENEW_CONTROLS]: productHasAutoRenewControls,
  [DATA_REF_ID.PRODUCT_AUTO_RENEW_NOTICE]: productAutoRenewNotice,
  [DATA_REF_ID.PRODUCT_HAS_AUTO_RENEW_NOTICE]: productHasAutoRenewNotice,
  [DATA_REF_ID.PRODUCT_HAS_UNPAID_INVOICES]: productHasUnpaidInvoices,
  [DATA_REF_ID.PRODUCT_UNPAID_INVOICE_TONE]: productUnpaidInvoiceTone,
  [DATA_REF_ID.PRODUCT_BILLING_ADDRESS_SPEC_ITEMS]:
    productBillingAddressSpecItems,
  [DATA_REF_ID.PRODUCT_ADDRESS_ITEMS]: productAddressItems,
  [DATA_REF_ID.PRODUCT_COMPANY_ITEMS]: productCompanyItems,
  [DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS]: productDelegateAccessItems,
  [DATA_REF_ID.HAS_ORDER_COMPLETE]: hasOrderComplete,
  [DATA_REF_ID.ORDER_COMPLETE_MESSAGE]: orderCompleteMessage,
  [DATA_REF_ID.ORDER_COMPLETE_ACTION]: orderCompleteAction,
  [DATA_REF_ID.ORDER_COMPLETE_DISMISS]: orderCompleteDismiss,
  [DATA_REF_ID.INVOICE_ITEMS]: invoiceItems,
  [DATA_REF_ID.INVOICE_TABS]: invoiceTabs,
  [DATA_REF_ID.INVOICE_STATUS]: invoiceStatus,
  [DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE]: invoiceConsolidationVisible,
  [DATA_REF_ID.INVOICE_CONSOLIDATION_MESSAGE]: invoiceConsolidationMessage,
  [DATA_REF_ID.INVOICE_CONSOLIDATION_ACTION]: invoiceConsolidationAction,
  [DATA_REF_ID.INVOICE_SPEC_ITEMS]: invoiceSpecItems,
  [DATA_REF_ID.INVOICE_LINE_ITEMS]: invoiceLineItems,
  [DATA_REF_ID.INVOICE_DOCUMENT_HEADER]: invoiceDocumentHeader,
  [DATA_REF_ID.INVOICE_DOCUMENT_PARTY]: invoiceDocumentParty,
  [DATA_REF_ID.INVOICE_DOCUMENT_LINES]: invoiceDocumentLines,
  [DATA_REF_ID.INVOICE_DOCUMENT_TOTALS]: invoiceDocumentTotals,
  [DATA_REF_ID.INVOICE_DOCUMENT_PAYMENTS]: invoiceDocumentPayments,
  [DATA_REF_ID.INVOICE_DOCUMENT_MESSAGES]: invoiceDocumentMessages,
  [DATA_REF_ID.INVOICE_DOCUMENT_PAID_STAMP]: invoiceDocumentPaidStamp,
  [DATA_REF_ID.INVOICE_DOCUMENT_DETAILS]: invoiceDocumentDetails,
  [DATA_REF_ID.INVOICE_DOCUMENT_ACTIONS]: invoiceDocumentActions,
  [DATA_REF_ID.INVOICE_IS_PAYABLE]: invoiceIsPayable,
  [DATA_REF_ID.ORDER_SPEC_ITEMS]: orderSpecItems,
  [DATA_REF_ID.ORDER_ITEM_ROWS]: orderItemRows,
  [DATA_REF_ID.ORDER_DATE_SPEC_ITEMS]: orderDateSpecItems,
  [DATA_REF_ID.ORDER_DETAIL_SPEC_ITEMS]: orderDetailSpecItems,
  [DATA_REF_ID.ORDER_HAS_DETAILS]: orderHasDetails,
  [DATA_REF_ID.ORDER_IS_DELEGATED]: orderIsDelegated,
  [DATA_REF_ID.ORDER_DELEGATED_MESSAGE]: orderDelegatedMessage,
  [DATA_REF_ID.ORDER_INVOICE_ITEMS]: orderInvoiceItems,
  [DATA_REF_ID.ORDER_CREDIT_NOTE_ITEMS]: orderCreditNoteItems,
  [DATA_REF_ID.CREDIT_NOTE_LIST_ITEMS]: creditNoteListItems,
  [DATA_REF_ID.CREDIT_NOTE_SPEC_ITEMS]: creditNoteSpecItems,
  [DATA_REF_ID.CREDIT_NOTE_DOCUMENT_HEADER]: creditNoteDocumentHeader,
  [DATA_REF_ID.CREDIT_NOTE_DOCUMENT_PARTY]: creditNoteDocumentParty,
  [DATA_REF_ID.CREDIT_NOTE_DOCUMENT_LINES]: creditNoteDocumentLines,
  [DATA_REF_ID.CREDIT_NOTE_DOCUMENT_TOTALS]: creditNoteDocumentTotals,
  [DATA_REF_ID.CREDIT_NOTE_DOCUMENT_PAYMENTS]: creditNoteDocumentPayments,
  [DATA_REF_ID.CREDIT_NOTE_DOCUMENT_MESSAGES]: creditNoteDocumentMessages,
  [DATA_REF_ID.CREDIT_NOTE_DOCUMENT_ACTIONS]: creditNoteDocumentActions,
  [DATA_REF_ID.CREDIT_NOTE_INVOICE_ITEMS]: creditNoteInvoiceItems,
  [DATA_REF_ID.HAS_NO_STORED_GATEWAYS]: hasNoStoredGateways,
  [DATA_REF_ID.WALLET_BALANCE_ITEMS]: walletBalanceItems,
  [DATA_REF_ID.WALLET_CREDIT_LIMIT_SPEC_ITEMS]: walletCreditLimitSpecItems,
  [DATA_REF_ID.WALLET_CREDIT_USED]: walletCreditUsed,
  [DATA_REF_ID.WALLET_CREDIT_ALLOWANCE]: walletCreditAllowance,
  [DATA_REF_ID.WALLET_CREDIT_TONE]: creditLimitTone,
  [DATA_REF_ID.WALLET_CREDIT_BANNER_TONE]: creditLimitBannerTone,
  [DATA_REF_ID.WALLET_CREDIT_SUMMARY]: creditLimitSummary,
  [DATA_REF_ID.WALLET_CREDIT_PANEL_COPY]: creditLimitPanelCopy,
  [DATA_REF_ID.WALLET_HAS_CREDIT_LIMIT]: walletHasCreditLimit,
  [DATA_REF_ID.WALLET_HEADER_ACTIONS]: walletHeaderActions,
  [DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS]: walletCreditStatementItems,
  [DATA_REF_ID.WALLET_HAS_CREDIT_STATEMENTS]: walletHasCreditStatements,
  [DATA_REF_ID.CREDIT_STATEMENT_SPEC_ITEMS]: creditStatementSpecItems,
  [DATA_REF_ID.CREDIT_STATEMENT_MOVEMENT_ITEMS]: creditStatementMovementItems,
  [DATA_REF_ID.BILLING_SETTINGS_FORM_SCHEMA]: billingSettingsFormSchema,
  [DATA_REF_ID.BILLING_SETTINGS_FORM_UISCHEMA]: billingSettingsFormUischema,
  [DATA_REF_ID.BILLING_SETTINGS_FORM_MODEL]: billingSettingsFormModel,
  [DATA_REF_ID.ACCOUNT_SECTION_NAV_ITEMS]: accountSectionNavItems,
  [DATA_REF_ID.ACCOUNT_CARD_ITEMS]: accountCardItems,
  [DATA_REF_ID.ACCOUNT_CARD_SPEC_ITEMS]: accountCardSpecItems,
  [DATA_REF_ID.IS_SUPPORT_PIN_ENABLED]: isSupportPinEnabled,
  [DATA_REF_ID.SUPPORT_PIN_PANEL_ITEMS]: supportPinPanelItems,
  [DATA_REF_ID.SUPPORT_PIN_ACTIONS]: supportPinActions,
  [DATA_REF_ID.PROFILE_SPEC_ITEMS]: profileSpecItems,
  [DATA_REF_ID.PROFILE_FORM_SCHEMA]: profileFormSchema,
  [DATA_REF_ID.PROFILE_FORM_UISCHEMA]: profileFormUischema,
  [DATA_REF_ID.PROFILE_FORM_MODEL]: profileFormModel,
  [DATA_REF_ID.CUSTOM_FIELDS_FORM_SCHEMA]: customFieldsFormSchema,
  [DATA_REF_ID.CUSTOM_FIELDS_FORM_UISCHEMA]: customFieldsFormUischema,
  [DATA_REF_ID.CUSTOM_FIELDS_FORM_MODEL]: customFieldsFormModel,
  [DATA_REF_ID.HAS_CUSTOM_FIELDS]: hasCustomFields,
  [DATA_REF_ID.SECURITY_SPEC_ITEMS]: securitySpecItems,
  [DATA_REF_ID.SECURITY_TWOFA_ACTIONS]: securityTwoFactorActions,
  [DATA_REF_ID.USERNAME_FORM_SCHEMA]: usernameFormSchema,
  [DATA_REF_ID.USERNAME_FORM_UISCHEMA]: usernameFormUischema,
  [DATA_REF_ID.USERNAME_FORM_MODEL]: usernameFormModel,
  [DATA_REF_ID.PASSWORD_FORM_SCHEMA]: passwordFormSchema,
  [DATA_REF_ID.PASSWORD_FORM_UISCHEMA]: passwordFormUischema,
  [DATA_REF_ID.PASSWORD_FORM_MODEL]: passwordFormModel,
  [DATA_REF_ID.LOGIN_RECOVER_ACTION]: loginRecoverAction,
  [DATA_REF_ID.HAS_CLIENT_REGISTRATION]: hasClientRegistration,
  [DATA_REF_ID.VERIFY_EMAIL_FORM_SCHEMA]: verifyEmailFormSchema,
  [DATA_REF_ID.VERIFY_EMAIL_FORM_UISCHEMA]: verifyEmailFormUischema,
  [DATA_REF_ID.VERIFY_EMAIL_FORM_MODEL]: verifyEmailFormModel,
  [DATA_REF_ID.TWOFA_FORM_SCHEMA]: twoFactorFormSchema,
  [DATA_REF_ID.TWOFA_FORM_UISCHEMA]: twoFactorFormUischema,
  [DATA_REF_ID.TWOFA_FORM_MODEL]: twoFactorFormModel,
  [DATA_REF_ID.HAS_RECAPTCHA]: hasRecaptcha,
  [DATA_REF_ID.DELEGATE_INVITE_TITLE]: delegateInviteTitle,
  [DATA_REF_ID.DELEGATE_INVITE_MESSAGE]: delegateInviteMessage,
  [DATA_REF_ID.DELEGATE_INVITE_TONE]: delegateInviteTone,
  [DATA_REF_ID.DELEGATE_INVITE_ACTION]: delegateInviteAction,
  [DATA_REF_ID.IP_WHITELIST_ITEMS]: ipWhitelistItems,
  [DATA_REF_ID.PROFILE_EMAIL_ITEMS]: profileEmailItems,
  [DATA_REF_ID.PROFILE_PHONE_ITEMS]: profilePhoneItems,
  [DATA_REF_ID.BILLABLE_ENTITY_ITEMS]: billableEntityItems,
  [DATA_REF_ID.BILLABLE_ENTITY_ACTIONS]: billableEntityActions,
  [DATA_REF_ID.NOTIFICATION_ITEMS]: notificationItems,
  [DATA_REF_ID.NOTIFICATION_FILTERS]: notificationFilters,
  [DATA_REF_ID.NOTIFICATION_FILTER_VALUE]: notificationFilterValue,
  [DATA_REF_ID.NOTIFICATION_LOAD_MORE]: notificationLoadMore,
  [DATA_REF_ID.NOTIFICATION_PAGE_ITEMS]: notificationPageItems,
  [DATA_REF_ID.NOTIFICATION_PREFERENCE_ITEMS]: notificationPreferenceItems,
  [DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_SCHEMA]:
    notificationPreferencesFormSchema,
  [DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_UISCHEMA]:
    notificationPreferencesFormUischema,
  [DATA_REF_ID.EMAIL_OPT_INS_FORM_SCHEMA]: emailOptInsFormSchema,
  [DATA_REF_ID.EMAIL_OPT_INS_FORM_UISCHEMA]: emailOptInsFormUischema,
  [DATA_REF_ID.EMAIL_OPT_INS_FORM_MODEL]: emailOptInsFormModel,
  [DATA_REF_ID.EMAIL_OPT_INS_FORM_SUBMIT]: emailOptInsFormSubmit,
  [DATA_REF_ID.EMAIL_OPT_INS_INTRO]: emailOptInsIntro,
  [DATA_REF_ID.HAS_EMAIL_TOPICS]: hasEmailTopics,
  [DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL]:
    notificationPreferencesFormModel,
  [DATA_REF_ID.NOTIFICATION_TOPIC_ACTIONS]: notificationTopicActions,
  [DATA_REF_ID.NOTIFICATION_PREFERENCE_HEADINGS]:
    notificationPreferenceHeadings,
  [DATA_REF_ID.ARE_NOTES_ENABLED]: areNotesEnabled,
  [DATA_REF_ID.ACCOUNT_NOTE_ITEMS]: accountNoteItems,
  [DATA_REF_ID.ACCOUNT_NOTE_ACTIONS]: accountNoteActions,
  [DATA_REF_ID.ACCOUNT_SECRET_ITEMS]: accountSecretItems,
  [DATA_REF_ID.ACCOUNT_SECRET_ACTIONS]: accountSecretActions,
  [DATA_REF_ID.ACCOUNT_DELEGATE_ITEMS]: accountDelegateItems,
  [DATA_REF_ID.DELEGATE_SPEC_ITEMS]: delegateSpecItems,
  [DATA_REF_ID.DELEGATE_HEADER_ACTIONS]: delegateHeaderActions,
  [DATA_REF_ID.DELEGATE_ACCESS_ITEMS]: delegateAccessItems,
  [DATA_REF_ID.DELEGATE_IS_SPECIFIC]: delegateIsSpecific,
  [DATA_REF_ID.DELEGATE_PRODUCT_ITEMS]: delegateProductItems,
  [DATA_REF_ID.DELEGATE_TICKET_ITEMS]: delegateTicketItems,
  [DATA_REF_ID.CHILD_ACCOUNT_ITEMS]: childAccountItems,
  [DATA_REF_ID.RELATION_SPEC_ITEMS]: relationSpecItems,
  [DATA_REF_ID.RELATION_TOGGLE_ITEMS]: relationToggleItems,
  [DATA_REF_ID.RELATION_HEADER_ACTIONS]: relationHeaderActions,
  [DATA_REF_ID.HAS_PARENT_BRANDING]: hasParentBranding,
  [DATA_REF_ID.PARENT_BRANDING_ITEMS]: parentBrandingItems,
  [DATA_REF_ID.PARENT_BRANDING_ACTIONS]: parentBrandingActions,
  [DATA_REF_ID.PARENT_BRANDING_LOGO_ITEMS]: parentBrandingLogoItems,
  [DATA_REF_ID.AFFILIATE_SPEC_ITEMS]: affiliateSpecItems,
  [DATA_REF_ID.AFFILIATE_IS_ENROLLED]: affiliateIsEnrolled,
  [DATA_REF_ID.AFFILIATE_NEEDS_ENROLLING]: affiliateNeedsEnrolling,
  [DATA_REF_ID.AFFILIATE_IS_DISABLED]: affiliateIsDisabled,
  [DATA_REF_ID.AFFILIATE_IS_UNAVAILABLE]: affiliateIsUnavailable,
  [DATA_REF_ID.AFFILIATE_ENROL_ACTION]: affiliateEnrolAction,
  [DATA_REF_ID.AFFILIATE_STAT_ITEMS]: affiliateStatItems,
  [DATA_REF_ID.AFFILIATE_LINK_ITEMS]: affiliateLinkItems,
  [DATA_REF_ID.AFFILIATE_LINK_HEADER_ACTIONS]: affiliateLinkHeaderActions,
  [DATA_REF_ID.AFFILIATE_WITHDRAWAL_ACTIONS]: affiliateWithdrawalActions,
  [DATA_REF_ID.AFFILIATE_PAYOUT_FORM_SCHEMA]: affiliatePayoutFormSchema,
  [DATA_REF_ID.AFFILIATE_PAYOUT_FORM_UISCHEMA]: affiliatePayoutFormUischema,
  [DATA_REF_ID.AFFILIATE_PAYOUT_FORM_MODEL]: affiliatePayoutFormModel,
  [DATA_REF_ID.AFFILIATE_LINK_HEADINGS]: affiliateLinkHeadings,
  [DATA_REF_ID.AFFILIATE_REFERRAL_ITEMS]: affiliateReferralItems,
  [DATA_REF_ID.AFFILIATE_REFERRAL_HEADINGS]: affiliateReferralHeadings,
  [DATA_REF_ID.AFFILIATE_PAYOUT_HEADINGS]: affiliatePayoutHeadings,
  [DATA_REF_ID.AFFILIATE_COMMISSION_ITEMS]: affiliateCommissionItems,
  [DATA_REF_ID.AFFILIATE_PAYOUT_ITEMS]: affiliatePayoutItems,
  [DATA_REF_ID.IS_EMAIL_DELIVERY_DELAYED]: isEmailDeliveryDelayed,
  [DATA_REF_ID.EMAIL_HEADER_ACTIONS]: emailHeaderActions,
  [DATA_REF_ID.LOGIN_ATTEMPT_ITEMS]: loginAttemptItems,
  [DATA_REF_ID.RESET_PASSWORD_FORM_SCHEMA]: resetPasswordFormSchema,
  [DATA_REF_ID.RESET_PASSWORD_FORM_UISCHEMA]: resetPasswordFormUischema,
  [DATA_REF_ID.RESET_PASSWORD_FORM_MODEL]: resetPasswordFormModel,
  [DATA_REF_ID.SET_PASSWORD_FORM_SCHEMA]: setPasswordFormSchema,
  [DATA_REF_ID.SET_PASSWORD_FORM_UISCHEMA]: setPasswordFormUischema,
  [DATA_REF_ID.SET_PASSWORD_FORM_MODEL]: setPasswordFormModel,
  [DATA_REF_ID.REGISTER_ORG_FORM_SCHEMA]: registerOrgFormSchema,
  [DATA_REF_ID.REGISTER_ORG_FORM_UISCHEMA]: registerOrgFormUischema,
  [DATA_REF_ID.REGISTER_ORG_FORM_MODEL]: registerOrgFormModel,
  [DATA_REF_ID.SENT_EMAIL_ITEMS]: sentEmailItems,
  [DATA_REF_ID.SENT_EMAIL_TABS]: sentEmailTabs,
  [DATA_REF_ID.SENT_EMAIL_STATUS]: sentEmailStatus,
  [DATA_REF_ID.SENT_EMAIL_SPEC_ITEMS]: sentEmailSpecItems,
  [DATA_REF_ID.SENT_EMAIL_BODY]: sentEmailBody,
  [DATA_REF_ID.TICKET_ITEMS]: ticketItems,
  [DATA_REF_ID.TICKET_TABS]: ticketTabs,
  [DATA_REF_ID.TICKET_STATUS]: ticketStatus,
  [DATA_REF_ID.TICKET_SPEC_ITEMS]: ticketSpecItems,
  [DATA_REF_ID.TICKET_IS_OPEN]: ticketIsOpen,
  [DATA_REF_ID.TICKET_HAS_STATUS_BANNER]: ticketHasStatusBanner,
  [DATA_REF_ID.TICKET_STATUS_TITLE]: ticketStatusTitle,
  [DATA_REF_ID.TICKET_STATUS_MESSAGE]: ticketStatusMessage,
  [DATA_REF_ID.TICKET_STATUS_TONE]: ticketStatusTone,
  [DATA_REF_ID.TICKET_MANAGE_ACTIONS]: ticketManageActions,
  [DATA_REF_ID.NEW_TICKET_FORM_SCHEMA]: newTicketFormSchema,
  [DATA_REF_ID.NEW_TICKET_FORM_UISCHEMA]: newTicketFormUischema,
  [DATA_REF_ID.NEW_TICKET_FORM_MODEL]: newTicketFormModel,
  [DATA_REF_ID.TICKET_MANAGE_VARIANT]: ticketManageVariant,
  [DATA_REF_ID.TICKET_CAN_DELEGATE]: ticketCanDelegate,
  [DATA_REF_ID.TICKET_DELEGATE_ITEMS]: ticketDelegateItems,
  [DATA_REF_ID.TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT]: submitsWithShortcut,
  [DATA_REF_ID.TICKET_COMPOSER_SUBMIT_KEY]: composerSubmitKey,
  [DATA_REF_ID.TICKET_RELATED_PRODUCT_LINKS]: ticketRelatedProductLinks,
  [DATA_REF_ID.TICKET_HAS_RELATED_PRODUCT_LINKS]: ticketHasRelatedProductLinks,
  [DATA_REF_ID.ACCOUNT_MENU_HEADING]: accountMenuHeading,
  [DATA_REF_ID.ACCOUNT_MENU_ITEMS]: accountMenuItems,
  [DATA_REF_ID.TEMPLATE_DASHBOARD_MARKDOWN]: templateMarkdown(
    ClientTemplateSlotCodes.DASHBOARD_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_HAS_DASHBOARD]: hasTemplate(
    ClientTemplateSlotCodes.DASHBOARD_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_INVOICES_MARKDOWN]: templateMarkdown(
    ClientTemplateSlotCodes.INVOICES_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_HAS_INVOICES]: hasTemplate(
    ClientTemplateSlotCodes.INVOICES_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_SUPPORT_MARKDOWN]: templateMarkdown(
    ClientTemplateSlotCodes.SUPPORT_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_HAS_SUPPORT]: hasTemplate(
    ClientTemplateSlotCodes.SUPPORT_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_AFFILIATES_MARKDOWN]: templateMarkdown(
    ClientTemplateSlotCodes.AFFILIATES_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_HAS_AFFILIATES]: hasTemplate(
    ClientTemplateSlotCodes.AFFILIATES_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_PRODUCT_MARKDOWN]: templateMarkdown(
    ClientTemplateSlotCodes.CONTRACT_PRODUCT_OVERVIEW
  ),
  [DATA_REF_ID.TEMPLATE_HAS_PRODUCT]: hasTemplate(
    ClientTemplateSlotCodes.CONTRACT_PRODUCT_OVERVIEW
  ),
  [DATA_REF_ID.CUSTOM_PAGE_MARKDOWN]: customPageMarkdown,
  [DATA_REF_ID.CUSTOM_PAGE_HAS_BODY]: customPageHasBody,
  [DATA_REF_ID.CUSTOM_PAGE_FRAMES]: customPageFrames,
  [DATA_REF_ID.CUSTOM_PAGE_HAS_FRAMES]: customPageHasFrames,
  [DATA_REF_ID.TICKET_MESSAGE_ITEMS]: ticketMessageItems,
  [DATA_REF_ID.TICKET_THREAD_TABS]: ticketThreadTabItems,
  [DATA_REF_ID.TICKET_THREAD_ACTIVE_TAB]: (_data, context) =>
    ticketThreadActiveTab(context),
  [DATA_REF_ID.TICKET_THREAD_EMPTY_TITLE]: (_data, context) =>
    ticketThreadEmptyTitle(context),
  [DATA_REF_ID.TICKET_HAS_MORE_MESSAGES]: ticketHasMoreMessages,
  [DATA_REF_ID.TICKET_THREAD_MORE_ACTIONS]: ticketThreadMoreActions,
  [DATA_REF_ID.SUPPORT_PIN_SPEC_ITEMS]: supportPinSpecItems,
  [DATA_REF_ID.UNREAD_NOTIFICATION_COUNT]: unreadNotificationCount,
  [DATA_REF_ID.PILLAR_NAV_ITEMS]: pillarNavItems,
  [DATA_REF_ID.BRAND_LOGO_HREF]: brandLogoHref,
  [DATA_REF_ID.PILLAR_SUBMENU_ITEMS]: pillarSubmenuItems,
  [DATA_REF_ID.HAS_PILLAR_SUBMENU]: hasPillarSubmenu,
  [DATA_REF_ID.GROUP_PRODUCTS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.GROUP_PRODUCTS
  ),
  [DATA_REF_ID.GROUP_CATALOGUE_PAGER]: pagerState(
    PAGED_COLLECTION_ID.GROUP_CATALOGUE
  ),
  [DATA_REF_ID.PRODUCT_TICKETS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.PRODUCT_TICKETS
  ),
  [DATA_REF_ID.TICKET_DELEGATES_PAGER]: pagerState(
    PAGED_COLLECTION_ID.TICKET_DELEGATES
  ),
  [DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.PRODUCT_DELEGATE_ACCESS
  ),
  [DATA_REF_ID.PRODUCT_DELEGATES_PAGER]: pagerState(
    PAGED_COLLECTION_ID.PRODUCT_DELEGATES
  ),
  [DATA_REF_ID.DELEGATE_PRODUCTS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.DELEGATE_PRODUCTS
  ),
  [DATA_REF_ID.DELEGATE_TICKETS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.DELEGATE_TICKETS
  ),
  [DATA_REF_ID.INVOICES_PAGER]: pagerState(PAGED_COLLECTION_ID.INVOICES),
  [DATA_REF_ID.CREDIT_NOTES_PAGER]: pagerState(
    PAGED_COLLECTION_ID.CREDIT_NOTES
  ),
  [DATA_REF_ID.CREDIT_STATEMENTS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.CREDIT_STATEMENTS
  ),
  [DATA_REF_ID.NOTIFICATIONS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.NOTIFICATIONS
  ),
  [DATA_REF_ID.ACCOUNT_NOTES_PAGER]: pagerState(
    PAGED_COLLECTION_ID.ACCOUNT_NOTES
  ),
  [DATA_REF_ID.ACCOUNT_SECRETS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.ACCOUNT_SECRETS
  ),
  [DATA_REF_ID.PRODUCT_INVOICES_PAGER]: pagerState(
    PAGED_COLLECTION_ID.PRODUCT_INVOICES
  ),
  [DATA_REF_ID.PRODUCT_CREDIT_NOTES_PAGER]: pagerState(
    PAGED_COLLECTION_ID.PRODUCT_CREDIT_NOTES
  ),
  [DATA_REF_ID.ACCOUNT_DELEGATES_PAGER]: pagerState(
    PAGED_COLLECTION_ID.ACCOUNT_DELEGATES
  ),
  [DATA_REF_ID.CHILD_ACCOUNTS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.CHILD_ACCOUNTS
  ),
  [DATA_REF_ID.AFFILIATE_LINKS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.AFFILIATE_LINKS
  ),
  [DATA_REF_ID.AFFILIATE_LINKS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.AFFILIATE_LINKS
  ),
  [DATA_REF_ID.AFFILIATE_COMMISSIONS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.AFFILIATE_COMMISSIONS
  ),
  [DATA_REF_ID.AFFILIATE_PAYOUTS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.AFFILIATE_PAYOUTS
  ),
  [DATA_REF_ID.AFFILIATE_COMMISSIONS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.AFFILIATE_COMMISSIONS
  ),
  [DATA_REF_ID.AFFILIATE_PAYOUTS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.AFFILIATE_PAYOUTS
  ),
  [DATA_REF_ID.AFFILIATE_REFERRALS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.AFFILIATE_REFERRALS
  ),
  [DATA_REF_ID.SENT_EMAILS_PAGER]: pagerState(PAGED_COLLECTION_ID.SENT_EMAILS),
  [DATA_REF_ID.LOGIN_ATTEMPTS_PAGER]: pagerState(
    PAGED_COLLECTION_ID.LOGIN_ATTEMPTS
  ),
  [DATA_REF_ID.IP_WHITELIST_PAGER]: pagerState(
    PAGED_COLLECTION_ID.IP_WHITELIST
  ),
  [DATA_REF_ID.TICKETS_PAGER]: pagerState(PAGED_COLLECTION_ID.TICKETS),
  [DATA_REF_ID.GROUP_PRODUCTS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.GROUP_PRODUCTS,
    // The one listing legacy let a client re-lay out (`cProdsViewSwitcher`).
    { view: true }
  ),
  [DATA_REF_ID.INVOICES_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.INVOICES
  ),
  [DATA_REF_ID.TICKETS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.TICKETS
  ),
  [DATA_REF_ID.CREDIT_STATEMENTS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.CREDIT_STATEMENTS
  ),
  [DATA_REF_ID.ACCOUNT_DELEGATES_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.ACCOUNT_DELEGATES
  ),
  [DATA_REF_ID.AFFILIATE_REFERRALS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.AFFILIATE_REFERRALS
  ),
  [DATA_REF_ID.CHILD_ACCOUNTS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.CHILD_ACCOUNTS
  ),
  [DATA_REF_ID.SENT_EMAILS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.SENT_EMAILS
  ),
  [DATA_REF_ID.LOGIN_ATTEMPTS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.LOGIN_ATTEMPTS
  ),
  [DATA_REF_ID.BILLABLE_ENTITIES_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.BILLABLE_ENTITIES
  ),
  [DATA_REF_ID.IP_WHITELIST_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.IP_WHITELIST
  ),
  [DATA_REF_ID.PRODUCT_INVOICES_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.PRODUCT_INVOICES
  ),
  [DATA_REF_ID.CREDIT_NOTES_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.CREDIT_NOTES
  ),
  [DATA_REF_ID.PRODUCT_TICKETS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.PRODUCT_TICKETS
  ),
  [DATA_REF_ID.TICKET_DELEGATES_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.TICKET_DELEGATES
  ),
  [DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.PRODUCT_DELEGATE_ACCESS
  ),
  [DATA_REF_ID.PRODUCT_DELEGATES_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.PRODUCT_DELEGATES
  ),
  [DATA_REF_ID.DELEGATE_PRODUCTS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.DELEGATE_PRODUCTS
  ),
  [DATA_REF_ID.DELEGATE_TICKETS_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.DELEGATE_TICKETS
  ),
  [DATA_REF_ID.PRODUCT_CREDIT_NOTES_CONTROLS]: listControlsState(
    PAGED_COLLECTION_ID.PRODUCT_CREDIT_NOTES
  ),
  [DATA_REF_ID.GROUP_PRODUCT_VIEW]: groupProductView,
  [DATA_REF_ID.PLACE_ORDER_ACTION]: placeOrderAction
};

/**
 * items-ref → its pager-state ref. The pillar row helpers consult this to
 * attach a pager footer wherever the panel's list is a paged collection —
 * a ref with no entry (detail sub-lists, dashboard recents) gets no footer.
 */
export const PAGER_REF_BY_ITEMS_REF: Partial<Record<DataRefId, DataRefId>> = {
  [DATA_REF_ID.GROUP_PRODUCT_ITEMS]: DATA_REF_ID.GROUP_PRODUCTS_PAGER,
  [DATA_REF_ID.GROUP_CATALOGUE_ITEMS]: DATA_REF_ID.GROUP_CATALOGUE_PAGER,
  [DATA_REF_ID.PRODUCT_TICKET_ITEMS]: DATA_REF_ID.PRODUCT_TICKETS_PAGER,
  [DATA_REF_ID.TICKET_DELEGATE_ITEMS]: DATA_REF_ID.TICKET_DELEGATES_PAGER,
  [DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS]:
    DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_PAGER,
  [DATA_REF_ID.PRODUCT_DELEGATE_ITEMS]: DATA_REF_ID.PRODUCT_DELEGATES_PAGER,
  [DATA_REF_ID.DELEGATE_PRODUCT_ITEMS]: DATA_REF_ID.DELEGATE_PRODUCTS_PAGER,
  [DATA_REF_ID.DELEGATE_TICKET_ITEMS]: DATA_REF_ID.DELEGATE_TICKETS_PAGER,
  [DATA_REF_ID.INVOICE_ITEMS]: DATA_REF_ID.INVOICES_PAGER,
  [DATA_REF_ID.CREDIT_NOTE_LIST_ITEMS]: DATA_REF_ID.CREDIT_NOTES_PAGER,
  [DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS]:
    DATA_REF_ID.CREDIT_STATEMENTS_PAGER,
  [DATA_REF_ID.NOTIFICATION_PAGE_ITEMS]: DATA_REF_ID.NOTIFICATIONS_PAGER,
  [DATA_REF_ID.ACCOUNT_NOTE_ITEMS]: DATA_REF_ID.ACCOUNT_NOTES_PAGER,
  [DATA_REF_ID.ACCOUNT_SECRET_ITEMS]: DATA_REF_ID.ACCOUNT_SECRETS_PAGER,
  [DATA_REF_ID.PRODUCT_INVOICE_ITEMS]: DATA_REF_ID.PRODUCT_INVOICES_PAGER,
  [DATA_REF_ID.PRODUCT_CREDIT_NOTE_ITEMS]:
    DATA_REF_ID.PRODUCT_CREDIT_NOTES_PAGER,
  [DATA_REF_ID.ACCOUNT_DELEGATE_ITEMS]: DATA_REF_ID.ACCOUNT_DELEGATES_PAGER,
  [DATA_REF_ID.CHILD_ACCOUNT_ITEMS]: DATA_REF_ID.CHILD_ACCOUNTS_PAGER,
  [DATA_REF_ID.AFFILIATE_COMMISSION_ITEMS]:
    DATA_REF_ID.AFFILIATE_COMMISSIONS_PAGER,
  [DATA_REF_ID.AFFILIATE_LINK_ITEMS]: DATA_REF_ID.AFFILIATE_LINKS_PAGER,
  [DATA_REF_ID.AFFILIATE_PAYOUT_ITEMS]: DATA_REF_ID.AFFILIATE_PAYOUTS_PAGER,
  [DATA_REF_ID.AFFILIATE_REFERRAL_ITEMS]: DATA_REF_ID.AFFILIATE_REFERRALS_PAGER,
  [DATA_REF_ID.LOGIN_ATTEMPT_ITEMS]: DATA_REF_ID.LOGIN_ATTEMPTS_PAGER,
  [DATA_REF_ID.SENT_EMAIL_ITEMS]: DATA_REF_ID.SENT_EMAILS_PAGER,
  [DATA_REF_ID.IP_WHITELIST_ITEMS]: DATA_REF_ID.IP_WHITELIST_PAGER,
  [DATA_REF_ID.TICKET_ITEMS]: DATA_REF_ID.TICKETS_PAGER
};

/**
 * items-ref → its control-state ref, read exactly as `PAGER_REF_BY_ITEMS_REF`
 * is: a panel whose list is a SEARCHABLE collection gets a control band in its
 * header; a ref with no entry gets none.
 */
export const CONTROLS_REF_BY_ITEMS_REF: Partial<Record<DataRefId, DataRefId>> =
  {
    [DATA_REF_ID.GROUP_PRODUCT_ITEMS]: DATA_REF_ID.GROUP_PRODUCTS_CONTROLS,
    [DATA_REF_ID.INVOICE_ITEMS]: DATA_REF_ID.INVOICES_CONTROLS,
    [DATA_REF_ID.TICKET_ITEMS]: DATA_REF_ID.TICKETS_CONTROLS,
    [DATA_REF_ID.CREDIT_NOTE_LIST_ITEMS]: DATA_REF_ID.CREDIT_NOTES_CONTROLS,
    [DATA_REF_ID.PRODUCT_TICKET_ITEMS]: DATA_REF_ID.PRODUCT_TICKETS_CONTROLS,
    [DATA_REF_ID.TICKET_DELEGATE_ITEMS]: DATA_REF_ID.TICKET_DELEGATES_CONTROLS,
    [DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS]:
      DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_CONTROLS,
    [DATA_REF_ID.PRODUCT_DELEGATE_ITEMS]:
      DATA_REF_ID.PRODUCT_DELEGATES_CONTROLS,
    [DATA_REF_ID.DELEGATE_PRODUCT_ITEMS]:
      DATA_REF_ID.DELEGATE_PRODUCTS_CONTROLS,
    [DATA_REF_ID.DELEGATE_TICKET_ITEMS]: DATA_REF_ID.DELEGATE_TICKETS_CONTROLS,
    [DATA_REF_ID.AFFILIATE_LINK_ITEMS]: DATA_REF_ID.AFFILIATE_LINKS_CONTROLS,
    [DATA_REF_ID.AFFILIATE_COMMISSION_ITEMS]:
      DATA_REF_ID.AFFILIATE_COMMISSIONS_CONTROLS,
    [DATA_REF_ID.AFFILIATE_PAYOUT_ITEMS]:
      DATA_REF_ID.AFFILIATE_PAYOUTS_CONTROLS,
    [DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS]:
      DATA_REF_ID.CREDIT_STATEMENTS_CONTROLS,
    [DATA_REF_ID.ACCOUNT_DELEGATE_ITEMS]:
      DATA_REF_ID.ACCOUNT_DELEGATES_CONTROLS,
    [DATA_REF_ID.AFFILIATE_REFERRAL_ITEMS]:
      DATA_REF_ID.AFFILIATE_REFERRALS_CONTROLS,
    [DATA_REF_ID.CHILD_ACCOUNT_ITEMS]: DATA_REF_ID.CHILD_ACCOUNTS_CONTROLS,
    [DATA_REF_ID.LOGIN_ATTEMPT_ITEMS]: DATA_REF_ID.LOGIN_ATTEMPTS_CONTROLS,
    [DATA_REF_ID.SENT_EMAIL_ITEMS]: DATA_REF_ID.SENT_EMAILS_CONTROLS,
    [DATA_REF_ID.IP_WHITELIST_ITEMS]: DATA_REF_ID.IP_WHITELIST_CONTROLS,
    [DATA_REF_ID.BILLABLE_ENTITY_ITEMS]: DATA_REF_ID.BILLABLE_ENTITIES_CONTROLS,
    [DATA_REF_ID.PRODUCT_INVOICE_ITEMS]: DATA_REF_ID.PRODUCT_INVOICES_CONTROLS,
    [DATA_REF_ID.PRODUCT_CREDIT_NOTE_ITEMS]:
      DATA_REF_ID.PRODUCT_CREDIT_NOTES_CONTROLS
  };

/**
 * ONE ref, resolved — the door a row's own presence gate goes through
 * (`content/PortalContent.vue`), where the value is not a module prop and so
 * never reaches `resolveDataRefProps`. No dataset resolves to `undefined`,
 * exactly as an unresolvable prop does.
 */
export function resolveDataRef(
  ref: DataRef,
  data: MockDataset | undefined,
  context: DataRouteContext = {}
): unknown {
  if (data === undefined) return undefined;
  return SELECTOR_BY_REF[ref.id](data, context);
}

/**
 * Resolves every `dataRef` prop against the dataset; literals pass through
 * untouched. No dataset (a shape with no registered seed) resolves refs to
 * `undefined` — the module's own empty state renders — with a loud dev error,
 * the same quiet-in-prod treatment a rejected slot gets (§D5).
 */
export function resolveDataRefProps(
  props: Readonly<Record<string, unknown>> | undefined,
  data: MockDataset | undefined,
  context: DataRouteContext = {}
): Readonly<Record<string, unknown>> | undefined {
  if (props === undefined) return undefined;

  return mapValues(props, value => {
    if (!isDataRef(value)) return value;
    if (data === undefined) {
      if (import.meta.dev) {
        console.error(
          `[portal] data ref "${value.id}" used by a shape with no mock dataset — resolving to undefined.`
        );
      }
      return undefined;
    }
    return SELECTOR_BY_REF[value.id](data, context);
  });
}
