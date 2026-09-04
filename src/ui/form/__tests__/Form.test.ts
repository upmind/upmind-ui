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
  it("allows editing a rendered string input", async () => {
    const wrapper = mount(Form, {
      props: { schema, uischema, modelValue: { name: "a" } }
    });
    const input = wrapper.find("input");

    expect(input.exists()).toBe(true);
    expect(wrapper.emitted("update:uischema")).toBeUndefined();
    await input.setValue("ab");
    await nextTick();

    const updates = wrapper.emitted("update:modelValue")!;
    expect(updates.at(-1)).toEqual([{ name: "ab" }]);
    expect(wrapper.find("input").element.value).toBe("ab");
  });

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

describe("Form uischema", () => {
  const i18n = {
    locale: "en",
    translate: (key: string, fallback: string) => {
      if (key === "form.name") return { label: "", placeholder: null };
      return fallback;
    },
    translateError: (error: { message: string }) => error.message
  };
  const decorated = () => ({
    type: "VerticalLayout",
    elements: [
      { type: "Control", scope: "#/properties/name", i18n: "form.name" }
    ]
  });
  const options = (jsonforms: ReturnType<typeof mountForm>["jsonforms"]) =>
    toRaw(jsonforms.props("uischema")).elements[0].options;

  it("keeps the same uischema while the user edits the form", async () => {
    const { jsonforms } = mountForm({ name: "a" });
    const initialUischema = toRaw(jsonforms.props("uischema"));

    jsonforms.vm.$emit("change", { data: { name: "ab" }, errors: [] });
    await nextTick();

    expect(toRaw(jsonforms.props("uischema"))).toBe(initialUischema);
  });

  it("hands JSON Forms a decorated clone and leaves the parent's object alone", () => {
    const parent = decorated();
    const before = JSON.stringify(parent);
    const wrapper = mount(Form, {
      props: { schema, uischema: parent, modelValue: { name: "a" }, i18n },
      global: { stubs: { JsonForms: true } }
    });
    const jsonforms = wrapper.findComponent({ name: "JsonForms" });

    expect(JSON.stringify(parent)).toBe(before);
    expect(toRaw(jsonforms.props("uischema"))).not.toBe(parent);
    expect(options(jsonforms).label).toBe("");
  });

  it("keeps the decoration when schema and uischema change in one update", async () => {
    const wrapper = mount(Form, {
      props: { schema, uischema: decorated(), modelValue: { name: "a" }, i18n },
      global: { stubs: { JsonForms: true } }
    });
    const jsonforms = wrapper.findComponent({ name: "JsonForms" });

    await wrapper.setProps({ schema: { ...schema }, uischema: decorated() });
    await nextTick();

    expect(options(jsonforms).label).toBe("");
  });

  it("emits the generated uischema when none is provided", async () => {
    const generatedUischema = {
      type: "VerticalLayout",
      elements: [{ type: "Control", scope: "#/properties/name" }]
    };
    const wrapper = mount(Form, {
      props: { schema, modelValue: { name: "a" } },
      global: {
        stubs: {
          JsonForms: {
            name: "JsonForms",
            data: () => ({ uischemaToUse: generatedUischema }),
            template: "<div />"
          }
        }
      }
    });

    await nextTick();

    const emittedUischema = wrapper.emitted("update:uischema")![0][0] as any;
    expect(emittedUischema.elements[0].options).toEqual({});
    expect(generatedUischema.elements[0]).not.toHaveProperty("options");
  });
});
