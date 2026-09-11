// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/ids
 * @description Which forms the shell's ONE dialog can mount, as a leaf: the
 * dispatcher names an id and the registry builds it, and neither may import
 * the other's module for the vocabulary they share.
 */

export const FORM_ID = {
  /** Legacy's `clientProfileBasicConfigurationForm`, on the real module's own schema. */
  PROFILE: "profile",
  /** Legacy's `twoFactorAuthForm` — the code turns the second step on. */
  TWOFA_ENABLE: "twofa-enable",
  /** Turning it off asks nothing but the question itself. */
  TWOFA_DISABLE: "twofa-disable",
  /** Legacy's `ipWhitelistManageComp` add. */
  IP_WHITELIST_CREATE: "ip-whitelist-create",
  /** Legacy's own edit on a listed address (`ipWhitelistManageModal.vue:82-84`). */
  IP_WHITELIST_EDIT: "ip-whitelist-edit",
  /** Legacy's `invoiceShareModal` — the public link and what it permits. */
  INVOICE_SHARE: "invoice-share",
  /** Legacy's `topUpWalletModal` — a currency and how much to add to it. */
  WALLET_TOPUP: "wallet-topup",
  /** Legacy's `clientContractCancellationModal`, addressed to one product. */
  PRODUCT_CANCEL_REQUEST: "product-cancel-request",
  /**
   * The client's own reference for a product, as a dialog — legacy reached the
   * same form from the row's `Ref:` tag and its "Add label" control
   * (`cProdTags.vue:41-82`).
   */
  PRODUCT_LABEL: "product-label",
  /** Legacy's `changeTicketSubjectModal` — one field, the thread's own name. */
  TICKET_SUBJECT_SAVE: "ticket-subject-save",
  /**
   * Legacy's inline editor on a message the client wrote
   * (`ticketMessage.vue:12-34`), as a dialog — the addressed entity is
   * `<ticketId>:<messageId>`, because a message id is only unique inside its
   * own thread.
   */
  TICKET_MESSAGE_EDIT: "ticket-message-edit",
  /**
   * Legacy's `SelectContractProductsModal`, opened from a thread — one
   * form behind both its labels (`add_related_product` when the thread names
   * no product, `change_related_product` when it names one).
   */
  TICKET_SET_PRODUCT: "ticket-set-product",
  /** Legacy's `clientDelegateInviteModal`. */
  DELEGATE_INVITE: "delegate-invite",
  /**
   * Legacy's `vaultNoteForm` / `vaultSecretForm`, either way round. The
   * addressed entity is the PRODUCT on a create (absent = the account's own
   * panels) and the ROW on an edit, which carries its own scope already.
   */
  VAULT_NOTE_CREATE: "vault-note-create",
  VAULT_NOTE_UPDATE: "vault-note-update",
  VAULT_SECRET_CREATE: "vault-secret-create",
  VAULT_SECRET_UPDATE: "vault-secret-update",
  /** Legacy's `addEditAffiliateLinkModal`, either way round. */
  AFFILIATE_LINK_CREATE: "affiliate-link-create",
  AFFILIATE_LINK_UPDATE: "affiliate-link-update",
  /** Legacy's `commissionWithdrawRequestModal` — a message and nothing else. */
  AFFILIATE_WITHDRAWAL_REQUEST: "affiliate-withdrawal-request",
  /** Legacy's `tenancy/selectAccountModal` — which account this sign-in works on. */
  SWITCH_ACCOUNT: "switch-account",
  /** The account card's "Change photo" — one field, where the picture lives. */
  AVATAR_SAVE: "avatar-save",
  /** Legacy's `manageEmailTopicOptInsModal` — what ONE address receives. */
  EMAIL_TOPIC_OPT_INS: "email-topic-opt-ins",
  /**
   * Legacy's `supportPreferencesModal` — the composer's "Post options", whose
   * client half is the one question about the Enter key.
   */
  SUPPORT_PREFERENCES: "support-preferences",
  /**
   * Legacy's `parentBrandAppearanceForm` — the name, colour and font a parent
   * account lends to the accounts it manages.
   */
  PARENT_BRANDING: "parent-branding",
  /** The code the brand emails before a username or password change lands (legacy's sensitive-action chain). */
  SENSITIVE_CODE: "sensitive-code",
  /** Which unpaid invoices to close into one document. */
  CONSOLIDATE_INVOICES: "consolidate-invoices"
} as const;

export type FormId = (typeof FORM_ID)[keyof typeof FORM_ID];

export function isFormId(value: string): value is FormId {
  return Object.values<string>(FORM_ID).includes(value);
}
