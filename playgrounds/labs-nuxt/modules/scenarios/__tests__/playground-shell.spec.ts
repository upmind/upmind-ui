// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/playground-shell.spec
 * @description T4.8 — the page recomposed: what the scenario page is made of,
 * and where each piece belongs (`G9` · `AC2.1` · `AC3.1` · `AC3.2` · `AC8.4` ·
 * `P1-R2`). Five claims:
 *   1. the page draws its header, then the scenario bar, then the surface inside
 *      the forced-state canvas — that order, on one page;
 *   2. the bar belongs to the PAGE: it is a descendant of the page's own content
 *      root, beside the surface it drives, and the page draws no scope bar of
 *      its own — the chrome is the layout's (`G9`);
 *   3. the page offers all THREE sheet providers — its Debug section, its Code
 *      pane and its Scenario pane — registered, never imported by the host, and
 *      read back through the host that draws them: the registry's own keys are
 *      an object literal carrying both names whether or not anything registered,
 *      so what is claimed here is the pane on screen (`AC3.1`/`AC3.2`);
 *   4. Live is the DEFAULT and carries no transport: the bar boots selected on
 *      Live with the declaration's own pins beside it — never the whole
 *      playlist — and neither the transport nor the scene rail is drawn until a
 *      recorded track is picked (`S12` · `G1` · `AC2.3`);
 *   5. the page is keyed by route PATH, so a scope segment remounts it and a
 *      filter, track or sheet param does not (`P1-R2` · `AC9.3`).
 *
 * The page is mounted whole, on a real router at the client-emails page's own url, with the
 * declarations and the registry the app itself uses — the module's request goes
 * nowhere in this lane, which is why the surface reads as loading and why that
 * is not what any claim here rests on.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as vue from "vue";
import {
  createMemoryHistory,
  createRouter,
  useRoute,
  useRouter
} from "vue-router";
import { PlaygroundSheetTypes } from "../../../app/components/sheets/usePlaygroundSheet.types";
import clientEmails from "../useClientEmails/client-email.scenario";
import {
  every,
  filter,
  forEach,
  isString,
  isUndefined,
  keys,
  map,
  negate,
  pickBy,
  size
} from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { Router } from "vue-router";

// Nuxt's auto-imports are globals to a bare vitest module graph; the router
// pair is vue-router's own, so the page reads the url the way it does in the
// app rather than through a stand-in of its own.
forEach(vue, (value, key) => vi.stubGlobal(key, value));
vi.stubGlobal("useRoute", useRoute);
vi.stubGlobal("useRouter", useRouter);
vi.stubGlobal("navigateTo", (to: unknown) => to);

/** What the page declares about itself, captured as Nuxt's macro captures it. */
const pageMeta: Record<string, unknown>[] = [];
vi.stubGlobal("definePageMeta", (meta: Record<string, unknown>) => {
  pageMeta.push(meta);
});

// -----------------------------------------------------------------------------

const CLIENT_EMAILS = "useClientEmails";

const BOOT_PATH = `/${CLIENT_EMAILS}/`;

/** Long enough for the page's own boot to settle into its loading frame. */
const SETTLE_MS = 200;

/** The page pulls in the registrar and the whole surface tree; hooks default to 10s. */
// 30s was hit once on a cold cache when the whole combined suite boots this
// module graph first — the margin covers that first-run transform, not the test.
const HOOK_TIMEOUT = 90000;

let page: VueWrapper;

let router: Router;

let hosts: VueWrapper[] = [];

const nodesFor = (key: string) =>
  map(page.findAll(`[data-test-key="${key}"]`), node => node.element);

const nodeFor = (key: string) => nodesFor(key)[0];

/** What is on screen, sheet included — the host portals its content out. */
const onScreen = (key: string): Element[] =>
  Array.from(document.querySelectorAll(`[data-test-key="${key}"]`));

/**
 * The ONE host as the layout mounts it — beside the page, holding no import of
 * its own — opened on the sheet the case names. What the page registered is the
 * only thing that can put content in it.
 */
