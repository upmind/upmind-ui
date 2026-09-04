// -----------------------------------------------------------------------------
/**
 * @fileoverview Per-screen defaults — resolution tests
 *
 * ## Job To Be Done
 * A setting may need a different unauthored value on one screen than on the
 * others. `defaults` on a definition supplies that screen's fallback; the
 * shared `default` still covers every other screen and the wildcard-only
 * (no context) resolution. `productExcerpt` is the first user: visible on the
 * catalogue and recommendations as before, opt-in on the basket card.
 *
 * ## What Breaks If These Fail
 * - A basket default of "visible" shows an excerpt on every existing basket
 *   card on upgrade, with no brand having asked for it.
 * - A screen default leaking into the catalogue hides excerpts that were
 *   visible before this change.
 * - An authored value losing to the screen default makes the setting
 *   impossible to enable — the reason `locked` was not reused for this.
 */

import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";

// `config/utils` reaches the session machine through the localisation barrel,
// which calls `useCookies` at module load. Only `resolveDataValue` uses `t`, and
// no test here touches an `i18n:` value.
vi.mock("../../system/localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

import { initializeMeta, createUIMetaProxy } from "../utils";
import { getDefaultValue } from "../mappers";
import { UIContext, UIScope, VISIBILITY } from "../schema";
import type { RawMeta, PropertyDefinition } from "../types";

// -----------------------------------------------------------------------------

/** Build the ui proxy exactly as `useConfig` does, for one context + brand meta. */
function buildUi(
  context: UIContext | undefined,
  brand: RawMeta = {},
  productMeta?: RawMeta
) {
  const product = productMeta
    ? ({ productDetails: { uiMeta: productMeta } } as never)
    : undefined;
  const { meta } = initializeMeta({ context, viewport: "lg", brand, product });
  return createUIMetaProxy(ref(meta));
}

describe("getDefaultValue picks the screen's own fallback", () => {
  const definition: PropertyDefinition = {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE, UIContext.BASKET],
    scopes: [UIScope.BRAND],
    defaults: { [UIContext.BASKET]: VISIBILITY.HIDDEN }
  };

  it("returns the screen default where one is declared", () => {
    expect(getDefaultValue(definition, UIContext.BASKET)).toBe("hidden");
  });

  it("falls back to the shared default on every other screen", () => {
    expect(getDefaultValue(definition, UIContext.CATALOGUE)).toBe("visible");
  });

  it("uses the shared default when resolving without a screen", () => {
    expect(getDefaultValue(definition, undefined)).toBe("visible");
  });
});

describe("productExcerpt keeps its pre-change value off the basket", () => {
  it("stays visible on the catalogue", () => {
    expect(buildUi(UIContext.CATALOGUE).productExcerpt.isVisible).toBe(true);
  });

  it("stays visible on recommendations", () => {
    expect(buildUi(UIContext.RECOMMENDATIONS).productExcerpt.isVisible).toBe(
      true
    );
  });

  it("resolves to the shared default with no screen (wildcard-only)", () => {
    expect(buildUi(undefined).productExcerpt.isVisible).toBe(true);
  });
});

describe("productExcerpt is opt-in on the basket", () => {
  it("is hidden on the basket when nothing is authored", () => {
    const ui = buildUi(UIContext.BASKET);
    expect(ui.productExcerpt.value).toBe("hidden");
    expect(ui.productExcerpt.isVisible).toBe(false);
  });

  it("a basket-targeted brand value enables it, and only there", () => {
    const brand: RawMeta = {
      "@context.basket.productExcerpt": "visible",
      "@context.catalogue.productExcerpt": "hidden"
    };
    expect(buildUi(UIContext.BASKET, brand).productExcerpt.isVisible).toBe(
      true
    );
    expect(buildUi(UIContext.CATALOGUE, brand).productExcerpt.isHidden).toBe(
      true
    );
  });

  it("a product-scoped value enables it for that product's card", () => {
    const ui = buildUi(
      UIContext.BASKET,
      {},
      { "@context.basket.productExcerpt": "visible" }
    );
    expect(ui.productExcerpt.isVisible).toBe(true);
  });

  it("a wildcard now reaches the basket too — an authored value beats the screen default", () => {
    const wildcard: RawMeta = { "@context.productExcerpt": "visible" };
    expect(buildUi(UIContext.BASKET, wildcard).productExcerpt.isVisible).toBe(
      true
    );
  });

  it("an invalid authored value falls back to the screen default, not the shared one", () => {
    const brand: RawMeta = { "@context.basket.productExcerpt": "sometimes" };
    expect(buildUi(UIContext.BASKET, brand).productExcerpt.value).toBe(
      "hidden"
    );
  });
});
