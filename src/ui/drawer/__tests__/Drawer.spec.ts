import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Drawer from "../Drawer.ce.vue";

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Drawer", () => {
  it("renders correctly", () => {
    const wrapper = mount(Drawer, {
      global: {
        stubs: {
          teleport: true
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
