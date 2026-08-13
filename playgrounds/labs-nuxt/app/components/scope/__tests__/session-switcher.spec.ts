// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC1.2 @AC1.3 @F5 @H9 the session pool rebuilt with ZERO
 * capability lost — `parity.yaml` walked cell by cell (T2.3).
 *
 * ## Job To Be Done
 * The identity segment IS the session pool. Its UX and looks are free; what it
 * can DO is not. Every case below names the parity cell it holds, so a cell
 * that quietly stops being true fails here rather than in a walk-through weeks
 * later.
 *
 * ## What is NOT claimed here
 * The overlay's own journey — which form the chooser leads to, and what the
 * scope buttons look like — belongs to `app/pages/overlays/__tests__`. This
 * file claims only what the POOL does: where "Add a session" sends the page.
 * The session store's own semantics are `packages/headless`'s contract, doubled
 * at its published surface.
 *
 * ## What Breaks If These Fail
 * The rebuild ships as a prettier pool that silently lost impersonation
 * nesting, per-session logout, expiry warnings or the stable add hooks — the
 * exact failure `F5 CORRECTED` was raised about.
 */

import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import action from "@upmind-automation/i18n/core/action-en.json";
import { AccessRoleTypes } from "@upmind-automation/types";
import { Badge, Tooltip } from "@upmind-automation/upmind-ui";
import { LABS_OVERLAYS, ROUTE } from "../../../funnels";
import { isAddSessionRequest } from "../../../funnels/labs";
import { filter, find, first, get, keys, map, some, uniq } from "lodash-es";
import type { Bench } from "./harness";
import type { RouteLocationRaw } from "vue-router";

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = (await importOriginal()) as object;
  const { headlessDouble } = await import("./harness");
  return headlessDouble(real);
});

