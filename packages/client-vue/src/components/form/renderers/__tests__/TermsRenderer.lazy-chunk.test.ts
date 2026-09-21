// -----------------------------------------------------------------------------
/**
 * @module form/renderers/__tests__/TermsRenderer.lazy-chunk
 * @description The companion to `lazy-renderers.test.ts`, with NOTHING mocked:
 * `TermsRenderer` reaches `TermsRadio` / `TermsSelect` through
 * `defineAsyncComponent`, and this file mounts the real chunk.
 *
 * ## Job To Be Done
 * A `Terms` control declared on the real `UpmForm` draws real, clickable term
 * tiles once its chunk resolves, and a click on one writes that term's billing
 * cycle into the caller's model. Both selector shapes the config cascade can
 * pick are separate loaders, so both are exercised.
 *
 * ## What Breaks If These Fail
 * The lazy chunk resolves to something that renders no tile, or renders tiles
 * that no longer report their cycle back — a terms selector the user can see
 * but cannot use, or cannot see at all. `lazy-renderers.test.ts` proves the
 * renderer's side of the boundary; this proves the boundary's far side is a
 * real, usable field and not a resolved shell.
 *
 * PROVENANCE. The schema, uischema and product uiMeta are hand-authored generic
 * JSON Schema and generic config keys — caller-supplied INPUTS to the engine,
 * not recorded wire data, exactly as in `filter.harness.ts`. Nothing here stands
 * in for a captured response: the two terms carry only the fields `TermDetails`
 * makes mandatory, and every formatted price is a `ZZZ` SENTINEL no currency
 * formatter can produce — so the tile drawing one proves transport rather than
 * coincidence.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import { provideFormRenderers } from "@upmind-automation/foundation";
import {
  GRID_LAYOUT,
  TERM_SELECTOR,
  UIContext,
  provideConfig,
  useConfig
} from "@upmind-automation/headless";
import { UpmForm } from "../../index";
import { useFormI18n } from "../../useFormI18n";
import { formRenderers } from "../index";
import { messages } from "./filter.harness";
import { filter, map } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { VueWrapper } from "@vue/test-utils";

const price = (formatted: string) => ({
  currentAmount: 0,
  currentPrice: formatted,
  regularAmount: 0,
  regularPrice: formatted,
  savingAmount: 0,
  savingPrice: formatted,
  savingPercent: "ZZZ%"
});

const ANNUAL_PRICE = "ZZZ 12 annual";

const schema = {
  type: "object",
  required: ["zzz_term"],
  properties: {
    zzz_term: {
      type: "number",
      title: "Zzz Billing Term",
      options: [
        {
          id: "zzz-term-1",
          name: "Zzz Monthly",
          cycle: 1,
          meta: {},
          price: price("ZZZ 1 monthly")
        },
        {
          id: "zzz-term-12",
          name: "Zzz Annual",
          cycle: 12,
          meta: {},
          price: price(ANNUAL_PRICE)
        }
      ]
    }
  }
} as JsonSchema7;

const uischema = {
  type: "VerticalLayout",
  elements: [{ type: "Terms", scope: "#/properties/zzz_term" }]
} as UISchemaElement;

const mounted: VueWrapper[] = [];

/**
 * Mounts, then waits for the loader — never a fixed delay. A cold dynamic
 * import is slower than the first tick, and the wait timing out IS the failure
 * this file exists to catch.
 */
const mountTerms = async (
  uiMeta: Record<string, string>,
  awaited: string,
  modelValue: Record<string, unknown> = { zzz_term: 1 }
) => {
  const model = ref<Record<string, unknown>>(modelValue);
  const i18n = createI18n({ legacy: false, locale: "en", messages });

  const host = defineComponent({
    setup() {
      provideConfig(
        useConfig({
          context: UIContext.CONFIGURE,
          brand: undefined,
          basket: undefined,
          product: { productDetails: { uiMeta } }
        })
      );
      provideFormRenderers(formRenderers);
      const translator = useFormI18n();

      return () =>
        h(UpmForm, {
          noActions: true,
          touched: true,
          schema,
          uischema,
          modelValue: model.value,
          "onUpdate:modelValue": (next: Record<string, unknown>) =>
            (model.value = next),
          i18n: translator.value
        });
    }
  });

  const wrapper = mount(host, {
    attachTo: document.body,
    global: { plugins: [i18n] }
  });
  mounted.push(wrapper);
  await vi.waitFor(() => {
    expect(wrapper.find(awaited).exists()).toBe(true);
  });

  return { wrapper, model: () => model.value };
};

// The group and the tile's own description share the prefix, so only the
// cycle-suffixed keys are terms.
const TERM_TILE_KEY = /^option-tile-\d+$/;

const tiles = (wrapper: VueWrapper) =>
  filter(
    map(
      wrapper.findAll('[data-test-key^="option-tile-"]'),
      node => node.attributes("data-test-key") ?? ""
    ),
    key => TERM_TILE_KEY.test(key)
  );

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

const RADIO_TILE = '[data-test-key="option-tile-12"]';
const SELECT_TRIGGER = '[data-test-key="select-trigger"]';

describe("the Terms control's lazy chunk draws a usable field", () => {
  const radioMeta = {
    "@context.configure.termSelector": TERM_SELECTOR.RADIO_GRID,
    "@context.configure.termSelectorGrid": GRID_LAYOUT.TWO_COL
  };

  const selectMeta = {
    "@context.configure.termSelector": TERM_SELECTOR.SELECT
  };

  it("draws one tile per term in the declaration, priced from the declaration", async () => {
    const { wrapper } = await mountTerms(radioMeta, RADIO_TILE);

    expect(tiles(wrapper)).toEqual(["option-tile-1", "option-tile-12"]);
    expect(wrapper.get(RADIO_TILE).text()).toContain(ANNUAL_PRICE);
  });

  it("marks the term the caller's model already holds", async () => {
    const { wrapper } = await mountTerms(radioMeta, RADIO_TILE, {
      zzz_term: 12
    });

    expect(wrapper.get(RADIO_TILE).attributes("data-state")).toBe("checked");
    expect(
      wrapper.get('[data-test-key="option-tile-1"]').attributes("data-state")
    ).toBe("unchecked");
  });

  it("writes the clicked term's cycle into the caller's model", async () => {
    const { wrapper, model } = await mountTerms(radioMeta, RADIO_TILE);

    await wrapper.get(RADIO_TILE).trigger("click");

    await vi.waitFor(() => {
      expect(model().zzz_term).toBe(12);
    });
  });

  it("draws the select shape's own chunk when the config asks for one", async () => {
    const { wrapper } = await mountTerms(selectMeta, SELECT_TRIGGER);

    expect(tiles(wrapper)).toEqual([]);
  });
});
