// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC1.4 @AC1.1 @AC1.2 @F5 @F6 @ESC4 @ESC5 the acting-for segment
 * greys what this page cannot resolve — and NOTHING else (T2.4).
 *
 * ## Job To Be Done
 * A page's composable resolves for some actors and not others. The picker must
 * say so where the choice is made, instead of offering a combination that fails
 * on submit. The axis is the ACTOR row: `CLIENT_EMAILS_SCOPE_MATRIX` maps actor
 * to context type, and marks `SELF`/`STAFF`/`GUEST` `null as never`.
 *
 * The matrix under test is the client-emails page's OWN — read off the route the scenario
 * registered, never a matrix this spec invented, or the greying would be proof
 * of nothing.
 *
 * ## What is NOT claimed here
 * That a client can be found by SEARCH over a directory: no `useClients` exists
 * in headless (`ESC4`). What is claimed is the panel ships over what does exist
 * — the pool's known clients, the contexts acted for before, and an explicit id
 * last — so only the item source changes when that composable lands.
 *
 * ## What Breaks If These Fail
 * Either the page offers an actor its composable cannot resolve (`AC1.4`), or —
 * the far worse direction — a page's matrix reaches the GLOBAL session pool and
 * a developer can no longer switch to the staff session the client-emails page's own staff
 * track needs (`AC1.2`/`P9`/`ESC5`).
 */

import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import { Combobox, Tooltip } from "@upmind-automation/upmind-ui";
import {
  filter,
  find,
  first,
  includes,
  map,
  reject,
  some,
  split
} from "lodash-es";
import type { Bench } from "./harness";
import type { ComboboxItemProps } from "@upmind-automation/upmind-ui";

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = (await importOriginal()) as object;
  const { headlessDouble } = await import("./harness");
  return headlessDouble(real);
});

const {
  benchOn,
  flush,
  labs,
  node,
  nodes,
  openPanel,
  resetDom,
  rows,
  seedPool,
  textOf
} = await import("./harness");
const ActingForSegment = (await import("../ActingForSegment.vue")).default;
const ScopeBar = (await import("../ScopeBar.vue")).default;
const SessionSwitcher = (await import("../SessionSwitcher.vue")).default;

// -----------------------------------------------------------------------------

const SAM = { id: "s1", actor: AccessRoleTypes.STAFF, publicName: "Sam Staff" };
const CARA = {
  id: "c1",
  actor: AccessRoleTypes.CLIENT,
  publicName: "Cara Client"
};

const BASE = "/useClientEmails/as/client";
const ACTING = "/useClientEmails/as/client/for/client/abc123";

/** The actor rows the segment drew, keyed by the actor each one names. */
const actorRow = (actor: string): HTMLElement =>
  find(
    nodes("acting-for-actor"),
    row => row.dataset.testValue === actor
  ) as HTMLElement;

const actorsOffered = (): string[] =>
  map(nodes("acting-for-actor"), row => String(row.dataset.testValue));

const disabledActors = (): string[] =>
  map(
    filter(nodes("acting-for-actor"), row => row.hasAttribute("disabled")),
    row => String(row.dataset.testValue)
  );

const reasonOn = (bench: Bench, actor: string): string | undefined => {
  const tip = find(bench.wrapper.findAllComponents(Tooltip), candidate =>
    candidate.element.contains(actorRow(actor))
  );
  return tip?.props("label") as string | undefined;
};

const searchItems = (bench: Bench): ComboboxItemProps[] =>
  (bench.wrapper.findComponent(Combobox).props("items") ??
    []) as ComboboxItemProps[];

const press = async (element: Element | null): Promise<void> => {
  element?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await flush();
};

const type = async (
  element: HTMLInputElement,
  value: string
): Promise<void> => {
  element.value = value;
  element.dispatchEvent(new window.Event("input", { bubbles: true }));
  await flush();
};

/**
 * The pool's own panel, resolved by a control only the pool draws — two menus
 * are open at once here, and picking one by document order would silently read
 * the acting-for panel instead.
 */
const poolPanel = (): HTMLElement =>
  find(
    Array.from(document.querySelectorAll<HTMLElement>("[role='menu']")),
    menu => !!menu.querySelector("[data-test-value='log-out']")
  )!;

const poolRows = (): string[] => map(rows(poolPanel()), textOf);

let bench: Bench;

beforeEach(() => {
  seedPool([SAM, CARA], { active: "c1" });
});

afterEach(() => {
  bench?.wrapper.unmount();
  resetDom();
});

// -----------------------------------------------------------------------------

