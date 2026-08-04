import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ActionPanelSurface } from "../index";

describe("@AC3 ActionPanelSurface — one slot per action", () => {
  it("renders a slot for every snapshot action", () => {
    const wrapper = mount(ActionPanelSurface, {
      props: {
        snapshot: { actions: ["resend", "delete"], context: {}, meta: {} },
        actions: { resend: vi.fn(), delete: vi.fn() }
      }
    });

    expect(wrapper.find('[data-test-value="resend"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-value="delete"]').exists()).toBe(true);
  });

  it("fires the matching live action when a slot is activated", async () => {
    const resend = vi.fn();
    const wrapper = mount(ActionPanelSurface, {
      props: {
        snapshot: { actions: ["resend"], context: {}, meta: {} },
        actions: { resend }
      }
    });

    await wrapper.find('[data-test-value="resend"]').trigger("click");

    expect(resend).toHaveBeenCalledTimes(1);
  });
});
