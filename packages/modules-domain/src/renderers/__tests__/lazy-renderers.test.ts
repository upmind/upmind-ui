// -----------------------------------------------------------------------------
/**
 * @module domain/renderers/__tests__/lazy-renderers
 * @description `DomainRenderer`'s async field loader resolves, binds props and routes emits.
 *
 * ## Job To Be Done
 * The renderer draws its field through the real form host, and its edits reach the model.
 *
 * ## What Breaks If These Fail
 * The domain field renders empty, or drops every edit.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import { Form, useFormI18n } from "@upmind-automation/foundation";
import {
  UIContext,
  provideConfig,
  useConfig
} from "@upmind-automation/headless";
import "../../index";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { VueWrapper } from "@vue/test-utils";

const STUB = vi.hoisted(() => ({
  domain: "ZzzSmartDomainField"
}));

const fieldStub = vi.hoisted(() => async (name: string, props: string[]) => {
  const { defineComponent: define, h: render } = await import("vue");

  return {
    __esModule: true,
    default: define({
      name,
      props,
      emits: ["update:modelValue"],
      setup: () => () => render("div", { "data-test-key": name })
    })
  };
});

vi.mock("../../components/SmartDomainField.vue", () =>
  fieldStub(STUB.domain, [
    "modelValue",
    "required",
    "disabled",
    "errors",
    "touched"
  ])
);

// -----------------------------------------------------------------------------
// Declarations
// -----------------------------------------------------------------------------

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

/** `brand`/`basket` declared undefined opt out of `useBrand`/`useBasket`. */
const mountForm = async (
  declaration: Declaration,
  options: {
    modelValue?: Record<string, unknown>;
    uiMeta?: Record<string, string>;
    awaited: string;
  }
) => {
  const model = ref<Record<string, unknown>>(options.modelValue ?? {});
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    missingWarn: false,
    fallbackWarn: false,
    messages: { en: {} }
  });

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
        h(Form, {
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
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

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
