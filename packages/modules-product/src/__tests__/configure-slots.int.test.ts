// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The product page's layout gets the organism's develop slots
 *
 * ## Job To Be Done
 * On the product route, the page's self-closing layout for the brand's template
 * gets `UpmProductConfigure`'s own content in every slot develop gives it. The
 * image slot of a product recorded with no image reaches the layout empty, so
 * the layout draws no image frame, as develop's layouts judge an empty slot.
 * The page hiding product-details removes that slot, and a slot the page writes
 * replaces only that slot's content.
 *
 * ## What Breaks If These Fail
 * A customer sees an empty image frame beside a domain, a hidden header still
 * takes its place, or a page override pushes out the content around it.
 */

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { Config, Pricing, PRODUCT_TEMPLATE, ProductHero } from "../index";
import {
  bootAt,
  framesOf,
  layoutOf,
  readableText,
  seedBasket,
  seedGuestSession,
  slotsOf
} from "./mount-configure";
import {
  installBootRoutes,
  recordedFieldLabels,
  recordedProductId,
  recordedProductName
} from "./recorded-pool";
import { values } from "lodash-es";
import type { ConfigureWrapper } from "./mount-configure";

// -----------------------------------------------------------------------------

const productId = recordedProductId as string;
const BOOT_TIMEOUT = 60000;

const showsProduct = (wrapper: ConfigureWrapper) =>
  readableText(wrapper).includes(recordedProductName as string);

const drawsFields = (wrapper: ConfigureWrapper) =>
  recordedFieldLabels.some(label => readableText(wrapper).includes(label));

const inFrame = (wrapper: ConfigureWrapper, name: string) =>
  wrapper.find(`[data-frame="${name}"]`);

const PRODUCT_LAYOUTS = values(PRODUCT_TEMPLATE);

// -----------------------------------------------------------------------------

describe("the product page's layout, for the product recorded with no image", () => {
  beforeAll(async () => {
    installBootRoutes();
    await seedGuestSession();
    await seedBasket();

    await bootAt(productId, showsProduct);
  }, BOOT_TIMEOUT);

  beforeEach(() => {
    installBootRoutes();
  });

  it(
    "hands the layout an empty image slot, so the layout draws no image frame",
    async () => {
      const { wrapper } = await bootAt(productId, showsProduct);

      expect(PRODUCT_LAYOUTS).toContain(layoutOf(wrapper));
      expect(readableText(wrapper)).toContain(recordedProductName);
      expect(slotsOf(wrapper)).toContain("image");
      expect(framesOf(wrapper)).not.toContain("image");
    },
    BOOT_TIMEOUT
  );

  it(
    "draws the product details and the configuration, each in its own frame",
    async () => {
      const { wrapper } = await bootAt(productId, showsProduct);

      expect(
        inFrame(wrapper, "product-details").findComponent(ProductHero).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "configuration").findComponent(Config).exists()
      ).toBe(true);
    },
    BOOT_TIMEOUT
  );

  it(
    "draws no product-details frame when the page hides it",
    async () => {
      const { wrapper } = await bootAt(productId, drawsFields, {
        props: { hideSlots: ["product-details"] }
      });

      expect(PRODUCT_LAYOUTS).toContain(layoutOf(wrapper));
      expect(
        drawsFields(wrapper),
        "the recorded provision fields never reached the form"
      ).toBe(true);
      expect(slotsOf(wrapper)).not.toContain("product-details");
      expect(framesOf(wrapper)).not.toContain("product-details");
      expect(wrapper.findComponent(ProductHero).exists()).toBe(false);
      expect(framesOf(wrapper)).toContain("configuration");
    },
    BOOT_TIMEOUT
  );

  it(
    "puts the page's own slot in place of its content, and keeps every other slot's",
    async () => {
      const { wrapper } = await bootAt(productId, showsProduct, {
        overrides: {
          pricing: () => h("p", { "data-test-key": "page-pricing" }, "Page")
        }
      });

      expect(
        inFrame(wrapper, "pricing")
          .find('[data-test-key="page-pricing"]')
          .exists()
      ).toBe(true);
      expect(inFrame(wrapper, "pricing").findComponent(Pricing).exists()).toBe(
        false
      );
      expect(
        inFrame(wrapper, "product-details").findComponent(ProductHero).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "configuration").findComponent(Config).exists()
      ).toBe(true);
    },
    BOOT_TIMEOUT
  );
});
