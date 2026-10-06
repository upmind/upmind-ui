// -----------------------------------------------------------------------------
/**
 * @fileoverview The layouts the Nuxt cart's basket-family pages draw for the brand's template
 *
 * ## Job To Be Done
 * Given the raw template a basket, basket product, billing, checkout or product
 * setup organism hands its page, the page draws the layout that name carries,
 * and the family's own fallback for no name, an empty name, or a name none of
 * its layouts carries.
 *
 * ## What Breaks If These Fail
 * A brand with no template, a stale one, or one written for another page gets a
 * basket page with no layout, or another family's default arrangement.
 */

import { describe, expect, it } from "vitest";
import { basketTemplate } from "../app/shell/modules/basket/shell";
import BasketEnclosed from "../app/shell/modules/basket/templates/BasketEnclosed.template.vue";
import BasketFull from "../app/shell/modules/basket/templates/BasketFull.template.vue";
import BasketInset from "../app/shell/modules/basket/templates/BasketInset.template.vue";
import BasketLTR from "../app/shell/modules/basket/templates/BasketLTR.template.vue";
import BasketRTL from "../app/shell/modules/basket/templates/BasketRTL.template.vue";
import { BASKET_TEMPLATE } from "../app/shell/modules/basket/types";
import { basketProductTemplate } from "../app/shell/modules/basket-product/shell";
import BasketProductEnclosed from "../app/shell/modules/basket-product/templates/BasketProductEnclosed.template.vue";
import BasketProductFull from "../app/shell/modules/basket-product/templates/BasketProductFull.template.vue";
import BasketProductInset from "../app/shell/modules/basket-product/templates/BasketProductInset.template.vue";
import BasketProductLTR from "../app/shell/modules/basket-product/templates/BasketProductLTR.template.vue";
import BasketProductRTL from "../app/shell/modules/basket-product/templates/BasketProductRTL.template.vue";
import { BASKET_PRODUCT_TEMPLATE } from "../app/shell/modules/basket-product/types";
import { billingTemplate } from "../app/shell/modules/billing/shell";
import BillingEnclosed from "../app/shell/modules/billing/templates/BillingEnclosed.template.vue";
import BillingFull from "../app/shell/modules/billing/templates/BillingFull.template.vue";
import BillingInset from "../app/shell/modules/billing/templates/BillingInset.template.vue";
import BillingLTR from "../app/shell/modules/billing/templates/BillingLTR.template.vue";
import BillingRTL from "../app/shell/modules/billing/templates/BillingRTL.template.vue";
import { BILLING_TEMPLATE } from "../app/shell/modules/billing/types";
import { checkoutTemplate } from "../app/shell/modules/checkout/shell";
import CheckoutEnclosed from "../app/shell/modules/checkout/templates/CheckoutEnclosed.template.vue";
import CheckoutFull from "../app/shell/modules/checkout/templates/CheckoutFull.template.vue";
import CheckoutInset from "../app/shell/modules/checkout/templates/CheckoutInset.template.vue";
import CheckoutLTR from "../app/shell/modules/checkout/templates/CheckoutLTR.template.vue";
import CheckoutRTL from "../app/shell/modules/checkout/templates/CheckoutRTL.template.vue";
import { CHECKOUT_TEMPLATE } from "../app/shell/modules/checkout/types";
import { productSetupTemplate } from "../app/shell/modules/product-setup/shell";
import ProductSetupEnclosed from "../app/shell/modules/product-setup/templates/ProductSetupEnclosed.template.vue";
import ProductSetupFull from "../app/shell/modules/product-setup/templates/ProductSetupFull.template.vue";
import ProductSetupLTR from "../app/shell/modules/product-setup/templates/ProductSetupLTR.template.vue";
import ProductSetupRTL from "../app/shell/modules/product-setup/templates/ProductSetupRTL.template.vue";
import { PRODUCT_SETUP_TEMPLATE } from "../app/shell/modules/product-setup/types";
import { concat, get, values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

type Family = {
  name: string;
  pick: (template?: string) => Component;
  templates: string[];
  layouts: Record<string, Component>;
  fallback: string;
  foreign: string[];
};

const UNKNOWN = ["not-a-template", "constructor"];

const FAMILIES: Family[] = [
  {
    name: "basketTemplate",
    pick: basketTemplate,
    templates: values(BASKET_TEMPLATE),
    layouts: {
      [BASKET_TEMPLATE.FULL]: BasketFull,
      [BASKET_TEMPLATE.TWO_COLUMN_LTR]: BasketLTR,
      [BASKET_TEMPLATE.TWO_COLUMN_RTL]: BasketRTL,
      [BASKET_TEMPLATE.ENCLOSED]: BasketEnclosed,
      [BASKET_TEMPLATE.INSET]: BasketInset
    },
    fallback: BASKET_TEMPLATE.TWO_COLUMN_LTR,
    foreign: UNKNOWN
  },
  {
    name: "basketProductTemplate",
    pick: basketProductTemplate,
    templates: values(BASKET_PRODUCT_TEMPLATE),
    layouts: {
      [BASKET_PRODUCT_TEMPLATE.FULL]: BasketProductFull,
      [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: BasketProductLTR,
      [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: BasketProductRTL,
      [BASKET_PRODUCT_TEMPLATE.ENCLOSED]: BasketProductEnclosed,
      [BASKET_PRODUCT_TEMPLATE.INSET]: BasketProductInset
    },
    fallback: BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL,
    foreign: UNKNOWN
  },
  {
    name: "billingTemplate",
    pick: billingTemplate,
    templates: values(BILLING_TEMPLATE),
    layouts: {
      [BILLING_TEMPLATE.FULL]: BillingFull,
      [BILLING_TEMPLATE.TWO_COLUMN_LTR]: BillingLTR,
      [BILLING_TEMPLATE.TWO_COLUMN_RTL]: BillingRTL,
      [BILLING_TEMPLATE.ENCLOSED]: BillingEnclosed,
      [BILLING_TEMPLATE.INSET]: BillingInset
    },
    fallback: BILLING_TEMPLATE.TWO_COLUMN_RTL,
    foreign: UNKNOWN
  },
  {
    name: "checkoutTemplate",
    pick: checkoutTemplate,
    templates: values(CHECKOUT_TEMPLATE),
    layouts: {
      [CHECKOUT_TEMPLATE.FULL]: CheckoutFull,
      [CHECKOUT_TEMPLATE.TWO_COLUMN_LTR]: CheckoutLTR,
      [CHECKOUT_TEMPLATE.TWO_COLUMN_RTL]: CheckoutRTL,
      [CHECKOUT_TEMPLATE.ENCLOSED]: CheckoutEnclosed,
      [CHECKOUT_TEMPLATE.INSET]: CheckoutInset
    },
    fallback: CHECKOUT_TEMPLATE.TWO_COLUMN_LTR,
    foreign: UNKNOWN
  },
  {
    name: "productSetupTemplate",
    pick: productSetupTemplate,
    templates: values(PRODUCT_SETUP_TEMPLATE),
    layouts: {
      [PRODUCT_SETUP_TEMPLATE.FULL]: ProductSetupFull,
      [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_LTR]: ProductSetupLTR,
      [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL]: ProductSetupRTL,
      [PRODUCT_SETUP_TEMPLATE.ENCLOSED]: ProductSetupEnclosed
    },
    fallback: PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL,
    foreign: concat(["inset"], UNKNOWN)
  }
];

// -----------------------------------------------------------------------------

describe.each(FAMILIES)("$name", family => {
  it.each(family.templates)(
    "draws the layout the %s template carries",
    template => {
      expect(get(family.layouts, template)).toBeTruthy();
      expect(family.pick(template)).toBe(get(family.layouts, template));
    }
  );

  it.each([
    ["no template", undefined],
    ["an empty template", ""]
  ])(`draws the ${family.fallback} layout for %s`, (_case, template) => {
    expect(family.pick(template)).toBe(family.layouts[family.fallback]);
  });

  it.each(family.foreign)(
    `draws the ${family.fallback} layout for %j, which none of its layouts carries`,
    template => {
      expect(family.pick(template)).toBe(family.layouts[family.fallback]);
    }
  );
});
