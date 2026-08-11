import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionSlots } from "../index";
import { OVERFLOW_TRIGGER_TEST_VALUE } from "./control-test-values";
import type { ActionSlotItem } from "../ActionSlots.types";

const actionItems: ActionSlotItem[] = [
  { name: "resend", label: "Resend", onSelect: vi.fn() },
  { name: "delete", label: "Delete", onSelect: vi.fn() }
];

function mountAttached() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const wrapper = mount(ActionSlots, {
    attachTo: host,
    props: { actions: actionItems }
  });
  return { wrapper, host };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("@AC3 ActionSlots — every action reachable in all three placements", () => {
  it("reaches every action in the always-visible placement", () => {
    const { wrapper } = mountAttached();

    for (const action of actionItems) {
      expect(wrapper.find(`[data-test-value="${action.name}"]`).exists()).toBe(
        true
      );
    }
  });

  it("reaches every action in the overflow placement once opened", async () => {
    const { wrapper } = mountAttached();

    await wrapper
      .find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`)
      .trigger("click");
    await new Promise(r => setTimeout(r, 0));

    for (const action of actionItems) {
      expect(
        document.querySelectorAll(
          `[role="menuitem"] [data-test-value="${action.name}"]`
        ).length
      ).toBeGreaterThan(0);
    }
  });

  it("fires the action's own onSelect from the always-visible slot", async () => {
    const onSelect = vi.fn();
    const { wrapper } = mountAttached();
    wrapper.setProps({
      actions: [{ name: "resend", label: "Resend", onSelect }]
    });
    await wrapper.vm.$nextTick();

    await wrapper.find('[data-test-value="resend"]').trigger("click");

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
