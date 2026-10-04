// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The basket product page's layout gets the organism's develop blocks
 *
 * ## Job To Be Done
 * On the basket product route, the page's self-closing layout for the template
 * it is handed gets `UpmBasketProductEdit`'s own content in every slot develop
 * fills: the product details, the image, the configuration, the pricing, the
 * actions, the errors, the total and the terms. The page hiding the product
 * details removes that slot, and a slot the page writes on its layout replaces
 * only that slot's content.
 *
 * ## What Breaks If These Fail
 * A guest editing a basket product loses its form, its errors or its confirm
 * button, a hidden header still takes its place, or a page override pushes out
 * the content around it.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import {
  Config,
  ConfigErrors,
  PricingTotal,
  ProductHero
} from "@upmind-automation/product";
import { BASKET_PRODUCT_TEMPLATE, UpmBasketProductEdit } from "../index";
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
import {
  installBootRoutes,
  recordedBasketId,
  recordedBasketProductId
} from "./recorded-pool";
import { values } from "lodash-es";
import type { PageWrapper } from "./mount-page";
import type { RawSlots } from "vue";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = [
  "product-details",
  "image",
  "configuration",
  "pricing",
  "actions",
  "errors",
  "total",
  "terms"
];

const EDIT_LAYOUTS = layoutsFor(BASKET_PRODUCT_TEMPLATE, [
  ...DEVELOP_BLOCKS,
  "markdown"
]);

const drawsConfig = (wrapper: PageWrapper) =>
  wrapper.findComponent(Config).exists();

const openBasketProduct = (options?: {
  hideSlots?: string[];
  overrides?: RawSlots;
}) =>
  mountPage({
    organism: UpmBasketProductEdit,
    props: {
      storefrontRoute: { to: { name: ROUTES.CATALOGUE } },
      hideSlots: options?.hideSlots
    },
    layouts: EDIT_LAYOUTS,
    path: `/order/basket/${recordedBasketId}/edit/${recordedBasketProductId}`,
    until: drawsConfig,
    overrides: options?.overrides
  });

// -----------------------------------------------------------------------------

describe("the basket product page's layout, for the recorded basket product", () => {
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
      const wrapper = await openBasketProduct();

      expect(values(BASKET_PRODUCT_TEMPLATE)).toContain(layoutOf(wrapper));
      expect(slotsOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
    },
    BOOT_BUDGET
  );

  it(
    "draws the hero, the configuration, the errors, the confirm and the total, each in its own frame",
    async () => {
      const wrapper = await openBasketProduct();

      expect(
        inFrame(wrapper, "product-details").findComponent(ProductHero).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "configuration").findComponent(Config).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "errors").findComponent(ConfigErrors).exists()
      ).toBe(true);
      expect(inFrame(wrapper, "actions").text()).toContain("action.confirm");
      expect(
        inFrame(wrapper, "total").findComponent(PricingTotal).exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );

  it(
    "hands no product details when the page hides them",
    async () => {
      const wrapper = await openBasketProduct({
        hideSlots: ["product-details"]
      });

      expect(drawsConfig(wrapper)).toBe(true);
      expect(slotsOf(wrapper)).not.toContain("product-details");
      expect(wrapper.findComponent(ProductHero).exists()).toBe(false);
    },
    BOOT_BUDGET
  );

  it(
    "puts the page's own slot in place of its block, and keeps every other block's",
    async () => {
      const wrapper = await openBasketProduct({
        overrides: {
          actions: () => h("p", { "data-test-key": "page-actions" }, "Page")
        }
      });

      expect(
        inFrame(wrapper, "actions")
          .find('[data-test-key="page-actions"]')
          .exists()
      ).toBe(true);
      expect(inFrame(wrapper, "actions").text()).not.toContain(
        "action.confirm"
      );
      expect(
        inFrame(wrapper, "configuration").findComponent(Config).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "product-details").findComponent(ProductHero).exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );
});
