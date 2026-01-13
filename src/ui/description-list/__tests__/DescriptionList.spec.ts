import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DescriptionList from "../DescriptionList.ce.vue";

describe("DescriptionList", () => {
  it("renders correctly", () => {
    const wrapper = mount(DescriptionList, {
      props: {
        items: []
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
