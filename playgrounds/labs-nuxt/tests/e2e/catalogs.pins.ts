// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/catalogs.pins
 * @description The corpus pins and routes the lane reads, with NO step-catalog
 * import. The lane specs and `recorded-corpus` read the pins from here so they
 * never pull a module's `*.steps` (and its static scenario-JSON imports) into
 * the Playwright loader; `catalogs.ts` wires the steps and re-exports these.
 */

// -----------------------------------------------------------------------------

/**
 * The capture names a pair serves for one `METHOD endpoint-shape`. Each other
 * capture of that shape is dropped from the pair's corpus.
 */
export type CorpusPins = Readonly<Record<string, string | readonly string[]>>;

/** The client-orders list captures the lane pool serves (design 8.12, 8.8). */
export const CLIENT_ORDERS_LIST_POOL = [
  "get-invoices-case-orders-default",
  "get-invoices-case-orders-page-2",
  "get-invoices-case-orders-search",
  "get-invoices-case-orders-status-eq-csv",
  "get-invoices-case-orders-status-neq",
  "get-invoices-case-orders-sort-created_at",
  "get-invoices-case-orders-sort-id",
  "get-invoices-case-orders-sort-status_id",
  "get-invoices-case-orders-sort-total_amount",
  "get-invoices-case-orders-number-like-probe",
  "get-invoices-case-orders-number-neq-probe",
  "get-invoices-case-orders-total_amount-eq-probe",
  "get-invoices-case-orders-total_amount-neq-probe",
  "get-invoices-case-orders-total_amount-gt-probe",
  "get-invoices-case-orders-total_amount-gte-probe",
  "get-invoices-case-orders-total_amount-lt-probe",
  "get-invoices-case-orders-total_amount-lte-probe",
  "get-invoices-case-orders-created_at-gt-probe",
  "get-invoices-case-orders-created_at-gte-probe",
  "get-invoices-case-orders-created_at-lt-probe",
  "get-invoices-case-orders-created_at-lte-probe",
  "get-invoices-case-orders-created_at-after-probe",
  "get-invoices-case-orders-created_at-before-probe",
  "get-invoices-case-orders-paid_datetime-gt-probe",
  "get-invoices-case-orders-paid_datetime-gte-probe",
  "get-invoices-case-orders-paid_datetime-lt-probe",
  "get-invoices-case-orders-paid_datetime-lte-probe",
  "get-invoices-case-orders-paid_datetime-after-probe",
  "get-invoices-case-orders-paid_datetime-before-probe",
  "get-invoices-case-orders-products-product-name-like-probe",
  "get-invoices-case-orders-products-product-name-eq-probe",
  "get-invoices-case-orders-products-product-name-neq-probe",
  "get-invoices-case-orders-products-product-category-name-like-probe",
  "get-invoices-case-orders-products-product-category-name-eq-probe",
  "get-invoices-case-orders-products-product-category-name-neq-probe",
  "get-invoices-case-orders-products-service_identifier-like-probe",
  "get-invoices-case-orders-products-service_identifier-eq-probe",
  "get-invoices-case-orders-products-service_identifier-neq-probe"
] as const;

/** The pins of the client-orders pair (design 8.12). */
export const CLIENT_ORDERS_PINS: CorpusPins = {
  "GET api/invoices": CLIENT_ORDERS_LIST_POOL,
  "GET api/invoices/{id}": "get-invoices-id-case-order-unpaid",
  "GET api/brands/{id}/gateways": "get-brands-id-gateways-case-online"
};

/** The client-email route, kept for one release beside `pairs`. */
export const clientEmailsRoute = "/useClientEmails/as/client";
