import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Form from "../Form.ce.vue";

describe("Form", () => {
  it("renders correctly", () => {
    const wrapper = mount(Form);
    expect(wrapper.exists()).toBe(true);
  });
});
