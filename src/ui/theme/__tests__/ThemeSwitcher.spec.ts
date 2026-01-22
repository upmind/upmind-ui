import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ThemeSwitcher from "../ThemeSwitcher.vue";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
});

describe("ThemeSwitcher", () => {
  it("renders correctly", () => {
    const wrapper = mount(ThemeSwitcher, {
      global: {
        provide: {
          uiConfig: {
            activeTheme: { value: "light" },
            themes: { value: { light: { label: "Light", value: "light" } } }
          }
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
