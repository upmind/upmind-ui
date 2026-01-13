import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Sanitized from "../Sanitized.vue";

describe("Sanitized", () => {
  it("renders correctly", () => {
    const wrapper = mount(Sanitized, {
      props: {
        modelValue: "<p>Test</p>"
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
