import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Image from "../Image.ce.vue";

describe("Image", () => {
  it("renders correctly", () => {
    const wrapper = mount(Image);
    expect(wrapper.exists()).toBe(true);
  });
});
