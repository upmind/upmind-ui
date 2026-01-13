import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Tabs from "../Tabs.ce.vue";

describe("Tabs", () => {
  it("renders correctly", () => {
    const wrapper = mount(Tabs, {
      props: {
        defaultValue: "tab1",
        tabs: [
          { value: "tab1", label: "Tab 1", content: "Content 1" },
          { value: "tab2", label: "Tab 2", content: "Content 2" }
        ]
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
