// @vitest-environment jsdom
/**
 * @module composables/__tests__/playground-url-state.spec
 * @description The ONE query-string writer (T1.4). Four claims, in the order
 * the URL travels them:
 *   1. the writer owns `view`·`track`·`scene`·`sheet`·`tab`·`force`, and every
 *      written value is a string or an integer (`D3`/`T8`, `S11`, `AC9.1`);
 *   2. a criteria write and a surface write in the same tick BOTH survive —
 *      the one-writer law, falsified by `url-state-second-writer.must-fail.patch`;
 *   3. a surface write never reaches the router, so the page's boot counter
 *      does not move (`AC9.3`, `P1-R2`);
 *   4. `preserveQuery` carries all six through a scope-path push — design
 *      §7.3's mitigation, owned rather than assumed (T6.3 drives it in a
 *      browser).
 *
 * The router is real and in WEB history mode: a second writer only reaches the
 * query string through the app's own history, so `createMemoryHistory` would
 * make the defect invisible.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent, h, nextTick, ref } from "vue";
import { RouterView, createRouter, createWebHistory } from "vue-router";
import { internalKits } from "@upmind-automation/headless/testing";
import { each, fromPairs, map } from "lodash-es";
import type { ModulePortCriteria } from "../../../modules/scenarios/runtime/composables/useModulePort.types";
import type { PlaygroundUrlState } from "../usePlaygroundUrlState.types";
import type { Router } from "vue-router";

const { useQuerySchema, useQueryUischema } =
  await internalKits["client-email"]();

// -----------------------------------------------------------------------------

const BOOT_PATH = "/useClientEmails/";
const SCOPE_PATH = "/useClientEmails/as/client/for/client/abc123";

const SURFACE = {
  view: "table",
  track: "a-client-sees-their-email-collection",
  scene: 3,
  sheet: "scenario",
  tab: "gherkin",
  force: "empty"
} as const;

const VERIFIED_PARAM = "filter.verified.eq";
const SET_FILTER = { filters: { verified: { eq: false } } };
const CLEARED_FILTER = { filters: {} };

const search = (): URLSearchParams =>
  new URLSearchParams(window.location.search);

const settle = async (): Promise<void> => {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 50));
  await nextTick();
};

const writeSurface = (state: PlaygroundUrlState): void => {
  state.view.value = SURFACE.view;
  state.track.value = SURFACE.track;
  state.scene.value = SURFACE.scene;
  state.sheet.value = SURFACE.sheet;
  state.tab.value = SURFACE.tab;
  state.force.value = SURFACE.force;
};

type Harness = {
  state: PlaygroundUrlState;
  router: Router;
  writeCriteria: (next: Record<string, unknown>) => void;
  boots: () => number;
  navigations: () => number;
};

/**
 * The page as the app assembles it: a routed view keyed by `route.path`
 * (`P1-R2`), the criteria sync and the url writer both live inside its setup.
 *
 * The modules are re-imported per harness because the writer's bag is shared
 * process-wide — a bag surviving into the next case would answer from the
 * previous url instead of this one's.
 */
async function playground(
  options: { criteria?: boolean } = {}
): Promise<Harness> {
  vi.resetModules();
  const { usePlaygroundUrlState } = await import("../usePlaygroundUrlState");
  const { useCriteriaUrlSync } =
    await import("../../../modules/scenarios/runtime/composables/useCriteriaUrlSync");

  let state: PlaygroundUrlState | undefined;
  let boots = 0;
  let navigations = 0;
  const model = ref<Record<string, unknown>>({});

  const Page = defineComponent({
    setup() {
      boots += 1;
      state = usePlaygroundUrlState();
      if (options.criteria !== false) {
        const criteria: ModulePortCriteria = {
          schema: useQuerySchema(),
          uischema: useQueryUischema(),
          model: computed(() => model.value),
          set: vi.fn()
        };
        useCriteriaUrlSync(criteria, { enabled: true });
      }
      return () => h("div");
    }
  });

  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: Page }]
  });
  router.afterEach(() => {
    navigations += 1;
  });

  await router.push(window.location.pathname + window.location.search);
  await router.isReady();

  mount(
    defineComponent({
      setup: () => () => h(RouterView, { key: router.currentRoute.value.path })
    }),
    { global: { plugins: [router] } }
  );
  await settle();

  return {
    state: state!,
    router,
    writeCriteria: next => {
      model.value = next;
    },
    boots: () => boots,
    navigations: () => navigations
  };
}

beforeEach(() => {
  window.history.replaceState({}, "", BOOT_PATH);
});

// -----------------------------------------------------------------------------

