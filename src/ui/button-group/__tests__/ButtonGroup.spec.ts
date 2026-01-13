import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ButtonGroup from "../ButtonGroup.ce.vue";

describe("ButtonGroup", () => {
  it("renders correctly", () => {
    const wrapper = mount(ButtonGroup);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.attributes("role")).toBe("group");
  });
});
