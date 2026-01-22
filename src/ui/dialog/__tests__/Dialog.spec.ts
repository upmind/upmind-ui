import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Dialog from "../Dialog.ce.vue";

// Need to ensure ResizeObserver is present or mocked if Dialog relies on it.
// jsdom doesn't have ResizeObserver.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Dialog", () => {
  it("renders correctly", () => {
    const wrapper = mount(Dialog, {
      global: {
        stubs: {
          teleport: true
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
