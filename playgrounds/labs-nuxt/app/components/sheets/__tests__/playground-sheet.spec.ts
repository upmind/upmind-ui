// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module sheets/__tests__/playground-sheet.spec
 * @description T3.1 — the Inspector's registry, kept; its open state, moved to
 * the url (`AC3.1` · `AC3.2` · `P1-R4` · `P1-R12`). Four claims:
 *   1. the `register({key, factory})` + unmount-cleanup registry is preserved
 *      verbatim — that registry IS what makes Debug page-scoped, and a
 *      `persistent` caller (the layout's own session section) is the one
 *      lifetime it does not bound;
 *   2. `sheet=` / `tab=` on the url WIN — a pasted link opens what it names,
 *      whatever the last visit left in the preference (`S11`);
 *   3. absent them, the existing open preference decides, and it survives a
 *      reload (`P1-R4`);
 *   4. a page with no registered sections offers no toggle at all — the gate is
 *      `hasSections`, so nothing renders a control over an empty sheet.
 *
 * A reload is `vi.resetModules()` plus a fresh import over the storage and the
 * url the previous boot left: the registry is a module-scope singleton, so a
 * surviving one would answer the next case from the last case's state. No
 * storage key is named here — the only writer is the composable's own `open` /
 * `close`, which is what makes the preference case a round trip rather than an
 * assertion mirroring its own setup.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { PlaygroundSheetTypes } from "../usePlaygroundSheet.types";
import { map } from "lodash-es";
import type { PlaygroundSheetState } from "../usePlaygroundSheet.types";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const BOOT_PATH = "/useClientEmails/";

const PAGE_SECTION = "client-emails";

const LAYOUT_SECTION = "useAuth-session";

/** What a page hands the host — the section shape the Debug pane already draws. */
const sectionFor = (key: string, isLoading = false) => ({
  key,
  factory: () => ({ name: key, meta: { isLoading } })
});

let mounted: VueWrapper[] = [];

async function boot(query = ""): Promise<PlaygroundSheetState> {
  window.history.replaceState({}, "", `${BOOT_PATH}${query}`);
  vi.resetModules();
  const { usePlaygroundSheet } = await import("../usePlaygroundSheet");

  return usePlaygroundSheet();
}

/**
 * A page that registers a section in its own `setup`, so the registry's
 * `onUnmounted` cleanup is reached the way a real page reaches it.
 */
function page(
  sheet: PlaygroundSheetState,
  key: string,
  persistent?: boolean
): VueWrapper {
  const wrapper = mount(
    defineComponent({
      setup() {
        sheet.register(sectionFor(key), persistent);
        return () => h("div");
      }
    })
  );
  mounted.push(wrapper);

  return wrapper;
}

const sectionNames = (sheet: PlaygroundSheetState) =>
  map(sheet.sections.value, "name");

/**
 * The preference is written by a watcher, so a boot that follows an `open` /
 * `close` in the same tick would read the storage the PREVIOUS choice left.
 */
const settle = async () => {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * The same boot with a page already on screen. A sheet is a view OF a page's
 * sections, so the open-state cases are driven from the state a real url
 * reaches — a registered page — rather than from an empty registry the toggle
 * itself is gated off (`P1-R4`).
 */
async function bootPage(query = ""): Promise<PlaygroundSheetState> {
  const sheet = await boot(query);
  page(sheet, PAGE_SECTION);

  return sheet;
}

beforeEach(() => {
  localStorage.clear();
  mounted = [];
});

afterEach(() => {
  for (const wrapper of mounted) wrapper.unmount();
  mounted = [];
});

// -----------------------------------------------------------------------------

describe("T3.1 the registry the Inspector already had (AC3.2 · P1-R12)", () => {
  it("holds a section the moment a page registers it", async () => {
    const sheet = await boot();
    page(sheet, PAGE_SECTION);

    expect(sectionNames(sheet)).toEqual([PAGE_SECTION]);
    expect(sheet.hasSections.value).toBe(true);
  });

  it("drops it again when that page unmounts — the whole of page scope", async () => {
    const sheet = await boot();
    const client = page(sheet, PAGE_SECTION);

    client.unmount();

    expect(sectionNames(sheet)).toEqual([]);
    expect(sheet.hasSections.value).toBe(false);
  });

  it("leaves a section registered on a caller's own terms alone — the layout's outlives a page change", async () => {
    const sheet = await boot();
    page(sheet, LAYOUT_SECTION, true);
    const client = page(sheet, PAGE_SECTION);

    client.unmount();

    // The two lifetimes are asserted apart: a registry that never cleaned up
    // would keep BOTH, and only the page-scope cases above can see that.
    expect(sectionNames(sheet)).toContain(LAYOUT_SECTION);
  });

  it("holds the factory rather than its result, so a section's values stay live", async () => {
    const sheet = await boot();
    const isLoading = ref(false);
    sheet.add({
      key: PAGE_SECTION,
      factory: () => ({
        name: PAGE_SECTION,
        meta: { isLoading: isLoading.value }
      })
    });

    expect(sheet.sections.value[0]?.meta?.isLoading).toBe(false);
    isLoading.value = true;

    expect(sheet.sections.value[0]?.meta?.isLoading).toBe(true);
  });

  it("removes one section by key, and clears the lot", async () => {
    const sheet = await boot();
    sheet.add(sectionFor(LAYOUT_SECTION));
    sheet.add(sectionFor(PAGE_SECTION));

    sheet.remove(PAGE_SECTION);
    expect(sectionNames(sheet)).toEqual([LAYOUT_SECTION]);

    sheet.clear();
    expect(sectionNames(sheet)).toEqual([]);
  });
});

describe("T3.1 a page with no sections offers no toggle (P1-R4)", () => {
  it("reports no sections to gate a toggle with", async () => {
    const sheet = await boot();

    expect(sheet.hasSections.value).toBe(false);
    expect(sectionNames(sheet)).toEqual([]);
  });

  it("closes the gate again once the registering page has gone", async () => {
    const sheet = await boot();
    const client = page(sheet, PAGE_SECTION);
    expect(sheet.hasSections.value).toBe(true);

    client.unmount();

    expect(sheet.hasSections.value).toBe(false);
  });
});

describe("T3.1 the url wins (AC3.1 · S11)", () => {
  it("opens the sheet the link names", async () => {
    const sheet = await bootPage("?sheet=code");

    expect(sheet.sheet.value).toBe(PlaygroundSheetTypes.CODE);
    expect(sheet.isOpen.value).toBe(true);
  });

  it("opens it on the section the link names", async () => {
    const sheet = await bootPage(`?sheet=scenario&tab=${PAGE_SECTION}`);

    expect(sheet.sheet.value).toBe(PlaygroundSheetTypes.SCENARIO);
    expect(sheet.tab.value).toBe(PAGE_SECTION);
  });

  it("beats a preference that says closed — a pasted link is not a preference", async () => {
    const first = await bootPage();
    first.open();
    first.close();
    await settle();

    const second = await bootPage("?sheet=debug");

    expect(second.isOpen.value).toBe(true);
    expect(second.sheet.value).toBe(PlaygroundSheetTypes.DEBUG);
  });

  it("opens nothing on a page with no sections, however the link is written", async () => {
    const sheet = await boot("?sheet=debug");

    expect(sheet.hasSections.value).toBe(false);
    expect(sheet.isOpen.value).toBe(false);
  });
});

describe("T3.1 absent the url, the preference decides (P1-R4)", () => {
  it("boots closed on a first visit", async () => {
    const sheet = await bootPage();

    expect(sheet.isOpen.value).toBe(false);
    expect(sheet.sheet.value).toBeUndefined();
  });

  it("comes back open after the user opened it", async () => {
    const first = await bootPage();
    first.open();
    await settle();

    const second = await bootPage();

    expect(second.isOpen.value).toBe(true);
  });

  it("comes back closed after the user closed it again", async () => {
    const first = await bootPage();
    first.open();
    await settle();
    const second = await bootPage();
    second.close();
    await settle();

    const third = await bootPage();

    expect(third.isOpen.value).toBe(false);
  });
});
