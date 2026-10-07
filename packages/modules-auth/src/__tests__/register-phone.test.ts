// -----------------------------------------------------------------------------
/**
 * @fileoverview The registration form on a brand that asks for a phone number.
 *
 * ## Job To Be Done
 * A new customer on a brand with REQUIRE_PHONE_ON_REGISTRATION on sees one phone
 * field beside the rest of the registration form, and can register.
 *
 * ## What Breaks If These Fail
 * The registration form crashes while drawing (maximum call stack size exceeded),
 * so nobody can sign up on a brand that asks for a phone number.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import {
  foundationRenderers,
  registerFormRenderers
} from "@upmind-automation/foundation";
import {
  useRegisterSchema,
  useRegisterUischema
} from "@upmind-automation/headless";
import { set } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

const { Form: UpmForm } = await import("@upmind-automation/foundation");

const brand = vi.hoisted(() => ({ requirePhone: false }));

vi.mock("../../../headless/src/modules/brand", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  const { assign } = await import("lodash-es");
  return assign({}, actual, {
    useBrand: () => ({
      getConfig: (key: string) => ({ [key]: brand.requirePhone })
    })
  });
});

vi.mock("../../../headless/src/modules/system", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  const { assign } = await import("lodash-es");
  const { computed } = await import("vue");
  const country = { id: "gb", code: "GB", name: "United Kingdom" };
  return assign({}, actual, {
    useSystem: () => ({
      getCountry: () => country,
      countries: computed(() => [country]),
      ensureCountries: () => Promise.resolve([country])
    })
  });
});

// -----------------------------------------------------------------------------

const settle = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

const mounted: VueWrapper[] = [];

async function renderRegisterForm(requirePhone: boolean) {
  brand.requirePhone = requirePhone;
  const errors: unknown[] = [];
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    messages: {},
    missingWarn: false,
    fallbackWarn: false
  });

  const host = defineComponent({
    setup: () => {
      const schema = useRegisterSchema();
      const uischema = useRegisterUischema();
      return () =>
        h(UpmForm, { schema, uischema, modelValue: {}, noActions: true });
    }
  });

  const wrapper = mount(host, {
    attachTo: document.body,
    global: {
      plugins: [i18n],
      config: {
        errorHandler: error => errors.push(error),
        warnHandler: () => undefined
      }
    }
  });
  mounted.push(wrapper);
  await settle();

  return { wrapper, errors };
}

const telInputs = (wrapper: VueWrapper) => wrapper.findAll('input[type="tel"]');

beforeAll(() => {
  registerFormRenderers(foundationRenderers);
  // jsdom ships no scrollIntoView, and the country listbox calls it on highlight.
  set(Element.prototype, "scrollIntoView", () => undefined);
});

afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("the registration form", () => {
  it("draws one phone field, and no error, when the brand asks for a phone number", async () => {
    const { wrapper, errors } = await renderRegisterForm(true);

    expect(errors).toEqual([]);
    expect(telInputs(wrapper)).toHaveLength(1);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
  });

  it("draws no phone field, and no error, when the brand does not", async () => {
    const { wrapper, errors } = await renderRegisterForm(false);

    expect(errors).toEqual([]);
    expect(telInputs(wrapper)).toHaveLength(0);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
  });
});
