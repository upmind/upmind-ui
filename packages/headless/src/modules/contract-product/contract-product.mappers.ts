/** @internal */
import {
  BrandTaxTypes,
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { mapInvoice } from "../invoices";
import { parseBillingCycle } from "../product";
import { useProductName, useUischemaTitle } from "../product/product.utils";
import { useI18n } from "../system-localisation";
import {
  CatalogueProductFields,
  ContractProductBrandFields,
  ContractProductClientFields,
  ContractProductEmbeddedOmittedFields,
  ContractProductTagFields,
  FutureCancellationFields,
  MovedToContractProductFields,
  ScheduledActionFields
} from "./contract-product.types";
import { removeTrailingZeroes, useDate, useTranslateName } from "../../utils";
import {
  castArray,
  compact,
  find,
  first,
  flatMap,
  includes,
  isEmpty,
  isNil,
  isNumber,
  isUndefined,
  join,
  map,
  omit,
  pick,
  values,
  without
} from "lodash-es";
import type {
  BillingEntityBody,
  BillingEntityChoice,
  BillingEntityOption,
  ChangeProductBody,
  ChangeProductInput,
  ContractProduct,
  ContractProductContext,
  ContractProductEmbedded,
  ContractProductMeta,
  MigrationPreview,
  MigrationResult,
  RequestCancellationBody,
  RequestCancellationModel,
  ScheduleCancellationBody,
  ScheduleCancellationModel,
  SoftCancelBody,
  SoftCancelModel
} from "./contract-product.types";
import type { Address } from "../client-address";
import type { Company } from "../client-company";
import type { LookupItem } from "../lookup";
import type { IContractProduct, IInvoice } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.mappers
 * @description Wire ↔ view-model shaping for contract products. Inbound:
 * `mapContractProducts` / `mapContractProduct`. Outbound: one body mapper per
 * write whose body carries a rule.
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
  return map(castArray(raw), record => mapContractProduct(record, taxType));
}

/** The translated-badge flags for a contract product's own `status.code`. */
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
 * The row's price: a subscription shows its recurring price, a one-time
 * product its discounted price, each tax-inclusive or net per the brand's tax
 * type. The record's own `brand.tax_type` wins; else `taxType`; else
 * tax-inclusive.
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

/**
 * The `mapContractProductPrice` figure with its trailing zeros trimmed: "£4"
 * for a one-time product; a subscription adds its lower-cased cycle, and
 * "(estimated)" when the product is post-paid: "£4 monthly".
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
      parseBillingCycle(raw.billing_cycle_months).adverbial.toLocaleLowerCase(),
      raw.product?.post_paid
        ? `(${t("term.estimated").toLocaleLowerCase()})`
        : null
    ]),
    " "
  );
}

/**
 * The contract product's display name: the shared product title read over the
 * contract product. With no catalogue product it falls back to its own name,
 * then its service identifier in brackets.
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

/**
 * Maps one wire record to the view model.
 *
 * @param taxType - the portal brand's tax type; a list row carries no `brand`.
 */
