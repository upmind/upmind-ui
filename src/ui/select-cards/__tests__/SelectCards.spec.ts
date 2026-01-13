import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import SelectCards from "../SelectCards.ce.vue";

describe("SelectCards", () => {
  it("renders correctly", () => {
    const wrapper = mount(SelectCards, {
      global: {
        directives: {
          IntersectionObserver: {}
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
