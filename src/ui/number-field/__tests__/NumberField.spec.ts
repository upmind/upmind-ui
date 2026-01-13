import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import NumberField from "../NumberField.ce.vue";

describe("NumberField", () => {
  it("renders correctly", () => {
    const wrapper = mount(NumberField);
    expect(wrapper.exists()).toBe(true);
  });

  it("respects disabled state", () => {
    const wrapper = mount(NumberField, {
      props: {
        disabled: true
      }
    });

    const input = wrapper.find("input");
    expect(input.attributes("disabled")).toBeDefined();
  });
});
