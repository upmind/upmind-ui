import { themes } from "@upmind/tokens";
import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEYS,
  loadTheme,
  readRoot,
  readStorage,
  removeStartViewTransition,
  resetDocument,
  settle,
  stubMatchMedia,
  stubStartViewTransition
} from "./support/theme-harness";
import { APP_BRANDS } from "~/portal/brands";

const ALL_BRANDS = [...themes, ...APP_BRANDS];
const darkFirstBrand = ALL_BRANDS.find(theme => theme.preferredMode === "dark");
const modeAgnosticBrands = ALL_BRANDS.filter(theme => !theme.preferredMode);

describe("useTheme — public surface", () => {
  beforeEach(() => {
    resetDocument();
    stubMatchMedia();
  });

  it("exposes exactly the documented shape", async () => {
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    expect(Object.keys(theme).sort()).toEqual(
      [
        "isDark",
        "mode",
        "options",
        "setTheme",
        "themeName",
        "toggleMode"
      ].sort()
    );
    expect(typeof theme.themeName.value).toBe("string");
    expect(["light", "dark", "auto"]).toContain(theme.mode.value);
    expect(typeof theme.isDark.value).toBe("boolean");
    expect(typeof theme.setTheme).toBe("function");
    expect(typeof theme.toggleMode).toBe("function");
  });

  it("derives one option per available brand — the shipped themes, then the app's own", async () => {
    const { themeOptions, useTheme } = await loadTheme();

    // The app may define its own brands (portal/brands.ts) with the token
    // package's public defineTheme rather than adding them to the package, so
    // the picker is the shipped set PLUS those, in that order — and just the
    // shipped set while the app's own roster stands empty.
    expect(themeOptions.map(option => option.name)).toEqual(
      ALL_BRANDS.map(theme => theme.name)
    );
    expect(themeOptions.length).toBe(themes.length + APP_BRANDS.length);
    expect(useTheme().options).toBe(themeOptions);

    for (const [index, option] of themeOptions.entries()) {
      const source = ALL_BRANDS[index];
      expect(option).toEqual({
        name: source.name,
        label: source.label,
        description: source.description,
        preferredMode: source.preferredMode,
        primary: source.light.primary,
        canvas: source.light.canvas
      });
    }
  });
});

describe("useTheme — setTheme (brand switching)", () => {
  beforeEach(() => {
    resetDocument();
    stubMatchMedia();
  });

  it("applies the brand to <html>, persists it, and reports it", async () => {
    const brand = modeAgnosticBrands[1];
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    theme.setTheme(brand.name);
    await settle();

    expect(readRoot().theme).toBe(brand.name);
    expect(readStorage().theme).toBe(brand.name);
    expect(theme.themeName.value).toBe(brand.name);
  });

  it("applies a dark-first brand's preferredMode on switching to it", async () => {
    expect(darkFirstBrand).toBeDefined();
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    expect(theme.isDark.value).toBe(false);

    theme.setTheme(darkFirstBrand.name);
    await settle();

    expect(theme.mode.value).toBe("dark");
    expect(theme.isDark.value).toBe(true);
    expect(readRoot()).toEqual({
      theme: darkFirstBrand.name,
      isDarkClass: true
    });
    expect(readStorage().mode).toBe("dark");
  });

  it("leaves a deliberate toggle alone when the SAME brand is re-applied", async () => {
    localStorage.setItem(STORAGE_KEYS.theme, darkFirstBrand.name);
    localStorage.setItem(STORAGE_KEYS.mode, "light");
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    expect(theme.themeName.value).toBe(darkFirstBrand.name);
    expect(theme.mode.value).toBe("light");

    // A reload, or the layout's immediate config watch, re-applies the brand
    // already in force. That is not a switch, so the toggle survives.
    theme.setTheme(darkFirstBrand.name);
    await settle();

    expect(theme.mode.value).toBe("light");
    expect(theme.isDark.value).toBe(false);
    expect(readRoot()).toEqual({
      theme: darkFirstBrand.name,
      isDarkClass: false
    });
    expect(readStorage().mode).toBe("light");
  });

  it("re-asserts a dark-first brand's preferredMode on a switch AFTER a deliberate toggle", async () => {
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    theme.toggleMode();
    await settle();
    theme.toggleMode();
    await settle();
    expect(theme.isDark.value).toBe(false);

    theme.setTheme(darkFirstBrand.name);
    await settle();

    expect(theme.mode.value).toBe("dark");
    expect(theme.isDark.value).toBe(true);
    expect(readRoot()).toEqual({
      theme: darkFirstBrand.name,
      isDarkClass: true
    });
    expect(readStorage().mode).toBe("dark");
  });

  it("returns to the dark-first brand dark after a light detour through another brand", async () => {
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    theme.setTheme(darkFirstBrand.name);
    await settle();
    expect(theme.isDark.value).toBe(true);

    theme.toggleMode();
    await settle();
    theme.setTheme(modeAgnosticBrands[0].name);
    await settle();
    expect(theme.isDark.value).toBe(false);

    theme.setTheme(darkFirstBrand.name);
    await settle();

    expect(theme.isDark.value).toBe(true);
    expect(readRoot().isDarkClass).toBe(true);
  });

  it("leaves the mode alone for a brand that declares no preferredMode", async () => {
    localStorage.setItem(STORAGE_KEYS.mode, "dark");
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    expect(theme.isDark.value).toBe(true);

    theme.setTheme(modeAgnosticBrands[0].name);
    await settle();

    expect(theme.mode.value).toBe("dark");
    expect(readRoot()).toEqual({
      theme: modeAgnosticBrands[0].name,
      isDarkClass: true
    });
  });
});

