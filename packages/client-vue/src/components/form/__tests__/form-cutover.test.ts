/**
 * @module form/__tests__/form-cutover
 * @description Reads the Phase-3 cutover back through the REAL wrapper: mounting
 * `UpmForm` must render `@upmind/ui`'s engine host, and every seam the wrapper
 * is the sole supplier of must arrive at that host — the `Icon` and the country
 * list it `provide`s, and the validator, translator and optional copy it binds
 * as props. All five degrade SILENTLY, so each assertion is paired with the same
 * declaration on the bare engine, which is what the wrapper's absence looks like.
 *
 * PROVENANCE. The schemas and uischemas are hand-authored generic JSON Schema —
 * a caller-supplied INPUT to the engine, not recorded wire data. The country
 * list is a deliberate SENTINEL: `Zzz Testland` / `Qqq Otherland` are not
 * countries and cannot arrive from anywhere but this file's stub of
 * `useSystem()`, so the picker listing them proves transport rather than
 * coincidence. Their CODES are real because the control offers only countries
 * libphonenumber supports; the names carry the sentinel. The i18n catalogue is the shipped `packages/i18n` source, read
 * through `catalogue()` rather than transcribed; `OPTIONAL_SENTINEL` is the one
 * key overridden, for the same reason the countries are — the engine's own
 * fallback for that string is the English word the catalogue already carries.
 */

import { createAjv } from "@jsonforms/core";
import { Form } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import { useFormI18n } from "@upmind-automation/foundation";
import { useValidation } from "@upmind-automation/headless";
import { catalogue, messages } from "../renderers/__tests__/filter.harness";
import { cloneDeep, map, set } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { VueWrapper } from "@vue/test-utils";

// `@upmind/ui` also exports a `Form` (the bare engine), so the wrapper is read by name.
const { Form: UpmForm } = await import("@upmind-automation/foundation");

const sentinel = vi.hoisted(() => ({
  countries: [
    { id: "sentinel-zz", code: "GB", name: "Zzz Testland" },
    { id: "sentinel-qq", code: "IE", name: "Qqq Otherland" }
  ],
  ensureCountries: vi.fn()
}));

vi.mock("@upmind-automation/headless", async importOriginal => {
  const headless =
    await importOriginal<typeof import("@upmind-automation/headless")>();
  const { computed } = await import("vue");

  return {
    ...headless,
    useSystem: () => ({
      ...headless.useSystem(),
      countries: computed(() => sentinel.countries),
      ensureCountries: sentinel.ensureCountries
    })
  };
});

const textSchema = {
  type: "object",
  properties: { username: { type: "string", title: "Username" } }
} as JsonSchema7;

const textUischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/username",
      options: { icon: "user-01", tooltip: "who you are" }
    }
  ]
} as UISchemaElement;

const phoneSchema = {
  type: "object",
  properties: { phone: { type: "string", title: "Phone", format: "phone" } }
} as JsonSchema7;

const phoneUischema = {
  type: "VerticalLayout",
  elements: [{ type: "Control", scope: "#/properties/phone" }]
} as UISchemaElement;

// `domain_name` is one of five formats headless registers on its Ajv and stock
// Ajv has never heard of; both instances run non-strict, so an instance without
// it does not complain about the unknown format — it passes the value.
const seamSchema = {
  type: "object",
  properties: {
    website: { type: "string", title: "Website", format: "domain_name" },
    nickname: { type: "string", title: "Untranslated Title" }
  },
  required: ["website"]
} as JsonSchema7;

const seamUischema = {
  type: "VerticalLayout",
  elements: [
    { type: "Control", scope: "#/properties/website" },
    {
      type: "Control",
      scope: "#/properties/nickname",
      i18n: "form.cardholder_name"
    }
  ]
} as UISchemaElement;

const seamModel = { website: "not a domain", nickname: "" };

const OPTIONAL_SENTINEL = "Zzz Optional Sentinel";

const sentinelMessages = (() => {
  const next = cloneDeep(messages);
  set(next, "en.text.optional", OPTIONAL_SENTINEL);
  return next;
})();

const settle = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

const mounted: VueWrapper[] = [];

const track = (wrapper: VueWrapper) => {
  mounted.push(wrapper);
  return wrapper;
};

type Declaration = {
  schema: JsonSchema7;
  uischema: UISchemaElement;
  modelValue?: Record<string, unknown>;
};

/**
 * The wrapper as an app mounts it — a declaration and nothing else.
 *
 * It deliberately supplies NO `i18n` prop. A caller-supplied one reaches the
 * engine by a second route and stands in for the translator the wrapper builds
 * itself, which is what made that seam look guarded while its binding was dead.
 */
