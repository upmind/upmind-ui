/**
 * @fileoverview Foundation ships no renderer of its own.
 *
 * ## Job To Be Done
 * On a cold import with no provider, the renderer seam reports nothing.
 *
 * ## What Breaks If These Fail
 * A renderer declared in `foundation` creates a `foundation → <domain>` cycle.
 */

import { describe, expect, it, vi } from "vitest";
import { useFormRenderers } from "../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("./headless.stub");
  return createHeadlessStub();
});

describe("foundation on a cold import", () => {
  it("declares no form renderer of its own", () => {
    expect(useFormRenderers().renderers).toEqual([]);
  });
});
