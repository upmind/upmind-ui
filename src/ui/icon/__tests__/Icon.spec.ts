import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Icon from "../Icon.ce.vue";

describe("Icon", () => {
  it("renders correctly", () => {
    const wrapper = mount(Icon, {
      props: {
        icon: "check"
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
