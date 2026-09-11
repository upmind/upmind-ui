// -----------------------------------------------------------------------------
/**
 * @module portal/mock/selectors
 * @description Dataset → module-prop shapes (plan §4): a brand's page rows
 * reference these instead of hand-built literals, so modules keep rendering
 * only what they are given (the stage-5 mutant law) while the data lives in
 * one typed place. Counting only — a money field is read through its own
 * `formatted` string, never recomputed (plan R6), and a wire status is read
 * through the label tables below, never printed raw.
 */

import {
  Bell,
  Building2,
  CircleUserRound,
  ClipboardList,
  Coins,
  CreditCard,
  FileClock,
  FileText,
  FolderTree,
  House,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Mail,
  MapPin,
  MessagesSquare,
  NotebookPen,
  Package,
  Phone,
  Receipt,
  Repeat,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  UserRound,
  UsersRound,
  Wrench
} from "lucide-vue-next";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  DelegateObjectTypes,
  InvoiceConsolidationTypes,
  InvoiceStatus,
  InvoiceStatusGroups,
  NotificationChannelCodes,
  SentEmailStatus,
  TicketStatusCodes
} from "@upmind-automation/types";
import {
  LEGACY_ACCOUNT_SUBMENU,
  LEGACY_SUPPORT_SUBMENU,
  LEGACY_BILLING_SUBMENU
} from "../fixtures/legacy-menus.fixture";
import { BUTTON_MODULE_VARIANT } from "../modules/button/types";
import { DOCUMENT_ACTION_VARIANT } from "../modules/document/types";
import { AUTH_QUERY_KEY, PORTAL_PILLAR } from "../types";
import {
  MOCK_ACTION,
  MOCK_DOCUMENT_KIND,
  MOCK_REFUSAL_MESSAGE,
  mockActionValue,
  TOPIC_SWITCH
} from "./actions";
import {
  accountDelegatesCollection,
  accountNotesCollection,
  accountSecretsCollection,
  affiliateCommissionsCollection,
  affiliateLinksCollection,
  affiliatePayoutsCollection,
  affiliateReferralsCollection,
  childAccountsCollection,
  creditNotesCollection,
  creditStatementsCollection,
  delegateProductsCollection,
  delegateTicketsCollection,
  INVOICE_STATUS_TAB,
  PRODUCT_STATUS_TAB,
  TICKET_STATUS_TAB,
  invoicesCollection,
  ipWhitelistCollection,
  billableEntitiesCollection,
  BILLABLE_ENTITY_KIND,
  ticketsCollection,
  groupProductsCollection,
  groupCatalogueCollection,
  loginAttemptsCollection,
  sentEmailsCollection,
  EMAIL_STATUS_TAB,
  NOTIFICATION_FILTER,
  NOTIFICATION_FILTER_CRITERIA,
  notificationFeedCollection,
  notificationPreferencesCollection,
  notificationsCollection,
  productCreditNotesCollection,
  productInvoicesCollection,
  productTicketsCollection
} from "./collection-defs";
import { ClientRelationToggleKeys, DelegateAccessTypes } from "./contracts";
import {
  useVerifyEmailSchemaParser,
  useVerifyEmailUischemaParser,
  verifyEmailDefaults
} from "./contracts/account.schemas";
import {
  useTwoFASchema,
  useTwoFAUischema,
  twoFactorDefaults
} from "./contracts/auth.schemas.twofa";
import {
  usePayoutDestinationSchema,
  usePayoutDestinationUischema,
  payoutDestinationDefaults
} from "./contracts/client-affiliate.schemas";
import {
  useSchema as useBillingSettingsSchema,
  useUischema as useBillingSettingsUischema,
  billingSettingsDefaults
} from "./contracts/client-billing-settings.schemas";
import {
  consolidationDefaults,
  labelDefaults,
  useConsolidationSchema,
  useConsolidationUischema,
  useLabelSchema,
  useLabelUischema
} from "./contracts/client-contract-product.schemas";
import {
  passwordDefaults,
  usePasswordSchema,
  usePasswordUischema,
  usernameDefaults,
  useUsernameSchema,
  useUsernameUischema
} from "./contracts/client-security.schemas";
import {
  useSchema as useNewTicketSchema,
  useUischema as useNewTicketUischema,
  newTicketDefaults
} from "./contracts/client-tickets.schemas";
import {
  setupDefaults,
  useSetupSchema,
  useSetupUischema
} from "./contracts/contract-product-provisioning.schemas";
import {
  useSchema as usePreferencesSchema,
  useUischema as usePreferencesUischema,
  preferencesDefaults,
  emailTopicOptInsDefaults,
  useEmailTopicOptInsSchema,
  useEmailTopicOptInsUischema
} from "./contracts/user-notifications.schemas";
import { today } from "./dates";
import { zeroOf } from "./documents";
import {
  canCloseTicket,
  activePersonaAccount,
  canDelegateTicket,
  canDetachTicketProduct,
  canOfferMigration,
  canRenameTicket,
  canManageTicketMessage,
  canSetTicketProduct,
  consolidatableInvoices,
  hasPendingPayment,
  isInvoiceClearing,
  isInvoiceOwed,
  isInvoicePayable,
  invoiceRowStanding,
  invoiceStandingMessage,
  isPartlyPaid,
  whyNotShareable,
  hasAccountChoice,
  hasDelegateObject,
  hasTicketProduct,
  isStagedImport,
  isSupportPinRevealed,
  isTicketClosed,
  isTicketLocked,
  isTicketMessageDeleted,
  isTrialAhead,
  trialDaysRemaining,
  trialNotice,
  migrationPriceLabel,
  orderedMigrationOptions,
  productLifecycleEvents,
  PRODUCT_EVENT_ID,
  migrationRefusal,
  MOCK_RECEIPT_REASON,
  templateSlotBody,
  useMockAffiliate,
  pendingInstruction,
  useMockProvisioning,
  useMockSupportPin,
  useMockWallet,
  whyNotConsolidatable
} from "./facades";
import {
  emailTopicOptInsContext,
  notificationPreferencesContext,
  payoutDestinationContext
} from "./forms/account-contexts";
import { billingSettingsFormContext } from "./forms/billing-contexts";
import { interfaceLanguageLabel } from "./forms/engine-data";
import { FORM_ID } from "./forms/ids";
import { resolveMockForm } from "./forms/registry";
import { ticketFormContext } from "./forms/support-contexts";
import { useMockImpersonation } from "./impersonation";
import {
  COMMISSION_STATUS_TONE,
  CREDIT_NOTE_STATUS_LABEL,
  CREDIT_NOTE_STATUS_TONE,
  creditNoteState,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYOUT_DESTINATION_LABEL,
  PAYOUT_STATUS_LABEL,
  PAYOUT_STATUS_TONE,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_TONE,
  SCHEDULED_ACTION_STATUS_LABEL,
  SCHEDULED_ACTION_STATUS_TONE,
  SENT_EMAIL_STATUS_LABEL,
  SENT_EMAIL_STATUS_TONE,
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE
} from "./status-labels";
import {
  MOCK_BILLING_TYPE,
  MOCK_COMMISSION_STATUS,
  MOCK_DELEGATE_STATUS,
  MOCK_PAYMENT_STATUS
} from "./types";
import { pinnedFirst } from "./vault-order";
import {
  assign,
  compact,
  concat,
  every,
  filter,
  find,
  includes,
  flatMap,
  isEmpty,
  map,
  omit,
  size,
  some,
  sortBy,
  take,
  takeRight,
  toLower,
  toString,
  uniq,
  values
} from "lodash-es";
import type { MockAction, MockDocumentKind } from "./actions";
import type { DataRouteContext } from "./injection";
import type {
  DocumentModuleAction,
  DocumentModuleHeader,
  DocumentModuleLine,
  DocumentModuleMessage,
  DocumentModuleParty,
  DocumentModulePartyBlock,
  DocumentModulePayment,
  DocumentModuleTotal,
  DocumentModuleTotals
} from "../modules/document/types";
import type { CatchAllResolution } from "../routes";
import type { MockCreditStatementView, MockProvisioningView } from "./facades";
import type { MockProductEvent } from "./facades";
import type { FormId } from "./forms/ids";
import type { MockFormEntry } from "./forms/registry";
import type { TimelineTone } from "./status-labels";
import type {
  MockAddress,
  MockAffiliateCommission,
  MockCancellationRequest,
  MockChildAccount,
  MockCompany,
  MockCreditNote,
  MockCustomPage,
  MockDataset,
  MockDelegate,
  MockDocumentPayment,
  MockInvoice,
  MockInvoiceLine,
  MockMoney,
  MockOrder,
  MockParty,
  MockPhone,
  MockProduct,
  MockProvisionField,
  MockProvisionFunction,
  MockSentEmail,
  MockTaxLine,
  MockTicket,
  MockTicketMessage,
  MockVaultAsset
} from "./types";
import type { AccountMenuItem } from "../modules/account-menu/types";
import type { BannerModuleProps } from "../modules/banner/types";
import type {
  ButtonModuleAction,
  ButtonModuleVariant
} from "../modules/button/types";
import type {
  ListModuleHeading,
  ListModuleItem,
  ListModuleProps
} from "../modules/list/types";
import type { MenuItem } from "../modules/menu/types";
import type { MetricModuleItem } from "../modules/metric/types";
import type {
  NotificationsModuleFilter,
  NotificationsModuleProps
} from "../modules/notifications/types";
import type { ProseModuleFrame } from "../modules/prose/types";
import type { SpecModuleItem } from "../modules/spec/types";
import type { TabsModuleTab as TabsModuleItem } from "../modules/tabs/types";
import type { TimelineModuleItem } from "../modules/timeline/types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { AlertProps } from "@upmind/ui";
import type { FormModel } from "@upmind/ui";
import type { IClientTemplateSlot } from "@upmind-automation/types";

/** An ISO stamp read as a day — the leading `YYYY-MM-DD`. */
const ISO_DATE_LENGTH = 10;

/** Where the account card's own links go. */
const SECURITY_PATH = "/account/security";
const CHILD_ACCOUNTS_PATH = "/account/child-accounts";
const LOGS_PATH = "/account/logs";

/** What a masked PIN reads as before it is revealed. */
const PIN_MASK = "••••";

/** How the preference table says a channel is on, and off. */
const CHANNEL_ON = "✓";
const CHANNEL_OFF = "—";

/** A recurring price reads with its term; a one-time price reads alone. */
function priceLabel(
  price: MockMoney | undefined,
  billingTerm: string | undefined
): string | undefined {
  if (price === undefined) return undefined;
  return compact([price.formatted, billingTerm]).join(" · ");
}

/**
 * The active-products panel — running products, pending ones flagged, GROUPED
 * by what each product actually is: legacy stacked a client's services under
 * their service identifier, and sorting by it puts a host's products together
 * while the row's own chip names the group they are in.
 */
/** Legacy's own trial banner over the product (`cProdTrialMsg.vue:45-56`). */
export function productTrialMessage(
  data: MockDataset,
  context: DataRouteContext
): string {
  const product = contextProduct(data, context);
  if (product === undefined) return "";
  return trialNotice(product) ?? "";
}

export function productHasTrialMessage(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return productTrialMessage(data, context) !== "";
}

/** The inline way to end it early — the same verb the manage list offers. */
export function productTrialAction(
  data: MockDataset,
  context: DataRouteContext
): BannerModuleProps["action"] {
  const product = contextProduct(data, context);
  if (product === undefined || !isTrialAhead(product)) return undefined;
  if (product.status === ContractStatusCodes.AWAITING_ACTIVATION) {
    return undefined;
  }
  return {
    value: mockActionValue(MOCK_ACTION.END_TRIAL, product.id),
    label: "End trial early"
  };
}

/**
 * The tag strip legacy hung on every product row (`cProdTags.vue:11-82`): the
 * trial and when it ends, whether the product reached this client through a
 * delegation, the client's own reference, and the promo codes it was bought
 * with. The reference is a CONTROL — legacy opened the label form from the
 * tag itself — and a row with no reference offers the same form as "+ Add
 * label", where the product is still the client's to change.
 */
function productTags(product: MockProduct): ListModuleItem["tags"] {
  const labelForm = openFormValue(FORM_ID.PRODUCT_LABEL, product.id);
  const openRequests = product.provisioning.unresolvedRequests ?? 0;
  return compact([
    // Legacy's danger marker: the provider still owes this product something.
    openRequests > 0 && {
      label: `${countedNoun(openRequests, "open request")} with the provider`,
      tone: "danger" as const,
      action: {
        value: mockActionValue(MOCK_ACTION.VIEW_PRODUCT, product.id),
        label: "Open the product"
      }
    },
    isTrialAhead(product) && {
      label: `Free trial · ends in ${countedNoun(trialDaysRemaining(product), "day")} on ${product.trialEndsAt}`,
      tone: "info"
    },
    product.isDelegated === true && { label: "Delegated", tone: "neutral" },
    product.customLabel !== undefined && {
      label: `Ref: ${product.customLabel}`,
      tone: "neutral",
      action: { value: labelForm, label: "Change your reference" }
    },
    ...map(product.promotionCodes ?? [], code => ({
      label: `Promo: ${code}`,
      tone: "info" as const
    })),
    product.customLabel === undefined &&
      product.canModify && {
        label: "+ Add label",
        tone: "neutral" as const,
        action: { value: labelForm, label: "Add your own reference" }
      }
  ]);
}

export function activeProductItems(data: MockDataset): ListModuleItem[] {
  const running = filter(
    data.products,
    product => product.status !== ContractStatusCodes.CANCELLED
  );
  return map(groupedByService(running), product => ({
    id: product.id,
    title: product.name,
    // The chip names what this runs ON, so the line beside it need not repeat it.
    category: product.serviceIdentifier,
    description: productSummaryLine(product),
    leadingImageSrc: product.imageSrc,
    // The fallback tile glyph for a product with no image of its own —
    // row-cards render the image when both are given.
    leadingIcon: Package,
    tags: productTags(product),
    action: productRowAction(product),
    moreActions: productRowMoreActions(product),
    isInactive: isProductInactive(product)
  }));
}

/**
 * The dashboard metric rail — orders / invoices / unpaid / open tickets, each
 * tile linking to the list it counts, as legacy's did.
 */
export function dashboardMetricItems(data: MockDataset): MetricModuleItem[] {
  return [
    {
      label: "Total orders",
      value: countLabel(size(data.orders)),
      description: "All time",
      to: "/billing/orders"
    },
    {
      label: "Total Invoices",
      value: countLabel(size(data.invoices)),
      description: "All time",
      to: "/billing/invoices"
    },
    {
      label: "Unpaid Invoices",
      value: countLabel(size(unpaidInvoices(data))),
      description: "All time",
      to: `/billing/invoices?status=${INVOICE_STATUS_TAB.UNPAID}`
    },
    {
      label: "Active Tickets",
      value: countLabel(
        size(
          filter(
            data.tickets,
            ticket => ticket.status !== TicketStatusCodes.CLOSED
          )
        )
      ),
      description: "All time",
      to: "/support/tickets"
    }
  ];
}

/** What is still owed, account-wide — the needs-attention line and the unpaid tile read the same set. */
function unpaidInvoices(data: MockDataset): MockInvoice[] {
  return filter(data.invoices, invoice =>
    includes(InvoiceStatusGroups.UNPAID, invoice.status)
  );
}

/** The board renders an absent count as an en-dash, never a zero. */
function countLabel(count: number): string {
  if (count === 0) return "–";
  return String(count);
}

/**
 * Same service identifier, same run of rows — grouped in the order each
 * identifier first appears, never re-sorted: a board that reshuffles its own
 * rows to group singletons has hidden what needed attention.
 */
function groupedByService(products: readonly MockProduct[]): MockProduct[] {
  const identifiers = uniq(map(products, product => product.serviceIdentifier));
  return flatMap(identifiers, identifier =>
    filter(products, product => product.serviceIdentifier === identifier)
  );
}

/** The board's product line — the chip already names the host, so this reads what it IS. */
function productSummaryLine(product: MockProduct): string {
  if (product.status === ContractStatusCodes.AWAITING_ACTIVATION) {
    return `${product.category} · Action Needed`;
  }
  return product.category;
}

/** What a product IS reads first — its hostname, then what kind of thing it is. */
/** Legacy's `cProdOriginalName`: the name the brand replaced, kept in view. */
function formerlyLine(product: MockProduct): string | undefined {
  if (product.originalName === undefined) return undefined;
  return `formerly ${product.originalName}`;
}

/** Cancelled and closed products read as past — legacy dims them and strikes the name. */
function isProductInactive(product: MockProduct): boolean {
  return (
    product.status === ContractStatusCodes.CANCELLED ||
    product.status === ContractStatusCodes.CLOSED
  );
}

function productLine(product: MockProduct): string {
  const lead = compact([
    product.serviceIdentifier,
    product.category,
    formerlyLine(product)
  ]).join(" · ");
  if (product.status === ContractStatusCodes.AWAITING_ACTIVATION) {
    return `${lead} · Action Needed`;
  }
  return lead;
}

/** The badge a product's lifecycle wears — the wire status, in the client's words. */
function productBadge(product: MockProduct): ListModuleItem["status"] {
  return {
    label: PRODUCT_STATUS_LABEL[product.status],
    tone: PRODUCT_STATUS_TONE[product.status]
  };
}

/** What legacy called the row's own destination — "Manage <entity>", without the entity noun the mock has no field for. */
const MANAGE_PRODUCT_LABEL = "Manage";

/** The function the provider FEATURED — legacy took the first of them. */
function highlightedFunction(
  product: MockProduct
): MockProvisionFunction | undefined {
  return find(product.provisioning.functions, { highlighted: true });
}

/** One provider function on a product row — the same value the sidebar's own controls carry. */
function productFunctionAction(
  product: MockProduct,
  entry: MockProvisionFunction
): { readonly value: string; readonly label: string } {
  return {
    value: mockActionValue(
      MOCK_ACTION.RUN_PROVISION_FUNCTION,
      `${product.id}:${entry.code}`
    ),
    label: entry.label
  };
}

/**
 * A product row's own button — legacy's `cProdRowWithFuncs`: the provider's
 * featured function where it published one, and the way in to the product
 * where it did not. A product still waiting on its setup leads to the Setup
 * tab instead, whatever its provider offers — the product root lands there.
 */
function productRowAction(product: MockProduct): ListModuleItem["action"] {
  if (product.status === ContractStatusCodes.AWAITING_ACTIVATION) {
    return {
      value: mockActionValue(MOCK_ACTION.VIEW_PRODUCT, product.id),
      label: "Complete setup"
    };
  }
  const featured = highlightedFunction(product);
  if (featured !== undefined) return productFunctionAction(product, featured);
  return {
    value: mockActionValue(MOCK_ACTION.VIEW_PRODUCT, product.id),
    label: MANAGE_PRODUCT_LABEL
  };
}

/** Legacy's list item CTA (`cProdGridItem` `_action.manage_entity`), with setup taking its place while it is owed. */
function listingRowAction(product: MockProduct): ListModuleItem["action"] {
  if (product.status === ContractStatusCodes.AWAITING_ACTIVATION) {
    return {
      value: mockActionValue(MOCK_ACTION.VIEW_PRODUCT, product.id),
      label: "Complete setup"
    };
  }
  return {
    value: mockActionValue(MOCK_ACTION.VIEW_PRODUCT, product.id),
    label: MANAGE_PRODUCT_LABEL
  };
}

/**
 * The row's overflow — legacy's dropdown, in its own order: every provider
 * function, then the product itself, then its billing.
 */
function productRowMoreActions(
  product: MockProduct
): ListModuleItem["moreActions"] {
  return concat(
    map(product.provisioning.functions, entry =>
      productFunctionAction(product, entry)
    ),
    [
      {
        value: mockActionValue(MOCK_ACTION.VIEW_PRODUCT, product.id),
        label: MANAGE_PRODUCT_LABEL
      },
      {
        value: mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `/${product.groupSlug}/${product.id}/billing`
        ),
        label: "Manage billing"
      }
    ]
  );
}

/**
 * What the needs-attention notice DOES about it: legacy sent the client to
 * the setup that is waiting on them, and failing that, to the invoices that
 * are. Nothing outstanding means no control at all.
 */
export function needsAttentionAction(
  data: MockDataset
): BannerModuleProps["action"] {
  const pending = find(data.products, {
    status: ContractStatusCodes.AWAITING_ACTIVATION
  });
  if (pending !== undefined) {
    return {
      value: mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/${pending.groupSlug}/${pending.id}/setup`
      ),
      label: "Complete setup"
    };
  }
  if (size(unpaidInvoices(data)) === 0) return undefined;
  return {
    value: mockActionValue(
      MOCK_ACTION.NAVIGATE,
      `/billing/invoices?status=${INVOICE_STATUS_TAB.UNPAID}`
    ),
    label: "View invoices"
  };
}

/** The dashboard's needs-attention line — unpaid invoices and pending setups, joined; empty when nothing needs the user. */
export function needsAttentionMessage(data: MockDataset): string {
  const unpaid = unpaidInvoices(data);
  const pending = productsAwaitingSetup(data);

  // Up to two invoices are NAMED; more collapse to a count — five numbers
  // joined into one banner line drowned the message.
  const unpaidPart =
    unpaid.length > 2
      ? `${unpaid.length} invoices are awaiting payment`
      : `${map(unpaid, "number").join(", ")} ${unpaid.length === 1 ? "is" : "are"} awaiting payment`;
  const parts = compact([
    unpaid.length > 0 && unpaidPart,
    pending.length > 0 &&
      `${map(pending, "name").join(", ")} ${pending.length === 1 ? "needs" : "need"} setup`
  ]);
  return parts.join(" · ");
}

/** A blueprint field the provider insists on and nobody has answered yet. */
function isOutstandingField(field: MockProvisionField): boolean {
  const isDemanded = field.required === true;
  const isUnanswered =
    field.value === undefined || field.value === null || field.value === "";
  return isDemanded && isUnanswered;
}

/** What one product is still waiting for, in the client's own words — legacy lowercased its labels. */
function outstandingFieldNames(product: MockProduct): string[] {
  return map(filter(product.provisioning.fields, isOutstandingField), field =>
    toLower(field.label)
  );
}

/**
 * Legacy's own three shapes for the same list
 * (`_plurals.your_product_is_almost_ready`): one field is named, two are named
 * and joined, and beyond that the first two stand for the rest.
 */
function confirmList(names: readonly string[]): string {
  const leading = take(names, 2);
  if (names.length > 2) {
    return `${leading.join(", ")} and a few other details`;
  }
  return leading.join(" and ");
}

function almostReadyLine(product: MockProduct): string {
  const named = confirmList(outstandingFieldNames(product));
  return `Your new ${product.name} is almost ready. We just need to confirm your ${named} before you can get going.`;
}

/**
 * The products still waiting on the CLIENT — legacy's own filter
 * (`provision_setup_fields_confirmed = 0`, `contractProductsNeedsConfirmation`):
 * awaiting activation AND short of a field the provider insists on. A product
 * whose blueprint is fully answered has nothing to ask for, so it leaves the
 * panel even while the provider is still switching it on.
 */
function productsNeedingAnswers(data: MockDataset): MockProduct[] {
  return filter(
    data.products,
    product =>
      product.status === ContractStatusCodes.AWAITING_ACTIVATION &&
      some(product.provisioning.fields, isOutstandingField)
  );
}

/** The products awaiting activation at all — the needs-attention LINE's own set. */
function productsAwaitingSetup(data: MockDataset): MockProduct[] {
  return filter(data.products, {
    status: ContractStatusCodes.AWAITING_ACTIVATION
  });
}

/**
 * One card per product still short of an answer, each naming the blueprint
 * fields it wants and offering the setup that supplies them. Legacy showed two
 * and hid the rest behind a load-more, which the panel's own cap does.
 */
export function needsAttentionProductItems(
  data: MockDataset
): ListModuleItem[] {
  return map(productsNeedingAnswers(data), product => ({
    id: product.id,
    title: product.name,
    description: almostReadyLine(product),
    category: product.category,
    leadingImageSrc: product.imageSrc,
    leadingIcon: Package,
    action: {
      value: mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/${product.groupSlug}/${product.id}/setup`
      ),
      label: "Complete setup"
    }
  }));
}

/** Whether anything is still short of an answer — the panel's own presence on the board. */
export function hasProductsAwaitingSetup(data: MockDataset): boolean {
  return size(productsNeedingAnswers(data)) > 0;
}

