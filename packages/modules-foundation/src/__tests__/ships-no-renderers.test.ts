/**
 * @fileoverview Foundation registers no form control itself.
 *
 * ## Job To Be Done
 * On a cold import, in every build, the registry is empty: foundation hands
 * its own controls out in `foundationRenderers`, and only its consumers register.
 *
 * ## What Breaks If These Fail
 * An app that registers foundation's list holds each control twice, or a
 * catch-all hides the engine's notice on a field no control claims.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("./headless.stub");
  return createHeadlessStub();
});

const BUILDS = [
  { build: "development", dev: true },
  { build: "production", dev: false }
];

// The first cold import transforms the whole package (~5 s), past the default timeout.
const COLD_IMPORT_TIMEOUT_MS = 20_000;

async function coldRegistry() {
  vi.resetModules();
  const { useFormRenderers } = await import("../index");
  return useFormRenderers().renderers.value;
}

describe("foundation on a cold import", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(BUILDS)(
    "registers no form control in a $build build",
    async ({ dev }) => {
      vi.stubEnv("DEV", dev);
      vi.stubEnv("PROD", !dev);

      expect(await coldRegistry()).toEqual([]);
    },
    COLD_IMPORT_TIMEOUT_MS
  );
});