export function mapContractProduct(
  raw: IContractProduct,
  taxType?: BrandTaxTypes
): ContractProduct {
  const statusCode = find(
    values(ContractStatusCodes),
    member => member === raw.status?.code
  );
  const requestCode = find(
    values(CancellationRequestStatusCodes),
    member => member === raw.contract_request?.status?.code
  );

  return {
    // --- identity
    id: raw.id,
    contractId: raw.contract_id,
    status:
      raw.status && statusCode
        ? { code: statusCode, name: useTranslateName(raw.status) }
        : undefined,
    meta: mapContractProductMeta(statusCode),
    stagedImport: raw.staged_import,
    importId: raw.import_id,
    moved: raw.moved,
    name: raw.name,
    title: mapContractProductTitle(raw),
    description: raw.description,
    clientLabel: raw.client_label,
    isDelegatedObject: raw.is_delegated_object,
    // --- billing
    renew: raw.renew,
    billingCycleMonths: raw.billing_cycle_months,
    billingCycle: parseBillingCycle(raw.billing_cycle_months)[
      raw.billing_cycle_months > 0 ? "adverbial" : "descriptive"
    ],
    createdAt: raw.created_at,
    priceFormatted: mapContractProductPrice(raw, taxType),
    priceTermSummary: mapContractProductPriceTermSummary(raw, taxType),
    calculatedCancelDate: raw.calculated_cancel_date,
    nextDueDate: raw.next_due_date,
    dateCreated: useDate(raw.created_at, undefined, "MMM Do, YYYY"),
    dateNextDue: useDate(raw.next_due_date, undefined, "MMM Do, YYYY"),
    dateCalculatedCancel: useDate(
      raw.calculated_cancel_date,
      undefined,
      "MMM Do, YYYY"
    ),
    isSubscription: raw.billing_cycle_months > 0,
    autoCreateRenewInvoice: raw.auto_create_renew_invoice,
    canCreateNextInvoice: !!raw.can_create_next_invoice,
    nextInvoiceDate: raw.next_invoice_date,
    // --- the owning contract
    contractStatus: find(
      values(ContractStatusCodes),
      member => member === raw.contract?.status?.code
    ),
    contractCurrencyId: raw.contract?.currency_id,
    contractCurrencyCode: raw.currency_code,
    contractAccountId: raw.contract?.account_id ?? raw.account_id,
    contractTaxType: raw.contract?.tax_type,
    contractBillingCycleLabel:
      raw.contract?.billing_cycle_months == null
        ? undefined
        : parseBillingCycle(raw.contract.billing_cycle_months)[
            raw.contract.billing_cycle_months > 0 ? "adverbial" : "descriptive"
          ],
    billingAddressId: raw.contract?.address_id,
    billingCompanyId: raw.contract?.company_id,
    clientInvoiceConsolidationEnabled:
      raw.contract?.client?.invoice_consolidation_enabled,
    // --- lifecycle
    contractRequest: raw.contract_request
      ? {
          id: raw.contract_request.id,
          status: requestCode ? { code: requestCode } : undefined
        }
      : undefined,
    hasScheduledFutureCancellation:
      requestCode ===
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION,
    provisionSetupFieldsConfirmed: raw.provision_setup_fields_confirmed,
    inTrial: raw.in_trial,
    trialEndAction: raw.trial_end_action,
    canCancel: raw.can_cancel,
    invoiceConsolidationEnabled: raw.invoice_consolidation_enabled,
    proRataPending: !!raw.pro_rata_pending,
    canModify: !!raw.can_modify,
    productType: raw.product?.product_type,
    allowedMigrations: raw.allowed_migrations ?? [],
    currentOptions: map(raw.options, option => ({
      productId: option.product_id,
      sellingPrice: option.selling_price
    })),
    // --- relations
    unpaidRecurringInvoices: raw.unpaid_recurring_invoices ?? [],
    scheduledActions: raw.scheduled_actions
      ? map(raw.scheduled_actions, action =>
          pick(action, values(ScheduledActionFields))
        )
      : undefined,
    product: raw.product
      ? pick(raw.product, values(CatalogueProductFields))
      : undefined,
    brand: raw.brand
      ? pick(raw.brand, values(ContractProductBrandFields))
      : undefined,
    tags: raw.tags
      ? map(raw.tags, tag => pick(tag, values(ContractProductTagFields)))
      : undefined,
    futureCancellationRequest: raw.future_cancellation_request
      ? pick(raw.future_cancellation_request, values(FutureCancellationFields))
      : undefined,
    movedToContractProduct: raw.moved_to_contract_product
      ? {
          ...pick(
            raw.moved_to_contract_product,
            values(MovedToContractProductFields)
          ),
          clients: raw.moved_to_contract_product.clients
            ? map(raw.moved_to_contract_product.clients, client =>
                pick(client, values(ContractProductClientFields))
              )
            : undefined
        }
      : undefined,
    delegatingClients: raw.clients
      ? map(raw.clients, client =>
          pick(client, values(ContractProductClientFields))
        )
      : undefined,
    raw
  };
}

/**
 * One embedded product off a read that does not carry `allowed_migrations` or
 * the parent `contract` relation: the view model without the members that read
 * them. The `contract` read and the `tickets` single read embed a product this
 * way.
 */
export function mapContractProductEmbedded(
  raw: IContractProduct
): ContractProductEmbedded {
  return omit(
    mapContractProduct(raw),
    values(ContractProductEmbeddedOmittedFields)
  );
}

/** One contract product as a picker option, labelled by its display name. */
export function mapContractProductPickerItem(
  raw: IContractProduct
): LookupItem {
  return {
    value: raw.id,
    label: mapContractProductTitle(raw) || raw.id
  };
}

/**
 * The client's addresses then companies as picker options, each by its display
 * title with the joined address beside it. The two lists hold distinct ids.
 */
export function mapBillingEntityOptions(
  addresses: Address[],
  companies: Company[]
): BillingEntityOption[] {
  return map([...addresses, ...companies], ({ id, title, description }) => ({
    const: id,
    title: compact([title, description]).join(" — ")
  }));
}

// -----------------------------------------------------------------------------
// MIGRATION — the dry run and the commit

