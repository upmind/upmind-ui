// -----------------------------------------------------------------------------
/**
 * @fileoverview scope.registry — singleton lifecycle & effect-scope cleanup (unit)
 *
 * ## Job To Be Done
 * Prove the registry that backs every scoped composable honours its lifecycle
 * contract: one instance per scope key (register once, retrieve thereafter),
 * `remove` evicts so the next request rebuilds, and eviction stops the
 * instance's detached effect scope so its watchers do not outlive it.
 *
 * ## What Breaks If These Fail
 * Duplicate instances per scope (two baskets for one client, divergent state);
 * a destroyed composable that resurrects its stale cached instance on remount;
 * or orphaned Vue watchers that keep firing after teardown — a memory leak and
 * a source of "ghost" reactions against a destroyed instance.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, watch } from "vue";
import { clearAll, ensure, remove, size } from "../scope.registry";

// -----------------------------------------------------------------------------

describe("scope registry", () => {
  beforeEach(() => {
    clearAll();
  });

  it("builds an instance the first time a key is requested", () => {
    const instance = { id: Symbol("first") };
    const factory = vi.fn(() => instance);

    expect(ensure("basket:staff", factory)).toBe(instance);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("retrieves the cached instance instead of rebuilding for the same key", () => {
    const factory = vi.fn(() => ({ id: Symbol() }));

    const first = ensure("basket:staff", factory);
    const second = ensure("basket:staff", factory);

    expect(second).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("keeps distinct keys on distinct instances", () => {
    const factory = () => ({ id: Symbol() });

    const client123 = ensure("basket:staff:client:123", factory);
    const client456 = ensure("basket:staff:client:456", factory);

    expect(client456).not.toBe(client123);
    expect(size()).toBe(2);
  });

  it("evicts on remove so the next request rebuilds a fresh instance", () => {
    const factory = vi.fn(() => ({ id: Symbol() }));

    const before = ensure("basket:staff", factory);
    remove("basket:staff");
    expect(size()).toBe(0);

    const after = ensure("basket:staff", factory);

    expect(after).not.toBe(before);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("stops the instance's effect scope on remove so its watchers die with it", () => {
    const source = ref(0);
    let watcherRuns = 0;

    ensure("basket:staff", () => {
      // A watcher created during factory execution is owned by the detached
      // effect scope the registry wraps around it (sync flush for a
      // deterministic assertion without awaiting the scheduler).
      watch(source, () => void watcherRuns++, { flush: "sync" });
      return {};
    });

    source.value = 1;
    expect(watcherRuns).toBe(1); // scope live → watcher reacts

    remove("basket:staff");
    source.value = 2;

    expect(watcherRuns).toBe(1); // scope stopped → no orphaned reaction
  });

  it("clears every scope and stops their watchers", () => {
    const source = ref(0);
    let watcherRuns = 0;

    ensure("a:staff", () => {
      watch(source, () => void watcherRuns++, { flush: "sync" });
      return {};
    });
    ensure("b:staff", () => ({}));
    expect(size()).toBe(2);

    clearAll();
    source.value = 1;

    expect(size()).toBe(0);
    expect(watcherRuns).toBe(0);
  });
});
