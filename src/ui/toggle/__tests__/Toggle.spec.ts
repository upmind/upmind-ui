import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Toggle from "../Toggle.ce.vue";

describe("Toggle", () => {
  it("renders correctly", () => {
    const wrapper = mount(Toggle);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders button element", () => {
    const wrapper = mount(Toggle);
    const button = wrapper.find("button");
    expect(button.exists()).toBe(true);
  });

  it("respects disabled state", () => {
    const wrapper = mount(Toggle, {
      props: {
        disabled: true
      }
    });

    const button = wrapper.find("button");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("accepts modelValue prop", () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: true
      }
    });

    expect(wrapper.props("modelValue")).toBe(true);
  });
});