/** The dashboard's recent-invoices list — legacy recentInvoicesList: number, dates, status, total, and its row menu. Newest first; the config caps its summary (`maxItems`). */
export function recentInvoiceItems(data: MockDataset): ListModuleItem[] {
  const newestFirst = [...data.invoices].sort((a, b) =>
    b.issuedDate.localeCompare(a.issuedDate)
  );
  return map(newestFirst, invoice => ({
    id: invoice.id,
    title: invoice.number,
    to: `/billing/invoices/${invoice.id}`,
    description: `Issued ${invoice.issuedDate} · ${INVOICE_STATUS_LABEL[invoice.status]}`,
    leadingIcon: Receipt,
    trailingText: invoice.total.formatted,
    moreActions: invoiceMoreActions(invoice)
  }));
}

/** Legacy's child-accounts board panel — the rows, gated on the account having any. */
export function dashboardChildAccountItems(
  data: MockDataset
): ListModuleItem[] {
  return map(data.childAccounts, child => ({
    id: child.id,
    title: child.name,
    description: child.email,
    leadingIcon: UsersRound,
    to: "/account/child-accounts"
  }));
}

/** Whether this persona is a parent at all — the panel's own presence (plan R9's two datasets). */
export function hasChildAccounts(data: MockDataset): boolean {
  return size(data.childAccounts) > 0;
}

/** The dashboard's recent-tickets list — legacy recentTicketsList: subject, department, status. Newest first; the config caps its summary (`maxItems`). */
export function recentTicketItems(data: MockDataset): ListModuleItem[] {
  const newestFirst = [...data.tickets].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  return map(newestFirst, ticket => ({
    id: ticket.id,
    title: ticket.subject,
    to: `/support/tickets/${ticket.id}`,
    description: `${ticket.department} · ${TICKET_STATUS_LABEL[ticket.status]}`,
    leadingIcon: LifeBuoy,
    time: ticket.updatedAt.slice(0, 10),
    datetime: ticket.updatedAt
  }));
}

// --- products pillar (plan Phase D; legacy src/views/client/products)

/**
 * The group listing's products for the showing status tab — legacy's
 * All/Active/Cancelled routes, as one list under a tab rail. A cancelled row
 * says so in place of a price it no longer charges.
 */
export function groupProductItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = groupProductsCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, product => ({
    id: product.id,
    title: product.name,
    to: productPath(context, product),
    description: productLine(product),
    leadingImageSrc: product.imageSrc,
    // The listing lays itself out either way, so the row carries the grid's
    // chip and the table's columns alike.
    leadingIcon: Package,
    category: product.category,
    cells: [
      { value: product.serviceIdentifier ?? "—" },
      { value: product.createdAt },
      { value: product.billingTerm ?? "One-time" },
      // The term has its own column here, so the price column carries the
      // figure alone — the compact row still reads them together.
      { value: product.price?.formatted ?? "—", numeric: true }
    ],
    tags: productTags(product),
    status: productBadge(product),
    isInactive: isProductInactive(product),
    // Legacy's list item carries one CTA and no overflow: "Manage", or the
    // way into setup while that is still owed. The function button and the
    // menu belong to the dashboard rows only (`cProdRowWithFuncs`).
    action: listingRowAction(product)
  }));
}

/**
 * A status rail: legacy's per-status routes, as query state on one route.
 * Each tab navigates rather than switching a panel, so the URL stays
 * shareable and a reload keeps the tab.
 */
function statusTabs(
  path: string,
  tabs: readonly { value: string; label: string }[]
): TabsModuleItem[] {
  return map(tabs, tab => ({
    value: tab.value,
    label: tab.label,
    action: mockActionValue(MOCK_ACTION.NAVIGATE, `${path}?status=${tab.value}`)
  }));
}

/**
 * Which tab is showing, given the route's status and the tab set. An
 * unrecognised or absent status falls to the list's own default — the tab it
 * opens on, which need not be the first in the rail.
 */
function showingStatus(
  context: DataRouteContext,
  known: readonly string[],
  fallback: string
): string {
  if (context.status !== undefined && known.includes(context.status)) {
    return context.status;
  }
  return fallback;
}

/** All leads the rail as the widest view; Active is what the listing OPENS on. */
const PRODUCT_TABS = [
  { value: PRODUCT_STATUS_TAB.ALL, label: "All" },
  { value: PRODUCT_STATUS_TAB.ACTIVE, label: "Active" },
  { value: PRODUCT_STATUS_TAB.CANCELLED, label: "Cancelled" }
];

/** Legacy's product status tabs, as query state on the listing's own route. */
export function groupProductTabs(
  data: MockDataset,
  context: DataRouteContext
): TabsModuleItem[] {
  return statusTabs(`/${context.groupSlug ?? ""}`, PRODUCT_TABS);
}

/** Which product tab is showing — absent status reads as Active, the listing's default. */
export function groupProductStatus(
  data: MockDataset,
  context: DataRouteContext
): string {
  return showingStatus(
    context,
    map(PRODUCT_TABS, "value"),
    PRODUCT_STATUS_TAB.ACTIVE
  );
}

/**
 * The product's summary — legacy's own facts, in its own order: what it is,
 * where it stands, what each renewal buys, when a trial runs out, what it
 * costs and how that price is quoted, when it next falls due, and the day it
 * was bought, which links to the order that bought it.
 */
export function productSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  return compact([
    { id: "name", label: "Product", value: product.name },
    { id: "category", label: "Category", value: product.category },
    {
      id: "status",
      label: "Status",
      value: PRODUCT_STATUS_LABEL[product.status]
    },
    product.renewalTerm !== undefined && {
      id: "renewal-term",
      label: "Renews every",
      value: product.renewalTerm
    },
    product.trialEndsAt !== undefined && {
      id: "trial-ends",
      label: "Free trial ends",
      value: product.trialEndsAt
    },
    product.price !== undefined && {
      id: "price",
      label: "Price",
      value: priceLabel(product.price, product.billingTerm) ?? ""
    },
    // How the price is QUOTED is its own row: a figure and a caveat on one
    // line reads as part of the figure.
    product.taxLabel !== undefined && {
      id: "tax",
      label: "Tax",
      value: product.taxLabel
    },
    product.nextDueDate !== undefined && {
      id: "next-due",
      label: "Next due date",
      value: product.nextDueDate
    },
    {
      id: "purchased",
      label: "Purchased",
      value: product.purchasedAt,
      to: `/billing/orders/${product.orderId}`
    }
  ]);
}

/** The product billing area's key-values — legacy cProdBilling's fields. */
export function productBillingSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  return compact([
    product.price !== undefined && {
      id: "price",
      label: "Price",
      value: priceLabel(product.price, product.billingTerm) ?? ""
    },
    product.nextDueDate !== undefined && {
      id: "next-due",
      label: "Next due date",
      value: product.nextDueDate
    },
    {
      id: "status",
      label: "Billing status",
      value: PRODUCT_STATUS_LABEL[product.status]
    }
  ]);
}

// Consolidation is no longer stated here: the billing area asks for it, and a
// panel that both asks and answers says the same thing twice
// (`productConsolidationForm*` below).

/**
 * The product's action-area nav — legacy's product menu, gated the same way:
 * Setup appears only while the product awaits it; Settings only where there
 * is a subscription to set anything on, and never on a product managed for
 * someone else; Tickets only where the brand runs a support desk.
 */
/** The product's action areas, as the route spells them — named once for the nav and the guards. */
export const PRODUCT_AREA_SLUG = {
  SETUP: "setup",
  BILLING: "billing",
  TICKETS: "tickets",
  SETTINGS: "settings"
} as const;

export function productAreaNavItems(
  data: MockDataset,
  context: DataRouteContext
): MenuItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  const base = productPath(context, product);
  const hasSettings =
    product.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION &&
    product.isDelegated !== true;
  return compact([
    product.status === ContractStatusCodes.AWAITING_ACTIVATION && {
      to: `${base}/${PRODUCT_AREA_SLUG.SETUP}`,
      label: "Setup",
      icon: Wrench
    },
    { to: base, label: "Overview", icon: LayoutDashboard },
    {
      to: `${base}/${PRODUCT_AREA_SLUG.BILLING}`,
      label: "Billing",
      icon: CreditCard
    },
    isSupportEnabled(data) && {
      to: `${base}/${PRODUCT_AREA_SLUG.TICKETS}`,
      label: "Tickets",
      icon: LifeBuoy
    },
    hasSettings && {
      to: `${base}/${PRODUCT_AREA_SLUG.SETTINGS}`,
      label: "Settings",
      icon: Settings
    },
    { to: `${base}/delegates`, label: "Delegates", icon: UsersRound }
  ]);
}

/** The product's tickets — legacy cProdTickets, filtered to this product. */
export function productTicketItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = productTicketsCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, ticketListItem);
}

/** What one delegate may do, as one line — empty where they have been granted nothing yet. */
function permissionList(delegate: MockDelegate): string {
  return delegate.permissions.join(", ");
}

/**
 * One line from the facts that HAVE something to say. A separator between a
 * fact and nothing reads as a fact that went missing, which is what a
 * just-invited delegate's empty permission list would have printed.
 */
function describedBy(parts: readonly (string | undefined)[]): string {
  return compact(parts).join(" · ");
}

/** The product delegates area — legacy cProdDelegates (account delegates, mocked account-wide). */
export function productDelegateItems(data: MockDataset): ListModuleItem[] {
  return map(data.delegates, delegate => ({
    id: delegate.id,
    title: delegate.name,
    description: describedBy([delegate.email, permissionList(delegate)])
  }));
}

function contextProduct(
  data: MockDataset,
  context: DataRouteContext
): MockProduct | undefined {
  if (context.productId === undefined) return undefined;
  return find(data.products, { id: context.productId });
}

function productPath(context: DataRouteContext, product: MockProduct): string {
  return `/${context.groupSlug ?? product.groupSlug}/${product.id}`;
}

/**
 * Where a group listing sends a client who owns exactly one product in it —
 * legacy's own products index went straight to the product rather than
 * rendering a list of one. Any narrowing in the URL means the client asked
 * for the LIST, so the redirect stands down. Pure: the catch-all page holds
 * the navigation, this holds the decision.
 */
/**
 * Legacy's setup tab sends a finished product back to its overview — once
 * setup is confirmed the page has nothing left to ask.
 */
/** Legacy opens a product still waiting on setup at its Setup tab, not its overview. */
export function productRootRedirect(
  data: MockDataset | undefined,
  resolution: CatchAllResolution
): string | undefined {
  if (data === undefined) return undefined;
  if (resolution.kind !== "product-detail") return undefined;
  const product = find(data.products, { id: resolution.id });
  if (product === undefined) return undefined;
  if (product.status !== ContractStatusCodes.AWAITING_ACTIVATION) {
    return undefined;
  }
  return `/${resolution.group.slug}/${product.id}/${PRODUCT_AREA_SLUG.SETUP}`;
}

/**
 * The one redirect a catch-all path asks for, or none: the sole-product
 * shortcut, the finished Setup tab, or the setup a product still owes. Pure —
 * the route middleware holds the navigation, this holds the decision.
 */
export function catchAllRedirect(
  data: MockDataset | undefined,
  resolution: CatchAllResolution,
  query: DataRouteContext
): string | undefined {
  if (resolution.kind === "unmatched") return undefined;
  const sole = soleProductRedirect(data, resolution, query);
  if (sole !== undefined) return sole;
  const finished = setupAreaRedirect(data, resolution);
  if (finished !== undefined) return finished;
  return productRootRedirect(data, resolution);
}

export function setupAreaRedirect(
  data: MockDataset | undefined,
  resolution: CatchAllResolution
): string | undefined {
  if (data === undefined) return undefined;
  if (resolution.kind !== "product-action-area") return undefined;
  if (resolution.area !== PRODUCT_AREA_SLUG.SETUP) return undefined;
  const product = find(data.products, { id: resolution.id });
  if (product === undefined) return undefined;
  if (product.status === ContractStatusCodes.AWAITING_ACTIVATION) {
    return undefined;
  }
  return `/${resolution.group.slug}/${product.id}`;
}

export function soleProductRedirect(
  data: MockDataset | undefined,
  resolution: CatchAllResolution,
  query: DataRouteContext
): string | undefined {
  if (data === undefined) return undefined;
  if (resolution.kind !== "group-listing") return undefined;

  const isNarrowed =
    query.productType !== undefined ||
    query.category !== undefined ||
    query.status !== undefined;
  if (isNarrowed) return undefined;

  const inGroup = filter(data.products, { groupSlug: resolution.group.slug });
  const only = inGroup.at(0);
  if (size(inGroup) !== 1 || only === undefined) return undefined;
  return `/${resolution.group.slug}/${only.id}`;
}

/** The group's orderable catalogue — legacy's storefront, scoped to the route's group. */
export function groupCatalogueItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = groupCatalogueCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, item => ({
    id: item.id,
    title: item.name,
    category: item.category,
    description: item.description,
    // The card's media band shows the glyph — the catalogue has no imagery.
    leadingIcon: Package,
    trailingText: priceLabel(item.price, item.billingTerm),
    action: {
      value: mockActionValue(MOCK_ACTION.PLACE_ORDER, item.id),
      label: "Order"
    }
  }));
}

// --- products: the detail's shared chrome (plan Phase 3; legacy cProd*)

/**
 * The product's own billboard — what it IS, in one row: its image or glyph,
 * the category above the name, the lifecycle badge and whatever else is
 * standing true of it. A one-row list rather than a module of its own: a row
 * already carries every one of those parts.
 */
export function productBillboardItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  return [
    {
      id: product.id,
      title: product.customLabel ?? product.name,
      category: product.category,
      description: compact([
        product.serviceIdentifier,
        formerlyLine(product)
      ]).join(" · "),
      leadingImageSrc: product.imageSrc,
      leadingIcon: Package,
      status: productBadge(product),
      tags: map(product.tags ?? [], label => ({ label }))
    }
  ];
}

/** The one thing standing between this product and the client, and what to do about it. */
type ProductCondition = {
  readonly title: string;
  readonly message: string;
  readonly tone: BannerModuleProps["tone"];
  readonly action: BannerModuleProps["action"];
};

/**
 * Legacy's condition banner, as one derivation: the states a product can be
 * in that the client can DO something about, in the order they matter. A
 * product with nothing to answer for renders no banner at all.
 *
 * `abort-cancellation` and `disable-auto-expire` are wired here as banner
 * actions; the dispatcher cases arrive with the lifecycle phase, so they are
 * quiet no-ops until then.
 */
function productCondition(
  data: MockDataset,
  context: DataRouteContext
): ProductCondition | undefined {
  const product = contextProduct(data, context);
  if (product === undefined) return undefined;
  const base = productPath(context, product);

  if (product.status === ContractStatusCodes.PENDING) {
    return {
      title: "Waiting for payment",
      message:
        "This product goes live as soon as the order it was bought on is settled.",
      tone: "warning",
      action: {
        value: mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `/billing/orders/${product.orderId}`
        ),
        label: "Go to order"
      }
    };
  }
  if (product.status === ContractStatusCodes.AWAITING_ACTIVATION) {
    // Legacy told the two apart (`cProdCondition.ts:212` vs `:238`): SETUP
    // waits on the CLIENT, and there is a form to press; ACTIVATION waits on
    // us, and there is nothing for them to do but read it.
    if (isEmpty(product.provisioning.fields)) {
      return {
        title: "Awaiting activation",
        message:
          "This product is awaiting activation and should be ready soon.",
        tone: "info",
        action: undefined
      };
    }
    return {
      title: "Setup is waiting on you",
      message: "We need a few details before this product can go live.",
      tone: "warning",
      action: {
        value: mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `${base}/${PRODUCT_AREA_SLUG.SETUP}`
        ),
        label: "Complete setup"
      }
    };
  }
  if (product.status === ContractStatusCodes.SUSPENDED) {
    return {
      title: "Suspended",
      message:
        "This product is suspended while an invoice on it is unpaid. Settling it restores service.",
      tone: "danger",
      action: {
        value: mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `/billing/invoices?status=${INVOICE_STATUS_TAB.UNPAID}`
        ),
        label: "View invoices"
      }
    };
  }
  // A cancellation the client LODGED may still be called off; one the brand
  // has accepted only reports itself, which the billing area does.
  const request = product.cancellationRequest;
  // A cancellation SCHEDULED for a future day is its own reading
  // (`cProdCondition.ts:157`): the product is still running, and what the
  // client needs is the day it stops — not the day they asked.
  if (
    request?.status ===
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION &&
    request.acceptedAt === undefined &&
    // Legacy claimed this reading only once the DAY was loaded
    // (`cProdCondition.ts:150-160`): a booking with no date yet has nothing to
    // name, so it falls through and reads as merely lodged.
    request.cancelAt !== undefined
  ) {
    return {
      title: "Scheduled for cancellation",
      message: `This product is scheduled to be cancelled on ${request.cancelAt}.${cancellationDetails(request)}`,
      tone: "warning",
      action: {
        value: mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, product.id),
        label: "Don't cancel"
      }
    };
  }
  if (request !== undefined && request.acceptedAt === undefined) {
    return {
      title: "Cancellation requested",
      message: `${lodgedCancellationLine(request)}${cancellationDetails(request)}`,
      tone: "warning",
      action: {
        value: mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, product.id),
        label: "Don't cancel"
      }
    };
  }
  if (product.autoExpireAt !== undefined) {
    return {
      title: "Scheduled to cancel",
      message: `This product cancels on ${product.autoExpireAt}.`,
      tone: "warning",
      action: {
        value: mockActionValue(MOCK_ACTION.DISABLE_AUTO_EXPIRE, product.id),
        label: "Don't cancel"
      }
    };
  }
  // Nothing is scheduled against it, but nothing renews it either — the
  // control that answers that is the renewal switch, not a cancellation.
  const expiresAtTerm =
    product.status === ContractStatusCodes.ACTIVE &&
    product.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION &&
    !product.autoRenew &&
    product.nextDueDate !== undefined;
  if (expiresAtTerm) {
    return {
      title: "Ends at the end of the term",
      message: `Automatic renewal is off, so this product ends on ${product.nextDueDate}.`,
      tone: "warning",
      action: {
        value: mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id),
        label: "Keep renewing"
      }
    };
  }
  return productStandingCondition(data, product, base);
}

/**
 * The readings a product in GOOD standing takes — legacy drew a banner on
 * every product, not only the ones with something wrong
 * (`cProdCondition.ts:36-511`). They come last, so anything the client can
 * act on is said first.
 */
function productStandingCondition(
  data: MockDataset,
  product: MockProduct,
  base: string
): ProductCondition | undefined {
  if (product.status === ContractStatusCodes.CANCELLED) {
    return {
      title: "Cancelled",
      message: `This product was cancelled on ${product.cancelledAt ?? product.createdAt}.`,
      tone: "neutral",
      action: undefined
    };
  }
  if (product.status === ContractStatusCodes.CLOSED) {
    return {
      title: "Lapsed",
      message: `This product closed on ${product.cancelledAt ?? product.createdAt} and is no longer running.`,
      tone: "neutral",
      action: undefined
    };
  }
  // A trial that simply stops is not a cancellation to argue with — it is a
  // date, and the trial banner above carries the way to end it early.
  if (product.trialEndsAt !== undefined && isTrialAhead(product)) {
    return {
      title: "On trial",
      message: `The free trial on this product ends on ${product.trialEndsAt}.`,
      tone: "info",
      action: undefined
    };
  }
  if (productHasUnpaidInvoicesFor(data, product)) {
    return {
      title: "An invoice is still owed",
      message:
        "Something raised against this product has not been settled yet.",
      tone: "warning",
      action: {
        value: mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `/billing/invoices?status=${INVOICE_STATUS_TAB.UNPAID}`
        ),
        label: "View invoices"
      }
    };
  }
  if (product.status !== ContractStatusCodes.ACTIVE) return undefined;
  // A ONE-TIME purchase has nothing to renew: it was fulfilled, and the day
  // it went live is the fact worth stating.
  if (product.billingType === MOCK_BILLING_TYPE.ONE_TIME) {
    return {
      title: "Active",
      message: `This product was activated on ${product.createdAt}.`,
      tone: "success",
      action: undefined
    };
  }
  if (product.autoRenew && product.nextDueDate !== undefined) {
    return {
      title: "Active",
      message: `This product renews automatically. The next invoice is raised on ${product.nextDueDate}.`,
      tone: "success",
      action: {
        value: mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `${base}/${PRODUCT_AREA_SLUG.BILLING}`
        ),
        label: "View billing"
      }
    };
  }
  return {
    title: "Active",
    message: "This product is running.",
    tone: "success",
    action: undefined
  };
}

/** Whether anything raised against THIS product is still owed. */
function productHasUnpaidInvoicesFor(
  data: MockDataset,
  product: MockProduct
): boolean {
  return some(
    data.invoices,
    invoice =>
      invoice.productId === product.id &&
      includes(InvoiceStatusGroups.UNPAID, invoice.status)
  );
}

export function productHasCondition(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return productCondition(data, context) !== undefined;
}

export function productConditionTitle(
  data: MockDataset,
  context: DataRouteContext
): string {
  return productCondition(data, context)?.title ?? "";
}

export function productConditionMessage(
  data: MockDataset,
  context: DataRouteContext
): string {
  return productCondition(data, context)?.message ?? "";
}

export function productConditionTone(
  data: MockDataset,
  context: DataRouteContext
): BannerModuleProps["tone"] {
  return productCondition(data, context)?.tone;
}

export function productConditionAction(
  data: MockDataset,
  context: DataRouteContext
): BannerModuleProps["action"] {
  return productCondition(data, context)?.action;
}

/** The brand's own words about this product, as authored markdown. */
export function productAboutMarkdown(
  data: MockDataset,
  context: DataRouteContext
): string {
  return contextProduct(data, context)?.description ?? "";
}

export function productHasAbout(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return productAboutMarkdown(data, context) !== "";
}

/** Legacy's support gate, as data: the whole support pillar is off for this brand. */
export function isSupportEnabled(data: MockDataset): boolean {
  return !data.features.DISABLE_SUPPORT_SYSTEM;
}

/**
 * The assistance panel's control — legacy pre-selected the product it was
 * opened from, which is what the query carries.
 */
export function productSupportAction(
  data: MockDataset,
  context: DataRouteContext
): string | undefined {
  const product = contextProduct(data, context);
  if (product === undefined) return undefined;
  if (!isSupportEnabled(data)) return undefined;
  return mockActionValue(
    MOCK_ACTION.NAVIGATE,
    `/support/tickets/new?product=${product.id}`
  );
}

// --- products: the provider surface (plan Phase 3; legacy cProdProv*)

/** This product's provisioning surface, as the facade composes it. */
function provisioning(
  data: MockDataset,
  context: DataRouteContext
): MockProvisioningView {
  if (context.productId === undefined) {
    return { fields: [], functions: [], iframes: [] };
  }
  return useMockProvisioning(data, context.productId).useContext().data.value;
}

/**
 * The provisioning details — what the provider handed back. Every value is
 * copyable, because a hostname or a username exists to be pasted somewhere
 * else, and a flagged one is masked until it is asked for (plan R13).
 */
export function productProvisionFieldItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  return map(provisioning(data, context).fields, field => ({
    id: field.code,
    label: field.label,
    // A blueprint answer may be a number or a tick box (`MockProvisionField`);
    // the row prints whatever the provider stored.
    value: toString(field.value),
    copyable: true,
    secret: field.secret
  }));
}

export function productHasProvisionFields(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return size(provisioning(data, context).fields) > 0;
}

/** One provider function, as a control: the product and the code the facade runs. */
function provisionAction(
  productId: string,
  entry: MockProvisionFunction
): ButtonModuleAction {
  return {
    value: mockActionValue(
      MOCK_ACTION.RUN_PROVISION_FUNCTION,
      `${productId}:${entry.code}`
    ),
    label: entry.label
  };
}

export function productProvisionActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  const productId = context.productId;
  if (productId === undefined) return [];
  return map(provisioning(data, context).functions, entry =>
    provisionAction(productId, entry)
  );
}

export function productHasProvisionActions(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return size(provisioning(data, context).functions) > 0;
}

/** The sidebar's quick actions — the functions the provider FEATURED, and only those. */
export function productQuickActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  const productId = context.productId;
  if (productId === undefined) return [];
  return map(
    filter(provisioning(data, context).functions, { highlighted: true }),
    entry => provisionAction(productId, entry)
  );
}

export function productHasQuickActions(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return (
    size(filter(provisioning(data, context).functions, { highlighted: true })) >
    0
  );
}

