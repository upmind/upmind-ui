// -----------------------------------------------------------------------------
/**
 * @module storefront-guest-oneoff-checkout-stripe/journey
 * @description The journey's alias map and SLUG (ADR 025). `defineJourney`
 * binds each readable `"METHOD path"` selector to the unwrapped `data` of its
 * own co-located fixture, so the int test consumes recorded domain data
 * directly (`journey().order.currency`) without re-reading files by hand. The
 * SLUG is the single vocabulary — folder name, `.feature` Feature, replay scope
 * and alias scope all derive from it and cannot drift.
 */

import { join } from "node:path";
import { defineJourney, select } from "@upmind-automation/test-fixtures";

// -----------------------------------------------------------------------------

export const SLUG = "storefront-guest-oneoff-checkout-stripe";

const recordingsDir = join(import.meta.dirname, "fixtures");

// --- recorded-body shapes (only the fields this journey asserts on) ----------

type GuestToken = {
  actor_type: string;
  access_token: string;
  token_type: string;
};

type Product = {
  id: string;
  name: string;
  prices: unknown[];
};

type Order = {
  id: string;
  currency: { code: string; name: string; id: string };
  status: { code: string; name: string };
};

type CartCalculation = {
  total: number;
  total_formatted: string;
  prices: unknown;
};

/** The gateways endpoint returns `data` as a numeric-keyed map, not an array. */
type Gateway = {
  id: string;
  active: boolean;
  gateway: {
    gateway_provider: { name: string; code: string };
  };
};
type GatewayMap = Record<string, Gateway>;

// -----------------------------------------------------------------------------

/**
 * Typed, lazy accessor for this journey's recorded traffic. Least-specific
 * match wins per selector; add query params to target a variant.
 */
export const journey = defineJourney(
  SLUG,
  {
    /** The guest grant minted at boot (no `{ data }` envelope — passes through). */
    guestToken: select<GuestToken>("POST oauth/access_token"),
    /** The storefront catalogue list (`useProductCatalogue`). */
    catalogue: select<Product[]>("GET basket/products"),
    /** The order created on checkout (`useBasket`). */
    order: select<Order>("POST orders"),
    /** The recalculated cart totals behind the basket summary (`useBasket`). */
    cart: select<CartCalculation>("POST cart/calculate"),
    /** The gateways offered for the basket — this journey pays with Stripe. */
    gateways: select<GatewayMap>("GET brands/mock-uuid-3/gateways")
  },
  { recordingsDir }
);
