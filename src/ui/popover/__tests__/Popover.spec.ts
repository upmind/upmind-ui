import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Popover from "../Popover.vue";

describe("Popover", () => {
  it("renders correctly", () => {
    const wrapper = mount(Popover);
    expect(wrapper.exists()).toBe(true);
  });
});
