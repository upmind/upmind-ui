// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The checkout page's layout gets the organism's develop blocks
 *
 * ## Job To Be Done
 * On the checkout route, the page's self-closing layout for the template it is
 * handed gets `UpmCheckout`'s own content in every slot develop fills for the
 * recorded guest basket: the back link, the summary, the checkout sections and
 * the pricing. The page hiding the summary removes that slot, and a slot the
 * page writes on its layout replaces only that slot's content.
 *
 * ## What Breaks If These Fail
 * A guest at checkout sees no sections to complete or no order total, a hidden
 * summary still takes its place, or a page override pushes out the content
 * around it.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { CHECKOUT_TEMPLATE, UpmCheckout, UpmCheckoutPricing } from "../index";
import {
  BOOT_BUDGET,
  inFrame,
  layoutOf,
  layoutsFor,
  mountPage,
  ROUTES,
  seedBasket,
  seedGuestSession,
  slotsOf,
  unmountPages
} from "./mount-page";
import { installBootRoutes, recordedProductNames } from "./recorded-pool";
import { every, values } from "lodash-es";
import type { PageWrapper } from "./mount-page";
import type { RawSlots } from "vue";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = ["back", "summary", "content", "pricing"];

const CHECKOUT_LAYOUTS = layoutsFor(CHECKOUT_TEMPLATE, [
  ...DEVELOP_BLOCKS,
  "markdown",
  "errors"
]);

const pricesProducts = (wrapper: PageWrapper) =>
  every(recordedProductNames, name =>
    inFrame(wrapper, "pricing").text().includes(name)
  );

const openCheckout = (options?: {
  hideSlots?: string[];
  overrides?: RawSlots;
}) =>
  mountPage({
    organism: UpmCheckout,
    props: {
      editRoute: { name: ROUTES.EDIT },
      billingRoute: { name: ROUTES.BILLING },
      hideSlots: options?.hideSlots
    },
    layouts: CHECKOUT_LAYOUTS,
    path: "/order/checkout",
    until: wrapper =>
      wrapper.findComponent(UpmCheckoutPricing).exists() &&
      inFrame(wrapper, "content").exists(),
    overrides: options?.overrides
  });

// -----------------------------------------------------------------------------

describe("the checkout page's layout, for the recorded guest basket", () => {
  beforeAll(async () => {
    installBootRoutes();
    await seedGuestSession();
    await seedBasket();
  }, BOOT_BUDGET);

  beforeEach(() => {
    installBootRoutes();
  });

  afterEach(unmountPages);

  it(
    "hands the layout every block develop fills",
    async () => {
      const wrapper = await openCheckout();

      expect(values(CHECKOUT_TEMPLATE)).toContain(layoutOf(wrapper));
      expect(slotsOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
    },
    BOOT_BUDGET
  );

  it(
    "draws the back link, the sections and the priced products, each in its own frame",
    async () => {
      const wrapper = await openCheckout();

      expect(inFrame(wrapper, "back").text()).toContain(
        "action.back_to_basket"
      );
      expect(inFrame(wrapper, "content").text()).toContain(
        "cart.basket_products"
      );
      expect(
        inFrame(wrapper, "pricing").findComponent(UpmCheckoutPricing).exists()
      ).toBe(true);
      expect(pricesProducts(wrapper)).toBe(true);
    },
    BOOT_BUDGET
  );

  it(
    "hands no summary when the page hides it",
    async () => {
      const wrapper = await openCheckout({ hideSlots: ["summary"] });

      expect(inFrame(wrapper, "content").exists()).toBe(true);
      expect(slotsOf(wrapper)).not.toContain("summary");
    },
    BOOT_BUDGET
  );

  it(
    "puts the page's own slot in place of its block, and keeps every other block's",
    async () => {
      const wrapper = await openCheckout({
        overrides: {
          back: () => h("p", { "data-test-key": "page-back" }, "Page")
        }
      });

      expect(
        inFrame(wrapper, "back").find('[data-test-key="page-back"]').exists()
      ).toBe(true);
      expect(inFrame(wrapper, "back").text()).not.toContain(
        "action.back_to_basket"
      );
      expect(
        inFrame(wrapper, "pricing").findComponent(UpmCheckoutPricing).exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );
});
