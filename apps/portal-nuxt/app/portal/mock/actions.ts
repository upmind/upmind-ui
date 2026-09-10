// -----------------------------------------------------------------------------
/**
 * @module portal/mock/actions
 * @description The action seam (plan Phase D): modules emit `select` with a
 * value; `PortalSlotContent` hands it here with the active dataset and route
 * context; the dispatcher resolves a FACADE, calls a method, and names what
 * happens next — a toast, a confirmation, a destination (plan R3, R4). The
 * values are AUTHORED by the selectors in this same layer via
 * `mockActionValue`, so the verb:id protocol never leaks past the mock layer
 * — modules stay data-first, configs stay declarative.
 *
 * Feedback lives here and nowhere else: a facade answers with a receipt, and
 * which copy that receipt earns is the dispatcher's call (plan R4).
 */

import {
  DelegateObjectTypes,
  ProvisionRequestActionTypes
} from "@upmind-automation/types";
import { CLIENT_VUE_STUB_TITLE, clientVueProse } from "./client-vue";
import {
  NOTIFICATION_FILTER,
  NOTIFICATION_FILTER_CRITERIA,
  NOTIFICATION_FILTER_KEY,
  notificationFeedCollection,
  resolvePagedCollection
} from "./collection-defs";
import {
  ClientRelationToggleKeys,
  ClientVaultContextTypes,
  DelegateAccessTypes
} from "./contracts";
import { NEW_LINE_KEY } from "./contracts/client-tickets";
import { parseAttachmentNames } from "./contracts/client-tickets.schemas";
import { shareLinkFor } from "./documents";
import {
  activePersonaAccount,
  consolidatableInvoices,
  hasDelegateObject,
  invoicePaymentMethod,
  isInvoicePayable,
  isSupportPinRevealed,
  newLineKey,
  MOCK_RECEIPT_REASON,
  submittedNumber,
  useMockAccount,
  useMockAffiliate,
  useMockBillingSettings,
  useMockCatalogue,
  useMockContractProduct,
  useMockDelegate,
  useMockDelegates,
  useMockInvoice,
  useMockInvoices,
  useMockIpWhitelist,
  useMockNotifications,
  useMockPersonalDetails,
  useMockProvisioning,
  useMockRelation,
  useMockSecurity,
  submittedText,
  useMockSupportPin,
  useMockTicket,
  useMockTickets,
  useMockVault,
  useMockWallet,
  trialEndConfirmation,
  whyNotShareable
} from "./facades";
import { useMockClientEmails } from "./facades/useMockContacts";
import { FORM_ID, isFormId } from "./forms/ids";
import { assign, find, includes, isPlainObject, size, values } from "lodash-es";
import type { NotificationFilter } from "./collection-defs";
import type { VaultAssetScope } from "./contracts";
import type { NewLineKey } from "./contracts/client-tickets";
import type {
  MockActionReceipt,
  MockCreditStatementView,
  MockReceiptReason
} from "./facades";
import type { FormId } from "./forms/ids";
import type { DataRouteContext } from "./injection";
import type {
  MockDataset,
  MockInvoice,
  MockPaymentMethod,
  MockProduct
} from "./types";
import type { FormModel } from "@upmind/ui";
import { useListViewPreference } from "~/composables/useListViewPreference";

export const MOCK_ACTION = {
  COMPLETE_SETUP: "complete-setup",
  VIEW_PRODUCT: "view-product",
  PAY_INVOICE: "pay-invoice",
  /** Puts the document's public link on the clipboard — the token is the dataset's. */
  SHARE_INVOICE: "share-invoice",
  /** Saves the share dialog — `<id>:<json>`. */
  INVOICE_SHARE_SAVE: "invoice-share-save",
  /** Mints a new public link, which retires the one already handed out. */
  INVOICE_SHARE_REGENERATE: "invoice-share-regenerate",
  INVOICE_SHARE_REGENERATE_CONFIRMED: "invoice-share-regenerate-confirmed",
  /** Opens a document's print view: `download:<invoice|credit-note>:<id>` (plan R11). */
  DOWNLOAD: "download",
  PLACE_ORDER: "place-order",
  REPLY_TICKET: "reply-ticket",
  /** The composer's post-options write: `support-preferences-save:<json>`. */
  SUPPORT_PREFERENCES_SAVE: "support-preferences-save",
  /** Legacy's manage-ticket controls — the payload names the thread. */
  TICKET_REOPEN: "ticket-reopen",
  /** Closing ends the conversation, so it asks first. */
  TICKET_CLOSE: "ticket-close",
  TICKET_CLOSE_CONFIRMED: "ticket-close-confirmed",
  /** Detaches the product the thread is about; the thread itself stays. */
  TICKET_REMOVE_PRODUCT: "ticket-remove-product",
  /** Shares one thread with one delegate: `<ticketId>:<delegateId>`. */
  TICKET_DELEGATE: "ticket-delegate",
  TICKET_DELEGATE_CONFIRMED: "ticket-delegate-confirmed",
  /** Withdraws the client's own message: `ticket-message-delete:<messageId>`. */
  TICKET_MESSAGE_DELETE: "ticket-message-delete",
  TICKET_MESSAGE_DELETE_CONFIRMED: "ticket-message-delete-confirmed",
  /** Opens what a withdrawn message said: `ticket-message-view-deleted:<messageId>`. */
  TICKET_MESSAGE_VIEW_DELETED: "ticket-message-view-deleted",
  /** Takes one named file off a message: `<messageId>:<name>`. */
  TICKET_ATTACHMENT_DELETE: "ticket-attachment-delete",
  TICKET_ATTACHMENT_DELETE_CONFIRMED: "ticket-attachment-delete-confirmed",
  /** One filed credit statement as a CSV: `credit-statement-csv:<statementId>`. */
  CREDIT_STATEMENT_CSV: "credit-statement-csv",
  MARK_NOTIFICATIONS_READ: "mark-notifications-read",
  /** Opens what a cut notification says in full: `notification-read-more:<id>`. */
  NOTIFICATION_READ_MORE: "notification-read-more",
  /** One topic's every channel at once: `notification-topic-set:<topicId>:<on|off>`. */
  NOTIFICATION_TOPIC_SET: "notification-topic-set",
  /** Legacy's child-account flow (plan R10) — the id names the RELATION, not the child. */
  LOGIN_AS_CHILD: "login-as-child",
  END_IMPERSONATION: "end-impersonation",
  /** The payload is the TEXT to put on the clipboard — a secret, a reference, a link. */
  COPY: "copy",
  /** Hands the print view to the browser's own print dialog (plan R11) — never on load. */
  PRINT: "print",
  /** The pager's arrows — the id names a paged collection (collection-defs.ts). */
  PAGE_NEXT: "page-next",
  PAGE_PREV: "page-prev",
  /**
   * The control band's two refinements, carried on the same collection instance the
   * pager arrows reach: `<verb>:<collectionId>:<tail>`, empty tail clears.
   */
  COLLECTION_SEARCH: "collection-search",
  COLLECTION_SORT: "collection-sort",
  /** One declared filter control: `collection-filter:<collectionId>:<key>:<value>`, empty value clears. */
  COLLECTION_FILTER: "collection-filter",
  /** How many rows a panel shows: `set-page-size:<collectionId>:<n>`. */
  SET_PAGE_SIZE: "set-page-size",
  /** How a listing that offers a choice is laid out: `set-view:<grid|table>`. */
  SET_VIEW: "set-view",
  /** One provider function on one product: `run-provision-function:<productId>:<code>`. */
  RUN_PROVISION_FUNCTION: "run-provision-function",
  /** Deletes one note or secret, and the destructive half its confirmation re-dispatches. */
  VAULT_REMOVE: "vault-remove",
  VAULT_REMOVE_CONFIRMED: "vault-remove-confirmed",
  /** Turns a note into a secret, or a secret back into a note. */
  VAULT_CONVERT: "vault-convert",
  /** Pins one vault row to the top of its panel, or lets it back down: `vault-pin:<id>`. */
  VAULT_PIN: "vault-pin",
  /** Legacy's don't-cancel controls, and the halves their confirmations re-dispatch. */
  ABORT_CANCELLATION: "abort-cancellation",
  ABORT_CANCELLATION_CONFIRMED: "abort-cancellation-confirmed",
  DISABLE_AUTO_EXPIRE: "disable-auto-expire",
  DISABLE_AUTO_EXPIRE_CONFIRMED: "disable-auto-expire-confirmed",
  /** Ends a free trial now, and the half its confirmation re-dispatches. */
  END_TRIAL: "end-trial",
  END_TRIAL_CONFIRMED: "end-trial-confirmed",
  /**
   * Legacy's upgrade/downgrade. `migrate-product:<id>` is the control that
   * points at the picker; `migrate-product:<id>:<targetId>` is one picker row,
   * which asks before it swaps.
   */
  MIGRATE_PRODUCT: "migrate-product",
  /**
   * The doors a DEEP LINK opens on arrival — legacy's `?init=` query
   * (`invoiceProvider.vue:433-437`, `cProdProvider.vue:988-993`), which read
   * the param once and opened the flow it named.
   */
  INIT_PAY: "init-pay",
  INIT_UPGRADE: "init-upgrade",
  MIGRATE_PRODUCT_CONFIRMED: "migrate-product-confirmed",
  /**
   * What one change option actually buys, read before it is chosen — legacy's
   * own `_action.review_changes`, which opened the catalogue product's detail
   * modal over the picker (`migrationsListModal.vue:136-149`).
   */
  MIGRATION_REVIEW: "migration-review",
  /** Turns one product's automatic renewal over; turning it OFF asks first. */
  TOGGLE_AUTO_RENEW: "toggle-auto-renew",
  TOGGLE_AUTO_RENEW_CONFIRMED: "toggle-auto-renew-confirmed",
  /** Raises the next renewal invoice early — legacy's own control for a product that will not renew itself. */
  CREATE_RENEWAL_INVOICE: "create-renewal-invoice",
  SET_PRODUCT_BILLING_ADDRESS: "set-product-billing-address",
  /** Legacy's companies beside the addresses — `<productId>:<companyId>`. */
  SET_PRODUCT_BILLING_COMPANY: "product-billing-company-set",
  /** Grants or revokes one object for one delegate: `<delegateId>:<type>:<objectId>`. */
  DELEGATE_TOGGLE_OBJECT: "delegate-toggle-object",
  /** Revokes a delegation outright, and the half its confirmation re-dispatches. */
  DELEGATE_REMOVE: "delegate-remove",
  DELEGATE_REMOVE_CONFIRMED: "delegate-remove-confirmed",
  /** Switches one delegate between whole-account and per-object access: `<id>:<full|specific>`. */
  DELEGATE_SET_ACCESS: "delegate-set-access",
  /** Breaks a parent/child relation, and the half its confirmation re-dispatches. */
  RELATION_DETACH: "relation-detach",
  RELATION_DETACH_CONFIRMED: "relation-detach-confirmed",
  /** Flips one relation switch: `<relationId>:<key>`. */
  RELATION_TOGGLE: "relation-toggle",
  /** Sends one email again, as a new message; and sends one that never left. */
  EMAIL_RESEND: "email-resend",
  EMAIL_RETRY: "email-retry",
  /** Joins the affiliate programme — legacy's opt-in screen. */
  AFFILIATE_ENROL: "affiliate-enrol",
  /** Deletes one referral link, and the half its confirmation re-dispatches. */
  AFFILIATE_LINK_REMOVE: "affiliate-link-remove",
  AFFILIATE_LINK_REMOVE_CONFIRMED: "affiliate-link-remove-confirmed",
  /** Shows the support PIN in full, or masks it again: `pin-reveal:<personaId>`. */
  PIN_REVEAL: "pin-reveal",
  /** Legacy's `copy_and_hide` — the PIN reaches the clipboard, then goes back behind its mask. */
  PIN_COPY_AND_HIDE: "pin-copy-and-hide",
  /** Mints a fresh support PIN — the old one stops working, so it asks first. */
  PIN_REGENERATE: "pin-regenerate",
  PIN_REGENERATE_CONFIRMED: "pin-regenerate-confirmed",
  /** Asks the registry about a company's tax number — the seed carries its answer. */
  COMPANY_VALIDATE_TAX: "company-validate-tax",
  /** Lifts one sign-in restriction, and the half its confirmation re-dispatches. */
  IP_WHITELIST_REMOVE: "ip-whitelist-remove",
  IP_WHITELIST_REMOVE_CONFIRMED: "ip-whitelist-remove-confirmed",
  /** Drops one notification from the feed — legacy said nothing back. */
  NOTIFICATION_DISMISS: "notification-dismiss",
  /** The dropdown's rail: `notification-filter:<all|read|unread>`. */
  NOTIFICATION_FILTER: "notification-filter",
  /** One more page of the feed, appended to what is already showing. */
  NOTIFICATION_LOAD_MORE: "notification-load-more",
  /** Opens the shell's ONE form dialog: `open-form:<formId>:<entityId?>` (plan F2). */
  OPEN_FORM: "open-form",
  /** The profile form's submit: `profile-save:<json>` — the client has exactly one profile. */
  PROFILE_SAVE: "profile-save",
  /** The brand's own questions, answered: `custom-fields-save:<json>`. */
  CUSTOM_FIELDS_SAVE: "custom-fields-save",
  /** The security page's own three forms. */
  USERNAME_CHANGE: "username-change",
  PASSWORD_CHANGE: "password-change",
  TWOFA_ENABLE: "twofa-enable",
  TWOFA_DISABLE: "twofa-disable",
  /** One more address sign-in is allowed from: `ip-whitelist-create:<json>`. */
  IP_WHITELIST_CREATE: "ip-whitelist-create",
  /** Legacy's own edit on a listed address — `<id>:<json>`. */
  IP_WHITELIST_SAVE: "ip-whitelist-save",
  /** The billing settings page's one form: `billing-settings-save:<json>`. */
  BILLING_SETTINGS_SAVE: "billing-settings-save",
  /** Credit added to one currency's balance: `wallet-topup:<json>`. */
  WALLET_TOPUP: "wallet-topup",
  /**
   * The product forms' submits. Each names the product first, because an
   * inline form is bound to the page it stands on: `<verb>:<id>:<json>`.
   */
  PRODUCT_SETUP_SAVE: "product-setup-save",
  PRODUCT_CONSOLIDATION_SAVE: "product-consolidation-save",
  PRODUCT_LABEL_SAVE: "product-label-save",
  /** The cancellation dialog's submit: `product-cancel-request:<id>:<json>`. */
  PRODUCT_CANCEL_REQUEST: "product-cancel-request",
  /** The new-ticket page's submit: `ticket-create:<json>`. */
  TICKET_CREATE: "ticket-create",
  /** The rename dialog's submit: `ticket-subject-save:<ticketId>:<json>`. */
  TICKET_SUBJECT_SAVE: "ticket-subject-save",
  /** The product picker's submit: `ticket-set-product:<ticketId>:<json>`. */
  TICKET_SET_PRODUCT: "ticket-set-product",
  /** The parent-appearance form's submit: `parent-branding-save:<json>`. */
  PARENT_BRANDING_SAVE: "parent-branding-save",
  /** The message editor's submit: `ticket-message-edit:<messageId>:<json>`. */
  TICKET_MESSAGE_EDIT: "ticket-message-edit",
  /** The invitation's submit: `delegate-invite:<json>`. */
  DELEGATE_INVITE: "delegate-invite",
  /**
   * The vault forms' submits. A CREATE carries the scope it lands in first —
   * `<verb>:client:<json>` for the account's own panels,
   * `<verb>:contract-product:<productId>:<json>` for a product's — because
   * the shell mounts one dialog and the page it was opened from is the only
   * thing that knows. An EDIT carries the row (`<verb>:<assetId>:<json>`),
   * which holds its scope and its note/secret axis already.
   */
  VAULT_NOTE_CREATE: "vault-note-create",
  VAULT_NOTE_UPDATE: "vault-note-update",
  VAULT_SECRET_CREATE: "vault-secret-create",
  VAULT_SECRET_UPDATE: "vault-secret-update",
  /** The link dialogs' submits: `<verb>:<json>` and `<verb>:<linkId>:<json>`. */
  AFFILIATE_LINK_CREATE: "affiliate-link-create",
  AFFILIATE_LINK_UPDATE: "affiliate-link-update",
  /** The withdrawal dialog's submit: `affiliate-withdrawal-request:<json>`. */
  AFFILIATE_WITHDRAWAL_REQUEST: "affiliate-withdrawal-request",
  /** The affiliate page's inline destination form: `<verb>:<json>`. */
  AFFILIATE_PAYOUT_DESTINATION_SAVE: "affiliate-payout-destination-save",
  /** The notifications page's inline matrix: `notification-preferences-save:<json>`. */
  NOTIFICATION_PREFERENCES_SAVE: "notification-preferences-save",
  /**
   * The same matrix, submitted from the LOGGED-OUT token page
   * (`/preferences`): `preferences-save:<json>`. A separate verb because the
   * two screens are reached differently — one behind a session, one behind a
   * link — and the writes they authorise are the brand's to tell apart.
   */
  PREFERENCES_SAVE: "preferences-save",
  /** One address's own topic opt-ins: `email-opt-ins-save:<address>:<json>`. */
  EMAIL_OPT_INS_SAVE: "email-opt-ins-save",
  /**
   * Legacy's manual consolidation — one document in place of everything still
   * owed. It asks first, and its accepted half re-dispatches the second verb.
   */
  CONSOLIDATE_INVOICES: "consolidate-invoices",
  CONSOLIDATE_INVOICES_CONFIRMED: "consolidate-invoices-confirmed",
  /** What a payment still with the gateway asks of the client: `open-instructions:<invoiceId>`. */
  OPEN_INSTRUCTIONS: "open-instructions",
  /** Which account this sign-in works on: `switch-account:<json>`. */
  SWITCH_ACCOUNT: "switch-account",
  /** Where the account's picture lives: `avatar-save:<json>`. */
  AVATAR_SAVE: "avatar-save",
  /** The sign-out page's own verb — no payload; the ribbon, if one is up, comes down with it. */
  AUTH_LOGOUT: "auth-logout",
  /** A config-authored destination — the dispatcher just names it as the next step. */
  NAVIGATE: "navigate",
  /** A door client-vue owns: `<Component>|<headless module>` rides the tail, and prose is all that opens. */
  CLIENT_VUE_STUB: "client-vue-stub"
} as const;

