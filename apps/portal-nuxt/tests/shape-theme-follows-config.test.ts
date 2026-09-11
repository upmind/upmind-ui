import { defineTheme, themes } from "@upmind/tokens";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readRoot,
  resetDocument,
  settle,
  stubMatchMedia
} from "./support/theme-harness";
import { PORTAL_CONFIG_ID } from "~/portal/config";

/**
 * The other half of tests/shape-theme-ignored.test.ts: that `data-theme`
 * FOLLOWS the config rather than being fixed. One shipped shape cannot show
 * that on its own (config/index.ts, 2026-08-28), so this re-themes the shape's
 * own config module and mounts the real layout against it.
 *
 * Its own file deliberately: `vi.resetModules()` gives each case a fresh
 * module graph but never stops the previous one, and `useTheme`'s module-level
 * watchEffect writes `data-theme` from whichever graph is alive — so a
 * real-config mount beside this one wins the attribute and the mock reads as
 * ignored.
 *
 * The stand-in is a dark-first theme, which is also what keeps the mode half
 * of the assertion from going vacuous.
 */
const RETHEMED = "aurora";

/** Read off the tokens package, never restated here. */
const prefersDark = (theme: string) =>
  themes.find(candidate => candidate.name === theme)?.preferredMode === "dark";

describe("app/layouts/default.vue — the applied theme follows the config", () => {
  afterEach(() => {
    vi.doUnmock("~/portal/config/hostgrid");
    vi.resetModules();
    Reflect.deleteProperty(globalThis, "useRoute");
    Reflect.deleteProperty(globalThis, "useRouter");
    resetDocument();
  });

  it("the stand-in is dark-first, so the mode half below is not vacuous", () => {
    expect(prefersDark(RETHEMED)).toBe(true);
  });

  it("re-theming the shape moves the attribute and the mode with it", async () => {
    vi.resetModules();
    vi.doMock("~/portal/config/hostgrid", () => ({
      hostgridTheme: defineTheme({
        name: RETHEMED,
        label: "Aurora",
        preferredMode: "dark"
      }),
      hostgridConfig: {
        theme: RETHEMED,
        primitives: {},
        content: {},
        groups: [],
        customAreas: []
      }
    }));

    resetDocument();
    stubMatchMedia();
    Object.assign(globalThis, {
      useRoute: () => ({
        path: "/",
        query: { config: PORTAL_CONFIG_ID.HOSTGRID }
      }),
      useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        afterEach: vi.fn()
      })
    });

    const { default: DefaultLayout } = await import("~/layouts/default.vue");
    const wrapper = mount(DefaultLayout);
    await settle();

    expect(readRoot()).toEqual({ theme: RETHEMED, isDarkClass: true });
    wrapper.unmount();
  });
});
