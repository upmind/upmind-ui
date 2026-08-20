// -----------------------------------------------------------------------------
/**
 * @module layouts/__tests__/default-layout.spec
 * @description T2.5 — scope is app CHROME, and the chrome is the layout's
 * (`G9` · `G11` · `AC1.1` · `F5 CORRECTED`). Two claims:
 *   1. the ONE scope bar is inside the header the layout draws, in that header's
 *      actions cluster — a bar that slides into the page column stops being
 *      global, which is the whole of `G9`;
 *   2. nothing else scope-shaped is on screen: every scope surface — brand,
 *      identity, acting-for and the impersonation cue the deleted
 *      `ImpersonationBar` left behind — sits inside that one bar.
 *
 * The `Upm*` chrome comes from `client-vue.stub`, which only NAMES each slot
 * boundary — which slot the layout hands the bar to is the layout's own answer,
 * never this file's. Everything else the layout imports is real, the session
 * pool included.
 */

import { mount } from "@vue/test-utils";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as vue from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { AccessRoleTypes } from "@upmind-automation/types";
import { filter, find, flatMap, forEach, size } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = (await importOriginal()) as object;
  const { headlessDouble } =
    await import("../../components/scope/__tests__/harness");
  return headlessDouble(real);
});

// The layout IMPORTS its chrome from the barrel, so a `global.components`
// registration never reaches it — the double has to arrive as the module.
vi.mock("@upmind-automation/client-vue", async importOriginal => ({
  ...((await importOriginal()) as object),
  ...(await import("./client-vue.stub"))
}));

// Nuxt auto-imports all of these; a bare vitest module graph has to hand the
// layout the same set, from the packages the app itself takes them from.
const { useRoutingEngine } = await import("@upmind-automation/headless");
forEach(vue, (value, key) => vi.stubGlobal(key, value));
vi.stubGlobal("useRoute", useRoute);
vi.stubGlobal("useRouter", useRouter);
vi.stubGlobal("useRoutingEngine", useRoutingEngine);
vi.stubGlobal("navigateTo", (to: unknown) => to);

const { CLIENT_EMAILS_ROUTE, clientEmailsRouter, flush, resetDom, seedPool } =
  await import("../../components/scope/__tests__/harness");

// -----------------------------------------------------------------------------

/** Every hook a scope surface draws itself with (`app/components/scope/**`). */
const SCOPE_SURFACES = [
  "scope-bar",
  "brand-segment",
  "session-switcher",
  "session-impersonation-cue",
  "acting-for"
];

const SAM = { id: "s1", actor: AccessRoleTypes.STAFF, publicName: "Sam Staff" };

/** Impersonated, and the scope's only client — so the ambient cue is drawn too. */
const IVY = {
  id: "c2",
  actor: AccessRoleTypes.CLIENT,
  publicName: "Ivy Impersonated",
  impersonatedBy: SAM.id
};

/** The layout mounts the whole sheet graph; the ui `Sheet` resolve alone is ~4s. */
const HOOK_TIMEOUT = 30000;

let layout: VueWrapper;

const nodesFor = (key: string): Element[] =>
  Array.from(document.querySelectorAll(`[data-test-key='${key}']`));

const nodeFor = (key: string): Element | undefined => nodesFor(key)[0];

/** The boundary of ONE named slot of the header double (`client-vue.stub.ts`). */
const headerSlot = (name: string): Element | undefined =>
  find(
    nodesFor("chrome-header-slot"),
    slot => (slot as HTMLElement).dataset.testValue === name
  );

/** Every scope surface anywhere on screen, the portalled panels included. */
const scopeSurfaces = (): Element[] => flatMap(SCOPE_SURFACES, nodesFor);

beforeAll(async () => {
  seedPool([SAM, IVY], { active: IVY.id });

  const router = await clientEmailsRouter(`/${CLIENT_EMAILS_ROUTE}/as/client`);
  const DefaultLayout = (await import("../default.vue")).default;

  layout = mount(DefaultLayout, {
    attachTo: document.body,
    global: {
      plugins: [router],
      components: { NuxtLink: RouterLink }
    }
  });
  await flush();
}, HOOK_TIMEOUT);

afterAll(() => {
  layout?.unmount();
  resetDom();
});

// -----------------------------------------------------------------------------

describe("T2.5 the header double tells its two slots apart", () => {
  it("puts branding content in the branding boundary and nowhere else", async () => {
    const { UpmHeader } = await import("./client-vue.stub");
    const probe = mount(UpmHeader, {
      slots: { branding: '<i data-test-key="probe-brand" />' }
    });
    const slotOf = (name: string) =>
      find(
        probe.findAll("[data-test-key='chrome-header-slot']"),
        slot => slot.attributes("data-test-value") === name
      )!;

    expect(
      slotOf("branding").find("[data-test-key='probe-brand']").exists()
    ).toBe(true);
    expect(
      slotOf("actions").find("[data-test-key='probe-brand']").exists()
    ).toBe(false);

    probe.unmount();
  });
});

describe("T2.5 the scope bar lives in the chrome header (G9 · AC1.1)", () => {
  it("draws exactly one, inside the header's own actions cluster", () => {
    expect(size(nodesFor("scope-bar"))).toBe(1);
    expect(nodeFor("chrome-header")!.contains(nodeFor("scope-bar")!)).toBe(
      true
    );
    expect(headerSlot("actions")!.contains(nodeFor("scope-bar")!)).toBe(true);
  });

  it("draws the identity pool and the ambient cue, so the sweep has something to sweep", () => {
    expect(nodeFor("session-switcher")).toBeDefined();
    expect(nodeFor("session-impersonation-cue")).toBeDefined();
  });

  it("draws no scope surface outside that one bar (F5 CORRECTED)", () => {
    const bar = nodeFor("scope-bar")!;

    expect(
      filter(
        scopeSurfaces(),
        element => element !== bar && !bar.contains(element)
      )
    ).toEqual([]);
  });
});
