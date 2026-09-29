/** @internal */
import {
  BrandTaxTypes,
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { parseBillingCycle } from "../product";
import { useProductName, useUischemaTitle } from "../product/product.utils";
import { useI18n } from "../system-localisation";
import { removeTrailingZeroes, useDate, useTranslateName } from "../../utils";
import { castArray, compact, isEmpty, join, map, pick } from "lodash-es";
import type { LookupItem } from "../lookup";
import type {
  ConsolidationBody,
  ContractProduct,
  ContractProductClient,
  ContractProductMeta,
  ContractProductRequest,
  MovedToContractProduct,
  RequestCancellationBody,
  RequestCancellationModel,
  ScheduleCancellationBody,
  ScheduleCancellationModel,
  ScheduledAction,
  SetConsolidationModel,
  SoftCancelBody,
  SoftCancelModel,
  UnpaidInvoice
} from "./contract-product.types";
import type {
  IClient,
  IContractCancellationRequest,
  IContractProduct,
  IContractProductScheduledCancellation,
  IInvoice,
  IScheduledAction,
  IStatus,
  ITag,
  ScheduledActionTypes
} from "@upmind-automation/types";

/** `tags` reaches the wire on this record but is undeclared on the shared
 * `IContractProduct` platform type (verify.md B1) — augmented locally. */
type WireContractProduct = IContractProduct & { tags?: ITag[] };

/** An `unpaid_recurring_invoices` row is the invoice's LINE for this product,
 * not the invoice: its status arrives as `invoice_status`, never `status`,
 * though the shared `IContractProduct` types the relation as `IInvoice[]`. */
type WireUnpaidRecurringInvoice = IInvoice & { invoice_status?: IStatus };

/** A `scheduled_actions` row carries its kind as `action`, never the
 * `action_code` the shared `IScheduledAction` declares. */
type WireScheduledAction = Omit<IScheduledAction, "action_code"> & {
  action: ScheduledActionTypes;
};
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.mappers
 * @description Wire ↔ view-model shaping for contract products (design 8.10,
 * R19). Inbound: `mapContractProducts` / `mapContractProduct`. Outbound: one
 * body mapper per write of design 8.3. No HTTP; the billing-cycle label reads
 * the brand's term designation through `parseBillingCycle`.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContractProducts.ts` / `useContractProduct.ts`, or the barrel's curated
 * `mapContractProduct` export (`@internal/no-cross-module-imports`).
 */

/**
 * Maps the list response to the view-model collection.
 *
 * @param taxType - the portal brand's tax type; a list row carries no `brand`.
 */
export function mapContractProducts(
  raw: IContractProduct | IContractProduct[],
  taxType?: BrandTaxTypes
): ContractProduct[] {
  return map(castArray(raw), record => toContractProduct(record, taxType));
}

/** The translated-badge flags for a contract product's own `status.code` (R38 item 9, G4). */
export function mapContractProductMeta(
  code?: ContractStatusCodes
): ContractProductMeta {
  return {
    isActive: code === ContractStatusCodes.ACTIVE,
    isAwaitingActivation: code === ContractStatusCodes.AWAITING_ACTIVATION,
    isCancelled: code === ContractStatusCodes.CANCELLED,
    isClosed: code === ContractStatusCodes.CLOSED,
    isFraud: code === ContractStatusCodes.FRAUD,
    isPending: code === ContractStatusCodes.PENDING,
    isSuspended: code === ContractStatusCodes.SUSPENDED
  };
}

/**
 * The row's price, as legacy `cProdMixin.getPriceTermSummary` picks it: a
 * subscription shows its recurring price, a one-time product its discounted
 * price, each tax-inclusive or net per the brand's tax type (B4). The
 * record's own `brand.tax_type` wins; else `taxType`; else tax-inclusive, as
 * legacy `showPricesExcTax` reads an unset tax type.
 *
 * @decision
 * what: the price only — the billing-cycle label is its own `billingCycle`
 *   member, and legacy's one-string term summary is its own
 *   `priceTermSummary` member (`mapContractProductPriceTermSummary`).
 * why: R38 item 10 names price and billing cycle as separate view-model
 *   columns; the summary is display formatting over this figure, not a
 *   different figure.
 * rejected: composing legacy's one-string term summary into `priceFormatted`.
 */
export function mapContractProductPrice(
  raw: IContractProduct,
  taxType?: BrandTaxTypes
): string {
  const excludesTax =
    (raw.brand?.tax_type ?? taxType) === BrandTaxTypes.EXCLUDE_TAX;

  if (raw.billing_cycle_months > 0) {
    return excludesTax
      ? raw.configuration_total_recurring_net_amount_formatted
      : raw.configuration_total_recurring_amount_formatted;
  }

  return excludesTax
    ? raw.configuration_net_amount_discounted_formatted
    : raw.configuration_total_discounted_amount_formatted;
}

/** The translated billing-cycle label (R38 item 10, G5) — legacy's cycle name; "One time" for a one-time product. */
export function mapContractProductBillingCycle(months: number): string {
  const cycle = parseBillingCycle(months);
  return months > 0 ? cycle.adverbial : cycle.descriptive;
}

/**
 * Legacy `cProdMixin.getPriceTermSummary`: the `mapContractProductPrice`
 * figure with its trailing zeros trimmed — "£4" for a one-time product; a
 * subscription adds its lower-cased cycle, and "(estimated)" when the product
 * is post-paid — "£4 monthly".
 *
 * @decision
 * what: the figure is this module's own pick, not the shared basket
 *   `parsePrice` / `parseTermSummary`.
 * why: those read `configuration_*_converted` amounts the contract-product
 *   wire does not carry, have no recurring amount, and blank a zero-priced
 *   term (a basket price-override rule) — none of which legacy does here.
 * rejected: `parseTermSummary(raw).price.currentPrice`.
 */
export function mapContractProductPriceTermSummary(
  raw: IContractProduct,
  taxType?: BrandTaxTypes
): string {
  const price = removeTrailingZeroes(mapContractProductPrice(raw, taxType));

  if (!raw.billing_cycle_months) return price;

  const { t } = useI18n();

  return join(
    compact([
      price,
      mapContractProductBillingCycle(
        raw.billing_cycle_months
      ).toLocaleLowerCase(),
      raw.product?.post_paid
        ? `(${t("term.estimated").toLocaleLowerCase()})`
        : null
    ]),
    " "
  );
}

/**
 * The contract product's display name — the shared product title (its
 * `meta.uischema.title` template, else `useProductName`) read over the
 * contract product the basket product became. With no catalogue product it
 * falls back to legacy's name: its own name, then its service identifier in
 * brackets.
 */
export function mapContractProductTitle(raw: IContractProduct): string {
  if (!raw.product) {
    const identifier = raw.service_identifier
      ? `(${raw.service_identifier})`
      : null;
    return join(compact([raw.name, identifier]), " ");
  }

  return useUischemaTitle(raw.product, {
    basketProduct: raw,
    valueKey: "meta.uischema.title",
    fallback: useProductName(raw.product, raw)
  });
}

/** Maps one wire record to the view model, deriving the two shared readings once. */
export function mapContractProduct(raw: IContractProduct): ContractProduct {
  return toContractProduct(raw);
}

function toContractProduct(
  raw: IContractProduct,
  taxType?: BrandTaxTypes
): ContractProduct {
  const contractRequest = raw.contract_request
    ? mapContractRequest(raw.contract_request)
    : undefined;

  return {
    id: raw.id,
    contractId: raw.contract_id,
    status: raw.status
      ? {
          code: raw.status.code as ContractStatusCodes,
          name: useTranslateName(raw.status)
        }
      : undefined,
    meta: mapContractProductMeta(raw.status?.code as ContractStatusCodes),
    contractStatus: raw.contract?.status?.code as
      | ContractStatusCodes
      | undefined,
    stagedImport: raw.staged_import,
    contractRequest,
    renew: raw.renew,
    billingCycleMonths: raw.billing_cycle_months,
    billingCycle: mapContractProductBillingCycle(raw.billing_cycle_months),
    createdAt: raw.created_at,
    priceFormatted: mapContractProductPrice(raw, taxType),
    priceTermSummary: mapContractProductPriceTermSummary(raw, taxType),
    calculatedCancelDate: raw.calculated_cancel_date,
    provisionSetupFieldsConfirmed: raw.provision_setup_fields_confirmed,
    inTrial: raw.in_trial,
    trialEndAction: raw.trial_end_action,
    nextDueDate: raw.next_due_date,
    dateCreated: useDate(raw.created_at, undefined, "MMM Do, YYYY"),
    dateNextDue: useDate(raw.next_due_date, undefined, "MMM Do, YYYY"),
    dateCalculatedCancel: useDate(
      raw.calculated_cancel_date,
      undefined,
      "MMM Do, YYYY"
    ),
    importId: raw.import_id,
    moved: raw.moved,
    name: raw.name,
    title: mapContractProductTitle(raw),
    canCancel: raw.can_cancel,
    proRataPending: !!raw.pro_rata_pending,
    isDelegatedObject: raw.is_delegated_object,
    autoCreateRenewInvoice: raw.auto_create_renew_invoice,
    unpaidRecurringInvoices: map(
      raw.unpaid_recurring_invoices as WireUnpaidRecurringInvoice[] | undefined,
      mapUnpaidInvoice
    ),
    scheduledActions: raw.scheduled_actions
      ? map(
          raw.scheduled_actions as unknown as WireScheduledAction[],
          mapScheduledAction
        )
      : undefined,
    isSubscription: raw.billing_cycle_months > 0,
    hasScheduledFutureCancellation:
      contractRequest?.status?.code ===
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION,
    clientInvoiceConsolidationEnabled:
      raw.contract?.client?.invoice_consolidation_enabled,
    product: raw.product
      ? pick(raw.product, [
          "id",
          "name",
          "image",
          "provision_blueprint",
          "invoice_consolidation_enabled"
        ])
      : undefined,
    brand: raw.brand ? pick(raw.brand, ["id", "name", "currency"]) : undefined,
    tags: (raw as WireContractProduct).tags,
    futureCancellationRequest: raw.future_cancellation_request
      ? mapFutureCancellation(raw.future_cancellation_request)
      : undefined,
    movedToContractProduct: raw.moved_to_contract_product
      ? mapMovedToContractProduct(raw.moved_to_contract_product)
      : undefined,
    delegatingClients: raw.clients ? map(raw.clients, mapClient) : undefined,
    raw
  };
}

function mapContractRequest(
  raw: IContractCancellationRequest
): ContractProductRequest {
  return {
    id: raw.id,
    status: raw.status
      ? { code: raw.status.code as CancellationRequestStatusCodes }
      : undefined
  };
}

function mapFutureCancellation(
  raw: IContractProductScheduledCancellation
): NonNullable<ContractProduct["futureCancellationRequest"]> {
  return pick(raw, [
    "id",
    "future_cancellation_date",
    "scheduled_for",
    "executed_at"
  ]);
}

function mapMovedToContractProduct(
  raw: IContractProduct
): MovedToContractProduct {
  return {
    ...pick(raw, ["id", "name", "status"]),
    clients: raw.clients ? map(raw.clients, mapClient) : undefined
  };
}

function mapClient(raw: IClient): ContractProductClient {
  return pick(raw, ["id", "fullname", "email", "image", "brand"]);
}

function mapScheduledAction(raw: WireScheduledAction): ScheduledAction {
  return {
    ...pick(raw, ["id", "status", "executed_at", "created_at"]),
    action_code: raw.action
  };
}

function mapUnpaidInvoice(raw: WireUnpaidRecurringInvoice): UnpaidInvoice {
  return { status: raw.invoice_status };
}

/**
 * One contract product as a picker option (R38 item 2, the `useTickets`
 * `mapContractProductLookupItem` sibling), labelled by its display name
 * (`mapContractProductTitle`) — "Starter Hosting (testdomain.com)".
 */
export function mapContractProductPickerItem(
  raw: IContractProduct
): LookupItem {
  return {
    value: raw.id,
    label: mapContractProductTitle(raw) || raw.id
  };
}

/** The picker's lookup query `select` — every row as a selectable option. */
export function mapContractProductPickerItems(
  raw: IContractProduct[] = []
): LookupItem[] {
  return map(raw, mapContractProductPickerItem);
}

// -----------------------------------------------------------------------------
// OUTBOUND — design 8.3, one mapper per write body

/**
 * `requestSoftCancel` / `abortSoftCancel` wire body.
 *
 * @decision
 * what: `customFields` (a `CustomFieldModel` code→value map) is sent straight
 *   through as `custom_fields`, not routed through
 *   `mapCustomFieldValuesToRequest`.
 * why: that helper is a DIRTY-DIFF updater against a base model; a cancellation
 *   write is a fresh submission with no base, so diffing would silently strip
 *   intended fields. Legacy sends the code→value object as-is
 *   (`contractCancellation.ts:696-705`). Same call shared by the schedule body.
 * rejected: `mapCustomFieldValuesToRequest(model.customFields)` — its
 *   empty-diff `undefined` return and `""→null` coercion belong to the
 *   value-editor edit flow, not a create.
 */
export function toSoftCancelBody(model: SoftCancelModel): SoftCancelBody {
  return {
    renew: model.renew,
    ...(model.reason ? { cancellation_reason: model.reason } : {}),
    ...(isEmpty(model.customFields)
      ? {}
      : { custom_fields: model.customFields })
  };
}

/**
 * The hard-cancellation request body (R33; moved from `contract`). `product_ids`
 * is this one product; `customFields` is sent as-is (see `toSoftCancelBody`).
 */
export function toRequestCancellationBody(
  model: RequestCancellationModel
): RequestCancellationBody {
  return {
    product_ids: model.productIds,
    ...(model.reason ? { cancellation_reason: model.reason } : {}),
    ...(isEmpty(model.customFields)
      ? {}
      : { custom_fields: model.customFields })
  };
}

/** `setConsolidation` wire body. */
export function toConsolidationBody(
  model: SetConsolidationModel
): ConsolidationBody {
  return { invoice_consolidation_enabled: model.invoiceConsolidationEnabled };
}

/** `scheduleCancellation` wire body (R18). */
export function toScheduleCancellationBody(
  model: ScheduleCancellationModel
): ScheduleCancellationBody {
  return {
    future_cancellation_date: model.futureCancellationDate,
    ...(model.reason ? { cancellation_reason: model.reason } : {}),
    ...(isEmpty(model.customFields)
      ? {}
      : { custom_fields: model.customFields })
  };
}
