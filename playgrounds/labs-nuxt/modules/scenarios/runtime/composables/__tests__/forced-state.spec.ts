// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/forced-state.spec
 * @description T3.12 — arming and disarming a forced page (`AC8.1` · `AC8.2` ·
 * `AC8.3`). Four claims:
 *   1. LIVE IS THE DEFAULT (`S12`): with no `force=` and no track, `msw/browser`
 *      is never even EVALUATED — the observable is the module graph, not a call
 *      count, because a composable that imports the worker statically has
 *      already lost whether or not it goes on to start it;
 *   2. arming starts that worker with the preset, and lets everything the
 *      handlers do not name reach staging (`AC8.3`'s `bypass`);
 *   3. disarming stops the worker AND unregisters its registration, so the
 *      no-worker read-back holds in the same tab rather than only a fresh one;
 *   4. a pasted `force=empty` arms that preset directly — the link IS the state.
 *
 * `ESC6` is RULED (route (a), 2026-08-12): the seam reaches the recorded corpus,
 * so the arming cases run unconditionally. A `runIf` on the seam's own state
 * would skip exactly the cases a seam regression must red.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { isCorpusSourceResolved } from "../../force/corpus.source";
import type { ForcePreset, UseForcedState } from "../useForcedState.types";

// -----------------------------------------------------------------------------

const worker = vi.hoisted(() => ({
  /**
   * How many times `msw/browser` has been EVALUATED — the claim-1 observable.
   * The mock factory's result survives `vi.resetModules()`, so this counter is
   * one-shot per file: every bare-load case reads 0, and the FIRST case that
   * genuinely arms reads 1. A second `1` assertion anywhere would measure the
   * cache rather than the graph.
   */
  evaluated: 0,
  registration: { unregister: vi.fn() },
  start: vi.fn(),
  stop: vi.fn(),
  resetHandlers: vi.fn()
}));

vi.mock("msw/browser", () => {
  worker.evaluated += 1;

  return {
    setupWorker: () => ({
      start: worker.start,
      stop: worker.stop,
      resetHandlers: worker.resetHandlers
    })
  };
});

const BOOT_PATH = "/useClientEmails/";

const EMPTY: ForcePreset = "empty";

/**
 * A fresh page load at a given url. The composable's state is module-scoped —
 * one worker per app — so a boot is a module reset, exactly as a reload is.
 */
async function boot(query = ""): Promise<UseForcedState> {
  window.history.replaceState({}, "", `${BOOT_PATH}${query}`);
  vi.resetModules();
  worker.evaluated = 0;
  const { useForcedState } = await import("../useForcedState");

  return useForcedState();
}

beforeEach(() => {
  vi.clearAllMocks();
  worker.evaluated = 0;
  worker.start.mockResolvedValue(worker.registration);
});

// -----------------------------------------------------------------------------

describe("T3.12 live is the default — the worker is not there until asked (AC8.1)", () => {
  it("never pulls msw into a bare load's module graph", async () => {
    const forced = await boot();

    expect(worker.evaluated).toBe(0);
    expect(forced.preset.value).toBeUndefined();
  });

  it("starts nothing on a bare load", async () => {
    await boot();

    expect(worker.start).not.toHaveBeenCalled();
  });

  it("leaves it out of a bare load's graph even after that load has settled", async () => {
    const forced = await boot();
    await forced.whenReady();

    expect(worker.evaluated).toBe(0);
    expect(forced.preset.value).toBeUndefined();
  });
});

describe("T3.12 the seam decides whether forcing is offered at all (ESC6)", () => {
  it("reports itself available exactly when the recorded corpus can reach it", async () => {
    const forced = await boot();

    expect(forced.isAvailable).toBe(isCorpusSourceResolved);
  });

  it("offers forcing at all — ESC6 ruled, so the corpus reaches the page", async () => {
    const forced = await boot();

    expect(forced.isAvailable).toBe(true);
  });
});

describe("T3.12 arming and disarming, over the corpus the seam reaches", () => {
  it("starts the worker on the first arm, letting everything else through (AC8.3)", async () => {
    const forced = await boot();

    await forced.arm(EMPTY);

    expect(worker.evaluated).toBe(1);
    expect(worker.start).toHaveBeenCalledWith({
      onUnhandledRequest: "bypass"
    });
    expect(forced.preset.value).toBe(EMPTY);
  });

  it("renders a pasted force= directly, with no click (AC8.2)", async () => {
    const forced = await boot(`?force=${EMPTY}`);
    await forced.whenReady();

    expect(forced.preset.value).toBe(EMPTY);
    expect(worker.start).toHaveBeenCalledTimes(1);
  });

  it("stops AND unregisters on disarm, so the same tab is live again (AC8.1)", async () => {
    const forced = await boot();
    await forced.arm(EMPTY);

    await forced.disarm();

    expect(worker.stop).toHaveBeenCalledTimes(1);
    expect(worker.registration.unregister).toHaveBeenCalledTimes(1);
    expect(forced.preset.value).toBeUndefined();
  });
});
