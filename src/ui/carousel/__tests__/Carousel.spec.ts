import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Carousel from "../Carousel.vue";

// Mock embla-carousel-vue
vi.mock("embla-carousel-vue", () => ({
  default: () => [vi.fn(), vi.fn()]
}));

describe("Carousel", () => {
  it("renders correctly", () => {
    const wrapper = mount(Carousel);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.attributes("role")).toBe("region");
  });
});
