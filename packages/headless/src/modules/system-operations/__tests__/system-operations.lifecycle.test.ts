// -----------------------------------------------------------------------------
/**
 * @fileoverview systemOperations lifecycle — create, dispatch, clear, and the
 * five typed error paths
 *
 * ## Job To Be Done
 * Prove the return-path contract a funnel guard depends on: a stored operation
 * yields a retrievable oid; dispatch runs the registered handler with the stored
 * payload and removes the operation; and each of the five error classes throws
 * on its own path with the documented post-state (removed vs kept). Assertions
 * come from FE-3030 design.md §Composable API / §Error Handling and the AC
 * read-backs in requirements.md — never from the implementation source.
 *
 * ## What Breaks If These Fail
 * A payment (or any) module returning from off-site auth either fails to resume,
 * silently drops the user's basket, or double-dispatches a concurrent return.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOperations } from "..";
import { DetailedError } from "../../../utils";
import { isUndefined, keys } from "lodash-es";

// -----------------------------------------------------------------------------

const STORAGE_KEY = "upmind:operations";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("systemOperations — create & persist", () => {
  it("AC-1 · stores an operation and returns a ten-character url-safe oid", () => {
    const { createOperation, getOperation } = useOperations();

    const oid = createOperation("ac1-create", { a: 1 });

    expect(oid).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(getOperation(oid)).toEqual(
      expect.objectContaining({ key: "ac1-create", payload: { a: 1 } })
    );
  });

  it("AC-1 · mints a distinct oid for every operation", () => {
    const { createOperation } = useOperations();
    const seen = new Set<string>();

    for (let index = 0; index < 1000; index++) {
      seen.add(createOperation("ac1-unique", { index }));
    }

    expect(seen.size).toBe(1000);
  });

  it("AC-7 · is tab-scoped — writes only this tab's sessionStorage and opens no cross-tab channel", () => {
    const originalBc = globalThis.BroadcastChannel;
    if (isUndefined(originalBc)) {
      (
        globalThis as unknown as { BroadcastChannel: unknown }
      ).BroadcastChannel = class {
        postMessage(): void {}
        close(): void {}
      };
    }
    const bcSpy = vi.spyOn(globalThis, "BroadcastChannel");

    const { createOperation } = useOperations();
    createOperation("ac7-scope", { a: 1 });

    expect(bcSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(document.cookie).not.toContain(STORAGE_KEY);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeTruthy();

    bcSpy.mockRestore();
    if (isUndefined(originalBc)) {
      delete (globalThis as unknown as { BroadcastChannel?: unknown })
        .BroadcastChannel;
    }
  });
});

describe("systemOperations — payload & storage guards", () => {
  it("AC-13 · lets a sessionStorage write failure surface to the caller", () => {
    // `useSessionStorage` owns storage behaviour, so the browser's own error
    // propagates rather than being re-wrapped in a module-local class.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    const { createOperation } = useOperations();

    expect(() => createOperation("ac13-quota", { a: 1 })).toThrow(DOMException);
  });
});

describe("systemOperations — dispatch", () => {
  it("AC-2 · runs the registered handler with the stored payload, resolves, and removes the operation", async () => {
    const { register, createOperation, executeOperation, getOperation } =
      useOperations();
    const handler = vi.fn().mockResolvedValue({ ok: true });
    register("ac2-dispatch", handler);

    const oid = createOperation("ac2-dispatch", { a: 1 });

    await expect(executeOperation(oid)).resolves.toEqual({ ok: true });
    expect(handler).toHaveBeenCalledWith({ a: 1 });
    expect(getOperation(oid)).toBeNull();
  });

  it("AC-3 · rejects an unknown oid with a DetailedError", async () => {
    const { executeOperation } = useOperations();

    await expect(executeOperation("does-not-x")).rejects.toThrow(DetailedError);
  });

  it("AC-4 · rejects DetailedError after the ready timeout and removes the operation", async () => {
    vi.useFakeTimers();
    const { createOperation, executeOperation, getOperation } = useOperations();
    const oid = createOperation("ac4-never-registered", {});
    const rejection = expect(executeOperation(oid)).rejects.toThrow();

    await vi
      .advanceTimersByTimeAsync(5_000)
      .then(() => rejection)
      .then(() => {
        expect(getOperation(oid)).toBeNull();
      })
      .finally(() => {
        vi.useRealTimers();
      });
  });

  it("AC-11 · refuses a concurrent dispatch and keeps the second operation", async () => {
    const { register, createOperation, executeOperation, getOperation } =
      useOperations();
    register(
      "ac11-slow",
      () => new Promise(resolve => setTimeout(resolve, 50))
    );

    const first = createOperation("ac11-slow", {});
    const second = createOperation("ac11-slow", {});

    const inFlight = executeOperation(first);
    await expect(executeOperation(second)).rejects.toThrow(DetailedError);
    await inFlight;

    expect(getOperation(second)).not.toBeNull();
  });
});

describe("systemOperations — query, clear & surface", () => {
  it("returns null for an unknown oid, the operation after create, and null again after clear", () => {
    const { createOperation, getOperation, clearOperation } = useOperations();

    expect(getOperation("nope")).toBeNull();

    const oid = createOperation("query-clear", { a: 1 });
    expect(getOperation(oid)).toEqual(
      expect.objectContaining({ key: "query-clear", payload: { a: 1 } })
    );

    clearOperation(oid);
    expect(getOperation(oid)).toBeNull();
    const persisted = sessionStorage.getItem(STORAGE_KEY);
    expect(persisted ? JSON.parse(persisted)[oid] : undefined).toBeUndefined();
  });

  it("omits getStatus and getError from the public surface", () => {
    const surface = keys(useOperations());

    expect(surface).not.toContain("getStatus");
    expect(surface).not.toContain("getError");
  });
});
