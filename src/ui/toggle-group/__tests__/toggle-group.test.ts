/**
 * @module ui/toggle-group/__tests__/toggle-group
 * @description The composed `ToggleGroup`'s own contract: positions declared as
 * props, a single pressed position tracking the model, and the un-press that
 * publishes `undefined` — the label-less tri-state's clear.
 */

import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { map } from "lodash-es";
import type { ToggleGroupItem } from "../types";

const ITEMS: ToggleGroupItem[] = [
  { value: "true", label: "Bounced" },
  { value: "false", label: "Not bounced" }
];

const POSITION = "button";

let barrel: typeof import("../../../index");

beforeAll(async () => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: "",
    fillRect: () => {}
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  barrel = await import("../../../index");
});

describe("toggle-group", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  const mountGroup = (modelValue?: string) =>
    mount(barrel.ToggleGroup, {
      props: { type: "single", items: ITEMS, modelValue },
      attachTo: document.body
    });

  it("resolves from the package barrel", () => {
    expect(barrel.ToggleGroup).toBeTruthy();
  });

  it("draws one position per declared item, labelled from the item", () => {
    wrapper = mountGroup();

    expect(map(wrapper.findAll(POSITION), node => node.text())).toEqual(
      map(ITEMS, "label")
    );
  });

  it("presses the position the model names, and only that one", () => {
    wrapper = mountGroup("false");

    expect(
      map(wrapper.findAll(POSITION), node => node.attributes("data-state"))
    ).toEqual(["off", "on"]);
  });

  it("presses nothing while the model carries no position", () => {
    wrapper = mountGroup();

    expect(
      map(wrapper.findAll(POSITION), node => node.attributes("data-state"))
    ).toEqual(["off", "off"]);
  });

  it("publishes the position's own value when an unpressed one is pressed", async () => {
    wrapper = mountGroup();

    await wrapper.findAll(POSITION)[0].trigger("click");

    expect(wrapper.emitted("update:modelValue")).toEqual([["true"]]);
  });

  it("publishes undefined when the pressed position is pressed again", async () => {
    wrapper = mountGroup("true");

    await wrapper.findAll(POSITION)[0].trigger("click");

    expect(wrapper.emitted("update:modelValue")).toEqual([[undefined]]);
  });
});
