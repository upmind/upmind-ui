// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC The landing page is DERIVED from the scenario registry
 * (Wave C · G6 / C17)
 *
 * ## Job To Be Done
 * The home page is the mass run's shop window: its counts, its grouped families
 * and every link into a lab must come from what the registry declares, so a
 * module reaching the factory appears here with zero page edits — and a
 * composable nobody declared appears nowhere.
 *
 * ## Why the registry here is fabricated
 * The subject is the DERIVATION. A page hand-listing today's entries satisfies
 * any assertion written against today's entries, which is exactly the stale
 * "1 Lab Experiment" the finding caught — so the page is measured against a
 * registry declaring composables this codebase has never heard of. No wire data
 * is involved: a registry entry is a declaration, not a recording.
 *
 * ## What Breaks If These Fail
 * The counts go stale the moment a module lands, and the canary that exists is
 * missing from the one page a developer starts on.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vue from "vue";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { renderedStrings } from "../../../tests/support/rendered";
import { assign, forEach, map, size, startCase } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

forEach(vue, (value, key) => vi.stubGlobal(key, value));
vi.stubGlobal("definePageMeta", () => undefined);

const SPROCKET = "sprocket_widgets";
const SPROCKET_EDITOR = "sprocket_widget";
const GIZMO = "basket_gizmos";
const COG = "basket_cogs";
const UNDECLARED = "client_emails";

/**
 * The DIRECTORY each declaration was found in, spelled unlike its key on
 * purpose: D1 makes the composable's own name the identity every surface shows,
 * so the card's title and the link it opens are the same one name.
 */
const ROUTE: Record<string, string> = {
  [SPROCKET]: "useSprocketWidgets",
  [SPROCKET_EDITOR]: "useSprocketWidget",
  [GIZMO]: "useBasketGizmos",
  [COG]: "useBasketCogs"
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

const routes: RouteRecordRaw[] = [
  { path: "/", name: "index", component: blank },
  {
    path: "/scenarios/:key()/as/:actor()",
    name: "scenarios-key-as-actor",
    component: blank
  }
];

const NuxtLink = defineComponent({
  props: { to: { type: [String, Object], default: "" } },
  setup:
    (props, { slots }) =>
    () =>
      h("a", { href: String(props.to) }, slots.default?.())
});

/** A registry ENTRY as the registry publishes one — declaration plus directory. */
const scenario = (
  key: string,
  actor: string,
  extras?: Record<string, unknown>
) =>
  assign(
    {
      useList: () => ({}),
      route: ROUTE[key],
      scope: { actor, contextType: actor }
    },
    extras
  );

/**
 * Mounts the page over the CURRENT registry. The module graph is reset first:
 * the navigation derivation is memoised at module scope, so a second mount in
 * the same process would render the first registry.
 */
async function home(): Promise<VueWrapper> {
  vi.resetModules();
  const page = await import("../index.vue");
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push("/");
  await router.isReady();

  return mount(page.default as never, {
    global: { plugins: [router], stubs: { NuxtLink } }
  });
}

const hrefs = (wrapper: VueWrapper) =>
  map(wrapper.findAll("a"), link => link.attributes("href"));

beforeEach(() => {
  forEach(Object.keys(declared.registry), key => {
    delete declared.registry[key];
  });
});

// -----------------------------------------------------------------------------

describe("@AC the landing page lists what the registry declares (G6 · C17)", () => {
  it("links every declared scenario at the scope its own declaration names", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, "staff"),
      [GIZMO]: scenario(GIZMO, "guest"),
      [COG]: scenario(COG, "client")
    });

    const wrapper = await home();

    expect(hrefs(wrapper)).toEqual(
      expect.arrayContaining([
        `/${ROUTE[SPROCKET]}/as/staff`,
        `/${ROUTE[GIZMO]}/as/guest`,
        `/${ROUTE[COG]}/as/client`
      ])
    );
    expect(wrapper.text()).toContain(ROUTE[SPROCKET]);
    expect(wrapper.text()).toContain(ROUTE[GIZMO]);
    // The rejected alias: a card titled anything but the composable it opens.
    expect(wrapper.text()).not.toContain(startCase(ROUTE[SPROCKET]));
  });

  it("counts what is declared rather than restating a number", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, "staff"),
      [GIZMO]: scenario(GIZMO, "guest"),
      [COG]: scenario(COG, "client")
    });

    const strings = renderedStrings(await home());

    expect(strings).toContain(`${size(declared.registry)} composables`);
    expect(strings).toContain("2 families");
  });

  it("groups the entries under the family each key declares", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, "staff"),
      [GIZMO]: scenario(GIZMO, "guest"),
      [COG]: scenario(COG, "client")
    });

    const text = (await home()).text();

    expect(text).toContain("Basket");
    expect(text).toContain("Sprocket");
  });
});

describe("@AC nothing on the landing page is hand-listed (G6 · C17)", () => {
  it("follows the registry when it changes", async () => {
    assign(declared.registry, { [SPROCKET]: scenario(SPROCKET, "staff") });
    const first = await home();

    delete declared.registry[SPROCKET];
    assign(declared.registry, { [GIZMO]: scenario(GIZMO, "guest") });
    const second = await home();

    expect(hrefs(first)).toContain(`/${ROUTE[SPROCKET]}/as/staff`);
    expect(hrefs(first)).not.toContain(`/${ROUTE[GIZMO]}/as/guest`);
    expect(hrefs(second)).toContain(`/${ROUTE[GIZMO]}/as/guest`);
    expect(hrefs(second)).not.toContain(`/${ROUTE[SPROCKET]}/as/staff`);
    expect(renderedStrings(second)).toContain("1 composables");
  });

  it("shows no composable the registry does not declare", async () => {
    assign(declared.registry, { [SPROCKET]: scenario(SPROCKET, "staff") });

    const wrapper = await home();

    expect(wrapper.html()).not.toContain(UNDECLARED);
    expect(wrapper.text()).not.toContain("useClientEmails");
    expect(wrapper.text()).not.toContain("useAuth");
  });
});

/**
 * @AC The landing page cards one entry per family, not one per registry key
 * (P1-R8)
 *
 * The home page cards showed the collection AND the manager it hands off to
 * under the same family. Both surfaces read the one navigation derivation, so
 * the exclusion is measured here as well as in the sidebar — the shop window is
 * where a duplicate is most visible at 60 modules.
 */
describe("@AC a handoff target is not carded on the landing page (P1-R8)", () => {
  it("links the collection, never the editor it hands off to", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, "staff", {
        handoff: { edit: { target: SPROCKET_EDITOR, contextType: "client" } }
      }),
      [SPROCKET_EDITOR]: scenario(SPROCKET_EDITOR, "staff"),
      [GIZMO]: scenario(GIZMO, "guest")
    });

    const wrapper = await home();

    expect(hrefs(wrapper)).toEqual(
      expect.arrayContaining([
        `/${ROUTE[SPROCKET]}/as/staff`,
        `/${ROUTE[GIZMO]}/as/guest`
      ])
    );
    expect(hrefs(wrapper)).not.toContain(`/${ROUTE[SPROCKET_EDITOR]}/as/staff`);
  });

  it("counts destinations, not registry keys", async () => {
    assign(declared.registry, {
      [SPROCKET]: scenario(SPROCKET, "staff", {
        handoff: { edit: { target: SPROCKET_EDITOR, contextType: "client" } }
      }),
      [SPROCKET_EDITOR]: scenario(SPROCKET_EDITOR, "staff")
    });

    const strings = renderedStrings(await home());

    expect(strings).toContain("1 composables");
    expect(strings).toContain("1 families");
  });
});
