/**
 * @fileoverview useProductSetup.getNextInvalid — actor-exclusion contract (unit)
 *
 * ## PROOF (FE-2796) — regression guard
 * The actor-exclusion proof below was originally committed as `it.fails` while
 * the headless source still carried the bug. The one-line fix has since landed
 * (commit fce6dc1d1), so the test now passes on its own and stands as a plain
 * regression guard against the bug returning.
 *
 * ## The contract under test (verbatim JSDoc, useProductSetup.ts)
 *   "Get the next invalid product relative to a given basket product actor.
 *    Excludes the actor's own product from results."
 *
 * ## The bug (fixed in fce6dc1d1)
 * `getNextInvalid` read the actor's base product id from
 * `actor.state.context.model.productId`, then rejects basket products with
 *   reject(products.value, ["productId", pid])
 * — a TOP-LEVEL `productId` that a `BasketProduct` never exposes. It lives at
 * `.configuration.productId`: `BasketProduct extends Product`, and
 * `Product.configuration: ProductProps`, where `ProductProps extends
 * ProductModel { productId: string }`. The matchesProperty shorthand therefore
 * never matches, the reject is inert, and the function always returns
 * `first(products.value)` — INCLUDING the actor's own product.
 *
 * ## Why a unit test (not the FE-2796 integration file)
 * The int suite is fixtures-only MSW replay; its recorded `orders/current`
 * keeps both domains invalid, so it cannot exercise the actor-exclusion in
 * isolation — that todo is BLOCKED there for exactly this reason
 * ("getNextInvalid ... excluding the actor's own product"). This unit test
 * mocks the basket boundary to seat two invalid products with DISTINCT
 * `configuration.productId`s (260/261, bpids 263/265 — mirroring the capture)
 * and asserts the exclusion directly.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type Ref } from "vue";
import { useProductSetup } from "../useProductSetup";
import type { BasketProduct } from "../../basket-product/basket-product.types";

// -----------------------------------------------------------------------------
// Boundary mocks (ADR-021 §unit tests mock their own boundaries). getNextInvalid
// depends only on `products.value` (derived from the basket products + the
// productSetup ui mode) and the actor argument, so we stub the sibling module
// seams and keep the REAL `basketProductRequiresSetup` filter + REAL lodash.

const h = vi.hoisted(() => ({
  // A real Vue ref is assigned per test in beforeEach (below) so the composable's
  // `watch(basketProducts, ...)` gets a valid source; the mock hands it back at
  // useBasket() call time.
  basketProducts: null as Ref<BasketProduct[]> | null
}));

vi.mock("../../basket", () => ({
  useBasket: () => ({
    products: h.basketProducts,
    meta: { value: {} },
    isRefreshed: vi.fn(async () => true),
    basketId: { value: "basket-1" }
  })
}));

vi.mock("../../basket-product", () => ({
  useBasketProducts: () => ({ configure: vi.fn() }),
  basketProductServices: { updateMany: vi.fn() }
}));

vi.mock("../../config", () => ({
  useConfig: () => ({ ui: { productSetup: { value: "required" } } })
}));

vi.mock("../../domain", () => ({
  getDomainBasketProducts: () => []
}));

vi.mock("../../product", () => ({
  useInvalidProductConfigSchema: vi.fn(),
  useInvalidProductConfigUischema: vi.fn()
}));

vi.mock("../../utils", () => ({
  compactDeep: (value: unknown) => value,
  contextValue: vi.fn(() => undefined),
  isDeepEmpty: () => false,
  useModelParser: vi.fn(() => ({}))
}));

// -----------------------------------------------------------------------------

// Two invalid basket products with DISTINCT base product ids. The productId a
// BasketProduct carries lives under `.configuration.productId`; there is no
// top-level `productId`. Both carry `errors`, so `basketProductRequiresSetup`
// keeps them in `products.value` regardless of the setup mode.
const productA = {
  id: "263",
  configuration: { productId: "260" },
  errors: [{ instancePath: "/provisionFields/sld" }]
} as unknown as BasketProduct;

const productB = {
  id: "265",
  configuration: { productId: "261" },
  errors: [{ instancePath: "/provisionFields/sld" }]
} as unknown as BasketProduct;

// An xstate actor for product A: getNextInvalid reads its base product id from
// `state.context.model.productId` (260) — the id it must exclude from results.
const actorForA = {
  state: { context: { model: { productId: "260" } } }
} as unknown as BasketProduct;

describe("useProductSetup.getNextInvalid — actor exclusion (FE-2796)", () => {
  beforeEach(() => {
    h.basketProducts = ref([productA, productB]);
    useProductSetup().reset();
  });

  it("excludes the actor's own product and returns the NEXT invalid one", () => {
    const setup = useProductSetup();

    const next = setup.getNextInvalid(actorForA);

    // A's configuration.productId (260) IS the actor's own product, so it is
    // excluded and B (bpid 265) is returned (FE-2796 fix, commit fce6dc1d1).
    expect(next?.id).toBe("265");
  });

  it("no-actor consumers (ProductSetup.vue) still get first(products) — the fix must not change this path", () => {
    const setup = useProductSetup();

    // ProductSetup.vue calls getNextRequiringSetup()/getNextInvalid() with NO
    // actor; pid defaults to {}, which matches no product either way, so the
    // first product requiring setup is returned both before and after the fix.
    expect(setup.getNextInvalid()?.id).toBe("263");
  });
});
