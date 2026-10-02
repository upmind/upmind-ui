// -----------------------------------------------------------------------------
/**
 * @module product/__tests__/recorded-pool
 * @description The recorded product traffic the integration lane replays, and its accessors.
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

const SETUP = pool("product-setup");
const CATALOGUE = pool("product-catalogue");

const CURRENT_ORDER_KEY = "get-orders-current";
const BASKET_PRODUCT_KEY =
  "get-basket-id-products-id-basket-id-basket-product-id-currency-id-promotions";
const FIELD_DEFINITIONS_KEY = "get-basket-products-id-provision-fields";
const FIELD_VALUES_KEY = "get-orders-id-products-id-provision-fields-values";

const RELATED_ORDER_KEY = "get-orders-current-case-related";
const RELATED_HOST_PRODUCT_KEY =
  "get-basket-id-products-id-basket-id-basket-product-id-case-related-host";
const RELATED_HOST_FIELDS_KEY =
  "get-basket-products-id-provision-fields-case-related-host";
const RELATED_HOST_VALUES_KEY =
  "get-orders-id-products-id-provision-fields-values-case-related-host";
const RELATED_FIELD_CHECK_KEY =
  "patch-orders-id-provision-fields-values-check-case-related";

export const server = startReplayServer({ recordingsDir: SETUP });

function fixture(key: string, dir: string) {
  return getFixture(key, { recordingsDir: dir });
}

function replayFrom(
  method: "get" | "patch" | "post",
  route: string,
  key: string,
  dir: string
): void {
  const recorded = fixture(key, dir).response;
  overrideRoute(
    server,
    method,
    route,
    recorded.body as object,
    recorded.status
  );
}

const EMPTY_LIST = { status: "ok", data: [] };
const EMPTY_OBJECT = { status: "ok", data: {} };

// -----------------------------------------------------------------------------

type RecordedBasketProduct = {
  id: string;
  product_id: string;
  name?: string;
};

type RecordedOrder = {
  id: string;
  products?: RecordedBasketProduct[];
};

const recordedOrder = (
  fixture(CURRENT_ORDER_KEY, SETUP).response.body as { data?: RecordedOrder }
).data;

const recordedBasketProducts = recordedOrder?.products ?? [];

const configuredBasketProductId = /\/products\/([^/?]+)/.exec(
  fixture(BASKET_PRODUCT_KEY, SETUP).request.path.replace(
    /^\/api\/basket\//,
    ""
  )
)?.[1];

const configured = recordedBasketProducts.find(
  row => row.id === configuredBasketProductId
);

export const recordedBasketId = recordedOrder?.id;

export const recordedBasketProductId = configured?.id;

export const recordedProductId = configured?.product_id;

export const otherProductId = recordedBasketProducts.find(
  row => row.id !== configuredBasketProductId
)?.product_id;

type RecordedProduct = {
  id: string;
  name?: string;
  display_price?: string;
  image?: unknown;
  prices?: Array<{ price_formatted?: string }>;
  products_options?: Array<{ id: string; name?: string }>;
};

const recordedProduct = (
  fixture(BASKET_PRODUCT_KEY, SETUP).response.body as { data?: RecordedProduct }
).data;

export const recordedProductName = recordedProduct?.name?.trim();

export const recordedProductHasImage = Boolean(recordedProduct?.image);

export const recordedDisplayPrice = recordedProduct?.display_price;

export const recordedPriceLabels = (recordedProduct?.prices ?? [])
  .map(price => price.price_formatted)
  .filter((label): label is string => Boolean(label));

type RecordedField = {
  field_label?: string;
  field_type?: string;
  required?: boolean;
  customer_enabled?: boolean;
};

const recordedFieldRows =
  (
    fixture(FIELD_DEFINITIONS_KEY, SETUP).response.body as {
      data?: RecordedField[];
    }
  ).data ?? [];

export const recordedFieldLabels = recordedFieldRows
  .map(field => field.field_label)
  .filter((label): label is string => Boolean(label));

export const recordedRequiredFieldLabels = recordedFieldRows
  .filter(field => field.required)
  .map(field => field.field_label)
  .filter((label): label is string => Boolean(label));

export const recordedFieldValues = fixture(FIELD_VALUES_KEY, SETUP).response
  .body as { data?: Record<string, unknown> };

// --- the related basket's host product, recorded with its image.

const relatedOrder = (
  fixture(RELATED_ORDER_KEY, SETUP).response.body as { data?: RecordedOrder }
).data;

const relatedHostBasketProductId = /\/products\/([^/?]+)/.exec(
  fixture(RELATED_HOST_PRODUCT_KEY, SETUP).request.path.replace(
    /^\/api\/basket\//,
    ""
  )
)?.[1];

const relatedHostProduct = (
  fixture(RELATED_HOST_PRODUCT_KEY, SETUP).response.body as {
    data?: RecordedProduct;
  }
).data;

export const relatedHostProductId = relatedOrder?.products?.find(
  row => row.id === relatedHostBasketProductId
)?.product_id;

export const relatedHostProductName = relatedHostProduct?.name?.trim();

export const relatedHostHasImage = Boolean(relatedHostProduct?.image);

// -----------------------------------------------------------------------------

export function installBootRoutes(): void {
  replayFrom(
    "post",
    "*/oauth/access_token",
    "post-oauth-access-token-guest",
    SETUP
  );
  replayFrom("get", "*/self", "get-self", SETUP);
  replayFrom("get", "*/brand/settings", "get-brand-settings", SETUP);
  replayFrom("get", "*/org/modules", "get-org-modules", SETUP);
  replayFrom(
    "get",
    "*/config/organisation/values",
    "get-config-organisation-values-c8d23f06",
    SETUP
  );
  replayFrom(
    "get",
    "*/config/brand/values",
    "get-config-brand-values-5b24f2a4",
    SETUP
  );
  replayFrom("get", "*/countries", "get-countries", SETUP);
  replayFrom("get", "*/currencies", "get-currencies", CATALOGUE);
  replayFrom("get", "*/billing_cycles", "get-billing-cycles", CATALOGUE);
  replayFrom("get", "*/basket_fields", "get-basket-fields", SETUP);

  // --- the recorded journey.

  replayFrom("get", "*/orders/current", CURRENT_ORDER_KEY, SETUP);

  replayFrom(
    "get",
    "*/basket/:basketId/products/:basketProductId",
    BASKET_PRODUCT_KEY,
    SETUP
  );
  replayFrom("get", "*/basket/products/:productId", BASKET_PRODUCT_KEY, SETUP);
  replayFrom(
    "get",
    "*/basket/products/:productId/provision_fields",
    FIELD_DEFINITIONS_KEY,
    SETUP
  );
  replayFrom(
    "get",
    "*/orders/:orderId/products/:basketProductId/provision_fields/values",
    FIELD_VALUES_KEY,
    SETUP
  );
  replayFrom(
    "patch",
    "*/orders/:orderId/provision_fields/values/check",
    "patch-orders-id-provision-fields-values-check",
    SETUP
  );

  overrideRoute(server, "get", "*/basket/products", EMPTY_LIST);
  overrideRoute(server, "get", "*/basket/products_categories", EMPTY_LIST);
  overrideRoute(server, "get", "*/lookup/*", EMPTY_LIST);
  overrideRoute(server, "post", "*/cart/calculate", EMPTY_OBJECT);
}

