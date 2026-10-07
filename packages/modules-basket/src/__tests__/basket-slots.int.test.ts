// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The basket page's layout gets the organism's develop blocks
 *
 * ## Job To Be Done
 * On the basket route, the page's self-closing layout for the template it is
 * handed gets `UpmBasket`'s own content in every slot develop fills: the
 * summary, the products, the pricing, the total, the markdown, the checkout
 * and the custom-price notice. The page hiding the summary removes that slot,
 * a slot the page writes on its layout replaces only that slot's content, and
 * the layout's pricing options turn the pricing's total and checkout off.
 *
 * ## What Breaks If These Fail
 * A guest's basket shows no products or no way to checkout, a hidden summary
 * still takes its place, a page override pushes out the content around it, or
 * an enclosed or right-to-left basket draws its checkout twice.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { UpmBasket } from "../index";
import {
  BOOT_BUDGET,
  inFrame,
  layoutFor,
  mountPage,
  readableText,
  ROUTES,
  seedBasket,
  seedGuestSession,
  slotsOf,
  templateOf,
  unmountPages
} from "./mount-page";
import {
  installBootRoutes,
  recordedBasketId,
  recordedProductNames,
  recordedTemplate
} from "./recorded-pool";
import { every } from "lodash-es";
import type { PageWrapper, SlotOptions } from "./mount-page";
import type { RawSlots } from "vue";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = [
  "summary",
  "products",
  "pricing",
  "total",
  "markdown",
  "checkout",
  "custom-price"
];

const showsProducts = (wrapper: PageWrapper) =>
  every(recordedProductNames, name => readableText(wrapper).includes(name));

const openBasket = (options?: {
  hideSlots?: string[];
  overrides?: RawSlots;
  slotOptions?: SlotOptions;
}) =>
  mountPage({
    organism: UpmBasket,
    props: {
      editRoute: { name: ROUTES.EDIT },
      storefrontRoute: { to: { name: ROUTES.CATALOGUE } },
      hideSlots: options?.hideSlots
    },
    layout: layoutFor(DEVELOP_BLOCKS, options?.slotOptions),
    path: `/order/basket/${recordedBasketId}`,
    until: showsProducts,
    overrides: options?.overrides
  });

// -----------------------------------------------------------------------------

describe("the basket page's layout, for the recorded guest basket", () => {
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
      const wrapper = await openBasket();

      expect(templateOf(wrapper)).toBe(recordedTemplate);
      expect(slotsOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
    },
    BOOT_BUDGET
  );

  it(
    "draws the summary, the recorded products, the total and the checkout, each in its own frame",
    async () => {
      const wrapper = await openBasket();

      expect(inFrame(wrapper, "summary").text()).toContain(
        "action.continue_shopping"
      );
      for (const name of recordedProductNames) {
        expect(inFrame(wrapper, "products").text()).toContain(name);
      }
      expect(inFrame(wrapper, "total").text()).toContain("text.basket_total");
      expect(inFrame(wrapper, "checkout").text()).toContain(
        "action.proceed_to_checkout"
      );
    },
    BOOT_BUDGET
  );

  it(
    "hands no summary when the page hides it",
    async () => {
      const wrapper = await openBasket({ hideSlots: ["summary"] });

      expect(showsProducts(wrapper)).toBe(true);
      expect(slotsOf(wrapper)).not.toContain("summary");
      expect(readableText(wrapper)).not.toContain("action.continue_shopping");
    },
    BOOT_BUDGET
  );

  it(
    "puts the page's own slot in place of its block, and keeps every other block's",
    async () => {
      const wrapper = await openBasket({
        overrides: {
          total: () => h("p", { "data-test-key": "page-total" }, "Page")
        }
      });

      expect(
        inFrame(wrapper, "total").find('[data-test-key="page-total"]').exists()
      ).toBe(true);
      expect(inFrame(wrapper, "total").text()).not.toContain(
        "text.basket_total"
      );
      expect(inFrame(wrapper, "checkout").text()).toContain(
        "action.proceed_to_checkout"
      );
      for (const name of recordedProductNames) {
        expect(inFrame(wrapper, "products").text()).toContain(name);
      }
    },
    BOOT_BUDGET
  );

  it(
    "draws the pricing's total and checkout until the layout turns each off",
    async () => {
      const PRICED_TOTAL = "text.basket_total";
      const CHECKOUT = "action.proceed_to_checkout";

      const pricing = await openBasket();
      expect(inFrame(pricing, "pricing").text()).toContain(PRICED_TOTAL);
      expect(inFrame(pricing, "pricing").text()).toContain(CHECKOUT);
      unmountPages();

      const noCheckout = await openBasket({
        slotOptions: { pricing: { showCheckout: false } }
      });
      expect(inFrame(noCheckout, "pricing").text()).toContain(PRICED_TOTAL);
      expect(inFrame(noCheckout, "pricing").text()).not.toContain(CHECKOUT);
      unmountPages();

      const noTotal = await openBasket({
        slotOptions: { pricing: { showTotal: false } }
      });
      expect(inFrame(noTotal, "pricing").text()).toContain(CHECKOUT);
      expect(inFrame(noTotal, "pricing").text()).not.toContain(PRICED_TOTAL);
    },
    BOOT_BUDGET
  );
});
