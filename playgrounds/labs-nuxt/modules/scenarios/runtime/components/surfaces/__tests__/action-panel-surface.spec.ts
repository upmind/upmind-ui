import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { UpmForm } from "@upmind-automation/client-vue";
import { ActionPanelSurface } from "../index";

describe("@AC3 ActionPanelSurface — one slot per action", () => {
  it("renders a slot for every snapshot action", () => {
    const wrapper = mount(ActionPanelSurface, {
      props: {
        snapshot: { actions: ["resend", "delete"], context: {}, meta: {} },
        actions: { resend: vi.fn(), delete: vi.fn() }
      }
    });

    expect(wrapper.find('[data-test-value="resend"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-value="delete"]').exists()).toBe(true);
  });

  it("fires the matching live action when a slot is activated", async () => {
    const resend = vi.fn();
    const wrapper = mount(ActionPanelSurface, {
      props: {
        snapshot: { actions: ["resend"], context: {}, meta: {} },
        actions: { resend }
      }
    });

    await wrapper.find('[data-test-value="resend"]').trigger("click");

    expect(resend).toHaveBeenCalledTimes(1);
  });
});

describe("@AC3 ActionPanelSurface — input form driven by context.{schema,uischema,model}", () => {
  const schema = {
    type: "object",
    properties: { subject: { type: "string" } }
  };
  const uischema = { type: "VerticalLayout", elements: [] };
  const model = { subject: "hello" };

  function mountPanel(actionNames: string[], context: Record<string, unknown>) {
    const fns = Object.fromEntries(actionNames.map(name => [name, vi.fn()]));
    const wrapper = mount(ActionPanelSurface, {
      props: {
        snapshot: { actions: actionNames, context, meta: {} },
        actions: fns
      }
    });
    return { wrapper, fns };
  }

  it("has no input form when context.schema is absent", () => {
    const { wrapper } = mountPanel(["resend"], {});

    expect(wrapper.findComponent(UpmForm).exists()).toBe(false);
  });

  it("renders the input form from context.schema/uischema/model when context.schema is present", () => {
    const { wrapper } = mountPanel(["add", "resend"], {
      schema,
      uischema,
      model
    });
    const upmForm = wrapper.findComponent(UpmForm);

    expect(upmForm.exists()).toBe(true);
    expect(upmForm.props("schema")).toEqual(schema);
    expect(upmForm.props("uischema")).toEqual(uischema);
    expect(upmForm.props("modelValue")).toEqual(model);
  });

  it("routes the form's update:modelValue to the set action", async () => {
    const { wrapper, fns } = mountPanel(["add", "set"], {
      schema,
      uischema,
      model
    });
    const upmForm = wrapper.findComponent(UpmForm);

    await upmForm.vm.$emit("update:modelValue", { subject: "world" });

    expect(fns.set).toHaveBeenCalledWith({ subject: "world" });
  });

  it("routes the form's resolve to the resolve action with the model", async () => {
    const { wrapper, fns } = mountPanel(["add", "resolve"], {
      schema,
      uischema,
      model
    });
    const upmForm = wrapper.findComponent(UpmForm);

    await upmForm.vm.$emit("resolve", model);

    expect(fns.resolve).toHaveBeenCalledWith(model);
  });

  it("renders exactly one input form regardless of action count — no per-action schema map", () => {
    const { wrapper } = mountPanel(["add", "resend", "delete", "resolve"], {
      schema,
      uischema,
      model
    });

    expect(wrapper.findAllComponents(UpmForm)).toHaveLength(1);
  });
});