/** The provider panels on screen — the seeded ones, plus whatever a function has opened. */
export function productProvisionFrames(
  data: MockDataset,
  context: DataRouteContext
): ProseModuleFrame[] {
  return map(provisioning(data, context).iframes, frame => ({
    title: frame.title,
    url: frame.url
  }));
}

export function productHasProvisionFrames(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return size(provisioning(data, context).iframes) > 0;
}

// --- notes & secrets (plan Phase 3/4; legacy's vault, gated)

/**
 * One control that opens a registered form (plan F2). An entity id addresses
 * what the form is ABOUT — the row an edit opens on, or the product an add is
 * scoped to (`mock/forms/registry.ts`).
 */
function openFormValue(form: FormId, entityId?: string): string {
  if (entityId === undefined) {
    return mockActionValue(MOCK_ACTION.OPEN_FORM, form);
  }
  return mockActionValue(MOCK_ACTION.OPEN_FORM, `${form}:${entityId}`);
}

/** The brand's notes-and-secrets gate, as data — both panels ride it. */
export function areNotesEnabled(data: MockDataset): boolean {
  return data.features.CLIENT_NOTES_AND_SECRETS_ENABLED;
}

/**
 * One vault row. A secret renders masked with its own reveal and copy (plan
 * R13); a note reads plainly. Both carry the two things a client may do with
 * one without a form: delete it, or move it to the other panel.
 */
function vaultListItem(
  data: MockDataset,
  asset: MockVaultAsset
): ListModuleItem {
  let convertLabel = "Convert to secret";
  let icon = NotebookPen;
  let editForm: FormId = FORM_ID.VAULT_NOTE_UPDATE;
  if (asset.encrypted) {
    convertLabel = "Convert to note";
    icon = KeyRound;
    editForm = FORM_ID.VAULT_SECRET_UPDATE;
  }
  return {
    id: asset.id,
    title: asset.label,
    description: asset.note,
    secret: asset.encrypted,
    leadingIcon: icon,
    tags: vaultRowTags(asset),
    category: vaultAuthorLine(asset),
    moreActions: [
      {
        value: openFormValue(editForm, asset.id),
        label: "Edit"
      },
      {
        value: mockActionValue(MOCK_ACTION.VAULT_PIN, asset.id),
        label: pinLabel(asset),
        disabledReason: vaultLockedReason(data)
      },
      {
        value: mockActionValue(MOCK_ACTION.VAULT_CONVERT, asset.id),
        label: convertLabel
      },
      {
        value: mockActionValue(MOCK_ACTION.VAULT_REMOVE, asset.id),
        label: "Delete"
      }
    ]
  };
}

/** Legacy's own pin control reads as one label or the other, never both. */
function pinLabel(asset: MockVaultAsset): string {
  if (asset.pinned === true) return "Unpin";
  return "Pin";
}

/** A pinned row says so where it sits, so the order it keeps is legible. */
function vaultRowTags(asset: MockVaultAsset): ListModuleItem["tags"] {
  if (asset.pinned !== true) return undefined;
  return [{ label: "Pinned" }];
}

/**
 * Why nothing on this row may be moved, or undefined when it may — legacy
 * disabled the whole panel while the account was a staged import
 * (`clientVaultAssetsModal.vue:10`).
 */
function vaultLockedReason(data: MockDataset): string | undefined {
  if (!isStagedImport(data)) return undefined;
  return MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.STAGED_IMPORT];
}

/**
 * Legacy's `vaultAssetAuthorSummary` — who wrote the row and when, and who
 * last changed it. A row nobody has edited names only its author, which is
 * the branch legacy's own `!!editor` ternary chose between.
 */
function vaultAuthorLine(asset: MockVaultAsset): string | undefined {
  if (asset.authorName === undefined) return undefined;
  const written = `${asset.authorName} · ${asset.created_at.slice(0, ISO_DATE_LENGTH)}`;
  if (asset.editorName === undefined) return written;
  return `${written} · edited by ${asset.editorName} · ${asset.updated_at.slice(0, ISO_DATE_LENGTH)}`;
}

/**
 * The account's own pair of Add controls. Both panels' rows are scoped to no
 * product, so the form they open is scoped the same way (`mock/actions.ts`
 * vault grammar).
 */
export function accountNoteActions(): ButtonModuleAction[] {
  return [
    { value: openFormValue(FORM_ID.VAULT_NOTE_CREATE), label: "Add note" }
  ];
}

export function accountSecretActions(): ButtonModuleAction[] {
  return [
    { value: openFormValue(FORM_ID.VAULT_SECRET_CREATE), label: "Add secret" }
  ];
}

/** The account's own notes — the rows scoped to no product. */
export function accountNoteItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = accountNotesCollection.resolve(data).useContext();
  return map(rows.value, asset => vaultListItem(data, asset));
}

/** The account's own secrets — masked until asked for. */
export function accountSecretItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = accountSecretsCollection.resolve(data).useContext();
  return map(rows.value, asset => vaultListItem(data, asset));
}

/** This product's own vault rows, either side of the note/secret axis. */
function productVaultAssets(
  data: MockDataset,
  context: DataRouteContext,
  encrypted: boolean
): MockVaultAsset[] {
  if (context.productId === undefined) return [];
  // Pinned first, exactly as the account's own panels order them.
  return pinnedFirst(
    filter(
      data.vault,
      asset =>
        asset.contract_product_id === context.productId &&
        asset.encrypted === encrypted
    )
  );
}

export function productNoteItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  return map(productVaultAssets(data, context, false), asset =>
    vaultListItem(data, asset)
  );
}

export function productSecretItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  return map(productVaultAssets(data, context, true), asset =>
    vaultListItem(data, asset)
  );
}

/**
 * This product's own Add controls. The product rides in the form's entity id,
 * so the row it creates is attached to this product rather than the account —
 * a route that names no product offers no control at all.
 */
function productVaultActions(
  context: DataRouteContext,
  form: FormId,
  label: string
): ButtonModuleAction[] {
  if (context.productId === undefined) return [];
  return [{ value: openFormValue(form, context.productId), label }];
}

export function productNoteActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  return productVaultActions(context, FORM_ID.VAULT_NOTE_CREATE, "Add note");
}

export function productSecretActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  return productVaultActions(
    context,
    FORM_ID.VAULT_SECRET_CREATE,
    "Add secret"
  );
}

// --- products: the billing ledgers (plan R6 discriminator `productId`)

/** This product's own invoices — the billing ledger's rows, narrowed to it. */
export function productInvoiceItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = productInvoicesCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, invoice => invoiceListItem(data, invoice));
}

/** This product's own credit notes. */
export function productCreditNoteItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = productCreditNotesCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, creditNoteListItem);
}

// --- products: the subscription lifecycle (plan Phase 3; legacy cProdBilling)

/** What the configured product actually charges for, line by line — legacy's breakdown. */
export function productLineItemSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  return map(product.lineItems, line => ({
    id: line.id,
    label: line.description,
    value: line.amount.formatted
  }));
}

/** Legacy gated its whole manage-subscription band on there being a subscription. */
export function productIsSubscription(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const product = contextProduct(data, context);
  if (product === undefined) return false;
  return product.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION;
}

/**
 * The manage-subscription controls — legacy's own band: end the trial while
 * one is running, and change the product where the brand offers somewhere to
 * go. A control the client cannot use right now stays on screen and says why
 * (the dispatcher's own refusal wording), rather than vanishing.
 *
 * Lodging a cancellation is a FORM — a reason and its custom fields — so it
 * has no control here (gap doc §2, tier C).
 */
export function productManageActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  if (product.billingType !== MOCK_BILLING_TYPE.SUBSCRIPTION) return [];
  return compact([
    isTrialAhead(product) && {
      value: mockActionValue(MOCK_ACTION.END_TRIAL, product.id),
      label: "End trial early"
    },
    canOfferMigration(product) && {
      value: mockActionValue(MOCK_ACTION.MIGRATE_PRODUCT, product.id),
      label: "Upgrade / downgrade",
      disabledReason: migrationDisabledReason(product)
    },
    canAskToCancel(product) && {
      value: mockActionValue(
        MOCK_ACTION.OPEN_FORM,
        `${FORM_ID.PRODUCT_CANCEL_REQUEST}:${product.id}`
      ),
      label: "Cancellation options",
      disabledReason: cancellationDisabledReason(data, product)
    }
  ]);
}

/**
 * Whether there is a cancellation to ask for — legacy gated the control on
 * exactly this: a running subscription with nothing already lodged against
 * it. A product that has stopped has nothing left to stop.
 */
function canAskToCancel(product: MockProduct): boolean {
  const hasRequest = product.cancellationRequest !== undefined;
  const hasStopped = product.status === ContractStatusCodes.CANCELLED;
  return !hasRequest && !hasStopped;
}

/** Why the cancellation control is not live, in the same words its refusal would use. */
/** Legacy's three reasons the cancellation control is dead, in the words its refusal would use. */
function cancellationDisabledReason(
  data: MockDataset,
  product: MockProduct
): string | undefined {
  if (product.canCancel === false) {
    return MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.CANCELLATION_FORBIDDEN];
  }
  if (product.pendingProRata) {
    return MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.PRO_RATA_PENDING];
  }
  if (hasOverdueInvoice(data, product)) {
    return MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.OVERDUE_INVOICES];
  }
  return undefined;
}

function hasOverdueInvoice(data: MockDataset, product: MockProduct): boolean {
  return some(
    data.invoices,
    invoice =>
      invoice.productId === product.id &&
      includes(InvoiceStatusGroups.UNPAID, invoice.status) &&
      invoice.dueDate < today()
  );
}

/** Why the change control is not live, in the same words its refusal would use. */
function migrationDisabledReason(product: MockProduct): string | undefined {
  const reason = migrationRefusal(product);
  if (reason === undefined) return undefined;
  return MOCK_REFUSAL_MESSAGE[reason];
}

/** The change picker's rows — where this product may go, and what each costs. */
export function productMigrationItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  return map(orderedMigrationOptions(data, product), option => ({
    id: option.id,
    title: option.name,
    description: option.shortDescription,
    category: option.category,
    trailingText: migrationPriceLabel(data, option),
    action: {
      value: mockActionValue(
        MOCK_ACTION.MIGRATE_PRODUCT,
        `${product.id}:${option.id}`
      ),
      label: "Change to this"
    },
    // Legacy's `_action.review_changes` — what the change buys, read BEFORE
    // it is chosen. It asks nothing back, so it answers with prose.
    moreActions: [
      {
        value: mockActionValue(
          MOCK_ACTION.MIGRATION_REVIEW,
          `${product.id}:${option.id}`
        ),
        label: "Review changes"
      }
    ]
  }));
}

export function productHasMigrationOptions(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const product = contextProduct(data, context);
  if (product === undefined) return false;
  return canOfferMigration(product);
}

/** A cancellation the brand has ACCEPTED — its dates and the reason given, and nothing to do about it. */
export function productHasAcceptedCancellation(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return acceptedCancellation(data, context) !== undefined;
}

export function productAcceptedCancellationMessage(
  data: MockDataset,
  context: DataRouteContext
): string {
  const request = acceptedCancellation(data, context);
  if (request === undefined) return "";
  return `Requested on ${request.requestedAt} and accepted on ${request.acceptedAt}: "${request.reason}".${cancellationDetails(request)}`;
}

/**
 * What the client told the brand on the way out, appended to whichever
 * cancellation banner is showing — the answers are kept on the request
 * (`MockCancellationRequest.fields`), so a brand that asked nothing adds
 * nothing.
 */
/**
 * What a LODGED cancellation says. Two sentences, not one with a hole in it:
 * a request the brand has not dated yet reports the day it was ASKED and
 * stops, because "effective undefined" is a word nobody wrote.
 */
function lodgedCancellationLine(request: MockCancellationRequest): string {
  if (request.cancelAt === undefined) {
    return `Cancellation requested on ${request.requestedAt}.`;
  }
  return `Cancellation requested on ${request.requestedAt}, effective ${request.cancelAt}.`;
}

function cancellationDetails(request: MockCancellationRequest): string {
  if (isEmpty(request.fields)) return "";
  const answers = map(
    request.fields,
    field => `${field.label}: ${field.value}`
  );
  return ` Details — ${answers.join("; ")}.`;
}

function acceptedCancellation(
  data: MockDataset,
  context: DataRouteContext
): MockCancellationRequest | undefined {
  const request = contextProduct(data, context)?.cancellationRequest;
  if (request?.acceptedAt === undefined) return undefined;
  return request;
}

/** A change already made whose pro-rata adjustment is still landing — legacy's own warning. */
export function productHasPendingProRata(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return contextProduct(data, context)?.pendingProRata === true;
}

/** An event that has PASSED reads as a warning; one still coming reads as information. */
/**
 * Legacy's timeline links, one per event that the client can still change:
 * raise the renewal invoice yourself, turn automatic renewal back on, or call
 * off a scheduled termination.
 */
function lifecycleAction(
  product: MockProduct,
  event: MockProductEvent
): TimelineModuleItem["action"] {
  switch (event.id) {
    case PRODUCT_EVENT_ID.NEXT_INVOICE:
      return {
        value: mockActionValue(MOCK_ACTION.CREATE_RENEWAL_INVOICE, product.id),
        label: renewalInvoiceLabel(product)
      };
    case PRODUCT_EVENT_ID.AUTO_RENEW_OFF:
      return {
        value: mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id),
        label: "Turn on auto-renew"
      };
    case PRODUCT_EVENT_ID.TERMINATED:
      return {
        value: mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, product.id),
        label: "Don't cancel"
      };
    default:
      return undefined;
  }
}

function lifecycleTone(event: MockProductEvent): TimelineTone {
  if (event.isPast) return "warning";
  return "info";
}

/** The automation standing against this product — legacy's cProdTimeline. */
export function productTimelineItems(
  data: MockDataset,
  context: DataRouteContext
): TimelineModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  const scheduled = map(product.scheduledActions, action => ({
    id: action.id,
    title: action.label,
    description: SCHEDULED_ACTION_STATUS_LABEL[action.status],
    datetime: action.scheduledAt,
    tone: SCHEDULED_ACTION_STATUS_TONE[action.status]
  }));
  // The lifecycle events the product's own dates imply, beside the actions
  // the desk scheduled against it — one rail, ordered by when.
  const lifecycle = map(productLifecycleEvents(data, product), event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    datetime: event.datetime,
    to: event.to,
    // What has already happened reads as a warning; what is coming reads as
    // information — legacy's own future-vs-overdue split.
    tone: lifecycleTone(event),
    action: lifecycleAction(product, event)
  }));
  const rail: TimelineModuleItem[] = [...lifecycle, ...scheduled];
  // Two passes, one fact each: the dated events take their place on the rail,
  // and the undated ones follow. An event with no day is not positioned, and
  // it must not borrow a neighbour's place either.
  const dated = filter(rail, entry => entry.datetime !== undefined);
  const undated = filter(rail, entry => entry.datetime === undefined);
  return [...sortBy(dated, "datetime"), ...undated];
}

/**
 * A one-time purchase schedules nothing, and a trial already counting down to
 * its own expiry has one story, not two — legacy suppressed the feed there.
 */
/**
 * Whether the page DRAWS that rail. One derivation behind both refs: the gate
 * asks the same rows the items ref renders, so what draws and what is drawn
 * can never disagree — gating on the scheduled actions alone drew nothing on
 * 38 of the 39 seeded products.
 *
 * The two suppressions are the PAGE's, not the rows': a one-time purchase has
 * no lifecycle to report, and a trial counting down to its own expiry says so
 * in its banner instead, but both still derive their rows for any other
 * reader.
 */
export function productHasTimeline(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const product = contextProduct(data, context);
  if (product === undefined) return false;
  const isSubscription = product.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION;
  const isExpiringTrial =
    product.trialEndsAt !== undefined && product.autoExpireAt !== undefined;
  if (!isSubscription || isExpiringTrial) return false;
  return !isEmpty(productTimelineItems(data, context));
}

// --- products: the settings area (plan Phase 3; legacy cProdSettings)

/**
 * The client's own label for this product, as a form (plan F4). Four refs
 * rather than one bag, because the `form` module takes four props and the
 * data-ref seam binds prop by prop — the submit among them, because an inline
 * form has to carry the product it stands on.
 */
export function productLabelFormSchema(): JsonSchema {
  return useLabelSchema();
}

export function productLabelFormUischema(): UISchemaElement {
  return useLabelUischema();
}

export function productLabelFormModel(
  data: MockDataset,
  context: DataRouteContext
): FormModel {
  return labelDefaults(contextProduct(data, context)?.customLabel);
}

export function productLabelFormSubmit(
  data: MockDataset,
  context: DataRouteContext
): string {
  return productFormSubmit(MOCK_ACTION.PRODUCT_LABEL_SAVE, data, context);
}

/** One product form's submit verb, already carrying the product it stands on. */
function productFormSubmit(
  action: MockAction,
  data: MockDataset,
  context: DataRouteContext
): string {
  const product = contextProduct(data, context);
  if (product === undefined) return action;
  return mockActionValue(action, product.id);
}

/**
 * The setup blueprint as a form — legacy's `cProdProvConfigManageForm`:
 * one control per field the provider asks for, confirmed in one step.
 */
export function productSetupFormSchema(
  data: MockDataset,
  context: DataRouteContext
): JsonSchema {
  return useSetupSchema(contextProvisionFields(data, context));
}

export function productSetupFormUischema(
  data: MockDataset,
  context: DataRouteContext
): UISchemaElement {
  return useSetupUischema(contextProvisionFields(data, context));
}

export function productSetupFormModel(
  data: MockDataset,
  context: DataRouteContext
): FormModel {
  return setupDefaults(contextProvisionFields(data, context));
}

export function productSetupFormSubmit(
  data: MockDataset,
  context: DataRouteContext
): string {
  return productFormSubmit(MOCK_ACTION.PRODUCT_SETUP_SAVE, data, context);
}

function contextProvisionFields(
  data: MockDataset,
  context: DataRouteContext
): MockProduct["provisioning"]["fields"] {
  return contextProduct(data, context)?.provisioning.fields ?? [];
}

/**
 * This product's invoice-consolidation preference, as a form — legacy's
 * `cProdInvoiceConsolidationComp`.
 */
export function productConsolidationFormSchema(): JsonSchema {
  return useConsolidationSchema();
}

export function productConsolidationFormUischema(): UISchemaElement {
  return useConsolidationUischema();
}

export function productConsolidationFormModel(
  data: MockDataset,
  context: DataRouteContext
): FormModel {
  const product = contextProduct(data, context);
  return consolidationDefaults(
    product?.invoiceConsolidation ?? InvoiceConsolidationTypes.INHERIT
  );
}

export function productConsolidationFormSubmit(
  data: MockDataset,
  context: DataRouteContext
): string {
  return productFormSubmit(
    MOCK_ACTION.PRODUCT_CONSOLIDATION_SAVE,
    data,
    context
  );
}

/**
 * Whether this client may set consolidation at all — the brand has to run it,
 * and it has to be the client's to set rather than the desk's
 * (`BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF`).
 */
export function productHasConsolidationForm(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const brandConsolidates = data.features.INVOICE_CONSOLIDATION_ENABLED;
  const clientMaySet = !data.features.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF;
  const hasProduct = contextProduct(data, context) !== undefined;
  return hasProduct && brandConsolidates && clientMaySet;
}

/** What the row already in use wears instead of a control. */
const CURRENT_TAG: ListModuleItem["tags"] = [{ label: "Current" }];

/**
 * The renewal controls — the switch, and the invoice a client who turned it
 * off may still raise themselves. Where the brand holds renewal on, or the
 * product is already scheduled to cancel, there is nothing to switch and the
 * notice below says so instead.
 */
export function productAutoRenewItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  if (!productHasAutoRenewControls(data, context)) return [];
  return compact([
    {
      id: "auto-renew",
      title: "Auto-renew",
      description: "Renew this product automatically when its term is up.",
      toggle: {
        value: mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id),
        checked: product.autoRenew,
        label: "Auto-renew"
      }
    },
    !product.autoRenew && {
      id: "renewal-invoice",
      title: "Renew it yourself",
      description:
        "Raise the next invoice now and settle it when you are ready.",
      action: {
        value: mockActionValue(MOCK_ACTION.CREATE_RENEWAL_INVOICE, product.id),
        label: renewalInvoiceLabel(product)
      }
    }
  ]);
}

/**
 * What raising the invoice is CALLED, which depends on whether the renewal
 * has already passed: legacy's own pair off `nextInvoiceDateInFuture`
 * (`cProdProvider.vue:571-573`). A date that has been and gone raises a LATE
 * invoice, and says so.
 */
function renewalInvoiceLabel(product: MockProduct): string {
  const isDueLater =
    product.nextDueDate !== undefined && product.nextDueDate >= today();
  if (isDueLater) return "Issue next invoice";
  return "Create late renewal invoice";
}

export function productHasAutoRenewControls(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const product = contextProduct(data, context);
  if (product === undefined) return false;
  return product.canDisableAutoRenew && product.autoExpireAt === undefined;
}

/** Why there is no switch — legacy's suppressed-state reason, in the client's words. */
export function productAutoRenewNotice(
  data: MockDataset,
  context: DataRouteContext
): string {
  const product = contextProduct(data, context);
  if (product === undefined) return "";
  if (product.autoExpireAt !== undefined) {
    return `This product is set to cancel on ${product.autoExpireAt}, so it will not renew.`;
  }
  if (!product.canDisableAutoRenew) {
    return "This product renews automatically and that cannot be turned off here.";
  }
  return "";
}

export function productHasAutoRenewNotice(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return productAutoRenewNotice(data, context) !== "";
}

/** Renewal is on, and something on this product is still owed — legacy said so here. */
/**
 * How loudly the unpaid-invoice notice reads. Legacy told two states apart: a
 * SUSPENDED product, or one whose invoice has already fallen due, is not the
 * same warning as one merely waiting to be paid.
 */
export function productUnpaidInvoiceTone(
  data: MockDataset,
  context: DataRouteContext
): AlertProps["variant"] {
  const product = contextProduct(data, context);
  if (product === undefined) return "warning";
  const isSuspended = product.status === ContractStatusCodes.SUSPENDED;
  const hasOverdue = some(
    data.invoices,
    invoice =>
      invoice.productId === product.id &&
      includes(InvoiceStatusGroups.UNPAID, invoice.status) &&
      invoice.dueDate < today()
  );
  if (isSuspended || hasOverdue) return "danger";
  return "warning";
}

export function productHasUnpaidInvoices(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const product = contextProduct(data, context);
  if (product === undefined) return false;
  if (!product.autoRenew) return false;
  return some(
    data.invoices,
    invoice =>
      invoice.productId === product.id &&
      includes(InvoiceStatusGroups.UNPAID, invoice.status)
  );
}

/** Which address this product is invoiced to; absent falls back to the client's default. */
function productAddress(
  data: MockDataset,
  product: MockProduct
): MockAddress | undefined {
  if (product.billingAddressId === undefined) {
    return find(data.addresses, address => address.meta?.isDefault === true);
  }
  return find(data.addresses, { id: product.billingAddressId });
}

export function productBillingAddressSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  const address = productAddress(data, product);
  if (address === undefined) return [];
  return [
    {
      id: "billing-address",
      label: "Invoiced to",
      value: compact([address.name, address.description]).join(" · ")
    }
  ];
}

/** Every address the client keeps, plus the way to add one — legacy's picker. */
export function productAddressItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  const current = productAddress(data, product);
  const rows = map(data.addresses, address => {
    const row: ListModuleItem = {
      id: address.id,
      title: address.name ?? address.title ?? address.id,
      description: address.description
    };
    if (address.id === current?.id)
      return assign({}, row, { tags: CURRENT_TAG });
    return assign({}, row, {
      action: {
        value: mockActionValue(
          MOCK_ACTION.SET_PRODUCT_BILLING_ADDRESS,
          `${product.id}:${address.id}`
        ),
        label: "Use this address"
      }
    });
  });
  return [...rows, ADD_ADDRESS_ROW];
}

/**
 * Every COMPANY the client is invoiced as, plus the door to add one — legacy's
 * billing panel offered these beside the addresses, in one grid: a product is
 * invoiced to an address AS a party, and both are the client's to choose.
 */
