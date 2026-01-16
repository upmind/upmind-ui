import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Breadcrumb from "../Breadcrumb.ce.vue";

describe("Breadcrumb", () => {
  it("renders correctly", () => {
    const wrapper = mount(Breadcrumb);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find("nav").exists()).toBe(true);
    expect(wrapper.find("nav").attributes("aria-label")).toBe("breadcrumb");
  });
});
