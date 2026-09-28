import { InvoiceStatus } from "@upmind-automation/types";
import { isCancellable, isDue } from "../contract-product";
import type { IOrder } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/client-orders.utils
 * @description The order conditions (design 8.5, ruling R1) — the six new
 * pure predicates this module owns. `isDue`/`isCancellable` are consumed
 * from the FE-3029 `contract-product` barrel, never re-implemented here
 * (ruling R1, D-19); the barrel re-exports only THIS file's six.
 */
// -----------------------------------------------------------------------------

/** The fields every order-condition predicate below reads. */
type OrderCondition = Pick<
  IOrder,
  "status" | "paid_amount" | "unpaid_amount_converted"
>;

const CANCELLED_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CANCELLED,
  InvoiceStatus.CANCELLATION_REQUEST
];

/** True while the order's status is `OVERDUE` (design 8.5). */
export function isOverdue(order: Pick<IOrder, "status">): boolean {
  return order.status?.code === InvoiceStatus.OVERDUE;
}

/** True while the order's status is `PAID` (design 8.5). */
export function isPaid(order: Pick<IOrder, "status">): boolean {
  return order.status?.code === InvoiceStatus.PAID;
}

/** True while the order is `CANCELLED` or `CANCELLATION_REQUEST` (design 8.5). */
export function isCancelled(order: Pick<IOrder, "status">): boolean {
  return CANCELLED_STATUSES.includes(order.status?.code as InvoiceStatus);
}

/** True while the order is due and carries BOTH an unpaid and a paid amount (design 8.5). */
export function isPartiallyPaid(order: OrderCondition): boolean {
  return (
    isDue(order) &&
    (order.unpaid_amount_converted ?? 0) > 0 &&
    (order.paid_amount ?? 0) > 0
  );
}

/** True while the order is due and still carries an unpaid balance (design 8.5). */
export function canPay(order: OrderCondition): boolean {
  return isDue(order) && !!(order.unpaid_amount_converted ?? 0);
}

/** True while the order is due AND cancelling it still means anything (design 8.5). */
export function canCancel(order: Pick<IOrder, "status">): boolean {
  return isCancellable(order) && isDue(order);
}