export function productCompanyItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  const rows = map(data.companies, company => {
    const row: ListModuleItem = {
      id: company.id,
      title: company.name,
      description: companyDescription(company)
    };
    if (company.id === product.billingCompanyId) {
      return assign({}, row, { tags: CURRENT_TAG });
    }
    return assign({}, row, {
      action: {
        value: mockActionValue(
          MOCK_ACTION.SET_PRODUCT_BILLING_COMPANY,
          `${product.id}:${company.id}`
        ),
        label: "Invoice as this"
      }
    });
  });
  return [...rows, ADD_COMPANY_ROW];
}

/** The same door the account's own companies panel opens — one form, two placements. */
const ADD_COMPANY_ROW: ListModuleItem = {
  id: "add-company",
  title: "Add new company details",
  description: "Invoice this product as another business.",
  action: {
    value: openFormValue(FORM_ID.COMPANY_CREATE),
    label: "Add company"
  }
};

/** The address book itself lives on the profile — adding one is form work there. */
// Legacy's "create one from here": the profile's own add-address modal.
const ADD_ADDRESS_ROW: ListModuleItem = {
  id: "add-address",
  title: "Add a new address",
  description: "It joins the address book on your profile.",
  action: {
    value: openFormValue(FORM_ID.ADDRESS_CREATE),
    label: "Add a new address"
  }
};

/**
 * Who else may manage THIS product — legacy's per-product grant. A delegate
 * who holds the whole account already reaches it, so their row states that
 * rather than offering a switch that could not turn anything off.
 */
export function productDelegateAccessItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const product = contextProduct(data, context);
  if (product === undefined) return [];
  return map(data.delegates, delegate => {
    const row: ListModuleItem = {
      id: delegate.id,
      title: delegate.name,
      description: delegate.email,
      tags: delegateTags(delegate)
    };
    if (delegate.isFullDelegate === true) return row;
    return assign({}, row, {
      toggle: {
        value: mockActionValue(
          MOCK_ACTION.DELEGATE_TOGGLE_OBJECT,
          `${delegate.id}:${DelegateObjectTypes.CONTRACT_PRODUCT}:${product.id}`
        ),
        checked: hasDelegateObject(
          delegate,
          DelegateObjectTypes.CONTRACT_PRODUCT,
          product.id
        ),
        label: `Access to this product for ${delegate.name}`
      }
    });
  });
}

/** What is standing true of a delegate beside their access to this one product. */
function delegateTags(delegate: MockDelegate): ListModuleItem["tags"] {
  return compact([
    delegate.isFullDelegate === true && { label: "Full access" },
    delegate.status === MOCK_DELEGATE_STATUS.PENDING && {
      label: "Pending",
      tone: "warning"
    }
  ]);
}

// --- products: the order-complete state (plan Phase 3; legacy's own post-order screen)

/** The order just placed, where the listing's own query names one. */
function completedOrder(
  data: MockDataset,
  context: DataRouteContext
): MockOrder | undefined {
  if (context.orderComplete === undefined) return undefined;
  return find(data.orders, { id: context.orderComplete });
}

export function hasOrderComplete(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return completedOrder(data, context) !== undefined;
}

export function orderCompleteMessage(
  data: MockDataset,
  context: DataRouteContext
): string {
  const order = completedOrder(data, context);
  if (order === undefined) return "";
  return `Your order ${order.number} is complete — we're setting things up.`;
}

export function orderCompleteAction(
  data: MockDataset,
  context: DataRouteContext
): BannerModuleProps["action"] {
  const order = completedOrder(data, context);
  if (order === undefined) return undefined;
  return {
    value: mockActionValue(MOCK_ACTION.NAVIGATE, `/billing/orders/${order.id}`),
    label: "View order"
  };
}

/** Dismissing leaves the query behind — the band is the query, so the listing without it is the answer. */
export function orderCompleteDismiss(
  data: MockDataset,
  context: DataRouteContext
): string {
  return mockActionValue(MOCK_ACTION.NAVIGATE, `/${context.groupSlug ?? ""}`);
}

// --- billing pillar (plan Phase E; legacy src/views/client/billing)

/** All leads and IS the default here: a paid invoice is the client's own record, not noise. */
const INVOICE_TABS = [
  { value: INVOICE_STATUS_TAB.ALL, label: "All" },
  { value: INVOICE_STATUS_TAB.UNPAID, label: "Unpaid" },
  { value: INVOICE_STATUS_TAB.PAID, label: "Paid" },
  { value: INVOICE_STATUS_TAB.CREDITED, label: "Credited" }
];

/**
 * Legacy's `invoiceConsolidationMsg`, over the invoices listing: the brand
 * runs consolidation at all (`INVOICE_CONSOLIDATION_ENABLED`), it is the
 * client's to run rather than the desk's
 * (`INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF` off — the same pair
 * `productHasConsolidationForm` reads), and there is more than one document
 * to bring. The count is the message, so the three selectors read the same
 * set the write will gather.
 */
export function invoiceConsolidationVisible(data: MockDataset): boolean {
  const brandConsolidates = data.features.INVOICE_CONSOLIDATION_ENABLED;
  const clientMayConsolidate =
    !data.features.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF;
  const hasEnough = whyNotConsolidatable(data) === undefined;
  return brandConsolidates && clientMayConsolidate && hasEnough;
}

export function invoiceConsolidationMessage(data: MockDataset): string {
  if (!invoiceConsolidationVisible(data)) return "";
  const count = size(consolidatableInvoices(data));
  return `You have ${count} unpaid invoices that can be consolidated.`;
}

export function invoiceConsolidationAction(
  data: MockDataset
): BannerModuleProps["action"] {
  if (!invoiceConsolidationVisible(data)) return undefined;
  return {
    value: MOCK_ACTION.CONSOLIDATE_INVOICES,
    label: "Consolidate invoices"
  };
}

/**
 * The invoices for the showing tab — legacy's All/Unpaid/Paid/Credited
 * routes, as one list under a rail. An unpaid row keeps its Pay action and
 * its warning tone in EVERY tab, so the urgency does not depend on which one
 * is showing.
 */
export function invoiceItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = invoicesCollection.resolve(data, context).useContext();
  return map(rows.value, invoice => {
    // The panel tables its rows, so the amount is a column of its own and the
    // badge names the status — the dashboard's compact recents keep the amount
    // there, where there is no column to carry it.
    const row = invoiceListItem(data, invoice);
    const payable = payRowAction(invoice);
    if (payable === undefined) return row;
    return assign(row, { action: payable });
  });
}

export function invoiceTabs(): TabsModuleItem[] {
  return statusTabs("/billing/invoices", INVOICE_TABS);
}

export function invoiceStatus(
  data: MockDataset,
  context: DataRouteContext
): string {
  return showingStatus(
    context,
    map(INVOICE_TABS, "value"),
    INVOICE_STATUS_TAB.ALL
  );
}

/** The invoice document's header fields — legacy's invoice view. */
export function invoiceSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const invoice = find(data.invoices, { id: context.entityId ?? "" });
  if (invoice === undefined) return [];
  return [
    { id: "number", label: "Invoice", value: invoice.number },
    { id: "issued", label: "Issued", value: invoice.issuedDate },
    { id: "due", label: "Due", value: invoice.dueDate },
    {
      id: "status",
      label: "Status",
      value: INVOICE_STATUS_LABEL[invoice.status]
    },
    { id: "total", label: "Total", value: invoice.total.formatted }
  ];
}

/** The invoice document's line items — amounts pass through display-ready. */
export function invoiceLineItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const invoice = find(data.invoices, { id: context.entityId ?? "" });
  return map(invoice?.lines ?? [], line => ({
    id: line.id,
    title: line.description,
    trailingText: line.amount.formatted
  }));
}

function contextOrder(
  data: MockDataset,
  context: DataRouteContext
): MockOrder | undefined {
  return find(data.orders, { id: context.entityId ?? "" });
}

/** The order detail's summary fields — legacy ORDER_SUMMARY, plus its second-currency row. */
export function orderSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const order = contextOrder(data, context);
  if (order === undefined) return [];
  return compact([
    { id: "number", label: "Order", value: order.number },
    { id: "placed", label: "Placed", value: order.placedDate },
    {
      id: "status",
      label: "Status",
      value: ORDER_STATUS_LABEL[order.status]
    },
    { id: "total", label: "Total", value: order.total.formatted },
    // Legacy offered the same order in the brand's other trading currency
    // where it had a price in one; the figure is the seed's, never converted.
    order.alternateTotal !== undefined && {
      id: "alternate-total",
      label: `Pay in ${order.alternateTotal.currency}`,
      value: order.alternateTotal.formatted
    },
    { id: "products", label: "Products", value: order.productNames.join(", ") },
    order.cancellationReason !== undefined && {
      id: "cancellation-reason",
      label: "Cancellation reason",
      value: order.cancellationReason
    }
  ]);
}

/** The order's items — legacy's items table: what was bought, how many, at what rate. */
export function orderItemRows(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const order = contextOrder(data, context);
  if (order === undefined) return [];
  return map(order.items, item => ({
    id: item.id,
    title: item.name,
    leadingImageSrc: item.imageSrc,
    leadingIcon: Package,
    cells: [
      { value: item.unitPrice.formatted, numeric: true },
      { value: String(item.quantity), numeric: true },
      { value: item.total.formatted, numeric: true }
    ]
  }));
}

/** Every date the order collected — legacy showed the ones it had and no placeholders for the rest. */
export function orderDateSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const order = contextOrder(data, context);
  if (order === undefined) return [];
  const { dates } = order;
  return compact([
    { id: "created", label: "Created", value: dates.created },
    dates.due !== undefined && { id: "due", label: "Due", value: dates.due },
    dates.paid !== undefined && {
      id: "paid",
      label: "Paid",
      value: dates.paid
    },
    dates.refunded !== undefined && {
      id: "refunded",
      label: "Refunded",
      value: dates.refunded
    },
    dates.cancelled !== undefined && {
      id: "cancelled",
      label: "Cancelled",
      value: dates.cancelled
    }
  ]);
}

/** What the client told us with the order — their note, and the brand's own fields. */
export function orderDetailSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const order = contextOrder(data, context);
  if (order === undefined) return [];
  return compact([
    order.notes !== undefined && {
      id: "notes",
      label: "Notes",
      value: order.notes
    },
    ...map(order.customFields ?? [], (field, index) => ({
      id: `custom-${index}`,
      label: field.label,
      value: field.value
    }))
  ]);
}

/** Whether the order carries anything under "Details" at all. */
export function orderHasDetails(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return orderDetailSpecItems(data, context).length > 0;
}

/** The order's invoices — legacy ORDER_INVOICES, unpaid rows payable. */
export function orderInvoiceItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const invoices = filter(data.invoices, { orderId: context.entityId ?? "" });
  return map(invoices, invoice => {
    const item = invoiceListItem(data, invoice);
    const payable = payRowAction(invoice);
    if (payable === undefined) return item;
    return assign(item, { action: payable });
  });
}

/** The order's credit notes — legacy ORDER_CREDIT_NOTES, linked through the order's invoices. */
export function orderCreditNoteItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const invoiceNumbers = map(
    filter(data.invoices, { orderId: context.entityId ?? "" }),
    "number"
  );
  const notes = filter(data.creditNotes, note =>
    invoiceNumbers.includes(note.invoiceNumber ?? "")
  );
  return map(notes, creditNoteListItem);
}

/** The credit notes list — legacy CREDIT_NOTES. */
export function creditNoteListItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = creditNotesCollection.resolve(data).useContext();
  return map(rows.value, creditNoteListItem);
}

/** The credit note's fields — legacy CREDIT_NOTE view. */
export function creditNoteSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const note = find(data.creditNotes, { id: context.entityId ?? "" });
  if (note === undefined) return [];
  return compact([
    { id: "number", label: "Credit note", value: note.number },
    { id: "issued", label: "Issued", value: note.issuedDate },
    { id: "total", label: "Total", value: note.total.formatted },
    note.invoiceNumber !== undefined && {
      id: "invoice",
      label: "Against invoice",
      value: note.invoiceNumber
    }
  ]);
}

/** Whether the brand can store a card at all — legacy gated its Add CTA on exactly this. */
function hasStoredCardGateway(data: MockDataset): boolean {
  return some(data.gateways, { supportsStoredCards: true });
}

/** The other side of that gate — the row explaining why there is nothing to add to. */
export function hasNoStoredGateways(data: MockDataset): boolean {
  return !hasStoredCardGateway(data);
}

// --- account credit (plan Phase 2; legacy walletBalance.vue and its statements)

/** Legacy's per-currency wallet table — one row per currency the client holds credit in. */
export function walletBalanceItems(data: MockDataset): ListModuleItem[] {
  const { balances } = useMockWallet(data).useContext().data.value;
  return map(balances, balance => ({
    id: balance.currency,
    title: balance.currency,
    leadingIcon: Coins,
    cells: [{ value: balance.formatted, numeric: true }]
  }));
}

/**
 * The balances panel's own control (plan F12). A brand that does not let
 * clients add credit themselves keeps the control on screen and says why,
 * which is how legacy showed it — a CTA that vanishes reads as a portal that
 * lost it (gap-doc row X13).
 */
export function walletHeaderActions(data: MockDataset): ButtonModuleAction[] {
  return [
    {
      value: mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.WALLET_TOPUP),
      label: "Top up",
      disabledReason: topUpDisabledReason(data)
    }
  ];
}

function topUpDisabledReason(data: MockDataset): string | undefined {
  if (data.features.walletTopUpEnabled) return undefined;
  return "Talk to us and we will add credit to your account for you.";
}

/** The credit-limit panel's figures — the remaining headroom comes from the facade, never from here. */
export function walletCreditLimitSpecItems(
  data: MockDataset
): SpecModuleItem[] {
  const { creditLimit } = useMockWallet(data).useContext().data.value;
  if (creditLimit === undefined) return [];
  return [
    {
      id: "allowance",
      label: "Allowance",
      value: creditLimit.allowance.formatted
    },
    { id: "used", label: "Used", value: creditLimit.used.formatted },
    {
      id: "remaining",
      label: "Remaining",
      value: creditLimit.remaining.formatted
    }
  ];
}

/** How much of the allowance is spent — the meter's filled amount. */
export function walletCreditUsed(data: MockDataset): number {
  const { creditLimit } = useMockWallet(data).useContext().data.value;
  return creditLimit?.used.amount ?? 0;
}

/** The whole allowance — the meter's scale. */
export function walletCreditAllowance(data: MockDataset): number {
  const { creditLimit } = useMockWallet(data).useContext().data.value;
  return creditLimit?.allowance.amount ?? 0;
}

/** Whether the brand grants this client a limit at all — the panel's own presence. */
export function walletHasCreditLimit(data: MockDataset): boolean {
  return useMockWallet(data).useContext().data.value.creditLimit !== undefined;
}

/**
 * Whether the statements panel stands on this page at all — legacy hung its
 * "View credit statements" link off `hasCreditLimitAllowance`
 * (`account-credit/index.vue:44-47`), so an account the brand grants no limit
 * has no statements to offer.
 */
export function walletHasCreditStatements(data: MockDataset): boolean {
  return size(useMockWallet(data).useContext().data.value.statements) > 0;
}

/** One filed period as its row reads it — legacy's `_sentence.credit_limit.statement_period`. */
function statementPeriodLabel(statement: MockCreditStatementView): string {
  return `${statement.fromDate} to ${statement.toDate}`;
}

/**
 * The filed credit statements, newest first — legacy's `creditStatementsListing`
 * rows and its per-row download menu (`:82` PDF, `:88` CSV). Every figure on
 * the row arrives already worked out (`useMockWallet`); nothing is summed here.
 */
export function walletCreditStatementItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: periods } = creditStatementsCollection
    .resolve(data, context)
    .useContext();
  // The collection pages and orders the PERIODS; every figure printed beside
  // one is the facade's (plan R6), so each paged period is paired with the
  // view worked out for it.
  const views = useMockWallet(data).useContext().data.value.statements;
  return map(
    compact(map(periods.value, period => find(views, { id: period.id }))),
    statement => ({
      id: statement.id,
      title: statementPeriodLabel(statement),
      description: `Filed ${statement.createdAt}`,
      leadingIcon: FileText,
      cells: [
        { value: statement.opening.formatted, numeric: true },
        { value: statement.credits.formatted, numeric: true },
        { value: statement.debits.formatted, numeric: true },
        { value: statement.closing.formatted, numeric: true }
      ],
      moreActions: [
        {
          value: downloadValue(
            MOCK_DOCUMENT_KIND.CREDIT_STATEMENT,
            statement.id
          ),
          label: "Download PDF"
        },
        {
          value: mockActionValue(
            MOCK_ACTION.CREDIT_STATEMENT_CSV,
            statement.id
          ),
          label: "Download CSV"
        }
      ]
    })
  );
}

/**
 * The statement print view's own figures — the SAME four the panel's row
 * carries, so the page a download opens says exactly what the row said (plan
 * R11). A period the ledger never filed prints nothing, and the module's own
 * empty state says so.
 */
export function creditStatementSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const statement = find(
    useMockWallet(data).useContext().data.value.statements,
    { id: context.entityId ?? "" }
  );
  if (statement === undefined) return [];
  return [
    { id: "period", label: "Period", value: statementPeriodLabel(statement) },
    {
      id: "opening",
      label: "Opening balance",
      value: statement.opening.formatted
    },
    { id: "credits", label: "Credits", value: statement.credits.formatted },
    { id: "debits", label: "Debits", value: statement.debits.formatted },
    {
      id: "closing",
      label: "Closing balance",
      value: statement.closing.formatted
    }
  ];
}

/** The movements one filed period covers — the same rows its CSV carries. */
export function creditStatementMovementItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const statement = find(
    useMockWallet(data).useContext().data.value.statements,
    { id: context.entityId ?? "" }
  );
  return map(statement?.movements ?? [], movement => ({
    id: movement.id,
    title: movement.description,
    leadingIcon: Coins,
    cells: [
      { value: movement.date },
      { value: movement.amount.formatted, numeric: true },
      { value: movement.balanceAfter.formatted, numeric: true }
    ]
  }));
}

/**
 * The billing settings page's one form (plan F4) — legacy's two forms, saved
 * together. Three refs rather than one bag, because the `form` module takes
 * three props and the data-ref seam binds prop by prop.
 */
export function billingSettingsFormSchema(data: MockDataset): JsonSchema {
  return useBillingSettingsSchema(billingSettingsFormContext(data));
}

export function billingSettingsFormUischema(
  data: MockDataset
): UISchemaElement {
  return useBillingSettingsUischema(billingSettingsFormContext(data));
}

export function billingSettingsFormModel(data: MockDataset): FormModel {
  return billingSettingsDefaults(billingSettingsFormContext(data));
}

// --- billing documents (plan Phase 2; legacy invoiceItems.vue, the credit-note view)

/** An identifier reads with what it IS — a bare number on a document says nothing. */
function labelled(
  prefix: string,
  value: string | undefined
): string | undefined {
  if (value === undefined) return undefined;
  return `${prefix} ${value}`;
}

function partyBlock(label: string, party: MockParty): DocumentModulePartyBlock {
  return {
    label,
    name: party.name,
    company: party.company,
    taxNumber: labelled("VAT", party.taxNumber),
    registrationNumber: labelled("Reg.", party.registrationNumber),
    lines: party.lines
  };
}

/** Who raised the document, and who it was raised for — the brand is the dataset's, the client the document's own snapshot. */
function documentParty(
  data: MockDataset,
  address: MockParty
): DocumentModuleParty {
  return {
    brand: partyBlock("From", data.brand),
    client: partyBlock("Billed to", address)
  };
}

function documentLines(
  lines: readonly MockInvoiceLine[] | undefined
): DocumentModuleLine[] {
  return map(lines ?? [], line => ({
    id: line.id,
    description: line.description,
    quantity: quantityLabel(line.quantity),
    unit: line.unitPrice?.formatted,
    amount: line.amount.formatted
  }));
}

function quantityLabel(quantity: number | undefined): string | undefined {
  if (quantity === undefined) return undefined;
  return String(quantity);
}

/** A tax band reads with its rate — "VAT 20%", never a bare "VAT". */
function taxRow(tax: MockTaxLine): DocumentModuleTotal {
  return { label: `${tax.label} ${tax.rate}%`, value: tax.amount.formatted };
}

function discountRow(
  discount: MockMoney | undefined
): DocumentModuleTotal | undefined {
  if (discount === undefined) return undefined;
  return { label: "Discount", value: discount.formatted };
}

function documentPayments(
  payments: readonly MockDocumentPayment[]
): DocumentModulePayment[] {
  return map(payments, payment => ({
    id: payment.id,
    date: payment.date,
    method: payment.method,
    amount: payment.amount.formatted,
    status: {
      label: PAYMENT_STATUS_LABEL[payment.status],
      tone: PAYMENT_STATUS_TONE[payment.status]
    }
  }));
}

function contextInvoice(
  data: MockDataset,
  context: DataRouteContext
): MockInvoice | undefined {
  return find(data.invoices, { id: context.entityId ?? "" });
}

function contextCreditNote(
  data: MockDataset,
  context: DataRouteContext
): MockCreditNote | undefined {
  return find(data.creditNotes, { id: context.entityId ?? "" });
}

