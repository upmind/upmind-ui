import dayjs from "dayjs";
import { assign, sendParent, spawn } from "xstate";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceConsolidationTypes,
  InvoiceStatus,
  InvoiceStatusGroups,
  ProductTypes
} from "@upmind-automation/types";
import { productMachine } from "../product";
import { useI18n } from "../system-localisation";
import {
  ContractProductCancelOption,
  ContractProductsContextTypes
} from "./contract-product.types";
import {
  contextValue,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  useValidation
} from "../../utils";
import {
  cloneDeep,
  find,
  first,
  flatMap,
  includes,
  isEmpty,
  isNumber,
  isUndefined,
  map,
  uniqueId,
  without
} from "lodash-es";
import type {
  ChangeProductBody,
  ChangeProductInput,
  ContractProduct,
  ContractProductContext,
  ContractProductForm,
  MigrationChange,
  MigrationGateFacts,
  MigrationTarget,
  UnpaidInvoice
} from "./contract-product.types";
import type { ProductConfigContext, ProductModel } from "../product";
import type { ScopeContext } from "../scope/scope.types";
import type { AnyEventObject, InvokeCallback } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.utils
 * @description Pure predicates, the three node selectors the machine's entry
 * order reads, the delegated force-set, the forced hide-one-time seam, the
 * future-cancellation anniversary maths, and the change-of-product rule, body,
 * seed and child overrides. No HTTP, no state reads.
 */

/** The 404 a contract-product request rejects with when a required id is missing. */
export function notAvailableError(
  context: ContractProductContext
): DetailedError {
  const { t } = useI18n();

  return new DetailedError(
    t("error.contract_product_not_available"),
    responseCodes.Not_Found,
    ErrorOrigin.Headless,
    {
      contractId: context.contractId,
      contractProductId: context.contractProductId
    }
  );
}

// -----------------------------------------------------------------------------
// Node selectors — flow.md §3 "Entry order"

// -----------------------------------------------------------------------------
// Cancellation options — the ONE combined form (R33; legacy `clientCancelOptions`)

/**
 * True when the product carries a pending HARD cancellation request
 * (`contract_request.status.code === request_cancellation_request`) — legacy
 * `hasHardCancellationRequest` (`contractCancellation.ts:351-356`).
 */
export function hasHardCancellationRequest(
  product: Pick<ContractProduct, "contractRequest">
): boolean {
  return (
    product.contractRequest?.status?.code ===
    CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
  );
}

/**
 * True when the subscription is set to auto-expire: it is a live subscription
 * (not cancelled, not lapsed) that has stopped renewing and carries a
 * calculated cancel date — legacy `hasAutoExpireEnabled`
 * (`store/modules/data/contracts/products.ts:175-182`).
 */
export function hasAutoExpireEnabled(
  product: Pick<
    ContractProduct,
    "isSubscription" | "status" | "renew" | "calculatedCancelDate"
  >
): boolean {
  if (!product.isSubscription) return false;
  const code = product.status?.code;
  if (code === ContractStatusCodes.CANCELLED) return false;
  if (code === ContractStatusCodes.CLOSED) return false;
  return !product.renew && !!product.calculatedCancelDate;
}

/**
 * The cancellation options this product allows (legacy `clientCancelOptions`,
 * `contractCancellation.ts:300-333`), derived from the record only. The brand
 * setting `SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION` is NOT read (design 8.3
 * — the module reads no brand setting), so HARD turns on the record facts alone.
 *
 * Legacy hides the WHOLE cancel entry (`cProdProvider.vue:252-275`) once the
 * subscription auto-expires, a hard request is pending, or a future
 * cancellation is scheduled — modelled here as the three early `[]` returns.
 */