/**
 * The dry run of a migration: its invoice, its formatted total, and whether it
 * costs nothing. The figure is `total_amount_converted`.
 */
export function mapMigrationPreview(raw: IInvoice): MigrationPreview {
  return {
    invoice: mapInvoice(raw),
    total: raw.total_amount_formatted ?? "",
    isFree: Math.abs(raw.total_amount_converted ?? 0) === 0
  };
}

/**
 * What a committed migration gave. A commit answer with no invoice gives no
 * invoice id, nothing unpaid and no payment to make.
 */
export function mapMigrationResult(raw?: IInvoice): MigrationResult {
  if (isNil(raw)) return { unpaidAmount: 0, requiresPayment: false };
  const unpaidAmount = raw.unpaid_amount ?? 0;
  return {
    invoiceId: raw.id,
    unpaidAmount,
    requiresPayment: unpaidAmount !== 0,
    invoice: mapInvoice(raw)
  };
}

// -----------------------------------------------------------------------------
// OUTBOUND — one mapper per write body

/**
 * `requestSoftCancel` / `abortSoftCancel` wire body. `customFields` is sent as
 * the code→value object it is: a cancellation is a fresh submission, so there
 * is no base model to diff against.
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

/** The hard-cancellation request body; `product_ids` is this one product. */
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

/** `scheduleCancellation` wire body. */
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

/**
 * The change-of-plan input from the manager's context: the dry run and the
 * commit send the same input.
 * @returns `undefined` while no configured plan is chosen.
 */
export function toChangeProductInput({
  contractId,
  contractProductId,
  contractProduct,
  migration
}: ContractProductContext): ChangeProductInput | undefined {
  if (!contractId || !contractProductId || !migration?.target) return undefined;
  if (!migration.model) return undefined;

  return {
    contractId,
    contractProductId,
    targetId: migration.target.id,
    model: migration.model,
    rawProduct: migration.rawProduct,
    currentOptions: contractProduct?.currentOptions,
    currencyId: contractProduct?.contractCurrencyId
  };
}

/**
 * The `address_company_vat` body from one pick. An address pick clears the
 * company. A company pick carries the address of the company. The tax number
 * travels with the company, so the body has no tax field.
 */
export function toBillingEntityBody(
  choice: BillingEntityChoice
): BillingEntityBody {
  if ("company" in choice) {
    return {
      address_id: choice.company.addressId,
      company_id: choice.company.id
    };
  }

  return { address_id: choice.address.id, company_id: null };
}

/**
 * The unit total of one option value at the chosen term: the first of
 * `price_discounted` and `price` that is not `null`; an absent value stays
 * absent.
 */
function optionUnitTotal(
  input: Pick<ChangeProductInput, "rawProduct" | "currencyId" | "model">,
  productId: string
): number | undefined {
  const option = find(input.rawProduct?.products_options, ["id", productId]);
  const row = find(
    option?.prices,
    price =>
      includes([0, input.model.term], price.billing_cycle_months) &&
      (!input.currencyId ||
        !price.currency_id ||
        price.currency_id === input.currencyId)
  );

  const price = first(without([row?.price_discounted, row?.price], null));

  return isNil(price) ? undefined : price;
}

/**
 * The price an option sends: a numeric custom price wins, else the new unit
 * total goes when it differs from the old price, and the result is left out
 * when it equals the old price.
 */
function optionPrice(
  input: ChangeProductInput,
  productId: string
): number | undefined {
  const oldPrice = find(input.currentOptions, [
    "productId",
    productId
  ])?.sellingPrice;
  const total = optionUnitTotal(input, productId);

  let price: number | undefined;
  if (isNumber(input.customPrice)) price = input.customPrice;
  else if (oldPrice !== total) price = total;

  return price === oldPrice ? undefined : price;
}

/**
 * The `PUT contracts/{c}/products/{p}/change` body from the child model, the
 * child's raw product and the contract's old options. The dry run and the
 * commit send the same body. No product quantity and no provision field goes.
 */
export function toChangeProductBody(
  input: ChangeProductInput
): ChangeProductBody {
  const { model } = input;

  return {
    contract_id: input.contractId,
    contracts_product_id: input.contractProductId,
    product: {
      product_id: input.targetId,
      billing_cycle_months: model.term
    },
    options: flatMap(model.options, category =>
      map(category, value => {
        const price = optionPrice(input, value.productId);
        return {
          product_id: value.productId,
          billing_cycle_months: value.cycle,
          unit_quantity: value.quantity,
          ...(isUndefined(price) ? {} : { price })
        };
      })
    ),
    attributes: flatMap(model.attributes, category =>
      map(category, value => ({ product_id: value.productId }))
    )
  };
}
