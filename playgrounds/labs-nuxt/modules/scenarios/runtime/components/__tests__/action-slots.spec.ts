// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 ActionSlots draws each action WHERE THE SCENARIO PLACED IT.
 *
 * ## Job To Be Done
 * Placement is a declaration (`ActionPlacementTypes` on the scenario's own
 * action), and this component is the only thing that reads it. Two failures
 * matter: an action the scenario placed beside the row hiding in the overflow,
 * and an action reachable nowhere at all.
 *
 * ## What Breaks If These Fail
 * A scenario's declared presentation stops being what the operator sees, and
 * the overflow becomes a place actions go to disappear.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionPlacementTypes } from "../../scenario.types";
import { ActionSlots } from "../index";
import { OVERFLOW_TRIGGER_TEST_VALUE } from "./control-test-values";
import { kebabCase } from "lodash-es";
import type { ActionSlotItem } from "../ActionSlots.types";

// -----------------------------------------------------------------------------

const beside: ActionSlotItem = {
  name: "remove",
  label: "Remove",
  placement: ActionPlacementTypes.VISIBLE,
  onSelect: vi.fn()
};

const behind: ActionSlotItem = {
  name: "setDefault",
  label: "Set as default",
  placement: ActionPlacementTypes.OVERFLOW,
  onSelect: vi.fn()
};

function mountAttached(actions: ActionSlotItem[]) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return mount(ActionSlots, { attachTo: host, props: { actions } });
}

/**
 * `Button.ce.vue` derives its test value from the rendered LABEL when a caller
 * supplies no explicit `dataAttrs` — the coupling `control-test-values.ts`
 * documents for the surfaces.
 */
const testValue = (item: ActionSlotItem) => kebabCase(item.label);

const menuItem = (item: ActionSlotItem) =>
  document.querySelectorAll(
    `[role="menuitem"] [data-test-value="${testValue(item)}"]`
  ).length;

async function openOverflow(wrapper: ReturnType<typeof mountAttached>) {
  await wrapper
    .find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`)
    .trigger("click");
  await new Promise(resolve => setTimeout(resolve, 0));
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

// -----------------------------------------------------------------------------

describe("@AC3 ActionSlots — the declared placement is the placement drawn", () => {
  it("draws a VISIBLE action beside the row", () => {
    const wrapper = mountAttached([beside, behind]);

    expect(
      wrapper.find(`[data-test-value="${testValue(beside)}"]`).exists()
    ).toBe(true);
  });

  it("keeps an OVERFLOW action out of the always-visible slot", () => {
    const wrapper = mountAttached([beside, behind]);

    expect(
      wrapper.find(`[data-test-value="${testValue(behind)}"]`).exists()
    ).toBe(false);
  });

  it("reaches the OVERFLOW action once the trigger is opened", async () => {
    const wrapper = mountAttached([beside, behind]);

    await openOverflow(wrapper);

    expect(menuItem(behind)).toBeGreaterThan(0);
  });

  it("falls an unplaced action to the overflow rather than dropping it", async () => {
    const unplaced: ActionSlotItem = {
      name: "verify",
      label: "Verify",
      onSelect: vi.fn()
    };
    const wrapper = mountAttached([unplaced]);

    await openOverflow(wrapper);

    expect(menuItem(unplaced)).toBeGreaterThan(0);
  });

  it("renders no overflow trigger when every action is placed beside the row", () => {
    const wrapper = mountAttached([beside]);

    expect(
      wrapper
        .find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`)
        .exists()
    ).toBe(false);
  });
});

describe("@AC3 ActionSlots — the control fires the action's own handler", () => {
  it("fires onSelect from the always-visible slot", async () => {
    const onSelect = vi.fn();
    const wrapper = mountAttached([{ ...beside, onSelect }]);

    await wrapper
      .find(`[data-test-value="${testValue(beside)}"]`)
      .trigger("click");

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("fires onSelect from the overflow", async () => {
    const onSelect = vi.fn();
    const wrapper = mountAttached([{ ...behind, onSelect }]);

    await openOverflow(wrapper);
    document
      .querySelector(
        `[role="menuitem"] [data-test-value="${testValue(behind)}"]`
      )
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not fire a disabled action", async () => {
    const onSelect = vi.fn();
    const wrapper = mountAttached([{ ...beside, disabled: true, onSelect }]);

    await wrapper
      .find(`[data-test-value="${testValue(beside)}"]`)
      .trigger("click");

    expect(onSelect).not.toHaveBeenCalled();
  });
});