describe("@AC1.4 @F5 the picker offers one row per actor the page declares", () => {
  it("mounts on the client-emails page from the scenario's own declared matrix", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    expect(actorsOffered()).toEqual([
      "self",
      AccessRoleTypes.STAFF,
      AccessRoleTypes.CLIENT,
      AccessRoleTypes.GUEST
    ]);
  });

  it("offers the resolving actor with the context type it resolves to", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    expect(disabledActors()).not.toContain(AccessRoleTypes.CLIENT);
    expect(textOf(actorRow(AccessRoleTypes.CLIENT))).toContain("client");
  });

  it("greys every actor the declaration marks unsupported, and only those", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    // `self` is offered and NOT greyed: acting for nobody IS acting as self
    // (`R6-3`), so it is the row that takes the page back rather than a
    // combination the composable cannot resolve.
    expect(disabledActors()).toEqual([
      AccessRoleTypes.STAFF,
      AccessRoleTypes.GUEST
    ]);
    expect(actorsOffered()).toContain("self");
  });

  it("carries the reason on the greyed row itself", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    expect(reasonOn(bench, AccessRoleTypes.STAFF)).toBe(
      labs("acting_for_unsupported", { actor: labs("actor_staff") })
    );
    expect(reasonOn(bench, AccessRoleTypes.CLIENT)).toBeUndefined();
  });

  // A greyed row swallowing its click is not the claim — a disabled control
  // that still ARMS its actor would pass that. The claim is that the choice
  // never took: the segment applies the page's own resolving context after it.
  it.each(["self", AccessRoleTypes.STAFF, AccessRoleTypes.GUEST])(
    "cannot be talked into acting through the greyed %s row",
    async actor => {
      bench = await benchOn(ActingForSegment, BASE);
      await openPanel("acting-for");

      await press(actorRow(actor));

      await openPanel("acting-for");
      await type(node("input") as HTMLInputElement, "abc123");
      await press(node("acting-for-id-apply"));

      expect(bench.router.currentRoute.value.path).toBe(ACTING);
    }
  );
});

describe("@AC1.2 @P9 @ESC5 the greying never reaches the GLOBAL session pool", () => {
  // A pool drawn from seeded sessions still LOOKS right while the scope registry
  // behind its add hooks has already been gated, so the registry itself is read —
  // once with the pool alone, once with the page's segment registered beside it.
  // It is module-scoped and outlives every mount in this file, so the pool-only
  // reading is taken from its own reset state rather than from whatever the case
  // before this one left behind.
  it("leaves the pool's own scope registry exactly as it found it", async () => {
    const { useActorScopeSelector } = await import("../useActorScopeSelector");
    const inApp = <T>(read: () => T): T =>
      bench.wrapper.vm.$.appContext.app.runWithContext(read);

    bench = await benchOn(SessionSwitcher, BASE);
    const poolAlone = inApp(() => {
      const pool = useActorScopeSelector();
      pool.reset();
      return [...pool.availableScopes.value];
    });
    bench.wrapper.unmount();
    resetDom();
    seedPool([SAM, CARA], { active: "c1" });

    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    expect(disabledActors()).toContain(AccessRoleTypes.STAFF);
    expect(poolAlone).not.toEqual([]);
    expect(
      inApp(() => [...useActorScopeSelector().availableScopes.value])
    ).toEqual(poolAlone);
  });

  it("keeps a staff session offered and switchable while the staff row is greyed", async () => {
    bench = await benchOn(ScopeBar, BASE);

    await openPanel("acting-for");
    expect(disabledActors()).toContain(AccessRoleTypes.STAFF);

    await openPanel("session-switcher");
    expect(
      filter(poolRows(), label => includes(label, "Sam Staff"))
    ).toHaveLength(1);
    expect(
      map(
        [
          "actor-scope-add-account",
          "actor-scope-add-client",
          "actor-scope-add-staff",
          "actor-scope-add-guest"
        ],
        key => nodes(key).length
      )
    ).toEqual([1, 1, 1, 1]);

    await press(
      find(rows(poolPanel()), row => includes(textOf(row), "Sam Staff"))
    );

    expect(bench.router.currentRoute.value.path).toBe(
      "/useClientEmails/as/user"
    );
  });
});

