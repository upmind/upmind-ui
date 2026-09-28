/** @internal */
import {
  BrandConfigKeys,
  ProductOrderTypes,
  StoreDisplayMode,
  UUID
} from "@upmind-automation/types";
import { useBrand } from "../brand";
import {
  compact,
  find,
  get,
  groupBy,
  isArray,
  values as lodashValues
} from "lodash-es";
import type {
  ClientOrderDetail,
  ClientOrderItem,
  ClientOrderSubItem,
  MapOrderItemsOptions
} from "./client-orders.types";
import type { IInvoiceProduct, IOrder } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/client-orders.mappers
 * @description Pure projections over the raw `IOrder` record (design 5.3,
 * 8.7, D-2) — `mapOrderDetail`, `mapOrderItems` — plus the two brand-derived
 * rules `isMultibrand`/`showStore` that `useClientOrders.services.ts` and
 * `useClientOrders.meta.ts` both read from THIS one copy (design 5.3 "rule
 * copies").
 */
// -----------------------------------------------------------------------------

/** D-16 — the ORG placeholder brand id names the multi-brand org context. */
export function isMultibrand(): boolean {
  return useBrand().brandId.value === UUID.ORG;
}

/**
 * D-16 — the oracle rule (`vue-app` `brand/showStore` getter): `SHOW` and
 * the unset default always show; `HIDE` never shows; `SHOW_LOGGED_IN` shows
 * when the viewer is authenticated — always true here, this module reads
 * only while the session addresses a client.
 */
export function showStore(): boolean {
  const mode =
    useBrand().getConfigValue<StoreDisplayMode>(
      BrandConfigKeys.SHOW_CLIENT_STORE
    ) ?? StoreDisplayMode.SHOW;

  return mode !== StoreDisplayMode.HIDE;
}

// -----------------------------------------------------------------------------
// The detail projection (design 8.7)
// -----------------------------------------------------------------------------

/** Pure projection over the raw record — guarded reads, no throw on a thin record. */
export function mapOrderDetail(raw?: IOrder): ClientOrderDetail {
  return {
    id: raw?.id,
    number: raw?.number,
    status: raw?.status,
    totalAmountFormatted: raw?.total_amount_formatted,
    createdAt: raw?.created_at,
    paidDatetime: raw?.paid_datetime,
    dueDate: raw?.due_date,
    refundChanged: raw?.refund_changed,
    cancellationDatetime: raw?.cancellation_datetime,
    cancellationReason: raw?.contract?.cancellation_reason ?? undefined,
    notes: raw?.notes,
    customFields: raw?.custom_fields,
    contractId: raw?.contract_id,
    brandId: raw?.brand_id,
    referrer:
      raw?.account?.affiliate_referral?.affiliate_account?.account?.client?.[0]
  };
}

// -----------------------------------------------------------------------------
// The item projection (design 8.7)
// -----------------------------------------------------------------------------

function subItemPrice(
  subItem: IInvoiceProduct,
  fromAttributes: boolean
): string {
  if (fromAttributes) return "—";
  return subItem.configuration_net_selling_price_discounted_formatted ?? "—";
}

function subItemName(subItem: IInvoiceProduct): string {
  return compact([
    subItem.product?.category?.name_translated
      ? `${subItem.product.category.name_translated}:`
      : null,
    subItem.name || subItem.product?.name_translated,
    subItem.unit_quantity > 1 ? `(x${subItem.unit_quantity})` : null
  ]).join(" ");
}

/** Design 8.7 sub-item rules 1 to 7. */
function mapSubItems(
  item: IInvoiceProduct
): Pick<
  ClientOrderItem,
  "quantifiableItems" | "nonQuantifiableItems" | "hasSubItems"
> {
  const asRows = (
    source: IInvoiceProduct[] | Record<string, IInvoiceProduct>
  ) => (isArray(source) ? source : lodashValues(source ?? {}));

  const quantifiableItems: ClientOrderSubItem[] = [];
  const nonQuantifiableItems: ClientOrderSubItem[] = [];

  function collect(rows: IInvoiceProduct[], fromAttributes: boolean) {
    for (const subItem of rows) {
      const row: ClientOrderSubItem = {
        id: subItem.id,
        name: subItemName(subItem),
        quantity: subItem.unit_quantity ?? 1,
        price: subItemPrice(subItem, fromAttributes),
        total: ""
      };

      if (subItem.product?.order_type === ProductOrderTypes.SINGLE_OPTION) {
        nonQuantifiableItems.push({ ...row, total: row.price });
      } else {
        quantifiableItems.push(row);
      }
    }
  }

  collect(asRows(item.options), false);
  collect(asRows(item.attributes), true);

  const hasSubItems =
    quantifiableItems.length > 0 || nonQuantifiableItems.length > 0;

  if (hasSubItems) {
    quantifiableItems.unshift({
      id: `sub-${item.id}`,
      name: subItemName(item),
      quantity: item.unit_quantity ?? 1,
      price: item.net_selling_price_discounted_formatted ?? "—",
      total: ""
    });
  }

  return { quantifiableItems, nonQuantifiableItems, hasSubItems };
}

function itemPeriod(
  item: IInvoiceProduct
): ClientOrderItem["period"] | undefined {
  const from = item.display_from_date ?? item.from_date;
  const to = item.display_to_date ?? item.to_date;
  return from && to ? { from, to } : undefined;
}

/**
 * Pure projection over the raw record (design 8.7). The source is the
 * SNAPSHOT-FIRST oracle expression: an empty snapshot array is truthy, so it
 * gives no items and no live fallback; only an ABSENT snapshot key falls
 * back to the live `products` (design 8.7 "source", design 8.11).
 */
/**
 * The SNAPSHOT-FIRST source rows (design 8.7 "source", design 8.11): an
 * empty snapshot array is truthy, so it gives no items and no live
 * fallback; only an ABSENT snapshot key falls back to the live `products`.
 * Exported so the manager root can derive the same rows for the item-image
 * read's product-id list without a second copy of this rule.
 */
export function rawOrderItems(order?: IOrder): IInvoiceProduct[] {
  return order?.current_data?.content?.products || order?.products || [];
}

export function mapOrderItems(
  order: IOrder | undefined,
  { billingCycles, imageMap, hideOneTimePurchases }: MapOrderItemsOptions
): ClientOrderItem[] {
  if (!order) return [];

  const source = rawOrderItems(order);

  const contractProductTags = groupBy(
    get(order, "contract_product_tags", []),
    "contract_product_id"
  );

  return source.map(item => {
    const billingCycleMonths =
      item.billing_cycle_months || item.product?.billing_cycle_months || 0;
    const contractProductId = item.contracts_product_id;

    return {
      id: item.id,
      brandId: item.product?.brand_id,
      contractProductId,
      contractId: item.contract_id || order.contract_id,
      name: compact([
        item.name || item.product?.name_translated,
        item.service_identifier ? `(${item.service_identifier})` : null
      ]).join(" "),
      reference: item.client_label || "",
      period: itemPeriod(item),
      quantity: item.quantity,
      price: item.configuration_net_selling_price_discounted_formatted,
      total: item.configuration_net_amount_discounted_formatted,
      billingCycleMonths,
      isSubscription: !!item.billing_cycle_days || !!billingCycleMonths,
      billingCycle: find(billingCycles, ["months", billingCycleMonths]),
      image:
        (item.product?.id ? imageMap[item.product.id] : undefined) ??
        item.product?.image?.full_url,
      tags: contractProductId
        ? (contractProductTags[contractProductId] ?? [])
        : [],
      canLink: !(hideOneTimePurchases && !billingCycleMonths),
      ...mapSubItems(item)
    };
  });
}