const {
  CLIENT_EMAILS_ROUTE,
  MINUTE_MS,
  HOUR_MS,
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
const SessionSwitcher = (await import("../SessionSwitcher.vue")).default;

// -----------------------------------------------------------------------------

const SAM = { id: "s1", actor: AccessRoleTypes.STAFF, publicName: "Sam Staff" };
const SID = { id: "s2", actor: AccessRoleTypes.STAFF, publicName: "Sid Staff" };
const CARA = {
  id: "c1",
  actor: AccessRoleTypes.CLIENT,
  publicName: "Cara Client"
};
const IVY = {
  id: "c2",
  actor: AccessRoleTypes.CLIENT,
  publicName: "Ivy Impersonated",
  impersonatedBy: SAM.id
};

const SCOPED_PATH = "/brand-x/useClientEmails/as/client/for/client/abc123";

let bench: Bench;

const panel = async (): Promise<HTMLElement> => openPanel("session-switcher");

const rowFor = (label: string): HTMLElement =>
  find(rows(document.querySelector("[role='menu']")!), row =>
    textOf(row).includes(label)
  )!;

const labelsInPool = (): string[] =>
  map(rows(document.querySelector("[role='menu']")!), textOf);

/** The group a row sits in, and the label the pool drew above that group. */
const groupOf = (row: Element): Element => row.closest("[role='group']")!;

const groupLabelOf = (row: Element): string =>
  textOf(groupOf(row).previousElementSibling);

type Nest = {
  trigger: HTMLElement;
  content: HTMLElement;
  owner: Element | null;
};

/** Every impersonation nest the pool drew, resolved through its own trigger. */
const nests = (): Nest[] =>
  map(
    Array.from(
      document.querySelectorAll<HTMLElement>(
        "[role='menu'] [aria-expanded][aria-controls]"
      )
    ),
    trigger => ({
      trigger,
      content: document.getElementById(
        String(trigger.getAttribute("aria-controls"))
      )!,
      owner: trigger.parentElement?.previousElementSibling ?? null
    })
  );

const named = (row: Element, label: string): HTMLElement =>
  find(
    Array.from(row.querySelectorAll<HTMLElement>("button")),
    button => button.getAttribute("aria-label") === label
  )!;

const press = async (element: Element | null): Promise<void> => {
  element?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await flush();
};

const badgeColour = (row: Element): string | undefined => {
  const badge = find(bench.wrapper.findAllComponents(Badge), candidate =>
    row.contains(candidate.element)
  );
  return badge?.props("color") as string | undefined;
};

const activeRows = (): Element[] =>
  filter(rows(document.querySelector("[role='menu']")!), row =>
    row.matches("[aria-current='true']")
  );

beforeEach(() => {
  seedPool([SAM, CARA], { active: "c1" });
});

afterEach(() => {
  bench?.wrapper.unmount();
  resetDom();
});

// -----------------------------------------------------------------------------

describe("@P1 @P3 sessions are grouped, and the groups say what they hold", () => {
  it("draws both staff sessions under ONE group whose label comes from the catalogue", async () => {
    seedPool([SAM, SID, CARA], { active: "c1" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(groupOf(rowFor("Sam Staff"))).toBe(groupOf(rowFor("Sid Staff")));
    expect(groupLabelOf(rowFor("Sam Staff"))).toBe(labs("session_staff"));
  });

  it("keeps a client nobody impersonated in the clients group, under no staff node", async () => {
    seedPool([SAM, CARA, IVY], { active: "c1" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(groupLabelOf(rowFor("Cara Client"))).toBe(labs("session_clients"));
    expect(groupOf(rowFor("Cara Client"))).not.toBe(
      groupOf(rowFor("Sam Staff"))
    );
    expect(
      some(nests(), nest => nest.content.contains(rowFor("Cara Client")))
    ).toBe(false);
  });
});

describe("@AC1.1 @F6 the identity segment opens a designed panel", () => {
  it("never asks for a pasted identifier", async () => {
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(document.querySelectorAll("input")).toHaveLength(0);
    expect(document.querySelectorAll("[contenteditable]")).toHaveLength(0);
  });
});

describe("@P2 @AC1.3 impersonated clients nest under the staff that impersonated them", () => {
  it("draws the impersonated client inside its parent's node and nobody else's", async () => {
    seedPool([SAM, SID, CARA, IVY], { active: "c2" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    const nest = first(nests())!;

    expect(nests()).toHaveLength(1);
    expect(nest.content.contains(rowFor("Ivy Impersonated"))).toBe(true);
    expect(nest.content.contains(rowFor("Sid Staff"))).toBe(false);
    expect(nest.owner).toBe(rowFor("Sam Staff"));
    expect(textOf(nest.trigger)).toContain(labs("session_impersonating"));
  });

  it("is already open on load because the active session is the nested one", async () => {
    seedPool([SAM, SID, CARA, IVY], { active: "c2" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    const nest = first(nests())!;

    expect(nest.trigger.getAttribute("aria-expanded")).toBe("true");
    expect(nest.content.dataset.state).toBe("open");
  });

  it("collapses and re-expands from its own trigger without closing the pool", async () => {
    seedPool([SAM, SID, CARA, IVY], { active: "c2" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    const { trigger } = first(nests())!;

    await press(trigger);
    expect(labelsInPool()).not.toContain(
      find(labelsInPool(), label => label.includes("Ivy Impersonated"))
    );
    expect(document.querySelector("[role='menu']")).not.toBeNull();

    await press(trigger);
    expect(
      find(labelsInPool(), label => label.includes("Ivy Impersonated"))
    ).toBeDefined();
  });
});

describe("@P4 @AC1.3 every session says how long it has left, and warns before it runs out", () => {
  it("reads calm an hour out, warning under five minutes, danger at or past zero", async () => {
    seedPool(
      [
        { ...SAM, expiresIn: HOUR_MS },
        { ...SID, expiresIn: 4 * MINUTE_MS },
        { ...CARA, expiresIn: -MINUTE_MS }
      ],
      { active: "c1" }
    );
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(badgeColour(rowFor("Sam Staff"))).toBe("neutral");
    expect(badgeColour(rowFor("Sid Staff"))).toBe("warning");
    expect(badgeColour(rowFor("Cara Client"))).toBe("danger");
  });

  it("keeps the five-minute threshold on the calm side of itself", async () => {
    seedPool([{ ...SAM, expiresIn: 6 * MINUTE_MS }], { active: "s1" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(badgeColour(rowFor("Sam Staff"))).toBe("neutral");
  });
});

describe("@P5 @AC1.2 one session logs out without touching the others", () => {
  it("removes only the session whose control was pressed", async () => {
    seedPool([SAM, CARA, { ...IVY, impersonatedBy: undefined }], {
      active: "c1"
    });
    bench = await benchOn(SessionSwitcher);
    await panel();

    await press(named(rowFor("Ivy Impersonated"), action.logout));

    expect(filter(labelsInPool(), label => label.includes("Ivy"))).toEqual([]);
    expect(
      filter(labelsInPool(), label => label.includes("Cara"))
    ).toHaveLength(1);
    expect(filter(labelsInPool(), label => label.includes("Sam"))).toHaveLength(
      1
    );
  });

  it("carries the logout label as the icon-only control's accessible name", async () => {
    bench = await benchOn(SessionSwitcher);
    await panel();

    const logout = named(rowFor("Cara Client"), action.logout);
    const tip = find(bench.wrapper.findAllComponents(Tooltip), candidate =>
      candidate.element.contains(logout)
    );

    expect(logout.dataset.testValue).toBe("log-out");
    expect(tip?.props("label")).toBe(action.logout);
  });
});

/**
 * @AC1.3 @F5-CORRECTED the ambient impersonation cue (T2.5)
 *
 * The deleted `ImpersonationBar` was always on screen; F5 CORRECTED absorbed it
 * into this segment rather than dropping it, so the pool's own TRIGGER has to
 * say "you are impersonating, and who" without being opened. `parity.yaml` has
 * no cell for it — the bar was a surface, not a pool capability — which is
 * exactly why it needs its own case: nothing else in the tree reads it.
 */
describe("@AC1.3 the trigger says you are impersonating, unopened", () => {
  const cue = (): HTMLElement | null => node("session-impersonation-cue");

  it("marks the closed trigger in the warning tone, naming who", async () => {
    // The impersonated client is the scope's ONLY client session, so the url's
    // own `as/client` lands on it — the pool is read at the identity the page
    // is actually at, never at one the seed alone declares.
    seedPool([SAM, IVY], { active: "c2" });
    bench = await benchOn(SessionSwitcher);

    const badge = find(bench.wrapper.findAllComponents(Badge), candidate =>
      candidate.element.contains(cue()!)
    );
    const tip = find(bench.wrapper.findAllComponents(Tooltip), candidate =>
      candidate.element.contains(cue()!)
    );

    expect(node("session-switcher")!.contains(cue())).toBe(true);
    expect(badge?.props("color")).toBe("warning");
    expect(tip?.props("label")).toBe(
      labs("session_impersonating_as", { label: IVY.publicName })
    );
  });

  it("shows nothing at all while the active session is nobody's puppet", async () => {
    seedPool([SAM, CARA, IVY], { active: "c1" });
    bench = await benchOn(SessionSwitcher);

    expect(cue()).toBeNull();
    expect(node("session-switcher")).not.toBeNull();
  });
});

describe("@P6 @AC1.3 exiting impersonation restores the parent staff session", () => {
  it("makes the impersonator the active identity again", async () => {
    seedPool([SAM, CARA, IVY], { active: "c2" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    await press(
      named(rowFor("Ivy Impersonated"), labs("session_exit_impersonation"))
    );

    expect(map(activeRows(), textOf)).toHaveLength(1);
    expect(textOf(first(activeRows()))).toContain("Sam Staff");
  });
});

describe("@P7 @P8 @AC1.2 a session is told apart at a glance", () => {
  it("marks exactly one session as active, and it is the store's own", async () => {
    seedPool([SAM, SID, CARA], { active: "s2" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(activeRows()).toHaveLength(1);
    expect(textOf(first(activeRows()))).toContain("Sid Staff");
  });

  it("moves the mark with the session that was picked", async () => {
    seedPool([SAM, CARA], { active: "c1" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    await press(rowFor("Sam Staff"));
    await panel();

    expect(activeRows()).toHaveLength(1);
    expect(textOf(first(activeRows()))).toContain("Sam Staff");
  });

  it("falls back publicName then fullName then email then id, and draws initials with no image", async () => {
    seedPool(
      [
        { id: "s1", actor: AccessRoleTypes.STAFF, publicName: "Pat Public" },
        { id: "s2", actor: AccessRoleTypes.STAFF, fullName: "Fay Full" },
        {
          id: "c1",
          actor: AccessRoleTypes.CLIENT,
          email: "mail@example.test"
        },
        { id: "c2", actor: AccessRoleTypes.CLIENT }
      ],
      { active: "s1" }
    );
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(labelsInPool()).toEqual([
      expect.stringContaining("Pat Public"),
      expect.stringContaining("Fay Full"),
      expect.stringContaining("mail@example.test"),
      expect.stringContaining("c2")
    ]);
    expect(
      textOf(rowFor("Pat Public").querySelector("[data-test-key='avatar']"))
    ).toBe("PP");
  });

  it("names each session's actor from the catalogue, never a capitalised enum key", async () => {
    seedPool([SAM, CARA], { active: "c1" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(textOf(rowFor("Sam Staff"))).toContain(labs("actor_staff"));
    expect(textOf(rowFor("Cara Client"))).toContain(labs("actor_client"));
  });
});

describe("@P9 @AC1.2 picking a session lands the page on that actor's scope path", () => {
  it("keeps the brand prefix and the acting-for segment across the switch", async () => {
    seedPool([SAM, CARA], { active: "c1" });
    bench = await benchOn(SessionSwitcher, SCOPED_PATH);
    await panel();

    await press(rowFor("Sam Staff"));

    expect(bench.router.currentRoute.value.path).toBe(
      "/brand-x/useClientEmails/as/user/for/client/abc123"
    );
  });
});

describe("@P10 @P11 @P12 the pool's actions keep their labels and their hooks", () => {
  it("offers to add a FIRST session of a scope, and 'another' once one exists", async () => {
    seedPool([CARA], { active: "c1" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(textOf(node("actor-scope-add-client"))).toBe(
      labs("session_add_client_another")
    );
    expect(textOf(node("actor-scope-add-staff"))).toBe(
      labs("session_add_staff")
    );
  });

  it("offers guest only while guest is allowed and not already the active scope", async () => {
    seedPool([CARA], { active: "c1" });
    bench = await benchOn(SessionSwitcher);
    await panel();

    expect(textOf(node("actor-scope-add-guest"))).toBe(labs("session_guest"));

    await press(node("actor-scope-add-guest"));
    expect(bench.router.currentRoute.value.path).toBe(
      "/useClientEmails/as/guest"
    );

    bench.wrapper.unmount();
    resetDom();

    seedPool([CARA], { guest: true });
    bench = await benchOn(SessionSwitcher, "/useClientEmails/as/guest");
    await panel();

    expect(node("actor-scope-add-guest")).toBeNull();
  });

  it("resolves each add hook to exactly one control", async () => {
    seedPool([SAM, CARA], { active: "c1" });
    bench = await benchOn(SessionSwitcher);
    await panel();

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
  });
});

/**
 * @P10 @AC7.2 @AC1.2 T5.3 — "Add a session" opens the overlay, over the page
 * (`H5` · `G12(a)`)
 *
 * The pool is global chrome, so add-session is taken from whatever page the
 * developer is on. Before the reroute it pushed the standalone
 * `useAuth?fresh=<nonce>` route and the page he was reading was gone. It now
 * enters the SAME overlay the logged-out gate enters, on the scope chooser, and
 * the page stays underneath. What the chooser leads to is the overlay's own
 * spec; what is claimed here is only that the pool asks for it.
 */
describe("@P10 @AC7.2 add-session opens the overlay over the page (T5.3)", () => {
  const OVERLAY_ID = first(keys(LABS_OVERLAYS)) as string;

  const PAGE_OVERLAY = `${CLIENT_EMAILS_ROUTE}--${OVERLAY_ID}`;

  /**
   * Wherever the pool sends the page: Nuxt's own `navigateTo` and the router
   * are both live in the bench, so the case reads the request rather than
   * presuming which channel carries it. The overlay route is a child the Nuxt
   * page scan attaches and the bench never registers, so pushing it for real
   * would only measure the bench's route table.
   */
  function captureNavigation() {
    const requested: RouteLocationRaw[] = [];
    vi.stubGlobal("navigateTo", (to: RouteLocationRaw) => {
      requested.push(to);
      return to;
    });
    const push = vi
      .spyOn(bench.router, "push")
      .mockImplementation(async (to: RouteLocationRaw) => {
        requested.push(to);
      });

    return {
      requested,
      restore: () => {
        push.mockRestore();
        vi.stubGlobal("navigateTo", (to: RouteLocationRaw) => to);
      }
    };
  }

  async function addStaffSession() {
    seedPool([SAM, CARA], { active: "c1" });
    bench = await benchOn(SessionSwitcher);
    await panel();
    const navigation = captureNavigation();

    await press(node("actor-scope-add-staff"));
    navigation.restore();

    return navigation.requested;
  }

  it("asks for the page's OWN auth overlay, never the standalone login route", async () => {
    const requested = await addStaffSession();

    expect(map(requested, target => get(target, "name"))).toEqual([
      PAGE_OVERLAY
    ]);
    expect(get(first(requested), "name")).not.toBe(ROUTE.SESSION_LOGIN);
  });

  it("asks which kind first — the chooser, not the login the gate opens on", async () => {
    const requested = await addStaffSession();

    // Beside the page it was taken from, which is a location of the same shape
    // and reads as no such request — so the claim is the MARKER the pool put on
    // its own request, not whatever `isAddSessionRequest` answers to anything.
    expect(isAddSessionRequest(first(requested) as never)).toBe(true);
    expect(isAddSessionRequest(bench.router.currentRoute.value as never)).toBe(
      false
    );
  });

  it("leaves the page it was taken from underneath, at the scope the url named", async () => {
    const before = "/useClientEmails/as/client";
    const requested = await addStaffSession();

    expect(bench.router.currentRoute.value.path).toBe(before);
    expect(map(requested, target => get(target, "path"))).toEqual([undefined]);
  });
});

describe("@P13 @AC1.2 no pool at all when there is no store to read", () => {
  it("renders nothing rather than an empty menu", async () => {
    seedPool([SAM, CARA], { active: "c1", available: false });
    bench = await benchOn(SessionSwitcher);

    expect(node("session-switcher")).toBeNull();
    expect(uniq(map(nodes("badge"), textOf))).toEqual([]);
    expect(bench.wrapper.find("button").exists()).toBe(false);
  });
});
