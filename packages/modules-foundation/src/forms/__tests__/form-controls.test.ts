/**
 * @fileoverview The form draws the registered controls, and the engine's notice on a field with none.
 *
 * ## Job To Be Done
 * A field draws the control its package registered. A field no control claims
 * shows the form engine's own "No applicable renderer found." notice, so the
 * gap is visible on the page.
 *
 * ## What Breaks If These Fail
 * A domain, gateway or address field draws the engine default, or a field
 * whose package never loaded disappears without a word.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import { Form, registerFormRenderers } from "../../index";
import { forEach, get } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { VueWrapper } from "@vue/test-utils";

const catalogue = createI18n({ legacy: false, locale: "en" });

const PROBE = "#/properties/probe";
const UNCLAIMED = "#/properties/unclaimed";
const ENGINE_NOTICE = "No applicable renderer found.";

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

async function draw(scope: string): Promise<VueWrapper> {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Form, {
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

describe("the form's controls", () => {
  afterEach(() => {
    forEach(mounted, wrapper => wrapper.unmount());
    mounted.length = 0;
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

    const wrapper = await draw(PROBE);

    expect(wrapper.find('[data-test-key="probe-control"]').exists()).toBe(true);
  });

  it("shows the engine's notice on a field no control claims", async () => {
    const wrapper = await draw(UNCLAIMED);

    expect(wrapper.text()).toContain(ENGINE_NOTICE);
  });
});
