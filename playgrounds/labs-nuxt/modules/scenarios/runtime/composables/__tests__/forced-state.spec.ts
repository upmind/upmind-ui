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
 *   2. arming starts that worker with the state's recipe, and lets everything
 *      the handlers do not name reach staging (`AC8.3`'s `bypass`);
 *   3. disarming stops the worker AND unregisters its registration, so the
 *      no-worker read-back holds in the same tab rather than only a fresh one;
 *   4. a pasted `force=<slug>` arms that state directly — the link IS the state.
 *
 * The url carries a SLUG, and a slug is resolved against the states the page
 * OFFERS (operator ruling, 2026-09-12): the states here are derived from a real
 * module's own committed `.feature`, so a link this spec arms is one the running
 * app would arm.
 *
 * `ESC6` is RULED (route (a), 2026-08-12): the seam reaches the recorded corpus,
 * so the arming cases run unconditionally. A `runIf` on the seam's own state
 * would skip exactly the cases a seam regression must red.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { featureTextFor, isModuleResolved } from "../../force/corpus.source";
import { featureForcedStates, forcedStateRecipeId } from "../../force/states";
import type { ForcedState } from "../../force/states.types";
import type {
  ForcedStateSource,
  UseForcedState
} from "../useForcedState.types";

// Every test re-imports the module graph (boot() → vi.resetModules), so under
// a loaded worker pool the transform alone can exceed the 5s default.
vi.setConfig({ testTimeout: 30000 });

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

const MODULE = "client-email";

const BOOT_PATH = "/useClientEmails/";

/** The states this module's OWN feature declares — the page's whole offer. */
const STATES: ForcedState[] = featureForcedStates(featureTextFor(MODULE));

/** One of them, whatever its feature happens to name first. */
const ARMED: ForcedState = STATES[0]!;

/** What the worker is actually armed with for that state. */
const RECIPE = forcedStateRecipeId(ARMED.recipe);

/** A page that has measured its offer, as `ScenarioPlayground` registers one. */
const offering = (): ForcedStateSource => ({
  module: MODULE,
  states: ref(STATES)
});

/**
 * A fresh page load at a given url. The composable's state is module-scoped —
 * one worker per app — so a boot is a module reset, exactly as a reload is.
 */
async function boot(
  query = "",
  source?: ForcedStateSource
): Promise<UseForcedState> {
  window.history.replaceState({}, "", `${BOOT_PATH}${query}`);
  vi.resetModules();
  worker.evaluated = 0;
  const { useForcedState } = await import("../useForcedState");

  return useForcedState(source);
}

beforeEach(() => {
  vi.clearAllMocks();
  worker.evaluated = 0;
  worker.start.mockResolvedValue(worker.registration);
});

// -----------------------------------------------------------------------------

describe("T3.12 the feature declares what can be armed at all", () => {
  it("derives at least one state off the module's own committed feature", () => {
    expect(STATES.length).toBeGreaterThan(0);
    expect(ARMED.slug).toMatch(/^[a-z0-9-]+$/);
    expect(ARMED.title.length).toBeGreaterThan(0);
  });
});

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

    expect(forced.isAvailable).toBe(isModuleResolved(MODULE));
  });

  it("offers forcing at all — ESC6 ruled, so the corpus reaches the page", async () => {
    const forced = await boot();

    expect(forced.isAvailable).toBe(true);
  });
});

describe("T3.12 arming and disarming, over the corpus the seam reaches", () => {
  it("starts the worker on the first arm, letting everything else through (AC8.3)", async () => {
    const forced = await boot("", offering());

    await forced.arm(ARMED);

    expect(worker.evaluated).toBe(1);
    expect(worker.start).toHaveBeenCalledWith({
      onUnhandledRequest: "bypass"
    });
    expect(forced.preset.value).toBe(RECIPE);
    expect(forced.state.value?.slug).toBe(ARMED.slug);
  });

  it("renders a pasted force= directly, with no click (AC8.2)", async () => {
    const forced = await boot(`?force=${ARMED.slug}`, offering());
    await forced.whenReady();

    expect(forced.preset.value).toBe(RECIPE);
    expect(forced.state.value?.title).toBe(ARMED.title);
    expect(worker.start).toHaveBeenCalledTimes(1);
  });

  it("arms nothing at all for a slug this page does not offer", async () => {
    const forced = await boot("?force=a-state-no-feature-declares", offering());
    await forced.whenReady();

    expect(forced.preset.value).toBeUndefined();
    expect(forced.state.value).toBeUndefined();
    expect(forced.requested.value).toBe("a-state-no-feature-declares");
    expect(worker.start).not.toHaveBeenCalled();
  });

  it("stops AND unregisters on disarm, so the same tab is live again (AC8.1)", async () => {
    const forced = await boot("", offering());
    await forced.arm(ARMED);

    await forced.disarm();

    expect(worker.stop).toHaveBeenCalledTimes(1);
    expect(worker.registration.unregister).toHaveBeenCalledTimes(1);
    expect(forced.preset.value).toBeUndefined();
  });
});

describe("FE-3113 K1 the swap ends on the page's own cache being CLEARED", () => {
  const registering = () => {
    const reset = vi.fn();
    return { reset, source: { ...offering(), reset } };
  };

  it("clears the booted module's cache on arming, so the rows the state contradicts are gone", async () => {
    const { reset, source } = registering();
    const forced = await boot("", source);

    await forced.arm(ARMED);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("installs the intercept BEFORE clearing, so the refetch cannot reach staging", async () => {
    const { reset, source } = registering();
    const forced = await boot("", source);

    await forced.arm(ARMED);

    expect(worker.start.mock.invocationCallOrder[0]).toBeLessThan(
      reset.mock.invocationCallOrder[0]
    );
  });

  it("clears again on disarm, so Live does not redraw the forced answers", async () => {
    const { reset, source } = registering();
    const forced = await boot("", source);
    await forced.arm(ARMED);
    const clearsWhileArmed = reset.mock.calls.length;

    await forced.disarm();

    expect(reset.mock.calls.length).toBeGreaterThan(clearsWhileArmed);
    const lastClear = reset.mock.invocationCallOrder.at(-1)!;
    expect(worker.stop.mock.invocationCallOrder[0]).toBeLessThan(lastClear);
  });

  it("arms without a registered page, keeping the answers that page already holds", async () => {
    const forced = await boot();

    await expect(forced.arm(ARMED)).resolves.toBeUndefined();
    expect(forced.preset.value).toBe(RECIPE);
  });
});
