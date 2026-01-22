import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import InputGroup from "../InputGroup.vue";

describe("InputGroup", () => {
  it("renders correctly", () => {
    const wrapper = mount(InputGroup);
    expect(wrapper.exists()).toBe(true);
  });
});
