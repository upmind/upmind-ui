// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC The inspector defaults CLOSED and honours what the user
 * last left it as (P1-R4)
 *
 * ## Job To Be Done
 * The panel opened on every page load, on every page. The wanted behaviour is a
 * preference, not a default: closed on a first visit, and thereafter whatever
 * the user last chose — surviving the reload that made the defect visible.
 *
 * ## How the reload is reproduced
 * The registry is a module-scope singleton and the preference is read from
 * storage when that module initialises, so a reload is `vi.resetModules()` plus
 * a fresh import over the storage the previous boot left behind. Storage is
 * never seeded by hand and no storage key is named here: the only writer is the
 * composable's own `toggle`, which is what makes this a round trip rather than
 * an assertion mirroring its own setup.
 *
 * ## What Breaks If These Fail
 * Either the panel is back on every refresh, or a developer who opens it loses
 * it on the next navigation.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const SECTION = {
  key: "inspector-open-state",
  factory: () => ({ name: "Client emails", meta: { isLoading: false } })
};

let wrapper: VueWrapper | undefined;

/** A fresh boot of the app over whatever storage the previous boot left. */
async function boot() {
  wrapper?.unmount();
  wrapper = undefined;
  vi.resetModules();
  const { Inspector, useInspector } = await import("../index");
  const inspector = useInspector();
  inspector.clear();
  inspector.add(SECTION);
  wrapper = mount(Inspector);
  await wrapper.vm.$nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));

  return inspector;
}

const isPanelRendered = () =>
  document.body.querySelectorAll('[data-test-key="sheet-content"]').length > 0;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
});

// -----------------------------------------------------------------------------

describe("@AC the first visit gets a closed inspector (P1-R4)", () => {
  it("boots closed against empty storage and renders no panel", async () => {
    const inspector = await boot();

    expect(inspector.isOpen.value).toBe(false);
    expect(isPanelRendered()).toBe(false);
  });

  it("stays closed across a reload nobody opened it in", async () => {
    await boot();
    const inspector = await boot();

    expect(inspector.isOpen.value).toBe(false);
    expect(isPanelRendered()).toBe(false);
  });
});

describe("@AC a reload restores what the user left (P1-R4)", () => {
  it("comes back open, with the panel rendered, after the user opened it", async () => {
    const first = await boot();
    first.toggle();
    await wrapper!.vm.$nextTick();

    const second = await boot();

    expect(second.isOpen.value).toBe(true);
    expect(isPanelRendered()).toBe(true);
  });

  it("comes back closed after the user closed it again", async () => {
    const first = await boot();
    first.toggle();
    await wrapper!.vm.$nextTick();

    const second = await boot();
    second.toggle();
    await wrapper!.vm.$nextTick();

    const third = await boot();

    expect(third.isOpen.value).toBe(false);
    expect(isPanelRendered()).toBe(false);
  });

  it("does not resurrect a preference from a cleared store", async () => {
    const first = await boot();
    first.toggle();
    await wrapper!.vm.$nextTick();

    localStorage.clear();
    const second = await boot();

    expect(second.isOpen.value).toBe(false);
    expect(isPanelRendered()).toBe(false);
  });
});
