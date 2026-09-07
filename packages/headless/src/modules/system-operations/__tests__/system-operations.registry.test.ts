// -----------------------------------------------------------------------------
/**
 * @fileoverview systemOperations registry & readiness — the module-level
 * singleton and the isReady race closer
 *
 * ## Job To Be Done
 * Prove the handler registry is one Map shared by every useOperations() call
 * (so a handler registered by one consumer is visible to another), and that
 * isReady resolves immediately when a key is present, on a late registration,
 * and to the current presence after its timeout — so a guard that returns
 * before the owning handler module imports still dispatches (AC-5). Assertions
 * come from FE-3030 design.md §Handler Contract and requirements.md AC-5 — never
 * from the implementation source.
 *
 * ## What Breaks If These Fail
 * A code-split handler module that imports after the guard runs never
 * dispatches, so the user's return path silently dies; or the registry stops
 * being a singleton and every consumer sees an empty registry.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOperations } from "..";

// -----------------------------------------------------------------------------

beforeEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
});

describe("systemOperations — singleton registry", () => {
  it("makes a handler registered on one instance visible to a separate instance", async () => {
    const producer = useOperations();
    const consumer = useOperations();

    producer.register("singleton-key", vi.fn());

    await expect(consumer.isReady("singleton-key")).resolves.toBe(true);
  });
});

describe("systemOperations — isReady", () => {
  it("resolves true immediately when the key is already registered", async () => {
    const { register, isReady } = useOperations();
    register("ready-now", vi.fn());

    await expect(isReady("ready-now")).resolves.toBe(true);
  });

  it("stays pending until the key registers, then resolves the same promise true", async () => {
    const { register, isReady } = useOperations();

    const pending = isReady("ready-late");
    let settled = false;
    void pending.then(() => {
      settled = true;
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(settled).toBe(false);

    register("ready-late", vi.fn());
    await expect(pending).resolves.toBe(true);
  });

  it("resolves false when the timeout elapses with no registration", async () => {
    const { isReady } = useOperations();

    await expect(isReady("ready-never", { timeout: 20 })).resolves.toBe(false);
  });
});

describe("systemOperations — dispatch awaits readiness", () => {
  it("AC-5 · dispatches on a late registration, running the handler with the stored payload", async () => {
    const { createOperation, executeOperation, register } = useOperations();
    const oid = createOperation("ac5-late", { a: 1 });

    const dispatched = executeOperation(oid);
    const handler = vi.fn().mockResolvedValue("ok");
    setTimeout(() => register("ac5-late", handler), 50);

    await expect(dispatched).resolves.toBe("ok");
    expect(handler).toHaveBeenCalledWith({ a: 1 });
  });
});
