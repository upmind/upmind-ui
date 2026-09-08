// -----------------------------------------------------------------------------
/**
 * @module form/renderers/__tests__/lazy-renderers
 * @description Three renderers reach their field component through
 * `defineAsyncComponent` instead of a static import (ADR 023 §3/§11 — a static
 * import puts the product and domain module trees in every consumer of the
 * client-vue barrel, which is what stops `domain` being an optional package).
 * There is no `loadingComponent` and no Suspense boundary, so the whole field
 * lives or dies on that loader resolving and re-binding.
 *
 * ## Job To Be Done
 * The user still gets a working field. Each renderer is dispatched through the
 * REAL `UpmForm` by a declaration its own exported `tester` matches, and then:
 * the field is in the tree once the chunk resolves, it carries every value the
 * renderer computes for it (uischema options, schema options, the caller's
 * model, sibling model state), and the change it emits reaches the caller's
 * model through JSON Forms.
 *
 * ## What Breaks If These Fail
 * A terms selector, a subproduct group, or the domain field renders empty, or
 * renders and then silently drops every edit — the async boundary's two failure
 * modes. Both look identical to "the form has no such field" from the seat of
 * the user configuring a product.
 *
 * PROVENANCE. The schemas and uischemas are hand-authored generic JSON Schema —
 * a caller-supplied INPUT to the engine, not recorded wire data, exactly as in
 * `filter.harness.ts`. Nothing here stands in for a captured response. Every
 * value is a `Zzz`/`zzz` SENTINEL that can only have arrived from this file, so
 * a prop assertion cannot pass by coincidence with a real default.
 *
 * The field component behind each loader is the MOCKED SEAM: this file proves
 * the RENDERER's boundary to it — loader resolved, props bound, emit routed —
 * not the field's own rendering. `TermsRenderer.lazy-chunk.test.ts` covers the
 * real chunk drawing real DOM; `SubproductSelector` and `SmartDomainField` are
 * proven by their own suites.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import {
  GRID_LAYOUT,
  TERM_SELECTOR,
  UIContext,
  provideConfig,
  useConfig
} from "@upmind-automation/headless";
import { UpmForm } from "../../index";
import { useFormI18n } from "../../useFormI18n";
import { messages } from "./filter.harness";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { VueWrapper } from "@vue/test-utils";

const STUB = {
  termsRadio: "ZzzTermsRadio",
  termsSelect: "ZzzTermsSelect",
  subproducts: "ZzzSubproductSelector",
  domain: "ZzzSmartDomainField"
};

/**
 * A field stub that declares the props its renderer binds, so vue-test-utils
 * normalises the kebab-cased bindings, and re-emits on demand.
 *
 * `__esModule` is load-bearing: `defineAsyncComponent` only unwraps `.default`
 * from a module it recognises as ESM, and without the flag it treats the mock
 * namespace itself as the component.
 */
const fieldStub = async (name: string, props: string[]) => {
  const { defineComponent: define, h: render } = await import("vue");

  return {
    __esModule: true,
    default: define({
      name,
      props,
      emits: ["update:modelValue", "update:quantity"],
      setup: () => () => render("div", { "data-test-key": name })
    })
  };
};

vi.mock("../../../../modules/product/components/terms/TermsRadio.vue", () =>
  fieldStub(STUB.termsRadio, [
    "items",
    "modelValue",
    "errors",
    "touched",
    "required",
    "disabled",
    "type",
    "columns",
    "summary",
    "overridden"
  ])
);

vi.mock("../../../../modules/product/components/terms/TermsSelect.vue", () =>
  fieldStub(STUB.termsSelect, ["items", "modelValue", "type", "disabled"])
);

vi.mock(
  "../../../../modules/product/components/subproduct/SubproductSelector.vue",
  () =>
    fieldStub(STUB.subproducts, [
      "subproduct",
      "meta",
      "modelValue",
      "quantities",
      "disabled",
      "term"
    ])
);

vi.mock("../../../../modules/domain/SmartDomainField.vue", () =>
  fieldStub(STUB.domain, [
    "modelValue",
    "required",
    "disabled",
    "errors",
    "touched"
  ])
);

// -----------------------------------------------------------------------------
// Declarations — see PROVENANCE.
// -----------------------------------------------------------------------------

const TERM_MONTHLY = {
  id: "zzz-term-1",
  name: "Zzz Monthly",
  title: "Zzz Monthly",
  cycle: 1,
  meta: {}
};

const TERM_ANNUAL = {
  id: "zzz-term-12",
  name: "Zzz Annual",
  title: "Zzz Annual",
  cycle: 12,
  meta: {}
};

const termsDeclaration = {
  schema: {
    type: "object",
    required: ["zzz_term"],
    properties: {
      zzz_term: {
        type: "number",
        title: "Zzz Billing Term",
        options: [TERM_MONTHLY, TERM_ANNUAL]
      }
    }
  } as JsonSchema7,
  uischema: {
    type: "VerticalLayout",
    elements: [
      {
        type: "Terms",
        scope: "#/properties/zzz_term",
        options: { overridden: true }
      }
    ]
  } as UISchemaElement
};

