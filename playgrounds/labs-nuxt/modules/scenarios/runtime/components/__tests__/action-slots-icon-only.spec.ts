// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 beside a row the ICON is the control, and the declared
 * label becomes its tooltip and its accessible name (D5).
 *
 * ## Job To Be Done
 * Icon+label per row spent the row's width on words that repeat down every row.
 * The ruling keeps the declaration exactly as it is — same i18n key, no second
 * vocabulary — and moves what it says: the control draws as its icon, the label
 * rides along as the tooltip and the accessible name. Two things must both hold,
 * or the change is a regression rather than a tightening: the words leave the
 * visible row, and NOTHING loses its name — a screen reader and a hover still
 * get the same sentence the declaration wrote.
 *
 * The collection's own bar is the control case: `Add new` is not beside a row,
 * so it keeps its words.
 *
 * ## What Breaks If These Fail
 * Either the labels come back and the row is a wall of repeated words, or the
 * icons ship unnamed — an unlabelled button, which is worse than the wall.
 */

import { Tooltip } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Icon } from "@upmind-automation/client-vue";
import { ActionPlacementTypes } from "../../scenario.types";
import { ActionSlots } from "../index";
import { OVERFLOW_TRIGGER_TEST_VALUE } from "./control-test-values";
import { find, kebabCase } from "lodash-es";
import type { ActionSlotItem } from "../ActionSlots.types";

// -----------------------------------------------------------------------------

const beside: ActionSlotItem = {
  name: "remove",
  label: "Remove",
  icon: "trash-01",
  placement: ActionPlacementTypes.VISIBLE,
  onSelect: vi.fn()
};

function mountSlots(iconOnly?: boolean) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return mount(ActionSlots, {
    attachTo: host,
    props: { actions: [beside], iconOnly }
  });
}

type Wrapper = ReturnType<typeof mountSlots>;

const control = (wrapper: Wrapper) =>
  wrapper.find(`[data-test-value="${kebabCase(beside.label)}"]`);

/** The glyph inside the control — what is left to read the row by. */
const iconIn = (wrapper: Wrapper) =>
  find(wrapper.findAllComponents(Icon), icon =>
    control(wrapper).element.contains(icon.element)
  );

/** The tooltip this control is wrapped in, found by the label it carries. */
const tooltipFor = (wrapper: Wrapper, label: string) =>
  find(wrapper.findAllComponents(Tooltip), tooltip =>
    tooltip.element.contains(
      wrapper.find(`[data-test-value="${kebabCase(label)}"]`).element
    )
  );

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

// -----------------------------------------------------------------------------

describe("@AC3 a row control draws as its icon and keeps its name (D5)", () => {
  it("takes the words out of the row — the label is present but not shown", () => {
    const button = control(mountSlots(true));

    expect(button.exists()).toBe(true);
    // `sr-only` is the ui Button's own icon-only treatment of the label slot:
    // the accessible name survives, the visible word does not.
    expect(button.find("span.sr-only").text()).toBe(beside.label);
  });

  it("names the icon with the very label the declaration wrote", () => {
    const button = control(mountSlots(true));

    expect(button.attributes("aria-label")).toBe(beside.label);
    expect(button.text()).toContain(beside.label);
  });

  it("offers the same label on hover, through the ui Tooltip", () => {
    const wrapper = mountSlots(true);

    const tooltip = tooltipFor(wrapper, beside.label);
    expect(tooltip?.props("active")).toBe(true);
    expect(tooltip?.props("label")).toBe(beside.label);
  });

  it("draws the declared icon, so something is left to read the control by", () => {
    const wrapper = mountSlots(true);

    expect(iconIn(wrapper)?.props("icon")).toBe(beside.icon);
  });
});

describe("@AC3 away from a row the label still reads (D5)", () => {
  it("keeps the words on a control that is not beside a row", () => {
    const button = control(mountSlots());

    expect(button.find("span.sr-only").exists()).toBe(false);
    expect(button.text()).toContain(beside.label);
  });

  it("raises no tooltip where the label is already on screen", () => {
    const wrapper = mountSlots();

    expect(tooltipFor(wrapper, beside.label)?.props("active")).toBe(false);
  });
});

describe("@AC3 the overflow trigger is named too", () => {
  it("carries an accessible name of its own, icon though it is", () => {
    const wrapper = mount(ActionSlots, {
      attachTo: document.body,
      props: {
        actions: [
          { ...beside, placement: ActionPlacementTypes.OVERFLOW },
          { ...beside, name: "verify", label: "Verify" }
        ],
        iconOnly: true
      }
    });

    const trigger = wrapper.find(
      `[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`
    );
    expect(trigger.attributes("aria-label")).toBeTruthy();
  });
});
