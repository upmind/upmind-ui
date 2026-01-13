import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Separator from "../Separator.ce.vue";

describe("Separator", () => {
  it("renders correctly", () => {
    const wrapper = mount(Separator);
    expect(wrapper.exists()).toBe(true);
  });
});
