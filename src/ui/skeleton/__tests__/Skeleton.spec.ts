import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Skeleton from "../Skeleton.ce.vue";

describe("Skeleton", () => {
  it("renders correctly", () => {
    const wrapper = mount(Skeleton);
    expect(wrapper.exists()).toBe(true);
  });
});
