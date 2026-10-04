// -----------------------------------------------------------------------------
/**
 * @module domain/__tests__/recorded-pool
 * @description The recorded guest storefront traffic the integration lane replays: a guest with no current basket, before any search.
 */

import { join } from "node:path";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  overrideRoute,
  startReplayServer
} from "@upmind-automation/test-fixtures/replay-server";

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

const CATALOGUE = pool("product-catalogue");
const SESSION = pool("session-store");

const NO_BASKET_KEY = "get-orders-current";

export const server = startReplayServer({ recordingsDir: CATALOGUE });

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

/** The storefront pool's config and lookups for every filter, and the session pool's guest token, which the storefront pool never recorded. */
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
}

if (
  getFixture(NO_BASKET_KEY, { recordingsDir: CATALOGUE }).response.status !==
  204
) {
  throw new Error(
    "The recorded storefront pool no longer holds a guest with no current " +
      "basket. Re-run `pnpm fixtures:generate product-catalogue`."
  );
}
