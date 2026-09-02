import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick, toRaw } from "vue";
import Form from "../Form.ce.vue";

const schema = {
  type: "object",
  properties: { name: { type: "string" } }
};
const uischema = {
  type: "VerticalLayout",
  elements: [{ type: "Control", scope: "#/properties/name" }]
};

function mountForm(modelValue: Record<string, any>) {
  const wrapper = mount(Form, {
    props: { schema, uischema, modelValue },
    global: { stubs: { JsonForms: true } }
  });
  const jsonforms = wrapper.findComponent({ name: "JsonForms" });
  return { wrapper, jsonforms };
}

describe("Form model", () => {
  it("emits update:modelValue once per change", async () => {
    const { wrapper, jsonforms } = mountForm({ name: "a" });
    const data = { name: "ab" };

    jsonforms.vm.$emit("change", { data, errors: [] });
    await nextTick();

    expect(wrapper.emitted("update:modelValue")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")![0]).toEqual([data]);
  });

  it("keeps the data JSON Forms holds when the parent echoes an equal model", async () => {
    const { wrapper, jsonforms } = mountForm({ name: "a" });
    const data = { name: "ab" };
    jsonforms.vm.$emit("change", { data, errors: [] });
    await nextTick();
    expect(toRaw(jsonforms.props("data"))).toBe(data);

    await wrapper.setProps({ modelValue: { name: "ab" } });
    expect(toRaw(jsonforms.props("data"))).toBe(data);
  });

  it("takes a model from the parent when its content differs", async () => {
    const { wrapper, jsonforms } = mountForm({ name: "a" });
    const changed = { name: "zzz" };

    await wrapper.setProps({ modelValue: changed });

    expect(toRaw(jsonforms.props("data"))).toBe(changed);
  });
});
