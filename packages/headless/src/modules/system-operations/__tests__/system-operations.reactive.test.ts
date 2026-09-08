// -----------------------------------------------------------------------------
/**
 * @fileoverview systemOperations reactive state — the lifecycle is observable
 *
 * ## Job To Be Done
 * Prove the computed surface (pendingOperations, currentOid, isExecuting,
 * lastResult, lastError) tracks the singleton store across the dispatch
 * lifecycle: a created operation is pending; a dispatch in flight flips
 * isExecuting and names its oid; a settled dispatch clears both and records the
 * outcome; and a throwing handler records lastError. Assertions come from
 * FE-3030 requirements.md AC-8 / AC-10 and design.md §Store Design — never from
 * the implementation source. Because these refs are driven by the store's
 * subscribe→storeTick bridge, deleting that bridge turns this suite RED (the
 * T1.2 negative control).
 *
 * ## What Breaks If These Fail
 * A guard cannot observe whether a dispatch is in flight or has finished, so it
 * strips the return param too early or shows the wrong outcome to the user.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { nextTick } from "vue";
import { useOperations } from "..";

// -----------------------------------------------------------------------------

beforeEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
});

describe("systemOperations — reactive lifecycle", () => {
  it("AC-8 · tracks pending, executing, currentOid and lastResult through a dispatch", async () => {
    const {
      register,
      createOperation,
      executeOperation,
      pendingOperations,
      currentOid,
      isExecuting,
      lastResult
    } = useOperations();
    register(
      "ac8-reactive",
      () => new Promise(resolve => setTimeout(() => resolve("settled"), 20))
    );

    const oid = createOperation("ac8-reactive", {});
    await nextTick();
    expect(pendingOperations.value).toHaveLength(1);
    expect(isExecuting.value).toBe(false);

    const dispatched = executeOperation(oid);
    await nextTick();
    expect(isExecuting.value).toBe(true);
    expect(currentOid.value).toBe(oid);

    await dispatched;
    await nextTick();
    expect(isExecuting.value).toBe(false);
    expect(currentOid.value).toBeNull();
    expect(pendingOperations.value).toHaveLength(0);
    expect(lastResult.value).toBe("settled");
  });

  it("AC-10 · records the thrown error in lastError while the dispatch rejects with it and the operation is removed", async () => {
    const {
      register,
      createOperation,
      executeOperation,
      getOperation,
      lastError
    } = useOperations();
    const boom = new Error("boom");
    register("ac10-throw", vi.fn().mockRejectedValue(boom));

    const oid = createOperation("ac10-throw", {});

    await expect(executeOperation(oid)).rejects.toBe(boom);
    expect(getOperation(oid)).toBeNull();
    await nextTick();
    expect(lastError.value).toBe(boom);
  });
});
