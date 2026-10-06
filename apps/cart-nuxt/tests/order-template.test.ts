// -----------------------------------------------------------------------------
/**
 * @fileoverview The layout the cart-nuxt's order page draws for the brand's template
 *
 * ## Job To Be Done
 * Given the raw template the order organism hands its page, the page draws the
 * layout that name carries, and the right-hand two-column layout for no name, an empty
 * name, or a name no order layout carries.
 *
 * ## What Breaks If These Fail
 * A brand with no template, or one written for another page, gets a order
 * page with no layout.
 */

import { describe, expect, it } from "vitest";
import { orderTemplate } from "../app/shell/modules/order/shell";
import OrderEnclosed from "../app/shell/modules/order/templates/OrderEnclosed.template.vue";
import OrderFull from "../app/shell/modules/order/templates/OrderFull.template.vue";
import OrderInset from "../app/shell/modules/order/templates/OrderInset.template.vue";
import OrderLTR from "../app/shell/modules/order/templates/OrderLTR.template.vue";
import OrderRTL from "../app/shell/modules/order/templates/OrderRTL.template.vue";
import { ORDER_TEMPLATE } from "../app/shell/modules/order/types";
import { values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const LAYOUTS: Record<ORDER_TEMPLATE, Component> = {
  [ORDER_TEMPLATE.FULL]: OrderFull,
  [ORDER_TEMPLATE.TWO_COLUMN_LTR]: OrderLTR,
  [ORDER_TEMPLATE.TWO_COLUMN_RTL]: OrderRTL,
  [ORDER_TEMPLATE.ENCLOSED]: OrderEnclosed,
  [ORDER_TEMPLATE.INSET]: OrderInset
};

// -----------------------------------------------------------------------------

describe("orderTemplate", () => {
  it.each(values(ORDER_TEMPLATE))(
    "draws the layout the %s template carries",
    template => {
      expect(orderTemplate(template)).toBe(LAYOUTS[template]);
    }
  );

  it.each([
    ["no template", undefined],
    ["an empty template", ""]
  ])("draws the right-hand two-column layout for %s", (_case, template) => {
    expect(orderTemplate(template)).toBe(OrderRTL);
  });

  it.each([
    ["a template only other pages carry", "split"],
    ["a name no layout carries", "not-a-template"],
    ["a name every object inherits", "constructor"]
  ])("draws the right-hand two-column layout for %s", (_case, template) => {
    expect(orderTemplate(template)).toBe(OrderRTL);
  });
});