/** The boot routes, with the related basket and its host product in place of the configured one. */
export function installRelatedHostRoutes(): void {
  installBootRoutes();

  replayFrom("get", "*/orders/current", RELATED_ORDER_KEY, SETUP);
  replayFrom(
    "get",
    "*/basket/:basketId/products/:basketProductId",
    RELATED_HOST_PRODUCT_KEY,
    SETUP
  );
  replayFrom(
    "get",
    "*/basket/products/:productId",
    RELATED_HOST_PRODUCT_KEY,
    SETUP
  );
  replayFrom(
    "get",
    "*/basket/products/:productId/provision_fields",
    RELATED_HOST_FIELDS_KEY,
    SETUP
  );
  replayFrom(
    "get",
    "*/orders/:orderId/products/:basketProductId/provision_fields/values",
    RELATED_HOST_VALUES_KEY,
    SETUP
  );
  replayFrom(
    "patch",
    "*/orders/:orderId/provision_fields/values/check",
    RELATED_FIELD_CHECK_KEY,
    SETUP
  );
}

if (
  !relatedHostProductId ||
  !relatedHostProductName ||
  !relatedHostHasImage ||
  recordedProductHasImage
) {
  throw new Error(
    "The recorded pool no longer holds a configured product without an image " +
      "and a related host product with one. Re-run " +
      "`pnpm fixtures:generate product-setup`."
  );
}

if (
  !recordedBasketId ||
  !recordedBasketProductId ||
  !recordedProductId ||
  !otherProductId ||
  !recordedProductName ||
  !recordedDisplayPrice ||
  recordedFieldLabels.length === 0
) {
  throw new Error(
    "The recorded pool is missing the basket, the configured product, its " +
      "name, its price or the configure boundary's fields. Re-run " +
      "`pnpm fixtures:generate product-setup`."
  );
}