export type MockAction = (typeof MOCK_ACTION)[keyof typeof MOCK_ACTION];

/**
 * The query legacy opened a flow from on arrival — `?init=pay` on an invoice,
 * `?init=upgrade` on a product (`invoiceProvider.vue:433-437`,
 * `cProdProvider.vue:988-993`). A value this map does not carry names no flow,
 * and is ignored exactly as legacy ignored one.
 */
export const INIT_QUERY_KEY = "init";

export const INIT_QUERY_VERB = {
  pay: MOCK_ACTION.INIT_PAY,
  upgrade: MOCK_ACTION.INIT_UPGRADE
} as const;

export type InitQueryValue = keyof typeof INIT_QUERY_VERB;

/** Which document a print view is asked for — the `download` verb's first payload segment. */
export const MOCK_DOCUMENT_KIND = {
  INVOICE: "invoice",
  CREDIT_NOTE: "credit-note",
  CREDIT_STATEMENT: "credit-statement"
} as const;

export type MockDocumentKind =
  (typeof MOCK_DOCUMENT_KIND)[keyof typeof MOCK_DOCUMENT_KIND];

/** Where a document's print view lives, per kind (plan R11). */
const PRINT_PATH: Readonly<Record<MockDocumentKind, string>> = {
  [MOCK_DOCUMENT_KIND.INVOICE]: "/billing/invoices",
  [MOCK_DOCUMENT_KIND.CREDIT_NOTE]: "/billing/credit-notes",
  [MOCK_DOCUMENT_KIND.CREDIT_STATEMENT]: "/billing/credit-statements"
};

function isDocumentKind(value: string): value is MockDocumentKind {
  return value in PRINT_PATH;
}

/**
 * Why a form cannot be OPENED at all. Only a form whose subject can move
 * between the row rendering its control and the client pressing it needs one:
 * a thread the desk closed, or a message already withdrawn, still carries a
 * menu entry drawn a moment earlier.
 */
/**
 * The refusal each entity-addressed dialog asks BEFORE it opens — one arm per
 * form whose WRITE already publishes a guard, so the door refuses with the
 * same reason the submit would have. A form with no arm has no guard to ask:
 * its registry entry simply builds nothing for an id nobody holds, and the
 * missing-entity refusal below covers the envelope.
 */
const FORM_REFUSAL: Partial<
  Record<
    FormId,
    (
      data: MockDataset,
      entityId: string | undefined
    ) => MockActionReceipt<unknown> | undefined
  >
> = {
  [FORM_ID.TICKET_MESSAGE_EDIT]: (data, entityId) => {
    const addressed = splitAtFirstColon(entityId);
    if (addressed === undefined) return undefined;
    return useMockTicket(data, addressed.head)
      .useActions()
      .whyNotEditable(addressed.tail);
  },
  [FORM_ID.TICKET_SUBJECT_SAVE]: (data, entityId) =>
    addressedTicket(data, entityId, thread =>
      thread.useActions().whyNotRenamable()
    ),
  [FORM_ID.TICKET_SET_PRODUCT]: (data, entityId) =>
    addressedTicket(data, entityId, thread =>
      thread.useActions().whyNotProductSettable()
    ),

  [FORM_ID.PRODUCT_LABEL]: (data, entityId) => {
    if (entityId === undefined) return undefined;
    const product = useMockContractProduct(data, entityId).useContext().data
      .value;
    if (product !== undefined) return undefined;
    return { ok: false, reason: MOCK_RECEIPT_REASON.NOT_FOUND };
  },
  [FORM_ID.IP_WHITELIST_EDIT]: (data, entityId) => {
    if (find(data.ipWhitelist, { id: entityId }) !== undefined)
      return undefined;
    return { ok: false, reason: MOCK_RECEIPT_REASON.NOT_FOUND };
  },
  [FORM_ID.INVOICE_SHARE]: (data, entityId) =>
    addressedInvoice(data, entityId, invoice => whyNotShareable(invoice))
};

/** One thread's guard, or the standing not-found where the id names none. */
function addressedTicket(
  data: MockDataset,
  entityId: string | undefined,
  ask: (
    thread: ReturnType<typeof useMockTicket>
  ) => MockActionReceipt<unknown> | undefined
): MockActionReceipt<unknown> | undefined {
  if (entityId === undefined) return undefined;
  const thread = useMockTicket(data, entityId);
  if (thread.useContext().data.value === undefined) {
    return { ok: false, reason: MOCK_RECEIPT_REASON.NOT_FOUND };
  }
  return ask(thread);
}

/** One document's guard, or the standing not-found where the id names none. */
function addressedInvoice(
  data: MockDataset,
  entityId: string | undefined,
  ask: (invoice: MockInvoice) => MockActionReceipt<unknown> | undefined
): MockActionReceipt<unknown> | undefined {
  if (entityId === undefined) return undefined;
  const invoice = useMockInvoice(data, entityId).useContext().data.value;
  if (invoice === undefined) {
    return { ok: false, reason: MOCK_RECEIPT_REASON.NOT_FOUND };
  }
  return ask(invoice);
}

function whyFormRefuses(
  data: MockDataset,
  formId: FormId,
  entityId: string | undefined
): MockActionReceipt<unknown> | undefined {
  return FORM_REFUSAL[formId]?.(data, entityId);
}

/** One filed statement period, as the facade computes it, or nothing under that id. */
function creditStatement(
  data: MockDataset,
  statementId: string
): MockCreditStatementView | undefined {
  return find(useMockWallet(data).useContext().data.value.statements, {
    id: statementId
  });
}

