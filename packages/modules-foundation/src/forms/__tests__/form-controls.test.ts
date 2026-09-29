/**
 * @fileoverview The form draws the registered controls, and flags a field that has none.
 *
 * ## Job To Be Done
 * A field draws the control its package registered. In development, a field
 * no control claims warns, naming the field, so the gap is visible.
 *
 * ## What Breaks If These Fail
 * A domain, gateway or address field draws the engine default, or a field
 * whose package never loaded disappears without a word.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import { Form, registerFormRenderers } from "../../index";
import { forEach, get, includes, some } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { VueWrapper } from "@vue/test-utils";

const catalogue = createI18n({ legacy: false, locale: "en" });

const PROBE = "#/properties/probe";
const UNCLAIMED = "#/properties/unclaimed";

const SCHEMA: JsonSchema7 = {
  type: "object",
  properties: {
    probe: { type: "string", title: "Probe" },
    unclaimed: { type: "null", title: "Unclaimed" }
  }
};

function uischemaFor(scope: string): UISchemaElement {
  return { type: "VerticalLayout", elements: [{ type: "Control", scope }] };
}

const ProbeControl = defineComponent({
  inheritAttrs: false,
  setup: () => () => h("output", { "data-test-key": "probe-control" })
});

const mounted: VueWrapper[] = [];

async function draw(form: typeof Form, scope: string): Promise<VueWrapper> {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(form, {
          schema: SCHEMA,
          uischema: uischemaFor(scope),
          modelValue: {},
          noActions: true
        })
    }),
    { attachTo: document.body, global: { plugins: [catalogue] } }
  );
  mounted.push(wrapper);
  await new Promise(resolve => setTimeout(resolve, 150));
  return wrapper;
}

function warnedAbout(warn: { mock: { calls: unknown[][] } }, scope: string) {
  return some(warn.mock.calls, args => includes(JSON.stringify(args), scope));
}

describe("the form's controls", () => {
  afterEach(() => {
    forEach(mounted, wrapper => wrapper.unmount());
    mounted.length = 0;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("draws the control a package registered for its field", async () => {
    registerFormRenderers([
      {
        renderer: ProbeControl,
        tester: (uischema: UISchemaElement) => {
          if (get(uischema, "scope") === PROBE) return 10;
          return -1;
        }
      }
    ]);

    const wrapper = await draw(Form, PROBE);

    expect(wrapper.find('[data-test-key="probe-control"]').exists()).toBe(true);
  });

  it("warns in development about a field no control claims, naming the field", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await draw(Form, UNCLAIMED);

    expect(warnedAbout(warn, UNCLAIMED)).toBe(true);
  });

  it("stays quiet about that field in a production build", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);
    vi.resetModules();
    const production = await import("../../index");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await draw(production.Form, UNCLAIMED);

    expect(warnedAbout(warn, UNCLAIMED)).toBe(false);
  });
});
