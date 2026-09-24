/**
 * @fileoverview Theme-engine port.
 *
 * ## Job To Be Done
 * The port returns the provided engine, else a no-op that warns instead of throwing.
 *
 * ## What Breaks If These Fail
 * A throw takes down every shell with no engine wired; a silent no-op hides the loss.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { readInChildOfProvider } from "../../__tests__/component-context";
import { provideThemeEngine, useThemeEngine } from "../../index";
import type { ThemeEngine } from "../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("../../__tests__/headless.stub");
  return createHeadlessStub();
});

const lastWarning = (spy: { mock: { lastCall?: unknown[] } }) =>
  (spy.mock.lastCall ?? []).map(String).join(" ");

describe("useThemeEngine", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the provided engine to a consumer below the provider", () => {
    const engine: ThemeEngine = { set: vi.fn() };

    const resolved = readInChildOfProvider(
      () => provideThemeEngine(engine),
      () => useThemeEngine()
    );

    expect(resolved).toBe(engine);
  });

  it("warns the theme away instead of throwing when no engine is provided inside a component", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const resolved = readInChildOfProvider(
      () => {},
      () => useThemeEngine()
    );

    expect(() => resolved.set("midnight")).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(lastWarning(warn)).toContain('theme "midnight"');
    expect(lastWarning(warn)).toContain("provideThemeEngine");
  });

  it("warns the theme away instead of throwing outside any injection context", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => useThemeEngine().set("midnight")).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(lastWarning(warn)).toContain('theme "midnight"');
    expect(lastWarning(warn)).toContain("provideThemeEngine");
  });

  it("names each dropped theme, once per call", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const engine = useThemeEngine();

    engine.set("midnight");
    engine.set("aurora");

    expect(warn).toHaveBeenCalledTimes(2);
    expect(lastWarning(warn)).toContain('theme "aurora"');
  });
});
