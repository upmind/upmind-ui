// -----------------------------------------------------------------------------
/**
 * @fileoverview Layout-independent feature properties — resolution tests
 *
 * ## Job To Be Done
 * Verify the properties that free the one-page features from the inset template
 * resolve correctly through the real cascade: `basketItemConfig`,
 * `basketPromotionCode`, `basketSummaryDetails` and `basketAction`, plus the
 * reused `billingDetails`. Every default must reproduce pre-change behaviour,
 * each property must answer only in the contexts it declares, and `useConfig`
 * must hold NO flow knowledge — the layout comes from `@context.template` alone.
 *
 * ## What Breaks If These Fail
 * - A wrong default silently changes every existing brand on upgrade: a stepped
 *   basket would gain inline product configuration, or lose its promotion field.
 * - A property answering outside its contexts lets a checkout-scoped wildcard
 *   reach the basket page (the reason `basketItems` was not extended to carry
 *   editability — one default cannot serve both screens).
 * - `billingDetails` losing its BILLING_DETAILS lock makes the standalone
 *   billing page think the checkout captures billing.
 * - Any surviving flow→template inference reintroduces a second source of truth
 *   for the layout, which the brand setting now owns for routing only.
 */

import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";

// `config/utils` reaches the session machine through the localisation barrel,
// which calls `useCookies` at module load. Only `resolveDataValue` uses `t`, and
// no test here touches an `i18n:` value.
vi.mock("../../system/localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

import { initializeMeta, createUIMetaProxy } from "../config.utils";
import { UIContext } from "../schema";
import type { RawMeta } from "../types";

// -----------------------------------------------------------------------------

/** Build the ui proxy exactly as `useConfig` does, for one context + brand meta. */
function buildUi(context: UIContext, brand: RawMeta = {}) {
  const { meta } = initializeMeta({ context, viewport: "lg", brand });
  return createUIMetaProxy(ref(meta));
}

describe("feature property defaults reproduce pre-change behaviour", () => {
  it("leaves basket items read-only, so a stepped basket keeps its edit-link rows", () => {
    const ui = buildUi(UIContext.BASKET);
    expect(ui.basketItemConfig.isReadonly).toBe(true);
    expect(ui.basketItemConfig.isEditable).toBe(false);
  });

  it("keeps the promotion code field visible on the basket", () => {
    const ui = buildUi(UIContext.BASKET);
    expect(ui.basketPromotionCode.isVisible).toBe(true);
  });

  it("hides the itemised summary on both of its screens", () => {
    expect(buildUi(UIContext.BASKET).basketSummaryDetails.isHidden).toBe(true);
    expect(buildUi(UIContext.CHECKOUT).basketSummaryDetails.isHidden).toBe(
      true
    );
  });

  it("leaves checkout billing read-only, so a standalone billing step owns it", () => {
    const ui = buildUi(UIContext.CHECKOUT);
    expect(ui.billingDetails.isReadonly).toBe(true);
    expect(ui.billingDetails.isEditable).toBe(false);
  });
});

describe("a brand opts each feature in independently of its template", () => {
  it("turns on inline basket item configuration", () => {
    const ui = buildUi(UIContext.BASKET, {
      "@context.basketItemConfig": "editable"
    });
    expect(ui.basketItemConfig.isEditable).toBe(true);
  });

  it("turns off the promotion code field", () => {
    const ui = buildUi(UIContext.BASKET, {
      "@context.basketPromotionCode": "hidden"
    });
    expect(ui.basketPromotionCode.isVisible).toBe(false);
  });

  it("turns on the itemised summary on a two-column brand — no template involved", () => {
    const brand: RawMeta = {
      "@context.template": "two-column-ltr",
      "@context.basketSummaryDetails": "visible"
    };
    expect(
      buildUi(UIContext.BASKET, brand).basketSummaryDetails.isVisible
    ).toBe(true);
    expect(
      buildUi(UIContext.CHECKOUT, brand).basketSummaryDetails.isVisible
    ).toBe(true);
    expect(buildUi(UIContext.CHECKOUT, brand).template.value).toBe(
      "two-column-ltr"
    );
  });

  it("captures billing inline when the checkout is told to", () => {
    const ui = buildUi(UIContext.CHECKOUT, {
      "@context.checkout.billingDetails": "editable"
    });
    expect(ui.billingDetails.isEditable).toBe(true);
  });
});

describe("each property answers only in the contexts it declares", () => {
  it("keeps inline item configuration off the checkout — basket only", () => {
    const ui = buildUi(UIContext.CHECKOUT, {
      "@context.basketItemConfig": "editable"
    });
    expect(ui.basketItemConfig.value).toBeUndefined();
  });

  it("answers on BOTH screens for the promotion code, so a wildcard hides it everywhere", () => {
    // basketPromotionCode supersedes the legacy `hide_promotions_field` setting,
    // so it deliberately reaches the checkout too. The migration hazard: a brand
    // wanting it off the basket only must target the context, or a shopper has
    // nowhere left to enter a code.
    const wildcard: RawMeta = { "@context.basketPromotionCode": "hidden" };
    expect(
      buildUi(UIContext.BASKET, wildcard).basketPromotionCode.isHidden
    ).toBe(true);
    expect(
      buildUi(UIContext.CHECKOUT, wildcard).basketPromotionCode.isHidden
    ).toBe(true);

    const targeted: RawMeta = {
      "@context.basket.basketPromotionCode": "hidden"
    };
    expect(
      buildUi(UIContext.BASKET, targeted).basketPromotionCode.isHidden
    ).toBe(true);
    expect(
      buildUi(UIContext.CHECKOUT, targeted).basketPromotionCode.isVisible
    ).toBe(true);
  });

  it("does not lock the promotion code at checkout — brands may still hide it", () => {
    // the legacy `hide_promotions_field` setting exists precisely so they can
    const ui = buildUi(UIContext.CHECKOUT, {
      "@context.checkout.basketPromotionCode": "hidden"
    });
    expect(ui.basketPromotionCode.isHidden).toBe(true);
  });

  it("scopes a context-targeted summary key to that screen only", () => {
    const brand: RawMeta = {
      "@context.checkout.basketSummaryDetails": "visible"
    };
    expect(
      buildUi(UIContext.CHECKOUT, brand).basketSummaryDetails.isVisible
    ).toBe(true);
    // the basket keeps the default — a checkout-targeted key must not leak
    expect(buildUi(UIContext.BASKET, brand).basketSummaryDetails.isHidden).toBe(
      true
    );
  });

  it("locks billingDetails editable on the standalone billing page", () => {
    // the lock must win even against an explicit brand value, which is why
    // Billing.vue cannot read this property to decide inline editing
    const ui = buildUi(UIContext.BILLING_DETAILS, {
      "@context.billingDetails": "readonly"
    });
    expect(ui.billingDetails.isEditable).toBe(true);
  });
});

describe("the header basket shortcut is the brand's call, not the layout's", () => {
  it("shows the shortcut by default, so no existing brand loses it", () => {
    expect(buildUi(UIContext.BASKET).basketAction.isVisible).toBe(true);
  });

  it("hides it on the screen a brand targets, leaving the catalogue its own", () => {
    const brand: RawMeta = { "@context.basket.basketAction": "hidden" };
    expect(buildUi(UIContext.BASKET, brand).basketAction.isHidden).toBe(true);
    expect(buildUi(UIContext.CATALOGUE, brand).basketAction.isVisible).toBe(
      true
    );
  });

  it("resolves hidden in every context from a wildcard", () => {
    const brand: RawMeta = { "@context.basketAction": "hidden" };
    expect(buildUi(UIContext.CHECKOUT, brand).basketAction.isHidden).toBe(true);
    expect(buildUi(UIContext.CATALOGUE, brand).basketAction.isHidden).toBe(
      true
    );
  });
});

describe("useConfig holds no flow knowledge", () => {
  it("no longer exposes a flow property", () => {
    expect(buildUi(UIContext.CHECKOUT).flow).toBeUndefined();
  });

  it("does not infer the template from a leftover flow key", () => {
    const ui = buildUi(UIContext.CHECKOUT, { "@context.flow": "one-page" });
    expect(ui.template.value).toBeUndefined();
  });

  it("takes the template from @context.template, so one-page names it", () => {
    const ui = buildUi(UIContext.CHECKOUT, { "@context.template": "inset" });
    expect(ui.template.value).toBe("inset");
  });
});
