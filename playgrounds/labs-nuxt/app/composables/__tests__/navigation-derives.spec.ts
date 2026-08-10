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
import { CLIENT_EMAILS_SCENARIO } from "@upmind-automation/headless/scenarios";
import { assign, find, forEach, map, sortBy } from "lodash-es";
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

/** Nuxt's auto-imports are globals to a bare vitest module graph. */
forEach(vue, (value, key) => vi.stubGlobal(key, value));

const SPROCKET = "sprocket_widgets";
const GIZMO = "basket_gizmos";
const COMPOSABLES_SECTION = "Composables";

/** The mutable module double: what a scenario DECLARES, and nothing more. */
const declared = vi.hoisted(() => ({
  registry: {} as Record<string, unknown>
}));

// Getters, not values: the module double is read at import time, so a snapshot
// taken here would answer every later test with the first test's registry.
vi.mock("../factory/registry", () => ({
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
        `/scenarios/${SPROCKET}/as/staff`,
        `/scenarios/${GIZMO}/as/guest`,
        `/scenarios/${CLIENT_EMAILS_SCENARIO}/as/client`
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
      `/scenarios/${SPROCKET}/as/staff`
    ]);
    expect(map(composablesSection(second.navigation)?.children, "to")).toEqual([
      `/scenarios/${GIZMO}/as/guest`
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
        handoff: { edit: { target: GIZMO, contextType: "client" } }
      }),
      [GIZMO]: scenario("guest")
    });

    const { composables } = await derive();

    expect(find(composables, { key: GIZMO })?.tags).toEqual([]);
    expect(find(composables, { key: SPROCKET })?.tags).toHaveLength(3);
  });
});
