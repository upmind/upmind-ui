// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/registry
 * @description Which form the shell's ONE dialog mounts (plan F2). A row
 * action answers with `MockActionResult.form = { id, entityId? }`; this maps
 * that id onto the schema, the uischema, the model and the submit verb the
 * `form` module is fed. The dialog itself owns no knowledge of any form.
 *
 * The schema and uischema are FUNCTIONS of the dataset and the addressed
 * entity, called with the REAL module's own parameter where one exists
 * (`ProfileContext`, `AddressContext`, `CompanyContext`), so the go-real swap
 * is one
import line and the form itself never changes (plan F3, F4).
 *
 * A CREATE opens on the schema module's own `defaults()`; an EDIT opens on the
 * row, and answers `undefined` when the dataset holds no such row — which the
 * dispatcher renders as the standing not-found refusal (plan F6).
 */

import { MOCK_ACTION, splitAtFirstColon } from "../actions";
import { ClientVaultContextTypes } from "../contracts";
import {
  useTwoFASchema,
  useTwoFAUischema,
  twoFactorDefaults
} from "../contracts/auth.schemas.twofa";
import {
  useBrandingSchema,
  useBrandingUischema,
  brandingDefaults
} from "../contracts/client-account.branding.schemas";
import {
  avatarDefaults,
  switchAccountDefaults,
  useAvatarSchema,
  useAvatarUischema,
  useSwitchAccountSchema,
  useSwitchAccountUischema
} from "../contracts/client-account.schemas";
import {
  useLinkSchema,
  useLinkUischema,
  linkDefaults,
  useWithdrawalSchema,
  useWithdrawalUischema,
  withdrawalDefaults
} from "../contracts/client-affiliate.schemas";
import {
  useCancellationSchema,
  useCancellationUischema,
  cancellationDefaults,
  labelDefaults,
  useLabelSchema,
  useLabelUischema
} from "../contracts/client-contract-product.schemas";
import {
  useSchema as useDelegateInviteSchema,
  useUischema as useDelegateInviteUischema,
  delegateInviteDefaults
} from "../contracts/client-delegates.schemas";
import {
  CONSOLIDATION_PICK_MIN,
  consolidationPickDefaults,
  useConsolidationPickSchema,
  useConsolidationPickUischema
} from "../contracts/client-invoices.consolidation.schemas";
import {
  invoiceShareDefaults,
  useSchema as useShareSchema,
  useUischema as useShareUischema
} from "../contracts/client-invoices.share.schemas";
import {
  useSchema as useIpWhitelistSchema,
  useUischema as useIpWhitelistUischema,
  ipWhitelistDefaults,
  ipWhitelistEditDefaults
} from "../contracts/client-ip-whitelist.schemas";
import {
  useSchema as usePersonalDetailsSchema,
  useUischema as usePersonalDetailsUischema
} from "../contracts/client-personal-details.schemas";
import {
  sensitiveDefaults,
  useSensitiveSchema,
  useSensitiveUischema
} from "../contracts/client-security.sensitive.schemas";
import {
  messageDefaults,
  relatedProductDefaults,
  supportPreferencesDefaults,
  useMessageSchema,
  useMessageUischema,
  useRelatedProductSchema,
  useRelatedProductUischema,
  useSubjectSchema,
  useSubjectUischema,
  useSupportPreferencesSchema,
  useSupportPreferencesUischema,
  subjectDefaults
} from "../contracts/client-tickets.schemas";
import {
  useNoteSchema,
  useNoteUischema,
  useSecretSchema,
  useSecretUischema,
  vaultDefaults
} from "../contracts/client-vault.schemas";
import {
  useSchema as useWalletTopUpSchema,
  useUischema as useWalletTopUpUischema,
  walletTopUpDefaults
} from "../contracts/client-wallet.schemas";
import {
  emailTopicOptInsDefaults,
  useEmailTopicOptInsSchema,
  useEmailTopicOptInsUischema
} from "../contracts/user-notifications.schemas";
import {
  hasAccountChoice,
  useMockAffiliate,
  useMockContractProduct,
  useMockInvoice,
  whyNotShareable,
  useMockTicket
} from "../facades";
import { useMockClientEmails } from "../facades/useMockContacts";
import { consolidatableInvoices } from "../facades/useMockInvoice";
import {
  affiliateLinkContext,
  delegateInviteContext,
  emailTopicOptInsContext,
  parentBrandingContext,
  switchAccountContext
} from "./account-contexts";
import { invoiceShareContext, walletTopUpContext } from "./billing-contexts";
import { FORM_ID } from "./ids";
import { cancellationFormContext } from "./product-contexts";
import { profileFormContext } from "./profile-context";
import {
  supportPreferencesContext,
  ticketMessageContext,
  ticketRelatedProductContext
} from "./support-contexts";
import {
  enrolmentDefaults,
  twoFactorEnrolment,
  useEnrolmentSchema,
  useEnrolmentUischema
} from "./twofa-enrolment";
import { assign, find, size } from "lodash-es";
import type { FormId } from "./ids";
import type { MockDataset, MockEmail, MockVaultAsset } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/** One registered form, resolved against the live dataset and the row it addresses. */
export type MockFormEntry = {
  /** The dialog's heading. */
  readonly title: string;
  /** The line under it, where the form needs one — a warning, or what it is for. */
  readonly description?: string;
  readonly schema: JsonSchema;
  readonly uischema?: UISchemaElement;
  readonly model: FormModel;
  /** The verb the submit emits, already carrying the entity id where there is one. */
  readonly submit: string;
  readonly submitLabel: string;
  readonly resetLabel: string;
  /** Controls beside submit and reset — each dispatches its own verb bare. */
  readonly extraActions?: readonly {
    readonly value: string;
    readonly label: string;
  }[];
};

