/**
 * @fileoverview useClientEmailManager factories — actions/meta/context (unit)
 *
 * ## Job To Be Done
 * Prove the manager's four-layer factories, in isolation from the live
 * data-manager machine: actions deliver the documented machine events
 * (clear → CLEAR) and lifecycle (stop → stopService; destroy → stopService +
 * registry eviction; isReady/onDone resolve off the settled state); meta derives
 * its flags from the state matcher; context surfaces the form fields. The
 * machine, i18n, services and registry seams are mocked.
 *
 * ## What Breaks If These Fail
 * A form that never clears, an unmounted editor that leaks its service and stale
 * singleton, an isReady() that resolves before the machine settles, or meta
 * flags wired to the wrong state paths (spinner/validity/dirty all silently
 * wrong on the profile + checkout email forms).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createClientEmailManagerActions } from "../useClientEmailManager.actions";
import { createClientEmailManagerContext } from "../useClientEmailManager.context";
import { createClientEmailManagerMeta } from "../useClientEmailManager.meta";
import type { UseActor } from "../../../utils";

// -----------------------------------------------------------------------------

const seed = vi.hoisted(() => ({
  // Mutable set of "active" state paths the stateMatches mock answers against.
  active: [] as string[],
  done: false,
  removeMock: vi.fn(),
  stopServiceMock: vi.fn(),
  refreshMock: vi.fn(),
  // Per-path context values for the context factory + contextValue.
  contextByPath: {} as Record<string, unknown>
}));

vi.mock("xstate/lib/waitFor", () => ({
  // Resolve immediately with the caller's current (fake) state snapshot.
  waitFor: vi.fn(async (service: { getSnapshot?: () => unknown }) =>
    service.getSnapshot ? service.getSnapshot() : {}
  )
}));

vi.mock("../../system-localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

vi.mock("../client-email.services", () => ({
  useClientEmailServices: () => ({ refresh: seed.refreshMock })
}));

vi.mock("../../scope", () => ({ remove: seed.removeMock }));

vi.mock("../../../utils", () => {
  const matches = (paths: string | string[]) => {
    const list = Array.isArray(paths) ? paths : [paths];
    return list.some(p => seed.active.includes(p));
  };
  return {
    DEBOUNCE_DELAY: 0,
    ErrorOrigin: { Headless: "Headless" },
    responseCodes: { Forbidden: 403, Timeout: 408 },
    DetailedError: class DetailedError extends Error {},
    stopService: seed.stopServiceMock,
    stateMatches: (_state: unknown, paths: string | string[]) => matches(paths),
    stateValue: (_state: unknown, prop: string, fallback: unknown) =>
      prop === "done" ? seed.done : fallback,
    contextValue: (_state: unknown, prop?: string) =>
      prop ? seed.contextByPath[prop] : undefined,
    useContext: (_state: unknown, prop?: string) =>
      ref(prop ? seed.contextByPath[prop] : seed.contextByPath)
  };
});

// -----------------------------------------------------------------------------

function fakeActor(): UseActor {
  const snapshot = {
    value: "available",
    context: { model: { email: "a@b.c" } }
  };
  return {
    id: "email-1",
    state: ref(snapshot) as unknown as UseActor["state"],
    send: vi.fn(),
    service: {
      getSnapshot: () => snapshot
    } as unknown as UseActor["service"]
  };
}

// -----------------------------------------------------------------------------

describe("useClientEmailManager.actions (factory)", () => {
  beforeEach(() => {
    seed.active = ["available"];
    seed.done = false;
    seed.contextByPath = {};
    vi.clearAllMocks();
  });

  it("clear() sends CLEAR to the machine", () => {
    const actor = fakeActor();
    createClientEmailManagerActions("client" as never, actor, "key").clear();
    expect(actor.send).toHaveBeenCalledWith({ type: "CLEAR" });
  });

  it("stop() stops the service without touching the registry", () => {
    const actor = fakeActor();
    createClientEmailManagerActions("client" as never, actor, "key").stop();
    expect(seed.stopServiceMock).toHaveBeenCalledWith(actor.service);
    expect(seed.removeMock).not.toHaveBeenCalled();
  });

  it("destroy() stops the service AND evicts the registry entry", () => {
    const actor = fakeActor();
    createClientEmailManagerActions(
      "client" as never,
      actor,
      "client-email:client:email:email-1"
    ).destroy();
    expect(seed.stopServiceMock).toHaveBeenCalledWith(actor.service);
    expect(seed.removeMock).toHaveBeenCalledWith(
      "client-email:client:email:email-1"
    );
  });

  it("isReady() resolves true once available and not errored", async () => {
    seed.active = ["available"];
    const ready = await createClientEmailManagerActions(
      "client" as never,
      fakeActor(),
      "key"
    ).isReady();
    expect(ready).toBe(true);
  });

  it("onDone() resolves true once the machine reaches done", async () => {
    seed.done = true;
    const done = await createClientEmailManagerActions(
      "client" as never,
      fakeActor(),
      "key"
    ).onDone();
    expect(done).toBe(true);
  });
});

describe("useClientEmailManager.meta (factory)", () => {
  beforeEach(() => {
    seed.active = [];
    seed.done = false;
    seed.contextByPath = {};
    vi.clearAllMocks();
  });

  it("derives isAvailable/isValid/hasErrors/isNew from the active state", () => {
    seed.active = ["available", "available.valid"];
    const { meta } = createClientEmailManagerMeta(
      "client" as never,
      fakeActor()
    );

    expect(meta.value.isAvailable).toBe(true);
    expect(meta.value.isValid).toBe(true);
    expect(meta.value.hasErrors).toBe(false);
    // model.id is not active → a new (unsaved) email
    expect(meta.value.isNew).toBe(true);
    // model === baseModel (both undefined here) → not dirty
    expect(meta.value.isDirty).toBe(false);
  });

  it("reports isComplete once the machine is processed/done", () => {
    seed.active = ["processed"];
    const { meta } = createClientEmailManagerMeta(
      "client" as never,
      fakeActor()
    );
    expect(meta.value.isComplete).toBe(true);
  });
});

describe("useClientEmailManager.context (factory)", () => {
  beforeEach(() => {
    seed.contextByPath = {
      id: "email-1",
      title: "a@b.c",
      model: { email: "a@b.c" }
    };
  });

  it("surfaces the form fields from the machine context", () => {
    const context = createClientEmailManagerContext(
      "client" as never,
      fakeActor()
    );

    expect(context.id.value).toBe("email-1");
    expect(context.title.value).toBe("a@b.c");
    expect((context.model.value as { email: string }).email).toBe("a@b.c");
  });
});