export function cancellationOptions(
  product: Pick<
    ContractProduct,
    | "contractRequest"
    | "contractStatus"
    | "isSubscription"
    | "renew"
    | "status"
    | "calculatedCancelDate"
    | "canCancel"
    | "hasScheduledFutureCancellation"
    | "nextDueDate"
    | "billingCycleMonths"
    | "proRataPending"
  >
): ContractProductCancelOption[] {
  const options: ContractProductCancelOption[] = [];
  if (!product.isSubscription) return options;
  if (hasAutoExpireEnabled(product)) return options;
  if (hasHardCancellationRequest(product)) return options;
  if (product.hasScheduledFutureCancellation) return options;
  // Legacy cProdProvider.vue cancelOption: a pending pro-rata invoice, or a
  // client the platform does not allow to cancel, disables cancelling.
  if (product.proRataPending) return options;
  if (!product.canCancel) return options;

  const isPending = product.contractStatus === ContractStatusCodes.PENDING;

  // SOFT — cancel at end of term; not while the contract is pending.
  if (!isPending) options.push(ContractProductCancelOption.SOFT);
  // HARD — request immediate cancellation (ADR-25, ADR-27).
  options.push(ContractProductCancelOption.HARD);
  // SCHEDULE_FUTURE — needs a live subscription and an anniversary anchor.
  if (!isPending && !!anniversaryAnchor(product)) {
    options.push(ContractProductCancelOption.SCHEDULE_FUTURE);
  }

  return options;
}

/**
 * True when the client may open the consolidation form on this product — legacy
 * `cProdInvoiceConsolidationComp.vue:74-97` `isVisible`/`canConsolidate`, the
 * record-level parts only. A live subscription that is not staged, whose client
 * setting enables (or inherits) consolidation, and whose product allows it.
 *
 * @decision
 *   what: brand `INVOICE_CONSOLIDATION_ENABLED` and the actor
 *     `INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF` config are NOT read, and the
 *     `update_contract_product` permission is not on the product read — so
 *     `ENABLED` and `INHERIT` both collapse to the product fact alone.
 *   why: design 8.3 — the module reads no brand setting, and no permission
 *     channel reaches this pure selector.
 *   rejected: adding a brand-config or permission request — outside the
 *     module's read surface (reported instead).
 */
export function canConsolidate(
  product: Pick<
    ContractProduct,
    | "isSubscription"
    | "stagedImport"
    | "clientInvoiceConsolidationEnabled"
    | "product"
  >
): boolean {
  if (!product.isSubscription) return false;
  if (product.stagedImport) return false;

  const clientType = product.clientInvoiceConsolidationEnabled;
  if (
    clientType !== InvoiceConsolidationTypes.ENABLED &&
    clientType !== InvoiceConsolidationTypes.INHERIT
  ) {
    return false;
  }
  return !!product.product?.invoice_consolidation_enabled;
}

// -----------------------------------------------------------------------------
// Criteria seams — design 8.5, 8.6

/**
 * The client's `exclude_delegated` force-set (ADR-8, design 8.5), as legacy
 * sends it. The `DELEGATED` selector context always forces `0`. A session
 * with no delegated products always sends `1`, whatever was chosen before
 * (legacy `products.ts` `list`). Otherwise the held preference wins, and with
 * none held `0` (legacy `views/client/products/index.vue` `initForm`).
 */
export function resolveExcludeDelegated(
  scopeContext: ScopeContext | undefined,
  preference: boolean | undefined,
  hasDelegatedProducts: boolean
): 0 | 1 {
  if (scopeContext?.type === ContractProductsContextTypes.DELEGATED) return 0;
  if (!hasDelegatedProducts) return 1;
  return preference === true ? 1 : 0;
}

/**
 * The forced hide-one-time-purchases seam (design 8.6, ADR-14): the brand's
 * `@context.oneTimePurchases` portal visibility, as legacy `brand/index.ts`
 * `hideOneTimePurchases` reads it and `cProdsProvider.vue` applies it.
 */
export function hidesOneTimePurchasesForced(
  portal: Record<string, string> | undefined
): boolean {
  return portal?.["@context.oneTimePurchases"] === "hidden";
}

// -----------------------------------------------------------------------------
// Future-cancellation anniversary maths (research.md F18 — no parity row)

const BACKEND_DATE_FORMAT = "YYYY-MM-DD";

type AnniversaryAnchor = { reference: dayjs.Dayjs; billingCycleMonths: number };

/**
 * The anchor for every future-cancellation calculation: `next_due_date` plus
 * the billing cycle length. `null` when either input is missing.
 */
export function anniversaryAnchor(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">
): AnniversaryAnchor | null {
  const { nextDueDate, billingCycleMonths } = product;
  if (!nextDueDate || !billingCycleMonths || billingCycleMonths < 0)
    return null;

  return { reference: dayjs(nextDueDate).startOf("day"), billingCycleMonths };
}

/** The anniversary date at a given cycle count off the product's own anchor. */
export function anniversaryAtCycle(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">,
  cycles: number
): dayjs.Dayjs | null {
  const anchor = anniversaryAnchor(product);
  if (!anchor) return null;

  return anchor.reference.add(cycles * anchor.billingCycleMonths, "month");
}

