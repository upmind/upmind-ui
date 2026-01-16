import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Link from "../Link.ce.vue";

describe("Link", () => {
  it("renders correctly", () => {
    const wrapper = mount(Link, {
      props: {
        label: "Link"
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
