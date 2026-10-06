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
 * the pricing. The page hiding the summary removes that slot, a slot the page
 * writes on its layout replaces only that slot's content, and the layout's back
 * option draws the compact back link.
 *
 * ## What Breaks If These Fail
 * A guest at checkout sees no sections to complete or no order total, a hidden
 * summary still takes its place, a page override pushes out the content around
 * it, or the inset checkout draws the full back link.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { UpmCheckout, UpmCheckoutPricing } from "../index";
import {
  BOOT_BUDGET,
  inFrame,
  layoutFor,
  mountPage,
  ROUTES,
  seedBasket,
  seedGuestSession,
  slotsOf,
  templateOf,
  unmountPages
} from "./mount-page";
import {
  installBootRoutes,
  recordedProductNames,
  recordedTemplate
} from "./recorded-pool";
import { concat, every } from "lodash-es";
import type { PageWrapper, SlotOptions } from "./mount-page";
import type { RawSlots } from "vue";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = ["back", "summary", "content", "pricing"];

const LAYOUT_BLOCKS = concat(DEVELOP_BLOCKS, "markdown", "errors");

const BACK_ARROW = 'svg[aria-label="arrow-narrow-left icon"]';

const pricesProducts = (wrapper: PageWrapper) =>
  every(recordedProductNames, name =>
    inFrame(wrapper, "pricing").text().includes(name)
  );

const openCheckout = (options?: {
  hideSlots?: string[];
  overrides?: RawSlots;
  slotOptions?: SlotOptions;
}) =>
  mountPage({
    organism: UpmCheckout,
    props: {
      editRoute: { name: ROUTES.EDIT },
      billingRoute: { name: ROUTES.BILLING },
      hideSlots: options?.hideSlots
    },
    layout: layoutFor(LAYOUT_BLOCKS, options?.slotOptions),
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
    "hands the layout the brand's own template and every block develop fills",
    async () => {
      const wrapper = await openCheckout();

      expect(templateOf(wrapper)).toBe(recordedTemplate);
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

  it(
    "draws the full back link until the layout asks for the compact one",
    async () => {
      const full = await openCheckout();
      expect(inFrame(full, "back").text()).toContain("action.back_to_basket");
      expect(inFrame(full, "back").find(BACK_ARROW).exists()).toBe(false);
      unmountPages();

      const compact = await openCheckout({
        slotOptions: { back: { compact: true } }
      });
      expect(inFrame(compact, "back").text()).not.toContain(
        "action.back_to_basket"
      );
      expect(inFrame(compact, "back").text()).toContain("action.back");
      expect(inFrame(compact, "back").find(BACK_ARROW).exists()).toBe(true);
    },
    BOOT_BUDGET
  );
});
