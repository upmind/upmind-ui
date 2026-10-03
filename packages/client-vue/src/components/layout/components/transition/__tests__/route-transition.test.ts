// -----------------------------------------------------------------------------
/**
 * @fileoverview The route transition wrapper inside the app-owned page templates.
 *
 * ## Job To Be Done
 * The wrapper renders one element and shares one transition store with the header.
 *
 * ## What Breaks If These Fail
 * An extra wrapper breaks the layout's flex `grow` chain, or the header animates out of step.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import type { VNode } from "vue";

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = await importOriginal<Record<string, unknown>>();
  const { computed: derive } = await import("vue");

  return {
    ...real,
    useConfig: () => ({
      ui: { basketAction: { isHidden: false } },
      data: {},
      meta: derive(() => ({}))
    }),
    useRoutingEngine: () => ({
      meta: derive(() => ({ isResolved: true }))
    })
  };
});

const { default: Transitions } = await import("../Transition.vue");
const { useRouteTransition } =
  await import("../../../../../modules/system/useRouteTransition");

// -----------------------------------------------------------------------------

const WRAPPER_CLASSES = ["flex", "w-full", "grow", "flex-col"];

function mountWrapper(child: VNode) {
  return mount(Transitions, {
    slots: { default: () => child },
    global: { stubs: { transition: false } }
  });
}

function inComponent<T>(use: () => T): T {
  let handle: T | undefined;

  mount(
    defineComponent({
      setup() {
        handle = use();
        return () => null;
      }
    })
  );

  return handle as T;
}

// -----------------------------------------------------------------------------

describe("the wrapper the templates now carry", () => {
  it("renders one element of its own, with the classes it had", () => {
    const wrapper = mountWrapper(h("main", { id: "page" }));

    const root = wrapper.element as HTMLElement;

    expect(root.tagName).toBe("DIV");

    const missing = WRAPPER_CLASSES.filter(
      name => !root.classList.contains(name)
    );

    expect(
      missing,
      `the wrapper no longer carries the flex chain the layout's grow runs ` +
        `through: ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("wraps its content once, and adds nothing between", () => {
    const wrapper = mountWrapper(h("main", { id: "page" }));

    const root = wrapper.element as HTMLElement;

    expect(root.children).toHaveLength(1);
    expect(root.children[0].id).toBe("page");
    expect(wrapper.findAll("div")).toHaveLength(1);
  });

  it("renders its content, not a placeholder for it", () => {
    expect(mountWrapper(h("p", "checkout")).text()).toBe("checkout");
  });
});

describe("the state the wrapper shares with the header and the route view", () => {
  it("hands every call site the same refs, not a copy each", () => {
    const first = inComponent(useRouteTransition);
    const second = inComponent(useRouteTransition);

    expect(second.shouldShow).toBe(first.shouldShow);
    expect(second.shouldTransition).toBe(first.shouldTransition);
  });

  it("carries a value written at one call site to another", () => {
    const writer = inComponent(useRouteTransition);
    const reader = inComponent(useRouteTransition);

    writer.shouldShow.value = false;
    expect(reader.shouldShow.value).toBe(false);

    writer.shouldShow.value = true;
    expect(reader.shouldShow.value).toBe(true);
  });

  it("delivers the wrapper's enter event to a subscriber taken elsewhere", () => {
    const header = inComponent(useRouteTransition);
    const template = inComponent(useRouteTransition);
    const heard: boolean[] = [];

    const unsubscribe = header.onTransition(value => heard.push(value));

    template.shouldTransition.value = true;
    template.onEnter();

    expect(heard).toEqual([true]);

    unsubscribe();
    template.shouldTransition.value = true;
    template.onEnter();

    expect(heard).toEqual([true]);
  });

  it("raises nothing while no transition is in flight", () => {
    const header = inComponent(useRouteTransition);
    const template = inComponent(useRouteTransition);
    const heard: boolean[] = [];

    const unsubscribe = header.onTransition(value => heard.push(value));

    template.shouldTransition.value = false;
    template.onEnter();

    expect(heard).toEqual([]);
    unsubscribe();
  });

  it("clears both flags on reset, for every call site at once", async () => {
    const writer = inComponent(useRouteTransition);
    const reader = inComponent(useRouteTransition);

    writer.shouldShow.value = true;
    writer.shouldTransition.value = true;

    writer.reset();
    await nextTick();

    expect(reader.shouldShow.value).toBe(false);
    expect(reader.shouldTransition.value).toBe(false);
  });
});
