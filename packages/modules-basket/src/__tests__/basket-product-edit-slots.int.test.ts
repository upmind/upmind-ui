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
 * details removes that slot, a slot the page writes on its layout replaces only
 * that slot's content, and the layout's options turn the hero and the pricing.
 *
 * ## What Breaks If These Fail
 * A guest editing a basket product loses its form, its errors or its confirm
 * button, a hidden header still takes its place, a page override pushes out the
 * content around it, or a template's hero or pricing takes another's shape.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import {
  Config,
  ConfigErrors,
  PRODUCT_HERO_DIRECTION,
  PricingTotal,
  ProductHero
} from "@upmind-automation/product";
import { UpmBasketProductEdit } from "../index";
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
  recordedBasketId,
  recordedBasketProductId,
  recordedTemplate
} from "./recorded-pool";
import { concat } from "lodash-es";
import type { PageWrapper, SlotOptions } from "./mount-page";
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

const LAYOUT_BLOCKS = concat(DEVELOP_BLOCKS, "markdown");

const PRICED_TOTAL = "text.total";
const CONFIRM = "action.confirm";

const drawsConfig = (wrapper: PageWrapper) =>
  wrapper.findComponent(Config).exists();

const openBasketProduct = (options?: {
  hideSlots?: string[];
  overrides?: RawSlots;
  slotOptions?: SlotOptions;
}) =>
  mountPage({
    organism: UpmBasketProductEdit,
    props: {
      storefrontRoute: { to: { name: ROUTES.CATALOGUE } },
      hideSlots: options?.hideSlots
    },
    layout: layoutFor(LAYOUT_BLOCKS, options?.slotOptions),
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
    "hands the layout the brand's own template and every block develop fills",
    async () => {
      const wrapper = await openBasketProduct();

      expect(templateOf(wrapper)).toBe(recordedTemplate);
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

  it(
    "draws a wide hero with its image until the layout turns it",
    async () => {
      const wide = await openBasketProduct();
      expect(
        inFrame(wide, "product-details").findComponent(ProductHero).props()
      ).toMatchObject({
        direction: PRODUCT_HERO_DIRECTION.HORIZONTAL,
        image: true
      });
      unmountPages();

      const tall = await openBasketProduct({
        slotOptions: {
          "product-details": {
            direction: PRODUCT_HERO_DIRECTION.VERTICAL,
            heroImage: false
          }
        }
      });
      expect(
        inFrame(tall, "product-details").findComponent(ProductHero).props()
      ).toMatchObject({
        direction: PRODUCT_HERO_DIRECTION.VERTICAL,
        image: false
      });
    },
    BOOT_BUDGET
  );

  it(
    "keeps the total and the confirm out of the pricing until the layout asks for each",
    async () => {
      const bare = await openBasketProduct();
      expect(inFrame(bare, "pricing").text()).not.toContain(PRICED_TOTAL);
      expect(inFrame(bare, "pricing").text()).not.toContain(CONFIRM);
      unmountPages();

      const totalled = await openBasketProduct({
        slotOptions: { pricing: { showTotal: true } }
      });
      expect(inFrame(totalled, "pricing").text()).toContain(PRICED_TOTAL);
      expect(inFrame(totalled, "pricing").text()).not.toContain(CONFIRM);
      unmountPages();

      const actionable = await openBasketProduct({
        slotOptions: { pricing: { showActions: true } }
      });
      expect(inFrame(actionable, "pricing").text()).toContain(CONFIRM);
      expect(inFrame(actionable, "pricing").text()).not.toContain(PRICED_TOTAL);
    },
    BOOT_BUDGET
  );
});