const OPTION_ALPHA = { id: "zzz-opt-alpha", title: "Zzz Alpha", order: 1 };
const OPTION_BETA = { id: "zzz-opt-beta", title: "Zzz Beta", order: 2 };

const SUBPRODUCT_META = { multiple: true, required: true, overrides: false };

const subproductDeclaration = {
  schema: {
    type: "object",
    properties: {
      term: { type: "number" },
      options: {
        type: "object",
        properties: {
          "zzz-group": {
            type: "object",
            title: "Zzz Option Group",
            description: "Zzz group description",
            options: [OPTION_ALPHA, OPTION_BETA]
          }
        }
      }
    }
  } as JsonSchema7,
  uischema: {
    type: "VerticalLayout",
    elements: [
      {
        type: "SubProducts",
        scope: "#/properties/options/properties/zzz-group",
        options: {
          meta: SUBPRODUCT_META,
          uiMeta: { "@context.configure.optionSelector": "radio-rows" },
          uiCategoryMeta: {}
        }
      }
    ]
  } as UISchemaElement
};

const domainDeclaration = {
  schema: {
    type: "object",
    required: ["zzz_domain"],
    properties: {
      zzz_domain: {
        type: "string",
        title: "Zzz Domain",
        minLength: 8
      }
    }
  } as JsonSchema7,
  uischema: {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/zzz_domain",
        options: { semantic_type: "domain_name" }
      }
    ]
  } as UISchemaElement
};

// -----------------------------------------------------------------------------

type Declaration = {
  schema: JsonSchema7;
  uischema: UISchemaElement;
};

const mounted: VueWrapper[] = [];

/**
 * Mounts a declaration on the real `UpmForm`, with the config cascade provided
 * from an explicit product-scope uiMeta so no assertion here depends on an
 * unauthored default. `brand`/`basket` are declared-undefined to opt out of
 * `useBrand`/`useBasket` (the documented escape hatch in `useConfig`).
 *
 * Waits on the loader rather than a fixed delay: a cold dynamic import is
 * slower than the first tick, and the wait timing out IS the failure this file
 * exists to catch.
 */
