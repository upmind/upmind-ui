import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Spinner from "../Spinner.ce.vue";

describe("Spinner", () => {
  it("renders correctly", () => {
    const wrapper = mount(Spinner);
    expect(wrapper.exists()).toBe(true);
  });
});
