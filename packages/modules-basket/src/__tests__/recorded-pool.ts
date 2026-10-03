// -----------------------------------------------------------------------------
/**
 * @module basket/__tests__/recorded-pool
 * @description The recorded storefront traffic the integration lane replays: the product-setup journey's guest basket, and a signed-in client's claimed basket, with the brand, system and session reads their own modules recorded.
 */

import { join } from "node:path";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  overrideRoute,
  replayStep,
  startReplayServer
} from "@upmind-automation/test-fixtures/replay-server";
import { map } from "lodash-es";

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

const SETUP = pool("product-setup");
const BRAND = pool("brand");
const SYSTEM = pool("system");
const SESSION = pool("session-store");
const BASKET = pool("basket");
const BASKET_BILLING = pool("basket-billing");
const CLIENT_POOLS = map(
  ["client-address", "client-company", "client-phone"],
  pool
);

const CURRENT_ORDER_KEY = "get-orders-current";
const CLAIMED_ORDER_KEY = "get-orders-id";
const BASKET_PRODUCT_KEY =
  "get-basket-id-products-id-basket-id-basket-product-id-currency-id-promotions";

export const server = startReplayServer({ recordingsDir: SETUP });

// -----------------------------------------------------------------------------

type RecordedBasketProduct = {
  id: string;
  product_id: string;
  product?: { name?: string };
};

const recordedOrder = (
  getFixture(CURRENT_ORDER_KEY, { recordingsDir: SETUP }).response.body as {
    data?: { id?: string; products?: RecordedBasketProduct[] };
  }
).data;

const recordedBasketProducts = recordedOrder?.products ?? [];

export const recordedBasketId = recordedOrder?.id;

export const recordedProductNames = map(recordedBasketProducts, row =>
  (row.product?.name ?? "").trim()
);

export const recordedBasketProductId = /\/products\/([^/?]+)/.exec(
  getFixture(BASKET_PRODUCT_KEY, { recordingsDir: SETUP }).request.path.replace(
    /^\/api\/basket\//,
    ""
  )
)?.[1];

export const recordedClaimedBasketId = (
  getFixture(CLAIMED_ORDER_KEY, { recordingsDir: BASKET_BILLING }).response
    .body as { data?: { id?: string; client_id?: string } }
).data?.id;

export const recordedClient = {
  token: getFixture("post-oauth-access-token-client", {
    recordingsDir: SESSION
  }).response.body,
  self: (
    getFixture("get-self", { recordingsDir: SESSION }).response.body as {
      data: unknown;
    }
  ).data
};

/** The brand, system and session reads their own modules recorded, in front of the journey's, and the guest token `initStore()` mints. */
export function installBootRoutes(): void {
  replayStep(server, BRAND);
  replayStep(server, SYSTEM);
  replayStep(server, SESSION);

  const guest = getFixture("post-oauth-access-token-guest", {
    recordingsDir: SESSION
  }).response;
  overrideRoute(
    server,
    "post",
    "*/oauth/access_token",
    guest.body,
    guest.status
  );
}

/** The guest boot, with the signed-in client's basket, billing and client-data reads their own modules recorded in front of it. */
export function installClientRoutes(): void {
  installBootRoutes();
  replayStep(server, BASKET);
  replayStep(server, BASKET_BILLING);
  for (const dir of CLIENT_POOLS) replayStep(server, dir);
}

if (
  !recordedClaimedBasketId ||
  !recordedBasketId ||
  recordedBasketProducts.length === 0 ||
  !recordedBasketProductId
) {
  throw new Error(
    "The recorded pools no longer hold the journey's basket with its " +
      "products and a configured basket product, or the client's claimed " +
      "basket. Re-run `pnpm fixtures:generate product-setup` and " +
      "`pnpm fixtures:generate basket-billing`."
  );
}
