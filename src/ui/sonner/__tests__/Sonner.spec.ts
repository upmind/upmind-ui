import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Sonner from "../Sonner.ce.vue";

describe("Sonner", () => {
  it("renders correctly", () => {
    const wrapper = mount(Sonner);
    expect(wrapper.exists()).toBe(true);
  });
});