const mountWrapper = async (
  declaration: Declaration,
  catalogueOverride = messages
) => {
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    messages: catalogueOverride
  });
  const host = defineComponent({
    setup: () => () =>
      h(UpmForm, {
        ...declaration,
        modelValue: declaration.modelValue ?? {},
        noActions: true,
        touched: true
      })
  });

  const wrapper = track(
    mount(host, { attachTo: document.body, global: { plugins: [i18n] } })
  );
  await settle();
  return wrapper;
};

/**
 * The same declaration on the bare engine, with no host installing a seam.
 *
 * @param options.supplied - the seams this mount DOES supply, so a twin can
 *   hold the other four steady and vary only the one it is paired with.
 * @param options.translate - supplies the same translator the wrapper builds,
 *   which is what rules out a seam's copy having arrived through i18n instead.
 */
const mountBareHost = async (
  declaration: Declaration,
  options: {
    supplied?: Record<string, unknown>;
    translate?: boolean;
    catalogueOverride?: typeof messages;
  } = {}
) => {
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    messages: options.catalogueOverride ?? messages
  });
  const host = defineComponent({
    setup() {
      const translator = useFormI18n();
      return () =>
        h(Form, {
          ...declaration,
          modelValue: declaration.modelValue ?? {},
          noActions: true,
          touched: true,
          ...(options.translate ? { i18n: translator.value } : {}),
          ...options.supplied
        });
    }
  });

  const wrapper = track(
    mount(host, { attachTo: document.body, global: { plugins: [i18n] } })
  );
  await settle();
  return wrapper;
};

const glyphsIn = (root: Element | null | undefined) =>
  map(
    Array.from(root?.querySelectorAll("svg[aria-label]") ?? []),
    node => node.getAttribute("aria-label")?.replace(/ icon$/, "") ?? ""
  );

const labelOf = (wrapper: VueWrapper, field: string) =>
  wrapper.get(`[data-test-value="${field}"] label`).element;

// The input's parent is the adornment wrapper — leading slot, input, trailing
// slot — which separates the in-field glyphs from the label's.
const fieldOf = (wrapper: VueWrapper, field: string) =>
  wrapper.get(`[data-test-value="${field}"] input`).element.parentElement;

const messagesOf = (wrapper: VueWrapper, field: string) =>
  map(
    wrapper.findAll(
      `[data-test-value="${field}"] [data-test-key="form-item-message"]`
    ),
    node => node.text()
  );

const placeholderOf = (wrapper: VueWrapper, field: string) =>
  wrapper.get(`[data-test-value="${field}"] input`).attributes("placeholder");

const openCountryPicker = async (wrapper: VueWrapper) => {
  await wrapper
    .get('[data-test-key="button-phone-country"] button')
    .trigger("click");
  await settle();
  return document.body.innerHTML;
};

beforeAll(() => {
  // jsdom ships no scrollIntoView, and the country listbox calls it on highlight.
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
  document.body.innerHTML = "";
  sentinel.ensureCountries.mockClear();
});

describe("the wrapper runs on the design-system engine", () => {
  it("renders @upmind/ui's host exactly once, and does not recurse into itself", async () => {
    const wrapper = await mountWrapper({
      schema: textSchema,
      uischema: textUischema
    });

    expect(wrapper.findAllComponents(UpmForm)).toHaveLength(1);
    expect(wrapper.findAllComponents(Form)).toHaveLength(1);
    expect(wrapper.findComponent(Form).element.tagName).toBe("FORM");
    expect(wrapper.find('[data-test-key="form"]').exists()).toBe(true);
  });

  it("renders the control its declaration asks for, carrying the caller's model", async () => {
    const wrapper = await mountWrapper({
      schema: textSchema,
      uischema: textUischema,
      modelValue: { username: "bob" }
    });

    expect(labelOf(wrapper, "username").textContent).toContain("Username");
    expect(
      wrapper.get('[data-test-value="username"] input').element
    ).toHaveProperty("value", "bob");
  });

  it("keeps typing flowing back to the caller's model", async () => {
    const wrapper = await mountWrapper({
      schema: textSchema,
      uischema: textUischema,
      modelValue: { username: "bob" }
    });

    await wrapper.get('[data-test-value="username"] input').setValue("ada");
    await settle();

    expect(
      wrapper.get('[data-test-value="username"] input').element
    ).toHaveProperty("value", "ada");
  });
});

describe("the wrapper's icon reaches the engine", () => {
  it("draws the label icon and the tooltip trigger the uischema names", async () => {
    const wrapper = await mountWrapper({
      schema: textSchema,
      uischema: textUischema
    });

    expect(glyphsIn(labelOf(wrapper, "username"))).toEqual([
      "user-01",
      "info-circle"
    ]);
  });

  it("draws the leading icon inside the field", async () => {
    const wrapper = await mountWrapper({
      schema: textSchema,
      uischema: textUischema
    });

    expect(glyphsIn(fieldOf(wrapper, "username"))).toEqual(["user-01"]);
  });

  it("draws no glyph at all on a host nobody supplied an icon to", async () => {
    const wrapper = await mountBareHost({
      schema: textSchema,
      uischema: textUischema
    });

    expect(labelOf(wrapper, "username").textContent).toContain("Username");
    expect(glyphsIn(wrapper.element)).toEqual([]);
  });
});

