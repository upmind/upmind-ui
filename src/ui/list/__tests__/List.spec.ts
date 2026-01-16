import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import List from "../List.ce.vue";

describe("List", () => {
  it("renders correctly", () => {
    const wrapper = mount(List, {
      props: {
        items: []
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
