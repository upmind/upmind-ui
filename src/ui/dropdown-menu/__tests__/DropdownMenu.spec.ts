import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DropdownMenu from "../DropdownMenu.ce.vue";

describe("DropdownMenu", () => {
  it("renders correctly", () => {
    const wrapper = mount(DropdownMenu, {
      props: {
        items: []
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
