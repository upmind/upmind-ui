// -----------------------------------------------------------------------------
/**
 * @fileoverview The 24 app-owned templates carry no route transition.
 *
 * ## Job To Be Done
 * The basket, basket-product, product-setup, billing and checkout templates carry
 * no route transition; the host page holds it outside the template the organism swaps.
 *
 * ## What Breaks If These Fail
 * A template swap runs the enter transition again and re-renders the header, or
 * billing and checkout gain a wrapper element.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { UpmTransition } from "../components/layout";

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = await importOriginal<Record<string, unknown>>();
  const { computed } = await import("vue");

  return {
    ...real,
    useConfig: () => ({
      ui: { basketAction: { isHidden: false } },
      data: {},
      meta: computed(() => ({}))
    }),
    useRoutingEngine: () => ({ meta: computed(() => ({ isResolved: true })) })
  };
});

// -----------------------------------------------------------------------------

const TEMPLATES = {
  basket: [
    "BasketFull",
    "BasketLTR",
    "BasketRTL",
    "BasketEnclosed",
    "BasketInset"
  ],
  "basket-product": [
    "BasketProductFull",
    "BasketProductLTR",
    "BasketProductRTL",
    "BasketProductEnclosed",
    "BasketProductInset"
  ],
  billing: [
    "BillingFull",
    "BillingLTR",
    "BillingRTL",
    "BillingEnclosed",
    "BillingInset"
  ],
  checkout: [
    "CheckoutFull",
    "CheckoutLTR",
    "CheckoutRTL",
    "CheckoutEnclosed",
    "CheckoutInset"
  ],
  "product-setup": [
    "ProductSetupFull",
    "ProductSetupLTR",
    "ProductSetupRTL",
    "ProductSetupEnclosed"
  ]
} as const;

const modules = import.meta.glob<{ default: unknown }>(
  "../modules/{basket,basket-product,billing,checkout,product-setup}/templates/*.template.vue"
);

const CASES = Object.entries(TEMPLATES).flatMap(([family, names]) =>
  names.map(name => ({
    family,
    name,
    load: modules[`../modules/${family}/templates/${name}.template.vue`]
  }))
);

async function renderTemplate(load: () => Promise<{ default: unknown }>) {
  const component = (await load()).default as never;

  return mount(component, {
    shallow: true,
    global: { renderStubDefaultSlot: true }
  });
}

// -----------------------------------------------------------------------------

describe("the templates this spec grades", () => {
  it("finds all 24", () => {
    expect(CASES).toHaveLength(24);
  });

  it.each(CASES)("resolves $family/$name off disk", entry => {
    expect(
      entry.load,
      `${entry.family}/${entry.name}.template.vue is not where this spec ` +
        `looks for it, so nothing below grades it`
    ).toBeTypeOf("function");
  });
});

describe.each(CASES)("$family/$name", entry => {
  it("carries no route transition", async () => {
    const wrapper = await renderTemplate(entry.load);

    expect(
      wrapper.findAllComponents(UpmTransition),
      `${entry.name} carries a route transition inside the template its ` +
        `organism swaps, so a swap runs the enter transition again`
    ).toHaveLength(0);
  });
});
