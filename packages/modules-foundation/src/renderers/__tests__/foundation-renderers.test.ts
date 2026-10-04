/**
 * @fileoverview Foundation hands its form controls to its consumer, and its form carries none itself.
 *
 * ## Job To Be Done
 * A form whose consumer registered nothing draws no lookup control. Once the
 * consumer registers `foundationRenderers`, each lookup control opens its own
 * search, one machine per control.
 *
 * ## What Breaks If These Fail
 * An app that registers foundation's list holds the lookup control twice, or
 * two product pickers show each other's results.
 */

import { mount } from "@vue/test-utils";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import * as foundation from "../../index";
import { Form, foundationRenderers, registerFormRenderers } from "../../index";
import { get, map } from "lodash-es";

const { useLookup } = vi.hoisted(() => ({
  useLookup: vi.fn(() => ({
    items: ref([{ value: "p-1", label: "Alpha Product" }]),
    total: ref(1),
    meta: ref({
      isLoading: false,
      hasMore: false,
      hasErrors: false,
      isEmpty: false
    }),
    error: ref(undefined),
    search: vi.fn(),
    loadMore: vi.fn(),
    refresh: vi.fn()
  }))
}));

vi.mock("@upmind-automation/headless", async original => {
  const actual = await original<Record<string, unknown>>();
  return { ...actual, useLookup };
});

const ENGINE_NOTICE = "No applicable renderer found.";

const settle = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

const render = async (schema: object, uischema: object) => {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Form, { schema, uischema, modelValue: {}, noActions: true })
    }),
    {
      attachTo: document.body,
      global: {
        plugins: [
          createI18n({ legacy: false, locale: "en", messages: { en: {} } })
        ]
      }
    }
  );
  await settle();
  return wrapper;
};

const control = (scope: string, options?: object) => ({
  type: "Control",
  scope,
  ...(options ? { options } : {})
});

const lookup = (scope: string, options?: object) => ({
  type: "Lookup",
  scope,
  ...(options ? { options } : {})
});

const lookupSchema = {
  type: "object",
  properties: {
    contract_product_id: { type: ["string", "null"], title: "Linked product" }
  }
};

const linkedProduct = {
  type: "VerticalLayout",
  elements: [
    lookup("#/properties/contract_product_id", {
      lookup: { service: () => "the client's products", searchScope: "x" }
    })
  ]
};

describe("foundation's barrel", () => {
  it("exports the form host and its translator", () => {
    expect(foundation).toHaveProperty("Form");
    expect(foundation).toHaveProperty("useFormI18n");
  });

  it("does not re-export LookupRenderer", () => {
    expect(Object.keys(foundation)).not.toContain("LookupRenderer");
  });

  it("hands its consumer the lookup control in foundationRenderers", () => {
    expect(
      map(foundationRenderers, entry => get(entry.renderer, "__name"))
    ).toContain("LookupRenderer");
  });
});

describe("a form whose consumer registered no control", () => {
  it("draws no lookup control, and shows the engine's notice in its place", async () => {
    useLookup.mockClear();

    const wrapper = await render(lookupSchema, linkedProduct);

    expect(useLookup).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(ENGINE_NOTICE);
  });
});

describe("the lookup control, once its consumer registers foundationRenderers", () => {
  beforeAll(() => {
    registerFormRenderers(foundationRenderers);
  });

  it("opens a lookup machine for a control naming a service", async () => {
    useLookup.mockClear();

    await render(lookupSchema, linkedProduct);

    expect(useLookup).toHaveBeenCalledTimes(1);
  });

  it("opens one machine per lookup control, so two pickers never share one", async () => {
    useLookup.mockClear();

    await render(
      {
        type: "object",
        properties: {
          first: { type: ["string", "null"], title: "First" },
          second: { type: ["string", "null"], title: "Second" }
        }
      },
      {
        type: "VerticalLayout",
        elements: [
          lookup("#/properties/first", {
            lookup: { service: () => "one" }
          }),
          lookup("#/properties/second", {
            lookup: { service: () => "two" }
          })
        ]
      }
    );

    expect(useLookup).toHaveBeenCalledTimes(2);
  });

  it("opens none for a control that names no service", async () => {
    useLookup.mockClear();

    await render(lookupSchema, {
      type: "VerticalLayout",
      elements: [
        control("#/properties/contract_product_id", {
          lookup: { options: [{ value: "s-1", label: "Static One" }] }
        })
      ]
    });

    expect(useLookup).not.toHaveBeenCalled();
  });
});