/** The rail's payload — one of legacy's three choices, or nothing this seam knows. */
function isNotificationFilter(
  value: string | undefined
): value is NotificationFilter {
  return includes(values(NOTIFICATION_FILTER), value);
}

/** The delegate verb's middle segment — a wire object type, or nothing this seam knows. */
function isDelegateObjectType(value: string): value is DelegateObjectTypes {
  return includes(values(DelegateObjectTypes), value);
}

/** The access verb's tail — one of the contract's two access types. */
function isDelegateAccessType(value: string): value is DelegateAccessTypes {
  return includes(values(DelegateAccessTypes), value);
}

/** What each access type reads as in the receipt the client is shown. */
const ACCESS_TYPE_MESSAGE: Readonly<Record<DelegateAccessTypes, string>> = {
  [DelegateAccessTypes.FULL]: "access to your whole account",
  [DelegateAccessTypes.SPECIFIC]: "access only to what you name"
};

/** The relation verb's tail — one of the three switches the panel offers. */
function isRelationToggleKey(value: string): value is ClientRelationToggleKeys {
  return includes(values(ClientRelationToggleKeys), value);
}
/** What each relation switch is called in the receipt the client is shown. */
const RELATION_TOGGLE_LABEL: Readonly<
  Record<ClientRelationToggleKeys, string>
> = {
  [ClientRelationToggleKeys.ALLOW_IMPERSONATION]: "Impersonation",
  [ClientRelationToggleKeys.INHERIT_PAYMENT_DETAILS]:
    "Inherited payment details",
  [ClientRelationToggleKeys.USE_PARENT_BRANDING]: "Parent branding"
};

/** The selector-side author of an emitted value — `verb` alone leans on the route context for its subject. */
export function mockActionValue(action: MockAction, id?: string): string {
  if (id === undefined) return action;
  return `${action}:${id}`;
}

/** How a toast reads — the design system's own four intents (`toast.success` and friends). */
export const MOCK_TOAST_INTENT = {
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error"
} as const;

export type MockToastIntent =
  (typeof MOCK_TOAST_INTENT)[keyof typeof MOCK_TOAST_INTENT];

/** Legacy's snackbar, as data: the shell raises it, no module knows it exists. */
export type MockActionToast = {
  readonly intent: MockToastIntent;
  readonly title: string;
  readonly description?: string;
};

/** Legacy's confirm modal, as data: the shell opens ONE AlertDialog and re-dispatches `then` on accept. */
export type MockActionConfirm = {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly destructive?: boolean;
  /** The action value the accepted dialog sends back through this same door. */
  readonly then: string;
};

/**
 * Brand- or provider-authored PROSE to read and nothing else — payment
 * instructions, and whatever else answers a question rather than asking one.
 * The shell opens it in its own read-only dialog, beside the form's.
 */
export type MockActionProse = {
  readonly title: string;
  readonly markdown: string;
};

/** Which registered form the shell's one dialog opens (plan F2). */
export type MockActionForm = {
  readonly id: FormId;
  /** The row the form edits, where it edits one. */
  readonly entityId?: string;
};

export type MockActionResult = {
  /** Where the page goes after the mutation — the flow's next step. */
  readonly to?: string;
  /**
   * An EXTERNAL destination — a provider's own control panel. Opened in a new
   * tab by the runner, never routed to: it leaves the portal, and a client
   * mid-way through a product page should come back to it.
   */
  readonly href?: string;
  readonly toast?: MockActionToast;
  readonly confirm?: MockActionConfirm;
  readonly form?: MockActionForm;
  /** Something to READ — opened in the shell's prose dialog, which asks nothing back. */
  readonly prose?: MockActionProse;
  /**
   * A form's submit was ANSWERED — the facade's receipt came back `ok`. The
   * shell closes the open dialog on this and nothing else: a submit that
   * navigates, or one whose success is silent, closes it just as a toasting
   * one does, and a refusal leaves it up with what was typed (plan F2).
   */
  readonly formDone?: boolean;
};

/**
 * Why a write refused, in the client's own words — the facades hand over
 * codes, never copy. Exported because a control that is DISABLED says the
 * same thing before it is pressed: one wording, both readers.
 */
export const MOCK_REFUSAL_MESSAGE: Readonly<Record<MockReceiptReason, string>> =
  {
    [MOCK_RECEIPT_REASON.ALREADY_PAID]: "That invoice is not awaiting payment.",
    [MOCK_RECEIPT_REASON.NOT_AWAITING_SETUP]:
      "That product is not waiting on setup.",
    [MOCK_RECEIPT_REASON.DEFAULT_METHOD]:
      "The default payment method cannot be removed.",
    [MOCK_RECEIPT_REASON.LAST_METHOD]:
      "Your last payment method cannot be removed.",
    [MOCK_RECEIPT_REASON.NOTHING_UNREAD]: "You have no unread notifications.",
    [MOCK_RECEIPT_REASON.IMPERSONATION_REFUSED]:
      "That account has not allowed you to log in as it.",
    [MOCK_RECEIPT_REASON.NOT_CANCELLABLE]:
      "That order can no longer be cancelled.",
    [MOCK_RECEIPT_REASON.OVERDUE_INVOICES]:
      "Settle the overdue invoice on this product before cancelling it.",
    [MOCK_RECEIPT_REASON.CANCELLATION_FORBIDDEN]:
      "This product cannot be cancelled from here — open a ticket and we will help.",
    [MOCK_RECEIPT_REASON.ALREADY_DEFAULT]:
      "That card is already charged first.",
    [MOCK_RECEIPT_REASON.NO_PROVISION_TARGET]:
      "Your provider has not published a link for that yet.",
    [MOCK_RECEIPT_REASON.NOT_IN_TRIAL]: "That product is not on a free trial.",
    [MOCK_RECEIPT_REASON.NOT_MIGRATABLE]:
      "That product cannot be changed at the moment.",
    [MOCK_RECEIPT_REASON.PRO_RATA_PENDING]:
      "A pro-rata adjustment from your last change is still being applied.",
    [MOCK_RECEIPT_REASON.AUTO_RENEW_LOCKED]:
      "Automatic renewal cannot be turned off for that product.",
    [MOCK_RECEIPT_REASON.RENEWS_ITSELF]:
      "That product renews itself — its next invoice is raised for you.",
    [MOCK_RECEIPT_REASON.NOT_RENEWABLE]:
      "That product is a one-time purchase and does not renew.",
    [MOCK_RECEIPT_REASON.CANCELLATION_ACCEPTED]:
      "That cancellation has been accepted and can no longer be called off.",
    [MOCK_RECEIPT_REASON.NOT_IMPLEMENTED]:
      "That is not available in this preview yet.",
    [MOCK_RECEIPT_REASON.NOT_FOUND]: "That item was not found.",
    [MOCK_RECEIPT_REASON.DEFAULT_CONTACT]:
      "Make another entry the default before deleting this one.",
    [MOCK_RECEIPT_REASON.NOT_DELETABLE]: "That entry cannot be deleted.",
    [MOCK_RECEIPT_REASON.EMPTY_NAME]: "Give this a name before you save it.",
    [MOCK_RECEIPT_REASON.ALREADY_ENROLLED]:
      "You have already joined the affiliate programme.",
    [MOCK_RECEIPT_REASON.AFFILIATE_DISABLED]:
      "Your affiliate account has been suspended. Talk to us and we will look into it.",
    [MOCK_RECEIPT_REASON.NOT_CLOSED]: "That ticket is still open.",
    [MOCK_RECEIPT_REASON.ALREADY_CLOSED]: "That ticket is already closed.",
    [MOCK_RECEIPT_REASON.LOCKED]:
      "That ticket is locked — reply on it and we will make the change for you.",
    [MOCK_RECEIPT_REASON.ALREADY_DELEGATED]:
      "That ticket has already been shared with somebody.",
    [MOCK_RECEIPT_REASON.ALREADY_DELETED]: "That message has been deleted.",
    [MOCK_RECEIPT_REASON.EMPTY_MESSAGE]:
      "Write something before you save the message.",
    [MOCK_RECEIPT_REASON.NO_RELATED_PRODUCT]:
      "That ticket is not about one of your products.",
    [MOCK_RECEIPT_REASON.DUPLICATE_CONTACT]: "That is already on your account.",
    [MOCK_RECEIPT_REASON.PASSWORD_MISMATCH]:
      "Those two passwords are not the same.",
    [MOCK_RECEIPT_REASON.INVALID_TWO_FACTOR_CODE]:
      "Enter the six-digit code from your authenticator app.",
    [MOCK_RECEIPT_REASON.INVALID_VERIFICATION_CODE]:
      "Enter the six-digit code from the email we sent you.",
    [MOCK_RECEIPT_REASON.EMPTY_CANCEL_DATE]:
      "Choose the day you want this to stop.",
    [MOCK_RECEIPT_REASON.INVALID_CREDENTIALS]:
      "That username and password do not match an account here.",
    [MOCK_RECEIPT_REASON.INVALID_CARD]:
      "Check that card number — it is not one an issuer could have given you.",
    [MOCK_RECEIPT_REASON.EMPTY_AMOUNT]: "Enter an amount to add.",
    [MOCK_RECEIPT_REASON.CANCELLATION_REQUESTED]:
      "A cancellation has already been asked for on that product.",
    [MOCK_RECEIPT_REASON.DUPLICATE_DELEGATE]:
      "You have already invited that person.",
    [MOCK_RECEIPT_REASON.NOTHING_TO_WITHDRAW]:
      "You have nothing cleared to withdraw yet.",
    [MOCK_RECEIPT_REASON.NO_DEPARTMENT]:
      "This brand has no support desk to raise a ticket with.",
    [MOCK_RECEIPT_REASON.ALREADY_ACTIVE]:
      "You are already working on that account.",
    [MOCK_RECEIPT_REASON.EMPTY_IMAGE]:
      "Give the web address of an image to use.",
    [MOCK_RECEIPT_REASON.UNKNOWN_EMAIL]:
      "That address is not one this account holds.",
    [MOCK_RECEIPT_REASON.NOTHING_TO_CONSOLIDATE]:
      "You need at least two unpaid invoices before they can be brought together.",
    [MOCK_RECEIPT_REASON.NO_PAYMENT_INSTRUCTIONS]:
      "There are no payment instructions to follow on this invoice.",
    [MOCK_RECEIPT_REASON.ALREADY_VERIFIED]:
      "That payment method is already verified.",
    [MOCK_RECEIPT_REASON.NOT_VERIFIABLE]:
      "Your provider cannot check that payment method again.",
    [MOCK_RECEIPT_REASON.AUTO_PAYMENT_FORCED]:
      "This brand settles stored cards automatically, so that cannot be turned off.",
    [MOCK_RECEIPT_REASON.SCHEDULE_NOT_FUTURE]:
      "Choose a time in the future for the ticket to open.",
    [MOCK_RECEIPT_REASON.WITHDRAWAL_DISABLED]:
      "This brand does not take withdrawal requests.",
    [MOCK_RECEIPT_REASON.CURRENCY_NOT_PAYABLE]:
      "This invoice cannot be paid in that currency.",
    [MOCK_RECEIPT_REASON.NOT_PERMITTED]:
      "That is something only our team can do — ask us and we will run it for you.",
    [MOCK_RECEIPT_REASON.AMOUNT_ABOVE_OWED]:
      "That is more than this invoice still owes.",
    [MOCK_RECEIPT_REASON.PARTIAL_PAYMENT_REFUSED]:
      "This brand takes the whole balance rather than part of it.",
    [MOCK_RECEIPT_REASON.NO_ACCOUNT_CREDIT]:
      "You hold no account credit in that currency.",
    [MOCK_RECEIPT_REASON.CLEARING]:
      "A payment on this invoice is still clearing — wait for it to land before paying again.",
    [MOCK_RECEIPT_REASON.STAGED_IMPORT]:
      "Your account is still being set up — this can be changed once that finishes.",
    [MOCK_RECEIPT_REASON.TOPIC_MANDATORY]:
      "We always send that one — it is not yours to turn off."
  };