export function invoiceDocumentHeader(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleHeader | undefined {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return undefined;
  return {
    title: invoice.category,
    number: invoice.number,
    status: {
      label: INVOICE_STATUS_LABEL[invoice.status],
      tone: INVOICE_STATUS_TONE[invoice.status]
    },
    dates: compact([
      { id: "issued", label: "Issued", value: invoice.issuedDate },
      { id: "due", label: "Due", value: invoice.dueDate },
      invoice.datePaid !== undefined && {
        id: "paid",
        label: "Paid",
        value: invoice.datePaid
      }
    ])
  };
}

export function invoiceDocumentParty(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleParty | undefined {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return undefined;
  return documentParty(data, invoice.address);
}

export function invoiceDocumentLines(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleLine[] {
  return documentLines(contextInvoice(data, context)?.lines);
}

export function invoiceDocumentTotals(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleTotals | undefined {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return undefined;
  return {
    subtotal: { label: "Subtotal", value: invoice.subtotal.formatted },
    taxes: map(invoice.taxes, taxRow),
    discount: discountRow(invoice.discount),
    total: { label: "Total", value: invoice.total.formatted },
    paid: { label: "Paid", value: invoice.paidAmount.formatted },
    balance: { label: "Balance due", value: invoice.unpaidAmount.formatted }
  };
}

export function invoiceDocumentPayments(
  data: MockDataset,
  context: DataRouteContext
): DocumentModulePayment[] {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return [];
  // Money the system has recorded but has NOT received leaves the panel off
  // the page: legacy hid the paid figures from a client while an offline
  // payment cleared, so nobody read the document as settled
  // (`invoiceItems.vue:357-361`).
  if (isInvoiceClearing(invoice)) return [];
  return documentPayments(invoice.payments);
}

/**
 * Legacy's `delegatedObjectMsg` over a document that reached this client
 * through somebody else's account — the invoice, the credit note and the
 * order all draw it (`invoice/index.vue:19-24`, `credit-note/index.vue:11-16`,
 * `orderView.vue:22-27`), in one wording: it says whose the document is,
 * because the controls it withholds are withheld for that reason.
 */
function delegatedDocumentMessage(noun: string): DocumentModuleMessage {
  return {
    id: "delegated",
    tone: "info",
    title: "Shared with you",
    message: `This ${noun} belongs to an account you act for. You can read it, but its settings stay with the account that owns it.`
  };
}

/**
 * The word stamped across a settled document's amount-due block — legacy's
 * `invoicePaidStamp` (`invoiceItems.vue:279`). A document whose offline
 * payment is still CLEARING carries no stamp: the money has not landed, and
 * the system's "paid" is not the world's.
 */
export function invoiceDocumentPaidStamp(
  data: MockDataset,
  context: DataRouteContext
): string | undefined {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return undefined;
  // SETTLED, not merely "not owed": legacy stamped `isPaid && !isClearing`
  // (`invoiceItems.vue:279`), and a refunded or cancelled document is neither
  // owed nor paid — it was unwound, which is not the same fact.
  if (invoice.status !== InvoiceStatus.PAID) return undefined;
  if (isInvoiceClearing(invoice)) return undefined;
  return "Paid";
}

/**
 * The labelled facts printed under an invoice — the client's own custom
 * fields, the document's, and the brand's meta-data, in legacy's own order
 * (`invoiceDetails.vue:161-184`). A document carrying none prints no well at
 * all, and a CREDIT NOTE never prints one.
 */
export function invoiceDocumentDetails(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleTotal[] {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return [];
  return map(
    [
      ...(invoice.clientFields ?? []),
      ...(invoice.customFields ?? []),
      ...(invoice.metaData ?? [])
    ],
    field => ({ label: field.label, value: field.value })
  );
}

/** Whether this order reached the client through a delegation (`orderView.vue:22-27`). */
export function orderIsDelegated(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return contextOrder(data, context)?.isDelegated === true;
}

/** What that notice says — the same sentence the two documents carry. */
export function orderDelegatedMessage(): string {
  return delegatedDocumentMessage("order").message;
}

/** The credit note's own notices — the delegated one is the only one it draws. */
export function creditNoteDocumentMessages(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleMessage[] {
  const note = contextCreditNote(data, context);
  if (note?.isDelegated !== true) return [];
  return [delegatedDocumentMessage("credit note")];
}

export function invoiceDocumentMessages(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleMessage[] {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return [];
  const isOwed = isInvoiceOwed(invoice);
  // A settled or cancelled document is not waiting on anybody, whatever its
  // payments still say — a consolidated-away invoice kept asking for a bank
  // transfer it no longer wanted.
  const isAwaitingPayment = isOwed && hasPendingPayment(invoice);
  return compact([
    // Where the document STANDS leads — legacy drew its status message above
    // everything else on the page (`invoice/index.vue`).
    invoiceStandingMessage(invoice),
    // Legacy's `delegatedObjectMsg` over a document that reached this client
    // through somebody else's account (`invoice/index.vue:19-24`) — it says
    // whose it is, because the controls it withholds are withheld for that
    // reason.
    invoice.isDelegated === true && delegatedDocumentMessage("invoice"),
    isAwaitingPayment && {
      id: "pending",
      tone: "warning",
      title: "Payment in progress",
      message:
        "A payment against this invoice is still with the gateway. It will settle on its own.",
      // Legacy's `view_payment_instructions`: offered only where the gateway
      // published something for the client to do (`invoicePendingPaymentMsg`).
      action: invoiceInstructionsAction(invoice)
    },
    // Legacy's `make_additional_payment`, offered on a document that has taken
    // something and still wants more (`hasPartialPayment`). The same door the
    // Pay control opens, so what it asks for is what the write will take.
    isPartlyPaid(invoice) && {
      id: "part-paid",
      tone: "info",
      title: "Part paid",
      message: `${invoice.paidAmount.formatted} has landed against this invoice; ${invoice.unpaidAmount.formatted} is still owed.`
    },
    !isOwed &&
      invoice.datePaid !== undefined && {
        id: "settled",
        tone: "success",
        message: `Settled in full on ${invoice.datePaid}.`
      }
  ]);
}

/** What a payment still with the gateway asks of the client, where it asks anything. */
function invoiceInstructionsAction(
  invoice: MockInvoice
): DocumentModuleMessage["action"] {
  if (pendingInstruction(invoice) === undefined) return undefined;
  return {
    value: mockActionValue(MOCK_ACTION.OPEN_INSTRUCTIONS, invoice.id),
    label: "View payment instructions"
  };
}

/**
 * The document's own controls. Pay names the account's default card, so the
 * confirmation can say which one — the "Pay with" panel below offers the
 * others.
 */
export function invoiceDocumentActions(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleAction[] {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return [];
  // Money the system has recorded but not received leaves the client nothing
  // to press: legacy hid the amounts and the controls while it cleared
  // (`invoiceItems.vue:357-361`).
  const isPayable = isInvoicePayable(invoice);
  return compact([
    // Paying is client-vue's payment module; the control stays so the page reads whole.
    isPayable && {
      value: mockActionValue(MOCK_ACTION.PAY_INVOICE, invoice.id),
      label: "Pay"
    },
    // Legacy's own share MODAL (`invoiceShareModal.vue`), refused outright on
    // a delegated document — the guard runs before the dialog, so a control
    // that cannot succeed never opens one (plan R4).
    whyNotShareable(invoice) === undefined && {
      value: openFormValue(FORM_ID.INVOICE_SHARE, invoice.id),
      label: "Share",
      variant: DOCUMENT_ACTION_VARIANT.OUTLINE
    },
    {
      value: downloadValue(MOCK_DOCUMENT_KIND.INVOICE, invoice.id),
      label: "Download",
      variant: DOCUMENT_ACTION_VARIANT.OUTLINE
    }
  ]);
}

/**
 * The row's own Pay button — the FIRST of the entries its menu carries, so
 * pressing it asks with the card and the amount exactly as the document does,
 * and the alternatives stay one menu away. A row with nothing owed offers
 * none.
 */
function payRowAction(invoice: MockInvoice): ListModuleItem["action"] {
  if (!isInvoicePayable(invoice)) return undefined;
  return {
    value: mockActionValue(MOCK_ACTION.PAY_INVOICE, invoice.id),
    label: "Pay"
  };
}

function downloadValue(kind: MockDocumentKind, documentId: string): string {
  return mockActionValue(MOCK_ACTION.DOWNLOAD, `${kind}:${documentId}`);
}

/** Whether this document still has something to pay — the Pay-with panel's own presence. */
export function invoiceIsPayable(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const invoice = contextInvoice(data, context);
  if (invoice === undefined) return false;
  return isInvoicePayable(invoice);
}

export function creditNoteDocumentHeader(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleHeader | undefined {
  const note = contextCreditNote(data, context);
  if (note === undefined) return undefined;
  const status = creditNoteState(note);
  return {
    title: "Credit note",
    number: note.number,
    status: {
      label: CREDIT_NOTE_STATUS_LABEL[status],
      tone: CREDIT_NOTE_STATUS_TONE[status]
    },
    dates: [{ id: "issued", label: "Issued", value: note.issuedDate }]
  };
}

export function creditNoteDocumentParty(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleParty | undefined {
  const note = contextCreditNote(data, context);
  if (note === undefined) return undefined;
  return documentParty(data, note.address);
}

export function creditNoteDocumentLines(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleLine[] {
  return documentLines(contextCreditNote(data, context)?.lines);
}

/**
 * A credit note owes nothing and is never part-paid: what it comes to IS what
 * was refunded, so the paid and balance rows read the credit itself.
 */
export function creditNoteDocumentTotals(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleTotals | undefined {
  const note = contextCreditNote(data, context);
  if (note === undefined) return undefined;
  return {
    subtotal: { label: "Subtotal", value: note.total.formatted },
    taxes: [],
    total: { label: "Credit total", value: note.total.formatted },
    paid: { label: "Refunded", value: refundedTotal(note).formatted },
    balance: { label: "Held on account", value: heldOnAccount(note).formatted }
  };
}

/** What has actually gone back — a credit still sitting on the account has refunded nothing. */
function refundedTotal(note: MockCreditNote): MockMoney {
  const refund = find(note.refunds, {
    status: MOCK_PAYMENT_STATUS.SUCCESSFUL
  });
  return refund?.amount ?? zeroOf(note.total.currency);
}

/** The other half of the same fact, so the two rows always read as a pair. */
function heldOnAccount(note: MockCreditNote): MockMoney {
  const refund = find(note.refunds, {
    status: MOCK_PAYMENT_STATUS.SUCCESSFUL
  });
  if (refund !== undefined) return zeroOf(note.total.currency);
  return note.total;
}

/** The refunds ARE this document's payments — the same block, sent the other way. */
export function creditNoteDocumentPayments(
  data: MockDataset,
  context: DataRouteContext
): DocumentModulePayment[] {
  return documentPayments(contextCreditNote(data, context)?.refunds ?? []);
}

export function creditNoteDocumentActions(
  data: MockDataset,
  context: DataRouteContext
): DocumentModuleAction[] {
  const note = contextCreditNote(data, context);
  if (note === undefined) return [];
  return [
    {
      value: downloadValue(MOCK_DOCUMENT_KIND.CREDIT_NOTE, note.id),
      label: "Download",
      variant: DOCUMENT_ACTION_VARIANT.OUTLINE
    }
  ];
}

/** The invoice this credit offsets — legacy linked straight to it from the note. */
export function creditNoteInvoiceItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const note = contextCreditNote(data, context);
  if (note?.invoiceId === undefined) return [];
  const invoice = find(data.invoices, { id: note.invoiceId });
  if (invoice === undefined) return [];
  return [invoiceListItem(data, invoice)];
}

/** The row menu legacy hung off every invoice row, on the listing and on the board alike. */
function invoiceMoreActions(
  invoice: MockInvoice
): ListModuleItem["moreActions"] {
  return [
    {
      value: mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/billing/invoices/${invoice.id}`
      ),
      label: "Go to invoice"
    },
    {
      value: downloadValue(MOCK_DOCUMENT_KIND.INVOICE, invoice.id),
      label: "Download"
    }
  ];
}

/**
 * How the row reports when a document was issued. A document belonging to
 * somebody else — a child account's, or one a delegation reaches — NAMES them,
 * which is legacy's second sentence (`_sentence.invoice.issued_on_date_to_client`,
 * chosen by `invoiceRowItem.vue:163-167`); the account's own says the date and
 * stops.
 */
function invoiceIssuedLine(invoice: MockInvoice): string {
  const belongsToOther =
    invoice.ownerName !== undefined || invoice.isDelegated === true;
  if (!belongsToOther) return `Issued ${invoice.issuedDate}`;
  return `Issued ${invoice.issuedDate} to ${invoice.ownerName ?? "another account"}`;
}

function invoiceListItem(
  data: MockDataset,
  invoice: MockInvoice
): ListModuleItem {
  return {
    id: invoice.id,
    title: invoice.number,
    to: `/billing/invoices/${invoice.id}`,
    description: `${invoiceIssuedLine(invoice)} · Due ${invoice.dueDate}`,
    moreActions: invoiceMoreActions(invoice),
    // The dates and the amount are columns where the panel tables them; the
    // description carries the same facts for the dashboard's compact recents.
    cells: [
      { value: invoice.issuedDate },
      { value: invoice.dueDate },
      { value: invoice.total.formatted, numeric: true }
    ],
    leadingIcon: Receipt,
    // The document's OWN status, not the tab's: a client reading "Overdue"
    // learns something "Unpaid" does not tell them. A row is also the surface
    // legacy reported the coming credit on (`invoiceRowStanding`).
    status: invoiceRowStanding(invoice)
  };
}

function creditNoteListItem(note: MockCreditNote): ListModuleItem {
  const status = creditNoteState(note);
  const against = compact([
    `Issued ${note.issuedDate}`,
    note.invoiceNumber !== undefined && `Against ${note.invoiceNumber}`
  ]);
  return {
    id: note.id,
    title: note.number,
    to: `/billing/credit-notes/${note.id}`,
    leadingIcon: ClipboardList,
    description: against.join(" · "),
    cells: [
      { value: note.issuedDate },
      { value: note.invoiceNumber ?? "—" },
      { value: note.total.formatted, numeric: true }
    ],
    status: {
      label: CREDIT_NOTE_STATUS_LABEL[status],
      tone: CREDIT_NOTE_STATUS_TONE[status]
    }
  };
}

// --- account pillar (plan Phase F; legacy src/views/client/account)

/**
 * Whether the affiliate programme reaches this CLIENT — legacy ANDed two brand
 * keys for it (`router/client/account/menu.ts`): the programme being on at
 * all, and the client being given controls over their own.
 */
export function isAffiliateEnabled(data: MockDataset): boolean {
  const isProgrammeOn = data.features.UPMIND_AFFILIATES_ENABLED;
  const hasClientControls =
    data.features.UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED;
  return isProgrammeOn && hasClientControls;
}

/**
 * Legacy's account menu, gated as vue-app gated it: notes behind
 * CLIENT_NOTES_AND_SECRETS_ENABLED, affiliate behind the two affiliate keys
 * above, child accounts shown only when the account has any.
 */
export function accountSectionNavItems(data: MockDataset): MenuItem[] {
  return compact([
    { to: "/account/profile", label: "Profile", icon: UserRound },
    data.features.CLIENT_NOTES_AND_SECRETS_ENABLED && {
      to: "/account/notes",
      label: "Notes & secrets",
      icon: KeyRound
    },
    { to: "/account/security", label: "Security", icon: ShieldCheck },
    { to: "/account/notifications", label: "Notifications", icon: Bell },
    { to: "/account/delegates", label: "Delegates", icon: UsersRound },
    data.childAccounts.length > 0 && {
      to: "/account/child-accounts",
      label: "Child accounts",
      icon: UsersRound
    },
    isAffiliateEnabled(data) && {
      to: "/account/affiliate",
      label: "Affiliate",
      icon: Link2
    },
    { to: "/account/logs", label: "Logs", icon: FileClock }
  ]);
}

/**
 * Whose portal this is — the ACCOUNT being acted for where the sign-in holds
 * more than one (legacy's tenancy switcher), and the person otherwise.
 */
function accountDisplayName(data: MockDataset): string {
  return activePersonaAccount(data.persona)?.name ?? data.persona.name;
}

/**
 * The account card's identity row — legacy's sidebar summary: the avatar, the
 * display name, and the username as the link to where it is changed. The
 * picture is the client's own to change, so the row carries the control that
 * changes it (legacy's `@avatar-changed`).
 */
export function accountCardItems(data: MockDataset): ListModuleItem[] {
  const { persona } = data;
  const name = accountDisplayName(data);
  const row: ListModuleItem = {
    id: persona.id,
    title: name,
    description: persona.username ?? persona.email,
    to: SECURITY_PATH,
    leadingIcon: UserRound,
    leadingImageSrc: persona.avatarSrc,
    leadingImageAlt: name,
    tags: map(persona.tags ?? [], label => ({ label })),
    action: {
      value: openFormValue(FORM_ID.AVATAR_SAVE),
      label: "Change photo"
    }
  };
  return [row];
}

/**
 * What kind of account this is, in legacy's own words: a parent says how many
 * accounts hang off it and links to them, a child names its parent, and an
 * account with neither is simply personal.
 */
function accountTypeRow(data: MockDataset): SpecModuleItem {
  // The persona IS the child while the ribbon is up, so the parent's name is
  // the one held for the way back, never the one on the card.
  const { restoredName } = useMockImpersonation();
  if (restoredName.value !== undefined) {
    return {
      id: "account-type",
      label: "Account type",
      value: `Child of ${restoredName.value}`,
      to: CHILD_ACCOUNTS_PATH
    };
  }
  const children = size(data.childAccounts);
  if (children === 0) {
    return {
      id: "account-type",
      label: "Account type",
      value: "Personal account"
    };
  }
  let noun = "child accounts";
  if (children === 1) noun = "child account";
  return {
    id: "account-type",
    label: "Account type",
    value: `Parent account · ${children} ${noun}`,
    to: CHILD_ACCOUNTS_PATH
  };
}

/** The card's standing facts, under the identity row. */
export function accountCardSpecItems(data: MockDataset): SpecModuleItem[] {
  const { persona } = data;
  return compact([
    usernameRow(data),
    accountTypeRow(data),
    persona.lastLoginAt !== undefined && {
      id: "last-login",
      label: "Last login",
      value: persona.lastLoginAt.slice(0, ISO_DATE_LENGTH)
    },
    persona.clientSince !== undefined && {
      id: "client-since",
      label: "Client since",
      value: persona.clientSince
    }
  ]);
}

/**
 * The name this client signs in with — legacy's `showUsername`
 * (`accountMenu.vue:111-117`), which withheld the row where the username IS
 * the default email address, "as it just adds duplicate data".
 */
function usernameRow(data: MockDataset): SpecModuleItem | undefined {
  const { username } = data.persona;
  if (username === undefined) return undefined;
  if (username === defaultEmailAddress(data)) return undefined;
  return {
    id: "username",
    label: "Username",
    value: username,
    // The row states the name; the page that CHANGES it is security's own
    // (`changeUsernameForm`), so the row goes there rather than carrying a
    // second form of its own.
    to: SECURITY_PATH,
    copyable: true
  };
}

/** The address the account signs in on — the wire's own `meta.isDefault`. */
function defaultEmailAddress(data: MockDataset): string | undefined {
  return (
    find(data.emails, entry => entry.meta?.isDefault === true)?.email ??
    undefined
  );
}

/**
 * Where the header's mark goes — the brand's own site where it publishes one
 * (`UI_LOGO_URL`), and nothing where it does not, which leaves the mark the
 * link home (legacy's `brandLogoArgs`, `clientHeader.vue:36-42`).
 */
export function brandLogoHref(data: MockDataset): string | undefined {
  return data.features.UI_LOGO_URL;
}

/** Whether the brand offers a support PIN at all — legacy's own gate. */
export function isSupportPinEnabled(data: MockDataset): boolean {
  return data.features.SUPPORT_PIN_ENABLED && supportPin(data) !== undefined;
}

/** The PIN itself, off the facade the panel and the support page both read. */
function supportPin(data: MockDataset): string | undefined {
  return useMockSupportPin(data).useContext().data.value.supportPin;
}

/**
 * The aside panel's PIN row. Masked or plain is the FACADE's state, not the
 * spec module's own secret affordance: legacy's panel drove it from its own
 * Reveal/Hide pair, which the buttons below carry.
 */
export function supportPinPanelItems(data: MockDataset): SpecModuleItem[] {
  const pin = supportPin(data);
  if (!isSupportPinEnabled(data) || pin === undefined) return [];
  let value = PIN_MASK;
  if (isSupportPinRevealed(data.persona)) value = pin;
  // A number read out to us is a number worth copying, masked or not — the
  // row's own control puts it on the clipboard.
  return [{ id: "pin", label: "Support PIN", value, copyable: true }];
}

/**
 * The panel's two controls — read the PIN, or replace it. While it is showing,
 * the first one COPIES before it hides (legacy's own `copy_and_hide`): a
 * client who has finished reading it out wants it in the clipboard, not gone.
 */
export function supportPinActions(data: MockDataset): ButtonModuleAction[] {
  if (!isSupportPinEnabled(data)) return [];
  const isShowing = isSupportPinRevealed(data.persona);
  let reveal = {
    value: mockActionValue(MOCK_ACTION.PIN_REVEAL, data.persona.id),
    label: "Reveal"
  };
  if (isShowing) {
    reveal = {
      value: mockActionValue(MOCK_ACTION.PIN_COPY_AND_HIDE, data.persona.id),
      label: "Copy and hide"
    };
  }
  return [
    reveal,
    {
      value: mockActionValue(MOCK_ACTION.PIN_REGENERATE, data.persona.id),
      label: "Generate new"
    }
  ];
}

/**
 * Legacy profile's own fields, in the REAL `ProfileRecord`'s names
 * (`usePersonalDetails`). Display only — editing is the form phase's.
 */
export function profileSpecItems(data: MockDataset): SpecModuleItem[] {
  const { persona } = data;
  return compact([
    persona.firstName !== undefined && {
      id: "first-name",
      label: "First name",
      value: persona.firstName
    },
    persona.lastName !== undefined && {
      id: "last-name",
      label: "Last name",
      value: persona.lastName
    },
    persona.publicName !== undefined && {
      id: "public-name",
      label: "Public name",
      value: persona.publicName
    },
    persona.language !== undefined && {
      id: "language",
      label: "Interface language",
      value: interfaceLanguageLabel(persona.language)
    }
  ]);
}

/**
 * The profile form's three inputs, resolved off the REAL module's own schema
 * builders (plan F3). Three refs rather than one bag, because the `form`
 * module takes three props and the data-ref seam binds prop by prop.
 */
function profileForm(data: MockDataset): MockFormEntry | undefined {
  return resolveMockForm(data, FORM_ID.PROFILE, undefined);
}

export function profileFormSchema(data: MockDataset): JsonSchema | undefined {
  return profileForm(data)?.schema;
}

export function profileFormUischema(
  data: MockDataset
): UISchemaElement | undefined {
  return profileForm(data)?.uischema;
}

export function profileFormModel(data: MockDataset): FormModel | undefined {
  return profileForm(data)?.model;
}

/** Whether the brand asks this client anything at all — an empty form is no panel. */
export function hasCustomFields(data: MockDataset): boolean {
  return !isEmpty(data.customFields);
}

/**
 * The change-username form's three inputs. The schema is a constant, the model
 * is the name on file — so a client who has never set one opens on the
 * schema module's own default rather than on `undefined`.
 */
export function usernameFormSchema(): JsonSchema {
  return useUsernameSchema();
}

export function usernameFormUischema(): UISchemaElement {
  return useUsernameUischema();
}

export function usernameFormModel(data: MockDataset): FormModel {
  const held = data.persona.username;
  if (held === undefined) return usernameDefaults();
  return { username: held };
}

/** The change-password form's three inputs — the model is always empty, never the current one. */
export function passwordFormSchema(): JsonSchema {
  return usePasswordSchema();
}

export function passwordFormUischema(): UISchemaElement {
  return usePasswordUischema();
}

export function passwordFormModel(): FormModel {
  return passwordDefaults();
}

// --- the logged-out screens (plan F11) -------------------------------------

/**
 * Legacy carried the username across to the recovery screen in its own link's
 * query, so a client who mistyped a password does not retype their address.
 * The mock knows one account, so that is the address it carries.
 */
export function loginRecoverAction(data: MockDataset): string {
  const username = data.persona.username;
  if (username === undefined) {
    return mockActionValue(MOCK_ACTION.NAVIGATE, "/forgotten-password");
  }
  return mockActionValue(
    MOCK_ACTION.NAVIGATE,
    `/forgotten-password?${AUTH_QUERY_KEY.USERNAME}=${encodeURIComponent(username)}`
  );
}

/**
 * Whether the login screen offers the way to open an account: legacy showed
 * its banner only where the brand publishes registration, and a white-labelled
 * sign-in is a brand handing its own clients a link it never authored.
 */
export function hasClientRegistration(data: MockDataset): boolean {
  const { CLIENT_REGISTRATION_ENABLED, UI_WHITELABEL_LOGIN } = data.features;
  return CLIENT_REGISTRATION_ENABLED && !UI_WHITELABEL_LOGIN;
}

/**
 * The email-verification form's three inputs, off the REAL `account` module's
 * own parsers — the six-digit code the verification mail carried.
 */
export function verifyEmailFormSchema(): JsonSchema {
  return useVerifyEmailSchemaParser();
}

export function verifyEmailFormUischema(): UISchemaElement {
  return useVerifyEmailUischemaParser();
}

export function verifyEmailFormModel(): FormModel {
  return verifyEmailDefaults();
}

/** The second sign-in step's three inputs, off the REAL module's own twofa builders. */
export function twoFactorFormSchema(): JsonSchema {
  return useTwoFASchema();
}

export function twoFactorFormUischema(): UISchemaElement {
  return useTwoFAUischema();
}

export function twoFactorFormModel(): FormModel {
  return twoFactorDefaults();
}

export function hasRecaptcha(data: MockDataset): boolean {
  return data.features.recaptchaEnabled;
}

/** The security panel's own control — whichever way the second sign-in step needs turning. */
export function securityTwoFactorActions(
  data: MockDataset
): ButtonModuleAction[] {
  if (data.security.twoFactorEnabled) {
    return [
      {
        value: mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.TWOFA_DISABLE),
        label: "Turn off two-factor"
      }
    ];
  }
  return [
    {
      value: mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.TWOFA_ENABLE),
      label: "Turn on two-factor"
    }
  ];
}

/** A company reads by its numbers — the registration one, then the tax one. */
// --- the profile page's contact lists (legacy's clientEmailRow, clientPhoneRow,
// billableAddressEntity, billableCompanyEntity) ---------------------------------

type ListTag = NonNullable<ListModuleItem["tags"]>[number];

/** A row the wire has already keyed — the seed's rows all are. */
function hasId<TRow extends { readonly id?: string }>(
  row: TRow
): row is TRow & { readonly id: string } {
  return row.id !== undefined;
}

/** How legacy printed a number — its formatted title, else the raw number. */
function phoneLabel(row: MockPhone): string {
  if (row.title !== undefined) return row.title;
  return row.phone.number ?? "";
}

const DEFAULT_TAG: ListTag = { label: "Default", tone: "neutral" };
const UNVERIFIED_TAG: ListTag = { label: "Unverified", tone: "warning" };
const BOUNCED_TAG: ListTag = { label: "Bounced", tone: "danger" };

function defaultTagFor(noun: string): ListTag {
  return { label: `Default ${noun}`, tone: "neutral" };
}

/** Legacy's `clientEmailRow`: the address, its standing, and the row menu. */
export function profileEmailItems(data: MockDataset): ListModuleItem[] {
  const canManageOptIns = size(data.emailTopics) > 0;
  return map(filter(data.emails, hasId), row => {
    const { isDefault, isVerified, isBounced } = row.meta;
    return {
      id: row.id,
      title: row.email ?? "",
      description: row.description,
      leadingIcon: Mail,
      tags: compact([
        isDefault && DEFAULT_TAG,
        !isVerified && UNVERIFIED_TAG,
        isBounced && BOUNCED_TAG
      ]),
      action: {
        value: openFormValue(FORM_ID.EMAIL_EDIT, row.id),
        label: "Edit"
      },
      moreActions: compact([
        {
          value: mockActionValue(MOCK_ACTION.COPY, row.email ?? ""),
          label: "Copy to clipboard"
        },
        !isDefault && {
          value: mockActionValue(MOCK_ACTION.EMAIL_SET_DEFAULT, row.id),
          label: "Set as default email"
        },
        !isVerified && {
          value: mockActionValue(MOCK_ACTION.EMAIL_VERIFY, row.id),
          label: "Resend verification email"
        },
        // Offered on the address the account signs in with, while unconfirmed.
        !isVerified &&
          isDefault && {
            value: openFormValue(FORM_ID.EMAIL_VERIFY_CODE, row.id),
            label: "Enter verification code"
          },
        // Legacy's `canManageOptIns`: a verified address, on a brand with topics.
        isVerified &&
          canManageOptIns && {
            value: openFormValue(FORM_ID.EMAIL_TOPIC_OPT_INS, row.id),
            label: "Manage notifications"
          },
        {
          value: mockActionValue(MOCK_ACTION.EMAIL_REMOVE, row.id),
          label: "Delete email"
        }
      ])
    };
  });
}

/** Legacy's `clientPhoneRow`: the number, its type, and the row menu. */
export function profilePhoneItems(data: MockDataset): ListModuleItem[] {
  return map(data.phones, row => ({
    id: row.id,
    title: phoneLabel(row),
    description: row.description,
    leadingIcon: Phone,
    tags: compact([row.meta.isDefault && DEFAULT_TAG]),
    action: {
      value: openFormValue(FORM_ID.PHONE_EDIT, row.id),
      label: "Edit"
    },
    moreActions: compact([
      !row.meta.isDefault && {
        value: mockActionValue(MOCK_ACTION.PHONE_SET_DEFAULT, row.id),
        label: "Set as default phone"
      },
      {
        value: mockActionValue(MOCK_ACTION.PHONE_REMOVE, row.id),
        label: "Delete phone"
      }
    ])
  }));
}

/** The two "Add new" controls legacy's `billableEntitiesControl` offers. */
export function billableEntityActions(): ButtonModuleAction[] {
  return [
    {
      value: openFormValue(FORM_ID.ADDRESS_CREATE),
      label: "Add new address"
    },
    {
      value: openFormValue(FORM_ID.COMPANY_CREATE),
      label: "Add new company details"
    }
  ];
}

/**
 * Legacy's "Address and company details" section: both kinds of billable
 * entity in one searchable list, each card with its own menu
 * (`billableAddressEntity`, `billableCompanyEntity`). "Validate tax number"
 * was staff-only and is not offered.
 */
export function billableEntityItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = billableEntitiesCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, entity => {
    const isAddress = entity.kind === BILLABLE_ENTITY_KIND.ADDRESS;
    let editForm: FormId = FORM_ID.COMPANY_EDIT;
    let setDefault: MockAction = MOCK_ACTION.COMPANY_SET_DEFAULT;
    let removeVerb: MockAction = MOCK_ACTION.COMPANY_REMOVE;
    let noun = "company";
    let icon = Building2;
    if (isAddress) {
      editForm = FORM_ID.ADDRESS_EDIT;
      setDefault = MOCK_ACTION.ADDRESS_SET_DEFAULT;
      removeVerb = MOCK_ACTION.ADDRESS_REMOVE;
      noun = "address";
      icon = MapPin;
    }
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      leadingIcon: icon,
      tags: compact([entity.isDefault && defaultTagFor(noun)]),
      action: {
        value: openFormValue(editForm, entity.id),
        label: "Edit"
      },
      moreActions: compact([
        {
          value: mockActionValue(MOCK_ACTION.COPY, entity.description),
          label: "Copy to clipboard"
        },
        !entity.isDefault && {
          value: mockActionValue(setDefault, entity.id),
          label: `Set as default ${noun}`
        },
        {
          value: mockActionValue(removeVerb, entity.id),
          label: `Delete ${noun}`
        }
      ])
    };
  });
}

function companyDescription(entry: MockCompany): string {
  return compact([
    entry.regNumber !== null && `Reg. ${entry.regNumber}`,
    entry.tax.number !== null && `Tax ${entry.tax.number}`
  ]).join(" · ");
}

/**
 * What the invitation link says — legacy's `acceptInviteModal:8-70`, whose
 * three readings are the whole page: still verifying, accepted (naming what
 * the access reaches), or a link already spent.
 */
type DelegateInviteReading = {
  readonly title: string;
  readonly message: string;
  readonly tone: BannerModuleProps["tone"];
  readonly action: BannerModuleProps["action"];
};

function delegateInviteReading(
  data: MockDataset,
  context: DataRouteContext
): DelegateInviteReading {
  const hash = context.token;
  if (hash === undefined || hash === "") {
    return {
      title: "Checking your invite",
      message:
        "Hang tight — we are just verifying your invite link. This should not take long.",
      tone: "info",
      action: undefined
    };
  }
  const invite = find(data.delegateInvites, { hash });
  if (invite === undefined || invite.isExpired === true) {
    return {
      title: "That link no longer works",
      message:
        "This invite link has expired or is invalid. Ask whoever sent it to invite you again.",
      tone: "danger",
      action: {
        value: mockActionValue(MOCK_ACTION.NAVIGATE, "/"),
        label: "Go to your dashboard"
      }
    };
  }
  if (invite.objectType === DelegateObjectTypes.CONTRACT_PRODUCT) {
    return {
      title: "Invite accepted",
      message: `You now have delegate access to the product '${invite.objectName ?? invite.objectId}'.`,
      tone: "success",
      action: {
        value: mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `/products/${invite.objectId}`
        ),
        label: "View this product"
      }
    };
  }
  return {
    title: "Invite accepted",
    message: `Invite successfully accepted — you now have delegate access to ${countedNoun(invite.productCount ?? 0, "product")}.`,
    tone: "success",
    action: {
      value: mockActionValue(MOCK_ACTION.NAVIGATE, "/products"),
      label: "View those products"
    }
  };
}

export function delegateInviteTitle(
  data: MockDataset,
  context: DataRouteContext
): string {
  return delegateInviteReading(data, context).title;
}

export function delegateInviteMessage(
  data: MockDataset,
  context: DataRouteContext
): string {
  return delegateInviteReading(data, context).message;
}

export function delegateInviteTone(
  data: MockDataset,
  context: DataRouteContext
): BannerModuleProps["tone"] {
  return delegateInviteReading(data, context).tone;
}

export function delegateInviteAction(
  data: MockDataset,
  context: DataRouteContext
): BannerModuleProps["action"] {
  return delegateInviteReading(data, context).action;
}

/** Legacy's IP whitelist rows — each editable and removable. */
export function ipWhitelistItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = ipWhitelistCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, entry => ({
    id: entry.id,
    title: entry.ip_address,
    description: entry.name,
    leadingIcon: ShieldCheck,
    action: {
      value: openFormValue(FORM_ID.IP_WHITELIST_EDIT, entry.id),
      label: "Edit"
    },
    moreActions: [
      {
        value: mockActionValue(MOCK_ACTION.IP_WHITELIST_REMOVE, entry.id),
        label: "Delete"
      }
    ]
  }));
}

/** Legacy security's facts — password age and 2FA state (changing them is form-phase work). */
export function securitySpecItems(data: MockDataset): SpecModuleItem[] {
  let twoFactorState = "Disabled";
  if (data.security.twoFactorEnabled) twoFactorState = "Enabled";
  return [
    {
      id: "password",
      label: "Password last changed",
      value: data.security.passwordChangedAt
    },
    {
      id: "two-factor",
      label: "Two-factor authentication",
      value: twoFactorState
    },
    // Legacy kept the sign-in log one click from the security page it belongs
    // to, rather than only under Logs.
    {
      id: "login-history",
      label: "Login history",
      value: "Recent sign-ins to this account",
      to: LOGS_PATH
    }
  ];
}

/**
 * The topbar DROPDOWN's list — the narrowed feed, ACCUMULATED: legacy's
 * dropdown loaded more onto what was already showing rather than paging, so
 * the rows are every page up to the one loaded, derived from the collection's
 * own page index (`collections.ts` `accumulated`) and latched nowhere.
 */
export function notificationItems(data: MockDataset): ListModuleItem[] {
  const { accumulated } = notificationFeedCollection.resolve(data).useContext();
  return map(accumulated.value, notification =>
    assign(notificationListItem(notification), {
      secondaryAction: {
        value: mockActionValue(
          MOCK_ACTION.NOTIFICATION_DISMISS,
          notification.id
        ),
        label: "Dismiss"
      }
    })
  );
}

/** The dropdown's rail — legacy's three choices, in its order. */
export function notificationFilters(): NotificationsModuleFilter[] {
  return [
    { value: NOTIFICATION_FILTER.ALL, label: "All" },
    { value: NOTIFICATION_FILTER.UNREAD, label: "Unread" },
    { value: NOTIFICATION_FILTER.READ, label: "Read" }
  ];
}

/** Which rail choice is showing — read off the applied criteria, never held. */
export function notificationFilterValue(data: MockDataset): string {
  const { appliedFilters } = notificationFeedCollection
    .resolve(data)
    .useContext();
  const applied = appliedFilters.value.read ?? "";
  const choice = find(
    values(NOTIFICATION_FILTER),
    key => NOTIFICATION_FILTER_CRITERIA[key] === applied
  );
  return choice ?? NOTIFICATION_FILTER.ALL;
}

/** The more-rows control, while the feed has a page beyond the one showing. */
export function notificationLoadMore(
  data: MockDataset
): NotificationsModuleProps["loadMore"] {
  const { hasNextPage } = notificationFeedCollection.resolve(data).useMeta();
  if (!hasNextPage.value) return undefined;
  return { value: MOCK_ACTION.NOTIFICATION_LOAD_MORE, label: "Load more" };
}

/** The notifications PAGE's list — the same rows through the paged facade (plan §3). */
export function notificationPageItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = notificationsCollection.resolve(data).useContext();
  return map(rows.value, notificationListItem);
}

/** Legacy's own `charLimit` — past it the body is cut (`userNotification.vue:58`). */
const NOTIFICATION_BODY_LIMIT = 150;

/** Whether this notification says more than the row shows. */
function isNotificationTruncated(body: string): boolean {
  return size(body) > NOTIFICATION_BODY_LIMIT;
}

/**
 * The body as the row prints it — cut at the last WORD before the limit, as
 * legacy cut it (`lastIndexOf(" ", charLimit)`), so a row never breaks a word
 * in half. A body inside the limit reads whole.
 */
function notificationBody(body: string): string {
  if (!isNotificationTruncated(body)) return body;
  return `${body.slice(0, lastWordEnd(body))}…`;
}

/**
 * Where the cut falls: the last space inside the limit, as legacy cut it
 * (`lastIndexOf(" ", charLimit)`), so a row never breaks a word in half.
 *
 * A body with NO space before the limit is the case legacy got wrong — its
 * `lastIndexOf` answers -1 and the row renders nothing at all. One unbroken
 * run of characters has no word to keep whole, so it is cut at the limit
 * (ruled: legacy's empty render is a defect, not a behaviour to clone).
 */
function lastWordEnd(body: string): number {
  const space = body.lastIndexOf(" ", NOTIFICATION_BODY_LIMIT);
  if (space <= 0) return NOTIFICATION_BODY_LIMIT;
  return space;
}

function notificationListItem(
  notification: MockDataset["notifications"][number]
): ListModuleItem {
  const row: ListModuleItem = {
    id: notification.id,
    title: notification.title,
    description: notificationBody(notification.body),
    leadingIcon: Bell,
    time: notification.sentAt.slice(0, ISO_DATE_LENGTH),
    datetime: notification.sentAt,
    // Legacy's own inline link, as the one control a cut row carries; a body
    // that reads whole has nothing more to open.
    action: readMoreAction(notification)
  };
  if (notification.read) return row;
  return assign(row, { trailingText: "New", trailingTone: "info" });
}

function readMoreAction(
  notification: MockDataset["notifications"][number]
): ListModuleItem["action"] {
  if (!isNotificationTruncated(notification.body)) return undefined;
  return {
    value: mockActionValue(MOCK_ACTION.NOTIFICATION_READ_MORE, notification.id),
    label: "Read more"
  };
}

/** The preference table's own columns — the topic, then one per channel. */
export function notificationPreferenceHeadings(): ListModuleHeading[] {
  return [
    { label: "Topic" },
    { label: "Email" },
    { label: "In-app" },
    { label: "" }
  ];
}

/**
 * The preference matrix, read-only (`contracts/user-notifications.ts`):
 * legacy's own topics × channels table. Turning a cell over is a form, so
 * every cell renders as a mark rather than a control (gap doc tier B).
 */
export function notificationPreferenceItems(
  data: MockDataset
): ListModuleItem[] {
  const { data: rows } = notificationPreferencesCollection
    .resolve(data)
    .useContext();
  return map(rows.value, preference => ({
    id: preference.topic,
    title: preference.label,
    cells: [
      {
        value: channelMark(preference.channels[NotificationChannelCodes.EMAIL])
      },
      {
        value: channelMark(preference.channels[NotificationChannelCodes.IN_APP])
      }
    ],
    tags: compact([preference.mandatory && { label: "Required" }])
  }));
}

/**
 * The preference matrix, as a form (plan F4) — legacy's
 * `manageNotificationsOptOuts`. The table selectors above stay: they are the
 * same facts, read for anything that states rather than offers them.
 */
export function notificationPreferencesFormSchema(
  data: MockDataset
): JsonSchema {
  return usePreferencesSchema(notificationPreferencesContext(data));
}

export function notificationPreferencesFormUischema(
  data: MockDataset
): UISchemaElement {
  return usePreferencesUischema(notificationPreferencesContext(data));
}

/**
 * Legacy's per-topic link (`manageNotificationsOptOutsRow`): ONE control per
 * topic whose words follow the row's own state — "Clear all" while every
 * channel is on, "Select all" otherwise. A MANDATORY topic is the brand's, so
 * it carries none.
 *
 * The design system's form engine has no group-action renderer, so the pair
 * rides beside the form rather than inside each of its groups; the verb names
 * the state it asks for, and the form re-reads the matrix the write moved.
 */
export function notificationTopicActions(
  data: MockDataset
): ButtonModuleAction[] {
  const optional = filter(data.notificationPreferences, row => !row.mandatory);
  return map(optional, row => {
    const receivesEverywhere = every(values(row.channels));
    if (receivesEverywhere) {
      return {
        value: mockActionValue(
          MOCK_ACTION.NOTIFICATION_TOPIC_SET,
          `${row.topic}:${TOPIC_SWITCH.OFF}`
        ),
        label: `Clear all — ${row.label}`
      };
    }
    return {
      value: mockActionValue(
        MOCK_ACTION.NOTIFICATION_TOPIC_SET,
        `${row.topic}:${TOPIC_SWITCH.ON}`
      ),
      label: `Select all — ${row.label}`
    };
  });
}

export function notificationPreferencesFormModel(data: MockDataset): FormModel {
  return preferencesDefaults(notificationPreferencesContext(data));
}

// --- one address's own opt-ins, reached by link (legacy `auth/emailOptIns`) ---

/** The address the link is about — absent reads as no address at all. */
function optInAddress(context: DataRouteContext): string {
  return context.email ?? "";
}

export function emailOptInsFormSchema(
  data: MockDataset,
  context: DataRouteContext
): JsonSchema {
  return useEmailTopicOptInsSchema(
    emailTopicOptInsContext(data, optInAddress(context))
  );
}

export function emailOptInsFormUischema(
  data: MockDataset,
  context: DataRouteContext
): UISchemaElement {
  return useEmailTopicOptInsUischema(
    emailTopicOptInsContext(data, optInAddress(context))
  );
}

export function emailOptInsFormModel(
  data: MockDataset,
  context: DataRouteContext
): FormModel {
  return emailTopicOptInsDefaults(
    emailTopicOptInsContext(data, optInAddress(context))
  );
}

/** The submit carries the ADDRESS, not a row key — a link names what it was sent to. */
export function emailOptInsFormSubmit(
  data: MockDataset,
  context: DataRouteContext
): string {
  return mockActionValue(MOCK_ACTION.EMAIL_OPT_INS_SAVE, optInAddress(context));
}

/** Legacy's own intro line above the topics — it names the address it is about. */
export function emailOptInsIntro(
  data: MockDataset,
  context: DataRouteContext
): string {
  const address = optInAddress(context);
  if (address === "") return "";
  return `You are managing what we send to **${address}**.`;
}

/** Whether the brand publishes anything one address may subscribe to. */
export function hasEmailTopics(data: MockDataset): boolean {
  return size(data.emailTopics) > 0;
}

// --- opening an organisation (legacy `auth/registerOrg`) ----------------------

/** A channel is on or it is not — the table says which without a control. */
function channelMark(enabled: boolean): string {
  if (enabled) return CHANNEL_ON;
  return CHANNEL_OFF;
}

/** "1 product", "3 products" — a count and the noun it counts, agreeing. */
function countedNoun(count: number, noun: string): string {
  if (count === 1) return `${count} ${noun}`;
  return `${count} ${noun}s`;
}

/** What a specific-access delegate reaches, counted — one grant per object. */
function delegateObjectCounts(delegate: MockDelegate): string {
  const products = size(
    filter(delegate.objects, { type: DelegateObjectTypes.CONTRACT_PRODUCT })
  );
  const tickets = size(
    filter(delegate.objects, { type: DelegateObjectTypes.TICKET })
  );
  return `${countedNoun(products, "product")} · ${countedNoun(tickets, "ticket")}`;
}

/**
 * The row's line. A whole-account delegate holds no grants at all, so
 * counting them would read as "nothing" beside a tag that says everything.
 */
function delegateDescription(delegate: MockDelegate): string {
  if (delegate.isFullDelegate === true) return delegate.email;
  return describedBy([delegate.email, delegateObjectCounts(delegate)]);
}

/** Revoking one delegate — the same control on the row's menu and the page's header. */
function delegateRemoveAction(delegate: MockDelegate) {
  return {
    value: mockActionValue(MOCK_ACTION.DELEGATE_REMOVE, delegate.id),
    label: "Remove delegate"
  };
}

/** The account's delegates, each linking to its legacy delegate overview. */
export function accountDelegateItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = accountDelegatesCollection.resolve(data).useContext();
  return map(rows.value, delegate => ({
    id: delegate.id,
    title: delegate.name,
    to: `/account/delegates/${delegate.id}`,
    description: delegateDescription(delegate),
    leadingIcon: UserRound,
    tags: delegateTags(delegate),
    moreActions: [delegateRemoveAction(delegate)]
  }));
}

/** The delegate the route names. */
function contextDelegate(
  data: MockDataset,
  context: DataRouteContext
): MockDelegate | undefined {
  return find(data.delegates, { id: context.entityId ?? "" });
}

/** The delegate overview's fields. */
export function delegateSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const delegate = contextDelegate(data, context);
  if (delegate === undefined) return [];
  return [
    { id: "name", label: "Name", value: delegate.name },
    { id: "email", label: "Email", value: delegate.email, copyable: true },
    {
      id: "permissions",
      label: "Permissions",
      value: permissionList(delegate)
    }
  ];
}

/** The delegate page's one header control. */
export function delegateHeaderActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  const delegate = contextDelegate(data, context);
  if (delegate === undefined) return [];
  return [delegateRemoveAction(delegate)];
}

/**
 * Legacy's access-type control, as one switch. It reports the CHANGE, not the
 * state: the value carries where the switch is going, and its `checked` says
 * where it is now.
 */
export function delegateAccessItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const delegate = contextDelegate(data, context);
  if (delegate === undefined) return [];
  const isFull = delegate.isFullDelegate === true;
  let next: DelegateAccessTypes = DelegateAccessTypes.FULL;
  if (isFull) next = DelegateAccessTypes.SPECIFIC;
  return [
    {
      id: "access-type",
      title: "Full access",
      description:
        "Everything on the account, rather than only what you name below.",
      toggle: {
        value: mockActionValue(
          MOCK_ACTION.DELEGATE_SET_ACCESS,
          `${delegate.id}:${next}`
        ),
        checked: isFull,
        label: `Full account access for ${delegate.name}`
      }
    }
  ];
}

/** Whether the two grant panels apply at all — a full delegate names nothing. */
export function delegateIsSpecific(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const delegate = contextDelegate(data, context);
  if (delegate === undefined) return false;
  return delegate.isFullDelegate !== true;
}

/** One grant switch, for whichever kind of object the panel lists. */
function delegateGrantToggle(
  delegate: MockDelegate,
  objectType: DelegateObjectTypes,
  objectId: string,
  objectName: string
): ListModuleItem["toggle"] {
  return {
    value: mockActionValue(
      MOCK_ACTION.DELEGATE_TOGGLE_OBJECT,
      `${delegate.id}:${objectType}:${objectId}`
    ),
    checked: hasDelegateObject(delegate, objectType, objectId),
    label: `${objectName} for ${delegate.name}`
  };
}

/** Which products this delegate reaches — legacy's per-product picker. */
export function delegateProductItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const delegate = contextDelegate(data, context);
  if (delegate === undefined) return [];
  const { data: rows } = delegateProductsCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, product => ({
    id: product.id,
    title: product.name,
    description: product.serviceIdentifier ?? product.category,
    leadingIcon: Package,
    toggle: delegateGrantToggle(
      delegate,
      DelegateObjectTypes.CONTRACT_PRODUCT,
      product.id,
      product.name
    )
  }));
}

/** Which tickets this delegate reaches — legacy's per-ticket picker. */
export function delegateTicketItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const delegate = contextDelegate(data, context);
  if (delegate === undefined) return [];
  const { data: rows } = delegateTicketsCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, ticket => ({
    id: ticket.id,
    title: ticket.subject,
    description: ticket.department,
    leadingIcon: MessagesSquare,
    toggle: delegateGrantToggle(
      delegate,
      DelegateObjectTypes.TICKET,
      ticket.id,
      ticket.subject
    )
  }));
}

/**
 * Legacy child accounts (shown only when any exist — the nav gate). Only a
 * relation that ALLOWS it offers "Log in as": legacy's own switch, and the
 * refusal branch the dispatcher still answers if the value is replayed.
 */
export function childAccountItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = childAccountsCollection.resolve(data).useContext();
  return map(rows.value, child => ({
    id: child.id,
    title: child.name,
    to: `/account/child-accounts/${child.id}`,
    description: child.email,
    leadingIcon: UsersRound,
    moreActions: compact([
      {
        value: mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `/account/child-accounts/${child.id}`
        ),
        label: "Manage relation"
      },
      child.allow_impersonation && {
        value: mockActionValue(MOCK_ACTION.LOGIN_AS_CHILD, child.id),
        label: "Log in as child"
      },
      relationDetachAction(child)
    ])
  }));
}

/** Breaking one relation — the same control on the row's menu and the page's header. */
function relationDetachAction(child: MockChildAccount) {
  return {
    value: mockActionValue(MOCK_ACTION.RELATION_DETACH, child.id),
    label: "Detach"
  };
}

/** The relation the route names. */
function contextRelation(
  data: MockDataset,
  context: DataRouteContext
): MockChildAccount | undefined {
  return find(data.childAccounts, { id: context.entityId ?? "" });
}

/**
 * The relation's own facts. Its STATUS is where the parent stands with it
 * right now: signed in as the child, or simply linked to it — the one state
 * the relation actually has, and the one the ribbon changes.
 */
export function relationSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const child = contextRelation(data, context);
  if (child === undefined) return [];
  const isSignedInAs = data.persona.id === child.child_client_id;
  let status = "Linked";
  if (isSignedInAs) status = "Signed in as this account";
  return [
    { id: "name", label: "Name", value: child.name },
    { id: "email", label: "Email", value: child.email, copyable: true },
    { id: "status", label: "Status", value: status }
  ];
}

/** The three switches legacy's manage-relation panel offers, in its own order. */
const RELATION_SWITCHES: readonly {
  readonly key: ClientRelationToggleKeys;
  readonly title: string;
  readonly description: string;
}[] = [
  {
    key: ClientRelationToggleKeys.ALLOW_IMPERSONATION,
    title: "Allow impersonation",
    description: "You can sign in to this account without its password."
  },
  {
    key: ClientRelationToggleKeys.INHERIT_PAYMENT_DETAILS,
    title: "Inherit payment details",
    description: "This account is billed to your stored payment methods."
  },
  {
    key: ClientRelationToggleKeys.USE_PARENT_BRANDING,
    title: "Use parent branding",
    description: "This account sees your brand rather than ours."
  }
];

export function relationToggleItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const child = contextRelation(data, context);
  if (child === undefined) return [];
  return map(RELATION_SWITCHES, control => ({
    id: control.key,
    title: control.title,
    description: control.description,
    toggle: {
      value: mockActionValue(
        MOCK_ACTION.RELATION_TOGGLE,
        `${child.id}:${control.key}`
      ),
      checked: child[control.key],
      label: `${control.title} for ${child.name}`
    }
  }));
}

/** The relation page's one header control. */
export function relationHeaderActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  const child = contextRelation(data, context);
  if (child === undefined) return [];
  return [relationDetachAction(child)];
}

/**
 * Whether the brand appearance panel applies: the brand ALLOWS an appearance
 * to be lent (`UI_PARENT_BRANDING_ENABLED`), there is one to lend, and at
 * least one relation is wearing it. Legacy drew the panel off the same three.
 */
export function hasParentBranding(data: MockDataset): boolean {
  const isAllowed = data.features.UI_PARENT_BRANDING_ENABLED;
  const isLent = some(data.childAccounts, child => child.use_parent_branding);
  return isAllowed && data.parentBranding !== null && isLent;
}

/** What the children that inherit it actually see. */
export function parentBrandingItems(data: MockDataset): SpecModuleItem[] {
  const branding = data.parentBranding;
  if (branding === null) return [];
  return [
    { id: "name", label: "Brand name", value: branding.name },
    { id: "colour", label: "Colour", value: branding.colour, copyable: true },
    { id: "font", label: "Font", value: branding.font }
  ];
}

/**
 * The panel's own Edit control — legacy's form stood on the page itself
 * (`parentBrandAppearanceForm.vue`); the portal asks for it in the shell's
 * one dialog, as every other single-panel write does.
 */
export function parentBrandingActions(data: MockDataset): ButtonModuleAction[] {
  if (data.parentBranding === null) return [];
  return [
    {
      value: openFormValue(FORM_ID.PARENT_BRANDING),
      label: "Edit appearance"
    }
  ];
}

/** The logo itself — an image a term/value row cannot render. */
export function parentBrandingLogoItems(data: MockDataset): ListModuleItem[] {
  const branding = data.parentBranding;
  if (branding === null) return [];
  return [
    {
      id: "logo",
      title: "Logo",
      description: branding.name,
      leadingImageSrc: branding.logoSrc,
      leadingImageAlt: `${branding.name} logo`
    }
  ];
}

/** The affiliate overview (gated) — where withdrawals are sent. */
export function affiliateSpecItems(data: MockDataset): SpecModuleItem[] {
  if (data.affiliate === null) return [];
  const { payoutDestination } = data.affiliate;
  return [
    {
      id: "destination",
      label: "Destination",
      value: PAYOUT_DESTINATION_LABEL[payoutDestination.code]
    },
    {
      id: "detail",
      label: "Sent to",
      value: payoutDestination.detail,
      copyable: true
    }
  ];
}

/** Whether the client has joined the programme at all — the enrol screen's gate. */
export function affiliateIsEnrolled(data: MockDataset): boolean {
  if (data.affiliate === null) return false;
  if (data.affiliate.disabled) return false;
  return data.affiliate.enrolled;
}

/** Whether the enrol screen shows: a live account nobody has joined yet. */
export function affiliateNeedsEnrolling(data: MockDataset): boolean {
  if (data.affiliate === null) return false;
  if (data.affiliate.disabled) return false;
  return !data.affiliate.enrolled;
}

/**
 * Whether the brand runs no affiliate programme this client may work — the
 * OFF side of `isAffiliateEnabled`. A client who reaches the route anyway (the
 * menu entry is already gone) is told so, rather than shown a blank page.
 */
export function affiliateIsUnavailable(data: MockDataset): boolean {
  return !isAffiliateEnabled(data);
}

/** Whether the brand has suspended this affiliate account. */
export function affiliateIsDisabled(data: MockDataset): boolean {
  if (data.affiliate === null) return false;
  return data.affiliate.disabled;
}

/** The enrol screen's one control — legacy's opt-in button. */
export function affiliateEnrolAction(data: MockDataset): ButtonModuleAction[] {
  if (!affiliateNeedsEnrolling(data)) return [];
  return [{ value: MOCK_ACTION.AFFILIATE_ENROL, label: "Join the programme" }];
}

/**
 * Legacy's six stats. The two balances link to the lists that explain them,
 * as legacy's own figures did.
 */
export function affiliateStatItems(data: MockDataset): MetricModuleItem[] {
  if (data.affiliate === null) return [];
  const { since, stats } = data.affiliate;
  return [
    { label: "Affiliate since", value: since ?? "Not yet joined" },
    { label: "Visits", value: String(stats.visits) },
    { label: "Referrals", value: String(stats.referrals) },
    {
      label: "Pending balance",
      value: stats.pendingBalance.formatted,
      to: "/account/affiliate#commissions"
    },
    {
      label: "Available balance",
      value: stats.availableBalance.formatted,
      to: "/account/affiliate#payouts"
    },
    { label: "Withdrawn", value: stats.withdrawnBalance.formatted }
  ];
}

/** The links table's columns, in render order; the last names the row's own menu. */
export function affiliateLinkHeadings(): ListModuleHeading[] {
  return [
    { label: "Name" },
    { label: "Link" },
    { label: "Redirects to" },
    { label: "Clicks", numeric: true },
    { label: "Signups", numeric: true },
    { label: "Created" },
    { label: "" }
  ];
}

/** Legacy's referral links: what each one is, where it goes, and what it brought in. */
export function affiliateLinkItems(data: MockDataset): ListModuleItem[] {
  if (data.affiliate === null) return [];
  const { data: links } = affiliateLinksCollection.resolve(data).useContext();
  return map(links.value, link => ({
    id: link.id,
    title: link.name,
    leadingIcon: Link2,
    cells: [
      { value: link.url },
      { value: link.redirectUrl },
      { value: String(link.clicks), numeric: true },
      { value: String(link.signups), numeric: true },
      { value: link.createdAt }
    ],
    moreActions: [
      {
        value: mockActionValue(MOCK_ACTION.COPY, link.url),
        label: "Copy link"
      },
      {
        value: openFormValue(FORM_ID.AFFILIATE_LINK_UPDATE, link.id),
        label: "Edit"
      },
      {
        value: mockActionValue(MOCK_ACTION.AFFILIATE_LINK_REMOVE, link.id),
        label: "Delete"
      }
    ]
  }));
}

/** The links panel's own control — legacy's own way to mint another one (plan F12). */
export function affiliateLinkHeaderActions(
  data: MockDataset
): ButtonModuleAction[] {
  if (!affiliateIsEnrolled(data)) return [];
  return [
    {
      value: openFormValue(FORM_ID.AFFILIATE_LINK_CREATE),
      label: "Create new link"
    }
  ];
}

/**
 * The stats panel's own control (plan F12). A balance with nothing cleared in
 * it keeps the control on screen and says why, as the top-up control does — a
 * CTA that vanishes reads as a portal that lost it.
 */
export function affiliateWithdrawalActions(
  data: MockDataset
): ButtonModuleAction[] {
  // Legacy ANDed the brand key into the control's own presence
  // (`showManualWithdrawal`): a brand that takes no requests offers nowhere to
  // make one, which is a different thing from a balance with nothing cleared.
  if (!data.features.AFFILIATES_WITHDRAW_REQUEST) return [];
  if (!affiliateIsEnrolled(data)) return [];
  return [
    {
      value: openFormValue(FORM_ID.AFFILIATE_WITHDRAWAL_REQUEST),
      label: "Request withdrawal",
      disabledReason: withdrawalDisabledReason(data)
    }
  ];
}

function withdrawalDisabledReason(data: MockDataset): string | undefined {
  const account = useMockAffiliate(data).useContext().data.value;
  const isCleared = (account?.stats.availableBalance.amount ?? 0) > 0;
  if (isCleared) return undefined;
  return "Commission is paid out once it clears. Nothing has cleared yet.";
}

/**
 * Where withdrawals are sent, as a form (plan F4) — legacy's
 * `payoutDestination`. Three refs rather than one bag, because the `form`
 * module takes three props and the data-ref seam binds prop by prop.
 */
export function affiliatePayoutFormSchema(data: MockDataset): JsonSchema {
  return usePayoutDestinationSchema(payoutDestinationContext(data));
}

export function affiliatePayoutFormUischema(
  data: MockDataset
): UISchemaElement {
  return usePayoutDestinationUischema(payoutDestinationContext(data));
}

export function affiliatePayoutFormModel(data: MockDataset): FormModel {
  return payoutDestinationDefaults(payoutDestinationContext(data));
}

/** The referrals table's columns, in render order. */
export function affiliateReferralHeadings(): ListModuleHeading[] {
  return [{ label: "Client" }, { label: "Link" }, { label: "Date" }];
}

/** Legacy's referrals: who signed up, through which link, and when. */
export function affiliateReferralItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = affiliateReferralsCollection
    .resolve(data)
    .useContext();
  return map(rows.value, referral => ({
    id: referral.id,
    title: referral.client,
    leadingIcon: UserRound,
    cells: [
      { value: affiliateLinkName(data, referral.linkId) },
      { value: referral.date }
    ]
  }));
}

/** A link's own name, or its id where the link has since been deleted. */
function affiliateLinkName(data: MockDataset, linkId: string): string {
  const link = find(data.affiliate?.links ?? [], { id: linkId });
  if (link === undefined) return linkId;
  return link.name;
}

/**
 * Where one commission stands, in legacy's own words
 * (`commissionSummary.vue:62-186`): six readings, three of which name a date
 * and one of which names the reason the desk recorded — or says there was
 * none, which is legacy's own first plural branch.
 */
function commissionStanding(commission: MockAffiliateCommission): string {
  const { status } = commission;
  if (status === MOCK_COMMISSION_STATUS.REJECTED) {
    const when = commission.rejectedAt ?? commission.earnedAt;
    if (commission.rejectReason === undefined) {
      return `Rejected ${when} (no reason).`;
    }
    return `Rejected ${when}: '${commission.rejectReason}'.`;
  }
  if (status === MOCK_COMMISSION_STATUS.AWAITING_PAYMENT) {
    return "Awaiting invoice payment";
  }
  if (status === MOCK_COMMISSION_STATUS.PENDING_APPROVAL) {
    return `Approval expected ${commission.payoutCalculatedAt ?? commission.earnedAt}`;
  }
  if (status === MOCK_COMMISSION_STATUS.ON_HOLD) return "On hold";
  if (status === MOCK_COMMISSION_STATUS.CANCELLED) return "Cancelled";
  return `Approved ${commission.approvedAt ?? commission.earnedAt}`;
}

/** Legacy affiliate commissions — each row states where it stands, and its amount is toned to match. */
export function affiliateCommissionItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = affiliateCommissionsCollection
    .resolve(data)
    .useContext();
  return map(rows.value, commission => ({
    id: commission.id,
    title: commission.description,
    description: `Earned ${commission.earnedAt} · ${commissionStanding(commission)}`,
    leadingIcon: Link2,
    trailingText: commission.amount.formatted,
    status: {
      label: commission.amount.formatted,
      tone: COMMISSION_STATUS_TONE[commission.status]
    }
  }));
}

/** The payout history's columns, in render order; the last names the status badge. */
export function affiliatePayoutHeadings(): ListModuleHeading[] {
  return [
    { label: "Date" },
    { label: "Amount", numeric: true },
    { label: "Destination" },
    { label: "Detail" },
    { label: "Status" }
  ];
}

/** Legacy affiliate payouts — where each went, how it went, and why not. */
export function affiliatePayoutItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = affiliatePayoutsCollection.resolve(data).useContext();
  return map(rows.value, payout => ({
    id: payout.id,
    // The day it settled, or — while it has not — the day it was asked for.
    title: payout.paidAt ?? payout.requestedAt,
    leadingIcon: CreditCard,
    cells: [
      { value: payout.amount.formatted, numeric: true },
      { value: PAYOUT_DESTINATION_LABEL[payout.destination] },
      { value: payout.error ?? "" }
    ],
    status: {
      label: PAYOUT_STATUS_LABEL[payout.status],
      tone: PAYOUT_STATUS_TONE[payout.status]
    }
  }));
}

/** Whether the brand's own mail is running behind — legacy's delivery-delay notice. */
export function isEmailDeliveryDelayed(data: MockDataset): boolean {
  return data.emailDeliveryDelayed;
}

/**
 * The preview's header controls. Both of the ones this page carried are
 * legacy's STAFF controls (`emailHistoryTable.vue:236,249`, drawn behind
 * `isAdmin`), so the client's preview offers none — the message itself is
 * what a client came to read.
 */
export function emailHeaderActions(): ButtonModuleAction[] {
  return [];
}

// --- email history (legacy's emailHistoryTable, emailHistoryStatus, viewEmailModal)

/** All leads; Sent, Bounced and Failed narrow — legacy's four routes. */
const SENT_EMAIL_TABS = [
  { value: EMAIL_STATUS_TAB.ALL, label: "All" },
  {
    value: EMAIL_STATUS_TAB.SENT,
    label: SENT_EMAIL_STATUS_LABEL[SentEmailStatus.SENT]
  },
  {
    value: EMAIL_STATUS_TAB.BOUNCED,
    label: SENT_EMAIL_STATUS_LABEL[SentEmailStatus.BOUNCED]
  },
  {
    value: EMAIL_STATUS_TAB.FAILED,
    label: SENT_EMAIL_STATUS_LABEL[SentEmailStatus.ERROR]
  }
];

/** Legacy's `emailHistoryStatus` badge, word for word. */
const SENT_EMAIL_BADGE: Readonly<Record<SentEmailStatus, string>> = {
  [SentEmailStatus.SENT]: "Email sent",
  [SentEmailStatus.BOUNCED]: "Email bounced",
  [SentEmailStatus.ERROR]: "Send failed",
  [SentEmailStatus.SENDING]: "Sending"
};

const SENT_EMAIL_DETAIL_PATH = "/account/logs/emails";

export function sentEmailTabs(): TabsModuleItem[] {
  return statusTabs("/account/logs", SENT_EMAIL_TABS);
}

export function sentEmailStatus(
  data: MockDataset,
  context: DataRouteContext
): string {
  return showingStatus(
    context,
    map(SENT_EMAIL_TABS, "value"),
    EMAIL_STATUS_TAB.ALL
  );
}

/** Legacy's table row: the subject, who it went to, and how it went; the row opens the preview. */
export function sentEmailItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = sentEmailsCollection
    .resolve(data, context)
    .useContext();
  return map(rows.value, email => ({
    id: email.id,
    title: email.subject,
    description: `To: ${email.to}`,
    leadingIcon: Mail,
    datetime: email.dateCreated.date ?? undefined,
    trailingText: SENT_EMAIL_BADGE[email.status],
    trailingTone: SENT_EMAIL_STATUS_TONE[email.status],
    to: `${SENT_EMAIL_DETAIL_PATH}/${email.id}`
  }));
}

/** The email the route names — the preview's own subject. */
function contextSentEmail(
  data: MockDataset,
  context: DataRouteContext
): MockSentEmail | undefined {
  return find(data.sentEmails, { id: context.entityId ?? "" });
}

/** Legacy's `viewEmailModal` header: subject, from, to, cc, the outcome and its date. */
export function sentEmailSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const email = contextSentEmail(data, context);
  if (email === undefined) return [];
  const items: SpecModuleItem[] = [
    { id: "subject", label: "Subject", value: email.subject },
    { id: "from", label: "From", value: email.from },
    { id: "to", label: "To", value: email.to }
  ];
  if (email.cc !== "") items.push({ id: "cc", label: "CC", value: email.cc });
  items.push({
    id: "status",
    label: "Status",
    value: SENT_EMAIL_BADGE[email.status]
  });
  if (email.dateSent.date !== null && email.dateSent.date !== undefined) {
    items.push({ id: "sent", label: "Date sent", value: email.dateSent.date });
  }
  if (email.dateBounced.date !== null && email.dateBounced.date !== undefined) {
    items.push({
      id: "bounced",
      label: "Date bounced",
      value: email.dateBounced.date
    });
  }
  if (email.dateErrored.date !== null && email.dateErrored.date !== undefined) {
    items.push({
      id: "failed",
      label: "Send failed",
      value: email.dateErrored.date
    });
  }
  return items;
}

/** The message itself — what a client came to read. */
export function sentEmailBody(
  data: MockDataset,
  context: DataRouteContext
): string {
  return contextSentEmail(data, context)?.body ?? "";
}

/** Legacy login attempts. */
export function loginAttemptItems(data: MockDataset): ListModuleItem[] {
  const { data: rows } = loginAttemptsCollection.resolve(data).useContext();
  return map(rows.value, attempt => ({
    id: attempt.id,
    title: attempt.device,
    description: `${attempt.ip} · ${attempt.at.slice(0, 10)}`,
    leadingIcon: ShieldCheck,
    trailingText: attempt.succeeded ? "Succeeded" : "Failed",
    trailingTone: attempt.succeeded ? undefined : "danger"
  }));
}

// --- support pillar (plan Phase G; legacy src/views/client/support)

/** Legacy offered no "all" here, and neither does this: a closed thread beside an open one is noise. */
const TICKET_TABS = [
  { value: TICKET_STATUS_TAB.ACTIVE, label: "Active" },
  { value: TICKET_STATUS_TAB.CLOSED, label: "Closed" }
];

/** The tickets for the showing tab — legacy's Active/Closed tabs, as query state. */
export function ticketItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const { data: rows } = ticketsCollection.resolve(data, context).useContext();
  return map(rows.value, ticketListItem);
}

export function ticketTabs(): TabsModuleItem[] {
  return statusTabs("/support/tickets", TICKET_TABS);
}

export function ticketStatus(
  data: MockDataset,
  context: DataRouteContext
): string {
  return showingStatus(
    context,
    map(TICKET_TABS, "value"),
    TICKET_STATUS_TAB.ACTIVE
  );
}

/** The ticket the route names — every ticket selector's own subject. */
function contextTicket(
  data: MockDataset,
  context: DataRouteContext
): MockTicket | undefined {
  return find(data.tickets, { id: context.entityId ?? "" });
}

/**
 * The ticket's header fields — legacy's own detail panel: the reference the
 * client quotes back to us (copyable), where it sits, when it was raised and
 * finished, who has it, and the product it is about.
 */
export function ticketSpecItems(
  data: MockDataset,
  context: DataRouteContext
): SpecModuleItem[] {
  const ticket = contextTicket(data, context);
  if (ticket === undefined) return [];
  return compact([
    ticket.reference !== undefined && {
      id: "reference",
      label: "Reference",
      value: ticket.reference,
      copyable: true
    },
    { id: "subject", label: "Subject", value: ticket.subject },
    { id: "department", label: "Department", value: ticket.department },
    {
      id: "status",
      label: "Status",
      value: TICKET_STATUS_LABEL[ticket.status],
      tag: ticketLockedTag(ticket)
    },
    {
      id: "created",
      label: "Created",
      value: ticket.createdAt.slice(0, ISO_DATE_LENGTH)
    },
    ticket.closedAt !== undefined && {
      id: "closed",
      label: "Closed",
      value: ticket.closedAt.slice(0, ISO_DATE_LENGTH)
    },
    ticket.assignedAgent !== undefined && {
      id: "agent",
      label: "Assigned to",
      value: ticket.assignedAgent
    },
    { id: "updated", label: "Updated", value: ticket.updatedAt.slice(0, 10) },
    ticketRelatedProductRow(data, ticket)
  ]);
}

/** A locked thread says so beside its status — legacy's own locked tooltip. */
function ticketLockedTag(ticket: MockTicket): SpecModuleItem["tag"] {
  if (!isTicketLocked(ticket)) return undefined;
  return { label: "Locked", tone: "warning" };
}

/** The product this ticket is about, as a row that opens it. */
function ticketRelatedProductRow(
  data: MockDataset,
  ticket: MockTicket
): SpecModuleItem | undefined {
  if (ticket.productId === undefined) return undefined;
  const product = find(data.products, { id: ticket.productId });
  if (product === undefined) return undefined;
  return {
    id: "related-product",
    label: "Related product",
    value: product.name,
    to: `/${product.groupSlug}/${product.id}`
  };
}

/**
 * Legacy's `relatedProductComp` pair — the notes and secrets kept about the
 * product this thread is about, each opening the product's own panel. Offered
 * only where the brand keeps them at all, and only while the thread names a
 * product to keep them against.
 */
export function ticketRelatedProductLinks(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  if (!data.features.CLIENT_NOTES_AND_SECRETS_ENABLED) return [];
  const ticket = contextTicket(data, context);
  const product = find(data.products, { id: ticket?.productId ?? "" });
  if (product === undefined) return [];
  const panel = `/${product.groupSlug}/${product.id}`;
  return [
    {
      value: mockActionValue(MOCK_ACTION.NAVIGATE, `${panel}#notes`),
      label: "Show notes"
    },
    {
      value: mockActionValue(MOCK_ACTION.NAVIGATE, `${panel}#secrets`),
      label: "Show secrets"
    }
  ];
}

/** Whether that pair applies at all — the row it rides on renders nowhere otherwise. */
export function ticketHasRelatedProductLinks(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return size(ticketRelatedProductLinks(data, context)) > 0;
}

/** Whether the thread is still taking replies — the composer's own gate. */
export function ticketIsOpen(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const ticket = contextTicket(data, context);
  if (ticket === undefined) return false;
  return !isTicketClosed(ticket);
}

/** Whether the detail page has a status band to show at all. */
export function ticketHasStatusBanner(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return contextTicket(data, context) !== undefined;
}

/** Legacy's status banner: where the thread stands, and since when. */
export function ticketStatusMessage(
  data: MockDataset,
  context: DataRouteContext
): string {
  const ticket = contextTicket(data, context);
  if (ticket === undefined) return "";
  return TICKET_STATUS_SENTENCE[ticket.status](ticketStatusDate(ticket));
}

/**
 * The day the sentence reads FROM. Legacy dated a scheduled thread on when it
 * is due to open and every other one on when it last moved
 * (`clientTicketStatus.vue:36-44`).
 */
function ticketStatusDate(ticket: MockTicket): string {
  if (ticket.status === TicketStatusCodes.SCHEDULED) {
    return (ticket.scheduledAt ?? ticket.updatedAt).slice(0, ISO_DATE_LENGTH);
  }
  return ticket.updatedAt.slice(0, ISO_DATE_LENGTH);
}

/**
 * One sentence per status code — legacy's own `_sentence.ticket.<code>`
 * (`clientTicketStatus.vue:5`), which is what the thread's banner said and
 * the only place a client reads where their thread stands in words.
 */
const TICKET_STATUS_SENTENCE: Readonly<
  Record<TicketStatusCodes, (date: string) => string>
> = {
  [TicketStatusCodes.OPEN]: date =>
    `This ticket is open. It was last updated ${date}.`,
  // Legacy published a sentence PER CODE, and this one is not the open one:
  // the thread is waiting on the desk because the client just answered it.
  [TicketStatusCodes.CLIENT_REPLIED]: date =>
    `You replied ${date}. This ticket is back with our team.`,
  [TicketStatusCodes.IN_PROGRESS]: date =>
    `This ticket is in progress. It was last updated ${date}.`,
  [TicketStatusCodes.AWAITING_RESPONSE]: date =>
    `This ticket is awaiting response. You replied ${date}.`,
  [TicketStatusCodes.SCHEDULED]: date =>
    `This ticket is scheduled to be opened ${date}.`,
  [TicketStatusCodes.CLOSED]: date => `This ticket was closed ${date}.`
};

export function ticketStatusTitle(
  data: MockDataset,
  context: DataRouteContext
): string {
  const ticket = contextTicket(data, context);
  if (ticket === undefined) return "";
  return TICKET_STATUS_LABEL[ticket.status];
}

export function ticketStatusTone(
  data: MockDataset,
  context: DataRouteContext
): BannerModuleProps["tone"] {
  const ticket = contextTicket(data, context);
  if (ticket === undefined) return undefined;
  return TICKET_STATUS_TONE[ticket.status];
}

/**
 * The new-ticket page's one form (plan F4) — legacy's `ticketForm`. The
 * submit is a constant, so the page config names it directly; the three data
 * refs are what the dataset decides.
 */
export function newTicketFormSchema(
  data: MockDataset,
  context: DataRouteContext
): JsonSchema {
  return useNewTicketSchema(ticketFormContext(data, context));
}

export function newTicketFormUischema(
  data: MockDataset,
  context: DataRouteContext
): UISchemaElement {
  return useNewTicketUischema(ticketFormContext(data, context));
}

export function newTicketFormModel(
  data: MockDataset,
  context: DataRouteContext
): FormModel {
  return newTicketDefaults(ticketFormContext(data, context));
}

/**
 * Legacy's Manage-ticket menu, holding only what this thread can take. The
 * control's own FORM follows the count (`ticketManageVariant`): several
 * actions collapse into the dropdown legacy drew, one renders as itself.
 */
export function ticketManageActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  const ticket = contextTicket(data, context);
  if (ticket === undefined) return [];
  return compact([
    isTicketClosed(ticket) && {
      value: mockActionValue(MOCK_ACTION.TICKET_REOPEN, ticket.id),
      label: "Reopen ticket"
    },
    // Legacy's `changeTicketSubjectModal`: offered on a thread that is still
    // running and that the desk has not locked (plan F12).
    canRenameTicket(ticket) && {
      value: openFormValue(FORM_ID.TICKET_SUBJECT_SAVE, ticket.id),
      label: "Edit subject"
    },
    canCloseTicket(ticket) && {
      value: mockActionValue(MOCK_ACTION.TICKET_CLOSE, ticket.id),
      label: "Close ticket"
    },
    // Legacy's `add_related_product` / `change_related_product`: the same
    // picker under two labels, offered on a thread that is still running and
    // that the desk has not locked. A client holding no products has nothing
    // for the picker to list, so the control is not offered either.
    canSetTicketProduct(ticket) &&
      size(data.products) > 0 && {
        value: openFormValue(FORM_ID.TICKET_SET_PRODUCT, ticket.id),
        label: ticketProductLabel(ticket)
      },
    canDetachTicketProduct(ticket) && {
      value: mockActionValue(MOCK_ACTION.TICKET_REMOVE_PRODUCT, ticket.id),
      label: "Remove related product"
    }
  ]);
}

/** Which of legacy's two labels the picker's control wears — the count of what is already named. */
function ticketProductLabel(ticket: MockTicket): string {
  if (hasTicketProduct(ticket)) return "Change related product";
  return "Add related product";
}

export function ticketManageVariant(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleVariant {
  const actions = ticketManageActions(data, context);
  if (actions.length > 1) return BUTTON_MODULE_VARIANT.DROPDOWN;
  // One control is its own button: a menu holding a single row is a click
  // more than the thing it holds.
  return BUTTON_MODULE_VARIANT.GROUP;
}

/** Whether the delegate picker applies — an open thread nobody else holds yet. */
export function ticketCanDelegate(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const ticket = contextTicket(data, context);
  if (ticket === undefined) return false;
  return canDelegateTicket(ticket) && data.delegates.length > 0;
}

/** Who this thread may be handed to — one row per delegate on the account. */
export function ticketDelegateItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const ticket = contextTicket(data, context);
  if (ticket === undefined) return [];
  return map(data.delegates, delegate => ({
    id: delegate.id,
    title: delegate.name,
    description: delegate.email,
    leadingIcon: UserRound,
    action: {
      value: mockActionValue(
        MOCK_ACTION.TICKET_DELEGATE,
        `${ticket.id}:${delegate.id}`
      ),
      label: "Give access"
    }
  }));
}

/**
 * The ticket's thread — every message, oldest first, as legacy displayed it.
 * Consecutive messages from ONE author read as a run under a single name
 * (`ticketMessages.vue` grouped on the author key), so a reply chain says who
 * is speaking once rather than on every line.
 */
/** The thread's two views — legacy's own tab rail (`ticketMessages.vue:42-46`). */
export const TICKET_THREAD_TAB = {
  MESSAGES: "messages",
  ATTACHMENTS: "attachments"
} as const;

export type TicketThreadTab =
  (typeof TICKET_THREAD_TAB)[keyof typeof TICKET_THREAD_TAB];

/** How many entries the thread shows before it offers to fetch more (`ticketMessages.vue:105-112`). */
const TICKET_THREAD_PAGE = 20;

function showingThreadTab(value: string | undefined): TicketThreadTab {
  if (value === TICKET_THREAD_TAB.ATTACHMENTS) {
    return TICKET_THREAD_TAB.ATTACHMENTS;
  }
  return TICKET_THREAD_TAB.MESSAGES;
}

/**
 * The whole feed, oldest first: every message, and every time the standing
 * moved, interleaved by WHEN each happened — which is what legacy's own feed
 * provider built (`ticketFeedProvider.vue:148-151,228-249`).
 */
/** What a feed entry IS — the fact `groupedFeed` discriminates on. */
const TICKET_FEED_KIND = {
  MESSAGE: "message",
  STATUS: "status"
} as const;

type TicketFeedKind = (typeof TICKET_FEED_KIND)[keyof typeof TICKET_FEED_KIND];

/** One feed row, carrying what kind of thing it reports beside what it renders. */
type TicketFeedEntry = ListModuleItem & { readonly kind: TicketFeedKind };

function ticketFeed(ticket: MockTicket): TicketFeedEntry[] {
  const messages = map(ticket.messages, message => ({
    kind: TICKET_FEED_KIND.MESSAGE,
    id: message.id,
    title: message.author,
    description: messageBody(message),
    time: message.sentAt.slice(0, ISO_DATE_LENGTH),
    datetime: message.sentAt,
    moreActions: ticketMessageActions(ticket, message)
  }));
  const changes = map(ticket.statusLog ?? [], change => ({
    kind: TICKET_FEED_KIND.STATUS,
    id: change.id,
    title: `Status changed to ${TICKET_STATUS_LABEL[change.status]}`,
    description: "",
    time: change.at.slice(0, ISO_DATE_LENGTH),
    datetime: change.at
  }));
  const feed: TicketFeedEntry[] = [...messages, ...changes];
  return sortBy(feed, entry => entry.datetime ?? "");
}

/**
 * Which rows continue the voice above them, worked out on the feed AS
 * RENDERED: a status entry between two messages from one author breaks the
 * run, because the thread no longer reads as one uninterrupted turn.
 */
function groupedFeed(feed: readonly TicketFeedEntry[]): ListModuleItem[] {
  return map(feed, (entry, index) => {
    const previous = feed[index - 1];
    const continuesAVoice =
      entry.kind === TICKET_FEED_KIND.MESSAGE &&
      previous?.kind === TICKET_FEED_KIND.MESSAGE &&
      previous.title === entry.title;
    return assign(omit(entry, "kind"), { groupWithPrevious: continuesAVoice });
  });
}

/**
 * The thread as the page renders it: the showing tab's entries, capped at one
 * page. The ATTACHMENTS view is legacy's second tab — the messages that
 * actually carry files, and nothing else.
 */
export function ticketMessageItems(
  data: MockDataset,
  context: DataRouteContext
): ListModuleItem[] {
  const ticket = find(data.tickets, { id: context.entityId ?? "" });
  if (ticket === undefined) return [];
  if (showingThreadTab(context.status) === TICKET_THREAD_TAB.ATTACHMENTS) {
    return ticketAttachmentItems(ticket);
  }
  return groupedFeed(threadPage(ticketFeed(ticket), threadShown(context)));
}

/**
 * The page the thread OPENS on is its LATEST entries — legacy loaded a thread
 * newest-end first and fetched the earlier ones behind it
 * (`ticketMessages.vue:42-46,105-112`). The page still reads oldest-first
 * inside itself, because a conversation reads downwards; Show earlier simply
 * takes more off the front.
 */
function threadPage(
  feed: readonly TicketFeedEntry[],
  shown: number
): TicketFeedEntry[] {
  return takeRight(feed, shown);
}

/** Only the messages that carry files, in the thread's own order. */
function ticketAttachmentItems(ticket: MockTicket): ListModuleItem[] {
  const carrying = filter(
    ticket.messages,
    message => size(compact(message.attachments ?? [])) > 0
  );
  return map(carrying, message => ({
    id: message.id,
    title: message.author,
    description: `Attachments: ${compact(message.attachments ?? []).join(", ")}`,
    time: message.sentAt.slice(0, ISO_DATE_LENGTH),
    datetime: message.sentAt
  }));
}

/** How many entries the route has asked for — one page, plus a page per Show more. */
function threadShown(context: DataRouteContext): number {
  const asked = Number(context.page ?? "1");
  if (!Number.isFinite(asked) || asked < 1) return TICKET_THREAD_PAGE;
  return TICKET_THREAD_PAGE * asked;
}

/** Whether anything is still behind the fold — what the Show more control hangs off. */
export function ticketHasMoreMessages(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  const ticket = find(data.tickets, { id: context.entityId ?? "" });
  if (ticket === undefined) return false;
  if (showingThreadTab(context.status) === TICKET_THREAD_TAB.ATTACHMENTS) {
    return false;
  }
  return size(ticketFeed(ticket)) > threadShown(context);
}

/** The rail's two tabs — each one navigates, so a reload keeps the view. */
export function ticketThreadTabItems(
  data: MockDataset,
  context: DataRouteContext
): TabsModuleItem[] {
  const ticket = find(data.tickets, { id: context.entityId ?? "" });
  if (ticket === undefined) return [];
  return statusTabs(`/support/tickets/${ticket.id}`, [
    { value: TICKET_THREAD_TAB.MESSAGES, label: "Messages" },
    { value: TICKET_THREAD_TAB.ATTACHMENTS, label: "Attachments" }
  ]);
}

/** Which tab is showing — the rail renders the one the route names. */
export function ticketThreadActiveTab(context: DataRouteContext): string {
  return showingThreadTab(context.status);
}

/**
 * The Show-more control, which asks the route for one page more. A LIST, and
 * fed to the button module's GROUP variant: `single` renders `label`/`value`
 * props and reads no action at all, so a data-fed control has to be a set —
 * an empty one renders nothing, which is what a thread with nothing behind
 * the fold should show.
 */
export function ticketThreadMoreActions(
  data: MockDataset,
  context: DataRouteContext
): ButtonModuleAction[] {
  if (!ticketHasMoreMessages(data, context)) return [];
  const ticket = find(data.tickets, { id: context.entityId ?? "" });
  if (ticket === undefined) return [];
  const shown = Number(context.page ?? "1");
  const next = Number.isFinite(shown) ? shown + 1 : 2;
  const tab = showingThreadTab(context.status);
  return [
    {
      value: mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/support/tickets/${ticket.id}?status=${tab}&page=${next}`
      ),
      label: "Show earlier messages"
    }
  ];
}

/** What an empty view says — the two tabs answer differently. */
export function ticketThreadEmptyTitle(context: DataRouteContext): string {
  if (showingThreadTab(context.status) === TICKET_THREAD_TAB.ATTACHMENTS) {
    return "No attachments on this thread";
  }
  return "No messages";
}

/** What a withdrawn message says where its text stood — legacy's own notice. */
const DELETED_MESSAGE_NOTICE = "You deleted this message.";

/**
 * One message as the thread reads it. A withdrawn one prints the notice legacy
 * printed in place of its text. A REWRITTEN one says nothing: legacy's edited
 * marker is staff-only (`ticketMessage.vue:148`, `v-if="isAdmin && ..."`), and
 * what it printed was the attribution `edited_by {actor}`, so a client's own
 * thread never carried one. The stamp is still on the message data.
 *
 * The files sent with it are named under it (plan F9: names only, nothing
 * uploaded) — the timeline renders a title, a description and a time, so the
 * names ride the description.
 */
function messageBody(message: MockTicketMessage): string {
  if (isTicketMessageDeleted(message)) return DELETED_MESSAGE_NOTICE;
  const named = compact(message.attachments ?? []);
  if (isEmpty(named)) return message.body;
  return `${message.body}\n\nAttachments: ${named.join(", ")}`;
}

/**
 * The message row's own menu — legacy's per-message dropdown
 * (`ticketMessage.vue:12-34`), which offered Edit and Delete on the client's
 * own messages while the thread was open, plus the per-file delete
 * `ticketMessageFiles.vue:8` hung off the same gate. A withdrawn message keeps
 * ONE entry, the link legacy's notice carried to what it said.
 */
function ticketMessageActions(
  ticket: MockTicket,
  message: MockTicketMessage
): NonNullable<ListModuleItem["moreActions"]> {
  if (isTicketMessageDeleted(message)) {
    return [
      {
        value: mockActionValue(
          MOCK_ACTION.TICKET_MESSAGE_VIEW_DELETED,
          message.id
        ),
        label: "View deleted message"
      }
    ];
  }
  if (!canManageTicketMessage(ticket, message)) return [];
  return [
    {
      value: mockActionValue(
        MOCK_ACTION.OPEN_FORM,
        `${FORM_ID.TICKET_MESSAGE_EDIT}:${ticket.id}:${message.id}`
      ),
      label: "Edit"
    },
    {
      value: mockActionValue(MOCK_ACTION.TICKET_MESSAGE_DELETE, message.id),
      label: "Delete"
    },
    ...map(compact(message.attachments ?? []), name => ({
      value: mockActionValue(
        MOCK_ACTION.TICKET_ATTACHMENT_DELETE,
        `${message.id}:${name}`
      ),
      label: `Remove ${name}`
    }))
  ];
}

/**
 * The support page's PIN row — the same facade the account aside's panel
 * reads, so a PIN regenerated in one place reads the same in the other. This
 * row keeps the spec module's own masked-value affordance; the panel drives
 * its masking from the facade instead, as legacy's Reveal/Hide pair did.
 */
export function supportPinSpecItems(data: MockDataset): SpecModuleItem[] {
  const pin = supportPin(data);
  if (!isSupportPinEnabled(data) || pin === undefined) return [];
  return [{ id: "pin", label: "Support PIN", value: pin, secret: true }];
}

function ticketListItem(ticket: MockTicket): ListModuleItem {
  return {
    id: ticket.id,
    title: ticket.subject,
    to: `/support/tickets/${ticket.id}`,
    // The reference leads, as legacy's row did: it is what a client quotes
    // back to us when they call about the thread.
    description: compact([
      ticket.reference,
      ticket.department,
      `Updated ${ticket.updatedAt.slice(0, 10)}`
    ]).join(" · "),
    leadingIcon: LifeBuoy,
    tags: ticketRowTags(ticket),
    status: {
      label: TICKET_STATUS_LABEL[ticket.status],
      tone: TICKET_STATUS_TONE[ticket.status]
    }
  };
}

/** Legacy's row markers: a thread somebody else holds, and one with a call booked. */
function ticketRowTags(ticket: MockTicket): ListModuleItem["tags"] {
  return compact([
    ticket.isDelegated === true && { label: "Delegated" },
    ticket.scheduledAt !== undefined && { label: "Scheduled" }
  ]);
}

/** The bell's unread count — legacy's notifications-dropdown badge. */
export function unreadNotificationCount(data: MockDataset): number {
  return size(filter(data.notifications, { read: false }));
}

/**
 * Legacy `ClientPrimaryTabigation()` — its six entries, its labels and its
 * order, with its `if:` predicates read off this brand's own gates (plan R8):
 * Support goes while the brand disables the support system, "Place new order"
 * while the brand hides its store, and a brand selling from its OWN
 * storefront links out to it rather than into the portal's catalogue.
 *
 * The brand's own menu pages are injected at position 2, where legacy's
 * `navigationRibbon` put them — after Products & Services (gap doc X15).
 */
export function pillarNavItems(data: MockDataset): MenuItem[] {
  const { DISABLE_SUPPORT_SYSTEM, showStore } = data.features;
  return compact([
    { to: "/", label: "Dashboard", icon: House },
    { to: "/products", label: "Products & Services", icon: Package },
    ...customPageNavItems(data),
    { to: "/billing", label: "Billing", icon: Receipt },
    { to: "/account", label: "My Account", icon: CircleUserRound },
    !DISABLE_SUPPORT_SYSTEM && {
      to: "/support",
      label: "Support",
      icon: MessagesSquare
    },
    showStore && placeOrderNavItem(data.features.customStorefrontUrl)
  ]);
}

/** The brand pages that asked to be in the menu, in seeded order. */
function customPageNavItems(data: MockDataset): MenuItem[] {
  return map(filter(data.customPages, { showOnMenu: true }), page => ({
    to: customPagePath(page.slug),
    label: page.title,
    icon: FileText
  }));
}

/** Where one custom page lives — its slug is a top-level segment, as legacy served it. */
export function customPagePath(slug: string): string {
  return `/${slug}`;
}

/** The page the catch-all resolved — its slug arrives as the route's entity. */
function contextCustomPage(
  data: MockDataset,
  context: DataRouteContext
): MockCustomPage | undefined {
  return find(data.customPages, { slug: context.entityId ?? "" });
}

/** The brand's own words on a custom page; empty where the page embeds one instead. */
export function customPageMarkdown(
  data: MockDataset,
  context: DataRouteContext
): string {
  return contextCustomPage(data, context)?.body ?? "";
}

export function customPageHasBody(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return customPageMarkdown(data, context) !== "";
}

/** The page a custom page embeds — legacy's iframe-typed page, as the prose module's frames. */
export function customPageFrames(
  data: MockDataset,
  context: DataRouteContext
): ProseModuleFrame[] {
  const page = contextCustomPage(data, context);
  if (page?.iframeUrl === undefined) return [];
  return [{ title: page.title, url: page.iframeUrl }];
}

export function customPageHasFrames(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return customPageFrames(data, context).length > 0;
}

/**
 * One brand-authored slot's body (plan R12), read through the template facade
 * — a factory, so the ref table names a code and nothing else repeats.
 */
export function templateMarkdown(
  code: IClientTemplateSlot["code"]
): (data: MockDataset) => string {
  return (data: MockDataset): string => templateSlotBody(data.templates, code);
}

/** Whether the brand wrote anything into that slot — the row's own presence gate. */
export function hasTemplate(
  code: IClientTemplateSlot["code"]
): (data: MockDataset) => boolean {
  return (data: MockDataset): boolean =>
    templateSlotBody(data.templates, code) !== "";
}

/** Whose portal this is — the profile dropdown's own identity line. */
export function accountMenuHeading(data: MockDataset): string {
  return compact([accountDisplayName(data), data.persona.email]).join(" · ");
}

/**
 * The profile dropdown's rows — the support PIN first, where legacy put it,
 * then the destinations. The PIN row reads masked until it is asked for, and
 * a brand that offers none has no row at all.
 */
export function accountMenuItems(data: MockDataset): AccountMenuItem[] {
  return compact([
    isSupportPinEnabled(data) && {
      value: mockActionValue(MOCK_ACTION.PIN_REVEAL, data.persona.id),
      label: `Support PIN · ${supportPinDisplay(data)}`
    },
    // Legacy's tenancy switcher — offered only where there is a second
    // account to switch to, exactly as its modal only ever listed real ones.
    hasAccountChoice(data.persona) && {
      value: openFormValue(FORM_ID.SWITCH_ACCOUNT),
      label: "Switch account"
    },
    {
      value: mockActionValue(MOCK_ACTION.NAVIGATE, "/account/profile"),
      label: "My account"
    },
    // The sign-out route owns what happens next (plan F11): it ends any
    // impersonation, says so, and lands on the sign-in screen.
    {
      value: mockActionValue(MOCK_ACTION.NAVIGATE, "/logout"),
      label: "Sign out"
    }
  ]);
}

/** The PIN as the dropdown reads it — masked until this session revealed it. */
function supportPinDisplay(data: MockDataset): string {
  const pin = supportPin(data);
  if (pin === undefined) return PIN_MASK;
  if (isSupportPinRevealed(data.persona)) return pin;
  return PIN_MASK;
}

/**
 * The one thing to do on an empty products or orders list — legacy's own
 * "Place new order", behind the same `showStore` gate its nav entry sits
 * behind. A brand selling from its OWN storefront offers none here: the
 * pillar nav already links out to it, and this seam navigates in-app.
 */
export function placeOrderAction(
  data: MockDataset,
  context: DataRouteContext
): ListModuleProps["emptyAction"] {
  const { showStore, customStorefrontUrl } = data.features;
  if (!showStore || customStorefrontUrl !== undefined) return undefined;
  const slug = context.groupSlug ?? "products";
  return {
    value: mockActionValue(MOCK_ACTION.NAVIGATE, `/${slug}/order`),
    label: "Place new order"
  };
}

/** The store entry: the portal's own catalogue, or the brand's storefront as an external anchor. */
function placeOrderNavItem(storefrontUrl: string | undefined): MenuItem {
  if (storefrontUrl === undefined) {
    return {
      to: "/products/order",
      label: "Place New Order",
      icon: ShoppingBasket
    };
  }
  return {
    href: storefrontUrl,
    label: "Place New Order",
    icon: ShoppingBasket
  };
}

/**
 * The contextual side menu — legacy served one per section (each section's own
 * `menu.ts` under `src/router/client`), and this returns THAT pillar's items,
 * transcribed in `fixtures/legacy-menus.fixture.ts`. Brand-agnostic by design:
 * the menus are the portal's, and the per-brand part is the GATES, which carry
 * legacy's own `if:` predicates against this dataset's facts — notes & secrets
 * and the affiliate programme behind the brand's features, child accounts
 * behind the data. The dashboard had no side menu, so it resolves to none.
 */
export function pillarSubmenuItems(
  data: MockDataset,
  context: DataRouteContext
): MenuItem[] {
  switch (context.pillar) {
    case PORTAL_PILLAR.PRODUCTS:
      return productsSubmenuItems(data, context);
    case PORTAL_PILLAR.BILLING:
      return [...LEGACY_BILLING_SUBMENU];
    case PORTAL_PILLAR.SUPPORT:
      return [...LEGACY_SUPPORT_SUBMENU];
    case PORTAL_PILLAR.ACCOUNT:
      return filter(LEGACY_ACCOUNT_SUBMENU, item =>
        accountItemPermitted(data, item)
      );
    default:
      return [];
  }
}

/** Whether the pillar serves a side menu at all — a custom page and the logged-out screens do not, and a pane slot showing an empty menu is a bordered blank. */
export function hasPillarSubmenu(
  data: MockDataset,
  context: DataRouteContext
): boolean {
  return pillarSubmenuItems(data, context).length > 0;
}

/** Legacy's account-menu `if:` predicates, by the item's own destination. */
function accountItemPermitted(data: MockDataset, item: MenuItem): boolean {
  if (item.to === "/account/notes") {
    return data.features.CLIENT_NOTES_AND_SECRETS_ENABLED;
  }
  if (item.to === "/account/affiliate") {
    return isAffiliateEnabled(data);
  }
  if (item.to === "/account/child-accounts") {
    return data.childAccounts.length > 0;
  }
  return true;
}

/**
 * Legacy's products side menu (`views/client/products/index.vue`, NOT its
 * `menu.ts` — that file holds the listing's own tabs): the three default
 * routes, then "Browse by category" over the categories the client actually
 * has products in (legacy derived those from its contract-categories
 * provider, so they are DATA here too, never a hand-authored list).
 *
 * Legacy's "Show delegated products" toggle is out of scope: it belongs to the
 * delegate persona context, which the plan rules out (form-phase plan §11 O-C).
 */
function productsSubmenuItems(
  data: MockDataset,
  context: DataRouteContext
): MenuItem[] {
  const slug = context.groupSlug;
  if (slug === undefined) return [];

  const inGroup = filter(data.products, { groupSlug: slug });
  const categories = uniq(map(inGroup, "category")).sort();

  return compact([
    { to: `/${slug}`, label: "All products and services", icon: Package },
    {
      to: `/${slug}?type=${MOCK_BILLING_TYPE.SUBSCRIPTION}`,
      label: "Subscriptions",
      icon: Repeat
    },
    !data.features.hideOneTimePurchases && {
      to: `/${slug}?type=${MOCK_BILLING_TYPE.ONE_TIME}`,
      label: "One-time purchases",
      icon: Receipt
    },
    {
      // No destination — a group LABEL over its category children; a `to`
      // here duplicated "All products and services" and both lit at once.
      label: "Browse by category",
      icon: FolderTree,
      children: map(categories, category => ({
        to: `/${slug}?category=${encodeURIComponent(category)}`,
        label: category,
        icon: Package
      }))
    }
  ]);
}

/** The listing's own filters — legacy's type route-groups and category routes, as query state on one route. */
