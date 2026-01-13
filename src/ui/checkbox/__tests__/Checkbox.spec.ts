import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Checkbox from "../Checkbox.vue";

describe("Checkbox", () => {
  it("renders correctly", () => {
    const wrapper = mount(Checkbox);
    expect(wrapper.exists()).toBe(true);
  });

  it("toggles state when clicked", async () => {
    const wrapper = mount(Checkbox, {
      props: {
        checked: false
      }
    });

    // Radix checkbox renders a button with role="checkbox"
    await wrapper.find('[role="checkbox"]').trigger("click");

    expect(wrapper.emitted("update:checked")).toBeTruthy();
  });

  it("respects disabled state", async () => {
    const wrapper = mount(Checkbox, {
      props: {
        disabled: true,
        checked: false
      }
    });

    const checkbox = wrapper.find('[role="checkbox"]');
    expect(checkbox.attributes("data-disabled")).toBeDefined();

    // Attempt to click - should not emit
    await checkbox.trigger("click");
    expect(wrapper.emitted("update:checked")).toBeFalsy();
  });

  it("renders with checked state", () => {
    const wrapper = mount(Checkbox, {
      props: {
        checked: true
      }
    });

    const checkbox = wrapper.find('[role="checkbox"]');
    expect(checkbox.attributes("data-state")).toBe("checked");
  });

  it("renders with unchecked state", () => {
    const wrapper = mount(Checkbox, {
      props: {
        checked: false
      }
    });

    const checkbox = wrapper.find('[role="checkbox"]');
    expect(checkbox.attributes("data-state")).toBe("unchecked");
  });

  it("supports indeterminate state", () => {
    const wrapper = mount(Checkbox, {
      props: {
        checked: "indeterminate"
      }
    });

    const checkbox = wrapper.find('[role="checkbox"]');
    expect(checkbox.attributes("data-state")).toBe("indeterminate");
  });
});
