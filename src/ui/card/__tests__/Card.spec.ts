import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Card from "../Card.ce.vue";

describe("Card", () => {
  it("renders correctly", () => {
    const wrapper = mount(Card);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders slot content", () => {
    const wrapper = mount(Card, {
      slots: {
        default: "Card Content"
      }
    });
    expect(wrapper.text()).toContain("Card Content");
  });
});
