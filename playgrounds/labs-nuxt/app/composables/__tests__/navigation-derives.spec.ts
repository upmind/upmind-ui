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
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import text from "@upmind-automation/i18n/core/text-en.json";
import { CLIENT_EMAIL_SCENARIO } from "../../../modules/scenarios/useClientEmail/scenario";
import { CLIENT_EMAILS_SCENARIO } from "../../../modules/scenarios/useClientEmails/scenario";
import {
  assign,
  find,
  forEach,
  map,
  sortBy,
  startCase,
  startsWith
} from "lodash-es";
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

/** Nuxt's auto-imports are globals to a bare vitest module graph. */
forEach(vue, (value, key) => vi.stubGlobal(key, value));

const SPROCKET = "sprocket_widgets";
const SPROCKET_EDITOR = "sprocket_widget";
const GIZMO = "basket_gizmos";
const COMPOSABLES_SECTION = "Composables";

/**
 * The DIRECTORY each declaration was found in — deliberately spelled unlike its
 * key, because that is the whole of D1: the identity a surface shows is the
 * composable's own name, which is the url segment the registry attached, never
 * the declaration's internal key and never a prettified alias made from it.
 */
const ROUTE: Record<string, string> = {
  [SPROCKET]: "useSprocketWidgets",
  [SPROCKET_EDITOR]: "useSprocketWidget",
  [GIZMO]: "useBasketGizmos",
  [CLIENT_EMAILS_SCENARIO]: "useClientEmails",
  [CLIENT_EMAIL_SCENARIO]: "useClientEmail"
};

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
 * The nav's own route sources still carry i18n copy, so the derivation needs an
 * installed plugin. The REAL catalogue, never a stub: it is also what makes the
 * rejected alias ("Emails", `text.emails`) a real string to assert against
 * rather than an undefined one.
 */
const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: { en: { text } }
});

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