describe("the wrapper's country list reaches the phone control", () => {
  it("offers the countries the host supplied, and nothing else", async () => {
    const html = await openCountryPicker(
      await mountWrapper({ schema: phoneSchema, uischema: phoneUischema })
    );

    expect(html).toContain("Zzz Testland");
    expect(html).toContain("Qqq Otherland");
    expect(html).not.toContain("United Kingdom");
  });

  it("asks the host to load the list", async () => {
    await mountWrapper({ schema: phoneSchema, uischema: phoneUischema });

    expect(sentinel.ensureCountries).toHaveBeenCalled();
  });

  it("offers no country on a host nobody supplied a list to", async () => {
    const html = await openCountryPicker(
      await mountBareHost({ schema: phoneSchema, uischema: phoneUischema })
    );

    expect(html).not.toContain("Zzz Testland");
    expect(html).not.toContain("Qqq Otherland");
  });

  // The control derives the dial code from libphonenumber rather than the row it
  // is handed, so a host cannot supply one that disagrees with the validator —
  // which is what rendered "++44" while the row carried its own plus.
  it("shows the dial code its own validator uses, not one the host supplies", async () => {
    const supplied = map(sentinel.countries, country =>
      set(cloneDeep(country), "phone_code", "+999")
    );
    const bare = sentinel.countries;
    sentinel.countries = supplied;

    await mountWrapper({ schema: phoneSchema, uischema: phoneUischema })
      .then(openCountryPicker)
      .then(html => {
        expect(html).toContain("+44");
        expect(html).not.toContain("999");
      })
      .finally(() => {
        sentinel.countries = bare;
      });
  });
});

describe("the wrapper's validator reaches the engine", () => {
  it("rejects a value only headless's own Ajv knows how to reject", async () => {
    const wrapper = await mountWrapper({
      schema: seamSchema,
      uischema: seamUischema,
      modelValue: seamModel
    });

    expect(messagesOf(wrapper, "website")).toHaveLength(1);
    // The catalogue's own `validation.domain_name` copy, title interpolated.
    expect(messagesOf(wrapper, "website")[0]).toBe(
      "Website must be a valid domain name"
    );
  });

  it("stays non-vacuous: domain_name is headless's format, and JSON Forms' own Ajv has never heard of it", () => {
    expect(useValidation().ajv.formats).toHaveProperty("domain_name");
    expect(createAjv().formats).not.toHaveProperty("domain_name");
  });

  it("accepts the very same value on a host nobody supplied a validator to", async () => {
    const wrapper = await mountBareHost(
      { schema: seamSchema, uischema: seamUischema, modelValue: seamModel },
      { translate: true }
    );

    expect(messagesOf(wrapper, "website")).toEqual([]);
  });
});

describe("the wrapper's translator reaches the engine", () => {
  it("labels and prompts a control from the catalogue key its uischema names", async () => {
    const wrapper = await mountWrapper({
      schema: seamSchema,
      uischema: seamUischema,
      modelValue: seamModel
    });

    expect(labelOf(wrapper, "nickname").textContent).toContain(
      catalogue("form.cardholder_name.label")
    );
    expect(placeholderOf(wrapper, "nickname")).toBe(
      catalogue("form.cardholder_name.placeholder")
    );
  });

  it("falls back to the schema's own title on a host nobody supplied a translator to", async () => {
    const wrapper = await mountBareHost(
      { schema: seamSchema, uischema: seamUischema, modelValue: seamModel },
      { supplied: { ajv: useValidation().ajv } }
    );

    expect(labelOf(wrapper, "nickname").textContent).toContain(
      "Untranslated Title"
    );
    expect(labelOf(wrapper, "nickname").textContent).not.toContain(
      catalogue("form.cardholder_name.label")
    );
    expect(placeholderOf(wrapper, "nickname")).toBeUndefined();
  });
});

describe("the wrapper's optional copy reaches the engine", () => {
  it("marks an optional control with the catalogue's own wording", async () => {
    const wrapper = await mountWrapper(
      { schema: seamSchema, uischema: seamUischema, modelValue: seamModel },
      sentinelMessages
    );

    expect(labelOf(wrapper, "nickname").textContent).toContain(
      OPTIONAL_SENTINEL
    );
  });

  it("falls back to the engine's own English on a host nobody supplied it to, translator or not", async () => {
    const wrapper = await mountBareHost(
      { schema: seamSchema, uischema: seamUischema, modelValue: seamModel },
      { translate: true, catalogueOverride: sentinelMessages }
    );

    expect(labelOf(wrapper, "nickname").textContent).not.toContain(
      OPTIONAL_SENTINEL
    );
    expect(labelOf(wrapper, "nickname").textContent).toContain("Optional");
  });
});
