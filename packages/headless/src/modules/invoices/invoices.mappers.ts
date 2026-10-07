/** @internal */
import { GatewayTypes, InvoiceCategoryCode } from "@upmind-automation/types";
import { parseTaxes } from "../basket/basket.utils";
import { parseBasketProduct } from "../basket-product/basket-product.utils";
import { mapClient } from "../client";
import { mapAddress } from "../client-address";
import { mapCurrency } from "../currency";
import { useDate, useTranslateName } from "../../utils";
import {
  castArray,
  compact,
  first,
  get,
  groupBy,
  join,
  map,
  orderBy,
  sortBy,
  upperFirst
} from "lodash-es";
import type { BasketProduct } from "../basket-product";
import type { LookupItem } from "../lookup";
import type { InvoiceBundleGroup, Invoice, Payment } from "./invoices.types";
import type {
  IContract,
  IContractProduct,
  IInvoice,
  IPaymentDetail,
  InvoiceStatus
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.mappers
 * @description Wire -> VM mapping for the invoices module.
 * @decision
 * what: File carries a standalone `@internal` marker as line 1
 * (`code-quality.md`'s Module Visibility Law), same as every other
 * `.mappers.ts` in the tree.
 * why: `mapInvoice` / `mapInvoices` are consumed cross-module by
 * `orders/order.machine.ts` only via the curated re-export at
 * `index.ts:46` — `orders/order.machine.ts:4` imports the module barrel
 * (`../invoices`), never this file directly. `@internal/no-cross-module-
 * imports` (`eslint.config.mjs`) fires only on a direct relative import
 * resolving to a marked file; `resolveRelativeTarget` resolves `../invoices`
 * to `index.ts`, which carries no marker. The file-level marker therefore
 * cannot block that consumer.
 * rejected: leaving line 1 as an import (no marker) — this silently
 * disables `@internal/no-cross-module-imports` for the file with no gate
 * left to catch the omission, for a belief (blocks `orders/`) that does not
 * hold.
 */
// -----------------------------------------------------------------------------

/**
 * Maps one or many raw invoices to the VM. `readingClientId` — the scope's
 * resolved target — is supplied by the services layer's `select:` closure and
 * drives the co-mingled row {@link Invoice.attribution} (AC13).
 */
export function mapInvoices(
  raw: IInvoice | IInvoice[],
  readingClientId?: string
): Invoice[] {
  return map(castArray(raw), invoice => mapInvoice(invoice, readingClientId));
}

/**
 * Maps one raw invoice to the VM. `readingClientId` is OPTIONAL, but it is
 * NOT reader-independent for every attribution flag: `isDelegated` is
 * computed from `raw` alone (`!parentClientId && !!raw.delegate_related`,
 * see {@link mapAttribution}) and does not depend on `readingClientId` at
 * all. Only `isChildOfClient` (and, through it, `isOwn`/`isSettleable`) is
 * conservative-by-default when `readingClientId` is absent.
 * `orders/order.machine.ts:176` calls this with one argument, so a
 * `delegate_related` invoice with no parent client maps `isDelegated: true`
 * from that call site too (design D2 — `orders/` is protected core and is
 * not changed by this module).
 */
export function mapInvoice(raw: IInvoice, readingClientId?: string): Invoice {
  const slug = raw.category?.slug as InvoiceCategoryCode;
  const products = map(raw.products, product => ({
    ...parseBasketProduct(product),
    contractId: product.contract_id ?? null,
    contractsProductId: product.contracts_product_id ?? null
  }));
  const payments = mapPayments(raw.payments);

  return {
    id: raw.id,
    locked: !!raw.locked,
    // A dry-run invoice (e.g. a change-of-plan preview) is unsaved and carries no `status`.
    status: raw.status?.code as InvoiceStatus,
    statusName: useTranslateName(raw.status) ?? "",
    number: raw.number,
    client: mapClient(raw.client)!,
    address: raw.address ? mapAddress(raw.address) : undefined,
    currency: mapCurrency(raw.currency),
    // No explicit pay currency means the invoice pays in its own currency —
    // the same priority the machine applies (`payment_currency ?? currency`).
    currencyPayment: raw.payment_currency
      ? mapCurrency(raw.payment_currency)
      : mapCurrency(raw.currency),
    products,
    productsSummary: mapProductsSummary(products),
    payments,
    paymentsSummary: mapPaymentsSummary(payments),
    paymentMethod: mapPaymentMethod(raw),
    category: {
      slug,
      // is_consolidation wins first (`oracle:172-179`) — a consolidation
      // credit note never reads as a plain credit note.
      label: raw.is_consolidation ? InvoiceCategoryCode.CONSOLIDATION : slug
    },
    consolidation: {
      isConsolidation: !!raw.is_consolidation,
      consolidationInvoiceId: raw.consolidation_invoice_id,
      consolidationStatus: raw.consolidation_status,
      creditInvoiceId: raw.credit_invoice_id,
      amountToCreditConverted: raw.partial_amount_to_credit_converted,
      amountToCreditFormatted: raw.partial_amount_to_credit_formatted,
      amountCredited: raw.partial_amount_credited,
      toBeCredited: !!raw.to_be_credited
    },
    attribution: mapAttribution(raw, readingClientId),
    bundle: mapBundle(raw),
    nextChargeDate: useDate(raw.next_charge_date, undefined, "MMM Do, YYYY"),
    summary: {
      discount: raw.net_discount_amount_formatted,
      discountAmount: raw.net_discount_amount,
      paidAmount: raw.paid_amount,
      paidAmountFormatted: raw.paid_amount_formatted,
      subtotal: raw.net_amount_formatted,
      taxes: parseTaxes(raw.taxes),
      total: raw.total_amount_formatted,
      unpaidAmount: raw.unpaid_amount,
      unpaidAmountConverted: raw.unpaid_amount_converted,
      unpaidAmountFormatted: raw.unpaid_amount_formatted,
      balance: raw.balance,
      balanceFormatted: raw.balance_formatted
    },
    dateCreated: useDate(raw.create_datetime, undefined, "MMM Do, YYYY"),
    dateDue: useDate(raw.due_date, undefined, "MMM Do, YYYY"),
    datePaid: useDate(raw.paid_datetime, undefined, "MMM Do, YYYY h:mm A")
  };
}

/**
 * AC13's co-mingled row attribution. Child-first and mutually exclusive
 * (`oracle:126-137`): a row that is both a sub-account's and delegated
 * resolves as sub-account, never delegated.
 */
function mapAttribution(
  raw: IInvoice,
  readingClientId?: string
): Invoice["attribution"] {
  const parentClientId = get(
    raw,
    "client.parent_client_config.parent_client_id"
  );
  const isDelegated = !parentClientId && !!raw.delegate_related;
  const isChildOfClient =
    !isDelegated && !!readingClientId && parentClientId === readingClientId;

  return {
    isOwn: !isChildOfClient && !isDelegated,
    isChildOfClient,
    isDelegated,
    isSettleable: !isDelegated
  };
}

/** @internal */
function mapBundle(raw: IInvoice): Invoice["bundle"] {
  const productCount = raw.products_count ?? raw.products?.length ?? 0;
  const groups = mapBundleGroups(raw.products);

  return {
    productCount,
    isLarge: productCount > 5,
    groups,
    groupsSummary: mapBundleGroupsSummary(groups)
  };
}

/**
 * @internal Groups line items by originating subscription
 * (`contracts_product_id`, falling back to `contract_id`); un-linked lines
 * land in one trailing group where both ids are `null`.
 */
function mapBundleGroups(products: IInvoice["products"]): InvoiceBundleGroup[] {
  const grouped = groupBy(
    products,
    product => product.contracts_product_id ?? product.contract_id ?? "unlinked"
  );

  const groups = map(grouped, group => ({
    contractId: first(group)?.contract_id ?? null,
    contractsProductId: first(group)?.contracts_product_id ?? null,
    label: first(group)?.description ?? null,
    products: map(group, product => parseBasketProduct(product))
  }));

  return sortBy(groups, group =>
    group.contractId === null && group.contractsProductId === null ? 1 : 0
  );
}

/** @internal */
function mapPayments(payments: IInvoice["payments"]): Payment[] {
  if (!payments?.length) return [];

  const mapped = map(payments, payment => {
    const details = payment.payment_details;
    return {
      id: payment.id,
      meta: {
        isPending: !!payment.pending,
        isSuccessful: !payment.pending && payment.captured > 0
      },
      cardType: details?.card_type,
      cardLast4: details?.card_last4,
      label: mapPaymentLabel(details),
      amountFormatted: payment.amount_formatted,
      createdAt: payment.created_at,
      // Frozen at MAP time, not live — a page left open does not age this
      // value; re-derive from `createdAt` for a live "how old now" read.
      attemptAgeAtFetchMs: Date.now() - new Date(payment.created_at).getTime(),
      // `oracle:94-97` — pending AND awaiting-client gateway, not the gateway
      // alone: a settled payment on that gateway type is not awaiting anyone.
      isAwaitingClient:
        !!payment.pending &&
        payment.gateway?.type === GatewayTypes.AWAITING_CLIENT
    };
  });

  return orderBy(mapped, ["createdAt"], ["desc"]);
}

/** @internal One payment's own method, legacy's `invoicePaymentItem.vue` `paymentDetail`. */
function mapPaymentLabel(details?: IPaymentDetail | null): string {
  if (!details) return "";
  return (
    details.name ||
    join(
      compact([upperFirst(details.card_type), "••••", details.card_last4]),
      " "
    )
  );
}

/**
 * @internal AC4's read half — the invoice's OWN assigned payment method
 * (`raw.payment_details`), distinct from a payment's own card (mapped by
 * {@link mapPayments} from `payment.payment_details` — a different record).
 */
function mapPaymentMethod(raw: IInvoice): Invoice["paymentMethod"] {
  const details = raw.payment_details;
  if (!details) return { id: null, cardType: null, cardLast4: null, label: "" };

  return {
    id: details.id,
    cardType: details.card_type ?? null,
    cardLast4: details.card_last4 ?? null,
    label: details.card_type
      ? `${details.card_type} ****${details.card_last4}`
      : ""
  };
}

/** @internal A list-shaped read of `products` — "`<title> x<quantity>`" per line item. */
function mapProductsSummary(products: BasketProduct[]): string {
  return join(
    map(
      products,
      product =>
        `${product.productDetails.title} x${product.productDetails.quantity}`
    ),
    ", "
  );
}

/** @internal One payment's settlement state — successful, pending, or failed. */
function paymentStateLabel(payment: Payment): string {
  if (payment.meta.isSuccessful) return "successful";
  if (payment.meta.isPending)
    return payment.isAwaitingClient ? "pending — awaiting you" : "pending";
  return "failed";
}

/**
 * @internal AC6/AC16's list-shaped read of `payments` — each entry's amount
 * and settlement state, discriminating pending from failed (AC16).
 */
function mapPaymentsSummary(payments: Payment[]): string {
  return join(
    map(
      payments,
      payment => `${payment.amountFormatted} (${paymentStateLabel(payment)})`
    ),
    ", "
  );
}

/**
 * @internal AC5's list-shaped read of `bundle.groups` — each group's label
 * (or "Unlinked") and its item count.
 */
function mapBundleGroupsSummary(groups: InvoiceBundleGroup[]): string {
  return join(
    map(
      groups,
      group => `${group.label ?? "Unlinked"} (${group.products.length})`
    ),
    ", "
  );
}

/**
 * One invoice as a lookup option — the `.for('invoice', id)` slot takes the id,
 * so the record is offered by its number with its formatted total beneath.
 */
export function mapInvoiceLookupItem(raw: IInvoice): LookupItem {
  return {
    value: raw.id,
    label: raw.number,
    description: raw.total_amount_formatted ?? undefined
  };
}

/** The lookup query's `select` — every row as a selectable option. */
export function mapInvoiceLookupItems(raw: IInvoice[]): LookupItem[] {
  return map(raw, mapInvoiceLookupItem);
}

/**
 * One contract as a lookup option — the `.for('contract', id)` slot takes the
 * id, so the record is offered by its name, falling back to its main invoice
 * number and then the id itself when the contract is unnamed.
 */
export function mapContractLookupItem(raw: IContract): LookupItem {
  return {
    value: raw.id,
    label: raw.name ?? raw.main_invoice_number ?? raw.id,
    description: raw.total_amount_formatted ?? undefined
  };
}

/** The contract lookup query's `select` — every row as a selectable option. */
export function mapContractLookupItems(raw: IContract[]): LookupItem[] {
  return map(raw, mapContractLookupItem);
}

/**
 * One contract product as a lookup option — the `.for('contracts_product', id)`
 * slot takes the id. The label leads with the service identifier, falling back
 * to the product name and then the plain name.
 */
export function mapContractProductLookupItem(
  raw: IContractProduct
): LookupItem {
  return {
    value: raw.id,
    label: raw.service_identifier || raw.product_name || raw.name
  };
}

/** The contract-product lookup query's `select`. */
export function mapContractProductLookupItems(
  raw: IContractProduct[] = []
): LookupItem[] {
  return map(raw, mapContractProductLookupItem);
}
