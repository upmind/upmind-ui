// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC The sidebar is DERIVED from the scenario registry
 * (Wave C · G6 / C16)
 *
 * ## Job To Be Done
 * The registry is the scenario contract, so declaring a scenario is the whole
 * act of publishing it: the nav must grow its own item from that declaration —
 * label, route and grouping — and the standalone "Scenarios" entry, whose page
 * was a dead end, must be gone.
 *
 * ## Why the registry here is fabricated
 * The subject is the DERIVATION, not any particular scenario: a nav hand-listing
 * today's two entries passes any assertion written against today's two entries.
 * So the registry handed in declares composables this codebase has never heard
 * of, alongside the canary's own real scenario key, and the assertion is that
 * what comes out follows what went in. No wire data is involved — a registry
 * entry is a declaration, not a recording.
 *
 * ## What Breaks If These Fail
 * The mass run adds ~60 modules and the sidebar keeps showing two, or shows an
 * entry pointing at a scenario nobody declared.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vue from "vue";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { CLIENT_EMAIL_SCENARIO } from "../../../modules/scenarios/useClientEmail/scenario";
import { CLIENT_EMAILS_SCENARIO } from "../../../modules/scenarios/useClientEmails/scenario";
import { assign, find, forEach, map, sortBy } from "lodash-es";
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

/** Nuxt's auto-imports are globals to a bare vitest module graph. */
forEach(vue, (value, key) => vi.stubGlobal(key, value));

const SPROCKET = "sprocket_widgets";
const SPROCKET_EDITOR = "sprocket_widget";
const GIZMO = "basket_gizmos";
const COMPOSABLES_SECTION = "Composables";

/** The mutable module double: what a scenario DECLARES, and nothing more. */
const declared = vi.hoisted(() => ({
  registry: {} as Record<string, unknown>
}));

// Getters, not values: the module double is read at import time, so a snapshot
// taken here would answer every later test with the first test's registry.
vi.mock("../../../modules/scenarios/runtime/registry", () => ({
  get registry() {
    return declared.registry;
  },
  get scenarioRegistry() {
    return declared.registry;
  },
  get scenarioKeys() {
    return Object.keys(declared.registry);
  }
}));

const blank = defineComponent({ render: () => h("div") });

/**
 * A route table with no nav metadata of its own — including the `/scenarios`
 * index the dropped menu item pointed at, so its absence from the sidebar is
 * measured against a router that still carries it.
 */
const routes: RouteRecordRaw[] = [
  { path: "/", name: "index", component: blank },
  { path: "/scenarios", name: "scenarios", component: blank },
  {
    path: "/scenarios/:key()/as/:actor()",
    name: "scenarios-key-as-actor",
    component: blank
  },
  {
    path: "/useAuth/:scopeSuffix(.*)*",
    name: "useAuth-scopeSuffix",
    component: blank
  }
];

type NavItem = {
  label: string;
  icon?: string;
  to?: string;
  children?: NavItem[];
};

type LabEntry = {
  key: string;
  label: string;
  family: string;
  to: string;
  tags: string[];
};

type LabFamily = { name: string; label: string; entries: LabEntry[] };

type Navigation = {
  composables: LabEntry[];
  families: LabFamily[];
  navigation: NavItem[];
};

function scenario(actor: string, extras?: Record<string, unknown>) {
  return assign(
    { useList: () => ({}), scope: { actor, contextType: actor } },
    extras
  );
}

/**
 * Boots `useNavigation` inside a component, where the router is injectable.
 * The module graph is reset first: the derivation is memoised at module scope,
 * so a second call in the same process would answer from the first registry.
 */
async function derive(): Promise<Navigation> {
  vi.resetModules();
  const { useNavigation } = await import("../useNavigation");
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push("/");
  await router.isReady();

  let derived: Navigation | undefined;
  mount(
    defineComponent({
      setup() {
        derived = useNavigation() as unknown as Navigation;
        return () => h("div");
      }
    }),
    { global: { plugins: [router] } }
  );

  return {
    composables: vue.unref(derived!.composables) as LabEntry[],
    families: vue.unref(derived!.families) as LabFamily[],
    navigation: vue.unref(derived!.navigation) as NavItem[]
  };
}

const composablesSection = (nav: NavItem[]) =>
  find(nav, { label: COMPOSABLES_SECTION });

beforeEach(() => {
  forEach(Object.keys(declared.registry), key => {
    delete declared.registry[key];
  });
});

// -----------------------------------------------------------------------------

describe("@AC every declared scenario is a sidebar entry, and only declared ones are (G6 · C16)", () => {
  it("routes each entry at the scope its own declaration names", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario("staff"),
      [GIZMO]: scenario("guest"),
      [CLIENT_EMAILS_SCENARIO]: scenario("client")
    });

    const { navigation } = await derive();
    const section = composablesSection(navigation);

    expect(sortBy(map(section?.children, "to"))).toEqual(
      sortBy([
        `/${SPROCKET}/as/staff`,
        `/${GIZMO}/as/guest`,
        `/${CLIENT_EMAILS_SCENARIO}/as/client`
      ])
    );
    expect(sortBy(map(section?.children, "label"))).toEqual(
      sortBy(["Sprocket Widgets", "Basket Gizmos", "Client Emails"])
    );
  });

  it("follows the registry when it changes rather than restating today's entries", async () => {
    assign(declared.registry, { [SPROCKET]: scenario("staff") });
    const first = await derive();

    delete declared.registry[SPROCKET];
    assign(declared.registry, { [GIZMO]: scenario("guest") });
    const second = await derive();

    expect(map(composablesSection(first.navigation)?.children, "to")).toEqual([
      `/${SPROCKET}/as/staff`
    ]);
    expect(map(composablesSection(second.navigation)?.children, "to")).toEqual([
      `/${GIZMO}/as/guest`
    ]);
  });

  it("publishes nothing at all for an empty registry", async () => {
    const { navigation, composables, families } = await derive();

    expect(composables).toEqual([]);
    expect(families).toEqual([]);
    expect(composablesSection(navigation)?.children ?? []).toEqual([]);
  });
});