describe("T1.4 usePlaygroundUrlState — the six slots it owns (S11 · AC9.1)", () => {
  it("writes view·track·scene·sheet·tab·force onto the query string", async () => {
    const { state } = await playground({ criteria: false });

    writeSurface(state);
    await settle();

    expect(fromPairs([...search().entries()])).toStrictEqual({
      view: SURFACE.view,
      track: SURFACE.track,
      scene: String(SURFACE.scene),
      sheet: SURFACE.sheet,
      tab: SURFACE.tab,
      force: SURFACE.force
    });
  });

  it("serialises every value as a string or an integer", async () => {
    const { state } = await playground({ criteria: false });

    writeSurface(state);
    await settle();

    each([...search().values()], value => {
      expect(typeof value).toBe("string");
      expect(value).not.toMatch(/[[\]{}]/);
    });
    expect(search().get("scene")).toBe("3");
    expect(state.scene.value).toBe(3);
    expect(
      map(
        ["view", "track", "sheet", "tab", "force"] as const,
        slot => typeof state[slot].value
      )
    ).toStrictEqual(["string", "string", "string", "string", "string"]);
  });

  it("reads no playhead at all when the url carries a non-integer scene", async () => {
    window.history.replaceState({}, "", `${BOOT_PATH}?scene=halfway`);
    const { state } = await playground({ criteria: false });

    expect(state.scene.value).toBeUndefined();
  });
});

describe("T1.4 the ONE writer — no second query-string writer (D3/T8)", () => {
  it("a criteria write and a surface write in the same tick both survive", async () => {
    const { state, writeCriteria } = await playground();

    writeCriteria(SET_FILTER);
    writeSurface(state);
    await settle();

    expect(fromPairs([...search().entries()])).toStrictEqual({
      [VERIFIED_PARAM]: "false",
      view: SURFACE.view,
      track: SURFACE.track,
      scene: String(SURFACE.scene),
      sheet: SURFACE.sheet,
      tab: SURFACE.tab,
      force: SURFACE.force
    });
  });

  it("both survive in the other order too — arm() writes force·track·scene AND resets criteria in one tick (§3.1)", async () => {
    const { state, writeCriteria } = await playground();

    writeSurface(state);
    writeCriteria(SET_FILTER);
    await settle();

    expect(fromPairs([...search().entries()])).toStrictEqual({
      [VERIFIED_PARAM]: "false",
      view: SURFACE.view,
      track: SURFACE.track,
      scene: String(SURFACE.scene),
      sheet: SURFACE.sheet,
      tab: SURFACE.tab,
      force: SURFACE.force
    });
  });

  it("a later criteria write does not clobber the surface state it does not own", async () => {
    const { state, writeCriteria } = await playground();

    writeCriteria(SET_FILTER);
    await settle();
    expect(search().get(VERIFIED_PARAM)).toBe("false");

    writeSurface(state);
    await settle();
    expect(search().get(VERIFIED_PARAM)).toBe("false");

    writeCriteria(CLEARED_FILTER);
    await settle();

    expect(search().get(VERIFIED_PARAM)).toBeNull();
    expect(fromPairs([...search().entries()])).toStrictEqual({
      view: SURFACE.view,
      track: SURFACE.track,
      scene: String(SURFACE.scene),
      sheet: SURFACE.sheet,
      tab: SURFACE.tab,
      force: SURFACE.force
    });
  });
});

describe("T1.4 a surface write is history, not routing (AC9.3 · P1-R2)", () => {
  it("leaves the boot counter and the router's own route untouched", async () => {
    const { state, boots, navigations, router } = await playground();
    const bootedAt = boots();
    const navigatedAt = navigations();
    const fullPathAt = router.currentRoute.value.fullPath;

    writeSurface(state);
    await settle();

    expect(search().get("view")).toBe(SURFACE.view);
    expect(boots()).toBe(bootedAt);
    expect(navigations()).toBe(navigatedAt);
    expect(router.currentRoute.value.fullPath).toBe(fullPathAt);
  });
});

describe("T1.4 preserve-on-navigate — design §7.3's mitigation is owned", () => {
  it("preserveQuery hands a scope path the whole surface query", async () => {
    const { state } = await playground({ criteria: false });

    writeSurface(state);
    await settle();

    const preserved = state.preserveQuery(SCOPE_PATH);

    expect(preserved.startsWith(`${SCOPE_PATH}?`)).toBe(true);
    expect(
      fromPairs([...new URLSearchParams(preserved.split("?")[1]).entries()])
    ).toStrictEqual({
      view: SURFACE.view,
      track: SURFACE.track,
      scene: String(SURFACE.scene),
      sheet: SURFACE.sheet,
      tab: SURFACE.tab,
      force: SURFACE.force
    });
  });

  it("carries all six through a scope-path push, and the page remounts (P1-R2)", async () => {
    const { state, router, boots } = await playground({ criteria: false });

    writeSurface(state);
    await settle();
    const bootedAt = boots();

    await router.push(state.preserveQuery(SCOPE_PATH));
    await settle();

    expect(window.location.pathname).toBe(SCOPE_PATH);
    expect(boots()).toBeGreaterThan(bootedAt);
    expect(fromPairs([...search().entries()])).toStrictEqual({
      view: SURFACE.view,
      track: SURFACE.track,
      scene: String(SURFACE.scene),
      sheet: SURFACE.sheet,
      tab: SURFACE.tab,
      force: SURFACE.force
    });
  });
});
