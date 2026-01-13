import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Textarea from "../Textarea.ce.vue";

describe("Textarea", () => {
  it("renders correctly", () => {
    const wrapper = mount(Textarea);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find("textarea").exists()).toBe(true);
  });

  it("emits update:modelValue on input", async () => {
    const wrapper = mount(Textarea, {
      props: {
        modelValue: ""
      }
    });

    await wrapper.find("textarea").setValue("new value");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["new value"]);
  });

  it("respects disabled state", () => {
    const wrapper = mount(Textarea, {
      props: {
        disabled: true
      }
    });

    const textarea = wrapper.find("textarea");
    expect(textarea.attributes("disabled")).toBeDefined();
  });

  it("renders with placeholder", () => {
    const wrapper = mount(Textarea, {
      props: {
        placeholder: "Enter your message"
      }
    });

    const textarea = wrapper.find("textarea");
    expect(textarea.attributes("placeholder")).toBe("Enter your message");
  });

  it("respects rows prop", () => {
    const wrapper = mount(Textarea, {
      props: {
        rows: 5
      }
    });

    const textarea = wrapper.find("textarea");
    expect(textarea.attributes("rows")).toBe("5");
  });

  it("respects readonly state", () => {
    const wrapper = mount(Textarea, {
      props: {
        readonly: true
      }
    });

    const textarea = wrapper.find("textarea");
    expect(textarea.attributes("readonly")).toBeDefined();
  });
});