describe("useTheme — toggleMode (light/dark)", () => {
  beforeEach(() => {
    resetDocument();
    stubMatchMedia();
  });

  it("flips to dark, applies .dark and persists the mode", async () => {
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    expect(theme.isDark.value).toBe(false);

    theme.toggleMode();
    await settle();

    expect(theme.mode.value).toBe("dark");
    expect(theme.isDark.value).toBe(true);
    expect(readRoot().isDarkClass).toBe(true);
    expect(readStorage().mode).toBe("dark");
  });

  it("flips back to light and persists that too", async () => {
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    theme.toggleMode();
    await settle();
    theme.toggleMode();
    await settle();

    expect(theme.mode.value).toBe("light");
    expect(theme.isDark.value).toBe(false);
    expect(readRoot().isDarkClass).toBe(false);
    expect(readStorage().mode).toBe("light");
  });
});

describe("useTheme — crossfade fallbacks", () => {
  beforeEach(() => {
    resetDocument();
  });

  it("routes both mutations through startViewTransition when the browser supports it", async () => {
    stubMatchMedia();
    const transition = stubStartViewTransition();
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    theme.setTheme(darkFirstBrand.name);
    await settle();
    expect(transition).toHaveBeenCalledTimes(1);

    theme.toggleMode();
    await settle();
    expect(transition).toHaveBeenCalledTimes(2);
  });

  it("still applies the brand when startViewTransition is absent", async () => {
    stubMatchMedia();
    removeStartViewTransition();
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    expect("startViewTransition" in document).toBe(false);

    theme.setTheme(darkFirstBrand.name);
    await settle();

    expect(readRoot()).toEqual({
      theme: darkFirstBrand.name,
      isDarkClass: true
    });
    expect(readStorage().theme).toBe(darkFirstBrand.name);

    theme.toggleMode();
    await settle();

    expect(readRoot().isDarkClass).toBe(false);
  });

  it("skips the transition under prefers-reduced-motion but still applies", async () => {
    stubMatchMedia({ reducedMotion: true });
    const transition = stubStartViewTransition();
    const { useTheme } = await loadTheme();
    const theme = useTheme();

    theme.setTheme(darkFirstBrand.name);
    await settle();
    theme.toggleMode();
    await settle();

    expect(transition).not.toHaveBeenCalled();
    expect(readRoot().theme).toBe(darkFirstBrand.name);
    expect(readStorage().mode).toBe("light");
  });
});