/** A registry ENTRY as the registry publishes one — the declaration plus the directory it was found in. */
function scenario(
  key: string,
  actor: string,
  extras?: Record<string, unknown>
) {
  return assign(
    {
      useList: () => ({}),
      route: ROUTE[key],
      scope: { actor, contextType: actor }
    },
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
    { global: { plugins: [router, i18n] } }
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
      [SPROCKET]: scenario(SPROCKET, "staff"),
      [GIZMO]: scenario(GIZMO, "guest"),
      [CLIENT_EMAILS_SCENARIO]: scenario(CLIENT_EMAILS_SCENARIO, "client")
    });

    const { navigation } = await derive();
    const section = composablesSection(navigation);

    expect(sortBy(map(section?.children, "to"))).toEqual(
      sortBy([
        `/${ROUTE[SPROCKET]}/as/staff`,
        `/${ROUTE[GIZMO]}/as/guest`,
        `/${ROUTE[CLIENT_EMAILS_SCENARIO]}/as/client`
      ])
    );
    expect(sortBy(map(section?.children, "label"))).toEqual(
      sortBy([
        ROUTE[SPROCKET],
        ROUTE[GIZMO],
        ROUTE[CLIENT_EMAILS_SCENARIO]
      ] as string[])
    );
  });

  it("names each entry after the composable, never a prettified alias of it (D1)", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, "staff"),
      [CLIENT_EMAILS_SCENARIO]: scenario(CLIENT_EMAILS_SCENARIO, "client")
    });

    const { navigation, composables } = await derive();
    const labels = map(composablesSection(navigation)?.children, "label");

    expect(labels).not.toContain(startCase(ROUTE[SPROCKET]));
    expect(labels).not.toContain(startCase(SPROCKET));
    expect(labels).not.toContain(text.emails);
    // The label a menu item shows and the segment its link opens are ONE name.
    for (const entry of composables)
      expect(startsWith(entry.to, `/${entry.label}/as/`)).toBe(true);
  });

  it("follows the registry when it changes rather than restating today's entries", async () => {
    assign(declared.registry, { [SPROCKET]: scenario(SPROCKET, "staff") });
    const first = await derive();

    delete declared.registry[SPROCKET];
    assign(declared.registry, { [GIZMO]: scenario(GIZMO, "guest") });
    const second = await derive();

    expect(map(composablesSection(first.navigation)?.children, "to")).toEqual([
      `/${ROUTE[SPROCKET]}/as/staff`
    ]);
    expect(map(composablesSection(second.navigation)?.children, "to")).toEqual([
      `/${ROUTE[GIZMO]}/as/guest`
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
    assign(declared.registry, { [SPROCKET]: scenario(SPROCKET, "client") });

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
      [SPROCKET]: scenario(SPROCKET, "client"),
      [GIZMO]: scenario(GIZMO, "guest"),
      [CLIENT_EMAILS_SCENARIO]: scenario(CLIENT_EMAILS_SCENARIO, "client")
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
      [SPROCKET]: scenario(SPROCKET, "client", {
        useMutate: () => ({}),
        persistCriteria: true,
        handoff: { edit: { target: SPROCKET_EDITOR, contextType: "client" } }
      }),
      [GIZMO]: scenario(GIZMO, "guest")
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
      [SPROCKET]: scenario(SPROCKET, "client", {
        handoff: {
          edit: { target: SPROCKET_EDITOR, contextType: "client" }
        }
      }),
      [SPROCKET_EDITOR]: scenario(SPROCKET_EDITOR, "client"),
      [GIZMO]: scenario(GIZMO, "guest")
    });

    const { navigation, composables, families } = await derive();

    expect(sortBy(map(composablesSection(navigation)?.children, "to"))).toEqual(
      sortBy([`/${ROUTE[SPROCKET]}/as/client`, `/${ROUTE[GIZMO]}/as/guest`])
    );
    expect(sortBy(map(composables, "key"))).toEqual(sortBy([SPROCKET, GIZMO]));
    expect(map(find(families, { name: "sprocket" })?.entries, "key")).toEqual([
      SPROCKET
    ]);
  });

  it("one family, one item for the real client-email pair", async () => {
    assign(declared.registry, {
      [CLIENT_EMAILS_SCENARIO]: scenario(CLIENT_EMAILS_SCENARIO, "client", {
        handoff: {
          edit: { target: CLIENT_EMAIL_SCENARIO, contextType: "email" }
        }
      }),
      [CLIENT_EMAIL_SCENARIO]: scenario(CLIENT_EMAIL_SCENARIO, "client")
    });

    const { navigation, families } = await derive();

    expect(map(composablesSection(navigation)?.children, "label")).toEqual([
      ROUTE[CLIENT_EMAILS_SCENARIO]
    ]);
    expect(map(find(families, { name: "client" })?.entries, "key")).toEqual([
      CLIENT_EMAILS_SCENARIO
    ]);
  });

  it("excludes on the declared relation, not on how the key is spelled", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, "client"),
      [SPROCKET_EDITOR]: scenario(SPROCKET_EDITOR, "client")
    });

    const { navigation, composables } = await derive();

    expect(sortBy(map(composables, "key"))).toEqual(
      sortBy([SPROCKET, SPROCKET_EDITOR])
    );
    expect(map(composablesSection(navigation)?.children, "to")).toHaveLength(2);
  });

  it("keeps a scenario nobody hands off to, and keeps the source of the handoff", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, "client", {
        handoff: { edit: { target: GIZMO, contextType: "client" } }
      }),
      [GIZMO]: scenario(GIZMO, "guest"),
      [SPROCKET_EDITOR]: scenario(SPROCKET_EDITOR, "client")
    });

    const { composables } = await derive();

    expect(sortBy(map(composables, "key"))).toEqual(
      sortBy([SPROCKET, SPROCKET_EDITOR])
    );
  });
});