type MockFormBuilder = (
  data: MockDataset,
  entityId: string | undefined
) => MockFormEntry | undefined;

/** The two labels every dialog form carries; only the verbs differ. */
const SAVE_LABEL = "Save";
const CANCEL_LABEL = "Cancel";

/**
 * A vault CREATE's submit verb, already carrying the scope the row lands in
 * (the grammar `mock/actions.ts` documents): the account's own panels name
 * `client`, a product's name `contract-product` and the product itself.
 */
function vaultCreateSubmit(action: string, productId?: string): string {
  if (productId === undefined) {
    return `${action}:${ClientVaultContextTypes.CLIENT}`;
  }
  return `${action}:${ClientVaultContextTypes.CONTRACT_PRODUCT}:${productId}`;
}

/**
 * Adding a note or a secret. The addressed entity is the PRODUCT the panel
 * stands on — absent is the account's own pair of panels — so one form id
 * serves both placements and the scope reaches the facade through the verb.
 */
function vaultCreateForm(
  data: MockDataset,
  productId: string | undefined,
  encrypted: boolean
): MockFormEntry | undefined {
  const named = productId !== undefined;
  if (named && find(data.products, { id: productId }) === undefined) {
    return undefined;
  }
  if (encrypted) {
    return {
      title: "Add a secret",
      description: "Kept masked until you ask to see it.",
      schema: useSecretSchema(),
      uischema: useSecretUischema(),
      model: vaultDefaults(),
      submit: vaultCreateSubmit(MOCK_ACTION.VAULT_SECRET_CREATE, productId),
      submitLabel: "Add secret",
      resetLabel: CANCEL_LABEL
    };
  }
  return {
    title: "Add a note",
    description: "Visible only to you and the people you delegate.",
    schema: useNoteSchema(),
    uischema: useNoteUischema(),
    model: vaultDefaults(),
    submit: vaultCreateSubmit(MOCK_ACTION.VAULT_NOTE_CREATE, productId),
    submitLabel: "Add note",
    resetLabel: CANCEL_LABEL
  };
}