/** What a provider function that stays in the portal says back, per outcome. */
const PROVISION_RESULT_TITLE: Readonly<
  Record<ProvisionRequestActionTypes, string>
> = {
  [ProvisionRequestActionTypes.DISPLAY_RETURN_FIELDS]: "Details updated",
  [ProvisionRequestActionTypes.FORM_POST]: "Sent to your provider",
  [ProvisionRequestActionTypes.REDIRECT]: "Opening your provider",
  [ProvisionRequestActionTypes.REFRESH_FIELDS]: "Details refreshed",
  [ProvisionRequestActionTypes.RENDER_IFRAME]: "Opened below"
};

/**
 * What one Pay control names: the document, and the card it will be charged
 * to where the account holds one. Exported nowhere — the deep link and the
 * dispatcher's own cases both spell it here.
 */
function payInvoiceTail(
  invoice: MockInvoice,
  card: MockPaymentMethod | undefined
): string {
  if (card === undefined) return invoice.id;
  return `${invoice.id}:${card.id}`;
}

/** One refusal, as a result — the ONE path from a receipt reason to copy. */
function refusal(reason: MockReceiptReason): MockActionResult {
  return {
    toast: {
      intent: MOCK_TOAST_INTENT.WARNING,
      title: MOCK_REFUSAL_MESSAGE[reason]
    }
  };
}

/**
 * A KNOWN verb whose payload names a row this dataset does not hold. Exported
 * because a case that resolves its subject BEFORE asking the facade (a
 * destructive verb wording its own dialog) has to answer the same way.
 */
function notFound(): MockActionResult {
  return refusal(MOCK_RECEIPT_REASON.NOT_FOUND);
}

/**
 * One receipt, as a result. Feedback runs on two tiers (operator ruling):
 * an unknown VERB is a quiet `undefined` — chrome buttons emit their labels
 * and this layer never authored them — while a KNOWN verb naming a row the
 * dataset does not hold REFUSES out loud, because a control the client
 * pressed always answers. A facade's own `undefined` (no subject at all) is
 * that second tier, so it lands here as `NOT_FOUND` rather than silence.
 */
function fromReceipt<TEntity>(
  receipt: MockActionReceipt<TEntity> | undefined,
  onSuccess: (entity: TEntity) => MockActionResult
): MockActionResult {
  if (receipt === undefined) return notFound();
  if (!receipt.ok) {
    if (receipt.reason === undefined) return notFound();
    return refusal(receipt.reason);
  }
  if (receipt.entity === undefined) return notFound();
  return onSuccess(receipt.entity);
}

/** What a saved contact row says back — the heading names the write, the line names the row. */
function contactSaved(
  title: string,
  subject: string | null | undefined
): MockActionResult {
  return {
    toast: {
      intent: MOCK_TOAST_INTENT.SUCCESS,
      title,
      description: subject ?? undefined
    }
  };
}

/**
 * A FORM submit's answer. The same receipt path every other verb takes, plus
 * the one fact the shell's dialog closes on — stamped from the receipt, never
 * from the toast, so a silent or navigating success closes the form too.
 */
function fromFormReceipt<TEntity>(
  receipt: MockActionReceipt<TEntity> | undefined,
  onSuccess: (entity: TEntity) => MockActionResult
): MockActionResult {
  const result = fromReceipt(receipt, onSuccess);
  if (receipt?.ok !== true) return result;
  return assign({}, result, { formDone: true });
}

/** What a lodged cancellation says back — the day the product actually stops. */
function cancellationSummary(product: MockProduct): string {
  const request = product.cancellationRequest;
  if (request?.cancelAt === undefined) return product.name;
  return `${product.name} stops on ${request.cancelAt}.`;
}

/** What a deleted contact row says back — one wording for all four lists. */
function removedToast(subject: string): MockActionResult {
  return {
    toast: {
      intent: MOCK_TOAST_INTENT.SUCCESS,
      title: "Deleted",
      description: subject
    }
  };
}

/**
 * A collection verb's payload, split at ITS first colon: the tail keeps any
 * further colons, exactly as a reply's text does. A payload with no colon at
 * all names no subject, so it is the standing quiet no-op.
 *
 * Exported because a form addressed by a PAIR (`<ticketId>:<messageId>`) is
 * built from the same two segments the dispatcher reads, and neither side may
 * spell the split for itself.
 */
export function splitAtFirstColon(
  payload: string | undefined
): { readonly head: string; readonly tail: string } | undefined {
  if (payload === undefined) return undefined;
  const separator = payload.indexOf(":");
  if (separator === -1) return undefined;
  return {
    head: payload.slice(0, separator),
    tail: payload.slice(separator + 1)
  };
}

/** What one Pay control names: the document, the card, and the currency where the client chose one. */
export type PayInvoicePayload = {
  readonly invoiceId: string;
  readonly paymentDetailId: string;
  readonly currencyCode?: string;
};

/**
 * Which way a topic's every channel is set at once — the tail of
 * `notification-topic-set`. Legacy drew ONE link per row whose words followed
 * the row's own state; the verb names the state it is asking for, so the
 * write is the same write whichever label was pressed.
 */
export const TOPIC_SWITCH = {
  ON: "on",
  OFF: "off"
} as const;

export type TopicSwitch = (typeof TOPIC_SWITCH)[keyof typeof TOPIC_SWITCH];

function isTopicSwitch(value: string): value is TopicSwitch {
  return includes(values<string>(TOPIC_SWITCH), value);
}

/**
 * Which key the post-options form said starts a new line. A value the picker
 * could not have produced leaves the answer this client already has, rather
 * than quietly moving the key on a submit that never named it.
 */
function submittedNewLineKey(data: MockDataset, model: FormModel): NewLineKey {
  const chosen = submittedText(model, "newLineKey");
  if (chosen === NEW_LINE_KEY.ENTER) return NEW_LINE_KEY.ENTER;
  if (chosen === NEW_LINE_KEY.SHIFT_ENTER) return NEW_LINE_KEY.SHIFT_ENTER;
  return newLineKey(data);
}

/** What each side of that switch says back. */
const TOPIC_SWITCH_MESSAGE: Readonly<Record<TopicSwitch, string>> = {
  [TOPIC_SWITCH.ON]: "You will hear about this on every channel.",
  [TOPIC_SWITCH.OFF]: "You will not hear about this at all."
};

/**
 * A form's submit payload — the JSON-encoded model the `form` module appends
 * as the verb's tail (plan F1). A malformed tail names no model at all, so it
 * is the standing QUIET no-op tier: nobody authored it, and there is nothing
 * to answer with.
 */
function parseFormPayload(tail: string | undefined): FormModel | undefined {
  if (tail === undefined) return undefined;
  try {
    return toFormModel(JSON.parse(tail));
  } catch {
    return undefined;
  }
}

/** A tail that decodes to anything but an object names no model. */
function isFormModel(value: unknown): value is FormModel {
  return isPlainObject(value);
}

function toFormModel(value: unknown): FormModel | undefined {
  if (!isFormModel(value)) return undefined;
  return value;
}

/**
 * A vault CREATE's payload: the scope it lands in, then the model. An account
 * row carries `client:<json>`; a product's carries
 * `contract-product:<productId>:<json>` — the shell's one dialog is mounted
 * away from the page that knows which product it was opened from, so the
 * scope rides in the verb (plan F2).
 */
function parseVaultCreate(
  payload: string | undefined,
  encrypted: boolean
): { readonly scope: VaultAssetScope; readonly model: FormModel } | undefined {
  const addressed = splitAtFirstColon(payload);
  if (addressed === undefined) return undefined;

  if (addressed.head === ClientVaultContextTypes.CLIENT) {
    const model = parseFormPayload(addressed.tail);
    if (model === undefined) return undefined;
    return {
      scope: { context: ClientVaultContextTypes.CLIENT, encrypted },
      model
    };
  }
  if (addressed.head !== ClientVaultContextTypes.CONTRACT_PRODUCT) {
    return undefined;
  }
  const scoped = splitAtFirstColon(addressed.tail);
  const model = parseFormPayload(scoped?.tail);
  if (scoped === undefined || model === undefined) return undefined;
  return {
    scope: {
      context: ClientVaultContextTypes.CONTRACT_PRODUCT,
      contractProductId: scoped.head,
      encrypted
    },
    model
  };
}

/** Which of the two panels a vault receipt is about, and what happened to it. */
function secretOrNote(isSecret: boolean, verb: string): string {
  if (isSecret) return `Secret ${verb}`;
  return `Note ${verb}`;
}

/** What a saved vault row says back — the heading names the write, the line names the row. */
function vaultSaved(title: string, label: string): MockActionResult {
  return {
    toast: {
      intent: MOCK_TOAST_INTENT.SUCCESS,
      title,
      description: label
    }
  };
}

/**
 * The clipboard, where the browser offers one. Absent (an insecure origin,
 * jsdom) the toast still says "Copied" — the mock has no second outcome to
 * offer, and a silent failure reads worse than an optimistic receipt.
 */
async function writeToClipboard(text: string): Promise<void> {
  if (typeof navigator === "undefined") return;
  if (navigator.clipboard === undefined) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // A denied permission is the browser's answer, not an app error.
  }
}

/**
 * Runs one emitted action against the live dataset. Two tiers, and the
 * difference is who pressed what (operator ruling):
 *
 * - An unknown VERB, or a payload this layer never authored, is a quiet
 *   no-op — chrome buttons (Support, Alerts) emit their labels and are not
 *   actions yet, so there is nobody to answer.
 * - A KNOWN verb naming a row the dataset does not hold REFUSES out loud,
 *   through the same receipt→toast path every other refusal takes: the
 *   client pressed a control, and a control that does nothing and says
 *   nothing reads as a broken page.
 *
 * An absent dataset admits navigation and nothing else.
 */
