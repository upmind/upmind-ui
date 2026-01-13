import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Tooltip from "../Tooltip.ce.vue";

describe("Tooltip", () => {
  it("renders correctly", () => {
    const wrapper = mount(Tooltip);
    expect(wrapper.exists()).toBe(true);
  });
});
