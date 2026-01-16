import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "../Button.vue";

describe("Button", () => {
  it("renders correctly", () => {
    const wrapper = mount(Button);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find("button").exists()).toBe(true);
    expect(wrapper.attributes("data-testid")).toBe("button");
  });

  it("renders slot content", () => {
    const wrapper = mount(Button, {
      slots: {
        default: "Click me"
      }
    });
    expect(wrapper.text()).toBe("Click me");
  });

  it("applies custom classes", () => {
    const wrapper = mount(Button, {
      props: {
        class: "custom-class"
      }
    });
    expect(wrapper.classes()).toContain("custom-class");
  });

  it("renders as a different element when 'as' prop is provided", () => {
    const wrapper = mount(Button, {
      props: {
        as: "a"
      }
    });
    expect(wrapper.find("a").exists()).toBe(true);
  });

  it("emits click event when clicked", async () => {
    const wrapper = mount(Button);

    await wrapper.find("button").trigger("click");

    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("respects disabled state", async () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      }
    });

    const button = wrapper.find("button");
    expect(button.attributes("disabled")).toBeDefined();

    // Click should not emit when disabled
    await button.trigger("click");
    expect(wrapper.emitted("click")).toBeFalsy();
  });

  it("renders with different variants", () => {
    const wrapper = mount(Button, {
      props: {
        variant: "primary"
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("renders with different sizes", () => {
    const wrapper = mount(Button, {
      props: {
        size: "lg"
      }
    });

    expect(wrapper.exists()).toBe(true);
  });
});
