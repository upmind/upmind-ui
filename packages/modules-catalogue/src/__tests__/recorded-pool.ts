// -----------------------------------------------------------------------------
/**
 * @module catalogue/__tests__/recorded-pool
 * @description The recorded guest storefront traffic the integration lane replays: the brand's category tree and the products listed under it.
 */

import { join } from "node:path";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  overrideRoute,
  startReplayServer
} from "@upmind-automation/test-fixtures/replay-server";
import { find, map } from "lodash-es";

// -----------------------------------------------------------------------------

const HEADLESS_MODULES = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "headless",
  "src",
  "modules"
);

function pool(unit: string): string {
  return join(HEADLESS_MODULES, unit, "__tests__", "fixtures");
}

const CATEGORIES = pool("product-categories");
const CATALOGUE = pool("product-catalogue");
const SESSION = pool("session-store");

const CATEGORIES_KEY = "get-basket-products-categories-case-unpaged";
const PRODUCTS_KEY =
  "get-basket-products-case-page-1-filter-provision-blueprint-category-code-neq-domain-names";

export const server = startReplayServer({ recordingsDir: CATEGORIES });

function replayFrom(
  method: "get" | "post",
  route: string,
  key: string,
  dir: string
): void {
  const recorded = getFixture(key, { recordingsDir: dir }).response;
  overrideRoute(
    server,
    method,
    route,
    recorded.body as object,
    recorded.status
  );
}

type RecordedRow = {
  id: string;
  name?: string;
  meta?: { widgets?: { dac?: boolean } };
};

function recordedRows(key: string, dir: string): RecordedRow[] {
  const body = getFixture(key, { recordingsDir: dir }).response.body as {
    data?: RecordedRow[];
  };
  return body.data ?? [];
}

export const recordedCategoryNames = map(
  recordedRows(CATEGORIES_KEY, CATEGORIES),
  "name"
);

/** The recorded category whose meta asks for the domain search widget. */
export const recordedDacCategory = find(
  recordedRows(CATEGORIES_KEY, CATEGORIES),
  row => row.meta?.widgets?.dac === true
);

/** The category tree for every paging, the listed products, the storefront's config and lookups for every filter, and the session pool's guest token, which the storefront pools never recorded. */
export function installBootRoutes(): void {
  replayFrom(
    "post",
    "*/oauth/access_token",
    "post-oauth-access-token-guest",
    SESSION
  );
  replayFrom(
    "get",
    "*/config/brand/values",
    "get-config-brand-values",
    CATALOGUE
  );
  replayFrom(
    "get",
    "*/config/organisation/values",
    "get-config-organisation-values",
    CATALOGUE
  );
  replayFrom("get", "*/billing_cycles", "get-billing-cycles", CATALOGUE);
  replayFrom("get", "*/countries", "get-countries", CATALOGUE);
  replayFrom("get", "*/basket/products_categories", CATEGORIES_KEY, CATEGORIES);
  replayFrom("get", "*/basket/products", PRODUCTS_KEY, CATALOGUE);
}

if (
  recordedCategoryNames.length === 0 ||
  recordedRows(PRODUCTS_KEY, CATALOGUE).length === 0
) {
  throw new Error(
    "The recorded storefront pools no longer hold a category tree and a " +
      "product list. Re-run `pnpm fixtures:generate product-categories` and " +
      "`pnpm fixtures:generate product-catalogue`."
  );
}