/**
 * Editing one. The row carries its own scope and its own side of the
 * note/secret axis, so a form opened against the OTHER side names a row this
 * form does not edit — which is the standing not-found answer.
 */
function vaultUpdateForm(
  data: MockDataset,
  assetId: string | undefined,
  encrypted: boolean
): MockFormEntry | undefined {
  const asset: MockVaultAsset | undefined = find(data.vault, { id: assetId });
  if (asset === undefined || asset.encrypted !== encrypted) return undefined;
  const model = { label: asset.label, value: asset.note };
  if (encrypted) {
    return {
      title: "Edit secret",
      schema: useSecretSchema(),
      uischema: useSecretUischema(),
      model,
      submit: `${MOCK_ACTION.VAULT_SECRET_UPDATE}:${asset.id}`,
      submitLabel: SAVE_LABEL,
      resetLabel: CANCEL_LABEL
    };
  }
  return {
    title: "Edit note",
    schema: useNoteSchema(),
    uischema: useNoteUischema(),
    model,
    submit: `${MOCK_ACTION.VAULT_NOTE_UPDATE}:${asset.id}`,
    submitLabel: SAVE_LABEL,
    resetLabel: CANCEL_LABEL
  };
}

/** The address a form addressed by ROW id is about, where the dataset holds it. */
function addressableEmail(
  data: MockDataset,
  entityId: string | undefined
): MockEmail | undefined {
  if (entityId === undefined) return undefined;
  return useMockClientEmails(data).useContext().getOne(entityId, data.emails);
}

