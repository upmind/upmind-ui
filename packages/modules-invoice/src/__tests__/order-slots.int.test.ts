// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The order page's layout gets the organism's develop blocks
 *
 * ## Job To Be Done
 * On the order route, the page's self-closing layout for the arrangement it is
 * handed gets `UpmOrder`'s own content in every slot develop fills for a
 * signed-in client's order: the summary, the payment details, the order details
 * and the products. A slot the page writes on its layout replaces only that
 * slot's content.
 *
 * ## What Breaks If These Fail
 * A client's order page loses its payment form or its products, or a page
 * override pushes out the content around it.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { Hero } from "@upmind-automation/foundation";
import { UpmPaymentDetails } from "@upmind-automation/payment";
import { ORDER_TEMPLATE, UpmOrderProducts } from "../index";
import {
  BOOT_BUDGET,
  bootRecordedClient,
  framesOf,
  layoutOf,
  mountOrder,
  signOutRecordedClient,
  slotsOf
} from "./order-harness";
import { unpaidOrder } from "./recorded-orders";
import { values } from "lodash-es";
import type { mount } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = [
  "order-summary",
  "order-payment-details",
  "order-details",
  "order-products"
];

const inFrame = (wrapper: ReturnType<typeof mount>, name: string) =>
  wrapper.find(`[data-frame="${name}"]`);

const openUnpaidOrder = (
  overrides?: Parameters<typeof mountOrder>[0]["overrides"]
) => mountOrder({ route: `/orders/${unpaidOrder.id}`, overrides });

// -----------------------------------------------------------------------------

describe("the order page's layout, for the recorded unpaid order", () => {
  beforeEach(bootRecordedClient);

  afterEach(signOutRecordedClient);

  it(
    "hands the layout develop's blocks, and no guest registration for a signed-in client",
    async () => {
      const wrapper = await openUnpaidOrder();

      expect(values(ORDER_TEMPLATE)).toContain(layoutOf(wrapper));
      expect(slotsOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
      expect(slotsOf(wrapper)).not.toContain("guest-registration");
    },
    BOOT_BUDGET
  );

  it(
    "draws each block's develop content in its own frame",
    async () => {
      const wrapper = await openUnpaidOrder();

      expect(framesOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
      expect(
        inFrame(wrapper, "order-summary").findComponent(Hero).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "order-payment-details")
          .findComponent(UpmPaymentDetails)
          .exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "order-details").find("#order-details").exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "order-products")
          .findComponent(UpmOrderProducts)
          .exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );

  it(
    "puts the page's own slot in place of its block, and keeps every other block's",
    async () => {
      const wrapper = await openUnpaidOrder({
        "order-products": () =>
          h("p", { "data-test-key": "page-products" }, "Page")
      });

      expect(
        inFrame(wrapper, "order-products")
          .find('[data-test-key="page-products"]')
          .exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "order-products")
          .findComponent(UpmOrderProducts)
          .exists()
      ).toBe(false);
      expect(
        inFrame(wrapper, "order-summary").findComponent(Hero).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "order-payment-details")
          .findComponent(UpmPaymentDetails)
          .exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );
});
