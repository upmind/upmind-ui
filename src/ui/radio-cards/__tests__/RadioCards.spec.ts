import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RadioCards from "../RadioCards.ce.vue";

describe("RadioCards", () => {
  it("renders correctly", () => {
    const wrapper = mount(RadioCards);
    expect(wrapper.exists()).toBe(true);
  });
});
