/**
 * @fileoverview Foundation ships no renderer of its own — ADR 023 §2
 *
 * ## Job To Be Done
 * Hold the acyclic keystone. ADR 023 §2 gives `foundation` the renderer seam's
 * read side and nothing else; every renderer ENTRY belongs to the app that
 * provides the set. This spec reads the seam on a cold import, with no provider
 * anywhere, and asserts it reports nothing.
 *
 * ## What Breaks If These Fail
 * One domain entry declared inside `foundation` creates `foundation → <domain>`,
 * and since every domain package imports `foundation` that is a real typed
 * cycle — the socket pattern (§7) stops being acyclic and `vue-tsc -b` loses the
 * DAG the whole package cut is built on.
 *
 * This file provides nothing, so the state it reads is the shipped state.
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
