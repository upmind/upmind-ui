// -----------------------------------------------------------------------------
/**
 * @module tests/form-dialog-cancel
 * @description Cancel in a DIALOG has to dismiss it.
 *
 * Every dialog-hosted form took its "Cancel" from the engine's own `reset`
 * action, so the button rendered `type="reset"`: pressing it emptied the
 * fields and left the dialog standing, and only the X ever closed it. The FE
 * walkthrough found it on "Add new address"; it was every one of the
 * registry's dialog forms, which all pass `resetLabel: CANCEL_LABEL`.
 *
 * The seam is `cancelLabel`: present, the control is a plain button that emits
 * `cancel` and lets the HOST decide what closing means; absent, reset stays. A
 * form on a PAGE must keep reset — there, cancelling an edit means putting the
 * old values back, and the billing-settings page relies on it.
 *
 * Asserted on the rendered button, not on the action map: `type="reset"` is
 * the browser behaviour that caused the bug, so it is the thing to pin.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { find, map, size } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import PortalForm from "~/portal/modules/form/Form.vue";

const SCHEMA = {
  type: "object" as const,
  properties: { name: { type: "string" as const, title: "Name" } }
};

const BASE = {
  schema: SCHEMA,
  model: { name: "" },
  submit: "thing-save",
  submitLabel: "Save",
  resetLabel: "Cancel"
};

/** The engine renders asynchronously, so the buttons arrive a tick late. */
async function render(props: Record<string, unknown>): Promise<VueWrapper> {
  const wrapper = mount(PortalForm, { props: { ...BASE, ...props } });
  await new Promise(resolve => setTimeout(resolve, 300));
  return wrapper;
}

const buttonsOf = (wrapper: VueWrapper) =>
  map(wrapper.findAll("button"), button => ({
    type: button.attributes("type"),
    label: button.text().trim()
  }));

describe("a form on a page keeps its reset control", () => {
  it("renders Cancel as a reset, which is what undoes an edit", async () => {
    const buttons = buttonsOf(await render({}));
    expect(find(buttons, { label: "Cancel" })?.type).toBe("reset");
    expect(find(buttons, { label: "Save" })?.type).toBe("submit");
  });
});

describe("a form in a dialog dismisses instead of resetting", () => {
  it("renders Cancel as a plain button, so it cannot empty the fields", async () => {
    const buttons = buttonsOf(await render({ cancelLabel: "Cancel" }));
    expect(find(buttons, { label: "Cancel" })?.type).toBe("button");
    expect(find(buttons, { type: "reset" })).toBeUndefined();
    expect(find(buttons, { label: "Save" })?.type).toBe("submit");
  });

  it("emits cancel when pressed, and carries no verb with it", async () => {
    const wrapper = await render({ cancelLabel: "Cancel" });
    const cancel = find(wrapper.findAll("button"), button =>
      button.text().includes("Cancel")
    );

    await cancel?.trigger("click");

    expect(size(wrapper.emitted("cancel"))).toBe(1);
    // A dismiss says nothing about the entity: no action goes out with it.
    expect(wrapper.emitted("select")).toBeUndefined();
  });

  it("offers exactly one way out beside the config's own controls", async () => {
    const buttons = buttonsOf(
      await render({
        cancelLabel: "Cancel",
        extraActions: [{ value: "regenerate", label: "Regenerate" }]
      })
    );
    expect(find(buttons, { label: "Regenerate" })).toBeDefined();
    expect(size(map(buttons, "label"))).toBe(3);
  });
});