async function openSheet(sheet: PlaygroundSheetTypes): Promise<VueWrapper> {
  const { usePlaygroundSheet } =
    await import("../../../app/components/sheets/usePlaygroundSheet");
  const SheetHost = (
    await import("../../../app/components/sheets/SheetHost.vue")
  ).default;

  const host = mount(SheetHost, { attachTo: document.body });
  hosts.push(host);

  usePlaygroundSheet().open(sheet);
  await new Promise(resolve => setTimeout(resolve, SETTLE_MS));

  return host;
}

const follows = (one: Element, two: Element) =>
  Boolean(one.compareDocumentPosition(two) & Node.DOCUMENT_POSITION_FOLLOWING);

/** The nearest element holding both — the root the page lays its own content in. */
function sharedAncestor(one: Element, two: Element): HTMLElement {
  let candidate = one.parentElement;
  while (candidate && !candidate.contains(two))
    candidate = candidate.parentElement;

  return candidate as HTMLElement;
}

beforeAll(async () => {
  window.history.replaceState({}, "", BOOT_PATH);

  const { SCENARIO_ROUTE_META_KEY } =
    await import("../runtime/scenario.constants");
  const ScenarioPlayground = (await import("../runtime/ScenarioPlayground.vue"))
    .default;

  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "index", component: { template: "<div />" } },
      {
        path: `/${CLIENT_EMAILS}/:scopeSuffix(.*)*`,
        name: CLIENT_EMAILS,
        component: ScenarioPlayground,
        meta: { [SCENARIO_ROUTE_META_KEY]: CLIENT_EMAILS }
      }
    ]
  });
  await router.push(BOOT_PATH);
  await router.isReady();

  page = mount(ScenarioPlayground, {
    attachTo: document.body,
    global: { plugins: [router] }
  });
  await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
}, HOOK_TIMEOUT);

afterEach(async () => {
  const { usePlaygroundSheet } =
    await import("../../../app/components/sheets/usePlaygroundSheet");
  usePlaygroundSheet().close();
  forEach(hosts, host => host.unmount());
  hosts = [];
});

// -----------------------------------------------------------------------------

describe("T4.8 the page is header, bar, then the canvas it drives (AC2.1)", () => {
  it("draws each of the three exactly once", () => {
    expect(size(nodesFor("page-header"))).toBe(1);
    expect(size(nodesFor("scenario-bar"))).toBe(1);
    expect(size(nodesFor("forced-canvas"))).toBe(1);
  });

  it("draws them in that order", () => {
    // The canvas is the glow AROUND the page (`AC8.4`), so it opens before the
    // header it wraps — the order claim reads against the surface itself.
    expect(follows(nodeFor("page-header"), nodeFor("scenario-bar"))).toBe(true);
    expect(follows(nodeFor("scenario-bar"), page.find("table").element)).toBe(
      true
    );
  });

  it("wraps the surface in the forced-state canvas, never beside it", () => {
    expect(nodeFor("forced-canvas").querySelector("table")).not.toBeNull();
  });
});

describe("T4.8 the bar belongs to the page, the scope bar to the chrome (G9)", () => {
  it("draws the bar inside the page's own content root, with the surface", () => {
    const root = sharedAncestor(
      nodeFor("scenario-bar"),
      nodeFor("forced-canvas")
    );

    expect(page.element.contains(root)).toBe(true);
    expect(root.contains(nodeFor("scenario-bar"))).toBe(true);
    expect(root.contains(nodeFor("forced-canvas"))).toBe(true);
  });

  it("draws no scope bar of its own — identity is the layout's, not the page's", () => {
    expect(nodesFor("scope-bar")).toEqual([]);
    expect(nodesFor("session-switcher")).toEqual([]);
  });

  it("keeps the sheet toggle on the bar, where the freed space is (G14 refined)", () => {
    expect(nodeFor("scenario-bar").contains(nodeFor("sheet-toggle"))).toBe(
      true
    );
  });
});

