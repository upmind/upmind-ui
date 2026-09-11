// -----------------------------------------------------------------------------
/**
 * @module tests/form-module
 * @description Plan F1: ONE `form` module wraps the design system's JSON
 * Forms engine, and everything it does for the portal is visible from
 * outside it — a control per schema property, the schema's own titles as
 * labels (F8: no `i18n`, so a key never reaches a label), and a `select`
 * emit spelling `<submit>:<json>` where the tail is the EDITED model.
 *
 * The schema, uischema and model below are caller-supplied inputs, not
 * recorded data: the engine takes them from whoever mounts it, and these
 * exercise the module's own contract rather than any seeded entity.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { map } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { FormModuleProps } from "~/portal/modules/form/types";
import Form from "~/portal/modules/form/Form.vue";

const SUBMIT_LABEL = "Save changes";

const RESET_LABEL = "Cancel";

const SCHEMA = {
  type: "object",
  required: ["displayName", "contactEmail"],
  properties: {
    displayName: { type: "string", title: "Display name", minLength: 1 },
    contactEmail: { type: "string", title: "Contact email", format: "email" }
  }
};

/** The `i18n` key is authored exactly as the real schemas author it (F8's subject). */
const UISCHEMA = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/displayName",
      i18n: "form.display_name"
    },
    { type: "Control", scope: "#/properties/contactEmail" }
  ]
};

const OPENING_MODEL = {
  displayName: "Personal card",
  contactEmail: "ada@example.com"
};

const SINGLE_FIELD_SCHEMA = {
  type: "object",
  required: ["displayName"],
  properties: {
    displayName: { type: "string", title: "Display name", minLength: 1 }
  }
};

/** JSON Forms resolves its renderers asynchronously; the DS's own tests wait the same way. */
const settle = (ms = 150): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

async function mountForm(
  overrides: Partial<FormModuleProps> = {}
): Promise<VueWrapper> {
  const wrapper = mount(Form, {
    props: {
      schema: SCHEMA,
      uischema: UISCHEMA,
      model: OPENING_MODEL,
      submit: "profile-save",
      submitLabel: SUBMIT_LABEL,
      resetLabel: RESET_LABEL,
      ...overrides
    }
  });
  await settle();
  return wrapper;
}

/** A control, by the accessible name the caller supplied — never by a class. */
function control(wrapper: VueWrapper, label: string) {
  return wrapper
    .findAll("button")
    .find(button => button.text().trim() === label);
}

function field(wrapper: VueWrapper, property: string) {
  return wrapper.get(`[data-test-value="${property}"] input`);
}

/** The one emitted value, split at the verb it belongs to. */
function emittedTail(wrapper: VueWrapper, submit: string): unknown {
  const emitted = wrapper.emitted("select");
  expect(emitted).toHaveLength(1);
  const value = String(emitted?.[0]?.[0]);
  expect(value.startsWith(`${submit}:`)).toBe(true);
  return JSON.parse(value.slice(submit.length + 1));
}

describe("form module — F1: one wrapper, one verb, one JSON tail", () => {
  it("renders one control per schema property, labelled by the schema's own titles", async () => {
    const wrapper = await mountForm();

    const items = wrapper.findAll('[data-test-key="form-item"]');
    expect(map(items, item => item.attributes("data-test-value"))).toEqual([
      "display-name",
      "contact-email"
    ]);
    expect(
      wrapper.get('[data-test-value="display-name"] label').text()
    ).toContain("Display name");
    expect(
      wrapper.get('[data-test-value="contact-email"] label').text()
    ).toContain("Contact email");
  });

  it("prints the schema title verbatim where the uischema names an i18n key (F8)", async () => {
    const wrapper = await mountForm();

    const label = wrapper.get('[data-test-value="display-name"] label').text();
    expect(label).toContain("Display name");
    expect(label).not.toContain("form.display_name");
    expect(wrapper.text()).not.toContain("form.display_name");
  });

  it("submitting an edit emits `select` once, carrying the EDITED model as JSON", async () => {
    const wrapper = await mountForm();

    await field(wrapper, "display-name").setValue("Everyday card");
    await field(wrapper, "contact-email").setValue("grace@example.com");
    await settle();
    await control(wrapper, SUBMIT_LABEL)?.trigger("click");
    await settle();

    expect(emittedTail(wrapper, "profile-save")).toEqual({
      displayName: "Everyday card",
      contactEmail: "grace@example.com"
    });
  });

  it("appends the JSON tail to a submit that ALREADY carries its entity id", async () => {
    const wrapper = await mountForm({
      schema: SINGLE_FIELD_SCHEMA,
      uischema: undefined,
      model: { displayName: "Personal card" },
      submit: "payment-method-rename:pm-1"
    });

    await field(wrapper, "display-name").setValue("Everyday card");
    await settle();
    await control(wrapper, SUBMIT_LABEL)?.trigger("click");
    await settle();

    expect(wrapper.emitted("select")).toEqual([
      ['payment-method-rename:pm-1:{"displayName":"Everyday card"}']
    ]);
  });

  it("refuses an invalid model: nothing is emitted and the field says why", async () => {
    const wrapper = await mountForm();

    await field(wrapper, "display-name").setValue("");
    await field(wrapper, "contact-email").setValue("not-an-address");
    await settle();
    await control(wrapper, SUBMIT_LABEL)?.trigger("click");
    await settle();

    expect(wrapper.emitted("select")).toBeUndefined();
    const messages = wrapper.findAll('[data-test-key="form-item-message"]');
    expect(
      map(messages, message => message.attributes("data-test-value"))
    ).toContain("contact-email");
    expect(
      wrapper
        .get('[data-test-value="contact-email"] input')
        .attributes("aria-invalid")
    ).toBe("true");
  });

  it("reset restores the model the form opened with, and emits nothing of its own", async () => {
    const wrapper = await mountForm();

    await field(wrapper, "display-name").setValue("Everyday card");
    await settle();
    await control(wrapper, RESET_LABEL)?.trigger("click");
    await settle();

    expect(wrapper.emitted("select")).toBeUndefined();
    expect(
      (field(wrapper, "display-name").element as HTMLInputElement).value
    ).toBe(OPENING_MODEL.displayName);

    await control(wrapper, SUBMIT_LABEL)?.trigger("click");
    await settle();

    expect(emittedTail(wrapper, "profile-save")).toEqual(OPENING_MODEL);
  });

  it("readonly offers no submit — a form shown for reference cannot be sent", async () => {
    const wrapper = await mountForm({ readonly: true });

    expect(control(wrapper, SUBMIT_LABEL)).toBeUndefined();
    expect(wrapper.findAll('[data-test-key="form-item"]').length).toBe(2);
  });
});
