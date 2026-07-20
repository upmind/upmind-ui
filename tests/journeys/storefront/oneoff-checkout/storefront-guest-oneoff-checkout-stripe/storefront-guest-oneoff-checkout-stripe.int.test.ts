// -----------------------------------------------------------------------------
/**
 * @fileoverview storefront-guest-oneoff-checkout-stripe — the first cross-module
 * journey unit on the ADR 025 rails, driven LIVE through the headless machines.
 *
 * @see ./README.md for the boot-harness model, fixture provenance, and how this
 * folder is the copyable journey template.
 *
 * ## Job To Be Done
 * Exercise a guest one-off Stripe checkout against this journey's OWN
 * co-located, PII-masked, recorded fixtures replayed by MSW (no mocked backend
 * data — ADR 021 / ADR 025 A1.2). The breadth of the flow lives at THIS
 * integration layer (ADR 025 §"e2e stays sliced"), and — via the FE-2992 boot
 * harness (`../../../support/basket-boot`, the ADR 025 A1.3 direction) — the
 * flow's core modules are driven through their REAL machines to a settled state,
 * not asserted as recorded traffic:
 *   - `useActiveSession` boots a real guest session through replay.
 *   - `useBasket`'s XState machine settles to `shopping` for the guest
 *     empty-basket boot, then recalculates its totals live on add-to-basket.
 *   - `useProductCatalogue` and `useBasketCurrency` load through the same boot.
 *
 * ## The boot the recording can't replay (why the harness exists)
 * A guest boot calls `GET orders/current`; this journey's recorded fixture for
 * it is a transient 401 (see the harness header). Statically replayed, that 401
 * strands the basket machine in `error` — it never reaches `shopping`. The boot
 * harness supplies the guest's empty current-basket boot response so the LIVE
 * machine settles; every domain payload asserted below stays a real captured
 * fixture. This is the claimed-basket/account orchestration FE-2992 owns (it
 * supersedes the FE-2937 generator design for what this journey needs — the
 * generator, once built, would capture this 200 boot response directly).
 *
 * ## What Breaks If These Fail
 * A visitor cannot be booted with a guest session (every API call 401s); the
 * basket machine never settles so no basket can be shopped; the storefront
 * catalogue never loads a buyable product; the basket total or the placed order
 * silently drifts off the brand currency; or Stripe stops being offered — any of
 * which strands a guest mid-purchase with no account to fall back on.
 */

import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { journey, SLUG } from "./journey";
import { server } from "./setup";
import {
  bootGuestBasket,
  resetJourneySession,
  whenCatalogueLoaded
} from "../../../support/basket-boot";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The brand currency this journey was recorded in (from get-brand-settings). */
const BRAND_CURRENCY = "USD";

// -----------------------------------------------------------------------------

describe(`journey: ${SLUG}`, () => {
  beforeEach(() => {
    resetJourneySession();
  });

  afterEach(() => {
    server?.events.removeAllListeners("request:start");
  });

  // --- LIVE composable drive --------------------------------------------------

  it("J-I1: a storefront boot mints a guest session, not an authenticated one", async () => {
    const { session } = await bootGuestBasket({ server });
    const token = session.useContext().session;

    expect(token.value?.actor_type).toBe("guest");
    expect(session.useMeta().isAuthenticated.value).toBe(false);
  });

  it("J-I2: useBasket settles to shopping for the guest empty-basket boot", async () => {
    const { basket } = await bootGuestBasket({ server });

    // The LIVE machine reached `shopping` (not `error`/`unavailable`) — the boot
    // the recorded 401 alone cannot produce.
    expect(basket.state.value.matches("shopping")).toBe(true);
    expect(basket.meta.value.isUnavailable).toBe(false);
    expect(basket.errors.value).toBeFalsy();

    // A guest empty basket: no server order id, no products, no total yet.
    expect(basket.basketId.value).toBeFalsy();
    expect(basket.count.value).toBe(0);
    expect(basket.products.value).toHaveLength(0);
  });

  it("J-I3: useProductCatalogue loads a buyable one-off product through the boot", async () => {
    const { catalogue } = await bootGuestBasket({ server });
    await whenCatalogueLoaded(catalogue);

    const products = catalogue.data.value ?? [];
    expect(products.length).toBeGreaterThan(0);

    // The catalogue was parsed by the live `parseProduct` mapper (Product shape:
    // productDetails + pricing terms), not read off the recorded body.
    const product = products[0];
    expect(product.productDetails?.name).toBeTruthy();
    // A buyable product carries at least one live-parsed pricing term.
    expect(product.pricing.length).toBeGreaterThan(0);
  });

  it("J-I4: useBasketCurrency threads the brand currency into the live basket", async () => {
    const { currency } = await bootGuestBasket({ server });

    // Driven through the currency child actor spawned by the basket machine —
    // not read off a recorded body.
    expect(currency.currencyCode.value).toBe(BRAND_CURRENCY);
    expect(currency.meta.value.isComplete).toBe(true);
  });

  it("J-I5: add-to-basket recalculates the totals on the live machine", async () => {
    const { basket, catalogue, addProduct } = await bootGuestBasket({ server });
    await whenCatalogueLoaded(catalogue);

    // Empty boot: no total yet.
    expect(basket.count.value).toBe(0);
    expect(basket.summary.value?.total).toBeFalsy();

    // Add the catalogue's buyable product through the real service seam
    // (POST /orders → the machine refreshes off the created basket).
    const productId = catalogue.data.value![0].id;
    expect(productId).toBeTruthy();
    await addProduct(productId!);

    // The LIVE machine now holds the created order and a recalculated,
    // brand-currency total — derived by the machine from the replayed
    // cart/order bodies, not asserted as a hardcoded amount.
    expect(basket.basketId.value).toBeTruthy();
    expect(basket.count.value).toBeGreaterThan(0);
    expect(basket.products.value ?? []).not.toHaveLength(0);

    const total = basket.summary.value?.total;
    expect(total).toBeTruthy();
    expect(String(total)).toContain("$");
    expect(basket.summary.value?.subtotal).toBeTruthy();
  });

  // --- recorded-traffic invariant (checkout tail, beyond the live-basket scope)
  //
  // The gateway offer + payment capture are the checkout tail; driving them live
  // needs the payment-details / payment machines, out of FE-2992's basket scope.
  // They stay pinned as recorded-traffic invariants so a corrupted or bled-in
  // fixture set still fails here.

  it("J-I6: recorded-traffic invariant — Stripe is offered and the placement is a real capture", () => {
    // The gateways endpoint returns `data` as a numeric-keyed map of gateways.
    const gateways = Object.values(journey().gateways);

    expect(gateways.length).toBeGreaterThan(0);
    const providers = gateways.map(
      gateway => gateway.gateway.gateway_provider.name
    );
    const hasStripe = providers.some(name => /stripe/i.test(name));
    expect(hasStripe, `providers offered: ${providers.join(", ")}`).toBe(true);

    // The placement call is a real 200 capture, not a fabricated success: the
    // recorded envelope resolved ok and the gateway transaction settled OK.
    const payment = getFixtureBody<{
      status: string;
      data: { transaction_status: string };
    }>("post-payments", { recordingsDir });
    expect(payment.status).toBe("ok");
    expect(payment.data.transaction_status).toBe("OK");
  });
});
