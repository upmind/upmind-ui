import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Interstitial from "../Interstitial.ce.vue";

describe("Interstitial", () => {
  it("renders correctly", () => {
    const wrapper = mount(Interstitial);
    expect(wrapper.exists()).toBe(true);
  });
});