describe("T4.8 the page offers all three sheet providers (AC3.1 · AC3.2)", () => {
  it("registers its own Debug section, named for the page", async () => {
    const { usePlaygroundSheet } =
      await import("../../../app/components/sheets/usePlaygroundSheet");

    expect(map(usePlaygroundSheet().sections.value, "name")).toEqual([
      CLIENT_EMAILS
    ]);
  });

  it("hands the host a payload for each of them, not an empty slot", async () => {
    const { usePlaygroundSheet } =
      await import("../../../app/components/sheets/usePlaygroundSheet");

    expect(
      keys(pickBy(usePlaygroundSheet().panes.value, negate(isUndefined))).sort()
    ).toEqual(
      [PlaygroundSheetTypes.CODE, PlaygroundSheetTypes.SCENARIO].sort()
    );
  });

  it("draws the Code pane in the host, never the empty state", async () => {
    const CodePane = (
      await import("../../../app/components/sheets/CodePane.vue")
    ).default;

    const host = await openSheet(PlaygroundSheetTypes.CODE);

    expect(onScreen("sheet-empty")).toEqual([]);
    expect(host.findComponent(CodePane).exists()).toBe(true);
  });

  it("draws the Scenario pane in the host, never the empty state", async () => {
    const ScenarioPane = (
      await import("../../../app/components/sheets/ScenarioPane.vue")
    ).default;

    const host = await openSheet(PlaygroundSheetTypes.SCENARIO);

    expect(onScreen("sheet-empty")).toEqual([]);
    expect(host.findComponent(ScenarioPane).exists()).toBe(true);
  });

  it("offers the toggle only because it has sections to offer (P1-R4)", async () => {
    const { usePlaygroundSheet } =
      await import("../../../app/components/sheets/usePlaygroundSheet");

    expect(usePlaygroundSheet().hasSections.value).toBe(true);
    expect(nodeFor("scenario-bar").contains(nodeFor("sheet-toggle"))).toBe(
      true
    );
  });
});

describe("T4.8 Live is the default track (S12 · AC2.3 · G1)", () => {
  it("boots selected on Live, with the tracked MODULE's own scenarios behind the overflow — never a declared pin list", () => {
    expect(nodeFor("scenario-bar").dataset.testValue).toBe("live");
    expect(isString(clientEmails.tracks)).toBe(true);
    expect(map(nodesFor("track"), node => node.dataset.testValue)).toEqual([
      "live"
    ]);
    expect(nodeFor("scenario-menu").dataset.testValue).toBe("11");
  });

  it("offers no transport and no scene rail while it is Live", () => {
    expect(nodesFor("transport")).toEqual([]);
    expect(nodesFor("scene-rail")).toEqual([]);
  });
});

describe("T4.8 the page is keyed by route PATH (P1-R2 · AC9.3)", () => {
  it("declares a key at all — an unkeyed page never rebuilds its cell", () => {
    expect(size(filter(pageMeta, meta => typeof meta.key === "function"))).toBe(
      1
    );
  });

  it("keys on the path, so a filter or a track write never remounts it", () => {
    const key = pageMeta[0]!.key as (route: {
      path: string;
      fullPath: string;
    }) => string;

    expect(
      every(
        [
          { path: `${BOOT_PATH}`, fullPath: `${BOOT_PATH}?verified=false` },
          { path: `${BOOT_PATH}`, fullPath: `${BOOT_PATH}?track=2&sheet=code` }
        ],
        route => key(route) === BOOT_PATH
      )
    ).toBe(true);
  });

  it("keys a different SCOPE apart, so the port is rebuilt where it must be", () => {
    const key = pageMeta[0]!.key as (route: {
      path: string;
      fullPath: string;
    }) => string;
    // Both halves of the location, so a key reading either answers with
    // something rather than `undefined` — two undefineds compare as "different"
    // and would read as this claim holding on a page that keys on nothing.
    const at = (path: string) =>
      key({ path, fullPath: `${path}?verified=false` });

    expect(at(`${BOOT_PATH}as/staff`)).not.toBe(at(BOOT_PATH));
    expect(at(BOOT_PATH)).toBeDefined();
  });
});
