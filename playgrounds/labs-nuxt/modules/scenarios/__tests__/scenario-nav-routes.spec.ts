// -----------------------------------------------------------------------------
/**
 * @fileoverview @G6 the derived navigation points at routes that EXIST.
 *
 * ## Job To Be Done
 * `navigation-derives.spec.ts` proves the sidebar derives from what a scenario
 * declares, against a hand-written route table — so it stays green whatever the
 * registrar actually registers. Phase 2 moved every scenario url, which makes
 * "derived correctly" and "reachable" two different claims. This file joins
 * them: the REAL declarations, the REAL registrar, the app's REAL router
 * options, and one question — does every link the sidebar and the landing page
 * emit resolve to a registered route?
 *
 * It lives in the module lane rather than beside `useNavigation` because the
 * subject is the seam between the two, and the registrar only runs here.
 *
 * ## What Breaks If These Fail
 * Every sidebar entry and every landing-page card 404s while both derivation
 * suites stay green — the exact gap a hand-written route table leaves open.
 */

import { mount } from "@vue/test-utils";
import { beforeAll, describe, expect, it, vi } from "vitest";
import * as vue from "vue";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import text from "@upmind-automation/i18n/core/text-en.json";
import routerOptions from "../../../app/router.options";
import { registry } from "../runtime/registry";
import clientEmails, {
  CLIENT_EMAILS_SCENARIO
} from "../useClientEmails/client-email.scenario";
import { registerScenarioRoutes } from "./nuxt-build-context";
import {
  compact,
  filter,
  find,
  flatMap,
  forEach,
  get,
  map,
  startCase,
  uniq
} from "lodash-es";
import type { RegisteredScenario } from "../runtime/scenario.types";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

/** Nuxt's auto-imports are globals to a bare vitest module graph. */
forEach(vue, (value, key) => vi.stubGlobal(key, value));

const blank = defineComponent({ render: () => h("div") });

type NavItem = {
  label: string;
  icon?: string;
  to?: string;
  children?: NavItem[];
};
type LabEntry = { key: string; to: string };
type LabFamily = { entries: LabEntry[] };

let router: Router;
let links: string[];
let navigation: NavItem[];

const linksOf = (items: NavItem[]): string[] =>
  flatMap(items, item => [
    ...compact([item.to]),
    ...linksOf(item.children ?? [])
  ]);

beforeAll(async () => {
  const { pages } = await registerScenarioRoutes();

  router = createRouter({
    history: createMemoryHistory(),
    routes: routerOptions.routes([
      { path: "/", name: "index", component: blank },
      ...map(pages, page => ({ ...page, component: blank }))
    ]) as never
  });
  await router.push("/");
  await router.isReady();

  const { useNavigation } =
    await import("../../../app/composables/useNavigation");

  let derived: {
    composables: LabEntry[];
    families: LabFamily[];
    navigation: NavItem[];
  };
  mount(
    defineComponent({
      setup() {
        derived = useNavigation() as never;
        return () => h("div");
      }
    }),
    { global: { plugins: [router] } }
  );

  const composables = vue.unref(derived!.composables) as LabEntry[];
  const families = vue.unref(derived!.families) as LabFamily[];
  navigation = vue.unref(derived!.navigation) as NavItem[];

  links = uniq([
    ...map(composables, "to"),
    ...flatMap(families, family => map(family.entries, "to")),
    ...linksOf(navigation)
  ]);
});

const flatten = (items: NavItem[]): NavItem[] =>
  flatMap(items, item => [item, ...flatten(item.children ?? [])]);

// -----------------------------------------------------------------------------

describe("@G6 every derived link resolves against the registered routes", () => {
  it("derives a link for the client-emails page and excludes its handoff target (R8)", () => {
    const names = map(links, to => router.resolve(to).name);

    expect(names).toContain("useClientEmails");
    expect(names).not.toContain("useClientEmail");
  });

  it("leaves no derived link unmatched by the router", () => {
    const unreachable = filter(
      links,
      to => router.resolve(to).matched.length === 0
    );

    expect(unreachable).toEqual([]);
  });

  it("resolves each scenario link to a route the registrar pushed, not the index", () => {
    const scenarioLinks = filter(links, to => to !== "/");

    for (const to of scenarioLinks) {
      expect(router.resolve(to).name, to).not.toBe("index");
    }
  });
});

/**
 * @AC The sidebar entry IS the composable's name (D1)
 *
 * The operator's sidebar said "Emails" over a path reading `/useClientEmails`.
 * A prettified alias is a second name for one thing, and the two are free to
 * disagree — so the menu item, the url segment and the route name are all the
 * declaring DIRECTORY, and the declaration carries no label to disagree with.
 *
 * What breaks if these fail: the alias comes back and the sidebar stops naming
 * what the url opens.
 */
describe("@G6 the sidebar entry is the composable's own NAME (D1)", () => {
  const registered = get(
    registry,
    CLIENT_EMAILS_SCENARIO
  ) as RegisteredScenario;

  it("labels the client-emails page with the directory its url already carries", () => {
    expect(map(flatten(navigation), "label")).toContain(registered.route);
  });

  it("prettifies nothing — no alias stands between the menu item and the path", () => {
    const labels = map(flatten(navigation), "label");

    expect(labels).not.toContain(startCase(registered.route));
    expect(labels).not.toContain(get(text, "emails"));
    expect(labels).not.toContain(registered.key);
  });

  // The link carries no actor segment because the declaration names no boot
  // scope: a page boots as self, and only the url's own `/as/` moves it.
  it("links the very entry it labels, so the two cannot drift", () => {
    const entry = find(flatten(navigation), { label: registered.route });

    expect(entry?.to).toBe(`/${registered.route}`);
    expect(router.resolve(entry!.to as string).name).toBe(registered.route);
  });

  it("carries the icon the declaration chose — the one thing it still declares", () => {
    const entry = find(flatten(navigation), { label: registered.route });

    expect(entry?.icon).toBe(clientEmails.presentation.icon);
  });
});
