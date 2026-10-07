// -----------------------------------------------------------------------------
/**
 * @fileoverview The layout the cart's product page draws for the brand's template
 *
 * ## Job To Be Done
 * Given the raw template the product organism hands its page, the page draws the
 * layout that name carries, and the right-hand two-column layout for no name, an empty
 * name, or a name no product layout carries.
 *
 * ## What Breaks If These Fail
 * A brand with no template, or one written for another page, gets a product
 * page with no layout.
 */

import { describe, expect, it } from "vitest";
import { productTemplate } from "../src/shell/modules/product/shell";
import ProductEnclosed from "../src/shell/modules/product/templates/ProductEnclosed.template.vue";
import ProductFull from "../src/shell/modules/product/templates/ProductFull.template.vue";
import ProductInset from "../src/shell/modules/product/templates/ProductInset.template.vue";
import ProductLTR from "../src/shell/modules/product/templates/ProductLTR.template.vue";
import ProductRTL from "../src/shell/modules/product/templates/ProductRTL.template.vue";
import { PRODUCT_TEMPLATE } from "../src/shell/modules/product/types";
import { values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const LAYOUTS: Record<PRODUCT_TEMPLATE, Component> = {
  [PRODUCT_TEMPLATE.FULL]: ProductFull,
  [PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: ProductLTR,
  [PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: ProductRTL,
  [PRODUCT_TEMPLATE.ENCLOSED]: ProductEnclosed,
  [PRODUCT_TEMPLATE.INSET]: ProductInset
};

// -----------------------------------------------------------------------------

describe("productTemplate", () => {
  it.each(values(PRODUCT_TEMPLATE))(
    "draws the layout the %s template carries",
    template => {
      expect(productTemplate(template)).toBe(LAYOUTS[template]);
    }
  );

  it.each([
    ["no template", undefined],
    ["an empty template", ""]
  ])("draws the right-hand two-column layout for %s", (_case, template) => {
    expect(productTemplate(template)).toBe(ProductRTL);
  });

  it.each([
    ["a template only other pages carry", "split"],
    ["a name no layout carries", "not-a-template"],
    ["a name every object inherits", "constructor"]
  ])("draws the right-hand two-column layout for %s", (_case, template) => {
    expect(productTemplate(template)).toBe(ProductRTL);
  });
});
