/**
 * @fileoverview useBrandTheme selection + apply — ADR 023 §2 brand→theme selection
 *
 * ## Job To Be Done
 * Prove the brand→theme selection glue §2 assigns to `foundation`: read the
 * available themes from `headless`, pick the brand's own theme when the brand
 * ships one that exists, fall back down the chain when it does not, and hand the
 * pick to the `ui`-layer theme engine through the port rather than reaching into
 * it.
 *
 * ## What Breaks If These Fail
 * A brand whose configured theme is missing from the bundle paints an unthemed
 * cart instead of the next best theme; a selection that never reaches the engine
 * leaves every primitive on base tokens, so the brand's colour and font never
 * apply.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readInChildOfProvider } from "../../../__tests__/component-context";
import {
  resetHeadlessStub,
  setBrand,
  setThemes
} from "../../../__tests__/headless.stub";
import {
  provideThemeEngine,
  useBrandConfig,
  useBrandTheme
} from "../../../index";
import type { ThemeEngine } from "../../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } =
    await import("../../../__tests__/headless.stub");
  return createHeadlessStub();
});

const AURORA = { id: "aurora", name: "Aurora" };
const MIDNIGHT = { id: "midnight", name: "Midnight" };

describe("useBrandTheme", () => {
  beforeEach(() => {
    resetHeadlessStub();
    // The brand cache is keyed by brand id (§10 Axis 1), so re-configuring the
    // SAME id without busting it would replay the previous case's theme.
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

    readInChildOfProvider(
      () => provideThemeEngine(engine),
      () => useBrandTheme().apply()
    );

    expect(engine.set).toHaveBeenCalledWith("midnight");
  });

  it("applies silently when no engine is provided", () => {
    setThemes([AURORA]);

    expect(() => useBrandTheme().apply()).not.toThrow();
  });
});