describe("@AC the Scenarios menu item is gone (G6 · C16)", () => {
  it("names no Scenarios entry and links nothing at the /scenarios index", async () => {
    assign(declared.registry, { [SPROCKET]: scenario("client") });

    const { navigation } = await derive();
    const everyItem = [
      ...navigation,
      ...map(navigation, item => item.children ?? []).flat()
    ];

    expect(map(everyItem, "label")).not.toContain("Scenarios");
    expect(map(everyItem, "to")).not.toContain("/scenarios");
  });
});

describe("@AC the grouping and the badges are derived too (G6 · C17)", () => {
  it("files each entry under the family its key declares", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario("client"),
      [GIZMO]: scenario("guest"),
      [CLIENT_EMAILS_SCENARIO]: scenario("client")
    });

    const { families } = await derive();

    expect(sortBy(map(families, "name"))).toEqual([
      "basket",
      "client",
      "sprocket"
    ]);
    expect(map(find(families, { name: "client" })?.entries, "key")).toEqual([
      CLIENT_EMAILS_SCENARIO
    ]);
  });

  it("tags an entry with the capabilities its declaration carries, and no others", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario("client", {
        useMutate: () => ({}),
        persistCriteria: true,
        handoff: { edit: { target: SPROCKET_EDITOR, contextType: "client" } }
      }),
      [GIZMO]: scenario("guest")
    });

    const { composables } = await derive();

    expect(find(composables, { key: GIZMO })?.tags).toEqual([]);
    expect(find(composables, { key: SPROCKET })?.tags).toHaveLength(3);
  });
});

/**
 * @AC A handoff target is an internal destination, not a menu item (P1-R8)
 *
 * The operator's sidebar listed BOTH `Client Emails` and `Client Email` — the
 * collection and the manager `Edit` navigates to — so one composable family
 * published two entries. The manager is reachable only through the collection's
 * `handoff.edit.target`; a derivation that reads the registry blindly promotes
 * it to a top-level destination.
 *
 * What breaks if these fail: the mass run's ~60 modules publish a sidebar of
 * ~120 entries, half of them dead ends a user cannot meaningfully land on.
 */
describe("@AC a handoff-target scenario is not a navigable destination (P1-R8)", () => {
  it("publishes the collection and drops the editor it hands off to", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario("client", {
        handoff: {
          edit: { target: SPROCKET_EDITOR, contextType: "client" }
        }
      }),
      [SPROCKET_EDITOR]: scenario("client"),
      [GIZMO]: scenario("guest")
    });

    const { navigation, composables, families } = await derive();

    expect(sortBy(map(composablesSection(navigation)?.children, "to"))).toEqual(
      sortBy([`/${SPROCKET}/as/client`, `/${GIZMO}/as/guest`])
    );
    expect(sortBy(map(composables, "key"))).toEqual(sortBy([SPROCKET, GIZMO]));
    expect(map(find(families, { name: "sprocket" })?.entries, "key")).toEqual([
      SPROCKET
    ]);
  });

  it("one family, one item for the real client-email pair", async () => {
    assign(declared.registry, {
      [CLIENT_EMAILS_SCENARIO]: scenario("client", {
        handoff: {
          edit: { target: CLIENT_EMAIL_SCENARIO, contextType: "email" }
        }
      }),
      [CLIENT_EMAIL_SCENARIO]: scenario("client")
    });

    const { navigation, families } = await derive();

    expect(map(composablesSection(navigation)?.children, "label")).toEqual([
      "Client Emails"
    ]);
    expect(map(find(families, { name: "client" })?.entries, "key")).toEqual([
      CLIENT_EMAILS_SCENARIO
    ]);
  });

  it("excludes on the declared relation, not on how the key is spelled", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario("client"),
      [SPROCKET_EDITOR]: scenario("client")
    });

    const { navigation, composables } = await derive();

    expect(sortBy(map(composables, "key"))).toEqual(
      sortBy([SPROCKET, SPROCKET_EDITOR])
    );
    expect(map(composablesSection(navigation)?.children, "to")).toHaveLength(2);
  });

  it("keeps a scenario nobody hands off to, and keeps the source of the handoff", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario("client", {
        handoff: { edit: { target: GIZMO, contextType: "client" } }
      }),
      [GIZMO]: scenario("guest"),
      [SPROCKET_EDITOR]: scenario("client")
    });

    const { composables } = await derive();

    expect(sortBy(map(composables, "key"))).toEqual(
      sortBy([SPROCKET, SPROCKET_EDITOR])
    );
  });
});
