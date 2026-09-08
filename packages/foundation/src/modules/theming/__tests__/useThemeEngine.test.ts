/**
 * @fileoverview Theme-engine port — ADR 023 §2 layer table, §7 socket rule
 *
 * ## Job To Be Done
 * `useThemes` (the engine and active-theme store) stays in `ui` per §2, so
 * foundation reaches it through a port, never an import. Prove the port hands
 * back the provided engine, and that a caller with no provider — or none at all,
 * outside any injection context — gets a working no-op instead of a throw.
 *
 * ## What Breaks If These Fail
 * A port that throws without a provider takes down every standalone consumer of
 * the theming glue: the auth and payment apps (Amendment 1 change 4) boot with
 * their own shell and no `ui` engine wired, and an SSR render has no component
 * instance to inject from at all.
 */

import { describe, expect, it, vi } from "vitest";
import { readInChildOfProvider } from "../../../__tests__/component-context";
import { provideThemeEngine, useThemeEngine } from "../../../index";
import type { ThemeEngine } from "../../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } =
    await import("../../../__tests__/headless.stub");
  return createHeadlessStub();
});

describe("useThemeEngine", () => {
  it("returns the provided engine to a consumer below the provider", () => {
    const engine: ThemeEngine = { set: vi.fn() };

    const resolved = readInChildOfProvider(
      () => provideThemeEngine(engine),
      () => useThemeEngine()
    );

    expect(resolved).toBe(engine);
  });

  it("swallows the call when no engine is provided inside a component", () => {
    const resolved = readInChildOfProvider(
      () => {},
      () => useThemeEngine()
    );

    expect(() => resolved.set("midnight")).not.toThrow();
  });

  it("swallows the call outside any injection context", () => {
    expect(() => useThemeEngine().set("midnight")).not.toThrow();
  });
});
