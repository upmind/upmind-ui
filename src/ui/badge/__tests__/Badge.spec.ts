import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Badge from "../Badge.vue";

describe("Badge", () => {
  it("renders correctly", () => {
    const wrapper = mount(Badge);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders slot content", () => {
    const wrapper = mount(Badge, {
      slots: {
        default: "New"
      }
    });
    expect(wrapper.text()).toBe("New");
  });
});
