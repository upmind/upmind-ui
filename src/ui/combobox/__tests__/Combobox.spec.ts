import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Combobox from "../Combobox.ce.vue";

describe("Combobox", () => {
  it("renders correctly", () => {
    const wrapper = mount(Combobox, {
      props: {
        items: []
      }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("respects disabled state", () => {
    const wrapper = mount(Combobox, {
      props: {
        items: [],
        disabled: true
      }
    });

    expect(wrapper.props("disabled")).toBe(true);
  });

  it("accepts placeholder prop", () => {
    const wrapper = mount(Combobox, {
      props: {
        items: [],
        placeholder: "Search..."
      }
    });

    expect(wrapper.props("placeholder")).toBe("Search...");
  });
});
