import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Label from "../Label.vue";

describe("Label", () => {
  it("renders correctly", () => {
    const wrapper = mount(Label);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders slot content", () => {
    const wrapper = mount(Label, {
      slots: {
        default: "Email Address"
      }
    });
    expect(wrapper.text()).toBe("Email Address");
  });
});
