import { GatewayTypes, InvoiceCategoryCode } from "@upmind-automation/types";
import { parseTaxes } from "../basket/basket.utils";
import { parseBasketProduct } from "../basket-product/basket-product.utils";
import { mapClient } from "../client";
import { mapAddress } from "../client-address";
import { mapCurrency } from "../currency";
import { useDate } from "../../utils";
import {
  castArray,
  first,
  get,
  groupBy,
  map,
  orderBy,
  sortBy
} from "lodash-es";
import type {
  InvoiceBundleGroup,
  Invoice,
  InvoiceUnpaidAmount,
  Payment
} from "./invoices.types";
import type { IInvoice, InvoiceStatus } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.mappers
 * @description Wire -> VM mapping for the invoices module. `mapInvoice` /
 * `mapInvoices` are curated public exports, consumed by
 * `orders/order.machine.ts` via the module barrel (design D2) — no cross-
 * module import of this file itself. `mapPayments` and `mapBundleGroups` are
 * genuinely private and marked `@internal` individually, rather than the
 * pre-conversion blanket file-level marker.
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
 * Maps one raw invoice to the VM. `readingClientId` is OPTIONAL and
 * defaults every attribution flag to the conservative "not mine to attribute"
 * shape when absent — `orders/order.machine.ts:175` calls this with one
 * argument and stays fully green (design D2).
 */
export function mapInvoice(raw: IInvoice, readingClientId?: string): Invoice {
  const slug = raw.category?.slug as InvoiceCategoryCode;

  return {
    id: raw.id,
    locked: !!raw.locked,
    status: raw.status.code as InvoiceStatus,
    number: raw.number,
    client: mapClient(raw.client)!,
    address: raw.address ? mapAddress(raw.address) : undefined,
    currency: mapCurrency(raw.currency),
    products: map(raw.products, product => parseBasketProduct(product)),
    payments: mapPayments(raw.payments),
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
 * Maps the raw unpaid-amount envelope (AC1). The endpoint's real response
 * carries exactly `unpaid_amount` / `unpaid_amount_formatted` — see
 * {@link InvoiceUnpaidAmount}'s `@decision`.
 */
export function mapUnpaidAmount(raw: {
  unpaid_amount: number;
  unpaid_amount_formatted: string;
}): InvoiceUnpaidAmount {
  return {
    amount: raw.unpaid_amount,
    amountFormatted: raw.unpaid_amount_formatted
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
  const isChildOfClient =
    !!readingClientId &&
    get(raw, "client.parent_client_config.parent_client_id") ===
      readingClientId;
  const isDelegated = !isChildOfClient && !!raw.delegate_related;

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

  return {
    productCount,
    isLarge: productCount > 5,
    groups: mapBundleGroups(raw.products)
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
      amountFormatted: payment.amount_formatted,
      createdAt: payment.created_at,
      attemptAgeMs: Date.now() - new Date(payment.created_at).getTime(),
      // `oracle:94-97` — pending AND awaiting-client gateway, not the gateway
      // alone: a settled payment on that gateway type is not awaiting anyone.
      isAwaitingClient:
        !!payment.pending &&
        payment.gateway?.type === GatewayTypes.AWAITING_CLIENT
    };
  });

  return orderBy(mapped, ["createdAt"], ["desc"]);
}
