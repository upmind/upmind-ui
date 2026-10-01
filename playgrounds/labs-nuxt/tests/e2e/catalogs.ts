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
import { CLIENT_ORDERS_PINS } from "./catalogs.pins";
import { find, includes, map } from "lodash-es";
import type { CorpusPins } from "./catalogs.pins";
import type { StepCatalog } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export type { CorpusPins } from "./catalogs.pins";
export { CLIENT_ORDERS_PINS, clientEmailsRoute } from "./catalogs.pins";

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
