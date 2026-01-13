import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Markdown from "../Markdown.ce.vue";

describe("Markdown", () => {
  it("renders correctly", () => {
    const wrapper = mount(Markdown, {
      props: {
        content: "# Hello"
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
