import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Lineclamp from "../Lineclamp.ce.vue";

describe("Lineclamp", () => {
  it("renders correctly", () => {
    const wrapper = mount(Lineclamp, {
      slots: {
        default: "Text content"
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
