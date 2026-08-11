/**
 * @module ui/button-group/__tests__/button-group
 * @description The composed `ButtonGroup`'s selected-position contract: an item
 * declared `active` announces itself pressed, so a group standing in for a
 * single-select control says which position it is on rather than only looking
 * like it.
 */

import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { ButtonGroup as ButtonGroupTypes } from "../types";
import { map } from "lodash-es";
import type { ButtonGroupItem } from "../types";

const POSITIONS = ["All", "Yes", "No"];

const items = (activeIndex?: number): ButtonGroupItem[] =>
  map(POSITIONS, (label, index) => ({
    type: ButtonGroupTypes.Button,
    active: index === activeIndex,
    props: { label }
  }));

let barrel: typeof import("../../../index");

beforeAll(async () => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: "",
    fillRect: () => {}
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  barrel = await import("../../../index");
});

describe("button-group", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  const pressedStates = () =>
    map(wrapper?.findAll("button") ?? [], node =>
      node.attributes("aria-pressed")
    );

  it("draws one position per declared item, labelled from the item", () => {
    wrapper = mount(barrel.ButtonGroup, { props: { items: items(1) } });

    expect(map(wrapper.findAll("button"), node => node.text())).toEqual(
      POSITIONS
    );
  });

  it("announces the active item as pressed, and every other as not", () => {
    wrapper = mount(barrel.ButtonGroup, { props: { items: items(1) } });

    expect(pressedStates()).toEqual(["false", "true", "false"]);
  });

  it("announces no position pressed when no item is active", () => {
    wrapper = mount(barrel.ButtonGroup, { props: { items: items() } });

    expect(pressedStates()).toEqual(["false", "false", "false"]);
  });

  it("invokes only the pressed item's own handler", async () => {
    const yes = vi.fn();
    const no = vi.fn();
    const declared = items(0);
    declared[1].handler = yes;
    declared[2].handler = no;

    wrapper = mount(barrel.ButtonGroup, { props: { items: declared } });
    await wrapper.findAll("button")[1].trigger("click");

    expect(yes).toHaveBeenCalledTimes(1);
    expect(no).not.toHaveBeenCalled();
  });
});