/** The earliest cycle a client may schedule for: the next anniversary strictly after today. */
export function minFutureCancellationCycle(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">
): number | null {
  if (!anniversaryAnchor(product)) return null;

  const today = dayjs().startOf("day");
  let cycles = 0;
  while (!anniversaryAtCycle(product, cycles)?.isAfter(today)) {
    cycles += 1;
  }
  return cycles;
}

/** The earliest selectable future-cancellation date, as a wire date string. */
export function minFutureCancellationDate(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">
): string | null {
  const cycles = minFutureCancellationCycle(product);
  if (cycles === null) return product.nextDueDate ?? null;

  return (
    anniversaryAtCycle(product, cycles)?.format(BACKEND_DATE_FORMAT) ?? null
  );
}

/** Which cycle `date` lands on off the product's anchor, or `null` when it isn't an exact multiple of the billing cycle. */
export function anniversaryCycleForDate(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">,
  date: Date | string
): number | null {
  const anchor = anniversaryAnchor(product);
  if (!anchor) return null;

  const candidate = dayjs(date).startOf("day");
  const monthsDiff = candidate.diff(anchor.reference, "month");
  if (monthsDiff % anchor.billingCycleMonths !== 0) return null;

  const cycles = monthsDiff / anchor.billingCycleMonths;
  return anniversaryAtCycle(product, cycles)?.isSame(candidate, "day")
    ? cycles
    : null;
}

/** Whether `date` is a valid future-cancellation anniversary: an exact cycle, on or after `minFutureCancellationDate`. */
export function isSelectableFutureCancellationDate(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">,
  date: Date | string
): boolean {
  const cycles = anniversaryCycleForDate(product, date);
  const minCycles = minFutureCancellationCycle(product);
  if (cycles === null || minCycles === null) return false;

  return cycles >= minCycles;
}

// -----------------------------------------------------------------------------
// Unpaid-invoice predicates (AC10, ADR-10, design 8.7 [o23])
//
// Pure functions of `Pick<IInvoice, "status">` — never meta (R23 restricts
// meta to `is*`/`has*`/`can*` booleans; these take an argument). Consumers
// call them per invoice, e.g. over `hasUnpaidRecurringInvoices`'s list.

const DUE_STATUSES: readonly InvoiceStatus[] = InvoiceStatusGroups.UNPAID;

/**
 * `[UNPAID, OVERDUE]` — the legacy `isCancellable` set (`store/modules/data/
 * invoices/index.ts:123-127` [o23]). Narrower than `InvoiceStatusGroups.UNPAID`
 * (which also carries `ADJUSTED`) and has no published-group counterpart to
 * reuse.
 */
const CANCELLABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.UNPAID,
  InvoiceStatus.OVERDUE
];

/** True while the invoice still carries an outstanding balance. */
export function isDue(invoice: UnpaidInvoice): boolean {
  return DUE_STATUSES.includes(invoice.status?.code as InvoiceStatus);
}

/** True while cancelling the invoice still means anything. */
export function isCancellable(invoice: UnpaidInvoice): boolean {
  return CANCELLABLE_STATUSES.includes(invoice.status?.code as InvoiceStatus);
}

// -----------------------------------------------------------------------------
// Write forms

