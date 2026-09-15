// -----------------------------------------------------------------------------
/**
 * @module components/scope/__tests__/selector-context-scope.spec
 * @description FE-3239 — the scope bar offers a catalogue the way it offers a
 * client.
 *
 * ## Job To Be Done
 * A catalogue context names WHAT is being read, so it has no entity and nothing
 * to impersonate. Prove the operator can reach every catalogue a module
 * declares from the scope bar, that picking one scopes the page to it, and that
 * no entity id is ever asked for along the way.
 *
 * ## What Breaks If These Fail
 * The picker demands an id a catalogue does not have, or offers only the cell's
 * first member — and the capability is unreachable from the playground however
 * well the platform beneath it works.
 *
 * @anchor scope-selector-context.feature
 * @anchor AC-6
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  seedPool,
  benchOn,
  flush,
  headlessDouble,
  node,
  nodes,
  openPanel,
  resetDom,
  rows,
  textOf,
  CLIENT_EMAILS_ROUTE,
  type Bench
} from "./harness";
import { filter, intersection, map, sortBy } from "lodash-es";

vi.mock("@upmind-automation/headless", async () =>
  headlessDouble(await vi.importActual("@upmind-automation/headless"))
);

// -----------------------------------------------------------------------------

const POOL = [
  { id: "client-1", actor: AccessRoleTypes.CLIENT, publicName: "Client One" }
];

const SCOPE_PATH = `/${CLIENT_EMAILS_ROUTE}/as/client`;

/**
 * What the picker renders for `selector("invoice")` and
 * `selector("cancel_request")`. Named literally, because deriving it from the
 * member names through the same transform the component applies would assert
 * nothing — it has to be the string an operator reads.
 */
const MEMBER_LABELS = ["Invoice", "Cancel Request"];

/**
 * A row by its EXACT label. The rows carry no stable hook to target instead:
 * the segment passes them a `dataAttrs` object that renders as the literal
 * `data-attrs="[object Object]"`, so the test-id rung does not exist here yet
 * (raised for the component seat). Exact text is the next rung down and is
 * collision-free where a loose `/cancel/i` would also match a "Cancel" control.
 */
const rowFor = (panel: Element, label: string): HTMLElement | undefined =>
  rows(panel).find(row => textOf(row) === label);

/**
 * Mounts the scope bar's acting-for segment over a matrix declaring TWO
 * catalogues for one actor — the multi-member cell AC-6's last clause grades. A
 * cell holding one member could never fail "not just the first".
 *
 * The matrix is built inside the test rather than at module scope: the headless
 * barrel is mocked above, and a hoisted mock cannot see a top-level import of
 * the module it replaces.
 *
 * @returns The mounted bench and its open acting-for panel.
 */
async function benchOnCatalogues(): Promise<{
  bench: Bench;
  panel: HTMLElement;
}> {
  const { ScopeActorTypes, selector } =
    await import("@upmind-automation/headless");

  seedPool(POOL, { active: "client-1" });

  const { default: ActingForSegment } = await import("../ActingForSegment.vue");
  const bench = await benchOn(ActingForSegment, SCOPE_PATH, {
    [ScopeActorTypes.SELF]: null as never,
    [ScopeActorTypes.STAFF]: null as never,
    [ScopeActorTypes.CLIENT]: [selector("invoice"), selector("cancel_request")],
    [ScopeActorTypes.GUEST]: null as never
  });

  return { bench, panel: await openPanel("acting-for") };
}

describe("scoping the playground to a catalogue (AC-6)", () => {
  let bench: Bench;

  afterEach(() => {
    bench?.wrapper.unmount();
    resetDom();
  });

  it(
    "@AC-6 offers every catalogue the module declares, not just the first",
    { timeout: 40000 },
    async () => {
      const opened = await benchOnCatalogues();
      bench = opened.bench;

      const labels = map(rows(opened.panel), textOf);

      expect(sortBy(intersection(labels, MEMBER_LABELS))).toEqual(
        sortBy(MEMBER_LABELS)
      );
    }
  );

  it(
    "@AC-6 scopes the page to the catalogue the operator picks",
    { timeout: 40000 },
    async () => {
      const opened = await benchOnCatalogues();
      bench = opened.bench;

      const row = rowFor(opened.panel, "Cancel Request");
      if (!row) throw new Error("the scope bar offered no cancel_request row");

      row.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await flush();

      expect(bench.router.currentRoute.value.fullPath).toBe(
        `${SCOPE_PATH}/for/cancel_request`
      );
    }
  );

  it(
    "@AC-6 never asks the operator for an entity id",
    { timeout: 40000 },
    async () => {
      const opened = await benchOnCatalogues();
      bench = opened.bench;

      const row = rowFor(opened.panel, "Invoice");
      if (!row) throw new Error("the scope bar offered no invoice row");

      row.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await flush();

      // The flow completed — so the absence below is an absence in a scoping
      // that happened, not in one that never started.
      expect(bench.router.currentRoute.value.fullPath).toBe(
        `${SCOPE_PATH}/for/invoice`
      );

      // An id input or its apply button anywhere in the flow means the operator
      // was asked to name an entity a catalogue does not have.
      expect(
        filter([
          ...nodes("acting-for-id-input"),
          ...nodes("acting-for-id-apply")
        ])
      ).toEqual([]);
      expect(node("acting-for-id-input")).toBeNull();
    }
  );

  it(
    "asks for an entity id on the retarget path the same picker still serves",
    { timeout: 40000 },
    async () => {
      // The control for the case above: the id input IS reachable through this
      // component, so its absence on the catalogue path is a decision rather
      // than a locator that no longer resolves to anything.
      seedPool(POOL, { active: "client-1" });

      const { default: ActingForSegment } =
        await import("../ActingForSegment.vue");
      bench = await benchOn(ActingForSegment, SCOPE_PATH);

      await openPanel("acting-for");

      expect(node("acting-for-id-input")).not.toBeNull();
    }
  );
});
