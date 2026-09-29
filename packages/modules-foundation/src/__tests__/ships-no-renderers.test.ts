/**
 * @fileoverview Foundation ships no form control of its own.
 *
 * ## Job To Be Done
 * On a cold import, the registry holds nothing a production build draws: only
 * the development fallback that flags a field with no control.
 *
 * ## What Breaks If These Fail
 * A control declared in `foundation` creates a `foundation → <domain>` cycle.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("./headless.stub");
  return createHeadlessStub();
});

async function coldRegistry() {
  vi.resetModules();
  const { useFormRenderers } = await import("../index");
  return useFormRenderers().renderers;
}

describe("foundation on a cold import", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("registers no form control in a production build", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);

    expect(await coldRegistry()).toEqual([]);
  });

  it("registers only the missing-control fallback in development", async () => {
    expect(await coldRegistry()).toHaveLength(1);
  });
});
