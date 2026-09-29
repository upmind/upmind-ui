// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/catalogs
 * @description The adopted spec pairs this lane executes. A module has ONE
 * `<module>.feature` and ONE `<module>.steps.ts`, colocated with its module
 * source, and both halves of each pair are registered here so the feature
 * list and the catalog list can never name different sets.
 *
 * Each catalog is imported by relative path, as the root
 * `playwright.bdd.config.ts` imports its own: the headless testing entry
 * collects catalogs with `import.meta.glob`, which the Playwright config
 * process cannot run (design 8.12).
 *
 * The catalogs never import playwright-bdd, and this file never asserts.
 */

// eslint-disable-next-line @workspace/no-cross-package-path-imports -- design 8.12: a catalog has no published specifier, and the testing entry's import.meta.glob fails in the Playwright config process
import { clientEmailsSteps } from "../../../../packages/headless/src/modules/client-email/__tests__/client-email.steps";
// eslint-disable-next-line @workspace/no-cross-package-path-imports -- design 8.12, as above
import { clientOrdersSteps } from "../../../../packages/headless/src/modules/client-orders/__tests__/client-orders.steps";
import { find, includes, map } from "lodash-es";
import type { StepCatalog } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The capture names a pair serves for one `METHOD endpoint-shape`. Each other
 * capture of that shape is dropped from the pair's corpus.
 */
export type CorpusPins = Readonly<Record<string, string | readonly string[]>>;

/** One adopted pair: its module, catalog, feature, route and corpus pins. */
export type SpecPair = {
  module: string;
  catalog: StepCatalog;
  feature: string;
  route: string;
  pins: CorpusPins;
};

const featureOf = (module: string) =>
  `../../packages/headless/src/modules/${module}/__tests__/${module}.feature`;

/** The client-orders list captures the lane pool serves (design 8.12, 8.8). */
const CLIENT_ORDERS_LIST_POOL = [
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

// -----------------------------------------------------------------------------

export const pairs: readonly SpecPair[] = [
  {
    module: "client-email",
    catalog: clientEmailsSteps,
    feature: featureOf("client-email"),
    route: "/useClientEmails/as/client",
    pins: {}
  },
  {
    module: "client-orders",
    catalog: clientOrdersSteps,
    feature: featureOf("client-orders"),
    route: "/useClientOrders",
    pins: CLIENT_ORDERS_PINS
  }
];

export const catalogs: StepCatalog[] = map(pairs, "catalog");

/** Feature paths, relative to this playground's root. */
export const features: string[] = map(pairs, "feature");

/**
 * The pair a generated test belongs to, read off its file path: the
 * generated spec keeps the feature's own path under the output directory.
 */
export function pairOf(testFile: string): SpecPair | undefined {
  return find(pairs, pair =>
    includes(
      testFile,
      `/modules/${pair.module}/__tests__/${pair.module}.feature`
    )
  );
}

/** The client-email route, kept for one release beside `pairs`. */
export const clientEmailsRoute = "/useClientEmails/as/client";
