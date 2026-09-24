/**
 * @fileoverview Theme-engine port — ADR 023 §2 layer table, §7 socket rule
 *
 * ## Job To Be Done
 * `useThemes` (the engine and active-theme store) stays in `ui` per §2, so
 * foundation reaches it through a port, never an import. Prove the port hands
 * back the provided engine, and that a caller with no provider — or none at all,
 * outside any injection context — gets a LOUD no-op instead of a throw: it
 * keeps booting, and it says on the console which theme it dropped and which
 * door wires the engine.
 *
 * ## What Breaks If These Fail
 * A port that throws without a provider takes down every standalone consumer of
 * the theming glue: the auth and payment apps (Amendment 1 change 4) boot with
 * their own shell and no `ui` engine wired, and an SSR render has no component
 * instance to inject from at all. A port that degrades in SILENCE is the other
 * half of the same bug — the app boots unthemed, every primitive sits on base
 * tokens, and nothing anywhere says the brand's theme was thrown away.
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
