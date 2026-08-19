import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { UpmForm } from "@upmind-automation/client-vue";
import { FormFlowSurface } from "../index";

const schema = { type: "object", properties: { name: { type: "string" } } };
const uischema = { type: "VerticalLayout", elements: [] };
const model = { name: "Ada" };

function mountForm() {
  const set = vi.fn();
  const resolve = vi.fn();
  const wrapper = mount(FormFlowSurface, {
    props: {
      snapshot: {
        actions: ["set", "resolve"],
        context: { schema, uischema, model },
        meta: {}
      },
      actions: { set, resolve }
    }
  });
  return { wrapper, set, resolve };
}

describe("@AC3 FormFlowSurface — projects context.{schema,uischema,model} via UpmForm", () => {
  it("binds the descriptor's schema, uischema and model onto UpmForm", () => {
    const { wrapper } = mountForm();
    const upmForm = wrapper.findComponent(UpmForm);

    expect(upmForm.exists()).toBe(true);
    expect(upmForm.props("schema")).toEqual(schema);
    expect(upmForm.props("uischema")).toEqual(uischema);
    expect(upmForm.props("modelValue")).toEqual(model);
  });

  it("routes update:model-value to the set action", async () => {
    const { wrapper, set } = mountForm();
    const upmForm = wrapper.findComponent(UpmForm);

    await upmForm.vm.$emit("update:modelValue", { name: "Grace" });

    expect(set).toHaveBeenCalledWith({ name: "Grace" });
  });

  it("routes resolve to the resolve action", async () => {
    const { wrapper, resolve } = mountForm();
    const upmForm = wrapper.findComponent(UpmForm);

    await upmForm.vm.$emit("resolve", model);

    expect(resolve).toHaveBeenCalledTimes(1);
  });
});
