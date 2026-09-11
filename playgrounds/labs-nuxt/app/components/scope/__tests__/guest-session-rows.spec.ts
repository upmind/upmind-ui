// -----------------------------------------------------------------------------
/**
 * @module components/scope/__tests__/guest-session-rows.spec
 * @description FE-3087 (operator ruling R10) — the consumer half: guest is a
 * row in the pool, on client and staff terms.
 *
 * ## Job To Be Done
 * The store now holds every guest session in `guestSessions`. This proves the
 * playground's own selector spends that: it lists ONE ROW PER POOLED GUEST the
 * way it lists client rows, reaches each of them by id, and still offers guest
 * mode to a signed-in client without costing them their session.
 *
 * ## What Breaks If These Fail
 * A second pooled guest is drawn but unreachable — the row is there, the switch
 * lands somewhere else — so "guest is a session like any other" is true in the
 * store and false everywhere a user can see it.
 *
 * The rows are read off the composable rather than the rendered dropdown: the
 * shared `openPanel` helper cannot open the switcher's panel in this
 * environment (four sibling cases fail on it, identically before and after this
 * story's commits), so a DOM-level assertion here would report that standing
 * failure instead of this capability.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { defineComponent, h } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import { seedPool, benchOn, flush, headlessDouble, resetDom } from "./harness";
import { map } from "lodash-es";

vi.mock("@upmind-automation/headless", async () =>
  headlessDouble(await vi.importActual("@upmind-automation/headless"))
);

// -----------------------------------------------------------------------------

const POOL = [
  { id: "client-1", actor: AccessRoleTypes.CLIENT, publicName: "Client One" },
  { id: "guest-a", actor: AccessRoleTypes.GUEST },
  { id: "guest-b", actor: AccessRoleTypes.GUEST }
];

type Selector = Awaited<
  ReturnType<typeof import("../useActorScopeSelector").useActorScopeSelector>
>;

/**
 * Mounts the selector on the same bench the switcher runs on and hands back
 * its live surface.
 *
 * @returns The composable, instantiated inside a mounted component.
 */
async function selectorOnBench(): Promise<Selector> {
  const { useActorScopeSelector } = await import("../useActorScopeSelector");
  let selector: Selector | undefined;

  const Host = defineComponent({
    setup() {
      selector = useActorScopeSelector();
      return () => h("div");
    }
  });

  await benchOn(Host);
  return selector as Selector;
}

/** The store pointer, read off the same published context the app reads. */
async function pointer(): Promise<{ actor: string; id?: string }> {
  const { useSessionStore } = await import("@upmind-automation/headless");
  const { activeActor, activeSessionId } = useSessionStore().useContext();
  return { actor: activeActor.value, id: activeSessionId.value };
}

describe("R10 the guest pool is a row in the switcher", () => {
  afterEach(() => {
    resetDom();
  });

  // The first bench boot in a file transforms the whole scope module graph.
  it(
    "lists one row per pooled guest, beside the client rows @AC-G18",
    { timeout: 20000 },
    async () => {
      seedPool(POOL, { active: "client-1" });

      const selector = await selectorOnBench();

      expect(map(selector.guestItems.value, "id")).toEqual([
        "guest-a",
        "guest-b"
      ]);
      expect(map(selector.sessionItems.value, "id")).toEqual(
        expect.arrayContaining(["client-1", "guest-a", "guest-b"])
      );
    }
  );

  it("switches to the pooled guest the caller named @AC-G19", async () => {
    seedPool(POOL, { active: "client-1" });

    const selector = await selectorOnBench();
    await selector.switchSession(AccessRoleTypes.GUEST, "guest-b");
    await flush();

    expect(await pointer()).toEqual({
      actor: AccessRoleTypes.GUEST,
      id: "guest-b"
    });
    expect(map(selector.guestItems.value, "isActive")).toEqual([false, true]);
  });

  it("offers guest mode to a signed-in client without spending their session @AC-G20", async () => {
    seedPool(POOL, { active: "client-1" });

    const selector = await selectorOnBench();
    expect(selector.canUseGuestMode.value).toBe(true);

    await selector.addSession(AccessRoleTypes.GUEST);
    await flush();

    expect((await pointer()).actor).toBe(AccessRoleTypes.GUEST);
    expect(map(selector.sessionItems.value, "id")).toContain("client-1");

    await selector.switchSession(AccessRoleTypes.CLIENT, "client-1");
    await flush();

    expect(await pointer()).toEqual({
      actor: AccessRoleTypes.CLIENT,
      id: "client-1"
    });
  });
});
