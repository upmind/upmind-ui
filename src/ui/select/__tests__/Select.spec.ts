import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Select from "../Select.ce.vue";

describe("Select", () => {
  it("renders correctly", () => {
    const wrapper = mount(Select);
    expect(wrapper.exists()).toBe(true);
  });

  it("accepts items prop", () => {
    const items = [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" }
    ];

    const wrapper = mount(Select, {
      props: {
        items
      }
    });

    expect(wrapper.props("items")).toEqual(items);
  });

  it("respects disabled state", () => {
    const wrapper = mount(Select, {
      props: {
        items: [],
        disabled: true
      }
    });

    expect(wrapper.props("disabled")).toBe(true);
  });

  it("accepts placeholder prop", () => {
    const wrapper = mount(Select, {
      props: {
        items: [],
        placeholder: "Select an option"
      }
    });

    expect(wrapper.props("placeholder")).toBe("Select an option");
  });
});