describe("@AC1.1 @F6 @ESC4 the panel resolves a client over what the app knows", () => {
  it("offers the pool's own clients, each tagged with where it came from", async () => {
    bench = await benchOn(ActingForSegment, BASE);

    expect(map(searchItems(bench), "value")).toContain(CARA.id);
    expect(find(searchItems(bench), { value: CARA.id })?.tag).toBe(
      labs("acting_for_source_session")
    );
  });

  it("keeps an explicit id as the last resort, after every row it could offer", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    const field = node("input")!;

    expect(bench.wrapper.findAllComponents(Combobox)).toHaveLength(1);
    expect(node("acting-for-id-apply")).not.toBeNull();
    expect(
      map(
        nodes("acting-for-actor"),
        row =>
          !!(
            row.compareDocumentPosition(field) &
            window.Node.DOCUMENT_POSITION_FOLLOWING
          )
      )
    ).toEqual([true, true, true, true]);
  });

  it("remembers a context it acted for and offers it back as a recent one", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    await type(node("input") as HTMLInputElement, "zzz999");
    await press(node("acting-for-id-apply"));

    bench.wrapper.unmount();
    resetDom();
    bench = await benchOn(ActingForSegment, BASE);

    expect(find(searchItems(bench), { value: "zzz999" })?.tag).toBe(
      labs("acting_for_source_recent")
    );
  });
});

describe("@AC1.1 @AC9.3 applying and clearing move the page's own scope", () => {
  it("lands on the client's acting-for path", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    await type(node("input") as HTMLInputElement, "abc123");
    await press(node("acting-for-id-apply"));

    expect(bench.router.currentRoute.value.path).toBe(ACTING);
  });

  it("offers to stop only while it is acting for someone", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    await openPanel("acting-for");

    expect(node("acting-for-clear")).toBeNull();

    bench.wrapper.unmount();
    resetDom();
    bench = await benchOn(ActingForSegment, ACTING);
    await openPanel("acting-for");

    expect(node("acting-for-clear")).not.toBeNull();
  });

  it("puts the page back at its own scope when acting-for is cleared", async () => {
    bench = await benchOn(ActingForSegment, ACTING);
    await openPanel("acting-for");

    await press(node("acting-for-clear")?.closest("[role='menuitem']") ?? null);

    expect(bench.router.currentRoute.value.path).toBe(BASE);
  });
});

/**
 * @R6-3 @R6-3b @E15 acting for nobody IS acting as SELF
 *
 * The operator drove this live: "actor for nobody IS acting as self ffs". Two
 * halves. The WORDS — the resting segment names self, never an absence — and the
 * LOUDNESS: self is 99% of every session, so it is the scope bar's quiet default
 * and only becomes prominent once a context is explicitly picked. Read off the
 * rendered trigger, because both halves are things a key lookup cannot see.
 */
describe("@R6-3 the resting segment IS self, quietly", () => {
  /** What paints a control: its surface and its foreground, variants aside. */
  const treatment = (element: Element): string[] =>
    filter(
      split(element.className, /\s+/),
      token => /^(bg|text)-/.test(token) && !includes(token, "[")
    );

  const restingSegment = async (): Promise<HTMLElement> => {
    bench = await benchOn(ActingForSegment, BASE);
    return node("acting-for") as HTMLElement;
  };

  const actingSegment = async (): Promise<HTMLElement> => {
    bench = await benchOn(ActingForSegment, ACTING);
    return node("acting-for") as HTMLElement;
  };

  it("names SELF at rest, never an absence", async () => {
    const words = textOf(await restingSegment());

    expect(words).toBe(labs("acting_for_none"));
    expect(words).toMatch(/self/i);
    expect(words).not.toMatch(/nobody|none/i);
  });

  it("recedes at rest and only goes loud once a context is picked (R6-3b)", async () => {
    const resting = treatment(await restingSegment());
    bench.wrapper.unmount();
    resetDom();
    seedPool([SAM, CARA], { active: "c1" });
    const acting = treatment(await actingSegment());

    expect(resting).not.toEqual(acting);
    expect(some(resting, token => /muted/.test(token))).toBe(true);
    expect(some(resting, token => /selected/.test(token))).toBe(false);
    expect(some(acting, token => /selected/.test(token))).toBe(true);
  });
});

describe("@AC10.4 the segment speaks in catalogue keys", () => {
  it("names the resting state and every actor from the catalogue", async () => {
    bench = await benchOn(ActingForSegment, BASE);
    const panel = await openPanel("acting-for");

    expect(textOf(node("acting-for"))).toContain(labs("acting_for_none"));
    expect(textOf(panel)).toContain(labs("acting_for"));
    expect(
      map(
        reject(actorsOffered(), actor => actor === "self"),
        actor => textOf(actorRow(actor))
      )
    ).toEqual([
      expect.stringContaining(labs("actor_staff")),
      expect.stringContaining(labs("actor_client")),
      expect.stringContaining(labs("actor_guest"))
    ]);
    expect(textOf(first(nodes("acting-for-actor")))).toContain(
      labs("actor_self")
    );
  });
});