const mountForm = async (
  declaration: Declaration,
  options: {
    modelValue?: Record<string, unknown>;
    uiMeta?: Record<string, string>;
    awaited: string;
  }
) => {
  const model = ref<Record<string, unknown>>(options.modelValue ?? {});
  const i18n = createI18n({ legacy: false, locale: "en", messages });

  const host = defineComponent({
    setup() {
      provideConfig(
        useConfig({
          context: UIContext.CONFIGURE,
          brand: undefined,
          basket: undefined,
          product: {
            productDetails: { uiMeta: options.uiMeta ?? {} }
          }
        })
      );
      const translator = useFormI18n();

      return () =>
        h(UpmForm, {
          noActions: true,
          touched: true,
          schema: declaration.schema,
          uischema: declaration.uischema,
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
    expect(drawn(wrapper, options.awaited)).toBe(true);
  });

  return { wrapper, model: () => model.value };
};

const field = (wrapper: VueWrapper, name: string) =>
  wrapper.findComponent({ name });

const drawn = (wrapper: VueWrapper, name: string) =>
  wrapper.find(`[data-test-key="${name}"]`).exists();

beforeAll(() => {
  // jsdom ships no scrollIntoView, and the engine calls it on highlight.
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("TermsRenderer resolves its terms field and stays wired to it", () => {
  const radioMeta = {
    "@context.configure.termSelector": TERM_SELECTOR.RADIO_GRID,
    "@context.configure.termSelectorGrid": GRID_LAYOUT.THREE_COL,
    "@context.configure.termSelectorSummary": "hidden"
  };

  const selectMeta = {
    "@context.configure.termSelector": TERM_SELECTOR.SELECT
  };

  it("draws the radio field once the chunk resolves", async () => {
    const { wrapper } = await mountForm(termsDeclaration, {
      awaited: STUB.termsRadio,
      modelValue: { zzz_term: 1 },
      uiMeta: radioMeta
    });

    expect(drawn(wrapper, STUB.termsRadio)).toBe(true);
    expect(drawn(wrapper, STUB.termsSelect)).toBe(false);
  });

  it("draws the select field, a second loader, when the brand asks for one", async () => {
    const { wrapper } = await mountForm(termsDeclaration, {
      awaited: STUB.termsSelect,
      modelValue: { zzz_term: 1 },
      uiMeta: selectMeta
    });

    expect(drawn(wrapper, STUB.termsSelect)).toBe(true);
    expect(drawn(wrapper, STUB.termsRadio)).toBe(false);
  });

  it("hands the resolved field its terms, the model's own term, and the config's layout", async () => {
    const { wrapper } = await mountForm(termsDeclaration, {
      awaited: STUB.termsRadio,
      modelValue: { zzz_term: 12 },
      uiMeta: radioMeta
    });

    expect(field(wrapper, STUB.termsRadio).props()).toMatchObject({
      items: [TERM_MONTHLY, TERM_ANNUAL],
      modelValue: 12,
      type: TERM_SELECTOR.RADIO_GRID,
      columns: 3,
      summary: false,
      overridden: true,
      required: true
    });
  });

  it("keeps the term the resolved field reports, reaching the caller's model", async () => {
    const { wrapper, model } = await mountForm(termsDeclaration, {
      awaited: STUB.termsRadio,
      modelValue: { zzz_term: 1 },
      uiMeta: radioMeta
    });

    field(wrapper, STUB.termsRadio).vm.$emit("update:modelValue", 12);
    await vi.waitFor(() => {
      expect(model().zzz_term).toBe(12);
    });
  });
});

describe("SubProductRenderer resolves its selector and stays wired to it", () => {
  const seated = {
    term: 12,
    options: {
      "zzz-group": {
        "zzz-opt-alpha": { productId: "zzz-opt-alpha", quantity: 2 }
      }
    }
  };

  it("draws the selector once the chunk resolves", async () => {
    const { wrapper } = await mountForm(subproductDeclaration, {
      awaited: STUB.subproducts,
      modelValue: seated
    });

    expect(drawn(wrapper, STUB.subproducts)).toBe(true);
  });

  it("hands the resolved selector its group, its seated selection, and the sibling term", async () => {
    const { wrapper } = await mountForm(subproductDeclaration, {
      awaited: STUB.subproducts,
      modelValue: seated
    });

    expect(field(wrapper, STUB.subproducts).props()).toMatchObject({
      subproduct: {
        id: "zzz-group",
        title: "Zzz Option Group",
        description: "Zzz group description",
        meta: SUBPRODUCT_META,
        values: [OPTION_ALPHA, OPTION_BETA]
      },
      modelValue: ["zzz-opt-alpha"],
      quantities: { "zzz-opt-alpha": 2 },
      term: 12
    });
  });

  it("keeps a selection the resolved selector reports, preserving the seated quantity", async () => {
    const { wrapper, model } = await mountForm(subproductDeclaration, {
      awaited: STUB.subproducts,
      modelValue: seated
    });

    field(wrapper, STUB.subproducts).vm.$emit("update:modelValue", [
      "zzz-opt-alpha",
      "zzz-opt-beta"
    ]);

    await vi.waitFor(() => {
      expect(model().options).toEqual({
        "zzz-group": {
          "zzz-opt-alpha": { productId: "zzz-opt-alpha", quantity: 2 },
          "zzz-opt-beta": { productId: "zzz-opt-beta" }
        }
      });
    });
  });

  it("keeps a quantity the resolved selector reports", async () => {
    const { wrapper, model } = await mountForm(subproductDeclaration, {
      awaited: STUB.subproducts,
      modelValue: seated
    });

    field(wrapper, STUB.subproducts).vm.$emit(
      "update:quantity",
      "zzz-opt-alpha",
      5
    );

    await vi.waitFor(() => {
      expect(model().options).toEqual({
        "zzz-group": {
          "zzz-opt-alpha": { productId: "zzz-opt-alpha", quantity: 5 }
        }
      });
    });
  });
});

describe("DomainRenderer resolves its domain field and stays wired to it", () => {
  it("draws the domain field once the chunk resolves", async () => {
    const { wrapper } = await mountForm(domainDeclaration, {
      awaited: STUB.domain,
      modelValue: { zzz_domain: "zzz-sentinel.example" }
    });

    expect(drawn(wrapper, STUB.domain)).toBe(true);
  });

  it("hands the resolved field the caller's domain and no errors while it validates", async () => {
    const { wrapper } = await mountForm(domainDeclaration, {
      awaited: STUB.domain,
      modelValue: { zzz_domain: "zzz-sentinel.example" }
    });

    expect(field(wrapper, STUB.domain).props()).toMatchObject({
      modelValue: "zzz-sentinel.example",
      required: true,
      touched: true,
      errors: []
    });
  });

  it("hands the resolved field its errors as an array once the value is rejected", async () => {
    const { wrapper } = await mountForm(domainDeclaration, {
      awaited: STUB.domain,
      modelValue: { zzz_domain: "zzz" }
    });

    expect(field(wrapper, STUB.domain).props("errors")).toHaveLength(1);
  });

  it("keeps the domain the resolved field reports, reaching the caller's model", async () => {
    const { wrapper, model } = await mountForm(domainDeclaration, {
      awaited: STUB.domain,
      modelValue: { zzz_domain: "zzz-sentinel.example" }
    });

    field(wrapper, STUB.domain).vm.$emit(
      "update:modelValue",
      "zzz-replaced.example"
    );

    await vi.waitFor(() => {
      expect(model().zzz_domain).toBe("zzz-replaced.example");
    });
  });

  it("clears the model when the resolved field reports an empty domain", async () => {
    const { wrapper, model } = await mountForm(domainDeclaration, {
      awaited: STUB.domain,
      modelValue: { zzz_domain: "zzz-sentinel.example" }
    });

    field(wrapper, STUB.domain).vm.$emit("update:modelValue", null);

    await vi.waitFor(() => {
      expect(model().zzz_domain).toBeUndefined();
    });
  });
});
