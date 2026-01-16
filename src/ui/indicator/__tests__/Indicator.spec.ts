import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Indicator from "../Indicator.ce.vue";

describe("Indicator", () => {
  it("renders correctly", () => {
    const wrapper = mount(Indicator);
    expect(wrapper.exists()).toBe(true);
  });
});