const FORM_BUILDER: Readonly<Record<FormId, MockFormBuilder>> = {
  [FORM_ID.PROFILE]: data => {
    const context = profileFormContext(data);
    return {
      title: "Personal details",
      schema: usePersonalDetailsSchema(context),
      uischema: usePersonalDetailsUischema(context),
      model: assign({}, context.model),
      submit: MOCK_ACTION.PROFILE_SAVE,
      submitLabel: "Save changes",
      resetLabel: CANCEL_LABEL
    };
  },

  // --- emails ----------------------------------------------------------------

  // Enrolling states the secret and the link an authenticator app takes it
  // from, above the code box (`configure2faModal.vue:14-20`).
  [FORM_ID.TWOFA_ENABLE]: data => {
    const enrolment = twoFactorEnrolment(data);
    return {
      title: "Turn on two-factor authentication",
      description:
        "Add the setup key to your authenticator app, then enter the six-digit code it shows.",
      schema: useEnrolmentSchema(),
      uischema: useEnrolmentUischema(),
      model: enrolmentDefaults(enrolment),
      submit: MOCK_ACTION.TWOFA_ENABLE,
      submitLabel: "Turn on",
      resetLabel: CANCEL_LABEL
    };
  },
  // Turning it off asks for the code too — legacy posted `auth_code` on the
  // DELETE as well as the POST (`configure2faModal.vue:112-124`), so the step
  // is only taken off by somebody holding the app that put it on.
  [FORM_ID.TWOFA_DISABLE]: () => ({
    title: "Turn off two-factor authentication",
    description:
      "Enter the six-digit code from your authenticator app to switch it off. Your account will be protected by its password alone from then on.",
    schema: useTwoFASchema(),
    uischema: useTwoFAUischema(),
    model: twoFactorDefaults(),
    submit: MOCK_ACTION.TWOFA_DISABLE,
    submitLabel: "Turn off",
    resetLabel: CANCEL_LABEL
  }),

  // --- account credit and cards ------------------------------------------------

  [FORM_ID.WALLET_TOPUP]: data => {
    const context = walletTopUpContext(data);
    return {
      title: "Top up your credit",
      description:
        "Credit is applied to your next invoice before anything is charged to your card.",
      schema: useWalletTopUpSchema(context),
      uischema: useWalletTopUpUischema(context),
      model: walletTopUpDefaults(context),
      submit: MOCK_ACTION.WALLET_TOPUP,
      submitLabel: "Add credit",
      resetLabel: CANCEL_LABEL
    };
  },
  [FORM_ID.CONSOLIDATE_INVOICES]: data => {
    const gathered = consolidatableInvoices(data);
    if (size(gathered) < CONSOLIDATION_PICK_MIN) return undefined;
    return {
      title: "Bring these invoices together",
      description:
        "Tick the unpaid invoices to close into one document. It falls due on your due day, or with the soonest of them.",
      schema: useConsolidationPickSchema(gathered),
      uischema: useConsolidationPickUischema(),
      model: consolidationPickDefaults(gathered),
      submit: MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED,
      submitLabel: "Consolidate invoices",
      resetLabel: CANCEL_LABEL
    };
  },
  [FORM_ID.SENSITIVE_CODE]: (data, entityId) => {
    if (entityId === undefined) return undefined;
    const asksCode = data.security.twoFactorEnabled;
    let description = "Type your current password to finish the change.";
    if (asksCode) {
      description =
        "Type your current password and the code from your authenticator to finish the change.";
    }
    return {
      title: "Confirm it is you",
      description,
      schema: useSensitiveSchema(asksCode),
      uischema: useSensitiveUischema(asksCode),
      model: sensitiveDefaults(asksCode),
      submit: `${MOCK_ACTION.SENSITIVE_CODE_CONFIRM}:${entityId}`,
      submitLabel: "Confirm",
      resetLabel: CANCEL_LABEL
    };
  },
  [FORM_ID.PRODUCT_LABEL]: (data, entityId) => {
    if (entityId === undefined) return undefined;
    const product = useMockContractProduct(data, entityId).useContext().data
      .value;
    if (product === undefined) return undefined;
    return {
      title: "Your reference",
      description: `What you call ${product.name} — only you see it.`,
      schema: useLabelSchema(),
      uischema: useLabelUischema(),
      model: labelDefaults(product.customLabel),
      submit: `${MOCK_ACTION.PRODUCT_LABEL_SAVE}:${product.id}`,
      submitLabel: "Save label",
      resetLabel: CANCEL_LABEL
    };
  },
  [FORM_ID.PRODUCT_CANCEL_REQUEST]: (data, entityId) => {
    if (entityId === undefined) return undefined;
    const product = useMockContractProduct(data, entityId).useContext().data
      .value;
    if (product === undefined) return undefined;
    const context = cancellationFormContext(data, product);
    return {
      title: "Cancellation options",
      description: `Tell us when ${product.name} should stop, and why.`,
      schema: useCancellationSchema(context),
      uischema: useCancellationUischema(context),
      model: cancellationDefaults(context),
      submit: `${MOCK_ACTION.PRODUCT_CANCEL_REQUEST}:${product.id}`,
      submitLabel: "Request cancellation",
      resetLabel: CANCEL_LABEL
    };
  },

  // Legacy's `parentBrandAppearanceForm`, as a dialog. An account lending no
  // appearance has none to edit.
  [FORM_ID.PARENT_BRANDING]: data => {
    const context = parentBrandingContext(data);
    if (context === undefined) return undefined;
    return {
      title: "Brand appearance",
      description: "What the accounts you manage see.",
      schema: useBrandingSchema(),
      uischema: useBrandingUischema(),
      model: brandingDefaults(context),
      submit: MOCK_ACTION.PARENT_BRANDING_SAVE,
      submitLabel: SAVE_LABEL,
      resetLabel: CANCEL_LABEL
    };
  },

  // --- support ------------------------------------------------------------------

  [FORM_ID.TICKET_SUBJECT_SAVE]: (data, entityId) => {
    if (entityId === undefined) return undefined;
    const thread = useMockTicket(data, entityId);
    const ticket = thread.useContext().data.value;
    if (ticket === undefined) return undefined;
    // The same guard the menu offers the control on and the write refuses by:
    // a thread that cannot be renamed opens no dialog to rename it.
    if (thread.useActions().whyNotRenamable() !== undefined) return undefined;
    return {
      title: "Edit subject",
      description: "What this thread is about, in one line.",
      schema: useSubjectSchema(),
      uischema: useSubjectUischema(),
      model: subjectDefaults(ticket.subject),
      submit: `${MOCK_ACTION.TICKET_SUBJECT_SAVE}:${ticket.id}`,
      submitLabel: SAVE_LABEL,
      resetLabel: CANCEL_LABEL
    };
  },

  // Legacy edited a message in place, in the thread; the portal asks for it in
  // the shell's one dialog, which is where every other single-field write on
  // this page already lives.
  [FORM_ID.TICKET_MESSAGE_EDIT]: (data, entityId) => {
    const addressed = splitAtFirstColon(entityId);
    if (addressed === undefined) return undefined;
    const thread = useMockTicket(data, addressed.head);
    const message = find(thread.useContext().data.value?.messages, {
      id: addressed.tail
    });
    if (message === undefined) return undefined;
    // The same guard the menu offers the control on and the write refuses by:
    // a message that cannot be rewritten opens no dialog to rewrite it.
    if (thread.useActions().whyNotEditable(addressed.tail) !== undefined) {
      return undefined;
    }
    return {
      title: "Edit message",
      description: "What you wrote, as everyone on the thread will read it.",
      schema: useMessageSchema(),
      uischema: useMessageUischema(),
      model: messageDefaults(ticketMessageContext(message)),
      submit: `${MOCK_ACTION.TICKET_MESSAGE_EDIT}:${message.id}`,
      submitLabel: SAVE_LABEL,
      resetLabel: CANCEL_LABEL
    };
  },

  // Legacy's product picker, opened from the thread. One form behind both of
  // its labels: which of them the CONTROL wears is the count of what the
  // thread already names, and the picker itself asked the same question
  // either way.
  [FORM_ID.TICKET_SET_PRODUCT]: (data, entityId) => {
    if (entityId === undefined) return undefined;
    const thread = useMockTicket(data, entityId);
    const ticket = thread.useContext().data.value;
    if (ticket === undefined) return undefined;
    // The same guard the menu offers the control on and the write refuses by.
    if (thread.useActions().whyNotProductSettable() !== undefined) {
      return undefined;
    }
    const context = ticketRelatedProductContext(data, ticket);
    // Nothing to point the thread at is not a form with an empty picker.
    if (size(context.products) === 0) return undefined;
    return {
      title: "Related product",
      description: `Which of your products ${ticket.subject} is about.`,
      schema: useRelatedProductSchema(context),
      uischema: useRelatedProductUischema(),
      model: relatedProductDefaults(context),
      submit: `${MOCK_ACTION.TICKET_SET_PRODUCT}:${ticket.id}`,
      submitLabel: SAVE_LABEL,
      resetLabel: CANCEL_LABEL
    };
  },

  // --- delegates ----------------------------------------------------------------

  [FORM_ID.DELEGATE_INVITE]: data => {
    const context = delegateInviteContext(data);
    return {
      title: "Invite a delegate",
      description: "They get an email inviting them to your account.",
      schema: useDelegateInviteSchema(context),
      uischema: useDelegateInviteUischema(context),
      model: delegateInviteDefaults(context),
      submit: MOCK_ACTION.DELEGATE_INVITE,
      submitLabel: "Send invitation",
      resetLabel: CANCEL_LABEL
    };
  },

  // --- notes and secrets ---------------------------------------------------------

  [FORM_ID.VAULT_NOTE_CREATE]: (data, entityId) =>
    vaultCreateForm(data, entityId, false),
  [FORM_ID.VAULT_SECRET_CREATE]: (data, entityId) =>
    vaultCreateForm(data, entityId, true),
  [FORM_ID.VAULT_NOTE_UPDATE]: (data, entityId) =>
    vaultUpdateForm(data, entityId, false),
  [FORM_ID.VAULT_SECRET_UPDATE]: (data, entityId) =>
    vaultUpdateForm(data, entityId, true),

  // --- affiliate ------------------------------------------------------------------

  [FORM_ID.AFFILIATE_LINK_CREATE]: data => ({
    title: "Create a referral link",
    description: "Share it however you like; it counts its own signups.",
    schema: useLinkSchema(affiliateLinkContext(data)),
    uischema: useLinkUischema(),
    model: linkDefaults(affiliateLinkContext(data)),
    submit: MOCK_ACTION.AFFILIATE_LINK_CREATE,
    submitLabel: "Create link",
    resetLabel: CANCEL_LABEL
  }),
  [FORM_ID.AFFILIATE_LINK_UPDATE]: (data, entityId) => {
    const link = find(data.affiliate?.links ?? [], { id: entityId });
    if (link === undefined) return undefined;
    return {
      title: "Edit referral link",
      schema: useLinkSchema(affiliateLinkContext(data)),
      uischema: useLinkUischema(),
      model: { redirectUrl: link.redirectUrl, name: link.name },
      submit: `${MOCK_ACTION.AFFILIATE_LINK_UPDATE}:${link.id}`,
      submitLabel: SAVE_LABEL,
      resetLabel: CANCEL_LABEL
    };
  },
  [FORM_ID.AFFILIATE_WITHDRAWAL_REQUEST]: data => {
    const balance =
      useMockAffiliate(data).useContext().data.value?.stats.availableBalance;
    if (balance === undefined) return undefined;
    return {
      title: "Request a withdrawal",
      description: `We will send you ${balance.formatted}.`,
      schema: useWithdrawalSchema(),
      uischema: useWithdrawalUischema(),
      model: withdrawalDefaults(),
      submit: MOCK_ACTION.AFFILIATE_WITHDRAWAL_REQUEST,
      submitLabel: "Request it",
      resetLabel: CANCEL_LABEL
    };
  },

  // --- the account itself ------------------------------------------------------

  [FORM_ID.SWITCH_ACCOUNT]: data => {
    // One account is not a choice — the menu offers no entry, and a hand-made
    // verb reaching here names nothing to switch to. Read before anything is
    // built: the guard is what decides there is a form at all.
    if (!hasAccountChoice(data.persona)) return undefined;
    const context = switchAccountContext(data);
    return {
      title: "Switch account",
      description: "Everything on screen belongs to the account you pick.",
      schema: useSwitchAccountSchema(context),
      uischema: useSwitchAccountUischema(),
      model: switchAccountDefaults(context),
      submit: MOCK_ACTION.SWITCH_ACCOUNT,
      submitLabel: "Switch",
      resetLabel: CANCEL_LABEL
    };
  },
  [FORM_ID.AVATAR_SAVE]: data => ({
    title: "Change photo",
    description: "Point us at a picture and we will show it on your account.",
    schema: useAvatarSchema(),
    uischema: useAvatarUischema(),
    model: avatarDefaults(data.persona.avatarSrc),
    submit: MOCK_ACTION.AVATAR_SAVE,
    submitLabel: SAVE_LABEL,
    resetLabel: CANCEL_LABEL
  }),

  // --- one address's own notifications and confirmation ------------------------

  [FORM_ID.EMAIL_TOPIC_OPT_INS]: (data, entityId) => {
    const row = addressableEmail(data, entityId);
    // Legacy's `canManageOptIns`: an unverified address can neither receive
    // notifications nor be subscribed to any, and a brand that publishes no
    // topics has nothing to subscribe to at all.
    if (row === undefined || !row.meta.isVerified) return undefined;
    if (size(data.emailTopics) === 0) return undefined;
    const address = row.email ?? "";
    const context = emailTopicOptInsContext(data, address);
    return {
      title: "Manage notifications",
      description: `What we send to ${address}, and nothing else.`,
      schema: useEmailTopicOptInsSchema(context),
      uischema: useEmailTopicOptInsUischema(context),
      model: emailTopicOptInsDefaults(context),
      // The address, not the row key: the write is the token page's own, and
      // a link names what it was sent to (`mock/actions.ts`).
      submit: `${MOCK_ACTION.EMAIL_OPT_INS_SAVE}:${address}`,
      submitLabel: "Save preferences",
      resetLabel: CANCEL_LABEL
    };
  },
  [FORM_ID.SUPPORT_PREFERENCES]: data => {
    const context = supportPreferencesContext(data);
    return {
      title: "Post options",
      description: "How this box behaves while you are writing.",
      schema: useSupportPreferencesSchema(),
      uischema: useSupportPreferencesUischema(),
      model: supportPreferencesDefaults(context),
      submit: MOCK_ACTION.SUPPORT_PREFERENCES_SAVE,
      submitLabel: SAVE_LABEL,
      resetLabel: CANCEL_LABEL
    };
  },

  // --- paying a document -------------------------------------------------------

  [FORM_ID.IP_WHITELIST_CREATE]: () => ({
    title: "Add an IP address",
    description: "Only the addresses listed here will be able to sign in.",
    schema: useIpWhitelistSchema(),
    uischema: useIpWhitelistUischema(),
    model: ipWhitelistDefaults(),
    submit: MOCK_ACTION.IP_WHITELIST_CREATE,
    submitLabel: "Add address",
    resetLabel: CANCEL_LABEL
  }),
  [FORM_ID.IP_WHITELIST_EDIT]: (data, entityId) => {
    if (entityId === undefined) return undefined;
    const entry = find(data.ipWhitelist, { id: entityId });
    if (entry === undefined) return undefined;
    return {
      title: "Edit this address",
      description: "Only the addresses listed here will be able to sign in.",
      schema: useIpWhitelistSchema(),
      uischema: useIpWhitelistUischema(),
      model: ipWhitelistEditDefaults(entry),
      submit: `${MOCK_ACTION.IP_WHITELIST_SAVE}:${entry.id}`,
      submitLabel: "Save address",
      resetLabel: CANCEL_LABEL
    };
  },

  // --- the public link a document is shared by ---------------------------------

  [FORM_ID.INVOICE_SHARE]: (data, entityId) => {
    if (entityId === undefined) return undefined;
    const invoice = useMockInvoice(data, entityId).useContext().data.value;
    if (invoice === undefined) return undefined;
    // The same guard the control is offered on: a delegated document opens no
    // dialog to share, because the write behind it refuses (plan R4).
    if (whyNotShareable(invoice) !== undefined) return undefined;
    const context = invoiceShareContext(invoice);
    return {
      title: `Share ${invoice.number}`,
      description:
        "Anyone with the link can view this invoice and do whatever you permit below. No sign-in is required.",
      schema: useShareSchema(context),
      uischema: useShareUischema(context),
      model: invoiceShareDefaults(context),
      submit: `${MOCK_ACTION.INVOICE_SHARE_SAVE}:${invoice.id}`,
      submitLabel: SAVE_LABEL,
      resetLabel: CANCEL_LABEL,
      extraActions: [
        {
          value: `${MOCK_ACTION.INVOICE_SHARE_REGENERATE}:${invoice.id}`,
          label: "Regenerate link"
        },
        {
          value: `${MOCK_ACTION.SHARE_INVOICE}:${invoice.id}`,
          label: "Copy link"
        }
      ]
    };
  }
};

/** The form `id` names, bound to the dataset — `undefined` when it names a row the dataset does not hold. */
export function resolveMockForm(
  data: MockDataset,
  id: FormId,
  entityId: string | undefined
): MockFormEntry | undefined {
  return FORM_BUILDER[id](data, entityId);
}