/** Rejects with a 422 carrying the AJV errors when the form's model is invalid. */
export async function validateForm({
  schema,
  model
}: ContractProductForm = {}): Promise<void> {
  if (!schema) return;

  const { validate } = useValidation();
  const errors = validate(schema, model);

  if (!isEmpty(errors)) {
    throw new DetailedError(
      useI18n().t("error.contract_product_validation_failed"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      errors
    );
  }
}

// -----------------------------------------------------------------------------
// Change of product — the gate, the body, the seed, the child overrides (FE-3206)

/** The wire status code of a product, as the record read gave it. */
function statusCode(product: Pick<ContractProduct, "status">) {
  return product.status?.code;
}

/**
 * True when the client may start a change of product: the six offer clauses of
 * legacy `canUpgradeDowngradeAsClient` [o1] and the three start clauses of its
 * menu [o2]. The "not admin" clause is constant true for a client.
 *
 * The raw status code is read, never the status node: the node differs from
 * the code for an expiring or a cancelling product.
 */
export function canMigrateProduct(product: MigrationGateFacts): boolean {
  const code = statusCode(product);
  const acceptedRequest =
    includes(
      [ContractStatusCodes.CANCELLED, ContractStatusCodes.CLOSED],
      code
    ) &&
    product.contractRequest?.status?.code ===
      CancellationRequestStatusCodes.REQUEST_ACCEPTED;

  return (
    product.canModify &&
    !hasHardCancellationRequest(product) &&
    !acceptedRequest &&
    !hasAutoExpireEnabled(product) &&
    product.productType === ProductTypes.SINGLE_PRODUCT &&
    !isEmpty(product.allowedMigrations) &&
    includes(
      [ContractStatusCodes.ACTIVE, ContractStatusCodes.SUSPENDED],
      code
    ) &&
    !product.stagedImport &&
    !product.proRataPending
  );
}

/**
 * The unit total of one option value at the chosen term: the first of
 * `price_discounted` and `price` that is not `null` [o22], [o23]. Legacy strips
 * only `null`, so an absent value stays absent.
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

  return first(without([row?.price_discounted, row?.price], null)) as
    | number
    | undefined;
}

/**
 * The price an option sends, as legacy `computeConfigPrice` [o11]: a numeric
 * custom price wins, else the new unit total goes when it differs from the old
 * price, and the result is left out when it equals the old price.
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
 * child's raw product and the contract's old options [o9]-[o12]. The dry run and
 * the commit send the same body. No product quantity and no provision field
 * goes.
 */
export function buildChangeProductBody(
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

/**
 * The seed of the configurator child: the chosen product on the current term, in
 * the contract currency, with no promotions and no coupons [o7], [o8]. It sets
 * no basket, no client and no basket product. `promotions: false` is the
 * product load's own "omit promotions" value (R12).
 */
export function buildMigrationSeed(
  context: ContractProductContext,
  target: MigrationTarget
): ProductConfigContext {
  const seed = {
    model: {
      productId: target.id,
      term: context.contractProduct?.billingCycleMonths
    },
    currencyId: context.contractProduct?.contractCurrencyId,
    promotions: false,
    coupons: []
  };

  return seed as unknown as ProductConfigContext;
}

/** Spawns the stock product machine for a chosen product, with the change-of-product overrides. */
export function spawnMigrationChild(
  context: ContractProductContext,
  target: MigrationTarget
) {
  return spawn(
    productMachine
      .withContext(buildMigrationSeed(context, target))
      .withConfig(migrationTargetConfig),
    { name: uniqueId("migrationTarget-") }
  );
}

/**
 * The child's model and raw product, as the two request overrides send them to
 * the manager. The model is a copy: the editors change the child's nested
 * options in place, and the manager compares the next model with this one.
 */
function migrationChange({
  model,
  rawProduct
}: ProductConfigContext): MigrationChange {
  return { model: cloneDeep(model) as ProductModel, rawProduct };
}

/**
 * The invoked callback of `configuring`: reports the chosen product's configurator
 * failing to load, or failing later, as `MIGRATION.UNAVAILABLE`. The cleanup
 * unsubscribes and leaves the child running: the machine stops it.
 */
export function watchMigrationTarget({
  migration
}: ContractProductContext): InvokeCallback {
  return callback => {
    const subscription = migration?.ref?.subscribe(state => {
      if (stateMatches(state, ["unavailable"])) {
        callback({
          type: "MIGRATION.UNAVAILABLE",
          data: contextValue(state, "error")
        });
      }
    });

    return () => subscription?.unsubscribe();
  };
}

/**
 * The action overrides of the stock product machine for a change of product (R6,
 * R16). `setBasketHelper` connects nothing to the basket and spawns nothing.
 * `calculate` and `update` hand the model to the manager, which sends the dry
 * run and the commit. `refreshContext` keeps the contract currency.
 */
export const migrationTargetConfig = {
  actions: {
    setBasketHelper: assign<ProductConfigContext, AnyEventObject>({}),
    calculate: sendParent<ProductConfigContext, AnyEventObject, AnyEventObject>(
      (context: ProductConfigContext): AnyEventObject => ({
        type: "MIGRATION.CHANGED",
        data: migrationChange(context)
      })
    ),
    update: sendParent<ProductConfigContext, AnyEventObject, AnyEventObject>(
      (context: ProductConfigContext): AnyEventObject => ({
        type: "MIGRATION.COMMIT",
        data: migrationChange(context)
      })
    ),
    refreshContext: assign<ProductConfigContext, AnyEventObject>({})
  }
};