export function dispatchMockAction(
  data: MockDataset | undefined,
  context: DataRouteContext,
  value: string
): MockActionResult | undefined {
  // First colon only — a reply's text payload may itself carry colons.
  const separator = value.indexOf(":");
  const verb = separator === -1 ? value : value.slice(0, separator);
  const id = separator === -1 ? undefined : value.slice(separator + 1);

  // Pure navigation reads no data, so it runs before the dataset gate: a shape
  // with no seed (Strata) still follows the links its config authored.
  if (verb === MOCK_ACTION.NAVIGATE) {
    if (id === undefined) return undefined;
    return { to: id };
  }
  // Dataset-free too: what a row copies is the value the row was GIVEN, and
  // the clipboard is the browser's, not the mock's.
  if (verb === MOCK_ACTION.COPY) {
    if (id === undefined) return undefined;
    void writeToClipboard(id);
    return {
      toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title: "Copied" }
    };
  }
  // Dataset-free too: printing is the BROWSER's, and the print view is
  // already on screen — this only opens the dialog the client asked for.
  if (verb === MOCK_ACTION.PRINT) {
    if (typeof window !== "undefined") window.print();
    return undefined;
  }
  // Dataset-free as well: how a listing is laid out is a preference of this
  // browser's, stored beside the theme and the shape.
  if (verb === MOCK_ACTION.SET_VIEW) {
    if (id === undefined) return undefined;
    useListViewPreference().setView(id);
    return undefined;
  }
  if (data === undefined) return undefined;

  switch (verb) {
    case MOCK_ACTION.OPEN_FORM: {
      // `open-form:<formId>` or `open-form:<formId>:<entityId>` — a form that
      // edits nothing carries no id.
      const addressed = splitAtFirstColon(id);
      const formId = addressed?.head ?? id;
      if (formId === undefined || !isFormId(formId)) return undefined;
      // Asked BEFORE the dialog is offered (plan R4): a door whose write would
      // refuse says so out loud, rather than mounting a form whose own submit
      // then rejects what was typed into it.
      const refused = whyFormRefuses(data, formId, addressed?.tail);
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      return { form: { id: formId, entityId: addressed?.tail } };
    }
    case MOCK_ACTION.PROFILE_SAVE: {
      // One profile per client, so the whole payload is the model.
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockPersonalDetails(data)
        .useActions()
        .saveProfile(model);
      return fromFormReceipt(receipt, () => ({
        toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title: "Profile saved" }
      }));
    }
    case MOCK_ACTION.CUSTOM_FIELDS_SAVE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockPersonalDetails(data)
        .useActions()
        .saveCustomFields(model);
      return fromFormReceipt(receipt, () => ({
        toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title: "Answers saved" }
      }));
    }
    case MOCK_ACTION.USERNAME_CHANGE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockPersonalDetails(data)
        .useActions()
        .changeUsername(model);
      return fromFormReceipt(receipt, persona =>
        contactSaved("Username changed", persona.username)
      );
    }
    case MOCK_ACTION.PASSWORD_CHANGE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockSecurity(data).useActions().changePassword(model);
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Password changed",
          description: "Use the new one next time you sign in."
        }
      }));
    }
    case MOCK_ACTION.TWOFA_ENABLE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockSecurity(data).useActions().enableTwoFactor(model);
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Two-factor authentication is on",
          description: "You will be asked for a code next time you sign in."
        }
      }));
    }
    case MOCK_ACTION.TWOFA_DISABLE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockSecurity(data)
        .useActions()
        .disableTwoFactor(model);
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Two-factor authentication is off"
        }
      }));
    }
    case MOCK_ACTION.IP_WHITELIST_CREATE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockIpWhitelist(data).useActions().create(model);
      return fromFormReceipt(receipt, entry =>
        contactSaved("IP address added", entry.ip_address)
      );
    }
    case MOCK_ACTION.IP_WHITELIST_SAVE: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const receipt = useMockIpWhitelist(data)
        .useActions()
        .update(submitted.head, model);
      return fromFormReceipt(receipt, entry =>
        contactSaved("IP address saved", entry.ip_address)
      );
    }
    case MOCK_ACTION.BILLING_SETTINGS_SAVE: {
      // One settings page per client, so the whole payload is the model.
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockBillingSettings(data).useActions().save(model);
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Billing settings saved"
        }
      }));
    }
    case MOCK_ACTION.WALLET_TOPUP: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const amount = submittedNumber(model, "amount");
      if (amount === undefined) return undefined;
      const receipt = useMockWallet(data)
        .useActions()
        .topUp(
          submittedText(model, "currency"),
          amount,
          submittedText(model, "paymentDetailId")
        );
      return fromFormReceipt(receipt, movement => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `${movement.amount.formatted} added`,
          description: `Your balance is now ${movement.balanceAfter.formatted}.`
        }
      }));
    }
    case MOCK_ACTION.PRODUCT_CONSOLIDATION_SAVE: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const chosen = submittedNumber(model, "invoiceConsolidation");
      if (chosen === undefined) return undefined;
      const receipt = useMockContractProduct(data, submitted.head)
        .useActions()
        .setConsolidation(chosen);
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Invoice consolidation saved"
        }
      }));
    }
    case MOCK_ACTION.PRODUCT_LABEL_SAVE: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const receipt = useMockContractProduct(data, submitted.head)
        .useActions()
        .setLabel(submittedText(model, "label"));
      return fromFormReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Label saved",
          description: product.customLabel ?? product.name
        }
      }));
    }
    case MOCK_ACTION.PRODUCT_CANCEL_REQUEST: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const receipt = useMockContractProduct(data, submitted.head)
        .useActions()
        .requestCancellation(model);
      return fromFormReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Cancellation requested",
          description: cancellationSummary(product)
        }
      }));
    }
    case MOCK_ACTION.TICKET_CREATE: {
      // One thread per submit, so the whole payload is the model.
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockTickets(data).useActions().create(model);
      return fromFormReceipt(receipt, ticket => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `Ticket ${ticket.reference} opened`,
          description: "We reply here and by email."
        },
        to: `/support/tickets/${ticket.id}`
      }));
    }
    case MOCK_ACTION.TICKET_SUBJECT_SAVE: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const receipt = useMockTicket(data, submitted.head)
        .useActions()
        .setSubject(submittedText(model, "subject"));
      return fromFormReceipt(receipt, ticket => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Subject changed",
          description: ticket.subject
        }
      }));
    }
    case MOCK_ACTION.PARENT_BRANDING_SAVE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockAccount(data)
        .useActions()
        .saveParentBranding(model);
      return fromFormReceipt(receipt, branding => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Brand appearance saved",
          description: `The accounts you manage now see ${branding.name}.`
        }
      }));
    }
    case MOCK_ACTION.TICKET_MESSAGE_EDIT: {
      // `<messageId>:<json>` — the thread is the route's, as the composer's
      // own reply is: the dialog stands over the thread being read.
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (
        submitted === undefined ||
        model === undefined ||
        context.entityId === undefined
      ) {
        return undefined;
      }
      const receipt = useMockTicket(data, context.entityId)
        .useActions()
        .editMessage(submitted.head, { body: submittedText(model, "body") });
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Message updated"
        }
      }));
    }
    case MOCK_ACTION.TICKET_SET_PRODUCT: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const receipt = useMockTicket(data, submitted.head)
        .useActions()
        .setRelatedProduct(submittedText(model, "productId"));
      return fromFormReceipt(receipt, ticket => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Related product set",
          description: find(data.products, { id: ticket.productId })?.name
        }
      }));
    }
    case MOCK_ACTION.DELEGATE_INVITE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockDelegates(data).useActions().invite(model);
      return fromFormReceipt(receipt, delegate => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Invitation sent",
          description: `${delegate.email} can accept it from their own account.`
        }
      }));
    }
    case MOCK_ACTION.VAULT_NOTE_CREATE:
    case MOCK_ACTION.VAULT_SECRET_CREATE: {
      const isSecret = verb === MOCK_ACTION.VAULT_SECRET_CREATE;
      const submitted = parseVaultCreate(id, isSecret);
      if (submitted === undefined) return undefined;
      const receipt = useMockVault(data)
        .useActions()
        .create(submitted.model, submitted.scope);
      return fromFormReceipt(receipt, asset =>
        vaultSaved(secretOrNote(isSecret, "added"), asset.label)
      );
    }
    case MOCK_ACTION.VAULT_NOTE_UPDATE:
    case MOCK_ACTION.VAULT_SECRET_UPDATE: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const isSecret = verb === MOCK_ACTION.VAULT_SECRET_UPDATE;
      // The verb names the side of the note/secret axis the form was opened
      // on, and the row carries its own: a secret submitted through the note
      // verb names a row that verb does not edit, which is not-found.
      const held = find(data.vault, { id: submitted.head });
      if (held !== undefined && held.encrypted !== isSecret) return notFound();
      const receipt = useMockVault(data)
        .useActions()
        .update(submitted.head, model);
      return fromFormReceipt(receipt, asset =>
        vaultSaved(secretOrNote(isSecret, "saved"), asset.label)
      );
    }
    case MOCK_ACTION.AFFILIATE_LINK_CREATE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockAffiliate(data).useActions().createLink(model);
      return fromFormReceipt(receipt, link => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Referral link created",
          description: link.url
        }
      }));
    }
    case MOCK_ACTION.AFFILIATE_LINK_UPDATE: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const receipt = useMockAffiliate(data)
        .useActions()
        .updateLink(submitted.head, model);
      return fromFormReceipt(receipt, link => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Referral link saved",
          description: link.url
        }
      }));
    }
    case MOCK_ACTION.AFFILIATE_WITHDRAWAL_REQUEST: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockAffiliate(data)
        .useActions()
        .requestWithdrawal(model);
      return fromFormReceipt(receipt, payout => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Withdrawal requested",
          description: `${payout.amount.formatted} is on its way to you.`
        }
      }));
    }
    case MOCK_ACTION.AFFILIATE_PAYOUT_DESTINATION_SAVE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockAffiliate(data)
        .useActions()
        .savePayoutDestination(model);
      return fromFormReceipt(receipt, affiliate => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Payout destination saved",
          description: affiliate.payoutDestination.detail
        }
      }));
    }
    case MOCK_ACTION.NOTIFICATION_PREFERENCES_SAVE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockNotifications(data)
        .useActions()
        .savePreferences(model);
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Notification preferences saved"
        }
      }));
    }

    /**
     * The same matrix, saved from the logged-out token page. The write is the
     * signed-in one: a link that reached here stands in for the session, and
     * the rows it moves are the same rows.
     */
    case MOCK_ACTION.PREFERENCES_SAVE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockNotifications(data)
        .useActions()
        .savePreferences(model);
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Preferences saved",
          description: "We have updated what we send you."
        }
      }));
    }
    // `email-opt-ins-save:<address>:<json>` — the address is the link's, not a
    // row key, so it rides the verb exactly as the vault's scope does.
    case MOCK_ACTION.EMAIL_OPT_INS_SAVE: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const receipt = useMockClientEmails(data)
        .useActions()
        .writes.saveTopicOptIns(submitted.head, model);
      return fromFormReceipt(receipt, entry => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Email preferences saved",
          description: entry.email ?? undefined
        }
      }));
    }
    case MOCK_ACTION.CONSOLIDATE_INVOICES: {
      // Asked BEFORE the dialog is offered (plan R4): a client with nothing
      // to gather is refused outright rather than behind a question.
      const refused = useMockInvoices(data).useActions().whyNotConsolidatable();
      if (refused?.reason !== undefined) return refusal(refused.reason);
      return {
        confirm: {
          title: "Bring these invoices together?",
          description: `${size(consolidatableInvoices(data))} unpaid invoices will be closed, and one document raised in their place.`,
          actionLabel: "Consolidate invoices",
          then: MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED
        }
      };
    }
    case MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED: {
      const receipt = useMockInvoices(data).useActions().consolidate();
      return fromReceipt(receipt, invoice => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `Invoice ${invoice.number} raised`,
          description: `${invoice.total.formatted} is now owed on one document.`
        },
        to: `/billing/invoices/${invoice.id}`
      }));
    }
    case MOCK_ACTION.OPEN_INSTRUCTIONS: {
      if (id === undefined) return undefined;
      const receipt = useMockInvoice(data, id).useActions().instructions();
      return fromReceipt(receipt, payment => ({
        prose: {
          title: "Complete your payment",
          markdown: payment.instructions ?? ""
        }
      }));
    }
    case MOCK_ACTION.SWITCH_ACCOUNT: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockAccount(data)
        .useActions()
        .switchAccount(submittedText(model, "accountId"));
      return fromFormReceipt(receipt, persona => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Account switched",
          description: activePersonaAccount(persona)?.name
        }
      }));
    }
    case MOCK_ACTION.AVATAR_SAVE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockAccount(data).useActions().saveAvatar(model);
      return fromFormReceipt(receipt, () => ({
        toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title: "Photo updated" }
      }));
    }

    // --- the logged-out screens (plan F11) -----------------------------------

    case MOCK_ACTION.COMPLETE_SETUP: {
      const productId = id ?? context.productId;
      if (productId === undefined) return undefined;
      const receipt = useMockContractProduct(data, productId)
        .useActions()
        .completeSetup();
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `${product.name} is now active`
        },
        to: `/${product.groupSlug}/${product.id}`
      }));
    }
    case MOCK_ACTION.VIEW_PRODUCT: {
      if (id === undefined) return undefined;
      const product = useMockContractProduct(data, id).useContext().data.value;
      if (product === undefined) return notFound();
      return { to: `/${product.groupSlug}/${product.id}` };
    }
    case MOCK_ACTION.INVOICE_SHARE_SAVE: {
      const submitted = splitAtFirstColon(id);
      const model = parseFormPayload(submitted?.tail);
      if (submitted === undefined || model === undefined) return undefined;
      const receipt = useMockInvoice(data, submitted.head)
        .useActions()
        .saveShare(model);
      return fromFormReceipt(receipt, invoice => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: invoice.isShared === true ? "Sharing on" : "Sharing off",
          description: `${invoice.number} — the link and its permissions are saved.`
        }
      }));
    }
    case MOCK_ACTION.INVOICE_SHARE_REGENERATE: {
      const invoiceId = id ?? context.entityId;
      if (invoiceId === undefined) return undefined;
      const invoice = useMockInvoice(data, invoiceId).useContext().data.value;
      if (invoice === undefined) return notFound();
      const refused = whyNotShareable(invoice);
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      return {
        confirm: {
          title: `Regenerate the link for ${invoice.number}?`,
          description:
            "The link already handed out stops working straight away.",
          actionLabel: "Regenerate link",
          destructive: true,
          then: mockActionValue(
            MOCK_ACTION.INVOICE_SHARE_REGENERATE_CONFIRMED,
            invoice.id
          )
        }
      };
    }
    case MOCK_ACTION.INVOICE_SHARE_REGENERATE_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockInvoice(data, id).useActions().regenerateShare();
      return fromReceipt(receipt, invoice => {
        void writeToClipboard(shareLinkFor(invoice.shareToken));
        return {
          toast: {
            intent: MOCK_TOAST_INTENT.SUCCESS,
            title: "New link copied",
            description: `The old link for ${invoice.number} no longer works.`
          }
        };
      });
    }
    case MOCK_ACTION.SHARE_INVOICE: {
      const invoiceId = id ?? context.entityId;
      if (invoiceId === undefined) return undefined;
      const receipt = useMockInvoice(data, invoiceId).useActions().share();
      return fromReceipt(receipt, invoice => {
        void writeToClipboard(shareLinkFor(invoice.shareToken));
        return {
          toast: {
            intent: MOCK_TOAST_INTENT.SUCCESS,
            title: "Share link copied",
            description: `Anyone with the link can view ${invoice.number}.`
          }
        };
      });
    }
    case MOCK_ACTION.DOWNLOAD: {
      // The mock cannot fabricate a PDF, so a download opens the document's
      // own print view (plan R11) — honest, and drivable.
      const asked = splitAtFirstColon(id);
      if (asked === undefined) return undefined;
      if (!isDocumentKind(asked.head)) return undefined;
      // A statement is the one kind whose print view is built from a period
      // rather than from a document, so a period the ledger never filed has
      // nothing to print and says so.
      const isUnfiled =
        asked.head === MOCK_DOCUMENT_KIND.CREDIT_STATEMENT &&
        creditStatement(data, asked.tail) === undefined;
      if (isUnfiled) return notFound();
      return { to: `${PRINT_PATH[asked.head]}/${asked.tail}/print` };
    }
    case MOCK_ACTION.CREDIT_STATEMENT_CSV: {
      if (id === undefined) return undefined;
      const receipt = useMockWallet(data).useActions().statementFile(id);
      // The file is INLINE (a data URI), so it leaves as a link the runner
      // opens rather than a route — there is nothing in the portal to route to.
      return fromReceipt(receipt, file => ({ href: file.href }));
    }
    case MOCK_ACTION.REPLY_TICKET: {
      // The payload is the composer's own MODEL — the message and the files
      // named on it (plan F9); the ticket is the route's entity.
      const model = parseFormPayload(id);
      if (model === undefined || context.entityId === undefined) {
        return undefined;
      }
      const receipt = useMockTicket(data, context.entityId)
        .useActions()
        .reply({
          body: submittedText(model, "body"),
          attachments: parseAttachmentNames(submittedText(model, "attachments"))
        });
      return fromReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Reply sent"
        }
      }));
    }
    case MOCK_ACTION.SUPPORT_PREFERENCES_SAVE: {
      const model = parseFormPayload(id);
      if (model === undefined) return undefined;
      const receipt = useMockPersonalDetails(data)
        .useActions()
        .saveSupportPreferences({
          submitWithShortcut: model["submitWithShortcut"] === true,
          newLineKey: submittedNewLineKey(data, model)
        });
      return fromFormReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Post options saved"
        }
      }));
    }
    case MOCK_ACTION.TICKET_REOPEN: {
      const ticketId = id ?? context.entityId;
      if (ticketId === undefined) return undefined;
      const receipt = useMockTicket(data, ticketId).useActions().reopen();
      return fromReceipt(receipt, ticket => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Ticket reopened",
          description: `${ticket.subject} is back with the team.`
        }
      }));
    }
    case MOCK_ACTION.TICKET_CLOSE: {
      const ticketId = id ?? context.entityId;
      if (ticketId === undefined) return undefined;
      const managed = useMockTicket(data, ticketId);
      const ticket = managed.useContext().data.value;
      if (ticket === undefined) return notFound();
      // A thread that cannot be closed is refused here, not behind a dialog
      // whose own accept would then refuse.
      const refused = managed.useActions().whyNotClosable();
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      return {
        confirm: {
          title: "Close this ticket?",
          description: `${ticket.subject} will be marked as resolved. You can reopen it later.`,
          actionLabel: "Close ticket",
          destructive: true,
          then: mockActionValue(MOCK_ACTION.TICKET_CLOSE_CONFIRMED, ticketId)
        }
      };
    }
    case MOCK_ACTION.TICKET_CLOSE_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockTicket(data, id).useActions().close();
      return fromReceipt(receipt, ticket => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Ticket closed",
          description: ticket.subject
        }
      }));
    }
    case MOCK_ACTION.TICKET_REMOVE_PRODUCT: {
      const ticketId = id ?? context.entityId;
      if (ticketId === undefined) return undefined;
      const managed = useMockTicket(data, ticketId);
      const refused = managed.useActions().whyNotDetachable();
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      const receipt = managed.useActions().removeRelatedProduct();
      return fromReceipt(receipt, ticket => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Product removed from this ticket",
          description: ticket.subject
        }
      }));
    }
    case MOCK_ACTION.TICKET_DELEGATE: {
      const payload = splitAtFirstColon(id);
      if (payload === undefined) return undefined;
      const managed = useMockTicket(data, payload.head);
      const ticket = managed.useContext().data.value;
      const grantee = useMockDelegate(data, payload.tail).useContext().data
        .value;
      if (ticket === undefined || grantee === undefined) return notFound();
      const refused = managed.useActions().whyNotDelegatable();
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      return {
        confirm: {
          title: `Give ${grantee.name} access to this ticket?`,
          description: `${grantee.name} will be able to read and reply to ${ticket.subject}.`,
          actionLabel: "Give access",
          then: mockActionValue(
            MOCK_ACTION.TICKET_DELEGATE_CONFIRMED,
            `${payload.head}:${payload.tail}`
          )
        }
      };
    }
    case MOCK_ACTION.TICKET_MESSAGE_DELETE: {
      // The thread is the route's, as the composer's own reply is: the menu
      // that raised this stands on the thread being read.
      if (id === undefined || context.entityId === undefined) return undefined;
      const managed = useMockTicket(data, context.entityId);
      // Asked BEFORE the confirmation is offered (plan R4): a message that
      // cannot be withdrawn is refused here, not behind a dialog whose own
      // accept would then refuse.
      const refused = managed.useActions().whyNotDeletable(id);
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      return {
        confirm: {
          title: "Delete this message?",
          description:
            "The thread will show that you deleted it, and what it said stays readable.",
          actionLabel: "Delete message",
          destructive: true,
          then: mockActionValue(MOCK_ACTION.TICKET_MESSAGE_DELETE_CONFIRMED, id)
        }
      };
    }
    case MOCK_ACTION.TICKET_MESSAGE_DELETE_CONFIRMED: {
      if (id === undefined || context.entityId === undefined) return undefined;
      const receipt = useMockTicket(data, context.entityId)
        .useActions()
        .deleteMessage(id);
      return fromReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Message deleted"
        }
      }));
    }
    case MOCK_ACTION.TICKET_MESSAGE_VIEW_DELETED: {
      // Legacy's `openDeletedMessageModal`, which its notice offered to every
      // actor — the link sits outside the `isAdmin` branch above it.
      if (id === undefined || context.entityId === undefined) return undefined;
      const written = find(
        useMockTicket(data, context.entityId).useContext().data.value?.messages,
        { id }
      );
      if (written === undefined) return notFound();
      return {
        prose: {
          title: "Deleted message",
          markdown: written.body
        }
      };
    }
    case MOCK_ACTION.TICKET_ATTACHMENT_DELETE: {
      const asked = splitAtFirstColon(id);
      if (asked === undefined || context.entityId === undefined) {
        return undefined;
      }
      const managed = useMockTicket(data, context.entityId);
      const refused = managed
        .useActions()
        .whyNotAttachmentRemovable(asked.head, asked.tail);
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      return {
        confirm: {
          title: `Remove ${asked.tail}?`,
          description: "It will no longer be listed on the message.",
          actionLabel: "Remove file",
          destructive: true,
          then: mockActionValue(
            MOCK_ACTION.TICKET_ATTACHMENT_DELETE_CONFIRMED,
            `${asked.head}:${asked.tail}`
          )
        }
      };
    }
    case MOCK_ACTION.TICKET_ATTACHMENT_DELETE_CONFIRMED: {
      const asked = splitAtFirstColon(id);
      if (asked === undefined || context.entityId === undefined) {
        return undefined;
      }
      const receipt = useMockTicket(data, context.entityId)
        .useActions()
        .deleteAttachment(asked.head, asked.tail);
      return fromReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "File removed",
          description: asked.tail
        }
      }));
    }
    case MOCK_ACTION.TICKET_DELEGATE_CONFIRMED: {
      const payload = splitAtFirstColon(id);
      if (payload === undefined) return undefined;
      const receipt = useMockTicket(data, payload.head)
        .useActions()
        .delegate(payload.tail);
      return fromReceipt(receipt, grantee => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Ticket shared",
          description: `${grantee.name} can now see this conversation.`
        }
      }));
    }
    case MOCK_ACTION.NOTIFICATION_TOPIC_SET: {
      const asked = splitAtFirstColon(id);
      if (asked === undefined) return undefined;
      const switched = asked.tail;
      if (!isTopicSwitch(switched)) return undefined;
      const receipt = useMockNotifications(data)
        .useActions()
        .setTopic(asked.head, switched === TOPIC_SWITCH.ON);
      return fromReceipt(receipt, row => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: row.label,
          description: TOPIC_SWITCH_MESSAGE[switched]
        }
      }));
    }
    case MOCK_ACTION.NOTIFICATION_READ_MORE: {
      // Legacy expanded the row in place; the portal has one prose dialog for
      // everything there is only to READ, and this is one of them.
      if (id === undefined) return undefined;
      const notification = find(data.notifications, { id });
      if (notification === undefined) return notFound();
      return {
        prose: { title: notification.title, markdown: notification.body }
      };
    }
    case MOCK_ACTION.MARK_NOTIFICATIONS_READ: {
      const receipt = useMockNotifications(data).useActions().markAllRead();
      return fromReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "All notifications marked as read"
        }
      }));
    }
    case MOCK_ACTION.PAGE_NEXT: {
      if (id === undefined) return undefined;
      resolvePagedCollection(id, data, context)?.useActions().nextPage();
      return undefined;
    }
    case MOCK_ACTION.PAGE_PREV: {
      if (id === undefined) return undefined;
      resolvePagedCollection(id, data, context)?.useActions().prevPage();
      return undefined;
    }
    case MOCK_ACTION.COLLECTION_SEARCH: {
      const payload = splitAtFirstColon(id);
      if (payload === undefined) return undefined;
      resolvePagedCollection(payload.head, data, context)
        ?.useActions()
        .search(payload.tail);
      return undefined;
    }
    case MOCK_ACTION.COLLECTION_SORT: {
      const payload = splitAtFirstColon(id);
      if (payload === undefined) return undefined;
      // An empty tail reaches `applySort` as "", which it already reads as
      // "restore seed order" — no separate clear verb.
      resolvePagedCollection(payload.head, data, context)
        ?.useActions()
        .applySort(payload.tail);
      return undefined;
    }
    case MOCK_ACTION.COLLECTION_FILTER: {
      const payload = splitAtFirstColon(id);
      if (payload === undefined) return undefined;
      // The tail is `<key>:<value>`; the value keeps any further colons (a
      // date range carries none, but the grammar is the reply's).
      const filterPayload = splitAtFirstColon(payload.tail);
      if (filterPayload === undefined) return undefined;
      resolvePagedCollection(payload.head, data, context)
        ?.useActions()
        .applyNamedFilter(filterPayload.head, filterPayload.tail);
      return undefined;
    }
    case MOCK_ACTION.SET_PAGE_SIZE: {
      const payload = splitAtFirstColon(id);
      if (payload === undefined) return undefined;
      const size = Number(payload.tail);
      if (!Number.isFinite(size)) return undefined;
      resolvePagedCollection(payload.head, data, context)
        ?.useActions()
        .setLimit(size);
      return undefined;
    }
    case MOCK_ACTION.LOGIN_AS_CHILD: {
      if (id === undefined) return undefined;
      const receipt = useMockRelation(data, id).useActions().loginAs();
      return fromReceipt(receipt, child => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `Viewing ${child.name}`,
          description: "Everything below is that account's."
        },
        to: "/"
      }));
    }
    case MOCK_ACTION.END_IMPERSONATION: {
      // The ribbon names no relation, so the facade is resolved bare: the
      // persona to restore is held by the ribbon itself, not by a row.
      const receipt = useMockRelation(data).useActions().endImpersonation();
      return fromReceipt(receipt, parent => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `Back as ${parent.name}`
        },
        to: "/account/child-accounts"
      }));
    }
    case MOCK_ACTION.RUN_PROVISION_FUNCTION: {
      // `<productId>:<code>` — the product is named rather than taken from the
      // route, so the dashboard's own function buttons reach it too.
      const asked = splitAtFirstColon(id);
      if (asked === undefined) return undefined;
      const receipt = useMockProvisioning(data, asked.head)
        .useActions()
        .run(asked.tail);
      return fromReceipt(receipt, ran => {
        // A redirect LEAVES the portal, so it is a link the runner opens, not
        // a route; every other outcome is answered where the client stands.
        if (
          ran.kind === ProvisionRequestActionTypes.REDIRECT &&
          ran.url !== undefined
        ) {
          return { href: ran.url };
        }
        return {
          toast: {
            intent: MOCK_TOAST_INTENT.SUCCESS,
            title: PROVISION_RESULT_TITLE[ran.kind],
            description: ran.label
          }
        };
      });
    }
    case MOCK_ACTION.VAULT_REMOVE: {
      // Destructive, so the client confirms first (plan R4); the accepted
      // dialog re-dispatches the verb below through this same door.
      if (id === undefined) return undefined;
      const asset = find(useMockVault(data).useContext().data.value, {
        id
      });
      if (asset === undefined) return notFound();
      return {
        confirm: {
          title: `Delete "${asset.label}"?`,
          description: "This cannot be undone.",
          actionLabel: "Delete",
          destructive: true,
          then: mockActionValue(MOCK_ACTION.VAULT_REMOVE_CONFIRMED, id)
        }
      };
    }
    case MOCK_ACTION.VAULT_REMOVE_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockVault(data).useActions().remove(id);
      return fromReceipt(receipt, asset => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Deleted",
          description: asset.label
        }
      }));
    }
    case MOCK_ACTION.VAULT_PIN: {
      if (id === undefined) return undefined;
      const receipt = useMockVault(data).useActions().setPinned(id);
      return fromReceipt(receipt, asset => {
        let title = "Unpinned";
        if (asset.pinned === true) title = "Pinned to the top";
        return {
          toast: {
            intent: MOCK_TOAST_INTENT.SUCCESS,
            title,
            description: asset.label
          }
        };
      });
    }
    case MOCK_ACTION.VAULT_CONVERT: {
      if (id === undefined) return undefined;
      const receipt = useMockVault(data).useActions().convert(id);
      return fromReceipt(receipt, asset => {
        let title = "Converted to a note";
        if (asset.encrypted) title = "Converted to a secret";
        return {
          toast: {
            intent: MOCK_TOAST_INTENT.SUCCESS,
            title,
            description: asset.label
          }
        };
      });
    }
    case MOCK_ACTION.END_TRIAL: {
      const productId = id ?? context.productId;
      if (productId === undefined) return undefined;
      const managed = useMockContractProduct(data, productId);
      const product = managed.useContext().data.value;
      if (product === undefined) return notFound();
      const refused = managed.useActions().whyNotEndTrial();
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      return {
        confirm: {
          title: "End the free trial now?",
          // Legacy asked a different question per trial-end action
          // (`cProdProvider.vue:689-701`).
          description: trialEndConfirmation(product),
          actionLabel: "End trial",
          destructive: true,
          then: mockActionValue(MOCK_ACTION.END_TRIAL_CONFIRMED, productId)
        }
      };
    }
    case MOCK_ACTION.END_TRIAL_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockContractProduct(data, id).useActions().endTrial();
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Free trial ended",
          description: `${product.name} bills from today.`
        }
      }));
    }
    case MOCK_ACTION.INIT_PAY: {
      // The same door the document's own Pay opens, so a deep link and a
      // press ask the same question of the same guards.
      const invoiceId = id ?? context.entityId;
      if (invoiceId === undefined) return undefined;
      const invoice = useMockInvoice(data, invoiceId).useContext().data.value;
      if (invoice === undefined) return notFound();
      // Legacy opened nothing for a document that could not be paid — the
      // link is a shortcut past a control, never a way round its guard. The
      // param is dropped either way (composables/useInitAction.ts), so the
      // door does not reopen on the next visit.
      if (!isInvoicePayable(invoice)) return undefined;
      const card = invoicePaymentMethod(data, invoice);
      return dispatchMockAction(
        data,
        context,
        mockActionValue(MOCK_ACTION.PAY_INVOICE, payInvoiceTail(invoice, card))
      );
    }
    case MOCK_ACTION.INIT_UPGRADE: {
      // The same door the product page's own Change plan opens.
      const productId = id ?? context.productId ?? context.entityId;
      if (productId === undefined) return undefined;
      return dispatchMockAction(
        data,
        context,
        mockActionValue(MOCK_ACTION.MIGRATE_PRODUCT, productId)
      );
    }
    case MOCK_ACTION.MIGRATE_PRODUCT: {
      // Two payloads, one verb: a product ALONE is the control beside the
      // picker; a product and a target is one picker row, which asks first.
      const chosen = splitAtFirstColon(id);
      const productId = chosen?.head ?? id ?? context.productId;
      if (productId === undefined) return undefined;
      const managed = useMockContractProduct(data, productId);
      const product = managed.useContext().data.value;
      if (product === undefined) return notFound();
      const refused = managed.useActions().whyNotMigratable();
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      if (chosen === undefined) {
        return {
          toast: {
            intent: MOCK_TOAST_INTENT.INFO,
            title: "Choose what to change to",
            description: "The products you can move onto are listed below."
          }
        };
      }
      const target = find(product.migrationOptions, { id: chosen.tail });
      if (target === undefined) return notFound();
      return {
        confirm: {
          title: `Finalise product change: ${product.name} → ${target.name}, ${target.price.formatted}/${target.billingTerm}?`,
          description:
            "The change is applied straight away and invoiced pro rata.",
          actionLabel: "Change product",
          destructive: true,
          then: mockActionValue(
            MOCK_ACTION.MIGRATE_PRODUCT_CONFIRMED,
            `${productId}:${chosen.tail}`
          )
        }
      };
    }
    case MOCK_ACTION.MIGRATION_REVIEW: {
      // `<productId>:<optionId>` — the option's prose is the PRODUCT's own,
      // so the product is named rather than searched for.
      const asked = splitAtFirstColon(id);
      if (asked === undefined) return undefined;
      const product = useMockContractProduct(data, asked.head).useContext().data
        .value;
      if (product === undefined) return notFound();
      const option = find(product.migrationOptions, { id: asked.tail });
      if (option === undefined) return notFound();
      return {
        prose: { title: option.name, markdown: option.description }
      };
    }
    case MOCK_ACTION.MIGRATE_PRODUCT_CONFIRMED: {
      const chosen = splitAtFirstColon(id);
      if (chosen === undefined) return undefined;
      const receipt = useMockContractProduct(data, chosen.head)
        .useActions()
        .migrate(chosen.tail);
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `Changed to ${product.name}`,
          description: "A pro-rata invoice for the change is on its way."
        }
      }));
    }
    case MOCK_ACTION.ABORT_CANCELLATION: {
      const productId = id ?? context.productId;
      if (productId === undefined) return undefined;
      const product = useMockContractProduct(data, productId).useContext().data
        .value;
      if (product === undefined) return notFound();
      // A product with nothing lodged never renders the control, so pressing
      // it is not a client's answerable mistake — it stays the quiet no-op.
      if (product.cancellationRequest === undefined) return undefined;
      return {
        confirm: {
          title: "Call off this cancellation?",
          description: `${product.name} keeps running and renewing as it did before.`,
          actionLabel: "Don't cancel",
          then: mockActionValue(
            MOCK_ACTION.ABORT_CANCELLATION_CONFIRMED,
            productId
          )
        }
      };
    }
    case MOCK_ACTION.ABORT_CANCELLATION_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockContractProduct(data, id)
        .useActions()
        .abortCancellation();
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Cancellation called off",
          description: `${product.name} is running as before.`
        }
      }));
    }
    case MOCK_ACTION.DISABLE_AUTO_EXPIRE: {
      const productId = id ?? context.productId;
      if (productId === undefined) return undefined;
      const product = useMockContractProduct(data, productId).useContext().data
        .value;
      if (product === undefined) return notFound();
      if (product.autoExpireAt === undefined) return undefined;
      return {
        confirm: {
          title: "Keep this product running?",
          description: `${product.name} is set to cancel on ${product.autoExpireAt}. Calling that off puts it back on automatic renewal.`,
          actionLabel: "Don't cancel",
          then: mockActionValue(
            MOCK_ACTION.DISABLE_AUTO_EXPIRE_CONFIRMED,
            productId
          )
        }
      };
    }
    case MOCK_ACTION.DISABLE_AUTO_EXPIRE_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockContractProduct(data, id)
        .useActions()
        .disableAutoExpire();
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "This product will renew",
          description: `${product.name} is no longer set to cancel.`
        }
      }));
    }
    case MOCK_ACTION.TOGGLE_AUTO_RENEW: {
      const productId = id ?? context.productId;
      if (productId === undefined) return undefined;
      const managed = useMockContractProduct(data, productId);
      const product = managed.useContext().data.value;
      if (product === undefined) return notFound();
      // The switch reports a CHANGE, not a target: the product's own state
      // says which way, so the row never carries a copy of it. Turning it ON
      // costs nothing, so only turning it OFF asks.
      if (!product.autoRenew) {
        const receipt = managed.useActions().setAutoRenew(true);
        return fromReceipt(receipt, changed => ({
          toast: {
            intent: MOCK_TOAST_INTENT.SUCCESS,
            title: "Automatic renewal turned on",
            description: changed.name
          }
        }));
      }
      const refused = managed.useActions().whyNotAutoRenewOff();
      if (refused !== undefined) return fromReceipt(refused, () => ({}));
      return {
        confirm: {
          title: "Turn off auto renew?",
          description: `${product.name} will end at the end of its term unless you renew it yourself.`,
          actionLabel: "Turn off",
          destructive: true,
          then: mockActionValue(
            MOCK_ACTION.TOGGLE_AUTO_RENEW_CONFIRMED,
            productId
          )
        }
      };
    }
    case MOCK_ACTION.TOGGLE_AUTO_RENEW_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockContractProduct(data, id)
        .useActions()
        .setAutoRenew(false);
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Automatic renewal turned off",
          description: product.name
        }
      }));
    }
    case MOCK_ACTION.CREATE_RENEWAL_INVOICE: {
      const productId = id ?? context.productId;
      if (productId === undefined) return undefined;
      const receipt = useMockContractProduct(data, productId)
        .useActions()
        .createRenewalInvoice();
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Renewal invoice raised",
          description: `${product.name} — it is waiting in your invoices.`
        }
      }));
    }
    case MOCK_ACTION.SET_PRODUCT_BILLING_COMPANY: {
      const chosen = splitAtFirstColon(id);
      if (chosen === undefined) return undefined;
      const company = find(data.companies, { id: chosen.tail });
      const receipt = useMockContractProduct(data, chosen.head)
        .useActions()
        .setBillingCompany(chosen.tail);
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Billing company changed",
          description: `${product.name} is invoiced as ${company?.name}.`
        }
      }));
    }
    case MOCK_ACTION.SET_PRODUCT_BILLING_ADDRESS: {
      const chosen = splitAtFirstColon(id);
      if (chosen === undefined) return undefined;
      const address = find(data.addresses, { id: chosen.tail });
      const receipt = useMockContractProduct(data, chosen.head)
        .useActions()
        .setBillingAddress(chosen.tail);
      return fromReceipt(receipt, product => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Billing address changed",
          description: `${product.name} is invoiced to ${address?.name}.`
        }
      }));
    }
    case MOCK_ACTION.DELEGATE_TOGGLE_OBJECT: {
      const asked = splitAtFirstColon(id);
      const grant = splitAtFirstColon(asked?.tail);
      if (asked === undefined || grant === undefined) return undefined;
      const objectType = grant.head;
      const objectId = grant.tail;
      if (!isDelegateObjectType(objectType)) return undefined;
      const receipt = useMockDelegate(data, asked.head)
        .useActions()
        .toggleObject(objectType, objectId);
      return fromReceipt(receipt, delegate => {
        const granted = hasDelegateObject(delegate, objectType, objectId);
        let title = `Access revoked for ${delegate.name}`;
        if (granted) title = `Access granted to ${delegate.name}`;
        return { toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title } };
      });
    }
    case MOCK_ACTION.DELEGATE_REMOVE: {
      // Destructive: the delegate is resolved FIRST so the dialog can name
      // whose access is about to go.
      if (id === undefined) return undefined;
      const delegate = useMockDelegate(data, id).useContext().data.value;
      if (delegate === undefined) return notFound();
      return {
        confirm: {
          title: `Remove ${delegate.name}?`,
          description: `${delegate.name} loses access to your account straight away.`,
          actionLabel: "Remove",
          destructive: true,
          then: mockActionValue(
            MOCK_ACTION.DELEGATE_REMOVE_CONFIRMED,
            delegate.id
          )
        }
      };
    }
    case MOCK_ACTION.DELEGATE_REMOVE_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockDelegate(data, id).useActions().remove();
      return fromReceipt(receipt, delegate => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Delegate removed",
          description: delegate.name
        },
        // The page this was pressed on may be the delegate's own, which no
        // longer resolves; the listing always does.
        to: "/account/delegates"
      }));
    }
    case MOCK_ACTION.DELEGATE_SET_ACCESS: {
      const asked = splitAtFirstColon(id);
      if (asked === undefined) return undefined;
      const accessType = asked.tail;
      if (!isDelegateAccessType(accessType)) return undefined;
      const receipt = useMockDelegate(data, asked.head)
        .useActions()
        .setAccessType(accessType);
      return fromReceipt(receipt, delegate => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `${delegate.name} now has ${ACCESS_TYPE_MESSAGE[accessType]}`
        }
      }));
    }
    case MOCK_ACTION.RELATION_DETACH: {
      if (id === undefined) return undefined;
      const child = useMockRelation(data, id).useContext().data.value;
      if (child === undefined) return notFound();
      return {
        confirm: {
          title: `Detach ${child.name}?`,
          description: `${child.name} keeps its own account, but you stop managing it.`,
          actionLabel: "Detach",
          destructive: true,
          then: mockActionValue(MOCK_ACTION.RELATION_DETACH_CONFIRMED, child.id)
        }
      };
    }
    case MOCK_ACTION.RELATION_DETACH_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockRelation(data, id).useActions().detach();
      return fromReceipt(receipt, child => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "Account detached",
          description: child.name
        },
        to: "/account/child-accounts"
      }));
    }
    case MOCK_ACTION.RELATION_TOGGLE: {
      const asked = splitAtFirstColon(id);
      if (asked === undefined) return undefined;
      const switchKey = asked.tail;
      if (!isRelationToggleKey(switchKey)) return undefined;
      const receipt = useMockRelation(data, asked.head)
        .useActions()
        .toggle(switchKey);
      return fromReceipt(receipt, child => {
        const label = RELATION_TOGGLE_LABEL[switchKey];
        let title = `${label} off for ${child.name}`;
        if (child[switchKey]) title = `${label} on for ${child.name}`;
        return { toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title } };
      });
    }
    // Sending a client's own message again is legacy's STAFF control — both
    // entries sat behind `isAdmin` (`emailHistoryTable.vue:236,249`). The
    // verbs stay so a link kept from before answers, and what they answer is
    // that this is not the client's to do.
    case MOCK_ACTION.EMAIL_RESEND:
    case MOCK_ACTION.EMAIL_RETRY: {
      return refusal(MOCK_RECEIPT_REASON.NOT_PERMITTED);
    }
    case MOCK_ACTION.AFFILIATE_ENROL: {
      const receipt = useMockAffiliate(data).useActions().enrol();
      return fromReceipt(receipt, () => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "You have joined the affiliate programme",
          description: "Your referral links are ready to share."
        }
      }));
    }
    case MOCK_ACTION.AFFILIATE_LINK_REMOVE: {
      if (id === undefined) return undefined;
      const link = find(data.affiliate?.links ?? [], { id });
      if (link === undefined) return notFound();
      return {
        confirm: {
          title: `Delete ${link.name}?`,
          description:
            "Anyone following that link from now on will land on your brand's own page instead.",
          actionLabel: "Delete",
          destructive: true,
          then: mockActionValue(
            MOCK_ACTION.AFFILIATE_LINK_REMOVE_CONFIRMED,
            link.id
          )
        }
      };
    }
    case MOCK_ACTION.AFFILIATE_LINK_REMOVE_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockAffiliate(data).useActions().removeLink(id);
      return fromReceipt(receipt, link => removedToast(link.name));
    }
    case MOCK_ACTION.PIN_COPY_AND_HIDE: {
      // Legacy's own `copy_and_hide` (`supportPin.vue`): the number reaches
      // the clipboard FIRST, then goes back behind its mask — a client who
      // copies it has it, and the screen stops showing it.
      if (id === undefined) return undefined;
      const managed = useMockSupportPin(data);
      const persona = managed.useContext().data.value;
      if (persona.id !== id) return notFound();
      if (persona.supportPin === undefined) return notFound();
      void writeToClipboard(persona.supportPin);
      managed.useActions().hide();
      return {
        toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title: "PIN copied" }
      };
    }
    case MOCK_ACTION.PIN_REVEAL: {
      // The control reports a CHANGE, not a target: the panel's own state
      // says which way, so the button never carries a copy of it. The payload
      // names WHOSE PIN, and this session holds exactly one client's.
      if (id === undefined) return undefined;
      const pin = useMockSupportPin(data);
      const persona = pin.useContext().data.value;
      if (persona.id !== id) return notFound();
      const showing = isSupportPinRevealed(persona);
      if (showing) {
        pin.useActions().hide();
        return undefined;
      }
      pin.useActions().reveal();
      return undefined;
    }
    case MOCK_ACTION.PIN_REGENERATE: {
      if (id === undefined) return undefined;
      if (useMockSupportPin(data).useContext().data.value.id !== id) {
        return notFound();
      }
      // Destructive: the PIN a client has already read out stops working.
      return {
        confirm: {
          title: "Generate a new support PIN?",
          description:
            "The PIN you have now stops working straight away, and anyone you gave it to will need the new one.",
          actionLabel: "Generate new",
          destructive: true,
          then: MOCK_ACTION.PIN_REGENERATE_CONFIRMED
        }
      };
    }
    case MOCK_ACTION.PIN_REGENERATE_CONFIRMED: {
      const receipt = useMockSupportPin(data).useActions().regenerate();
      return fromReceipt(receipt, persona => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: "New support PIN generated",
          description: persona.supportPin
        }
      }));
    }
    case MOCK_ACTION.COMPANY_VALIDATE_TAX: {
      // Legacy offered this to STAFF alone (`billableCompanyEntity`'s own
      // `isAdmin` arm): the client's area never carried it. The verb stays so
      // an authored value from before this ruling still answers rather than
      // falling silent, and what it answers is the refusal.
      if (id === undefined) return undefined;
      return refusal(MOCK_RECEIPT_REASON.NOT_PERMITTED);
    }
    case MOCK_ACTION.IP_WHITELIST_REMOVE: {
      if (id === undefined) return undefined;
      const entry = find(useMockIpWhitelist(data).useContext().data.value, {
        id
      });
      if (entry === undefined) return notFound();
      return {
        confirm: {
          title: `Stop allowing ${entry.ip_address}?`,
          description:
            "Anyone signing in from that address will be turned away.",
          actionLabel: "Delete",
          destructive: true,
          then: mockActionValue(
            MOCK_ACTION.IP_WHITELIST_REMOVE_CONFIRMED,
            entry.id
          )
        }
      };
    }
    case MOCK_ACTION.IP_WHITELIST_REMOVE_CONFIRMED: {
      if (id === undefined) return undefined;
      const receipt = useMockIpWhitelist(data).useActions().remove(id);
      return fromReceipt(receipt, entry => removedToast(entry.ip_address));
    }
    case MOCK_ACTION.NOTIFICATION_DISMISS: {
      if (id === undefined) return undefined;
      const receipt = useMockNotifications(data).useActions().dismiss(id);
      // Legacy said nothing back — the row leaving IS the feedback.
      return fromReceipt(receipt, () => ({}));
    }
    case MOCK_ACTION.NOTIFICATION_FILTER: {
      if (!isNotificationFilter(id)) return undefined;
      notificationFeedCollection
        .resolve(data)
        .useActions()
        .applyNamedFilter(
          NOTIFICATION_FILTER_KEY,
          NOTIFICATION_FILTER_CRITERIA[id]
        );
      return undefined;
    }
    case MOCK_ACTION.NOTIFICATION_LOAD_MORE: {
      notificationFeedCollection.resolve(data).useActions().nextPage();
      return undefined;
    }
    case MOCK_ACTION.PLACE_ORDER: {
      if (id === undefined) return undefined;
      const item = find(useMockCatalogue(data).useContext().data.value, { id });
      if (item === undefined) return notFound();
      const receipt = useMockCatalogue(data).useActions().placeOrder(id);
      return fromReceipt(receipt, order => ({
        toast: {
          intent: MOCK_TOAST_INTENT.SUCCESS,
          title: `Order ${order.number} placed`,
          description: `${order.total.formatted} — your invoice is ready.`
        },
        // Legacy landed a finished order back on the listing it was placed
        // from, saying so: the query is what raises that band (plan Phase 3).
        to: `/${item.groupSlug}?orderComplete=${order.id}`
      }));
    }
    case MOCK_ACTION.CLIENT_VUE_STUB: {
      const named = splitAtFirstColon(id?.replace("|", ":"));
      if (named === undefined) return undefined;
      return {
        prose: {
          title: CLIENT_VUE_STUB_TITLE,
          markdown: clientVueProse(named.head, named.tail)
        }
      };
    }
    // client-vue's payment module pays; the door stays so `?init=pay` and the
    // document's Pay control still land somewhere.
    case MOCK_ACTION.PAY_INVOICE:
      return {
        prose: {
          title: CLIENT_VUE_STUB_TITLE,
          markdown: clientVueProse("PaymentDetails", "payment")
        }
      };
    default:
      return undefined;
  }
}
