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
 * of, alongside the client-emails page's own real scenario key, and the assertion is that
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
import { CLIENT_EMAILS_SCENARIO } from "../../../modules/scenarios/useClientEmails/client-email.scenario";
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
const ICON = "icon-widget";

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
  [CLIENT_EMAILS_SCENARIO]: "useClientEmails"
};

const linkTo = (key: string) => `/${ROUTE[key]}`;

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

/**
 * A registry ENTRY as the registry publishes one — the declaration plus the
 * directory it was found in. It names no boot scope, because the reshaped
 * contract has no channel for one: a page boots as self and only the url's own
 * segments move it.
 */
function scenario(key: string, extras?: Record<string, unknown>) {
  return assign(
    {
      key,
      useList: () => ({}),
      presentation: { icon: ICON },
      route: ROUTE[key]
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
  it("links each entry at the directory its declaration was found in, carrying no actor", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET),
      [GIZMO]: scenario(GIZMO),
      [CLIENT_EMAILS_SCENARIO]: scenario(CLIENT_EMAILS_SCENARIO)
    });

    const { navigation } = await derive();
    const section = composablesSection(navigation);

    expect(sortBy(map(section?.children, "to"))).toEqual(
      sortBy([linkTo(SPROCKET), linkTo(GIZMO), linkTo(CLIENT_EMAILS_SCENARIO)])
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
      [SPROCKET]: scenario(SPROCKET),
      [CLIENT_EMAILS_SCENARIO]: scenario(CLIENT_EMAILS_SCENARIO)
    });

    const { navigation, composables } = await derive();
    const labels = map(composablesSection(navigation)?.children, "label");

    expect(labels).not.toContain(startCase(ROUTE[SPROCKET]));
    expect(labels).not.toContain(startCase(SPROCKET));
    expect(labels).not.toContain(text.emails);
    // The label a menu item shows and the segment its link opens are ONE name.
    for (const entry of composables)
      expect(startsWith(entry.to, `/${entry.label}`)).toBe(true);
  });

  it("follows the registry when it changes rather than restating today's entries", async () => {
    assign(declared.registry, { [SPROCKET]: scenario(SPROCKET) });
    const first = await derive();

    delete declared.registry[SPROCKET];
    assign(declared.registry, { [GIZMO]: scenario(GIZMO) });
    const second = await derive();

    expect(map(composablesSection(first.navigation)?.children, "to")).toEqual([
      linkTo(SPROCKET)
    ]);
    expect(map(composablesSection(second.navigation)?.children, "to")).toEqual([
      linkTo(GIZMO)
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
    assign(declared.registry, { [SPROCKET]: scenario(SPROCKET) });

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
      [SPROCKET]: scenario(SPROCKET),
      [GIZMO]: scenario(GIZMO),
      [CLIENT_EMAILS_SCENARIO]: scenario(CLIENT_EMAILS_SCENARIO)
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
      [SPROCKET]: scenario(SPROCKET, {
        useMutate: () => ({}),
        persistCriteria: true,
        handoff: {
          edit: { context: { type: "client", from: "#/properties/id" } }
        }
      }),
      [GIZMO]: scenario(GIZMO)
    });

    const { composables } = await derive();

    expect(find(composables, { key: GIZMO })?.tags).toEqual([]);
    expect(find(composables, { key: SPROCKET })?.tags).toHaveLength(3);
  });
});

/**
 * @AC An editor is an INLINE channel, not a second menu item (R6-27)
 *
 * The operator's sidebar listed BOTH `Client Emails` and `Client Email` — the
 * collection and the manager `Edit` opened — so one module published two
 * entries. The fix is upstream of the sidebar: a module declares ONE scenario,
 * and the editor is a `handoff` spec inside it rather than a declaration of its
 * own. The derivation therefore has nothing to exclude, and the claim is that a
 * module carrying an editor still publishes exactly one destination.
 *
 * What breaks if these fail: the mass run's ~60 modules publish a sidebar of
 * ~120 entries, half of them dead ends a user cannot meaningfully land on.
 */
describe("@AC a module declaring an editor still publishes ONE destination (R6-27)", () => {
  it("publishes one entry for a collection carrying an inline editor handoff", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, {
        useMutate: () => ({}),
        handoff: {
          edit: { context: { type: "client", from: "#/properties/id" } }
        }
      }),
      [GIZMO]: scenario(GIZMO)
    });

    const { navigation, composables, families } = await derive();

    expect(sortBy(map(composablesSection(navigation)?.children, "to"))).toEqual(
      sortBy([linkTo(SPROCKET), linkTo(GIZMO)])
    );
    expect(sortBy(map(composables, "key"))).toEqual(sortBy([SPROCKET, GIZMO]));
    expect(map(find(families, { name: "sprocket" })?.entries, "key")).toEqual([
      SPROCKET
    ]);
  });

  it("one family, one item for the real client-email module", async () => {
    assign(declared.registry, {
      [CLIENT_EMAILS_SCENARIO]: scenario(CLIENT_EMAILS_SCENARIO, {
        useMutate: () => ({}),
        handoff: {
          edit: { context: { type: "email", from: "#/properties/id" } }
        }
      })
    });

    const { navigation, families } = await derive();

    expect(map(composablesSection(navigation)?.children, "label")).toEqual([
      ROUTE[CLIENT_EMAILS_SCENARIO]
    ]);
    expect(map(find(families, { name: "client" })?.entries, "key")).toEqual([
      CLIENT_EMAILS_SCENARIO
    ]);
  });

  it("publishes a key merely SPELLED like an editor, since nothing hands off to it", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET),
      [SPROCKET_EDITOR]: scenario(SPROCKET_EDITOR)
    });

    const { navigation, composables } = await derive();

    expect(sortBy(map(composables, "key"))).toEqual(
      sortBy([SPROCKET, SPROCKET_EDITOR])
    );
    expect(map(composablesSection(navigation)?.children, "to")).toHaveLength(2);
  });
});
