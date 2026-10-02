// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The product page's layout gets the image slot for a product with an image
 *
 * ## Job To Be Done
 * On the product route of a product recorded with an image, `UpmProductConfigure`
 * fills the page's self-closing layout's image slot with develop's
 * `ProductImage`, so the layout draws the image frame.
 *
 * ## What Breaks If These Fail
 * A product photo never reaches the page, because the image slot reaches the
 * layout empty whatever the product holds.
 */

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ProductImage } from "../index";
import {
  bootAt,
  framesOf,
  readableText,
  seedBasket,
  seedGuestSession
} from "./mount-configure";
import {
  installRelatedHostRoutes,
  relatedHostProductId,
  relatedHostProductName
} from "./recorded-pool";
import type { ConfigureWrapper } from "./mount-configure";

// -----------------------------------------------------------------------------

const productId = relatedHostProductId as string;
const BOOT_TIMEOUT = 60000;

const showsProduct = (wrapper: ConfigureWrapper) =>
  readableText(wrapper).includes(relatedHostProductName as string);

// -----------------------------------------------------------------------------

describe("the product page's layout, for a product recorded with an image", () => {
  beforeAll(async () => {
    installRelatedHostRoutes();
    await seedGuestSession();
    await seedBasket();

    await bootAt(productId, showsProduct);
  }, BOOT_TIMEOUT);

  beforeEach(() => {
    installRelatedHostRoutes();
  });

  it(
    "draws the image frame with the product image inside it",
    async () => {
      const { wrapper } = await bootAt(productId, showsProduct);

      expect(
        readableText(wrapper),
        "the recorded product never reached the screen"
      ).toContain(relatedHostProductName);
      expect(framesOf(wrapper)).toContain("image");
      expect(
        wrapper
          .find('[data-frame="image"]')
          .findComponent(ProductImage)
          .exists()
      ).toBe(true);
    },
    BOOT_TIMEOUT
  );
});
