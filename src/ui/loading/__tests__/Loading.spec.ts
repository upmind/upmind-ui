import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Loading from "../Loading.ce.vue";

describe("Loading", () => {
  it("renders correctly", () => {
    const wrapper = mount(Loading);
    expect(wrapper.exists()).toBe(true);
  });
});
