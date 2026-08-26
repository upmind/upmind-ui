// -----------------------------------------------------------------------------
/**
 * @module components/scope/__tests__/switch-session-scope.spec
 * @description `A7` — switching session moves the identity AND says what that
 * costs the url.
 *
 * `switchSession` activates the target session first and only then asks whether
 * the scoped path it wants is routable. On a page that carries a scope suffix
 * both happen: the pointer moves and the url follows it. On the homepage — no
 * page segment, so no scoped route to resolve — the navigation is abandoned by
 * design, and the pointer stays moved. That second branch is the one nothing
 * pinned: it is a deliberate contract, not a failure, and a test has to say so
 * or the next reader "fixes" it into a 404.
 *
 * The url's own scope mirror (`globalActorScope`) is deliberately NOT written
 * beside an abandoned navigation, so the two cases differ in the url alone.
 *
 * @anchor session-switcher.feature
 * @anchor A7
 */

import { config } from "@vue/test-utils";
import { describe, it, expect, afterEach, vi } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  seedPool,
  benchOn,
  flush,
  node,
  openPanel,
  resetDom,
  rows,
  headlessDouble,
  textOf,
  type Bench
} from "./harness";

config.global.stubs = { Teleport: true };

vi.mock("@upmind-automation/headless", async () =>
  headlessDouble(await vi.importActual("@upmind-automation/headless"))
);

// -----------------------------------------------------------------------------

const POOL = [
  { id: "client-1", actor: AccessRoleTypes.CLIENT, publicName: "Client One" },
  { id: "client-2", actor: AccessRoleTypes.CLIENT, publicName: "Client Two" }
];

/** The row the pool marks as the live one — the store pointer, read off the DOM. */
const activeRow = (panel: Element): HTMLElement | undefined =>
  rows(panel).find(row => row.getAttribute("aria-current") === "true");

async function pick(panel: Element, label: string): Promise<void> {
  const row = rows(panel).find(entry => textOf(entry).includes(label));
  if (!row) throw new Error(`no row for ${label}`);

  row.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await flush();
}

describe("A7 switching session", () => {
  let bench: Bench;

  afterEach(() => {
    bench?.wrapper.unmount();
    resetDom();
  });

  it("moves the pointer AND the url on a page that carries a scope", async () => {
    seedPool(POOL, { active: "client-1" });

    const { default: SessionSwitcher } = await import("../SessionSwitcher.vue");
    bench = await benchOn(SessionSwitcher);

    const panel = await openPanel("session-switcher");
    expect(textOf(activeRow(panel))).toContain("Client One");

    await pick(panel, "Client Two");

    // The pointer moved…
    expect(textOf(activeRow(await openPanel("session-switcher")))).toContain(
      "Client Two"
    );
    // …and the url still names a scope the router can resolve.
    expect(bench.router.currentRoute.value.matched.length).toBeGreaterThan(0);
  });

  it("moves the pointer and LEAVES the url where it is on the homepage", async () => {
    seedPool(POOL, { active: "client-1" });

    const { default: SessionSwitcher } = await import("../SessionSwitcher.vue");
    // The homepage has no page segment, so no scoped path resolves from it.
    bench = await benchOn(SessionSwitcher, "/");

    const before = bench.router.currentRoute.value.fullPath;
    const panel = await openPanel("session-switcher");

    await pick(panel, "Client Two");

    // The switch still happened — that is what a switch means…
    expect(textOf(activeRow(await openPanel("session-switcher")))).toContain(
      "Client Two"
    );
    // …and the abandoned navigation left the url untouched, by design.
    expect(bench.router.currentRoute.value.fullPath).toBe(before);
    expect(node("session-switcher")).toBeTruthy();
  });
});
