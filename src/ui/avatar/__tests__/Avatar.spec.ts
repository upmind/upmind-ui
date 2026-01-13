import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
// Import directly from .ce.vue but we might need to mock subcomponents if they prevent rendering in test
import Avatar from "../Avatar.ce.vue";
import { vi } from "vitest";

// Mock internal components if needed, or ensure they render simply
vi.mock("../AvatarFallback.vue", () => ({
  default: { template: "<div>Fallback</div>" }
}));
vi.mock("../AvatarImage.vue", () => ({ default: { template: "<img />" } }));

describe("Avatar", () => {
  it("renders correctly", () => {
    const wrapper = mount(Avatar);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders with image and fallback mock", () => {
    // Since Avatar uses internal components (AvatarImage, AvatarFallback) which might depend on Radix,
    // we can mount it and check if it renders without errors.
    // Ideally we would mock the complex sub-components if testing interaction, but for now we verify rendering.
    const wrapper = mount(Avatar, {
      props: {
        src: "https://example.com/avatar.png",
        alt: "User Avatar"
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
