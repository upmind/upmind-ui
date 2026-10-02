// -----------------------------------------------------------------------------
/**
 * @fileoverview The form translator's pattern example.
 *
 * ## Job To Be Done
 * A `pattern` error reads with a value the user can copy: the regex is swapped
 * for the smallest string that matches it.
 *
 * ## What Breaks If These Fail
 * The user sees a regex, or an example that does not match it, in the error text.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import { useI18n } from "@upmind-automation/headless";
import { Form } from "../../index";
import { forEach, map } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const catalogue = createI18n({ legacy: false, locale: "en" });
const localisation = useI18n();
localisation.init(
  catalogue,
  import.meta.glob("../../../../i18n/src/**/*-en.json", { eager: true })
);
await localisation.loadLocaleMessages("en");

const FIELD = "postcode";

const MESSAGE = `[data-test-value="${FIELD}"] [data-test-key="form-item-message"]`;

const EXAMPLE = /\(e\.g\. (.*)\)$/;

const UISCHEMA: UISchemaElement = {
  type: "VerticalLayout",
  elements: [{ type: "Control", scope: `#/properties/${FIELD}` }]
};

const mounted: VueWrapper[] = [];

function schemaFor(pattern: string): JsonSchema7 {
  return {
    type: "object",
    properties: { [FIELD]: { type: "string", title: "Postcode", pattern } }
  };
}

async function messagesFor(pattern: string): Promise<string[]> {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Form, {
          schema: schemaFor(pattern),
          uischema: UISCHEMA,
          modelValue: { [FIELD]: " " },
          noActions: true,
          touched: true
        })
    }),
    { attachTo: document.body, global: { plugins: [catalogue] } }
  );
  mounted.push(wrapper);
  await new Promise(resolve => setTimeout(resolve, 150));
  return map(wrapper.findAll(MESSAGE), node => node.text());
}

async function exampleFor(pattern: string): Promise<string | undefined> {
  const [message] = await messagesFor(pattern);
  return EXAMPLE.exec(message ?? "")?.[1];
}

// -----------------------------------------------------------------------------

describe("the form translator's pattern example", () => {
  afterEach(() => {
    forEach(mounted, wrapper => wrapper.unmount());
    mounted.length = 0;
  });

  it("shows an example that matches the regex, not the regex itself", async () => {
    const regex = "^[A-Z]{2}-\\d{3,5}$";

    const messages = await messagesFor(regex);

    expect(messages).toHaveLength(1);
    expect(messages[0]).not.toContain(regex);
    expect(EXAMPLE.exec(messages[0] ?? "")?.[1]).toMatch(new RegExp(regex));
  });

  it("takes the smallest choice at every repeat, class and branch", async () => {
    expect(await exampleFor("^[b-d]{2,4}(xy|z)\\d+$")).toBe("bbxy0");
  });

  it("gives the same example every time the error is drawn", async () => {
    const regex = "^[a-f0-9]{4,8}\\.[a-z]*$";

    const first = await exampleFor(regex);
    const second = await exampleFor(regex);

    expect(first).toBe(second);
    expect(first).toMatch(new RegExp(regex));
  });
});
