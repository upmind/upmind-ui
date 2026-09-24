/**
 * @fileoverview useBrandTheme selection and apply.
 *
 * ## Job To Be Done
 * Pick the brand's theme when it exists, else fall back, and hand it to the engine.
 *
 * ## What Breaks If These Fail
 * A brand paints unthemed, on base tokens, with no signal pointing at the cause.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readInChildOfProvider } from "../../__tests__/component-context";
import {
  resetHeadlessStub,
  setBrand,
  setThemes
} from "../../__tests__/headless.stub";
import { provideThemeEngine, useBrandConfig, useBrandTheme } from "../../index";
import type { ThemeEngine } from "../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("../../__tests__/headless.stub");
  return createHeadlessStub();
});

const AURORA = { id: "aurora", name: "Aurora" };
const MIDNIGHT = { id: "midnight", name: "Midnight" };

const lastWarning = (spy: { mock: { lastCall?: unknown[] } }) =>
  (spy.mock.lastCall ?? []).map(String).join(" ");

describe("useBrandTheme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    resetHeadlessStub();
    useBrandConfig().invalidate();
  });

  it("lists the ids of the themes headless resolved", () => {
    setThemes([AURORA, MIDNIGHT]);

    const { available, themes } = useBrandTheme();

    expect(available.value).toEqual(["aurora", "midnight"]);
    expect(themes.value).toEqual([AURORA, MIDNIGHT]);
  });

  it("reports the theme bundle through meta", () => {
    setBrand({ id: "brand-eu", name: "brand-eu", isAvailable: true });
    setThemes([AURORA]);

    expect(useBrandTheme().meta.value).toEqual({
      isAvailable: true,
      hasThemes: true
    });
  });

  it("selects the brand's own theme when the bundle has it", () => {
    setBrand({
      id: "brand-eu",
      name: "brand-eu",
      isAvailable: true,
      themeId: "midnight"
    });
    setThemes([AURORA, MIDNIGHT]);

    expect(useBrandTheme().selected.value).toBe("midnight");
  });

  it("falls back to the first available theme when the brand's is missing", () => {
    setBrand({
      id: "brand-eu",
      name: "brand-eu",
      isAvailable: true,
      themeId: "retired"
    });
    setThemes([AURORA, MIDNIGHT]);

    expect(useBrandTheme().selected.value).toBe("aurora");
  });

  it("falls back to the first available theme when the brand names none", () => {
    setThemes([MIDNIGHT, AURORA]);

    expect(useBrandTheme().selected.value).toBe("midnight");
  });

  it("falls back to the default theme when no theme is available", () => {
    setBrand({
      id: "brand-eu",
      name: "brand-eu",
      isAvailable: true,
      themeId: "midnight"
    });
    setThemes([]);

    expect(useBrandTheme().selected.value).toBe("default");
  });

  it("hands the selection to the injected engine on apply", () => {
    setBrand({
      id: "brand-eu",
      name: "brand-eu",
      isAvailable: true,
      themeId: "midnight"
    });
    setThemes([AURORA, MIDNIGHT]);

    const engine: ThemeEngine = { set: vi.fn() };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    readInChildOfProvider(
      () => provideThemeEngine(engine),
      () => useBrandTheme().apply()
    );

    expect(engine.set).toHaveBeenCalledWith("midnight");
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns the theme away instead of throwing when no engine is provided", () => {
    setThemes([AURORA]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => useBrandTheme().apply()).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(lastWarning(warn)).toContain('theme "aurora"');
    expect(lastWarning(warn)).toContain("provideThemeEngine");
  });

  it("names the brand's own theme in the warning it drops", () => {
    setBrand({
      id: "brand-eu",
      name: "brand-eu",
      isAvailable: true,
      themeId: "midnight"
    });
    setThemes([AURORA, MIDNIGHT]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    useBrandTheme().apply();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(lastWarning(warn)).toContain('theme "midnight"');
  });
});
